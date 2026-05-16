export type NodeType = 'system' | 'flow' | 'component' | 'config' | 'api' | 'decision';
export type NodeStatus = 'draft' | 'stable' | 'deprecated';
export interface BaseFrontmatter {
    id: string;
    type: NodeType;
    summary: string;
    tags: string[];
    status: NodeStatus;
    created: string;
    lastModified: string;
    relates?: string[];
}
export interface SystemFrontmatter extends BaseFrontmatter {
    type: 'system';
}
export interface FlowStep {
    order: number;
    component: string;
    description: string;
}
export interface FlowFrontmatter extends BaseFrontmatter {
    type: 'flow';
    trigger?: string;
    steps: FlowStep[];
    result?: string;
}
export interface ComponentFrontmatter extends BaseFrontmatter {
    type: 'component';
    filePath: string;
    language: string;
    exports: string[];
    depends_on?: string[];
}
export interface ConfigFrontmatter extends BaseFrontmatter {
    type: 'config';
    key: string;
    defaultValue?: string;
    required?: boolean;
    envType: 'env' | 'secret' | 'config';
}
export interface ApiFrontmatter extends BaseFrontmatter {
    type: 'api';
    method: string;
    path: string;
    request?: unknown;
    response?: unknown;
    errors?: string[];
}
export interface DecisionOption {
    name: string;
    pros: string[];
    cons: string[];
}
export interface DecisionFrontmatter extends BaseFrontmatter {
    type: 'decision';
    context: string;
    options: DecisionOption[];
    chosen: string;
    reason: string;
}
export type Frontmatter = SystemFrontmatter | FlowFrontmatter | ComponentFrontmatter | ConfigFrontmatter | ApiFrontmatter | DecisionFrontmatter;
export interface KnowledgeNode {
    id: string;
    type: NodeType;
    frontmatter: Frontmatter;
    body: string;
    filePath: string;
}
//# sourceMappingURL=node-types.d.ts.map