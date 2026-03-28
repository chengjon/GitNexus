import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

describe('ingestion refactor boundary', () => {
  it('keeps builtin filtering logic in utils.ts', () => {
    expect(fs.existsSync(path.join(repoRoot, 'src', 'core', 'ingestion', 'builtins.ts'))).toBe(false);
  });

  it('keeps import resolution dispatch in import-processor.ts', () => {
    expect(
      fs.existsSync(path.join(repoRoot, 'src', 'core', 'ingestion', 'import-resolution-dispatch.ts')),
    ).toBe(false);
  });
});
