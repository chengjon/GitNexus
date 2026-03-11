import os from 'os';
import path from 'path';
import { dirExists, getDefaultMcpEntry } from './shared.js';
import type { HostAdapter, HostConfigureResult } from './types.js';

const CODEX_MCP_COMMAND = 'codex mcp add gitnexus -- npx -y gitnexus@latest mcp';

export function createCodexAdapter(options?: { homeDir?: string }): HostAdapter {
  const homeDir = options?.homeDir ?? os.homedir();
  const codexDir = path.join(homeDir, '.codex');

  const detect = async () => {
    const detected = await dirExists(codexDir);
    return detected
      ? { detected: true }
      : { detected: false, reason: 'not installed' };
  };

  const manualInstructions = () => [
    'Codex detected. Run this command to add GitNexus MCP:',
    `  ${CODEX_MCP_COMMAND}`,
  ];

  const configure = async (): Promise<HostConfigureResult> => {
    const detection = await detect();
    if (!detection.detected) {
      return {
        status: 'skipped',
        message: `Codex (${detection.reason ?? 'not installed'})`,
      };
    }

    return {
      status: 'manual',
      message: 'Codex',
      manualSteps: manualInstructions(),
    };
  };

  return {
    id: 'codex',
    displayName: 'Codex',
    detect,
    getMcpEntry: getDefaultMcpEntry,
    configure,
    manualInstructions,
  };
}
