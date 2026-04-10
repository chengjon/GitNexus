import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const USE_SIGMA_SOURCE = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'gitnexus-web',
  'src',
  'hooks',
  'useSigma.ts',
);

const readSource = (): string => {
  return fs.readFileSync(USE_SIGMA_SOURCE, 'utf-8');
};

describe('gitnexus-web useSigma workaround boundary', () => {
  it('keeps the edge-refresh camera nudge inside setSelectedNode', () => {
    const source = readSource();

    expect(source).toContain('workaround for Sigma edge caching');
    expect(source).toMatch(
      /const setSelectedNode = useCallback\(\(nodeId: string \| null\) => \{[\s\S]*?const camera = sigma\.getCamera\(\);[\s\S]*?camera\.animate\([\s\S]*?duration: 50[\s\S]*?sigma\.refresh\(\);[\s\S]*?\}, \[\]\);/,
    );
  });

  it('keeps focusNode on the direct selection path without the camera nudge workaround', () => {
    const source = readSource();

    expect(source).toContain('without the camera nudge from setSelectedNode');
    expect(source).toMatch(
      /const focusNode = useCallback\(\(nodeId: string\) => \{[\s\S]*?setSelectedNodeState\(nodeId\);[\s\S]*?if \(!alreadySelected\) \{[\s\S]*?sigma\.getCamera\(\)\.animate\([\s\S]*?duration: 400[\s\S]*?\}[\s\S]*?sigma\.refresh\(\);[\s\S]*?\}, \[\]\);/,
    );
  });
});
