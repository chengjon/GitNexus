/**
 * Aggregate same-named clusters: group by heuristicLabel, sum symbols,
 * weighted-average cohesion, filter out tiny clusters (<5 symbols).
 * Raw communities stay intact in KuzuDB for Cypher queries.
 */
export function aggregateClusters(clusters: any[]): any[] {
  const groups = new Map<string, { ids: string[]; totalSymbols: number; weightedCohesion: number; largest: any }>();

  for (const c of clusters) {
    const label = c.heuristicLabel || c.label || 'Unknown';
    const symbols = c.symbolCount || 0;
    const cohesion = c.cohesion || 0;
    const existing = groups.get(label);

    if (!existing) {
      groups.set(label, { ids: [c.id], totalSymbols: symbols, weightedCohesion: cohesion * symbols, largest: c });
    } else {
      existing.ids.push(c.id);
      existing.totalSymbols += symbols;
      existing.weightedCohesion += cohesion * symbols;
      if (symbols > (existing.largest.symbolCount || 0)) {
        existing.largest = c;
      }
    }
  }

  return Array.from(groups.entries())
    .map(([label, g]) => ({
      id: g.largest.id,
      label,
      heuristicLabel: label,
      symbolCount: g.totalSymbols,
      cohesion: g.totalSymbols > 0 ? g.weightedCohesion / g.totalSymbols : 0,
      subCommunities: g.ids.length,
    }))
    .filter(c => c.symbolCount >= 5)
    .sort((a, b) => b.symbolCount - a.symbolCount);
}
