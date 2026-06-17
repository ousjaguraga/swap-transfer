import { defineAuth } from '@aws-amplify/backend';

/**
 * Swap Transfer authentication (Amplify Gen 2).
 *
 * Ported from the Gen 1 Cognito config:
 *   - email as the username / login attribute
 *   - groups: Admin, Agent, Gagent, Dash
 *   - optional MFA (TOTP)
 *   - password policy: min 8, upper + lower + number + symbol
 *
 * Note: the Gen 1 pool was an *imported* pool. This is a fresh pool for the
 * new product (Swap Transfer) — existing users are NOT carried over.
 *
 * Note: Gen 1 also offered SMS MFA. SMS requires a phone_number attribute and
 * SNS setup; it is intentionally omitted here since the app only collects
 * email. Add `sms: true` + a phone attribute later if SMS MFA is needed.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['Admin', 'Agent', 'Gagent', 'Dash'],
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
  },
});
