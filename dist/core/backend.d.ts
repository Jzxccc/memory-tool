import type { SearchResult } from '../types/search-types.js';
export interface BackendResult {
    success: boolean;
    data?: unknown;
    error?: string;
}
export declare class LocalBackend {
    private projectRoot;
    private orchestrator;
    constructor(projectRoot: string);
    search(query: string, options?: {
        category?: string;
        tag?: string;
        top?: number;
    }): Promise<SearchResult[]>;
    read(id: string): Promise<string | null>;
    status(): Promise<{
        entryCount: number;
        typeCounts: Record<string, number>;
        stale: string[];
        missing: string[];
    }>;
}
//# sourceMappingURL=backend.d.ts.map