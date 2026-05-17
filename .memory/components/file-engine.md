---
id: component/file-engine
type: component
summary: File-based keyword search engine — capabilities=['keyword'], priority=1, reads .md files with weighted field matching, implements SearchEngine interface
tags: [search, file, engine, keyword]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/engines/file.ts
language: typescript
exports:
  - FileEngine
depends_on:
  - system/types
  - component/repo-manager
relates: [system/core, component/search-orchestrator, component/search-registry]
---

# FileEngine 文件搜索引擎

实现扩展的 `SearchEngine` 接口，作为 baseline keyword 引擎。

## 引擎元数据

| 属性 | 值 |
|------|-----|
| name | `file` |
| capabilities | `['keyword']` |
| priority | `1` (默认低于 LibsqlEngine) |

## healthCheck

检查 `.memory/` 目录是否存在。FileEngine 只要目录存在就是健康的。

## 评分权重

| 匹配区域 | 权重 |
|----------|------|
| ID_MATCH | 5.0 |
| SUMMARY_MATCH | 3.0 |
| TAG_MATCH | 1.0 |
| BODY_OCCURRENCE | 0.5 |

## 注册方式

通过 `defaultSearchEngineRegistry()` 工厂函数自动注册，或在 `SearchEngineRegistry` 中手动注册。始终作为 baseline 引擎可用。
