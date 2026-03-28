import { describe, expect, it } from 'vitest';

import { BUILT_IN_NAMES, isBuiltInOrNoise as builtinsIsBuiltInOrNoise } from '../../src/core/ingestion/builtins.js';
import { isBuiltInOrNoise as utilsIsBuiltInOrNoise } from '../../src/core/ingestion/utils.js';

describe('ingestion builtins module', () => {
  it('exports the built-in name set', () => {
    expect(BUILT_IN_NAMES.has('console')).toBe(true);
    expect(BUILT_IN_NAMES.has('json_encode')).toBe(true);
    expect(BUILT_IN_NAMES.has('println')).toBe(true);
  });

  it('matches the legacy utils export behavior', () => {
    const names = ['console', 'json_encode', 'myCustomFunction'];

    for (const name of names) {
      expect(builtinsIsBuiltInOrNoise(name)).toBe(utilsIsBuiltInOrNoise(name));
    }
  });
});
