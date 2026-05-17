---
id: component/hybrid-search
type: component
summary: Hybrid search engine — capabilities=['hybrid'], priority=0, delegates to keyword + semantic sub-engines in parallel, fuses via weighted RRF, degrades gracefully
tags: [search, hybrid, fusion, engine]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/engines/hybrid.ts
language: typescript
exports:
  - HybridSearch
depends_on:
  - component/rrf
  - component/scorer
relates: [system/core, component/search-orchestrator, component/search-registry]
---

# HybridSearch 混合检索引擎

作为一等 `SearchEngine` 实现的混合检索，委托给 keyword 和 semantic 子引擎，融合结果。

## 引擎元数据

| 属性 | 值 |
|------|-----|
| name | `hybrid` |
| capabilities | `['hybrid']` |
| priority | `0` |

## 权重配置

```typescript
interface HybridWeights {
  keywordWeight: number;   // default: 0.7
  semanticWeight: number;  // default: 0.3
}
```

## 搜索流程

```
1. 并行调用 keywordEngine.search() + semanticEngine.search()
2. 按 HybridWeights 对结果分数加权
3. ReciprocalRankFusion(weightedResults)
4. normalizeScores(fused)
5. Top-K slice
```

## 退化逻辑

| 情况 | 行为 |
|------|------|
| 无引擎注册 | 返回 `[]` |
| 单引擎 | 直通返回（无融合） |
| keyword 崩溃 | catch → `[]`，仅返回 semantic 结果 |
| semantic 崩溃 | catch → `[]`，仅返回 keyword 结果 |

## 注册示例

```typescript
const hybrid = new HybridSearch(
  new FileEngine(memoryDir),   // keyword sub-engine
  undefined,                    // semantic (future)
  { keywordWeight: 0.7, semanticWeight: 0.3 }
);
registry.register(hybrid);
```
