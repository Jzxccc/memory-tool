import type { ParsedQuery, SearchEngine, SearchOptions, SearchResult } from '../../types/search-types.js';
export declare class LibsqlEngine implements SearchEngine {
    name: string;
    search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
}
//# sourceMappingURL=libsql-engine.d.ts.map