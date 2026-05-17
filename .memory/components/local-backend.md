---
id: component/local-backend
type: component
summary: Unified backend — shared by CLI and MCP server, wraps SearchOrchestrator + FileEngine for search/read/status operations on knowledge base
tags: [backend, facade, unified, shared]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/backend.ts
language: typescript
exports:
  - LocalBackend
depends_on:
  - component/search-orchestrator
  - component/file-engine
  - component/repo-manager
  - component/index-handler
relates: [system/cli, system/mcp, system/core]
---

# LocalBackend 统一后端

为 CLI 和 MCP Server 提供统一的后端接口，封装搜索、读取、状态检查等操作。

## 架构

```
CLI Commands ───┐
                ├──→ LocalBackend
MCP Server  ────┘         │
                          ├── SearchOrchestrator
                          │       └── FileEngine
                          ├── 直接文件 I/O (read)
                          └── Storage APIs (status)
```

## API

| 方法 | 返回 | 说明 |
|------|------|------|
| `search(query, options?)` | `SearchResult[]` | 委托给 SearchOrchestrator |
| `read(id)` | `string \| null` | 直接读取节点 .md 文件 |
| `status()` | 状态报告 | 条目数、类型分布、stale/missing 检查 |

## 构建过程

构造时自动创建 `SearchOrchestrator` 并注册 `FileEngine`：

```typescript
this.orchestrator = new SearchOrchestrator();
this.orchestrator.addEngine(new FileEngine(memoryDir));
```
