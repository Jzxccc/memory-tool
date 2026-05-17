---
id: component/mcp-server
type: component
summary: MCP stdio server — 5 tool handlers + 3 resource handlers routing to LocalBackend, communicating via StdioServerTransport
tags: [mcp, server, stdio, integration, sdk]
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
relates: [system/mcp]
---

# MCPServer MCP 服务器

MCP stdio 服务器的核心实现，将 AI 代理请求路由到 `LocalBackend`。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `startMCPServer` | `(projectRoot: string) => Promise<void>` | 创建并启动 MCP stdio 服务器 |

## 请求处理器注册

```
Server({name: 'memory-tool', version: '0.1.0'}, {capabilities: {tools, resources}})
```

| MCP 请求 | 处理器 | 行为 |
|----------|--------|------|
| `ListToolsRequestSchema` | 返回 `MEMORY_TOOLS` 数组 | 声明 5 个工具及其 inputSchema |
| `CallToolRequestSchema` | switch(params.name) | 分发到具体工具 |
| `ListResourcesRequestSchema` | 返回 3 个资源 URI | 声明可查询的资源 |
| `ReadResourceRequestSchema` | switch(params.uri) | 分发到具体资源 |

## 工具路由

| 工具名 | 后端调用 | 参数 |
|--------|---------|------|
| `memory_search` | `backend.search(query, {category, tag, top})` | query: string, category?, tag?, top? |
| `memory_read` | `backend.read(id)` | id: string |
| `memory_graph` | （占位） | id: string, depth?, direction? |
| `memory_status` | `backend.status()` | 无 |
| `memory_categories` | `backend.status()` → `.typeCounts` | 无 |

## 资源路由

| URI | 返回数据 |
|-----|---------|
| `memory://categories` | `status.typeCounts` — 各类别条目计数 |
| `memory://status` | 完整状态报告（entryCount, typeCounts, stale, missing） |
| `memory://tags` | 全局标签（占位） |

## 错误处理

- 所有工具处理器包裹在 try/catch 中
- 未找到的条目返回 `{error: "Entry not found: {id}"}`
- 未知工具返回 `isError: true`
- 异常情况返回 `{error: message}`

## 传输

使用 `@modelcontextprotocol/sdk` 的 `StdioServerTransport`，通过标准输入/输出与 AI 代理进程通信。

`server.connect(transport)` 是异步阻塞调用，服务器在此处持续监听 stdin/stdout 直到进程结束。

## 启动方式

```bash
memory mcp  # CLI 子命令
```

或编程调用：
```typescript
import { startMCPServer } from './mcp/server.js';
startMCPServer(process.cwd());
```

## 注意事项

- `memory_graph` 工具当前为占位实现，仅返回提示信息让用户使用 CLI 版本
- `memory://tags` 资源也未完全实现
- 所有 MCP 响应均为 JSON 字符串格式的 `text` 内容
