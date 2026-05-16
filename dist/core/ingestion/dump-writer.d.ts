import type { ExtractedSymbol } from './extractor.js';
export interface AnalyzeDump {
    generatedAt: string;
    mode: 'monolith' | 'micro';
    sourceCount: number;
    symbolCount: number;
    files: Array<{
        relativePath: string;
        language: string;
        symbolCount: number;
    }>;
    symbols: ExtractedSymbol[];
}
export declare function writeDump(memoryDir: string, dump: AnalyzeDump): string;
//# sourceMappingURL=dump-writer.d.ts.map