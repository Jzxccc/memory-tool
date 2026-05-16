// Reads and writes `graph.json` — serialized relationship graph.

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GraphRelationship } from '../../types/relation-types.js';
import { MemoryGraph } from './graph.js';

export function readGraph(graphPath: string): MemoryGraph | null {
  if (!fs.existsSync(graphPath)) return null;
  try {
    const raw = fs.readFileSync(graphPath, 'utf-8');
    const data = JSON.parse(raw);
    const graph = new MemoryGraph();
    for (const rel of data.relationships || []) {
      graph.addEdge(rel as GraphRelationship);
    }
    return graph;
  } catch {
    return null;
  }
}

export function writeGraph(graphPath: string, graph: MemoryGraph): void {
  const dir = path.dirname(graphPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const relationships: GraphRelationship[] = [];
  const allNodes = graph.getAllNodes();
  for (const node of allNodes) {
    const neighbors = graph.getNeighbors(node.id, 'out');
    relationships.push(...neighbors.outbound);
  }

  const data = { relationships };
  const tmpPath = graphPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, graphPath);
}
