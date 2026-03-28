import { describe, expect, it } from 'vitest';

import { selectSignificantCommunities } from '../../src/cli/skill-community-selection.js';
import type { CommunityNode } from '../../src/core/ingestion/community-processor.js';

function makeCommunity(
  id: string,
  label: string,
  symbolCount: number,
  cohesion: number = 0.75,
): CommunityNode {
  return { id, label, heuristicLabel: label, cohesion, symbolCount };
}

describe('skill community selection', () => {
  it('aggregates communities that share the same heuristic label', () => {
    const result = selectSignificantCommunities([
      makeCommunity('c1', 'Auth', 4, 0.7),
      makeCommunity('c2', 'Auth', 4, 0.9),
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        label: 'Auth',
        rawIds: ['c1', 'c2'],
        symbolCount: 8,
        cohesion: 0.8,
      }),
    ]);
  });

  it('filters out aggregated communities below the significance threshold', () => {
    const result = selectSignificantCommunities([
      makeCommunity('c1', 'Small1', 2),
      makeCommunity('c2', 'Small2', 2),
      makeCommunity('c3', 'Small3', 2),
    ]);

    expect(result).toEqual([]);
  });

  it('sorts by symbol count descending and caps the result at 20 communities', () => {
    const communities: CommunityNode[] = [];
    for (let i = 0; i < 25; i++) {
      communities.push(makeCommunity(`c${i}`, `Area${i}`, 25 - i));
    }

    const result = selectSignificantCommunities(communities);

    expect(result).toHaveLength(20);
    expect(result[0].label).toBe('Area0');
    expect(result[0].symbolCount).toBe(25);
    expect(result.at(-1)?.symbolCount).toBe(6);
  });
});
