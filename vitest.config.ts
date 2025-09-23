import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.spec.ts', 'test/**/*.test.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'e2e/**',
      'scripts/**',
      '**/*.config.ts',
      '**/*.d.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'server/**/*.ts',
        'client/src/**/*.ts',
        'shared/**/*.ts'
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        'e2e/**',
        'scripts/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@db': path.resolve(__dirname, './db'),
      '@shared': path.resolve(__dirname, './shared'),
      '@client': path.resolve(__dirname, './client/src')
    }
  }
});
