// MCP stdio server — tools + resources for AI agent integration.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { MEMORY_TOOLS } from './tools.js';
import { LocalBackend } from '../core/backend.js';
export async function startMCPServer(projectRoot) {
    const backend = new LocalBackend(projectRoot);
    const server = new Server({ name: 'memory-tool', version: '0.1.0' }, { capabilities: { tools: {}, resources: {} } });
    // List tools
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: MEMORY_TOOLS
    }));
    // Call tools
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: rawArgs } = request.params;
        const args = (rawArgs || {});
        try {
            switch (name) {
                case 'memory_search': {
                    const results = await backend.search(args.query, {
                        category: args.category,
                        tag: args.tag,
                        top: args.top || 10,
                    });
                    return {
                        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
                    };
                }
                case 'memory_read': {
                    const id = args.id;
                    const content = await backend.read(id);
                    if (!content) {
                        return {
                            content: [{ type: 'text', text: JSON.stringify({ error: `Entry not found: ${id}` }) }]
                        };
                    }
                    return {
                        content: [{ type: 'text', text: content }]
                    };
                }
                case 'memory_graph': {
                    // Graph traversal via backend
                    const result = { nodes: [], edges: [], message: 'Graph traversal available via CLI: memory graph <id>' };
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
                    };
                }
                case 'memory_status': {
                    const status = await backend.status();
                    return {
                        content: [{ type: 'text', text: JSON.stringify(status, null, 2) }]
                    };
                }
                case 'memory_categories': {
                    const status = await backend.status();
                    return {
                        content: [{ type: 'text', text: JSON.stringify(status.typeCounts, null, 2) }]
                    };
                }
                default:
                    return {
                        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                        isError: true
                    };
            }
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error}` }],
                isError: true
            };
        }
    });
    // List resources
    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: [
            { uri: 'memory://categories', name: 'All categories with counts', mimeType: 'application/json' },
            { uri: 'memory://status', name: 'Index freshness report', mimeType: 'application/json' },
            { uri: 'memory://tags', name: 'Global tag index', mimeType: 'application/json' },
        ]
    }));
    // Read resources
    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        if (uri === 'memory://categories' || uri === 'memory://status') {
            const status = await backend.status();
            const data = uri === 'memory://categories' ? status.typeCounts : status;
            return {
                contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }]
            };
        }
        return {
            contents: [{ uri, mimeType: 'application/json', text: JSON.stringify({ error: 'Resource not found' }) }]
        };
    });
    // Connect transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
//# sourceMappingURL=server.js.map