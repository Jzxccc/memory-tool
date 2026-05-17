---
id: component/mcp-resources
type: component
summary: MCP resource URI definitions — 6 lightweight data access endpoints (categories, status, tags, entry/{id}, graph/{id}, category/{type})
tags: [mcp, resources, uri, definitions]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/mcp/resources.ts
language: typescript
exports:
  - MEMORY_RESOURCES
relates: [system/mcp, component/mcp-server]
---

# MCPResources 资源定义

声明 memory-tool 通过 MCP 协议暴露的 6 个资源 URI。

## 导出的变量

| 变量 | 类型 | 内容 |
|------|------|------|
| `MEMORY_RESOURCES` | `Resource[]` | 6 个 MCP 资源定义 |

## 资源列表

| URI | 名称 | 描述 |
|-----|------|------|
| `memory://categories` | 所有类别及条目计数 | 返回 6 种节点类型的计数 |
| `memory://category/{type}` | 类别条目列表 | 返回特定类型的所有条目及标签云 |
| `memory://entry/{id}` | 单条目完整内容 | 返回完整 Markdown 内容及 frontmatter |
| `memory://status` | 索引新鲜度报告 | 条目数、类型分布、stale/missing |
| `memory://tags` | 全局标签索引 | 所有标签及频率 |
| `memory://graph/{id}` | 节点关系图 | 节点入边和出边 |

## 实现状态

| URI | 实现 | 备注 |
|-----|------|------|
| `memory://categories` | ✓ | `status.typeCounts` |
| `memory://status` | ✓ | 完整 `status` 报告 |
| `memory://tags` | ✗ | 空占位 |
| `memory://category/{type}` | ✗ | 未实现 |
| `memory://entry/{id}` | ✗ | 未实现 |
| `memory://graph/{id}` | ✗ | 未实现 |

当前 `ReadResourceRequestSchema` 处理器仅实现了 `categories` 和 `status` 两个 URI，其他返回 `{error: 'Resource not found'}`。

## 类型

所有资源返回 `application/json` MIME 类型（MIME type）。

## 注意事项

- 定义在 `resources.ts` 中的 6 个 URI 定义与 `server.ts` 中 `ListResourcesRequestSchema` 返回的 3 个 URI 不完全一致（代码硬编码略有差异）
