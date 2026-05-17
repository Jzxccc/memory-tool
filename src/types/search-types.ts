// Search engine types

export type QueryOperator = 'AND' | 'OR';

export interface ParsedQuery {
  terms: string[];
  operator: QueryOperator;
}

export type EngineCapability = 'keyword' | 'semantic' | 'hybrid';

export type SearchStrategy = 'keyword' | 'semantic' | 'hybrid' | 'auto';

export interface SearchOptions {
  category?: string; // Node type filter
  tag?: string;
  top: number;
  strategy?: SearchStrategy; // Engine selection strategy
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
  capabilities: EngineCapability[];
  priority: number; // 0 = highest
  search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
  healthCheck?(): Promise<boolean>;
}
