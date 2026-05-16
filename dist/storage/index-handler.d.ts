import type { NodeType } from '../types/node-types.js';
export interface IndexEntry {
    id: string;
    type: NodeType;
    contentHash: string;
    frontmatterHash: string;
    tags: string[];
    lastModified: string;
    filePath: string;
}
export interface IndexFile {
    schemaVersion: number;
    lastFullIndex: string;
    entryCount: number;
    entries: Record<string, IndexEntry>;
}
export declare function computeSHA256(content: string): string;
export declare function createIndexEntry(id: string, type: NodeType, fullContent: string, frontmatterContent: string, tags: string[], filePath: string): IndexEntry;
export declare function readIndex(indexPath: string): IndexFile | null;
export declare function writeIndex(indexPath: string, index: IndexFile): void;
export declare function createEmptyIndex(): IndexFile;
export declare function checkStale(index: IndexFile, memoryDir: string): {
    stale: string[];
    missing: string[];
    fresh: number;
};
//# sourceMappingURL=index-handler.d.ts.map