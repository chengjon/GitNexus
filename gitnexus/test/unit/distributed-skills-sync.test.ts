import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

const repoRoot = path.resolve(import.meta.dirname, '..', '..', '..');

async function read(relativePath: string): Promise<string> {
  return fs.readFile(path.join(repoRoot, relativePath), 'utf-8');
}

describe('distributed GitNexus skills stay synced with source templates', () => {
  const distributedTargets = [
    'gitnexus-claude-plugin/skills',
    'gitnexus-cursor-integration/skills',
  ] as const;

  for (const skillName of ['gitnexus-impact-analysis', 'gitnexus-refactoring'] as const) {
    it(`${skillName} matches source template across distributed copies`, async () => {
      const source = await read(`gitnexus/skills/${skillName}.md`);

      for (const targetRoot of distributedTargets) {
        const distributed = await read(`${targetRoot}/${skillName}/SKILL.md`);
        expect(distributed).toBe(source);
      }
    });
  }
});
