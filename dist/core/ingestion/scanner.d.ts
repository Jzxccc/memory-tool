export interface SourceFile {
    relativePath: string;
    absolutePath: string;
    language: string;
    size: number;
}
export declare function scanDirectory(rootDir: string, excludes?: string[]): SourceFile[];
export declare function detectProjectMode(rootDir: string): 'monolith' | 'micro';
//# sourceMappingURL=scanner.d.ts.map