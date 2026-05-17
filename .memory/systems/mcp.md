---
id: system/mcp
type: system
summary: MCP server interface — stdio-based Model Context Protocol server exposing search/read/status tools and resources for AI agent integration
tags: [mcp, server, stdio, integration, sdk]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
relates: [system/cli, system/core, component/local-backend, component/mcp-server]
---

# MCP 服务器接口系统

基于 Model Context Protocol 的 stdio 服务器，使 AI 编程助手能够集成 memory-tool 的知识库。

## 组件

| 文件 | 功能 |
|------|------|
| `mcp/server.ts` | MCP stdio 服务器主逻辑，注册工具和资源处理器 |
| `mcp/tools.ts` | MCP 工具定义 (`MEMORY_TOOLS`)，描述可用操作 |
| `mcp/resources.ts` | MCP 资源定义 (`MEMORY_RESOURCES`)，描述可查询的资源 URI |

## MCP 工具

- `memory_search` — 搜索知识库
- `memory_read` — 读取知识条目完整内容
- `memory_graph` — 遍历关系图
- `memory_status` — 检查索引健康状态
- `memory_categories` — 列出所有类别及计数

## MCP 资源

- `memory://categories` — 类别统计 (JSON)
- `memory://status` — 索引新鲜度报告 (JSON)
- `memory://tags` — 全局标签索引 (JSON)

## 架构

`mcp/server.ts` 创建 `LocalBackend` 实例，将 MCP 请求路由到统一后端接口。通过 `StdioServerTransport` 进行通信。
