import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Swap Transfer backend (Amplify Gen 2).
 * @see https://docs.amplify.aws/react/build-a-backend/
 */
const backend = defineBackend({
  auth,
  data,
});

// Re-apply the Gen 1 password policy (min 8, upper + lower + number + symbol)
// via the underlying Cognito user pool L1 construct.
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
};
