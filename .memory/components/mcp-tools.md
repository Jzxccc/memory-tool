---
id: component/mcp-tools
type: component
summary: MCP tool definitions — 5 tools (search, read, graph, status, categories) with OpenAPI-style inputSchema and readOnlyHint annotations
tags: [mcp, tools, schema, definitions]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/mcp/tools.ts
language: typescript
exports:
  - MEMORY_TOOLS
relates: [system/mcp, component/mcp-server]
---

# MCPTools 工具定义

声明 memory-tool 通过 MCP 协议暴露的 5 个工具及其参数模式。

## 导出的变量

| 变量 | 类型 | 内容 |
|------|------|------|
| `MEMORY_TOOLS` | `Tool[]` | 5 个 MCP 工具定义 |

## 工具列表

### memory_search
- **描述**: 搜索项目知识库
- **参数**:
  - `query` (string, required) — 搜索查询，`|`=OR, `&`=AND
  - `category` (enum, optional) — 过滤节点类型
  - `tag` (string, optional) — 过滤标签
  - `top` (integer, default=10) — 最大返回数
- **注解**: `readOnlyHint=true, openWorldHint=true`

### memory_read
- **描述**: 读取知识条目完整内容
- **参数**:
  - `id` (string, required) — 节点 ID (e.g. `component/token-service`)
  - `related` (boolean, optional) — 是否包含关联节点摘要
- **注解**: `readOnlyHint=true`

### memory_graph
- **描述**: 从节点遍历关系图
- **参数**:
  - `id` (string, required) — 节点 ID
  - `depth` (integer, default=1) — 遍历深度
  - `direction` (enum, default='both') — 边方向: `in` | `out` | `both`
- **注解**: `readOnlyHint=true`

### memory_status
- **描述**: 检查知识库健康状态
- **参数**: 无
- **注解**: `readOnlyHint=true`

### memory_categories
- **描述**: 列出所有类别及条目数
- **参数**: 无
- **注解**: `readOnlyHint=true`

## 使用方

`mcp/server.ts` 的 `ListToolsRequestSchema` 处理器直接返回 `MEMORY_TOOLS` 数组。AI 代理（如 CodeBuddy Code）读取此数组来了解可调用的工具及其参数模式。

## 注意事项

- `category` 参数的 enum 值为 6 种节点类型: `system, flow, component, config, api, decision`
- 所有工具均标记 `readOnlyHint=true`（当前不支持写入类 MCP 工具）
- `memory_search` 额外标记 `openWorldHint=true`
