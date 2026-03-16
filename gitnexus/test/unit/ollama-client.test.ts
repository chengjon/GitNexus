import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  embedQueryWithOllama,
  embedTextsWithOllama,
} from '../../src/core/embeddings/ollama-client.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ollama client', () => {
  it('posts batched embed requests with model and dimensions', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        embeddings: [
          [0.1, 0.2],
          [0.3, 0.4],
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await embedTextsWithOllama(['alpha', 'beta'], {
      baseUrl: 'http://localhost:11434',
      model: 'qwen3-embedding',
      dimensions: 2,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:11434/api/embed',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({
      model: 'qwen3-embedding',
      input: ['alpha', 'beta'],
      dimensions: 2,
    });
    expect(Array.from(result[0])).toEqual([
      expect.closeTo(0.1, 5),
      expect.closeTo(0.2, 5),
    ]);
    expect(Array.from(result[1])).toEqual([
      expect.closeTo(0.3, 5),
      expect.closeTo(0.4, 5),
    ]);
  });

  it('embeds a single query via the batch endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        embeddings: [[0.5, 0.6, 0.7]],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await embedQueryWithOllama('portfolio turnover', {
      baseUrl: 'http://localhost:11434',
      model: 'qwen3-embedding',
      dimensions: 3,
    });

    expect(result).toEqual([
      expect.closeTo(0.5, 5),
      expect.closeTo(0.6, 5),
      expect.closeTo(0.7, 5),
    ]);
  });

  it('throws when ollama returns the wrong embedding dimension', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        embeddings: [[0.1, 0.2, 0.3]],
      }),
    }));

    await expect(embedTextsWithOllama(['alpha'], {
      baseUrl: 'http://localhost:11434',
      model: 'qwen3-embedding',
      dimensions: 2,
    })).rejects.toThrow('expected 2');
  });
});
