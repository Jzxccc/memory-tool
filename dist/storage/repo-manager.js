// Manages the `.memory/` directory — initialization, directory structure,
// path resolution, and cleanup.
import * as fs from 'node:fs';
import * as path from 'node:path';
const MEMORY_DIR = '.memory';
const SUBDIRS = ['systems', 'flows', 'components', 'configs', 'apis', 'decisions'];
export const MEMORY_FILES = {
    INDEX: 'index.json',
    GRAPH: 'graph.json',
    ANALYZE_DUMP: '.analyze-dump.json',
    CONFIG: 'config.toml',
};
export function getMemoryDir(projectRoot) {
    return path.join(projectRoot, MEMORY_DIR);
}
export function getSubdir(memoryDir, type) {
    return path.join(memoryDir, `${type}s`);
}
export function getNodeFilePath(memoryDir, id) {
    // id format: "type/slug" → "types/slug.md"
    const [type, slug] = id.split('/');
    return path.join(memoryDir, `${type}s`, `${slug}.md`);
}
export function parseNodeId(filePath) {
    const relPath = filePath.replace(/\\/g, '/');
    // Match both "components/slug.md" and ".memory/components/slug.md"
    const match = relPath.match(/(?:\.memory\/)?(systems|flows|components|configs|apis|decisions)\/(.+)\.md$/);
    if (!match)
        return null;
    const type = match[1].slice(0, -1); // Remove plural 's'
    return `${type}/${match[2]}`;
}
export function initMemoryDir(projectRoot) {
    const memoryDir = getMemoryDir(projectRoot);
    if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
    }
    for (const subdir of SUBDIRS) {
        const fullPath = path.join(memoryDir, subdir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    }
    return memoryDir;
}
export function listNodeFiles(memoryDir) {
    const files = [];
    for (const subdir of SUBDIRS) {
        const dirPath = path.join(memoryDir, subdir);
        if (!fs.existsSync(dirPath))
            continue;
        const entries = fs.readdirSync(dirPath);
        for (const entry of entries) {
            if (entry.endsWith('.md')) {
                files.push(path.join(subdir, entry));
            }
        }
    }
    return files;
}
export function getFilePath(memoryDir, filename) {
    return path.join(memoryDir, filename);
}
//# sourceMappingURL=repo-manager.js.map