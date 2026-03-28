import { describe, expect, it } from 'vitest';

import { detectFrameworkFromPath } from '../../src/core/ingestion/framework-path-detection.js';

describe('framework path detection', () => {
  it('detects Next.js pages router files', () => {
    const result = detectFrameworkFromPath('pages/users.tsx');

    expect(result).not.toBeNull();
    expect(result).toEqual(expect.objectContaining({
      framework: 'nextjs-pages',
      entryPointMultiplier: 3.0,
      reason: 'nextjs-page',
    }));
  });

  it('detects Laravel route files', () => {
    const result = detectFrameworkFromPath('routes/web.php');

    expect(result).not.toBeNull();
    expect(result).toEqual(expect.objectContaining({
      framework: 'laravel',
      entryPointMultiplier: 3.0,
      reason: 'laravel-routes',
    }));
  });

  it('detects SwiftUI view folders', () => {
    const result = detectFrameworkFromPath('views/ContentView.swift');

    expect(result).not.toBeNull();
    expect(result).toEqual(expect.objectContaining({
      framework: 'swiftui',
      entryPointMultiplier: 1.8,
      reason: 'swiftui-view',
    }));
  });

  it('normalizes Windows path separators', () => {
    const result = detectFrameworkFromPath('routes\\auth.ts');

    expect(result).not.toBeNull();
    expect(result).toEqual(expect.objectContaining({
      framework: 'express',
      reason: 'routes-folder',
    }));
  });
});
