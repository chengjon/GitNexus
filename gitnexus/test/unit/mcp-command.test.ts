import { beforeEach, describe, expect, it, vi } from 'vitest';

const initSpy = vi.fn().mockResolvedValue(true);
const listReposSpy = vi.fn().mockResolvedValue([
  { name: 'repo-a', path: '/tmp/repo-a', storagePath: '/tmp/.gitnexus/repo-a', kuzuPath: '/tmp/.gitnexus/repo-a/kuzu', indexedAt: '2026-04-04T00:00:00.000Z', lastCommit: 'abc1234' },
]);
const startMCPServerSpy = vi.fn().mockResolvedValue(undefined);
const startRepoWorkerProcessSpy = vi.fn().mockResolvedValue(undefined);
const drainGitNexusMcpRepoWorkersSpy = vi.fn().mockResolvedValue({
  requestedPids: [303],
  acknowledgedPids: [303],
  completedPids: [303],
  waitTimedOut: false,
});
const listMcpProcessRecordsSpy = vi.fn().mockResolvedValue([]);
const cleanupMcpProcessRegistrySpy = vi.fn().mockResolvedValue({
  removedStalePids: [101],
  terminatedOrphanedPids: [202],
});

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

vi.mock('../../src/cli/platform-process-scan.js', async () => {
  const actual = await vi.importActual('../../src/cli/platform-process-scan.js');
  return {
    ...actual,
    drainGitNexusMcpRepoWorkers: drainGitNexusMcpRepoWorkersSpy,
  };
});

vi.mock('../../src/runtime/mcp-process-registry.js', () => ({
  createMcpSessionId: vi.fn(() => 'session-test'),
  createMcpProcessRegistration: vi.fn(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    updateState: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
  })),
  listMcpProcessRecords: listMcpProcessRecordsSpy,
  cleanupMcpProcessRegistry: cleanupMcpProcessRegistrySpy,
  deriveMcpProcessHealth: vi.fn(() => 'healthy'),
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

  it('prints JSON process data for mcp ps', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    listMcpProcessRecordsSpy.mockResolvedValueOnce([
      {
        pid: 123,
        ppid: 1,
        role: 'router',
        sessionId: 'session-123',
        startedAt: '2026-04-05T00:00:00.000Z',
        lastHeartbeatAt: '2026-04-05T00:00:10.000Z',
        cwd: '/tmp/project',
        command: 'gitnexus mcp',
        state: 'ready',
      },
    ]);

    const { mcpPsCommand } = await import('../../src/cli/mcp.js');
    await mcpPsCommand({ json: true });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(String(logSpy.mock.calls[0][0])).toContain('"pid": 123');
    logSpy.mockRestore();
  });

  it('runs cleanup for mcp gc', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { mcpGcCommand } = await import('../../src/cli/mcp.js');

    await mcpGcCommand({ dryRun: true });

    expect(cleanupMcpProcessRegistrySpy).toHaveBeenCalledWith(expect.objectContaining({
      dryRun: true,
      force: false,
    }));
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('requests cooperative drain for mcp drain', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { mcpDrainCommand } = await import('../../src/cli/mcp.js');

    await mcpDrainCommand({ repo: 'repo-a', json: true });

    expect(drainGitNexusMcpRepoWorkersSpy).toHaveBeenCalledWith(expect.objectContaining({
      repo: 'repo-a',
    }));
    expect(String(logSpy.mock.calls[0][0])).toContain('"requestedPids"');
    logSpy.mockRestore();
  });
});
