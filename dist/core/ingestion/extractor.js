// Symbol extractor — tree-sitter primary, regex fallback.
// Extracts functions, classes, imports, configs, routes from source files.
import * as fs from 'node:fs';
let treeSitterLoaded = false;
async function tryLoadTreeSitter() {
    if (treeSitterLoaded)
        return true;
    try {
        await import('tree-sitter');
        treeSitterLoaded = true;
        return true;
    }
    catch {
        return false;
    }
}
function extractWithRegex(content, filePath, language) {
    const symbols = [];
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;
        // Function: export function name( | function name( | const name = ( | def name(
        const funcPatterns = [
            /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
            /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\s*\(/,
            /def\s+(\w+)\s*\(/, // Python
            /func\s+(\w+)\s*\(/, // Go
        ];
        for (const pat of funcPatterns) {
            const m = line.match(pat);
            if (m) {
                symbols.push({
                    name: m[1], type: 'function', filePath, line: lineNum,
                    exported: line.includes('export') || line.includes('public'), language,
                });
                break;
            }
        }
        // Class: class Name | export class Name
        const classMatch = line.match(/(?:export\s+|public\s+)?class\s+(\w+)/);
        if (classMatch) {
            symbols.push({
                name: classMatch[1], type: 'class', filePath, line: lineNum,
                exported: line.includes('export') || line.includes('public'), language,
            });
        }
        // Import: import X from 'y' | import { X } from 'y' | from X import Y | require('y')
        const importPatterns = [
            /import\s+\{?\s*(\w+)/,
            /import\s+(\w+)\s+from\s+['"](.+?)['"]/,
            /const\s+(\w+)\s*=\s*require\(['"](.+?)['"]\)/,
            /from\s+(\S+)\s+import\s+(\w+)/, // Python
            /import\s+\(?\s*"(.+?)"\s*\)/, // Go
        ];
        for (const pat of importPatterns) {
            const m = line.match(pat);
            if (m) {
                symbols.push({
                    name: m[1], type: 'import', filePath, line: lineNum,
                    source: m[2] || m[1], language,
                });
                break;
            }
        }
        // Config key: process.env.X | UPPER_CASE = value | KEY: value
        const configPatterns = [
            /process\.env\.(\w+)/,
            /^([A-Z_]{2,})\s*[=:]\s*(.+)/,
            /const\s+([A-Z_]+)\s*=\s*/,
        ];
        for (const pat of configPatterns) {
            const m = line.match(pat);
            if (m) {
                symbols.push({
                    name: m[1], type: 'config', filePath, line: lineNum, language,
                });
                break;
            }
        }
        // Route: app.get('/path' | @Get('/path' | @Post('/path' | router.get
        const routePatterns = [
            /(?:app|router|this|server)\.\s*(get|post|put|delete|patch)\s*\(['"]([^'"]+)['"]/i,
            /@(Get|Post|Put|Delete|Patch|RequestMapping)\s*\(['"]([^'"]*)['"]/,
        ];
        for (const pat of routePatterns) {
            const m = line.match(pat);
            if (m) {
                const method = (m[1] || 'Get').toUpperCase();
                symbols.push({
                    name: `${method} ${m[2] || '/'}`,
                    type: 'route', filePath, line: lineNum, language,
                });
                break;
            }
        }
    }
    return symbols;
}
export async function extractSymbols(filePath, language) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    }
    catch {
        return [];
    }
    const hasTreeSitter = await tryLoadTreeSitter();
    // Both paths currently use regex; tree-sitter integration is future work
    return extractWithRegex(content, filePath, language);
}
export async function isTreeSitterAvailable() {
    return tryLoadTreeSitter();
}
//# sourceMappingURL=extractor.js.map