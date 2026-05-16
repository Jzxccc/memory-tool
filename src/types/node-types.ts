// Six node types for project knowledge representation.
// System nodes serve as service/module boundaries, compatible with
// both monolith (module) and microservice (independent service) projects.

export type NodeType = 'system' | 'flow' | 'component' | 'config' | 'api' | 'decision';

export type NodeStatus = 'draft' | 'stable' | 'deprecated';

export interface BaseFrontmatter {
  id: string; // Format: {type}/{slug}
  type: NodeType;
  summary: string;
  tags: string[];
  status: NodeStatus;
  created: string; // ISO-8601
  lastModified: string; // ISO-8601
  relates?: string[]; // Related node IDs
}

export interface SystemFrontmatter extends BaseFrontmatter {
  type: 'system';
}

export interface FlowStep {
  order: number;
  component: string; // Component node ID
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

export type Frontmatter =
  | SystemFrontmatter
  | FlowFrontmatter
  | ComponentFrontmatter
  | ConfigFrontmatter
  | ApiFrontmatter
  | DecisionFrontmatter;

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  frontmatter: Frontmatter;
  body: string; // Markdown content
  filePath: string; // Path under .memory/
}
