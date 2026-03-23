import { describe, it, expect } from 'vitest';
import { createNativeRuntimeFixture } from '../../test/helpers/native-runtime-fixture.js';

describe('createNativeRuntimeFixture', () => {
  it('runs cleanup callbacks in reverse order', async () => {
    const fixture = createNativeRuntimeFixture();
    const calls: string[] = [];

    fixture.addCleanup(async () => { calls.push('first'); });
    fixture.addCleanup(async () => { calls.push('second'); });

    await fixture.cleanup();

    expect(calls).toEqual(['second', 'first']);
  });

  it('continues best-effort cleanup when one callback throws', async () => {
    const fixture = createNativeRuntimeFixture();
    const calls: string[] = [];

    fixture.addCleanup(async () => { calls.push('after-error'); });
    fixture.addCleanup(async () => {
      calls.push('boom');
      throw new Error('cleanup failed');
    });

    await expect(fixture.cleanup()).resolves.toBeUndefined();
    expect(calls).toEqual(['boom', 'after-error']);
  });
});
