const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@react-navigation', 'amazon-cognito-identity-js']
      }
    },
    argv
  );

  // Add crypto polyfill
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify'),
  };

  return config;
};
