---
id: decision/use-rrf-fusion
type: decision
summary: Chose Reciprocal Rank Fusion (K=60) for multi-engine search result merging, rejecting score normalization and round-robin approaches
tags: [decision, rrf, search, fusion, ranking]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
context: 搜索系统设计为多引擎架构 (FileEngine + 可扩展的 LibsqlEngine)，需要一个标准化的方法来融合来自不同引擎的排序结果
options:
  - name: Score normalization only
    pros:
      - 简单，只需归一化各引擎分数
      - 实现最轻量
    cons:
      - 要求各引擎分数具有可比较性（不现实）
      - FileEngine 的手动加权分和 LibsqlEngine 的 BM25 分不在同一量级
      - 引擎间不可比时会产生失真排序
  - name: Round-robin interleaving
    pros:
      - 保证各引擎结果都出现在最终列表中
      - 实现简单
    cons:
      - 完全忽略引擎内排序信息
      - 丢失搜索精度，相关性差的也会排到前面
  - name: Reciprocal Rank Fusion (RRF)
    pros:
      - 不需要引擎间分数可比性
      - K=60 为学术界验证的经验常数
      - 跨引擎加强高频出现的条目
      - GitNexus 已验证此方案
    cons:
      - 计算 O(n×m) (n=引擎数, m=结果数)
      - 纯桶排序，损失少数引擎独有的高质量项
chosen: Reciprocal Rank Fusion (K=60)
reason: RRF 是多引擎搜索融合的业界标准方案，已在 GitNexus 中验证。其最大的优势是不要求引擎间分数可比性，完美适应 FileEngine（手动加权分）和 LibsqlEngine（BM25 分）混合的场景。K=60 作为研究验证的经验常数，无需额外调参。

## 什么情况下需要重新考虑

- 增加到 5+ 个搜索引擎时 O(n×m) 性能成为瓶颈 → 考虑限流或采样
- 需要引入学习型排序 (LTR) → RRF 作为第一阶段粗排，LTR 精排
- 搜索引擎的分数量级变得可比 → 可以结合 RRF + 分数加权的混合方案
