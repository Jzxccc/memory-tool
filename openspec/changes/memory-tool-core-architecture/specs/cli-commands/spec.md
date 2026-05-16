## ADDED Requirements

### Requirement: CLI entry point with lazy-loaded commands

The CLI SHALL use Commander.js with a `createLazyAction` pattern that dynamically imports command modules only when invoked. This ensures minimal startup time regardless of the number of registered commands.

Seven commands SHALL be registered: `analyze`, `search`, `read`, `status`, `rebuild`, `audit`, `graph`.

#### Scenario: CLI starts instantly

- **WHEN** the user runs `memory --help`
- **THEN** the system SHALL display all 7 commands without loading any command implementation modules

#### Scenario: Command module loaded on demand

- **WHEN** the user runs `memory search "jwt"`
- **THEN** the system SHALL dynamically import `./search.js` and execute the search, without loading `analyze`, `read`, or any other command module

### Requirement: analyze command - extract symbols from source

The `memory analyze [path]` command SHALL scan source files using tree-sitter and extract language-level symbols into `.memory/.analyze-dump.json`. When a `path` argument is provided, scanning SHALL be scoped to that directory. When omitted, the system SHALL auto-detect project structure (monolith vs microservices) and scan accordingly.

Supported target languages: TypeScript, JavaScript, Vue, Java, Python, Go.

#### Scenario: Analyze a scoped module

- **WHEN** `memory analyze services/auth-service/` is invoked
- **THEN** the system SHALL extract symbols only from that directory and write `.memory/.analyze-dump.json`

#### Scenario: Analyze full project with auto-detection

- **WHEN** `memory analyze` is invoked on a monolith project with `src/` subdirectories
- **THEN** the system SHALL scan all files under `src/` and detect all 6 supported languages

### Requirement: search command - cross-type search with operators and summary output

The `memory search <query>` command SHALL search across all node types and return a ranked list of summaries. Each result row SHALL include: score (0-10), type, id, summary (one line), and tags. This SHALL be the first layer of progressive disclosure.

The system SHALL support boolean operators in queries: `|` for OR (match any term), `&` for AND (match all terms). Multiple terms without operators SHALL default to AND semantics. Operators SHALL work across content, frontmatter fields, and tags.

Options SHALL include: `--category <type>` to filter by node type, `--tag <tag>` to filter by tag, `--top <n>` to limit results (default 10), `--format json` for machine-readable output.

#### Scenario: Basic search across all types

- **WHEN** `memory search "jwt"` is invoked
- **THEN** the system SHALL return ranked results containing Flow, Component, Config, API, and Decision nodes that match "jwt", each showing type + summary + tags

#### Scenario: OR search matches any term

- **WHEN** `memory search "jwt | oauth | session"` is invoked
- **THEN** the system SHALL return results matching any of "jwt", "oauth", or "session"

#### Scenario: AND search requires all terms

- **WHEN** `memory search "jwt & refresh & token"` is invoked
- **THEN** the system SHALL return only results that match all three terms simultaneously

#### Scenario: Default AND semantics for multiple terms

- **WHEN** `memory search "jwt refresh token"` is invoked without operators
- **THEN** the system SHALL treat it as "jwt & refresh & token" (AND semantics)

#### Scenario: Search filtered by category

- **WHEN** `memory search "jwt" --category config` is invoked
- **THEN** the system SHALL return only Config-type nodes matching "jwt"

#### Scenario: Search with JSON output

- **WHEN** `memory search "jwt" --format json` is invoked
- **THEN** the system SHALL output a JSON array of result objects for AI agent consumption

### Requirement: read command - full node content with related nodes

The `memory read <id>` command SHALL return the complete content of a knowledge node, including full Markdown body, all frontmatter fields, and a list of related node IDs (1-hop neighbors from graph.json). This SHALL be the second layer of progressive disclosure.

Options SHALL include: `--summary` to return only the summary line (equivalent to a search result row), `--related` to include full summaries of related nodes, `--format json` for machine-readable output.

#### Scenario: Read full node content

- **WHEN** `memory read component/token-service` is invoked
- **THEN** the system SHALL output the complete Markdown content, all frontmatter fields, and the list of neighbor node IDs

#### Scenario: Read with related summaries

- **WHEN** `memory read component/token-service --related` is invoked
- **THEN** the system SHALL also include `depends_on: config/jwt-secret`, `flows_through: flow/login-flow (step 3)` summaries

### Requirement: graph command - relationship subgraph traversal

The `memory graph <id>` command SHALL traverse the relationship graph from a node and output its neighbor subgraph. This SHALL be the third layer of progressive disclosure.

Options SHALL include: `--depth <n>` to control traversal depth (default 1), `--direction in|out|both` to control edge direction (default both).

#### Scenario: 1-hop graph traversal

- **WHEN** `memory graph component/token-service` is invoked
- **THEN** the system SHALL output all immediate inbound and outbound relationships

#### Scenario: 2-hop traversal

- **WHEN** `memory graph component/token-service --depth 2` is invoked
- **THEN** the system SHALL traverse 2 hops, showing `token-service → jwt-secret → auth-middleware`

### Requirement: status command - health and freshness check

The `memory status` command SHALL report knowledge base health: total entry count, breakdown by node type, index freshness (comparing contentHash from index.json against file system), count of stale entries, and orphan nodes (nodes referenced in relations but whose files are missing).

#### Scenario: Healthy project status

- **WHEN** `memory status` runs on a project with 42 nodes and no stale entries
- **THEN** the system SHALL output: entry count 42, breakdown by 6 types, index freshness ✓, 0 stale, 0 orphans

#### Scenario: Stale entries detected

- **WHEN** `memory status` detects 3 files with changed contentHash
- **THEN** the system SHALL list the 3 stale entry IDs and suggest `memory rebuild`

### Requirement: rebuild command - regenerate index from file storage

The `memory rebuild` command SHALL regenerate `index.json` and `graph.json` from all `.md` files under `.memory/`. The pipeline SHALL execute: scan files → parse frontmatter → validate schema → compute contentHash → build graph.json → write index.json.

Options SHALL include: `--force` to skip the confirmation prompt, `--engine file|libsql` to select the active storage engine.

#### Scenario: Full rebuild from files

- **WHEN** `memory rebuild` runs on a project with 42 `.md` files
- **THEN** the system SHALL regenerate `index.json` with 42 entries and `graph.json` with all declared relationships

#### Scenario: Rebuild with engine switch

- **WHEN** `memory rebuild --engine libsql` runs
- **THEN** the system SHALL rebuild file-based index first, then replicate to libsql with FTS5 indexing

### Requirement: audit command - per-entry staleness detection

The `memory audit <id>` command SHALL check a single knowledge entry for staleness. It SHALL compare the stored `contentHash` against current file content, verify referenced code files exist, and check if related nodes in graph.json are still valid.

#### Scenario: Entry is fresh

- **WHEN** `memory audit component/token-service` runs and contentHash matches
- **THEN** the system SHALL report: file exists ✓, contentHash matches ✓, referenced code exists ✓

#### Scenario: Referenced code file was moved

- **WHEN** `memory audit component/token-service` detects `filePath: src/auth/token-service.ts` no longer exists (renamed to `token.service.ts`)
- **THEN** the system SHALL report the stale filePath and suggest updating the entry
