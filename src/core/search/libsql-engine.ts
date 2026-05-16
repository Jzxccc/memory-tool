// Libsql (SQLite) search engine using FTS5 for full-text search.
// Scores normalized to 0-10 range using BM25 if available, else simple term frequency.

import type { ParsedQuery, SearchEngine, SearchOptions, SearchResult } from '../../types/search-types.js';

// Stub: libsql engine not yet activated. When enabled, uses @libsql/client for FTS5 queries.
// File search engine is the default. Switch with: memory rebuild --engine libsql

export class LibsqlEngine implements SearchEngine {
  name = 'libsql';

  async search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]> {
    // TODO: Implement FTS5 search with @libsql/client
    // 1. Open connection to .memory/memory.db
    // 2. Execute FTS5 MATCH query with parsed terms
    // 3. Normalize BM25 scores to 0-10
    // 4. Apply category/tag filters via WHERE clauses
    return [];
  }
}
