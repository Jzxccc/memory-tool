---
id: component/repo-manager
type: component
summary: Repository directory manager — initializes .memory/ structure, resolves node file paths, parses node IDs, and lists all knowledge entries
tags: [storage, directory, filesystem, paths]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/storage/repo-manager.ts
language: typescript
exports:
  - getMemoryDir
  - getSubdir
  - getNodeFilePath
  - parseNodeId
  - initMemoryDir
  - listNodeFiles
  - getFilePath
relates: [system/storage, config/storage-constants, component/index-handler]
---

# RepoManager 仓库目录管理器

管理 `.memory/` 知识库目录的完整生命周期。

## 目录常量

| 常量 | 值 | 说明 |
|------|------|------|
| `MEMORY_DIR` | `.memory` | 知识库根目录名 |
| `SUBDIRS` | `['systems', 'flows', 'components', 'configs', 'apis', 'decisions']` | 六种子目录 |
| `MEMORY_FILES` | `{INDEX, GRAPH, ANALYZE_DUMP, CONFIG}` | 核心文件名映射 |

## API

| 函数 | 功能 |
|------|------|
| `getMemoryDir(root)` | 获取 `.memory/` 绝对路径 |
| `getSubdir(memoryDir, type)` | 获取类型子目录路径 |
| `getNodeFilePath(memoryDir, id)` | 将 `type/slug` id 转为 `types/slug.md` 路径 |
| `parseNodeId(filePath)` | 从文件路径逆向解析出 node id |
| `initMemoryDir(root)` | 创建 `.memory/` 及所有子目录 |
| `listNodeFiles(memoryDir)` | 列出所有 `.md` 知识文件 |
| `getFilePath(memoryDir, filename)` | 获取 `.memory/` 下指定文件路径 |

## ID 格式

`type/slug`（如 `system/cli`, `component/scanner`），文件存储路径为 `types/slug.md`。
