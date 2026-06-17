// Jest setup file
global.console = {
  ...console,
  // Suppress console.log in tests (uncomment to enable)
  // log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
