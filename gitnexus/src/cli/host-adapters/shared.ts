import fs from 'fs/promises';
import path from 'path';
import type { McpEntry } from './types.js';

export function getDefaultMcpEntry(): McpEntry {
  if (process.platform === 'win32') {
    return {
      command: 'cmd',
      args: ['/c', 'npx', '-y', 'gitnexus@latest', 'mcp'],
    };
  }

  return {
    command: 'npx',
    args: ['-y', 'gitnexus@latest', 'mcp'],
  };
}

export async function readJsonFile(filePath: string): Promise<Record<string, any> | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, any>;
  } catch {
    return null;
  }
}

export async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function ensureRecord(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : {};
}

export function mergeGitNexusServer(
  existing: unknown,
  serverContainerPath: string[],
  entry: McpEntry,
): Record<string, any> {
  const root = ensureRecord(existing);
  let current = root;

  for (const segment of serverContainerPath) {
    current[segment] = ensureRecord(current[segment]);
    current = current[segment];
  }

  current.gitnexus = entry;
  return root;
}
