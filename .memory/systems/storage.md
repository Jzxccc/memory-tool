---
id: system/storage
type: system
summary: Storage and index management — .memory/ directory management, index.json with SHA256 content-addressed caching, and node file operations
tags: [storage, index, hash, caching, filesystem]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
relates: [system/types, component/repo-manager, component/index-handler, config/storage-constants]
---

# Storage 存储管理系统

负责 `.memory/` 知识库目录的管理，包括目录结构初始化、索引文件读写、节点文件路径解析。

## 组件

| 文件 | 职责 |
|------|------|
| `storage/repo-manager.ts` | 目录管理 — 初始化、子目录结构、路径解析、节点文件列表 |
| `storage/index-handler.ts` | 索引管理 — `index.json` 的读写、SHA256 哈希计算、过时检测 |

## 目录结构

```
.memory/
├── index.json          # 元数据索引（含 SHA256 哈希）
├── graph.json          # 关系图
├── .analyze-dump.json  # 代码分析缓存
├── systems/            # 系统节点
├── flows/              # 流程节点
├── components/         # 组件节点
├── configs/            # 配置节点
├── apis/               # API 节点
└── decisions/          # 决策节点
```

## 索引哈希系统

基于 GitNexus 的内容寻址缓存模式，为每个知识条目维护 `contentHash` 和 `frontmatterHash`，用于检测文件变更（stale 检测）。

## 原子写入

`writeIndex` 使用临时文件 + 重命名模式，确保索引写入的原子性。
