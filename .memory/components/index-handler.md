---
id: component/index-handler
type: component
summary: Index file handler — reads/writes index.json with SHA256 hashing, content-addressed cache pattern for staleness detection
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

## 索引结构

```typescript
IndexFile {
  schemaVersion: number;     // 模式版本 (当前=1)
  lastFullIndex: string;     // 最后全量索引时间 (ISO-8601)
  entryCount: number;        // 条目总数
  entries: Record<string, IndexEntry>;  // ID → 条目映射
}

IndexEntry {
  id: string;
  type: NodeType;
  contentHash: string;       // 全文 SHA256
  frontmatterHash: string;   // frontmatter 部分的 SHA256
  tags: string[];
  lastModified: string;
  filePath: string;
}
```

## 哈希策略

- `contentHash` — 对完整 .md 文件内容计算 SHA256
- `frontmatterHash` — 仅对 `---` 包围的 frontmatter 部分计算 SHA256
- 双重哈希允许区分 frontmatter 变更和正文变更

## Stale 检测

`checkStale()` 重新计算文件哈希并与索引对比，返回：
- **stale** — 文件内容已变更，索引过时
- **missing** — 索引中有但文件已删除
- **fresh** — 索引与文件一致

## 原子写入

`writeIndex()` 使用临时文件 + `renameSync` 实现原子写入，防止写入过程中断导致索引损坏。
