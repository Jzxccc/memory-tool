---
id: component/graph-io
type: component
summary: Graph JSON serialization — reads/writes graph.json with atomic file writes, reconstructs MemoryGraph from serialized relationships
tags: [graph, io, serialization, json]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/graph/graph-io.ts
language: typescript
exports:
  - readGraph
  - writeGraph
depends_on:
  - component/memory-graph
relates: [system/core, system/storage]
---

# GraphIO 图序列化

内存图 `graph.json` 文件的读写。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `readGraph` | `(graphPath: string) => MemoryGraph \| null` | 从 graph.json 读入并重建 MemoryGraph |
| `writeGraph` | `(graphPath: string, graph: MemoryGraph) => void` | 将 MemoryGraph 序列化写入 graph.json |

## 序列化流程

### writeGraph

```
1. 遍历所有节点 → 获取每个节点的出边
2. 收集所有 GraphRelationship[] → 去重
3. 写入 { relationships: [...] }
4. 原子写入: tmpPath → renameSync(graphPath)
```

### readGraph

```
1. 读取 graph.json
2. 解析 JSON → { relationships: GraphRelationship[] }
3. 创建 MemoryGraph() → 逐条 addEdge()
```

## 原子写入

与 `writeIndex` 相同的保护策略：先写 `.tmp` 文件，再 `renameSync` 到目标路径，防止中途中断导致文件损坏。

## 调用者

- `cli/rebuild.ts` → `writeGraph(graphPath, graph)` — 重建索引时写入
- `cli/graph.ts` → `readGraph(graphPath)` — 图遍历时读取

## 注意事项

- 写入时 `graph.getAllNodes()` 遍历所有节点收集出边，可能产生重复边（同一 `{from, to, type}` 组合），但图本身基于 edgeId 唯一
- 读入时自动重建节点的 adj 索引（因为每条边都走 `addEdge()`
- 文件不存在或损坏时 `readGraph` 返回 `null`，调用方需检查
