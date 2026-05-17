---
id: component/search-orchestrator
type: component
summary: Multi-engine search orchestrator — uses SearchEngineRegistry for engine selection by strategy, dispatches in parallel, fuses via RRF, normalizes scores
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
  - component/search-registry
relates: [system/core, component/file-engine, component/libsql-engine, component/hybrid-search, flow/knowledge-search]
---

# SearchOrchestrator 搜索编排器

统一的多引擎搜索编排层，通过 `SearchEngineRegistry` 选择引擎、并行分发查询、RRF 融合结果、归一化分数。

## 架构变更 (unified-search-engine-interface)

- 弃用内联 `addEngine()`/`removeEngine()`，改用 `SearchEngineRegistry` 依赖注入
- `search()` 方法通过 `registry.selectForQuery(query, strategy)` 按策略选择引擎并过滤不健康的引擎
- 支持 `SearchStrategy`: `keyword` | `semantic` | `hybrid` | `auto`

## 导出的方法

| 方法 | 签名 | 作用 |
|------|------|------|
| `search` | `(rawQuery, options?) => Promise<SearchResult[]>` | 解析查询 → 选择引擎(含健康检查) → 并行搜索 → RRF → 归一化 |
| `getRegistry` | `() => SearchEngineRegistry` | 获取引擎注册表（供外部查询） |
| `getEngines` | `() => string[]` | 返回所有已注册引擎名 |

## Search 执行流程

```
1. parseQuery(rawQuery) → ParsedQuery
2. registry.selectForQuery(query, strategy) → 按策略选择 + 健康检查过滤
3. Promise.all(selectedEngines.map(e => e.search(query, options))) → 并行分发
4. reciprocalRankFusion(engineResults) → RRF 融合
5. normalizeScores(fused) → 归一化到 [0, 10]
6. slice(0, top) → Top-K
```

## 引擎注册示例

```typescript
const registry = new SearchEngineRegistry();
registry.register(new FileEngine(memoryDir));
registry.register(new LibsqlEngine(memoryDir));
registry.register(new HybridSearch(fileEngine, semanticEngine));
const orchestrator = new SearchOrchestrator(registry);
```
