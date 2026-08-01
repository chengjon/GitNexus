import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  embeddingsConfigClearCommand,
  embeddingsConfigSetCommand,
  embeddingsConfigShowCommand,
} from '../../src/cli/config.js';
import { getHttpDimensions } from '../../src/core/embeddings/http-client.js';

const originalEnv = { ...process.env };

describe('config embeddings commands', () => {
  let tmpHome: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-config-cli-'));
    process.env = { ...originalEnv, HOME: tmpHome, GITNEXUS_HOME: path.join(tmpHome, '.gitnexus') };
    // Keep the HTTP-mode probes deterministic: readConfig prefers these env
    // vars over stored config, so an ambient value would mask what the set
    // command actually persisted.
    delete process.env.GITNEXUS_EMBEDDING_URL;
    delete process.env.GITNEXUS_EMBEDDING_MODEL;
    delete process.env.GITNEXUS_EMBEDDING_DIMS;
    delete process.env.GITNEXUS_EMBEDDING_PROVIDER;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    process.env = { ...originalEnv };
    await fs.rm(tmpHome, { recursive: true, force: true });
  });

  it('set command writes embeddings config and activates HTTP mode for ollama', async () => {
    await embeddingsConfigSetCommand({
      provider: 'ollama',
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen3-embedding:0.6b',
      embeddingDims: '1024',
      nodeLimit: '90000',
      batchSize: '8',
    });

    const raw = await fs.readFile(path.join(tmpHome, '.gitnexus', 'config.json'), 'utf-8');
    expect(JSON.parse(raw)).toMatchObject({
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
        embeddingDims: 1024,
        nodeLimit: 90000,
        batchSize: 8,
      },
    });
    // isHttpMode() is an env-presence probe (GITNEXUS_EMBEDDING_URL +
    // GITNEXUS_EMBEDDING_MODEL, #2385) that never consults stored config, so it
    // is not the right probe for the stored-ollama activation this command
    // performs. readConfig still honours the stored ollama provider
    // (ollamaBaseUrl/ollamaModel → derived /v1 endpoint), which is observable
    // through getHttpDimensions — the readConfig-backed probe.
    expect(getHttpDimensions()).toBe(1024);
  });

  it('clear command removes only embeddings config', async () => {
    await fs.mkdir(path.join(tmpHome, '.gitnexus'), { recursive: true });
    await fs.writeFile(
      path.join(tmpHome, '.gitnexus', 'config.json'),
      JSON.stringify({
        apiKey: 'keep-me',
        embeddings: {
          provider: 'ollama',
          batchSize: 8,
        },
      }),
      'utf-8',
    );

    await embeddingsConfigClearCommand();

    const raw = await fs.readFile(path.join(tmpHome, '.gitnexus', 'config.json'), 'utf-8');
    expect(JSON.parse(raw)).toEqual({ apiKey: 'keep-me' });
  });

  it('show command prints stored and effective config', async () => {
    await embeddingsConfigSetCommand({
      provider: 'ollama',
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen3-embedding:0.6b',
      embeddingDims: '1024',
      batchSize: '8',
    });
    logSpy.mockClear();

    await embeddingsConfigShowCommand();

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Stored embeddings config');
    expect(output).toContain('Effective embeddings config');
    expect(output).toContain('ollama');
    expect(output).toContain('qwen3-embedding:0.6b');
    expect(output).toContain('"embeddingDims": 1024');
  });

  it('set command rejects unsupported provider values', async () => {
    await expect(
      embeddingsConfigSetCommand({
        provider: 'bad-provider',
      }),
    ).rejects.toThrow('Unsupported embedding provider');
  });
});
