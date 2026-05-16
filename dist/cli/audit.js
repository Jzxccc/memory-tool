// memory audit <id> — per-entry staleness check
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getMemoryDir, getNodeFilePath } from '../storage/repo-manager.js';
import { readIndex, computeSHA256 } from '../storage/index-handler.js';
export async function auditCommand(id) {
    const projectRoot = process.cwd();
    const memoryDir = getMemoryDir(projectRoot);
    const filePath = getNodeFilePath(memoryDir, id);
    const indexPath = path.join(memoryDir, 'index.json');
    console.log(`\n检查 ${id}...\n`);
    // Check file existence
    if (!fs.existsSync(filePath)) {
        console.log(`  ✗ 文件不存在: ${filePath}`);
        return;
    }
    console.log(`  ✓ 文件存在: ${filePath}`);
    // Check content hash
    const index = readIndex(indexPath);
    if (index && index.entries[id]) {
        const entry = index.entries[id];
        const content = fs.readFileSync(filePath, 'utf-8');
        const currentHash = computeSHA256(content);
        if (currentHash === entry.contentHash) {
            console.log(`  ✓ contentHash 匹配（内容未变化）`);
        }
        else {
            console.log(`  ✗ contentHash 不匹配（内容已变化，建议 rebuild）`);
        }
        // Check referenced code file path
        if (entry.type === 'component') {
            const fmMatch = content.match(/filePath:\s*(.+)/);
            if (fmMatch) {
                const codePath = fmMatch[1].trim();
                const absolutePath = path.resolve(projectRoot, codePath);
                if (fs.existsSync(absolutePath)) {
                    console.log(`  ✓ 引用代码存在: ${codePath}`);
                }
                else {
                    console.log(`  ✗ 引用代码不存在: ${codePath} → 建议更新`);
                }
            }
        }
    }
    else {
        console.log(`  ⚠ 索引中无此条目，请运行 memory rebuild`);
    }
    console.log('');
}
//# sourceMappingURL=audit.js.map