import os from 'os';
import path from 'path';
import { dirExists, getDefaultMcpEntry } from './shared.js';
import type { HostAdapter, HostConfigureResult } from './types.js';

const CLAUDE_MCP_COMMAND = 'claude mcp add gitnexus -- npx -y gitnexus@latest mcp';

export function createClaudeCodeAdapter(options?: { homeDir?: string }): HostAdapter {
  const homeDir = options?.homeDir ?? os.homedir();
  const claudeDir = path.join(homeDir, '.claude');

  const detect = async () => {
    const detected = await dirExists(claudeDir);
    return detected
      ? { detected: true }
      : { detected: false, reason: 'not installed' };
  };

  const manualInstructions = () => [
    'Claude Code detected. Run this command to add GitNexus MCP:',
    `  ${CLAUDE_MCP_COMMAND}`,
  ];

  const configure = async (): Promise<HostConfigureResult> => {
    const detection = await detect();
    if (!detection.detected) {
      return {
        status: 'skipped',
        message: `Claude Code (${detection.reason ?? 'not installed'})`,
      };
    }

    return {
      status: 'manual',
      message: 'Claude Code',
      manualSteps: manualInstructions(),
    };
  };

  return {
    id: 'claude-code',
    displayName: 'Claude Code',
    detect,
    getMcpEntry: getDefaultMcpEntry,
    configure,
    manualInstructions,
  };
}
