/**
 * Vitest globalSetup — runs once in the MAIN process before any forks.
 *
 * Creates a single shared KuzuDB with full schema so that forked test
 * files only need to clear + reseed data instead of recreating the
 * entire schema each time (~29 DDL queries per file eliminated).
 *
 * The dbPath is shared with test files via vitest's provide/inject API.
 */
import path from 'path';
import type { GlobalSetupContext } from 'vitest/node';
import { createSharedKuzuTestRuntime } from './helpers/shared-kuzu-runtime.js';

export default async function setup({ provide }: GlobalSetupContext) {
  const runtime = await createSharedKuzuTestRuntime();

  // Share the dbPath with all test files via inject('kuzuDbPath')
  provide('kuzuDbPath', runtime.dbPath);

  // Teardown: remove temp directory after all tests complete
  return async () => {
    await runtime.teardown();
  };
}
