---
id: api/memory-categories
type: api
summary: MCP tool — list all knowledge categories with entry counts, returns typeCounts breakdown
tags: [api, mcp, categories]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
method: MCP tool call
path: memory_categories
relates: [system/mcp, component/mcp-server, api/memory-status]
---

# memory_categories

列出所有知识类别及条目计数的 MCP 工具。功能上等同于 `memory_status` 的 `typeCounts` 子集。

## 请求

无参数。

## 响应

```json
{
  "system": 5,
  "flow": 2,
  "component": 9,
  "config": 1,
  "api": 0,
  "decision": 0
}
```

## 实现

`mcp/server.ts` → `backend.status()` → `.typeCounts`

底层实现在 `backend.status()` 中：
1. `listNodeFiles(memoryDir)` → 获取文件列表
2. `parseNodeId(file)` → 提取 type
3. 按 type 分组计数

## 调用方

- AI agents (通过 MCP 协议)
- MCP 资源 `memory://categories`

## 注解

- `readOnlyHint: true` — 只读操作
- 本质上是 `memory_status` 的轻量版
