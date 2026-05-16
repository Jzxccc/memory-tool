// Source file scanner — discovers project source files, excluding build artifacts and deps.
import * as fs from 'node:fs';
import * as path from 'node:path';
const DEFAULT_EXCLUDES = [
    'node_modules', 'dist', 'build', '.git', '__tests__', 'coverage',
    'target', 'vendor', '.next', 'out', '.turbo', '.storybook',
];
const SOURCE_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.vue',
    '.java', '.kt', '.py', '.go', '.rs',
]);
function detectLanguage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.ts': 'typescript', '.tsx': 'typescript',
        '.js': 'javascript', '.jsx': 'javascript',
        '.vue': 'vue',
        '.java': 'java',
        '.py': 'python',
        '.go': 'go',
        '.rs': 'rust',
    };
    return map[ext] || 'unknown';
}
export function scanDirectory(rootDir, excludes = DEFAULT_EXCLUDES) {
    const results = [];
    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (entry.name.startsWith('.') && entry.name !== '.')
                continue;
            if (excludes.includes(entry.name))
                continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (SOURCE_EXTENSIONS.has(ext)) {
                    let stat;
                    try {
                        stat = fs.statSync(fullPath);
                    }
                    catch {
                        continue;
                    }
                    results.push({
                        relativePath: path.relative(rootDir, fullPath),
                        absolutePath: fullPath,
                        language: detectLanguage(entry.name),
                        size: stat.size,
                    });
                }
            }
        }
    }
    walk(rootDir);
    return results;
}
export function detectProjectMode(rootDir) {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    if (dirs.includes('services') || dirs.includes('packages')) {
        return 'micro';
    }
    if (dirs.includes('src')) {
        return 'monolith';
    }
    return 'monolith'; // default
}
//# sourceMappingURL=scanner.js.map