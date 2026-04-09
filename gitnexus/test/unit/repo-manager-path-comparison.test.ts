import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { createTempDir } from '../helpers/test-db.js';

const { samePlatformPathMock } = vi.hoisted(() => ({
  samePlatformPathMock: vi.fn((left: string, right: string) => left.toLowerCase() === right.toLowerCase()),
}));

vi.mock('../../src/lib/path-comparison.js', () => ({
  samePlatformPath: samePlatformPathMock,
}));

import { readRegistry, unregisterRepo } from '../../src/storage/repo-manager.js';

describe('unregisterRepo', () => {
  let tmpHandle: Awaited<ReturnType<typeof createTempDir>>;
  let originalHomedir: typeof os.homedir;

  beforeEach(async () => {
    tmpHandle = await createTempDir('gitnexus-repo-manager-path-');
    originalHomedir = os.homedir;
    (os.homedir as any) = () => tmpHandle.dbPath;
    samePlatformPathMock.mockClear();

    const registryDir = path.join(tmpHandle.dbPath, '.gitnexus');
    await fs.mkdir(registryDir, { recursive: true });
    await fs.writeFile(
      path.join(registryDir, 'registry.json'),
      JSON.stringify([
        {
          name: 'RepoA',
          path: '/tmp/repo-a',
          storagePath: '/tmp/.gitnexus/repo-a',
          indexedAt: '2026-04-09T00:00:00.000Z',
          lastCommit: 'abc1234',
        },
      ], null, 2),
      'utf-8',
    );
  });

  afterEach(async () => {
    os.homedir = originalHomedir;
    await tmpHandle.cleanup();
  });

  it('uses shared platform-aware path comparison when removing registry entries', async () => {
    await unregisterRepo('/TMP/REPO-A');

    expect(samePlatformPathMock).toHaveBeenCalledTimes(1);
    expect(samePlatformPathMock).toHaveBeenCalledWith('/tmp/repo-a', expect.any(String));
    await expect(readRegistry()).resolves.toEqual([]);
  });
});
