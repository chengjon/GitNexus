import {
  dirExists,
  getDefaultMcpEntry,
  mergeGitNexusServer,
  readJsonFile,
  writeJsonFile,
} from './shared.js';
import type { HostAdapter, HostConfigureResult } from './types.js';

export interface GenericStdioAdapterOptions {
  id: string;
  displayName: string;
  detectPath: string;
  configPath: string;
  serverContainerPath: string[];
  manualSteps?: string[];
}

export function createGenericStdioAdapter(options: GenericStdioAdapterOptions): HostAdapter {
  const entry = getDefaultMcpEntry();

  const detect = async () => {
    const detected = await dirExists(options.detectPath);
    return detected
      ? { detected: true }
      : { detected: false, reason: 'not installed' };
  };

  const manualInstructions = () => options.manualSteps ?? [];

  const configure = async (): Promise<HostConfigureResult> => {
    const detection = await detect();
    if (!detection.detected) {
      return {
        status: 'skipped',
        message: `${options.displayName} (${detection.reason ?? 'not installed'})`,
      };
    }

    try {
      const existing = await readJsonFile(options.configPath);
      const updated = mergeGitNexusServer(existing, options.serverContainerPath, entry);
      await writeJsonFile(options.configPath, updated);
      return {
        status: 'configured',
        message: options.displayName,
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: `${options.displayName}: ${err.message}`,
      };
    }
  };

  return {
    id: options.id,
    displayName: options.displayName,
    detect,
    getMcpEntry: () => entry,
    configure,
    manualInstructions,
  };
}
