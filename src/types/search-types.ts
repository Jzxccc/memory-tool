// Search engine types

export type QueryOperator = 'AND' | 'OR';

export interface ParsedQuery {
  terms: string[];
  operator: QueryOperator;
}

export interface SearchOptions {
  category?: string; // Node type filter
  tag?: string;
  top: number;
}

export interface SearchResult {
  id: string;
  type: string;
  summary: string;
  tags: string[];
  score: number; // Normalized 0-10
  source: 'file' | 'libsql';
}

export interface SearchEngine {
  name: string;
  search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
}
