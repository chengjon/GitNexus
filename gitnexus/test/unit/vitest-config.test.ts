import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

describe('vitest configuration split', () => {
  it('unit config does not load global native Kuzu setup', async () => {
    const unitConfig = await fs.readFile(path.join(repoRoot, 'vitest.config.ts'), 'utf8');

    expect(unitConfig).not.toContain("globalSetup: ['test/global-setup.ts']");
    expect(unitConfig).not.toContain('dangerouslyIgnoreUnhandledErrors: true');
  });

  it('integration config keeps native Kuzu setup and explicit ignore policy', async () => {
    const integrationConfig = await fs.readFile(path.join(repoRoot, 'vitest.integration.config.ts'), 'utf8');

    expect(integrationConfig).toContain("globalSetup: ['test/global-setup.ts']");
    expect(integrationConfig).toContain('dangerouslyIgnoreUnhandledErrors: true');
  });
});
