import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createClaudeCodeAdapter } from '../../src/cli/host-adapters/claude-code.js';
import { createCodexAdapter } from '../../src/cli/host-adapters/codex.js';
import { createCursorAdapter } from '../../src/cli/host-adapters/cursor.js';
import { createGenericStdioAdapter } from '../../src/cli/host-adapters/generic-stdio.js';

const tempDirs: string[] = [];

async function createTempHome(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
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
    expect(adapter.getMcpEntry().command).toBe('npx');
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
    expect(adapter.getMcpEntry().command).toBe('npx');
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
    expect(adapter.getMcpEntry().command).toBe('npx');
    expect(config.mcp.gitnexus.command).toBe('npx');
    expect(config.mcp.gitnexus.args).toEqual(['-y', 'gitnexus@latest', 'mcp']);
  });
});
