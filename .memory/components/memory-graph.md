---
id: component/memory-graph
type: component
summary: In-memory adjacency-list graph with multi-index lookup — supports node/edge CRUD, BFS traversal (depth-limited), and 3-direction neighbor queries via outEdges/inEdges Maps
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

基于邻接表的图实现，支持多索引查找和 BFS 遍历。

## 内部索引结构

```
Map<id, GraphNode>                          // 节点存储
Map<edgeId, GraphRelationship>              // 边存储
Map<nodeId, Set<edgeId>>    (outEdges)     // 出边索引
Map<nodeId, Set<edgeId>>    (inEdges)      // 入边索引
Map<RelationType, Map<edgeId, GraphRelationship>>  // 类型索引
```

## 导出的方法

| 方法 | 签名 | 作用 |
|------|------|------|
| `addNode` | `(node: GraphNode) => void` | 添加节点 |
| `addEdge` | `(rel: GraphRelationship) => void` | 添加边，同时更新 out/in/type 三个索引 |
| `getNode` | `(id) => GraphNode \| undefined` | 按 ID 获取节点 |
| `getNeighbors` | `(id, direction) => {inbound, outbound}` | 获取邻边，支持 in/out/both |
| `traverseBFS` | `(startId, maxDepth, direction) => {nodes, edges}` | BFS 层序遍历，深度限制 |
| `getAllNodes` | `() => GraphNode[]` | 返回所有节点 |
| `getNodeCount` | `() => number` | 节点数 |
| `getEdgeCount` | `() => number` | 边数 |
| `clear` | `() => void` | 清空所有数据 |

## BFS 遍历细节

```
traverseBFS(startId, maxDepth, direction):
  queue = [{id: startId, depth: 0}]
  visited = {startId}
  
  while queue not empty:
    current = queue.shift()
    if current.depth >= maxDepth: continue
    
    neighbors = getNeighbors(current.id, direction)
    for each neighbor:
      if not visited:
        visited.add(neighbor)
        queue.push({id: neighbor, depth: current.depth + 1})
  
  # 收集连接 visited 节点中任意两个节点的边
  edges = filter(connected within visited)
```

- **深度控制**: 层级递增，达到 `maxDepth` 后不再将邻节点入队
- **边收集**: BFS 遍历结束后，收集所有两端均在 visited 集合中的边
- **边数量上限**: `edges.slice(0, 100)` 防止超大规模图溢出

## 边的方向性

- `in` — 仅收集 `inEdges`（谁指向我）
- `out` — 仅收集 `outEdges`（我指向谁）
- `both` — 双向

## 注意事项

- 边 ID 使用递增计数器 `e1, e2, e3...`（预置 `e` 前缀）
- `clear()` 清空所有 5 个 Map 和 idCounter
- traverseBFS 的内部边收集逻辑对 `both` 方向会收集所有 visited 节点间的边，对 `out` 方向只收集从 startId 出发的边
