import { describe, it, expect } from 'vitest';
import { MemoryGraph } from './graph.js';

describe('MemoryGraph', () => {
  it('adds and retrieves nodes', () => {
    const graph = new MemoryGraph();
    graph.addNode({ id: 'component/a', type: 'component' });
    graph.addNode({ id: 'component/b', type: 'component' });

    expect(graph.getNode('component/a')).toBeDefined();
    expect(graph.getNodeCount()).toBe(2);
  });

  it('adds edges and queries neighbors', () => {
    const graph = new MemoryGraph();
    graph.addNode({ id: 'component/a', type: 'component' });
    graph.addNode({ id: 'component/b', type: 'component' });

    graph.addEdge({
      from: 'component/a',
      to: 'component/b',
      type: 'depends_on',
      confidence: 1.0,
    });

    const neighbors = graph.getNeighbors('component/a', 'out');
    expect(neighbors.outbound).toHaveLength(1);
    expect(neighbors.outbound[0].type).toBe('depends_on');
  });

  it('traverses BFS with depth limit', () => {
    const graph = new MemoryGraph();
    graph.addNode({ id: 'a', type: 'component' });
    graph.addNode({ id: 'b', type: 'component' });
    graph.addNode({ id: 'c', type: 'component' });
    graph.addNode({ id: 'd', type: 'component' });

    graph.addEdge({ from: 'a', to: 'b', type: 'depends_on', confidence: 1.0 });
    graph.addEdge({ from: 'b', to: 'c', type: 'depends_on', confidence: 1.0 });
    graph.addEdge({ from: 'c', to: 'd', type: 'depends_on', confidence: 1.0 });

    const result = graph.traverseBFS('a', 2, 'out');
    expect(result.nodes.length).toBe(3); // a, b, c (depth 2 from a)
  });

  it('clears all nodes and edges', () => {
    const graph = new MemoryGraph();
    graph.addNode({ id: 'a', type: 'component' });
    graph.addEdge({ from: 'a', to: 'a', type: 'references', confidence: 1.0 });

    graph.clear();
    expect(graph.getNodeCount()).toBe(0);
    expect(graph.getEdgeCount()).toBe(0);
  });
});
