// memory read <id> — full node content + related nodes (layer 2)
import * as fs from 'node:fs';
import { getMemoryDir, getNodeFilePath } from '../storage/repo-manager.js';
export async function readCommand(id, options) {
    const projectRoot = process.cwd();
    const memoryDir = getMemoryDir(projectRoot);
    const filePath = getNodeFilePath(memoryDir, id);
    if (!fs.existsSync(filePath)) {
        console.error(`Entry not found: ${id}`);
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // If summary only, extract frontmatter summary
    if (options.summary) {
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
            const lines = fmMatch[1].split('\n');
            for (const line of lines) {
                if (line.startsWith('summary:')) {
                    console.log(line.replace('summary:', '').trim());
                    return;
                }
            }
        }
        console.log('(no summary)');
        return;
    }
    if (options.format === 'json') {
        // Parse frontmatter and body
        const parts = content.split('---\n');
        const frontmatter = {};
        if (parts.length >= 2) {
            const fmLines = parts[1].split('\n');
            for (const line of fmLines) {
                const colonIdx = line.indexOf(':');
                if (colonIdx > 0) {
                    const key = line.substring(0, colonIdx).trim();
                    const value = line.substring(colonIdx + 1).trim();
                    frontmatter[key] = value;
                }
            }
        }
        const body = parts.slice(2).join('---\n').trim().replace(/^---\n/, '');
        console.log(JSON.stringify({ id, frontmatter, body }, null, 2));
        return;
    }
    // Full content output
    console.log(content);
    // TODO: Show neighbor IDs from graph.json when options.related is true
}
//# sourceMappingURL=read.js.map