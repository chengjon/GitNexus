import { describe, expect, it } from 'vitest';
import { shouldExplicitlyCloseNativeKuzu } from '../../test/helpers/native-teardown-policy.js';

describe('shouldExplicitlyCloseNativeKuzu', () => {
  it('returns true on Windows', () => {
    expect(shouldExplicitlyCloseNativeKuzu('win32')).toBe(true);
  });

  it('returns false on Linux and macOS', () => {
    expect(shouldExplicitlyCloseNativeKuzu('linux')).toBe(false);
    expect(shouldExplicitlyCloseNativeKuzu('darwin')).toBe(false);
  });
});
