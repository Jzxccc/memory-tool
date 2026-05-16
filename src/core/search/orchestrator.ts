// Unified search orchestrator — dispatches to available engines,
// fuses results via RRF, and normalizes scores.

import type { ParsedQuery, SearchOptions, SearchResult, SearchEngine } from '../../types/search-types.js';
import { parseQuery } from './query-parser.js';
import { reciprocalRankFusion } from './rrf.js';
import { normalizeScores } from './scorer.js';

export class SearchOrchestrator {
  private engines: SearchEngine[] = [];

  addEngine(engine: SearchEngine): void {
    this.engines.push(engine);
  }

  removeEngine(name: string): void {
    this.engines = this.engines.filter(e => e.name !== name);
  }

  getEngines(): string[] {
    return this.engines.map(e => e.name);
  }

  async search(
    rawQuery: string,
    options: SearchOptions = { top: 10 },
  ): Promise<SearchResult[]> {
    const query: ParsedQuery = parseQuery(rawQuery);

    // If no engines, return empty
    if (this.engines.length === 0) return [];

    // Dispatch to all engines in parallel
    const engineResults = await Promise.all(
      this.engines.map(engine => engine.search(query, options)),
    );

    // Fuse via RRF
    const fused = reciprocalRankFusion(engineResults);

    // Normalize scores
    const normalized = normalizeScores(fused);

    return normalized.slice(0, options.top);
  }
}
