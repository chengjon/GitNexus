import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'test/integration/**/*.test.ts',
    ],
    exclude: [
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
    teardownTimeout: 3000,
  },
});
