import os from 'os';
import path from 'path';
import { dirExists, formatManualMcpAddCommand, getDefaultMcpEntry } from './shared.js';
import type { HostAdapter, HostConfigureResult } from './types.js';

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
    `  ${formatManualMcpAddCommand('claude', getDefaultMcpEntry())}`,
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
