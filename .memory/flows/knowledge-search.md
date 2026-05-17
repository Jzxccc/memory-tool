---
id: flow/knowledge-search
type: flow
summary: Knowledge search and retrieval — parse query → parallel engine dispatch → RRF result fusion → score normalization → ranked top-K results
tags: [search, retrieval, rrf, ranking]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
trigger: User/AI runs `memory search <query>` or calls MCP `memory_search` tool
relates:
  - component/query-parser
  - component/search-orchestrator
  - component/file-engine
  - component/libsql-engine
  - component/rrf
  - component/scorer
steps:
  - order: 1
    component: component/query-parser
    description: Parse raw search query into structured ParsedQuery (supports | for OR, & for AND)
  - order: 2
    component: component/search-orchestrator
    description: Dispatch parsed query to all registered engines in parallel
  - order: 3
    component: component/file-engine
    description: Search .md files by weighted field matching (title, tags, summary, body) with category/tag filtering
  - order: 4
    component: component/libsql-engine
    description: Search via libSQL database (optional engine)
  - order: 5
    component: component/rrf
    description: Fuse multiple engine result lists using Reciprocal Rank Fusion
  - order: 6
    component: component/scorer
    description: Normalize fused scores to [0, 1] range
  - order: 7
    component: component/search-orchestrator
    description: Return top-K results sorted by normalized score
result: Ranked list of SearchResult items with id, type, score, summary, and tags
---

# Search 搜索流程

从用户查询到排序结果的端到端搜索流程。

## 查询语法

- `|` — OR 操作：匹配任一关键词
- `&` — AND 操作：匹配所有关键词
- 混合使用：`auth | login & jwt`

## 处理管线

```
"memory search auth | login"  (原始查询)
            │
            ▼
    ┌───────────────┐
    │ QueryParser   │ → ParsedQuery { terms, operators }
    └───────┬───────┘
            │
    ┌───────┴───────┐
    │ Orchestrator  │ → 并行分发
    └───┬───────┬───┘
        │       │
        ▼       ▼
  FileEngine  LibsqlEngine
        │       │
        ▼       ▼
   Result[1..N]  Result[1..M]
        │       │
        └───┬───┘
            ▼
    ┌───────────────┐
    │ RRF Fusion    │ → reciprocalRankFusion()
    └───────┬───────┘
            ▼
    ┌───────────────┐
    │ Scorer        │ → normalizeScores()
    └───────┬───────┘
            ▼
    ┌───────────────┐
    │ Top-K         │ → result.slice(0, top)
    └───────────────┘
            ▼
    SearchResult[] (按 score 降序)
```
