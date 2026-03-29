import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createClaudeCodeAdapter } from '../../src/cli/host-adapters/claude-code.js';
import { createCodexAdapter } from '../../src/cli/host-adapters/codex.js';
import { createCursorAdapter } from '../../src/cli/host-adapters/cursor.js';
import { createGenericStdioAdapter } from '../../src/cli/host-adapters/generic-stdio.js';
import { setupCommand } from '../../src/cli/setup.js';

const tempDirs: string[] = [];
const expectedDefaultCommand = process.platform === 'win32' ? 'cmd' : 'npx';
const expectedDefaultArgs = process.platform === 'win32'
  ? ['/c', 'npx', '-y', 'gitnexus@latest', 'mcp']
  : ['-y', 'gitnexus@latest', 'mcp'];

async function createTempHome(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe('host adapters', () => {
  it('Claude Code adapter returns manual MCP instructions', async () => {
    const homeDir = await createTempHome('gitnexus-claude-host-');
    await fs.mkdir(path.join(homeDir, '.claude'), { recursive: true });

    const adapter = createClaudeCodeAdapter({ homeDir });
    const detection = await adapter.detect();
    const result = await adapter.configure();

    expect(adapter.id).toBe('claude-code');
    expect(detection.detected).toBe(true);
    expect(result.status).toBe('manual');
    expect(adapter.getMcpEntry().command).toBe(expectedDefaultCommand);
    expect(adapter.getMcpEntry().args).toEqual(expectedDefaultArgs);
    expect(adapter.manualInstructions().join('\n')).toContain('claude mcp add gitnexus');
  });

  it('Codex adapter returns codex mcp add command', async () => {
    const homeDir = await createTempHome('gitnexus-codex-host-');
    await fs.mkdir(path.join(homeDir, '.codex'), { recursive: true });

    const adapter = createCodexAdapter({ homeDir });
    const detection = await adapter.detect();
    const result = await adapter.configure();

    expect(adapter.id).toBe('codex');
    expect(detection.detected).toBe(true);
    expect(result.status).toBe('manual');
    expect(adapter.getMcpEntry().command).toBe(expectedDefaultCommand);
    expect(adapter.getMcpEntry().args).toEqual(expectedDefaultArgs);
    expect(adapter.manualInstructions().join('\n')).toContain(
      'codex mcp add gitnexus -- npx -y gitnexus@latest mcp',
    );
  });

  it('Cursor adapter writes mcp.json config', async () => {
    const homeDir = await createTempHome('gitnexus-cursor-host-');
    const cursorDir = path.join(homeDir, '.cursor');
    await fs.mkdir(cursorDir, { recursive: true });

    const adapter = createCursorAdapter({ homeDir });
    const result = await adapter.configure();
    const configPath = path.join(cursorDir, 'mcp.json');
    const raw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);

    expect(result.status).toBe('configured');
    expect(config.mcpServers.gitnexus.command).toBe(adapter.getMcpEntry().command);
    expect(config.mcpServers.gitnexus.args).toEqual(adapter.getMcpEntry().args);
  });

  it('Cursor adapter merge preserves existing mcpServers and top-level fields', async () => {
    const homeDir = await createTempHome('gitnexus-cursor-merge-');
    const cursorDir = path.join(homeDir, '.cursor');
    const configPath = path.join(cursorDir, 'mcp.json');
    await fs.mkdir(cursorDir, { recursive: true });
    await fs.writeFile(
      configPath,
      JSON.stringify({
        theme: 'light',
        mcpServers: {
          existing: { command: 'node', args: ['existing.js'] },
        },
      }),
      'utf-8',
    );

    const adapter = createCursorAdapter({ homeDir });
    await adapter.configure();

    const raw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);

    expect(config.theme).toBe('light');
    expect(config.mcpServers.existing).toEqual({ command: 'node', args: ['existing.js'] });
    expect(config.mcpServers.gitnexus.command).toBe(adapter.getMcpEntry().command);
  });

  it('generic stdio adapter writes command and args to configured container', async () => {
    const homeDir = await createTempHome('gitnexus-generic-host-');
    const configPath = path.join(homeDir, '.config', 'example', 'config.json');

    const adapter = createGenericStdioAdapter({
      id: 'example',
      displayName: 'Example Host',
      detectPath: path.join(homeDir, '.config', 'example'),
      configPath,
      serverContainerPath: ['mcp'],
    });

    await fs.mkdir(path.dirname(configPath), { recursive: true });
    const result = await adapter.configure();
    const raw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);

    expect(result.status).toBe('configured');
    expect(adapter.id).toBe('example');
    expect(adapter.getMcpEntry().command).toBe(expectedDefaultCommand);
    expect(adapter.getMcpEntry().args).toEqual(expectedDefaultArgs);
    expect(config.mcp.gitnexus.command).toBe(expectedDefaultCommand);
    expect(config.mcp.gitnexus.args).toEqual(expectedDefaultArgs);
  });

  it('generic stdio adapter merge preserves existing mcp entries and top-level fields', async () => {
    const homeDir = await createTempHome('gitnexus-generic-merge-');
    const configPath = path.join(homeDir, '.config', 'example', 'config.json');
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(
      configPath,
      JSON.stringify({
        telemetry: true,
        mcp: {
          existing: { command: 'node', args: ['existing.js'] },
        },
      }),
      'utf-8',
    );

    const adapter = createGenericStdioAdapter({
      id: 'example',
      displayName: 'Example Host',
      detectPath: path.join(homeDir, '.config', 'example'),
      configPath,
      serverContainerPath: ['mcp'],
    });

    await adapter.configure();

    const raw = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(raw);

    expect(config.telemetry).toBe(true);
    expect(config.mcp.existing).toEqual({ command: 'node', args: ['existing.js'] });
    expect(config.mcp.gitnexus.command).toBe(adapter.getMcpEntry().command);
  });
});

describe('setupCommand orchestration', () => {
  it('prints configured, manual, and skipped sections and includes Codex in manual results', async () => {
    const homeDir = await createTempHome('gitnexus-setup-command-');
    await fs.mkdir(path.join(homeDir, '.cursor'), { recursive: true });
    await fs.mkdir(path.join(homeDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(homeDir, '.codex'), { recursive: true });

    vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.join(' '));
    });

    await setupCommand();

    const output = logs.join('\n');
    expect(output).toContain('Configured:');
    expect(output).toContain('Manual steps required:');
    expect(output).toContain('Skipped:');
    expect(output).toContain('Cursor');
    expect(output).toContain('Claude Code');
    expect(output).toContain('Codex');
    expect(output).toContain('OpenCode (not installed)');
    expect(output).toContain('codex mcp add gitnexus -- npx -y gitnexus@latest mcp');
  });

  it('installs distributed skills from the shared source templates', async () => {
    const homeDir = await createTempHome('gitnexus-setup-skills-');
    await fs.mkdir(path.join(homeDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(homeDir, '.cursor'), { recursive: true });
    await fs.mkdir(path.join(homeDir, '.config', 'opencode'), { recursive: true });

    vi.spyOn(os, 'homedir').mockReturnValue(homeDir);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await setupCommand();

    const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');
    const impactSource = await fs.readFile(
      path.join(repoRoot, 'gitnexus', 'skills', 'gitnexus-impact-analysis.md'),
      'utf-8',
    );
    const refactoringSource = await fs.readFile(
      path.join(repoRoot, 'gitnexus', 'skills', 'gitnexus-refactoring.md'),
      'utf-8',
    );

    const installedTargets = [
      path.join(homeDir, '.claude', 'skills', 'gitnexus-impact-analysis', 'SKILL.md'),
      path.join(homeDir, '.cursor', 'skills', 'gitnexus-impact-analysis', 'SKILL.md'),
      path.join(homeDir, '.config', 'opencode', 'skill', 'gitnexus-impact-analysis', 'SKILL.md'),
    ];

    for (const target of installedTargets) {
      await expect(fs.readFile(target, 'utf-8')).resolves.toBe(impactSource);
    }

    const refactoringTargets = [
      path.join(homeDir, '.claude', 'skills', 'gitnexus-refactoring', 'SKILL.md'),
      path.join(homeDir, '.cursor', 'skills', 'gitnexus-refactoring', 'SKILL.md'),
      path.join(homeDir, '.config', 'opencode', 'skill', 'gitnexus-refactoring', 'SKILL.md'),
    ];

    for (const target of refactoringTargets) {
      await expect(fs.readFile(target, 'utf-8')).resolves.toBe(refactoringSource);
    }
  });
});
