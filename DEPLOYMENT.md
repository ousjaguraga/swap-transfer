# Swap Transfer - Deployment Guide

## Environment Setup

| Git Branch | Amplify Env | GraphQL Endpoint ID | Purpose |
|------------|-------------|---------------------|---------|
| `dev`      | `dev`       | `5fbn3nqaj5cgrdb3kngntqhtsm` | Development |
| `main`     | `prod`      | `ck6o2tjtsjcx3k4w2azzpd4b4a` | Production |

⚠️ **CRITICAL**: Both environments share the same Cognito User Pool, but have **separate** GraphQL backends (DynamoDB tables).

---

## Development Workflow

### 1. Daily Development (on `dev` branch)

```bash
# Ensure you're on the right branch and env
git checkout dev
amplify env checkout dev

# Make your code changes...

# If you modified schema.graphql, deploy to dev backend
amplify push --yes

# ⚠️ VERIFY the endpoint is correct (should be 5fbn3nqaj5cgrdb3kngntqhtsm)
cat src/aws-exports.js | grep graphqlEndpoint

# Commit all changes (including generated files)
git add .
git commit -m "feat: your feature description"
git push origin dev
```

### 2. Testing Changes

```bash
# Start the app locally (connects to dev backend)
npm run web
# or
expo start
```

---

## Production Deployment

### Step-by-Step Process

```bash
# 1. Ensure dev is up to date and tested
git checkout dev
git pull origin dev

# 2. Switch to main branch
git checkout main
git pull origin main

# 3. Merge dev into main
git merge dev

# 4. Switch to prod Amplify environment
amplify env checkout prod

# 5. Deploy schema changes to prod backend
amplify push --yes

# 6. ⚠️ VERIFY the endpoint is correct (should be ck6o2tjtsjcx3k4w2azzpd4b4a)
cat src/aws-exports.js | grep graphqlEndpoint

# 7. Commit any regenerated files
git add .
git commit -m "chore: amplify push to prod"

# 8. Push to remote
git push origin main
```

### Quick Reference (Copy-Paste)

```bash
git checkout main && git pull origin main
git merge dev
amplify env checkout prod
amplify push --yes
cat src/aws-exports.js | grep graphqlEndpoint  # Verify: ck6o2tjtsjcx3k4w2azzpd4b4a
git add . && git commit -m "deploy: $(date +%Y-%m-%d)" && git push origin main
```

---

## ⚠️ CRITICAL: Verify Backend After Push

After every `amplify push`, **always verify** the GraphQL endpoint:

```bash
cat src/aws-exports.js | grep graphqlEndpoint
```

| Environment | Expected Endpoint ID |
|-------------|---------------------|
| `dev`       | `5fbn3nqaj5cgrdb3kngntqhtsm` |
| `prod`      | `ck6o2tjtsjcx3k4w2azzpd4b4a` |

**If the endpoint is wrong**, your app will connect to the wrong database!

### Fix Wrong Endpoint

```bash
# Check current Amplify env
amplify env list

# Switch to correct env and regenerate config
amplify env checkout dev   # or prod
amplify push --yes

# Verify again
cat src/aws-exports.js | grep graphqlEndpoint
```

---

## Generated Files

After `amplify push`, these files are regenerated:
- `src/aws-exports.js` ← **Contains the backend endpoint!**
- `src/amplifyconfiguration.json`
- `src/graphql/schema.json`
- `src/graphql/queries.js` / `queries.ts`
- `src/graphql/mutations.js` / `mutations.ts`
- `src/graphql/subscriptions.js` / `subscriptions.ts`
- `src/models/*`

**Always commit these files** - they ensure frontend matches the backend.

---

## Checking Current Environment

```bash
# See which Amplify env you're on
amplify env list

# See which git branch you're on
git branch

# See which GraphQL endpoint is configured
cat src/aws-exports.js | grep graphqlEndpoint
```

---

## Switching Environments

```bash
# Switch to dev
amplify env checkout dev

# Switch to prod
amplify env checkout prod
```

---

## Rolling Back (Emergency)

If something goes wrong in prod:

```bash
# Revert the last commit
git revert HEAD
amplify env checkout prod
amplify push --yes
git push origin main
```

---

## Pre-Deployment Checklist

- [ ] All changes tested on `dev` branch with `dev` Amplify env
- [ ] No console errors in the app
- [ ] Key features still work (create transfer, view transfers, etc.)
- [ ] `git status` is clean on dev before merging
- [ ] Verified GraphQL endpoint matches environment

## Post-Deployment Verification

- [ ] Verified `aws-exports.js` has correct endpoint
- [ ] App loads without errors
- [ ] Can see existing data (transfers, agents, etc.)
- [ ] Can create new transfers
- [ ] Real-time updates working

---

## Troubleshooting

### App showing wrong environment's data
1. **Most likely cause**: `aws-exports.js` pointing to wrong backend
2. Check endpoint: `cat src/aws-exports.js | grep graphqlEndpoint`
3. Fix: `amplify env checkout <correct-env>` then `amplify push --yes`

### "No transfers showing"
1. Check you ran `amplify push` after schema changes
2. Verify correct GraphQL endpoint
3. Log out and log back in (refreshes auth token)
4. Check browser console for GraphQL errors

### "Permission denied" errors
1. Verify schema `@auth` rules are correct
2. Ensure user is in the correct Cognito group
3. Run `amplify push` to deploy auth changes

### Generated files have unexpected changes
This is normal if schema changed. Review the diff:
```bash
git diff src/graphql/
```
If changes match your schema updates, commit them.

### Wrong Amplify environment
```bash
amplify env list      # Check current env
amplify env checkout prod  # Switch to correct env
amplify push --yes    # Regenerate config files
```
