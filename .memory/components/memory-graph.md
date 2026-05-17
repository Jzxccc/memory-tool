---
id: component/memory-graph
type: component
summary: In-memory adjacency-list graph for knowledge node relationships — supports node/edge CRUD, BFS traversal, and JSON serialization
tags: [graph, adjacency-list, traversal, bfs, data-structure]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/graph/graph.ts
language: typescript
exports:
  - MemoryGraph
depends_on:
  - system/types
relates: [system/core, component/graph-io]
---

# MemoryGraph 内存图数据结构

基于邻接表（Adjacency List）实现的内存图，用于表示知识节点间的关系。

## 数据结构

```
Map<id, GraphNode>      // 节点存储
Map<id, GraphEdge[]>    // 邻接表边
```

## 核心 API

| 方法 | 功能 |
|------|------|
| `nextId()` | 生成递增的节点 ID |
| `addNode(node)` | 添加节点 |
| `addEdge(edge)` | 添加边并更新邻接表 |
| `getNode(id)` | 获取节点 |
| `getNeighbors(id)` | 获取相邻节点 |
| `traverseBFS(fromId, maxDepth, direction)` | BFS 遍历，支持 `in`/`out`/`both` 方向 |
| `getAllNodes()` | 获取所有节点 |
| `getNodeCount()` / `getEdgeCount()` | 计数统计 |
| `clear()` | 清空图 |

## 序列化

通过 `GraphIO` (`graph-io.ts`) 进行 JSON 序列化/反序列化，保存于 `.memory/graph.json`。
