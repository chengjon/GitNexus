import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import os from 'node:os';
import { createTempDir } from '../helpers/test-db.js';
import { loadCLIConfig, saveCLIConfig } from '../../src/storage/repo-manager.js';
import {
  embeddingsConfigClearCommand,
  embeddingsConfigSetCommand,
  embeddingsConfigShowCommand,
} from '../../src/cli/config.js';

describe('config embeddings commands', () => {
  let tmpHandle: Awaited<ReturnType<typeof createTempDir>>;
  let originalHomedir: typeof os.homedir;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpHandle = await createTempDir('gitnexus-config-cli-');
    originalHomedir = os.homedir;
    (os.homedir as any) = () => tmpHandle.dbPath;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    os.homedir = originalHomedir;
    logSpy.mockRestore();
    await tmpHandle.cleanup();
  });

  it('set command writes embeddings config and preserves existing top-level fields', async () => {
    await saveCLIConfig({ apiKey: 'secret-key' });

    await embeddingsConfigSetCommand({
      provider: 'ollama',
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen3-embedding:0.6b',
      nodeLimit: '90000',
      batchSize: '8',
    });

    await expect(loadCLIConfig()).resolves.toEqual({
      apiKey: 'secret-key',
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
        nodeLimit: 90000,
        batchSize: 8,
      },
    });
  });

  it('clear command removes only embeddings config', async () => {
    await saveCLIConfig({
      apiKey: 'secret-key',
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
      },
    });

    await embeddingsConfigClearCommand();

    await expect(loadCLIConfig()).resolves.toEqual({
      apiKey: 'secret-key',
    });
  });

  it('show command prints stored and effective config', async () => {
    await saveCLIConfig({
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
        nodeLimit: 90000,
        batchSize: 8,
      },
    });

    await embeddingsConfigShowCommand({});

    const output = logSpy.mock.calls.map(call => call.join(' ')).join('\n');
    expect(output).toContain('Stored embeddings config');
    expect(output).toContain('Effective embeddings config');
    expect(output).toContain('qwen3-embedding:0.6b');
  });

  it('set command rejects unsupported provider values', async () => {
    await expect(embeddingsConfigSetCommand({
      provider: 'bad-provider',
    })).rejects.toThrow('Unsupported embedding provider');
  });
});
