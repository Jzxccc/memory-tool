---
id: system/core
type: system
summary: Core processing engine — source ingestion (scan/extract/dump), graph data structure, and multi-engine search with RRF fusion
tags: [core, ingestion, graph, search, engine]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
relates: [system/cli, system/mcp, system/storage, system/types, component/scanner, component/extractor, component/memory-graph, component/search-orchestrator, component/file-engine, component/local-backend]
---

# Core 核心引擎

Core 系统是 memory-tool 的核心处理引擎，包含三大子系统：

## Ingestion（代码摄入）

负责将源代码转化为结构化符号数据：

- **Scanner** (`scanner.ts`) — 递归扫描项目目录，发现源文件，排除 node_modules/dist 等
- **Extractor** (`extractor.ts`) — 使用 tree-sitter（主）或 regex（fallback）提取符号
- **DumpWriter** (`dump-writer.ts`) — 将分析结果序列化为 `.analyze-dump.json`

## Graph（图数据结构）

- **MemoryGraph** (`graph.ts`) — 基于邻接表的内存图，支持节点/边管理、BFS 遍历
- **GraphIO** (`graph-io.ts`) — 图的 JSON 序列化/反序列化

## Search（搜索引擎）

- **QueryParser** (`query-parser.ts`) — 解析搜索查询字符串为结构化查询
- **FileEngine** (`file-engine.ts`) — 基于文件元数据的搜索引擎，支持加权评分
- **LibsqlEngine** (`libsql-engine.ts`) — 基于 libSQL 的搜索引擎（可选）
- **RRF** (`rrf.ts`) — Reciprocal Rank Fusion 多引擎结果融合算法
- **Scorer** (`scorer.ts`) — 搜索得分归一化
- **SearchOrchestrator** (`orchestrator.ts`) — 多搜索引擎编排，并行分发 + RRF 融合 + 得分归一化

## Backend

- **LocalBackend** (`backend.ts`) — 统一后端接口，由 CLI 和 MCP Server 共用
