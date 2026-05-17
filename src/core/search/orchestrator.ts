// Unified search orchestrator — dispatches to available engines via registry,
// fuses results via RRF, and normalizes scores.

import type { ParsedQuery, SearchOptions, SearchResult } from '../../types/search-types.js';
import { parseQuery } from './query-parser.js';
import { reciprocalRankFusion } from './rrf.js';
import { normalizeScores } from './scorer.js';
import { SearchEngineRegistry } from './engines/registry.js';

export class SearchOrchestrator {
  private registry: SearchEngineRegistry;

  constructor(registry?: SearchEngineRegistry) {
    this.registry = registry || new SearchEngineRegistry();
  }

  getRegistry(): SearchEngineRegistry {
    return this.registry;
  }

  getEngines(): string[] {
    return this.registry.getAll().map(e => e.name);
  }

  async search(
    rawQuery: string,
    options: SearchOptions = { top: 10 },
  ): Promise<SearchResult[]> {
    const query: ParsedQuery = parseQuery(rawQuery);

    // Select engines based on strategy and health
    const engines = await this.registry.selectForQuery(
      query,
      options.strategy || 'auto',
    );

    // If no engines, return empty
    if (engines.length === 0) return [];

    // Dispatch to all engines in parallel
    const engineResults = await Promise.all(
      engines.map(engine => engine.search(query, options)),
    );

    // Fuse via RRF
    const fused = reciprocalRankFusion(engineResults);

    // Normalize scores
    const normalized = normalizeScores(fused);

    return normalized.slice(0, options.top);
  }
}
