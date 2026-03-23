import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['test/global-setup.ts'],
    include: ['test/integration/**/*.test.ts'],
    testTimeout: 30000,
    pool: 'forks',
    // Native addons under Node 24 intermittently break forked worker IPC with EPIPE.
    // Run test files sequentially until the underlying runtime issue is resolved.
    fileParallelism: false,
    globals: true,
    setupFiles: ['test/setup.ts'],
    teardownTimeout: 3000,
    dangerouslyIgnoreUnhandledErrors: true, // KuzuDB N-API destructor segfaults on fork exit — not a test failure
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
