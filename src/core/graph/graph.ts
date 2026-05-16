// In-memory knowledge graph with multi-index lookup.
// Supports addNode, addEdge, getNeighbors, and BFS traversal.

import type { GraphRelationship, RelationType } from '../../types/relation-types.js';

export interface GraphNode {
  id: string;
  type: string;
  data?: unknown;
}

export class MemoryGraph {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphRelationship>();
  private outEdges = new Map<string, Set<string>>(); // nodeId → edgeIds going OUT
  private inEdges = new Map<string, Set<string>>(); // nodeId → edgeIds coming IN
  private edgesByType = new Map<RelationType, Map<string, GraphRelationship>>();
  private idCounter = 0;

  private nextId(): string {
    return `e${++this.idCounter}`;
  }

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(rel: GraphRelationship): void {
    const id = this.nextId();
    this.edges.set(id, rel);

    // Outgoing index
    if (!this.outEdges.has(rel.from)) {
      this.outEdges.set(rel.from, new Set());
    }
    this.outEdges.get(rel.from)!.add(id);

    // Incoming index
    if (!this.inEdges.has(rel.to)) {
      this.inEdges.set(rel.to, new Set());
    }
    this.inEdges.get(rel.to)!.add(id);

    // Type index
    if (!this.edgesByType.has(rel.type)) {
      this.edgesByType.set(rel.type, new Map());
    }
    this.edgesByType.get(rel.type)!.set(id, rel);
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getNeighbors(id: string, direction: 'in' | 'out' | 'both' = 'both'): {
    inbound: GraphRelationship[];
    outbound: GraphRelationship[];
  } {
    const inbound: GraphRelationship[] = [];
    const outbound: GraphRelationship[] = [];

    if (direction === 'in' || direction === 'both') {
      const inSet = this.inEdges.get(id);
      if (inSet) {
        for (const edgeId of inSet) {
          const edge = this.edges.get(edgeId);
          if (edge) inbound.push(edge);
        }
      }
    }

    if (direction === 'out' || direction === 'both') {
      const outSet = this.outEdges.get(id);
      if (outSet) {
        for (const edgeId of outSet) {
          const edge = this.edges.get(edgeId);
          if (edge) outbound.push(edge);
        }
      }
    }

    return { inbound, outbound };
  }

  traverseBFS(startId: string, maxDepth: number, direction: 'in' | 'out' | 'both' = 'both'): {
    nodes: string[];
    edges: GraphRelationship[];
  } {
    const visited = new Set<string>();
    const edgeSet = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];
    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const { inbound, outbound } = this.getNeighbors(current.id, direction);

      for (const edge of [...inbound, ...outbound]) {
        const neighborId = edge.from === current.id ? edge.to : edge.from;
        const key = `${edge.from}->${edge.to}:${edge.type}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edgeSet.add(key); // Track edge
        }
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }
      }
    }

    // Collect all edges that connect visited nodes
    const edges: GraphRelationship[] = [];
    for (const [_, edge] of this.edges) {
      if (
        visited.has(edge.from) &&
        visited.has(edge.to) &&
        (direction === 'both' ||
          (direction === 'out' && edge.from === startId) ||
          true)
      ) {
        edges.push(edge);
      }
    }

    return {
      nodes: Array.from(visited),
      edges: edges.slice(0, 100), // Cap edges at 100 to prevent overflow
    };
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getNodeCount(): number {
    return this.nodes.size;
  }

  getEdgeCount(): number {
    return this.edges.size;
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.outEdges.clear();
    this.inEdges.clear();
    this.edgesByType.clear();
    this.idCounter = 0;
  }
}
