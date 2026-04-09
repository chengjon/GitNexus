import { describe, expect, it } from 'vitest';
import { createStaticCopyTargets } from '../../../gitnexus-web/scripts/vite-static-copy.mjs';

describe('gitnexus-web vite static copy targets', () => {
  it('keeps production-only runtime assets synced for kuzu and mermaid', () => {
    const targets = createStaticCopyTargets();

    expect(targets).toContainEqual({
      src: 'node_modules/kuzu-wasm/kuzu_wasm_worker.js',
      dest: 'assets',
    });

    expect(targets).toContainEqual({
      src: 'node_modules/mermaid/dist/**/*.mjs',
      dest: 'vendor/mermaid',
    });
  });
});
