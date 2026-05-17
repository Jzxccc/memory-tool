---
id: api/memory-search
type: api
summary: MCP tool — search project knowledge base with boolean operators, type/tag filtering, ranked by relevance score 0-10
tags: [api, mcp, search, tool]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
method: MCP tool call
path: memory_search
relates: [system/mcp, component/mcp-server, component/search-orchestrator, api/memory-read, api/memory-status]
---

# memory_search

搜索知识库的 MCP 工具。

## 请求

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `query` | string | 是 | - | 搜索查询，`\|`=OR, `&`=AND |
| `category` | enum | 否 | - | system/flow/component/config/api/decision |
| `tag` | string | 否 | - | 按标签过滤 |
| `top` | integer | 否 | 10 | 最大返回结果数 |

## 响应

```json
[
  {
    "id": "system/cli",
    "type": "system",
    "summary": "CLI command interface...",
    "tags": ["cli", "commander"],
    "score": 10.0,
    "source": "file"
  }
]
```

`score` 为归一化后的 0-10 分。

## 实现

`mcp/server.ts` → `backend.search(query, {category, tag, top})` → `SearchOrchestrator.search()` → 并行 FileEngine + 可选 LibsqlEngine → RRF 融合 → Scorer 归一化。

## 错误

| 条件 | 响应 |
|------|------|
| 无结果 | `[]` (空数组) |
| 后端错误 | `{content: [{type: 'text', text: 'Error: ...'}], isError: true}` |

## 调用方

- AI agents (通过 MCP 协议)
- `memory search` CLI 命令（独立实现，未通过 MCP）

## 注解

- `readOnlyHint: true` — 只读操作
- `openWorldHint: true` — 表示存在非本地信息源
