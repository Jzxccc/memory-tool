---
id: component/search-orchestrator
type: component
summary: Multi-engine search orchestrator — dispatches queries to all engines in parallel, fuses results via RRF, and normalizes scores
tags: [search, orchestrator, rrf, parallel, fusion]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/orchestrator.ts
language: typescript
exports:
  - SearchOrchestrator
depends_on:
  - component/query-parser
  - component/rrf
  - component/scorer
relates: [system/core, component/file-engine, component/libsql-engine, flow/knowledge-search]
---

# SearchOrchestrator 搜索编排器

统一的搜索编排层，实现多引擎并行搜索 + 结果融合。

## 搜索流程

```
原始查询 → QueryParser → ParsedQuery
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
        FileEngine       LibsqlEngine    (可扩展更多引擎)
              ↓               ↓               ↓
        [Result[]]       [Result[]]       [Result[]]
              └───────────────┼───────────────┘
                              ↓
                    ReciprocalRankFusion
                              ↓
                     Score Normalization
                              ↓
                       Top K Results
```

## API

| 方法 | 功能 |
|------|------|
| `addEngine(engine)` | 注册搜索引擎 |
| `removeEngine(name)` | 移除搜索引擎 |
| `getEngines()` | 获取已注册引擎名列表 |
| `search(query, options)` | 执行并行搜索并融合结果 |

## 搜索引擎协议 (SearchEngine)

```typescript
interface SearchEngine {
  name: string;
  search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
}
```
