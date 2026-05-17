---
id: component/index-handler
type: component
summary: Index file handler — reads/writes index.json with SHA256 hashing, content-addressed cache pattern for staleness detection, and atomic writes
tags: [index, hash, sha256, cache, staleness]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/storage/index-handler.ts
language: typescript
exports:
  - computeSHA256
  - createIndexEntry
  - readIndex
  - writeIndex
  - createEmptyIndex
  - checkStale
depends_on:
  - system/types
relates: [system/storage, component/repo-manager, config/storage-constants]
---

# IndexHandler 索引文件处理器

基于 GitNexus 的内容寻址缓存模式管理 `index.json`。

## 索引数据结构

```typescript
IndexFile {
  schemaVersion: 1
  lastFullIndex: "2026-05-17T11:58:40.461Z"
  entryCount: 17
  entries: {
    "system/cli": {
      id: "system/cli"
      type: "system"
      contentHash: "abc123..."    // 全文 SHA256
      frontmatterHash: "def456..." // 仅 frontmatter 的 SHA256
      tags: ["cli", "commander"]
      lastModified: "2026-05-17T..."
      filePath: "systems/cli.md"
    }
  }
}
```

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `computeSHA256` | `(content: string) => string` | 计算 SHA256 哈希 |
| `createIndexEntry` | `(id, type, fullContent, fmContent, tags, filePath) => IndexEntry` | 创建带双重哈希的索引条目 |
| `readIndex` | `(indexPath) => IndexFile \| null` | 读取并解析 index.json |
| `writeIndex` | `(indexPath, index) => void` | 原子写入 index.json（临时文件 + rename） |
| `createEmptyIndex` | `() => IndexFile` | 创建空索引骨架 |
| `checkStale` | `(index, memoryDir) => {stale, missing, fresh}` | 重新计算哈希对比索引 |

## 双重哈希策略

- **contentHash** — 对完整 `.md` 文件内容（含 frontmatter + body）计算 SHA256
- **frontmatterHash** — 仅对 `---` 包围的 frontmatter 文本计算 SHA256
- 用途：通过对比 frontmatterHash 可判断是否仅 frontmatter 变更（如 tags、summary），避免全量重建

## Stale 检测流程

```
checkStale(index, memoryDir):
  for each entry in index.entries:
    1. 检查文件是否存在 → 不存在则 +missing
    2. 读取文件内容 → 重新计算 SHA256
    3. 对比 contentHash → 不匹配则 +stale
    4. 一致则 fresh+1
```

## 原子写入

```typescript
writeIndex(indexPath, index):
  tmpPath = indexPath + '.tmp'
  fs.writeFileSync(tmpPath, JSON.stringify(index))
  fs.renameSync(tmpPath, indexPath)  // 原子操作
```

避免写入中断导致索引文件损坏。

## 注意事项

- 若 index.json 不存在或损坏，`readIndex` 返回 `null`
- `writeIndex` 会自动创建目录
- schemaVersion 当前固定为 `1`，未来升级索引结构时递增
