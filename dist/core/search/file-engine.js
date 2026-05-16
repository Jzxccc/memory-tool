// File-based search engine: keyword matching + frontmatter weighted scoring.
// Searches Markdown files under .memory/ using content and frontmatter fields.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { listNodeFiles, parseNodeId } from '../../storage/repo-manager.js';
// Scoring weights
const WEIGHTS = {
    ID_MATCH: 5,
    SUMMARY_MATCH: 3,
    TAG_MATCH: 1,
    BODY_OCCURRENCE: 0.5,
    CATEGORY_MATCH: 1,
};
function extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match)
        return null;
    return { frontmatter: match[1], body: match[2] };
}
function parseFrontmatter(fm) {
    const result = {};
    const lines = fm.split('\n');
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1)
            continue;
        const key = line.substring(0, colonIdx).trim();
        let value = line.substring(colonIdx + 1).trim();
        // Parse array values [a, b, c]
        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
            value = value.slice(1, -1).split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
        result[key] = value;
    }
    return result;
}
function matchTerm(text, term) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
}
function scoreFile(content, query, options, filePath, memoryDir) {
    const parsed = extractFrontmatter(content);
    if (!parsed)
        return null;
    const fm = parseFrontmatter(parsed.frontmatter);
    const id = parseNodeId(filePath) || fm.id || path.basename(filePath, '.md');
    const type = fm.type || 'unknown';
    const summary = fm.summary || '';
    const tags = Array.isArray(fm.tags) ? fm.tags : [];
    // Category filter
    if (options.category && type !== options.category)
        return null;
    // Tag filter
    if (options.tag && !tags.includes(options.tag))
        return null;
    const operator = query.operator;
    let totalScore = 0;
    let allMatched = true;
    for (const term of query.terms) {
        let termScore = 0;
        // ID match
        if (id.toLowerCase().includes(term.toLowerCase())) {
            termScore += WEIGHTS.ID_MATCH;
        }
        // Summary match
        termScore += matchTerm(summary, term) * WEIGHTS.SUMMARY_MATCH;
        // Tag match
        for (const tag of tags) {
            if (tag.toLowerCase().includes(term.toLowerCase())) {
                termScore += WEIGHTS.TAG_MATCH;
            }
        }
        // Body match
        termScore += matchTerm(parsed.body, term) * WEIGHTS.BODY_OCCURRENCE;
        if (termScore === 0) {
            if (operator === 'AND') {
                allMatched = false;
                break; // AND requires all terms present
            }
            // OR: this term didn't match, continue to next
            continue;
        }
        totalScore += termScore;
    }
    if (!allMatched || totalScore === 0)
        return null;
    return {
        id,
        type,
        summary: summary || '(no summary)',
        tags,
        score: totalScore,
        source: 'file',
    };
}
export class FileEngine {
    memoryDir;
    name = 'file';
    constructor(memoryDir) {
        this.memoryDir = memoryDir;
    }
    async search(query, options) {
        const files = listNodeFiles(this.memoryDir);
        const results = [];
        for (const relPath of files) {
            const fullPath = path.join(this.memoryDir, relPath);
            try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                const result = scoreFile(content, query, options, relPath, this.memoryDir);
                if (result) {
                    results.push(result);
                }
            }
            catch {
                // Skip unreadable files
            }
        }
        // Sort by score descending
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, options.top);
    }
}
//# sourceMappingURL=file-engine.js.map