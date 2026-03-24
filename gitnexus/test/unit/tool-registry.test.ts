import { describe, expect, it, vi } from 'vitest';
import { createToolRegistry } from '../../src/mcp/local/tools/tool-registry.js';

describe('createToolRegistry', () => {
  it('dispatches handlers by tool name', async () => {
    const queryHandler = vi.fn().mockResolvedValue({ ok: true });
    const registry = createToolRegistry({
      query: queryHandler,
      context: vi.fn(),
    });

    await registry.dispatch('query', {} as any, { query: 'auth' });
    expect(queryHandler).toHaveBeenCalledWith({} as any, { query: 'auth' });
  });

  it('resolves aliases to the same handler', async () => {
    const queryHandler = vi.fn().mockResolvedValue({ ok: true });
    const contextHandler = vi.fn().mockResolvedValue({ ok: true });
    const registry = createToolRegistry({
      query: queryHandler,
      context: contextHandler,
    });

    await registry.dispatch('search', {} as any, {} as any);
    await registry.dispatch('explore', {} as any, {} as any);

    expect(queryHandler).toHaveBeenCalledTimes(1);
    expect(contextHandler).toHaveBeenCalledTimes(1);
  });

  it('throws a stable unknown-tool error', async () => {
    const registry = createToolRegistry({
      query: vi.fn(),
      context: vi.fn(),
    });

    await expect(registry.dispatch('missing', {} as any, {} as any))
      .rejects.toThrow('Unknown tool: missing');
  });
});
