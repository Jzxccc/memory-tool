// Writes discovery dump to .memory/.analyze-dump.json
import * as fs from 'node:fs';
import * as path from 'node:path';
export function writeDump(memoryDir, dump) {
    const dumpPath = path.join(memoryDir, '.analyze-dump.json');
    fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2), 'utf-8');
    return dumpPath;
}
//# sourceMappingURL=dump-writer.js.map