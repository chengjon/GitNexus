import { describe, expect, it, vi } from 'vitest';

import { applySwiftPatch } from '../../src/cli/swift-patch.js';

describe('swift patch workflow', () => {
  it('returns not-installed when tree-sitter-swift is absent', async () => {
    const result = await applySwiftPatch({
      swiftDir: '/tmp/missing/tree-sitter-swift',
    }, {
      exists: async () => false,
      readFile: async () => {
        throw new Error('should not read missing binding.gyp');
      },
      writeFile: async () => undefined,
      rebuild: async () => undefined,
      logger: { log: vi.fn(), warn: vi.fn() },
    });

    expect(result).toEqual({ status: 'not-installed' });
  });

  it('returns already-ok when actions are absent and native binding exists', async () => {
    const exists = vi.fn(async (targetPath: string) =>
      targetPath.endsWith('binding.gyp') || targetPath.endsWith('tree_sitter_swift_binding.node'),
    );

    const result = await applySwiftPatch({
      swiftDir: '/tmp/tree-sitter-swift',
    }, {
      exists,
      readFile: async () => JSON.stringify({ targets: [{}] }),
      writeFile: async () => undefined,
      rebuild: async () => {
        throw new Error('should not rebuild when binding is already present');
      },
      logger: { log: vi.fn(), warn: vi.fn() },
    });

    expect(result).toEqual({ status: 'already-ok', patched: false, rebuilt: false });
  });

  it('patches binding.gyp and rebuilds when actions are present', async () => {
    const writeFile = vi.fn(async () => undefined);
    const rebuild = vi.fn(async () => undefined);

    const result = await applySwiftPatch({
      swiftDir: '/tmp/tree-sitter-swift',
    }, {
      exists: async (targetPath: string) => targetPath.endsWith('binding.gyp') ? true : false,
      readFile: async () => JSON.stringify({
        targets: [{ actions: [{ action_name: 'generate' }] }],
      }),
      writeFile,
      rebuild,
      logger: { log: vi.fn(), warn: vi.fn() },
    });

    expect(writeFile).toHaveBeenCalledTimes(1);
    expect(rebuild).toHaveBeenCalledWith('/tmp/tree-sitter-swift');
    expect(result).toEqual({ status: 'patched-and-built', patched: true, rebuilt: true });
  });

  it('downgrades rebuild failures to build-failed without throwing', async () => {
    const warn = vi.fn();

    const result = await applySwiftPatch({
      swiftDir: '/tmp/tree-sitter-swift',
    }, {
      exists: async (targetPath: string) => targetPath.endsWith('binding.gyp') ? true : false,
      readFile: async () => JSON.stringify({
        targets: [{ actions: [{ action_name: 'generate' }] }],
      }),
      writeFile: async () => undefined,
      rebuild: async () => {
        throw new Error('node-gyp failed');
      },
      logger: { log: vi.fn(), warn },
    });

    expect(result).toEqual({
      status: 'build-failed',
      patched: true,
      rebuilt: false,
      error: 'node-gyp failed',
    });
    expect(warn).toHaveBeenCalled();
  });
});
