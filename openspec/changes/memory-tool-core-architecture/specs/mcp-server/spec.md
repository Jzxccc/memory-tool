## ADDED Requirements

### Requirement: MCP stdio server with automatic discovery

The system SHALL provide an MCP stdio server that AI programming tools can connect to. The server SHALL be discoverable via a `.mcp.json` file in the project root:

```json
{
  "mcpServers": {
    "memory-tool": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "memory-tool@latest", "mcp"]
    }
  }
}
```

The CLI command `memory mcp` SHALL start the server and connect via stdio transport. All initialization SHALL use dynamic imports to prevent native dependencies from blocking the MCP JSON-RPC stream.

#### Scenario: AI tool discovers MCP server

- **WHEN** an AI programming tool enters a project with `.mcp.json`
- **THEN** it SHALL automatically start `memory mcp` and be able to call memory tools

#### Scenario: Server starts without stdout noise

- **WHEN** `memory mcp` starts
- **THEN** all logging and initialization output SHALL be suppressed from stdout to avoid corrupting the JSON-RPC stream

### Requirement: Five MCP tools with annotations

The MCP server SHALL expose five tools. Each tool SHALL include `annotations` for client-side behavior hints and `inputSchema` for parameter validation.

| Tool | Annotation | Purpose |
|------|-----------|---------|
| `memory_analyze` | `destructiveHint: true` | Extract symbols from source |
| `memory_search` | `readOnlyHint: true`, `openWorldHint: true` | Search knowledge base |
| `memory_read` | `readOnlyHint: true` | Read full entry content |
| `memory_graph` | `readOnlyHint: true` | Traverse relationship graph |
| `memory_status` | `readOnlyHint: true` | Check health and freshness |

#### Scenario: Read-only tools can be auto-approved

- **WHEN** an AI tool calls `memory_search` or `memory_read`
- **THEN** the client MAY auto-approve based on `readOnlyHint: true`

#### Scenario: Analyze tool requires user approval

- **WHEN** an AI tool calls `memory_analyze`
- **THEN** the client SHALL prompt for user approval because the tool lacks `readOnlyHint`

### Requirement: memory_analyze tool - remote symbol extraction

The `memory_analyze` tool SHALL accept an optional `path` parameter and extract language-level symbols from the specified source directory. It SHALL return a summary of discovered symbols (file count, function count, class count, import count) and the path to `.memory/.analyze-dump.json`.

```json
{
  "name": "memory_analyze",
  "inputSchema": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "Source directory to scan. Omit for entire project." }
    }
  }
}
```

#### Scenario: Analyze via MCP

- **WHEN** the AI agent calls `memory_analyze({path: "services/auth-service/"})`
- **THEN** the server SHALL extract symbols from that directory and return `{files: 12, functions: 8, classes: 3, imports: 15}`

### Requirement: memory_search tool - cross-type search

The `memory_search` tool SHALL accept `query` (required), `category`, `tag`, and `top` parameters. It SHALL return ranked results with score, type, id, summary, and tags for each match.

```json
{
  "name": "memory_search",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query. Supports | (OR) and & (AND) operators." },
      "category": { "type": "string", "enum": ["system","flow","component","config","api","decision"] },
      "tag": { "type": "string" },
      "top": { "type": "integer", "default": 10 }
    },
    "required": ["query"]
  }
}
```

#### Scenario: Search via MCP

- **WHEN** the AI agent calls `memory_search({query: "jwt & refresh"})`
- **THEN** the server SHALL return results matching both "jwt" and "refresh"

### Requirement: memory_read tool - full entry content

The `memory_read` tool SHALL accept `id` (required) and `related` (optional boolean). It SHALL return the complete Markdown content, all frontmatter fields, and optionally summaries of related nodes.

```json
{
  "name": "memory_read",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "description": "Node ID, e.g., component/token-service" },
      "related": { "type": "boolean", "description": "Include related node summaries" }
    },
    "required": ["id"]
  }
}
```

#### Scenario: Read with related nodes via MCP

- **WHEN** the AI agent calls `memory_read({id: "component/token-service", related: true})`
- **THEN** the server SHALL return full content plus `depends_on: config/jwt-secret` and `flows_through: flow/login-flow` summaries

### Requirement: memory_graph tool - relationship traversal

The `memory_graph` tool SHALL accept `id` (required), `depth` (default 1), and `direction` (enum: in/out/both, default both). It SHALL return the relationship subgraph.

```json
{
  "name": "memory_graph",
  "inputSchema": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "description": "Node ID" },
      "depth": { "type": "integer", "default": 1 },
      "direction": { "type": "string", "enum": ["in", "out", "both"], "default": "both" }
    },
    "required": ["id"]
  }
}
```

#### Scenario: Graph traversal via MCP

- **WHEN** the AI agent calls `memory_graph({id: "component/token-service", depth: 2, direction: "out"})`
- **THEN** the server SHALL return the 2-hop outgoing subgraph

### Requirement: memory_status tool - health check

The `memory_status` tool SHALL accept no required parameters. It SHALL return entry count, breakdown by type, staleness count, and orphan count.

```json
{
  "name": "memory_status",
  "inputSchema": {
    "type": "object"
  }
}
```

#### Scenario: Status check via MCP

- **WHEN** the AI agent calls `memory_status({})`
- **THEN** the server SHALL return `{entries: 42, stale: 0, orphans: 0}` with type breakdown

### Requirement: Six resource URIs for lightweight data access

The MCP server SHALL expose six resource URIs for lightweight, on-demand data access. Resources SHALL return structured JSON suitable for AI context windows (target: 100-500 tokens each).

| Resource URI | Content |
|-------------|---------|
| `memory://categories` | All six node types with entry counts |
| `memory://category/{type}` | Entry list + tag cloud for one type |
| `memory://entry/{id}` | Full content of one node |
| `memory://status` | Index freshness report |
| `memory://tags` | Global tag index with frequencies |
| `memory://graph/{id}` | Inbound and outbound edge lists for a node |

#### Scenario: List categories via resource

- **WHEN** the AI agent reads `memory://categories`
- **THEN** the server SHALL return `{systems: 4, flows: 8, components: 15, configs: 6, apis: 5, decisions: 4}`

#### Scenario: Read entry via resource

- **WHEN** the AI agent reads `memory://entry/component/token-service`
- **THEN** the server SHALL return the full Markdown content and frontmatter of that node
