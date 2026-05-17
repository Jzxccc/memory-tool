---
id: component/libsql-engine
type: component
summary: LibSQL FTS5 keyword search engine — capabilities=['keyword'], priority=0, uses @libsql/client with BM25 scoring and graceful degradation
tags: [search, libsql, sqlite, fts5, keyword]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/engines/libsql.ts
language: typescript
exports:
  - LibsqlEngine
depends_on:
  - system/types
relates: [system/core, component/search-orchestrator, component/search-registry]
---

# LibsqlEngine LibSQL 搜索引擎

完整的 FTS5 全文搜索引擎实现，从存根升级为可用状态。

## 引擎元数据

| 属性 | 值 |
|------|-----|
| name | `libsql` |
| capabilities | `['keyword']` |
| priority | `0` (高于 FileEngine) |

## API

| 方法 | 说明 |
|------|------|
| `tryConnect()` | 懒加载 @libsql/client，连接 .memory/memory.db，失败返回 null |
| `healthCheck()` | 检查连接 + FTS5 表存在性 |
| `buildFtsIndex(entries)` | 创建 knowledge_fts 虚拟表并批量插入 |
| `search(query, options)` | FTS5 MATCH 查询 + BM25 评分 + category/tag 过滤 |

## BM25 归一化

```
normalized = Math.round((abs(bm25) / maxBm25) * 10 * 10) / 10
```

最高分映射到 10.0，其他按比例缩放，保留 1 位小数。

## 优雅降级

- `@libsql/client` 无法导入 → `tryConnect()` 返回 null → 引擎不健康 → registry 排除
- `search()` 异常 → catch 返回 `[]`
- 所有退化路径不影响 FileEngine 正常工作

## 建索引

通过 `memory rebuild --engine libsql` 触发 `buildFtsIndex()`，重建 FTS5 表并插入所有条目的 id/type/tags/summary/body。
