// memory graph <id> — relationship subgraph traversal (layer 3)

import * as path from 'node:path';
import { MemoryGraph } from '../core/graph/graph.js';
import { readGraph } from '../core/graph/graph-io.js';
import { getMemoryDir } from '../storage/repo-manager.js';

export async function graphCommand(id: string, options: {
  depth?: string;
  direction?: string;
}) {
  const projectRoot = process.cwd();
  const memoryDir = getMemoryDir(projectRoot);
  const graphPath = path.join(memoryDir, 'graph.json');

  const graph = readGraph(graphPath);
  if (!graph) {
    console.log('No graph.json found. Run memory rebuild first.');
    return;
  }

  const depth = parseInt(options.depth || '1', 10);
  const direction = (options.direction || 'both') as 'in' | 'out' | 'both';

  const result = graph.traverseBFS(id, depth, direction);

  if (result.edges.length === 0) {
    console.log(`No relationships found for ${id}`);
    return;
  }

  console.log('');
  for (const edge of result.edges) {
    const arrow = edge.from === id ? '──' + edge.type + '──▶' : '◀──' + edge.type + '──';
    const label = edge.from === id
      ? `${edge.from} ${arrow} ${edge.to}`
      : `${edge.to} ${arrow} ${edge.from}`;
    const stepInfo = edge.step ? ` (step ${edge.step})` : '';
    console.log(`  ${label}${stepInfo}`);
  }
  console.log('');
}
