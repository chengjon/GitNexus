import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.ts'],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    globals: true,
    teardownTimeout: 3000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/cli/index.ts',
        'src/server/**',
        'src/core/wiki/**',
      ],
      thresholds: {
        statements: 26,
        branches: 23,
        functions: 28,
        lines: 27,
        autoUpdate: true,
      },
    },
  },
});
