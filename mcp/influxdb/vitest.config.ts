import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        'scripts/',
        '*.config.ts',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@influx': path.resolve(__dirname, './src/influx'),
      '@tools': path.resolve(__dirname, './src/tools'),
      '@features': path.resolve(__dirname, './src/features'),
      '@cache': path.resolve(__dirname, './src/cache'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@schemas': path.resolve(__dirname, './src/schemas'),
    },
  },
});
