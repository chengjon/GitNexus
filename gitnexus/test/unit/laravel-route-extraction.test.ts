import { describe, expect, it } from 'vitest';
import * as routeTypes from '../../src/core/ingestion/routes/types.js';
import type { ExtractedRoute } from '../../src/core/ingestion/routes/types.js';

describe('laravel route extraction module', () => {
  it('resolves the new route type boundary', () => {
    const routes: ExtractedRoute[] = [];
    expect(Array.isArray(routes)).toBe(true);
    expect(routeTypes).toBeTruthy();
  });
});
