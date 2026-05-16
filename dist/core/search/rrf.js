// Reciprocal Rank Fusion (RRF) for combining search results from
// multiple engines. K=60 as used in research and verified by GitNexus.
// When only one engine provides results, RRF degrades to pass-through.
const K = 60;
/**
 * Fuse multiple ranked result lists using Reciprocal Rank Fusion.
 * Each list is from a different search engine.
 */
export function reciprocalRankFusion(rankedLists) {
    if (rankedLists.length === 0)
        return [];
    if (rankedLists.length === 1)
        return rankedLists[0];
    const rrfScores = new Map();
    for (const list of rankedLists) {
        for (let i = 0; i < list.length; i++) {
            const result = list[i];
            const rrfScore = 1 / (K + i + 1); // 1-indexed rank
            const existing = rrfScores.get(result.id);
            if (existing) {
                existing.score += rrfScore;
            }
            else {
                rrfScores.set(result.id, {
                    score: rrfScore,
                    result: { ...result },
                });
            }
        }
    }
    // Sort by RRF score descending
    const fused = Array.from(rrfScores.values())
        .sort((a, b) => b.score - a.score)
        .map(entry => ({
        ...entry.result,
        score: entry.score, // Will be normalized by scorer
    }));
    return fused;
}
//# sourceMappingURL=rrf.js.map