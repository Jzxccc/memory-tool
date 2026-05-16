import type { GraphRelationship } from '../../types/relation-types.js';
export interface GraphNode {
    id: string;
    type: string;
    data?: unknown;
}
export declare class MemoryGraph {
    private nodes;
    private edges;
    private outEdges;
    private inEdges;
    private edgesByType;
    private idCounter;
    private nextId;
    addNode(node: GraphNode): void;
    addEdge(rel: GraphRelationship): void;
    getNode(id: string): GraphNode | undefined;
    getNeighbors(id: string, direction?: 'in' | 'out' | 'both'): {
        inbound: GraphRelationship[];
        outbound: GraphRelationship[];
    };
    traverseBFS(startId: string, maxDepth: number, direction?: 'in' | 'out' | 'both'): {
        nodes: string[];
        edges: GraphRelationship[];
    };
    getAllNodes(): GraphNode[];
    getNodeCount(): number;
    getEdgeCount(): number;
    clear(): void;
}
//# sourceMappingURL=graph.d.ts.map