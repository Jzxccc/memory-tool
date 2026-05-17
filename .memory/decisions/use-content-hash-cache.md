---
id: decision/use-content-hash-cache
type: decision
summary: Chose SHA256 content-addressed caching for index staleness detection, rejecting mtime-based and manual version tracking approaches
tags: [decision, sha256, cache, staleness, index]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
context: 知识库条目可能由 AI 或人工频繁更新，需要一个可靠的方法检测哪些条目已变更，以避免不必要的全量重建
options:
  - name: File modification time (mtime)
    pros:
      - 零计算开销
      - 适合大型二进制文件
    cons:
      - git checkout / clone 重置 mtime
      - 跨时区/跨系统不可靠
      - 无法区分内容变更和 touch 操作
  - name: Manual version field
    pros:
      - 精确表达语义版本
      - 独立于文件系统
    cons:
      - 需要人工维护（容易遗忘）
      - AI 自动更新内容时容易遗漏版本字段
  - name: SHA256 content hash
    pros:
      - 精确检测任何字节级变更
      - 不受文件系统操作影响
      - 可区分 frontmatter 和 body 变更（双重哈希）
      - GitNexus 已验证此模式
    cons:
      - 每次检查需要读取完整文件并计算哈希
      - 大文件时计算开销显著
chosen: SHA256 content-addressed caching with dual hash (contentHash + frontmatterHash)
reason: 在 AI 辅助工具的场景中，条目内容可能被 AI 频繁修改。SHA256 是唯一能自动、精确地检测任何变更的方案。双重哈希（contentHash + frontmatterHash）的额外设计允许判断是否仅 frontmatter 变更，为未来增量重建提供基础。

## 什么情况下需要重新考虑

- 条目数超过 1000 且全量哈希检查成为性能瓶颈 → 考虑布隆过滤器或增量哈希
- 需要版本历史/diff → 可结合 git history 而非独立维护
