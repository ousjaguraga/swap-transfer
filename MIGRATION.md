# Swap Transfer — Amplify Gen 1 → Gen 2 Migration

This project was cloned from `mango-transfer` (Amplify **Gen 1**, CLI-driven backend +
`aws-amplify` v5) and migrated to a standalone **Swap Transfer** product on Amplify
**Gen 2** (code-first TypeScript backend + `aws-amplify` v6).

## What changed

### Backend — Gen 1 (CLI) → Gen 2 (code-first)
- Removed the entire Gen 1 `amplify/backend/**` (CloudFormation, `cli.json`,
  `.config`, `backend-config.json`, `schema.graphql`, VTL resolvers).
- Added Gen 2 code-first backend:
  - `amplify/backend.ts` — `defineBackend({ auth, data })` + password policy override.
  - `amplify/auth/resource.ts` — `defineAuth`: email login, groups
    `Admin / Agent / Gagent / Dash`, optional TOTP MFA.
  - `amplify/data/resource.ts` — `defineData` with the 9 models translated from the
    Gen 1 `schema.graphql` into `a.schema(...)` (enums, group/owner auth,
    `@hasMany`→reference fields, `@index`→`secondaryIndexes`).
- **Fresh Cognito pool**: the Gen 1 pool was an *imported* pool. Gen 2 `defineAuth`
  provisions a brand-new pool, so existing `mango-transfer` users are NOT carried over.
- **Custom resolver dropped**: the Gen 1 `Mutation.createTransfer` VTL resolver only
  computed `payoutAmountGMD = amount * rateApplied`. The client (`createATransfer` in
  `farm.js`) already computes this, so no server-side resolver is needed.

### Frontend — `aws-amplify` v5 → v6
- `farm.js`: `import { API } from "aws-amplify"` → `generateClient()` from
  `aws-amplify/api`; all `API.graphql(...)` calls → `client.graphql(...)`. The
  GraphQL documents in `src/graphql/*` are unchanged and still valid.
- Auth screens migrated to v6 modular `aws-amplify/auth`:
  - `signIn` / `confirmSignIn` now return `{ isSignedIn, nextStep }`; MFA / new-password
    branches key off `nextStep.signInStep` instead of `user.challengeName`.
  - Session claims read via `fetchAuthSession()` → `tokens.idToken.payload`
    (replacing `user.signInUserSession.idToken.payload`).
  - `signUp` uses `options.userAttributes`; `resetPassword` / `confirmResetPassword`
    replace `forgotPassword` / `forgotPasswordSubmit`; `resendSignUpCode`,
    `signOut`, `getCurrentUser` updated accordingly.
- `App.js`: `Amplify.configure(awsconfig)` → `Amplify.configure(outputs)` reading
  `./amplify_outputs.json`. `USER_PASSWORD_AUTH` is now passed per-call in
  `signIn` options.
- `sanitizeInput` (farm.js) strips `createdAt` / `updatedAt` — read-only system
  fields in Gen 2 that must not appear in create/update inputs.
- Replaced the Gen 1 DataStore-generated `src/models/` (which pulled in
  `@aws-amplify/datastore`) with a lightweight plain-enum module — `farm.js`
  imports `TransferStatus` from it. Removed the old `src/amplifyconfiguration.json`.
- `package.json`: `aws-amplify` → v6, added Gen 2 toolchain (`@aws-amplify/backend`,
  `@aws-amplify/backend-cli`, `aws-cdk-lib`, `constructs`, `tsx`, `typescript`,
  `esbuild`), added `react-native-url-polyfill`, removed v5-only
  `@aws-amplify/core` and `amazon-cognito-identity-js`.

## Running it

`amplify_outputs.json` is **generated** (and git-ignored) — it does not exist until
you deploy a backend. First run will fail to resolve the import until you do one of:

```bash
npm install

# Local cloud sandbox (requires AWS credentials configured):
npm run sandbox          # npx ampx sandbox  → writes amplify_outputs.json

# then, in another terminal:
npm run web              # or: npm start / npm run ios / npm run android
```

For CI/CD on Amplify Hosting, `amplify.yml` runs `ampx pipeline-deploy` in the
backend phase (which writes `amplify_outputs.json`) before the Expo web build.

## Known follow-ups (not done)
- `__tests__/` and `__mocks__/aws-amplify-api.js` still target the v5 API mock and
  will need updating before `npm test` passes.
- SMS MFA from the Gen 1 pool was omitted (TOTP only) because the app collects only
  email; add a phone attribute + `sms: true` in `defineAuth` if SMS MFA is required.
