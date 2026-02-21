/**
 * Jest Setup File
 * Global test setup and configuration
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.FINNHUB_API_KEY = 'test-finnhub-api-key';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise during tests (optional)
// Uncomment if you want cleaner test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Mock fetch for frontend tests
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ([]),
      text: async () => '',
    })
  );
}

// Mock localStorage for frontend tests
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
}

// Mock window.open for frontend tests
if (typeof global.window !== 'undefined' && !global.window.open) {
  global.window.open = jest.fn();
}

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
