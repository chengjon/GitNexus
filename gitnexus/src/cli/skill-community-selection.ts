import type { CommunityNode } from '../core/ingestion/community-processor.js';

export interface AggregatedCommunity {
  label: string;
  rawIds: string[];
  symbolCount: number;
  cohesion: number;
}

export const aggregateCommunities = (communities: CommunityNode[]): AggregatedCommunity[] => {
  const groups = new Map<string, {
    rawIds: string[];
    totalSymbols: number;
    weightedCohesion: number;
  }>();

  for (const community of communities) {
    const label = community.heuristicLabel || community.label || 'Unknown';
    const symbols = community.symbolCount || 0;
    const cohesion = community.cohesion || 0;
    const existing = groups.get(label);

    if (!existing) {
      groups.set(label, {
        rawIds: [community.id],
        totalSymbols: symbols,
        weightedCohesion: cohesion * symbols,
      });
    } else {
      existing.rawIds.push(community.id);
      existing.totalSymbols += symbols;
      existing.weightedCohesion += cohesion * symbols;
    }
  }

  return Array.from(groups.entries()).map(([label, group]) => ({
    label,
    rawIds: group.rawIds,
    symbolCount: group.totalSymbols,
    cohesion: group.totalSymbols > 0 ? group.weightedCohesion / group.totalSymbols : 0,
  }));
};

export const selectSignificantCommunities = (communities: CommunityNode[]): AggregatedCommunity[] => {
  return aggregateCommunities(communities)
    .filter((community) => community.symbolCount >= 3)
    .sort((left, right) => right.symbolCount - left.symbolCount)
    .slice(0, 20);
};
