---
id: component/file-engine
type: component
summary: File-based search engine — reads .md knowledge files directly, scores by weighted field matching (title, tags, summary, body), and filters by category/tag
tags: [search, file, engine, scoring, markdown]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/file-engine.ts
language: typescript
exports:
  - FileEngine
depends_on:
  - system/types
  - component/repo-manager
relates: [system/core, component/search-orchestrator, component/query-parser, flow/knowledge-search]
---

# FileEngine 文件搜索引擎

直接读取 `.memory/` 下的 `.md` 知识文件进行搜索，不需要额外的数据库依赖。

## 评分机制 (WEIGHTS)

文件搜索引擎为不同字段分配不同的匹配权重：

- **title** — 最高权重（文件名/标题匹配）
- **tags** — 标签精确匹配
- **summary** — 摘要描述匹配
- **body** — 正文内容全文匹配

## 搜索流程

```
listNodeFiles(memoryDir)
  → 读取每个 .md 文件
  → extractFrontmatter() + parseFrontmatter()
  → matchTerm() 关键字匹配
  → scoreFile() 加权评分
  → 按 category/tag 过滤
  → 排序返回
```

## 文件解析

使用简单的字符串分割 (`---` 分隔符) 提取 frontmatter 和正文，不依赖 YAML 解析库。

## 引擎协议

实现 `SearchEngine` 接口，由 `SearchOrchestrator` 统一调度。
