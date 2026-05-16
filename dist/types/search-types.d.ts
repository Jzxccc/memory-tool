export type QueryOperator = 'AND' | 'OR';
export interface ParsedQuery {
    terms: string[];
    operator: QueryOperator;
}
export interface SearchOptions {
    category?: string;
    tag?: string;
    top: number;
}
export interface SearchResult {
    id: string;
    type: string;
    summary: string;
    tags: string[];
    score: number;
    source: 'file' | 'libsql';
}
export interface SearchEngine {
    name: string;
    search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
}
//# sourceMappingURL=search-types.d.ts.map