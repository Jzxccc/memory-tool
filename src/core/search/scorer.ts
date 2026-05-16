// Score normalization to 0-10 range for consistent display.
// The highest-score result anchors at 10, others scale proportionally.

import type { SearchResult } from '../../types/search-types.js';

export function normalizeScores(results: SearchResult[]): SearchResult[] {
  if (results.length === 0) return results;

  const maxScore = results[0].score;
  if (maxScore === 0) return results.map(r => ({ ...r, score: 0 }));

  return results.map(r => ({
    ...r,
    score: Math.round((r.score / maxScore) * 10 * 10) / 10, // 1 decimal place
  }));
}
