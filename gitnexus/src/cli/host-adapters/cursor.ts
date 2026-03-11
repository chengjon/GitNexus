import os from 'os';
import path from 'path';
import { createGenericStdioAdapter } from './generic-stdio.js';

export function createCursorAdapter(options?: { homeDir?: string }) {
  const homeDir = options?.homeDir ?? os.homedir();

  return createGenericStdioAdapter({
    id: 'cursor',
    displayName: 'Cursor',
    detectPath: path.join(homeDir, '.cursor'),
    configPath: path.join(homeDir, '.cursor', 'mcp.json'),
    serverContainerPath: ['mcpServers'],
    manualSteps: [
      'Edit ~/.cursor/mcp.json and add the gitnexus MCP server entry if automatic setup fails.',
    ],
  });
}
