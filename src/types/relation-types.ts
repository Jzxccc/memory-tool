// Six directed relationship types between knowledge nodes.

export type RelationType =
  | 'contains'
  | 'flows_through'
  | 'implements'
  | 'depends_on'
  | 'alternative_to'
  | 'references';

export interface GraphRelationship {
  from: string; // Source node ID
  to: string; // Target node ID
  type: RelationType;
  confidence: number; // 0.0 - 1.0
  step?: number; // For flows_through: step order
}

// Graph stored as JSON
export interface GraphFile {
  relationships: GraphRelationship[];
}
