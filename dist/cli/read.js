// memory read <id> — body-only content (layer 2), no frontmatter duplication.
// Frontmatter fields (type, id, summary, tags) are already shown by search.
import * as fs from 'node:fs';
import { getMemoryDir, getNodeFilePath } from '../storage/repo-manager.js';
function stripFrontmatter(content) {
    const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    return match ? match[1].trim() : content;
}
function extractSummary(content) {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch)
        return '(no summary)';
    const lines = fmMatch[1].split('\n');
    for (const line of lines) {
        if (line.startsWith('summary:')) {
            return line.replace('summary:', '').trim();
        }
    }
    return '(no summary)';
}
export async function readCommand(id, options) {
    const projectRoot = process.cwd();
    const memoryDir = getMemoryDir(projectRoot);
    const filePath = getNodeFilePath(memoryDir, id);
    if (!fs.existsSync(filePath)) {
        console.error(`Entry not found: ${id}`);
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // --summary: one-line summary only
    if (options.summary) {
        console.log(extractSummary(content));
        return;
    }
    const body = stripFrontmatter(content);
    // --format json: body only, no frontmatter duplication
    if (options.format === 'json') {
        console.log(JSON.stringify({ body }, null, 2));
        return;
    }
    // Default: body only (layer 2 — progressive disclosure)
    console.log(body);
    // TODO: Show neighbor IDs from graph.json when options.related is true
}
//# sourceMappingURL=read.js.map