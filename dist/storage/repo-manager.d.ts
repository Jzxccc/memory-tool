export declare const MEMORY_FILES: {
    readonly INDEX: "index.json";
    readonly GRAPH: "graph.json";
    readonly ANALYZE_DUMP: ".analyze-dump.json";
    readonly CONFIG: "config.toml";
};
export declare function getMemoryDir(projectRoot: string): string;
export declare function getSubdir(memoryDir: string, type: string): string;
export declare function getNodeFilePath(memoryDir: string, id: string): string;
export declare function parseNodeId(filePath: string): string | null;
export declare function initMemoryDir(projectRoot: string): string;
export declare function listNodeFiles(memoryDir: string): string[];
export declare function getFilePath(memoryDir: string, filename: string): string;
//# sourceMappingURL=repo-manager.d.ts.map