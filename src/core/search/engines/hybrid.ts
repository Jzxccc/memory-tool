// Hybrid search engine — delegates to keyword and semantic sub-engines,
// fuses results via RRF with configurable weights, and degrades gracefully
// when a sub-engine fails.

import type { EngineCapability, ParsedQuery, SearchEngine, SearchOptions, SearchResult } from '../../../types/search-types.js';
import { reciprocalRankFusion } from '../rrf.js';
import { normalizeScores } from '../scorer.js';

export interface HybridWeights {
  keywordWeight: number;
  semanticWeight: number;
}

const DEFAULT_WEIGHTS: HybridWeights = {
  keywordWeight: 0.7,
  semanticWeight: 0.3,
};

export class HybridSearch implements SearchEngine {
  name = 'hybrid';
  capabilities: EngineCapability[] = ['hybrid'];
  priority = 0;

  constructor(
    private keywordEngine?: SearchEngine,
    private semanticEngine?: SearchEngine,
    private weights: HybridWeights = DEFAULT_WEIGHTS,
  ) {}

  async search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]> {
    const tasks: Promise<SearchResult[]>[] = [];
    const engineLabels: string[] = [];

    if (this.keywordEngine) {
      tasks.push(this.keywordEngine.search(query, options).catch(() => [] as SearchResult[]));
      engineLabels.push('keyword');
    }

    if (this.semanticEngine) {
      tasks.push(this.semanticEngine.search(query, options).catch(() => [] as SearchResult[]));
      engineLabels.push('semantic');
    }

    if (tasks.length === 0) return [];

    if (tasks.length === 1) {
      const results = await tasks[0];
      return results.slice(0, options.top);
    }

    const allResults = await Promise.all(tasks);

    const weightedResults = allResults.map((results, i) => {
      const weight = engineLabels[i] === 'keyword'
        ? this.weights.keywordWeight
        : this.weights.semanticWeight;
      return results.map(r => ({ ...r, score: r.score * weight }));
    });

    const fused = reciprocalRankFusion(weightedResults);
    const normalized = normalizeScores(fused);
    return normalized.slice(0, options.top);
  }
}
