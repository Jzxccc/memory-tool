// MCP tool definitions — 5 tools with annotations and inputSchema.

export const MEMORY_TOOLS = [
  {
    name: 'memory_search',
    description: 'Search project knowledge base. Supports | (OR) and & (AND) operators.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Search query. Use | for OR, & for AND. Bare terms default to AND.'
        },
        category: {
          type: 'string',
          enum: ['system', 'flow', 'component', 'config', 'api', 'decision'],
          description: 'Filter by node type'
        },
        tag: { type: 'string', description: 'Filter by tag' },
        top: { type: 'integer', default: 10, description: 'Max results' }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  {
    name: 'memory_read',
    description: 'Read full content of a knowledge entry with optional related node summaries.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Node ID, e.g. component/token-service' },
        related: { type: 'boolean', description: 'Include related node summaries' }
      },
      required: ['id']
    },
    annotations: { readOnlyHint: true }
  },
  {
    name: 'memory_graph',
    description: 'Traverse relationship graph from a node.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Node ID' },
        depth: { type: 'integer', default: 1, description: 'Traversal depth' },
        direction: {
          type: 'string',
          enum: ['in', 'out', 'both'],
          default: 'both',
          description: 'Edge direction'
        }
      },
      required: ['id']
    },
    annotations: { readOnlyHint: true }
  },
  {
    name: 'memory_status',
    description: 'Check knowledge base health: entry count, type breakdown, staleness.',
    inputSchema: { type: 'object' as const },
    annotations: { readOnlyHint: true }
  },
  {
    name: 'memory_categories',
    description: 'List all knowledge categories with entry counts.',
    inputSchema: { type: 'object' as const },
    annotations: { readOnlyHint: true }
  }
];
