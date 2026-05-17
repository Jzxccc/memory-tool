---
id: component/rrf
type: component
summary: Reciprocal Rank Fusion (K=60) — combines multiple ranked result lists from different search engines into a single fused ranking
tags: [search, rrf, fusion, ranking, algorithm]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/rrf.ts
language: typescript
exports:
  - reciprocalRankFusion
depends_on:
  - system/types
relates: [system/core, component/search-orchestrator, flow/knowledge-search]
---

# RRF 互逆排序融合

使用 Reciprocal Rank Fusion 算法将多个搜索引擎的排序结果融合为单一排序。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `reciprocalRankFusion` | `(rankedLists: SearchResult[][]) => SearchResult[]` | 融合多个排序列表 |

## 算法详情

```
RRF Score = Σ 1 / (K + rank_i)

其中:
  K = 60 (经验常数)
  rank_i = 第 i 个引擎中该结果的排名 (1-indexed, 即排名第 1 → rank=1)
```

### 计算过程

```
1. 初始化 Map<resultId, {score: 0, result}>
2. 遍历每个引擎的结果列表:
   for rank=0 to n-1:
     rrfScore = 1 / (K + rank + 1)
     累加或设置 score
3. 按 RRF 总分降序排列
```

### 示例

```
引擎A: [resultX(rank1), resultY(rank2)]
引擎B: [resultX(rank1), resultZ(rank2)]

resultX: 1/(60+1) + 1/(60+1) = 0.0164 + 0.0164 = 0.0328
resultY: 1/(60+2) = 0.0161
resultZ: 1/(60+2) = 0.0161

最终排名: resultX > resultY = resultZ
```

## 退化情况

| 输入 | 行为 |
|------|------|
| 空列表 | 返回 `[]` |
| 单个列表 | 直通返回（无融合） |
| 多列表中同一结果 | 累加 RRF 分数 |

## K=60 的选择

学术研究验证的经验常数，来自 GitNexus 的实现。K 值控制高排名结果的权重差异：较小的 K 放大了高排名差异，较大的 K 减小差异。

## 调用者

`SearchOrchestrator.search()` → `reciprocalRankFusion(engineResults)` → `normalizeScores(fused)`

## 注意事项

- 融合后的结果 score 是原始 RRF 分数（小数），后续需要 `scorer.ts` 归一化到 0-10
- RRF 不要求引擎间的分数可比性（这是其关键优势）
- 结果对象在融合时使用浅拷贝 `{ ...result }`
