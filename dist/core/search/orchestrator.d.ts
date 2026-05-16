import type { SearchOptions, SearchResult, SearchEngine } from '../../types/search-types.js';
export declare class SearchOrchestrator {
    private engines;
    addEngine(engine: SearchEngine): void;
    removeEngine(name: string): void;
    getEngines(): string[];
    search(rawQuery: string, options?: SearchOptions): Promise<SearchResult[]>;
}
//# sourceMappingURL=orchestrator.d.ts.map