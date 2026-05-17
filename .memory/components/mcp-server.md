---
id: component/mcp-server
type: component
summary: MCP stdio server — registers tool/resource handlers, routes requests to LocalBackend, and communicates via stdio transport
tags: [mcp, server, stdio, integration]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/mcp/server.ts
language: typescript
exports:
  - startMCPServer
depends_on:
  - component/local-backend
  - component/mcp-tools
  - component/mcp-resources
relates: [system/mcp]
---

# MCPServer MCP 服务器

MCP stdio 服务器的核心实现。

## 请求处理

| MCP 请求类型 | 处理器 |
|-------------|--------|
| `ListToolsRequestSchema` | 返回 `MEMORY_TOOLS` 定义 |
| `CallToolRequestSchema` | 路由到具体工具实现 |
| `ListResourcesRequestSchema` | 返回 URI 资源列表 |
| `ReadResourceRequestSchema` | 返回资源内容 |

## 工具路由

`CallToolRequestSchema` 处理器根据 `params.name` 分发：

| 工具名 | 后端方法 | 说明 |
|--------|---------|------|
| `memory_search` | `backend.search()` | 搜索知识库 |
| `memory_read` | `backend.read()` | 读取条目内容 |
| `memory_graph` | （暂为占位） | 图遍历 |
| `memory_status` | `backend.status()` | 健康检查 |
| `memory_categories` | `backend.status()` | 类别统计 |

## 资源 URI

- `memory://categories` — 返回 `status.typeCounts`
- `memory://status` — 返回完整 `status` 报告
- `memory://tags` — 全局标签（占位）

## 传输

使用 `@modelcontextprotocol/sdk` 的 `StdioServerTransport`，通过标准输入/输出与 AI 代理通信。
