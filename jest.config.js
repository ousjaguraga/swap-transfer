module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^@aws-amplify/api$': '<rootDir>/__mocks__/aws-amplify-api.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@aws-amplify)/)',
  ],
  collectCoverageFrom: [
    'farm.js',
    'src/utils/**/*.js',
  ],
};
