---
id: api/memory-status
type: api
summary: MCP tool — check knowledge base health: entry count, type breakdown (system/flow/component/config/api/decision), staleness, and last index time
tags: [api, mcp, status, health]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
method: MCP tool call
path: memory_status
relates: [system/mcp, component/mcp-server, component/index-handler]
---

# memory_status

检查知识库健康状态的 MCP 工具。

## 请求

无参数。

## 响应

```json
{
  "entryCount": 17,
  "typeCounts": {
    "system": 5,
    "flow": 2,
    "component": 9,
    "config": 1,
    "api": 0,
    "decision": 0
  },
  "stale": [],
  "missing": []
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `entryCount` | number | 知识条目总数 |
| `typeCounts` | Record | 6 种类型的条目计数 |
| `stale` | string[] | 内容已变更的条目 ID（SHA256 不匹配） |
| `missing` | string[] | 索引中有但文件已删除的条目 ID |

## 实现

`mcp/server.ts` → `backend.status()` → 

```
1. listNodeFiles(memoryDir) → 统计文件数
2. parseNodeId() → 按类型分组计数
3. readIndex(indexPath) → checkStale(index, memoryDir) → SHA256 对比
```

## 错误

| 条件 | 响应 |
|------|------|
| 无 index.json | 不报错，返回 `stale: [], missing: []`（由 `readIndex` 返回 null, `checkStale` 不调用） |

## 调用方

- AI agents (通过 MCP 协议)
- `memory status` CLI 命令（独立实现）
- MCP 资源 `memory://status`

## 注解

- `readOnlyHint: true` — 只读操作
