---
id: system/types
type: system
summary: Type definitions — 6 knowledge node types, relationship definitions, and search type contracts shared across the project
tags: [types, frontmatter, schema, interfaces]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
relates: [system/core, system/storage]
---

# Types 类型定义系统

项目共享的类型定义，为知识节点、关系和搜索提供类型契约。

## 六种节点类型

| 类型 | 用途 | 示例 ID |
|------|------|---------|
| `system` | 系统/服务/模块边界 | `system/cli` |
| `flow` | 端到端业务流程 | `flow/code-analysis` |
| `component` | 具体代码实现单元 | `component/scanner` |
| `config` | 配置项或环境变量 | `config/storage-constants` |
| `api` | API 端点或服务接口 | `api/memory-search` |
| `decision` | 技术决策及权衡 | `decision/use-tree-sitter` |

## 状态定义

- `draft` — 自动生成，待人工审核
- `stable` — 已审核通过
- `deprecated` — 已废弃

## 核心接口

- `BaseFrontmatter` — 所有节点共享的基础字段（id, type, summary, tags, status, etc.）
- `SystemFrontmatter`, `FlowFrontmatter`, `ComponentFrontmatter` 等 — 各类型的专用字段
- `GraphRelationship` — 关系图中的边定义
- `SearchEngine`, `ParsedQuery`, `SearchResult` — 搜索系统契约
