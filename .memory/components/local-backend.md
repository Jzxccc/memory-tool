---
id: component/local-backend
type: component
summary: Unified backend — creates SearchOrchestrator with defaultSearchEngineRegistry (FileEngine + HybridSearch + LibsqlEngine), search supports strategy param
tags: [backend, facade, unified, registry]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/backend.ts
language: typescript
exports:
  - LocalBackend
  - defaultSearchEngineRegistry
depends_on:
  - component/search-orchestrator
  - component/search-registry
  - component/file-engine
  - component/libsql-engine
  - component/hybrid-search
relates: [system/cli, system/mcp, system/core]
---

# LocalBackend 统一后端

重构后使用 `SearchEngineRegistry` 进行引擎管理。

## API

| 方法 | 新增 | 说明 |
|------|------|------|
| `search(query, options?)` | ✓ strategy 参数 | 支持 keyword/semantic/hybrid/auto |
| `read(id)` | - | 读取条目内容 |
| `status()` | - | 健康检查报告 |

## defaultSearchEngineRegistry

工厂函数，注册默认引擎组合：
```
FileEngine (keyword, priority=1)     ← 始终可用
HybridSearch (keyword engine only)   ← 当前阶段 keyword only
LibsqlEngine (keyword, priority=0)   ← 需要 .memory/memory.db
```

仅在数据库文件存在时 LibsqlEngine 通过健康检查。
