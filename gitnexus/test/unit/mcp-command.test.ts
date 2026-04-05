import { beforeEach, describe, expect, it, vi } from 'vitest';

const initSpy = vi.fn().mockResolvedValue(true);
const listReposSpy = vi.fn().mockResolvedValue([
  { name: 'repo-a', path: '/tmp/repo-a', storagePath: '/tmp/.gitnexus/repo-a', kuzuPath: '/tmp/.gitnexus/repo-a/kuzu', indexedAt: '2026-04-04T00:00:00.000Z', lastCommit: 'abc1234' },
]);
const startMCPServerSpy = vi.fn().mockResolvedValue(undefined);
const startRepoWorkerProcessSpy = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/mcp/server.js', () => ({
  startMCPServer: startMCPServerSpy,
}));

vi.mock('../../src/mcp/router-backend.js', () => ({
  RouterBackend: class RouterBackend {
    init = initSpy;
    listRepos = listReposSpy;
    disconnect = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../src/mcp/repo-worker-manager.js', () => ({
  RepoWorkerManager: class RepoWorkerManager {
    disconnect = vi.fn().mockResolvedValue(undefined);
  },
}));

vi.mock('../../src/mcp/local/runtime/backend-runtime.js', () => ({
  BackendRuntime: class BackendRuntime {
    init = vi.fn().mockResolvedValue(true);
  },
}));

vi.mock('../../src/mcp/repo-worker.js', () => ({
  startRepoWorkerProcess: startRepoWorkerProcessSpy,
}));

describe('mcpCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts the stdio MCP server with RouterBackend by default', async () => {
    const { mcpCommand } = await import('../../src/cli/mcp.js');

    await mcpCommand();

    expect(startRepoWorkerProcessSpy).not.toHaveBeenCalled();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(listReposSpy).toHaveBeenCalledTimes(1);
    expect(startMCPServerSpy).toHaveBeenCalledTimes(1);
  });

  it('starts hidden repo worker mode when requested', async () => {
    const { mcpCommand } = await import('../../src/cli/mcp.js');

    await mcpCommand({ repoWorker: true });

    expect(startRepoWorkerProcessSpy).toHaveBeenCalledTimes(1);
    expect(startMCPServerSpy).not.toHaveBeenCalled();
  });
});
