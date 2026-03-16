import { describe, expect, it } from 'vitest';
import { shouldSkipAnalyze } from '../../src/cli/analyze.js';
import type { RepoMeta } from '../../src/storage/repo-manager.js';

const baseMeta: RepoMeta = {
  repoPath: '/tmp/repo',
  lastCommit: 'abc123',
  indexedAt: '2026-03-16T00:00:00.000Z',
  toolVersion: '1.4.0',
};

describe('shouldSkipAnalyze', () => {
  it('skips when commit and tool version both match', () => {
    expect(shouldSkipAnalyze(baseMeta, 'abc123', '1.4.0', {})).toBe(true);
  });

  it('does not skip when gitnexus version changed', () => {
    expect(shouldSkipAnalyze(baseMeta, 'abc123', '1.4.1', {})).toBe(false);
  });

  it('does not skip when existing index predates toolVersion metadata', () => {
    const legacyMeta = { ...baseMeta };
    delete legacyMeta.toolVersion;

    expect(shouldSkipAnalyze(legacyMeta, 'abc123', '1.4.0', {})).toBe(false);
  });

  it('does not skip when commit changed', () => {
    expect(shouldSkipAnalyze(baseMeta, 'def456', '1.4.0', {})).toBe(false);
  });

  it('does not skip in force mode even when everything matches', () => {
    expect(shouldSkipAnalyze(baseMeta, 'abc123', '1.4.0', { force: true })).toBe(false);
  });

  it('does not skip when regenerating skills', () => {
    expect(shouldSkipAnalyze(baseMeta, 'abc123', '1.4.0', { skills: true })).toBe(false);
  });
});
