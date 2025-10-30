// Test setup file

import { beforeAll, afterAll } from 'vitest';

beforeAll(() => {
  // Setup before all tests
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterAll(() => {
  // Cleanup after all tests
});
