export type RelationType = 'contains' | 'flows_through' | 'implements' | 'depends_on' | 'alternative_to' | 'references';
export interface GraphRelationship {
    from: string;
    to: string;
    type: RelationType;
    confidence: number;
    step?: number;
}
export interface GraphFile {
    relationships: GraphRelationship[];
}
//# sourceMappingURL=relation-types.d.ts.map