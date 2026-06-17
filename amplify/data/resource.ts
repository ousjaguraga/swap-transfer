import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Swap Transfer data model (Amplify Gen 2).
 *
 * Ported from the Gen 1 `schema.graphql` (@model / @auth / @hasMany / @index).
 *
 * Mapping notes:
 *  - Gen 1 `@index(name: ...)` secondary indexes are preserved via
 *    `.secondaryIndexes(...)`. Indexes that backed a `@hasMany` are created
 *    automatically by Gen 2 from the relationship reference field.
 *  - `createdAt` / `updatedAt` are reserved system fields in Gen 2 and are
 *    added automatically, so the explicit Gen 1 declarations are dropped.
 *  - Owner rules use `.identityClaim('sub')` to match the Gen 1 `identityClaim: "sub"`.
 *  - The Gen 1 custom `Mutation.createTransfer` VTL resolver only computed
 *    `payoutAmountGMD = amount * rateApplied`. That derived value is now
 *    computed at the call site in the client before `Transfer.create(...)`.
 */
const schema = a.schema({
  // ----- Enums -----
  CollectionMethod: a.enum(['CASH', 'WAVE', 'AFRIMONEY', 'CREDIT']),
  TransferStatus: a.enum(['SENT', 'PENDING', 'PAID', 'CANCELLED']),
  AgentType: a.enum(['AGENT', 'GAGENT']),
  CashFlowType: a.enum(['TOP_UP', 'DELIVERY', 'ADJUSTMENT']),

  // ----- DailyRate -----
  DailyRate: a
    .model({
      effectiveDate: a.date().required(),
      rate: a.float(),
      createdBy: a.string().required(),
      fixedFee: a.string(),
      percentageFee: a.string(),
    })
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Agent').to(['read']),
      allow.group('Gagent').to(['read']),
      allow.group('Dash').to(['read']),
    ]),

  // ----- TransferReport -----
  TransferReport: a
    .model({
      creator: a.string(),
      reportType: a.string(), // "AGENT_SETTLEMENT" or "GAGENT_SETTLEMENT"
      Transfers: a.hasMany('Transfer', 'transferreportID'),
      AgentTransfers: a.hasMany('Transfer', 'agentReportID'),
      GagentTransfers: a.hasMany('Transfer', 'gagentReportID'),
    })
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Gagent').to(['read', 'create']),
      allow.group('Agent').to(['read']),
    ]),

  // ----- Transfer -----
  Transfer: a
    .model({
      from: a.string().required(),
      to: a.string().required(),
      amount: a.float().required(),
      paid_on: a.date(),
      status: a.ref('TransferStatus'),
      transferreportID: a.id(),
      collection_method: a.ref('CollectionMethod'),
      payoutAmountGMD: a.float(),
      createdBy: a.string(),
      createdById: a.id(),
      paidOutBy: a.string(),
      paidOutById: a.id(),
      rateApplied: a.float(),
      // Agent settlement (when Agent delivers cash to Admin)
      agentSettled: a.boolean(),
      agentSettled_on: a.datetime(),
      agentReportID: a.id(),
      // G-Agent settlement (when Admin tops up G-Agent)
      gagentSettled: a.boolean(),
      gagentSettled_on: a.datetime(),
      gagentReportID: a.id(),
      transferReport: a.belongsTo('TransferReport', 'transferreportID'),
      agentReport: a.belongsTo('TransferReport', 'agentReportID'),
      gagentReport: a.belongsTo('TransferReport', 'gagentReportID'),
    })
    .secondaryIndexes((index) => [
      index('createdById'),
      index('paidOutById'),
    ])
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Gagent').to(['read', 'update']),
      allow.group('Agent').to(['create']),
      allow.group('Dash').to(['read']),
      allow.ownerDefinedIn('createdById').identityClaim('sub').to(['read']),
    ]),

  // ----- Receiver -----
  Receiver: a
    .model({
      name: a.string().required(),
      surname: a.string(),
      number: a.string(),
      senderID: a.id().required(),
      ownerSub: a.id(),
      sender: a.belongsTo('Sender', 'senderID'),
    })
    .secondaryIndexes((index) => [index('ownerSub')])
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Gagent').to(['read']),
      allow.group('Agent').to(['read', 'create']),
      allow.ownerDefinedIn('ownerSub').identityClaim('sub').to(['read', 'update', 'delete']),
    ]),

  // ----- Sender -----
  Sender: a
    .model({
      name: a.string(),
      surname: a.string(),
      number: a.string(),
      ownerSub: a.id(),
      Receivers: a.hasMany('Receiver', 'senderID'),
    })
    .secondaryIndexes((index) => [index('ownerSub')])
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Gagent').to(['read']),
      allow.group('Agent').to(['read', 'create']),
      allow.ownerDefinedIn('ownerSub').identityClaim('sub').to(['read', 'update', 'delete']),
    ]),

  // ===== Cash Flow Management =====

  // ----- Agent -----
  Agent: a
    .model({
      email: a.string().required(),
      cognitoSub: a.id(),
      name: a.string().required(),
      agentType: a.ref('AgentType').required(),
      phone: a.string(),
      location: a.string(),
      isActive: a.boolean().required(),
      notes: a.string(),
    })
    .secondaryIndexes((index) => [index('email'), index('cognitoSub')])
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Agent').to(['read', 'create', 'update']),
      allow.group('Gagent').to(['read', 'create', 'update']),
      allow.group('Dash').to(['read']),
    ]),

  // ----- AgentBalance -----
  AgentBalance: a
    .model({
      agentId: a.string().required(),
      agentName: a.string().required(),
      agentEmail: a.string(),
      agentType: a.ref('AgentType').required(),
      openingBalance: a.float().required(),
      currentBalance: a.float().required(),
      currency: a.string().required(),
      lastUpdated: a.datetime(),
      periodStartDate: a.datetime(),
      transactions: a.hasMany('CashFlowTransaction', 'agentBalanceId'),
    })
    .secondaryIndexes((index) => [index('agentId'), index('agentEmail')])
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Agent').to(['read']),
      allow.group('Gagent').to(['read']),
      allow.group('Dash').to(['read']),
    ]),

  // ----- CashFlowTransaction -----
  CashFlowTransaction: a
    .model({
      agentBalanceId: a.id().required(),
      agentId: a.string().required(),
      agentName: a.string().required(),
      transactionType: a.ref('CashFlowType').required(),
      amount: a.float().required(),
      balanceAfter: a.float(),
      currency: a.string().required(),
      description: a.string(),
      transferId: a.string(),
      createdBy: a.string().required(),
      agentBalance: a.belongsTo('AgentBalance', 'agentBalanceId'),
    })
    .secondaryIndexes((index) => [index('agentId')])
    .authorization((allow) => [
      allow.group('Admin').to(['read', 'create', 'update', 'delete']),
      allow.group('Agent').to(['read']),
      allow.group('Gagent').to(['read']),
      allow.group('Dash').to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
