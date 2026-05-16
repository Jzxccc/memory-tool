export interface ExtractedSymbol {
    name: string;
    type: 'function' | 'class' | 'import' | 'config' | 'route';
    filePath: string;
    line: number;
    exported?: boolean;
    language: string;
    source?: string;
    parent?: string;
}
export declare function extractSymbols(filePath: string, language: string): Promise<ExtractedSymbol[]>;
export declare function isTreeSitterAvailable(): Promise<boolean>;
//# sourceMappingURL=extractor.d.ts.map