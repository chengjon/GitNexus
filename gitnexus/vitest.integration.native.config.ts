import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['test/global-setup.ts'],
    include: [
      'test/integration/augmentation.test.ts',
      'test/integration/csv-pipeline.test.ts',
      'test/integration/kuzu-core-adapter.test.ts',
      'test/integration/kuzu-pool.test.ts',
      'test/integration/local-backend-calltool.test.ts',
      'test/integration/local-backend.test.ts',
      'test/integration/search-core.test.ts',
      'test/integration/search-pool.test.ts',
    ],
    testTimeout: 30000,
    pool: 'forks',
    fileParallelism: false,
    globals: true,
    setupFiles: ['test/setup.ts'],
    teardownTimeout: 3000,
  },
});
