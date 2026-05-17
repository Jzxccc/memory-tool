---
id: component/scorer
type: component
summary: Score normalizer — scales RRF-fused scores to the 0-10 range with 1 decimal place, anchored by the highest-scoring result at 10.0
tags: [search, scorer, normalization, ranking]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/scorer.ts
language: typescript
exports:
  - normalizeScores
depends_on:
  - system/types
relates: [system/core, component/search-orchestrator, component/rrf, flow/knowledge-search]
---

# Scorer 得分配一化器

将 RRF 融合后的原始分数归一化到 0-10 区间。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `normalizeScores` | `(results: SearchResult[]) => SearchResult[]` | 归一化原始分数到 [0, 10] |

## 算法

```
normalizeScores(results):
  if results.length === 0: return results
  
  maxScore = results[0].score   // 已按 score desc 排序
  if maxScore === 0: return [all scores = 0]
  
  for each result:
    normalizedScore = (result.score / maxScore) * 10
    rounded = Math.round(normalizedScore * 10) / 10  // 1 位小数
```

### 示例

```
融合后: [0.0328, 0.0161, 0.0161]
maxScore = 0.0328

result1: (0.0328 / 0.0328) * 10 = 10.0
result2: (0.0161 / 0.0328) * 10 = 4.9
result3: (0.0161 / 0.0328) * 10 = 4.9
```

## Border Cases

| 情况 | 行为 |
|------|------|
| 空结果集 | 直接返回 |
| maxScore = 0 | 所有 score 设为 0 |
| 单结果 | 得分归一化恒为 10.0 |

## 精度

归一化结果保留 1 位小数：`Math.round((ratio * 10) * 10) / 10`

## 调用者

`SearchOrchestrator.search()` → ... → `normalizeScores(fusedRrfResults)` → 返回 Top-K

## 注意事项

- 要求输入结果已按 score 降序排列（RRF 输出已保证降序）
- 归一化不影响排序，仅调整分数量级以提供用户友好的显示
