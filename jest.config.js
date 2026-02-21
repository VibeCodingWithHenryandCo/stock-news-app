/**
 * Jest Configuration
 * Testing framework configuration for the stock news application
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    'public/app.js',
    '!src/**/*.test.js',
    '!node_modules/**',
    '!coverage/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module paths
  moduleDirectories: ['node_modules', 'src'],
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset mocks between tests
  resetMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Force exit after tests
  forceExit: true,
  
  // Projects for different test environments
  projects: [
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['**/__tests__/{database,api,sentiment,integration,deepseek-sentiment}.test.js']
    },
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/frontend.test.js']
    }
  ]
};
