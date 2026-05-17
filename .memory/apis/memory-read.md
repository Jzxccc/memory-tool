---
id: api/memory-read
type: api
summary: MCP tool — read full Markdown content of a knowledge entry (body only, frontmatter excluded per progressive disclosure design)
tags: [api, mcp, read, tool]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
method: MCP tool call
path: memory_read
relates: [system/mcp, component/mcp-server, api/memory-search]
---

# memory_read

读取知识条目完整内容的 MCP 工具。

## 请求

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `id` | string | 是 | - | 节点 ID，格式 `type/slug`，如 `component/scanner` |
| `related` | boolean | 否 | - | 是否包含关联节点摘要 |

## 响应

返回 `.md` 文件的 Markdown body 内容（不含 frontmatter，遵循 progressive disclosure 设计）。

```json
{ "body": "# Scanner\n\n递归扫描项目目录..." }
```

## 实现

`mcp/server.ts` → `backend.read(id)` → `getNodeFilePath(memoryDir, id)` → `fs.readFileSync` → 返回原始内容。

不解析或剥离 frontmatter（与 CLI 的 `read` 命令不同，CLI 会剥离 frontmatter）。

## 错误

| 条件 | 响应 |
|------|------|
| 条目不存在 | `{content: [{type: 'text', text: '{"error": "Entry not found: {id}"}'}]}` |
| 文件读取失败 | `{content: [{type: 'text', text: 'Error: ...'}], isError: true}` |

## 调用方

- AI agents (通过 MCP 协议)
- `memory read <id>` CLI 命令（独立实现，会剥离 frontmatter）

## 注解

- `readOnlyHint: true` — 只读操作
- `related` 参数当前未在 server.ts 中实现（TODO）
