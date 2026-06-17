
# Swap Transfer
Expo Mobile/Web App for Swap Transfer

## Dev Setup
```sh
sudo npm install --global eas-cli
npx create-expo-app
npm install
```

## Amplify Environments & Endpoints
- **Environments**: Each Amplify environment (e.g. `dev`, `prod`, feature) has its own backend and GraphQL endpoint.
- **Switching**: Use `amplify env checkout <env>` and `amplify pull --appId <id> --envName <env>` to sync your local config to the desired backend.
- **Frontend config**: The file `src/aws-exports.js` (or `src/amplifyconfiguration.json` for TS) is updated on each pull to point to the correct endpoint for the current environment.
- **No need for separate git branches**: You can use the same codebase and switch environments as needed. Use git branches for code, Amplify envs for backend isolation.

## Typical Amplify Workflow
```sh
# List environments
amplify env list

# Create a new environment
amplify env add

# Switch environments
amplify env checkout dev

# Pull latest backend for current env
amplify pull --appId <appId> --envName <env>

# Push local backend changes
amplify push
```

## Expo Web
- Run `npm run web` for browser development.
- Polyfills for `crypto`, `stream`, `vm` are required in `webpack.config.js` for browser support.
- Avoid native-only APIs (like `BackHandler`) without web guards.

## PDF Export (Web)
- PDF export uses jsPDF and opens in a new tab or downloads if popups are blocked.
- If you see issues, allow pop-ups for your dev site.

---

## Cash Flow System

### Overview
The Cash Flow system tracks money movement between **Agents** (UK-based, collect GBP) and **G-Agents** (Gambia-based, pay out GMD).

### User Roles
| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | All operations, record deliveries/top-ups, view all agents |
| **Agent** | UK collection agent | Create transfers, view own cashflow, deliver cash |
| **Gagent** | Gambia payout agent | Mark transfers as PAID, view own cashflow |

### Key Models

#### Transfer
A money transfer from sender to receiver.
```graphql
Transfer {
  id: ID!
  from: String!          # Sender name
  to: String!            # Receiver name
  amount: Int!           # GBP amount
  payoutAmountGMD: Float # GMD payout amount
  status: TransferStatus # PENDING, PAID, SENT, CANCELLED
  collection_method: CollectionMethod  # CASH, WAVE, AFRIMONEY, CREDIT
  createdBy: String      # Agent who created (for CASH transfers)
  paidOutBy: String      # G-Agent who paid out
  paid_on: AWSDate       # When marked as PAID
  
  # Agent Settlement (when Agent delivers cash to Admin)
  agentSettled: Boolean
  agentSettled_on: AWSDateTime
  agentReportID: ID      # Links to settlement report
  
  # G-Agent Settlement (when Admin tops up G-Agent)
  gagentSettled: Boolean
  gagentSettled_on: AWSDateTime
  gagentReportID: ID     # Links to settlement report
}
```

#### AgentBalance
Tracks an agent's cash flow balance with period-based accounting.
```graphql
AgentBalance {
  id: ID!
  agentId: String!       # Unique: "agent.name" or "gagent.name"
  agentName: String!
  agentType: String!     # "AGENT" or "GAGENT"
  openingBalance: Float  # Balance at period start
  currency: String!      # "GBP" for Agent, "GMD" for G-Agent
  periodStartDate: AWSDateTime  # When current period started
}
```

#### CashFlowTransaction
Manual transactions (deliveries, top-ups, adjustments).
```graphql
CashFlowTransaction {
  transactionType: String!  # TOP_UP, DELIVERY, ADJUSTMENT
  amount: Float!
  agentBalanceId: ID!
  agentName: String!
  createdBy: String!
}
```

### Agent Flow (UK - GBP Collection)

```
┌─────────────────────────────────────────────────────────────┐
│                     AGENT CASH FLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. Agent creates Transfer with CASH collection             │
│     → Transfer.createdBy = Agent name                       │
│     → Agent balance INCREASES (they owe money)              │
│                                                             │
│  2. Agent views their Cash Flow                             │
│     → Shows unsettled CASH transfers they created           │
│     → Filter: createdBy = agentName, agentSettled != true   │
│                                                             │
│  3. Admin records DELIVERY (Agent delivers cash)            │
│     → All transfers in period marked: agentSettled = true   │
│     → agentSettled_on = timestamp                           │
│     → TransferReport created, linked via agentReportID      │
│     → Period resets: new openingBalance, new periodStartDate│
│     → Agent balance DECREASES                               │
└─────────────────────────────────────────────────────────────┘

Balance Formula:
  openingBalance + totalCollections - totalDeliveries ± adjustments
```

### G-Agent Flow (Gambia - GMD Payout)

```
┌─────────────────────────────────────────────────────────────┐
│                   G-AGENT CASH FLOW                         │
├─────────────────────────────────────────────────────────────┤
│  1. G-Agent marks Transfer as PAID                          │
│     → Transfer.paidOutBy = G-Agent name                     │
│     → Transfer.paid_on = timestamp                          │
│     → G-Agent balance DECREASES (they spent money)          │
│                                                             │
│  2. G-Agent views their Cash Flow                           │
│     → Shows unsettled PAID transfers they paid out          │
│     → Filter: paidOutBy = agentName, gagentSettled != true  │
│                                                             │
│  3. Admin records TOP_UP (gives GMD to G-Agent)             │
│     → All transfers in period marked: gagentSettled = true  │
│     → gagentSettled_on = timestamp                          │
│     → TransferReport created, linked via gagentReportID     │
│     → Period resets: new openingBalance, new periodStartDate│
│     → G-Agent balance INCREASES                             │
└─────────────────────────────────────────────────────────────┘

Balance Formula:
  openingBalance + totalTopUps - totalPayouts ± adjustments
```

### Settlement System

**Key Concept**: Agent and G-Agent settlements are INDEPENDENT.

| Field | Set By | When | Effect |
|-------|--------|------|--------|
| `agentSettled` | Admin | On DELIVERY | Transfer removed from Agent's cashflow |
| `gagentSettled` | Admin | On TOP_UP | Transfer removed from G-Agent's cashflow |

A single transfer can be:
- Unsettled by both (in both cashflows)
- Agent settled only (out of Agent's cashflow, still in G-Agent's)
- G-Agent settled only (out of G-Agent's cashflow, still in Agent's)
- Both settled (out of both cashflows, fully reconciled)

### Agent-Transfer Linking (Cognito Sub)

The system uses Cognito `sub` (a UUID assigned when a user is created) as the immutable foreign key to link agents to their transfers. This allows agent names to be changed without breaking data relationships.

**Data Model:**
```
┌─────────────────┐      cognitoSub       ┌─────────────────┐
│     Cognito     │ ───────────────────── │      Agent      │
│     User        │                       │      Model      │
│                 │                       │                 │
│  sub: "abc123"  │                       │  id: "xyz789"   │
│  name: "John"   │                       │  cognitoSub:    │
│  email: "j@..." │                       │    "abc123"     │
└─────────────────┘                       │  name: "John"   │
        │                                 └────────┬────────┘
        │                                          │
        │ createdById                              │ agentId
        ▼                                          ▼
┌─────────────────┐                       ┌─────────────────┐
│    Transfer     │                       │  AgentBalance   │
│                 │                       │                 │
│  createdById:   │                       │  agentId:       │
│    "abc123"     │                       │    "xyz789"     │
│  createdBy:     │                       │  agentName:     │
│    "John"       │                       │    "John"       │
└─────────────────┘                       └─────────────────┘
```

**Key Fields:**
| Model | Field | Links To | Purpose |
|-------|-------|----------|---------|
| Agent | `cognitoSub` | Cognito User.sub | Immutable link to auth user |
| Transfer | `createdById` | Cognito User.sub | Who created the transfer |
| Transfer | `paidOutById` | Cognito User.sub | Who paid out the transfer |
| AgentBalance | `agentId` | Agent.id | Links balance to agent record |

**On Login:**
```javascript
ensureAgentRecord(email, name, agentType, cognitoSub)
// 1. Looks up Agent by cognitoSub (or email for legacy)
// 2. Creates new Agent record if not found
// 3. Updates cognitoSub if missing (migrates legacy records)
```

**Balance Calculation:**
```javascript
calculateAgentBalance(agentBalance)
// 1. Looks up Agent by agentBalance.agentId
// 2. Gets Agent.cognitoSub
// 3. Queries Transfer.createdById = cognitoSub
// 4. Falls back to Transfer.createdBy = name (for legacy)
```

**Benefits:**
- ✅ Change agent name in Cognito → transfers still link via `sub`
- ✅ Change agent name in Agent table → transfers still link via `cognitoSub`
- ✅ No data migration needed for existing transfers (fallback to name)

### Key Functions in `farm.js`

```javascript
// Calculate balances
calculateAgentBalance(agentBalance)   // For UK Agents
calculateGAgentBalance(agentBalance)  // For Gambia G-Agents

// Record transactions (Admin only)
recordDelivery(agentBalanceId, agentId, agentName, amount, description, createdBy, agentBalance)
recordTopUp(agentBalanceId, agentId, agentName, amount, description, createdBy, agentBalance)
recordAdjustment(agentBalanceId, agentId, agentName, amount, currency, description, createdBy)

// Get agent data
getAllAgentsWithBalances()  // Admin: all agents with calculated balances
getMyAgentBalance(cognitoSub)  // Agent/G-Agent: own balance only (by Cognito sub)

// Agent registration (auto on login)
ensureAgentRecord(email, name, agentType, cognitoSub)  // Creates/updates Agent record with cognitoSub
```

### UI Components

| Screen | Purpose | Access |
|--------|---------|--------|
| `CashFlowDashboard` | View all agents, record transactions | Admin |
| `CashFlowDetail` | View single agent's cashflow with transfers | Admin, own data for Agents |
| `TransferDetailedScreen` | View/update transfer status | All (with restrictions) |

### Transfer Status Permissions

| Action | Who Can Do It | Condition |
|--------|---------------|-----------|
| Mark PAID | G-Agent only | Transfer not already PAID |
| Revert to PENDING | Admin only | `gagentSettled` must be false |
| Cancel | Admin only | Transfer not PAID |

### Reports

Settlement reports are created automatically when:
- Admin records a DELIVERY → Agent settlement report
- Admin records a TOP_UP → G-Agent settlement report

Reports link to transfers via:
- `agentReportID` for Agent settlements
- `gagentReportID` for G-Agent settlements

---

## API Docs
https://docs.google.com/document/d/1qLHQG3uaJkyJSUkIwm2wwxpDSI8fEGQrfX8yqGLMzQU/edit#heading=h.hf65lx6a79jk
  