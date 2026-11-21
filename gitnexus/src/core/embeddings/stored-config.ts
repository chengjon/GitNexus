import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getGlobalDir } from '../../storage/global-dir.js';
import type { CLIConfig } from '../../storage/repo-manager.js';

export type StoredEmbeddingConfig = NonNullable<CLIConfig['embeddings']>;

/**
 * Load the `embeddings` block from the global config (`$GITNEXUS_HOME/config.json`,
 * defaulting to `~/.gitnexus/config.json`). Missing or malformed config yields `{}`.
 *
 * Kept in a leaf module (only `node:fs`/`node:path` + `global-dir`) so that test
 * files importing schema DDL do not transitively pull in process-spawning or
 * dynamic-import storage/platform modules.
 */
export const loadStoredEmbeddingConfig = (): StoredEmbeddingConfig => {
  try {
    const raw = readFileSync(join(getGlobalDir(), 'config.json'), 'utf-8');
    const config = JSON.parse(raw) as CLIConfig;
    return config.embeddings ?? {};
  } catch {
    return {};
  }
};
