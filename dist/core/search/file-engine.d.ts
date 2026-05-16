import type { ParsedQuery, SearchEngine, SearchOptions, SearchResult } from '../../types/search-types.js';
export declare class FileEngine implements SearchEngine {
    private memoryDir;
    name: string;
    constructor(memoryDir: string);
    search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
}
//# sourceMappingURL=file-engine.d.ts.map