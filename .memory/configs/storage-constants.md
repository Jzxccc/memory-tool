---
id: config/storage-constants
type: config
summary: Storage paths and directory structure constants — .memory/ root, 6 subdirectories, core file names (index.json, graph.json, etc.)
tags: [config, storage, paths, constants]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
key: MEMORY_DIR / SUBDIRS / MEMORY_FILES
defaultValue: .memory/ (root)
required: true
envType: config
relates: [system/storage, component/repo-manager]
---

# Storage Constants 存储常量

定义 memory-tool 知识库的目录结构和核心文件名。

## 配置项

| 常量 | 文件 | 值 | 说明 |
|------|------|-----|------|
| `MEMORY_DIR` | `storage/repo-manager.ts` | `.memory` | 知识库根目录 |
| `SUBDIRS` | `storage/repo-manager.ts` | `['systems','flows','components','configs','apis','decisions']` | 六种节点子目录 |
| `MEMORY_FILES.INDEX` | `storage/repo-manager.ts` | `index.json` | 元数据索引文件 |
| `MEMORY_FILES.GRAPH` | `storage/repo-manager.ts` | `graph.json` | 关系图文件 |
| `MEMORY_FILES.ANALYZE_DUMP` | `storage/repo-manager.ts` | `.analyze-dump.json` | 代码分析缓存 |
| `MEMORY_FILES.CONFIG` | `storage/repo-manager.ts` | `config.toml` | 项目配置 |
| `SCHEMA_VERSION` | `storage/index-handler.ts` | `1` | 索引模式版本 |
| `DEFAULT_EXCLUDES` | `core/ingestion/scanner.ts` | `[node_modules, dist, build, .git, ...]` | 扫描排除目录 |
| `SOURCE_EXTENSIONS` | `core/ingestion/scanner.ts` | `Set<.ts, .js, .py, .go, ...>` | 支持的源文件扩展名 |
