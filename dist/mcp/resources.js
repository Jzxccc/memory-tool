// MCP resource URI definitions — 6 lightweight data access endpoints.
export const MEMORY_RESOURCES = [
    {
        uri: 'memory://categories',
        name: 'All categories with entry counts',
        description: 'Returns counts for all 6 node types: system, flow, component, config, api, decision',
        mimeType: 'application/json',
    },
    {
        uri: 'memory://category/{type}',
        name: 'Category entry list',
        description: 'Returns entry list and tag cloud for a specific node type',
        mimeType: 'application/json',
    },
    {
        uri: 'memory://entry/{id}',
        name: 'Single entry full content',
        description: 'Returns complete Markdown content and frontmatter for one node',
        mimeType: 'application/json',
    },
    {
        uri: 'memory://status',
        name: 'Index freshness report',
        description: 'Returns entry count, type breakdown, stale and missing entries',
        mimeType: 'application/json',
    },
    {
        uri: 'memory://tags',
        name: 'Global tag index',
        description: 'Returns all tags across all entries with frequencies',
        mimeType: 'application/json',
    },
    {
        uri: 'memory://graph/{id}',
        name: 'Node relationship chart',
        description: 'Returns inbound and outbound edges for a node',
        mimeType: 'application/json',
    },
];
//# sourceMappingURL=resources.js.map