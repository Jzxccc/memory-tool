// Reads and writes `index.json` — metadata index with SHA256 content hashes
// for stale detection. Based on GitNexus's content-addressed cache pattern.
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
const SCHEMA_VERSION = 1;
export function computeSHA256(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}
export function createIndexEntry(id, type, fullContent, frontmatterContent, tags, filePath) {
    return {
        id,
        type,
        contentHash: computeSHA256(fullContent),
        frontmatterHash: computeSHA256(frontmatterContent),
        tags,
        lastModified: new Date().toISOString(),
        filePath,
    };
}
export function readIndex(indexPath) {
    if (!fs.existsSync(indexPath))
        return null;
    try {
        const raw = fs.readFileSync(indexPath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function writeIndex(indexPath, index) {
    const dir = path.dirname(indexPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    // Atomic write: write to temp, then rename
    const tmpPath = indexPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(index, null, 2), 'utf-8');
    fs.renameSync(tmpPath, indexPath);
}
export function createEmptyIndex() {
    return {
        schemaVersion: SCHEMA_VERSION,
        lastFullIndex: new Date().toISOString(),
        entryCount: 0,
        entries: {},
    };
}
export function checkStale(index, memoryDir) {
    const stale = [];
    const missing = [];
    let fresh = 0;
    for (const [id, entry] of Object.entries(index.entries)) {
        const filePath = path.join(memoryDir, entry.filePath);
        if (!fs.existsSync(filePath)) {
            missing.push(id);
            continue;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const currentHash = computeSHA256(content);
        if (currentHash !== entry.contentHash) {
            stale.push(id);
        }
        else {
            fresh++;
        }
    }
    return { stale, missing, fresh };
}
//# sourceMappingURL=index-handler.js.map