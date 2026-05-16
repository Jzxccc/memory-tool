// memory analyze [path] — extract symbols from source code
// Primary: tree-sitter (optional). Fallback: regex patterns.
import * as path from 'node:path';
import { getMemoryDir, initMemoryDir } from '../storage/repo-manager.js';
import { scanDirectory, detectProjectMode } from '../core/ingestion/scanner.js';
import { extractSymbols, isTreeSitterAvailable } from '../core/ingestion/extractor.js';
import { writeDump } from '../core/ingestion/dump-writer.js';
export async function analyzeCommand(targetPath) {
    const projectRoot = process.cwd();
    const scanRoot = targetPath ? path.resolve(projectRoot, targetPath) : projectRoot;
    // Check tree-sitter availability
    const tsAvailable = await isTreeSitterAvailable();
    const engine = tsAvailable ? 'tree-sitter' : 'regex';
    console.log(`\nAnalyzing: ${scanRoot}`);
    console.log(`Engine: ${engine}`);
    // Phase 1: Initialize .memory/
    const memoryDir = getMemoryDir(projectRoot);
    initMemoryDir(projectRoot);
    // Phase 2: Scan
    const mode = targetPath ? 'monolith' : detectProjectMode(scanRoot);
    const sourceFiles = scanDirectory(scanRoot);
    console.log(`  Scan: ${sourceFiles.length} source files (mode: ${mode})`);
    // Phase 3: Extract
    const allSymbols = [];
    for (let i = 0; i < sourceFiles.length; i++) {
        const file = sourceFiles[i];
        const symbols = await extractSymbols(file.absolutePath, file.language);
        allSymbols.push(...symbols);
        if ((i + 1) % 20 === 0) {
            console.log(`  Extract: ${i + 1}/${sourceFiles.length} files`);
        }
    }
    // Phase 4: Dump
    const dump = {
        generatedAt: new Date().toISOString(),
        mode,
        sourceCount: sourceFiles.length,
        symbolCount: allSymbols.length,
        files: sourceFiles.map(f => ({
            relativePath: f.relativePath,
            language: f.language,
            symbolCount: allSymbols.filter(s => s.filePath === f.absolutePath).length,
        })),
        symbols: allSymbols,
    };
    const dumpPath = writeDump(memoryDir, dump);
    // Summary
    const funcs = allSymbols.filter(s => s.type === 'function').length;
    const classes = allSymbols.filter(s => s.type === 'class').length;
    const imports = allSymbols.filter(s => s.type === 'import').length;
    const configs = allSymbols.filter(s => s.type === 'config').length;
    const routes = allSymbols.filter(s => s.type === 'route').length;
    console.log(`  Total: ${allSymbols.length} symbols extracted`);
    console.log(`    Functions: ${funcs}`);
    console.log(`    Classes: ${classes}`);
    console.log(`    Imports: ${imports}`);
    console.log(`    Configs: ${configs}`);
    console.log(`    Routes: ${routes}`);
    console.log(`  Dump: ${dumpPath}`);
    console.log(`\nDone! Run memory-build skill to classify symbols.\n`);
}
//# sourceMappingURL=analyze.js.map