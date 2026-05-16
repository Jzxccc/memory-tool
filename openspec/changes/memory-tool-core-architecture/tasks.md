## 1. Project Setup

- [ ] 1.1 Initialize npm package: `package.json` with name `memory-tool`, TypeScript, Commander.js, libsql, @modelcontextprotocol/sdk dependencies
- [ ] 1.2 Create `tsconfig.json` with strict mode, ESM module resolution, `src/` root
- [ ] 1.3 Create `src/cli/index.ts` entry point with Commander.js and `createLazyAction` pattern
- [ ] 1.4 Create `src/cli/lazy-action.ts` generic lazy loader (reuse GitNexus pattern)
- [ ] 1.5 Create `.mcp.json` for MCP auto-discovery
- [ ] 1.6 Create `src/types/` with node-types.ts (6 types), relation-types.ts (6 types), search-types.ts

## 2. Knowledge Graph Foundation

- [ ] 2.1 Define 6 node type enums and TypeScript interfaces (`src/types/node-types.ts`)
- [ ] 2.2 Define 6 relationship type enums and interfaces (`src/types/relation-types.ts`)
- [ ] 2.3 Define frontmatter schema per node type with required/optional fields
- [ ] 2.4 Implement `src/storage/repo-manager.ts`: `.memory/` directory management, 6 subdirectories, init
- [ ] 2.5 Implement `src/storage/index-handler.ts`: read/write `index.json` with SHA256 contentHash per entry
- [ ] 2.6 Implement `src/core/graph/graph.ts`: in-memory graph with addNode, addEdge, getNeighbors, traverse methods
- [ ] 2.7 Implement `src/core/graph/graph-io.ts`: read/write `graph.json` from/to file
- [ ] 2.8 Write tests: node type validation, frontmatter parsing, index.json read/write, graph.json serialization

## 3. Search Engine

- [ ] 3.1 Define `SearchEngine` interface and `SearchResult` type (`src/core/search/types.ts`)
- [ ] 3.2 Implement `src/core/search/query-parser.ts`: parse `|` (OR), `&` (AND), bare terms → default AND
- [ ] 3.3 Implement `src/core/search/file-engine.ts`: keyword + frontmatter weighted scoring
- [ ] 3.4 Implement `src/core/search/libsql-engine.ts`: FTS5 full-text search + normalized scoring
- [ ] 3.5 Implement `src/core/search/rrf.ts`: RRF(K=60) fusion for multi-engine results
- [ ] 3.6 Implement `src/core/search/scorer.ts`: final score normalization to 0-10
- [ ] 3.7 Implement `src/core/search/orchestrator.ts`: unified search backend dispatching to engine(s)
- [ ] 3.8 Write tests: query parsing (OR/AND/default), file engine scoring weights, libsql FTS5, RRF fusion

## 4. CLI Commands

- [ ] 4.1 Implement `src/cli/search.ts`: `memory search <query>` with --category/--tag/--top/--format
- [ ] 4.2 Implement `src/cli/read.ts`: `memory read <id>` with --related/--summary/--format
- [ ] 4.3 Implement `src/cli/graph.ts`: `memory graph <id>` with --depth/--direction
- [ ] 4.4 Implement `src/cli/status.ts`: `memory status` with entry count, type breakdown, staleness report
- [ ] 4.5 Implement `src/cli/rebuild.ts`: `memory rebuild` pipeline (scan→parse→validate→index→link) with --force/--engine
- [ ] 4.6 Implement `src/cli/audit.ts`: `memory audit <id>` with contentHash comparison, filePath validation
- [ ] 4.7 Register all 7 commands in `src/cli/index.ts` via `createLazyAction`
- [ ] 4.8 Write tests: each command's argument parsing, output format, edge cases

## 5. Code Ingestion (analyze)

- [ ] 5.1 Set up tree-sitter for 6 target languages: TypeScript, JavaScript, Vue, Java, Python, Go
- [ ] 5.2 Implement `src/core/ingestion/scanner.ts`: scan source files, exclude non-source dirs
- [ ] 5.3 Implement `src/core/ingestion/extractor.ts`: extract functions, classes, imports, configs, routes per language
- [ ] 5.4 Implement project mode auto-detection: monolith (src/) vs microservices (services/ or packages/)
- [ ] 5.5 Implement `src/core/ingestion/dump-writer.ts`: write `.memory/.analyze-dump.json`
- [ ] 5.6 Implement `src/cli/analyze.ts`: `memory analyze [path]` with scoped scanning
- [ ] 5.7 Register analyze command in `src/cli/index.ts`
- [ ] 5.8 Write tests: scanner exclusion, extraction per language, auto-detection, scoped scan

## 6. Progressive Disclosure

- [ ] 6.1 Ensure search output SHALL only include type/id/summary/tags/score (layer 1)
- [ ] 6.2 Ensure read output SHALL include full body + frontmatter + neighbor IDs (layer 2)
- [ ] 6.3 Ensure graph output SHALL show relationship topology with depth/direction control (layer 3)
- [ ] 6.4 Ensure read output does NOT duplicate fields already shown in search for same node
- [ ] 6.5 Ensure layers are independent, explicit calls (no automatic cascade)
- [ ] 6.6 Write integration tests: full search→read→graph flow, no-duplication check

## 7. Skill System

- [ ] 7.1 Create `.claude/skills/memory/memory-build/SKILL.md` with workflow: read dump → classify → generate → rebuild
- [ ] 7.2 Create `.claude/skills/memory/memory-search/SKILL.md` with workflow: intent → search → evaluate → decide
- [ ] 7.3 Create `.claude/skills/memory/memory-read/SKILL.md` with workflow: target → read → avoid redundant reads
- [ ] 7.4 Create `.claude/skills/memory/memory-write/SKILL.md` with node-type decision tree + frontmatter templates
- [ ] 7.5 Create `.claude/skills/memory/memory-status/SKILL.md` with workflow: status → audit → recommend actions
- [ ] 7.6 Each SKILL.md SHALL include: YAML frontmatter (name, description), When to Use, Workflow, Checklist, Tools, Example sections
- [ ] 7.7 Each skill's description SHALL include trigger examples in Chinese and English

## 8. MCP Server

- [ ] 8.1 Implement `src/mcp/server.ts`: MCP stdio server with `@modelcontextprotocol/sdk`
- [ ] 8.2 Implement `src/cli/mcp.ts`: `memory mcp` command with dynamic import and stdout sentinel
- [ ] 8.3 Implement `src/mcp/tools.ts`: 5 tool definitions (analyze, search, read, graph, status) with annotations and inputSchema
- [ ] 8.4 Implement `src/mcp/resources.ts`: 6 resource URIs (categories, category/{type}, entry/{id}, status, tags, graph/{id})
- [ ] 8.5 Implement `src/core/backend.ts`: unified LocalBackend shared by CLI and MCP
- [ ] 8.6 Register mcp command in `src/cli/index.ts`
- [ ] 8.7 Write tests: tool call handling, resource reading, stdio stream integrity

## 9. Integration & Polish

- [ ] 9.1 End-to-end test: `memory analyze src/` → `memory search` → `memory read` → `memory graph` → `memory status`
- [ ] 9.2 End-to-end test: MCP client connects → calls tools → reads resources
- [ ] 9.3 End-to-end test: libsql engine mode with `--engine libsql`
- [ ] 9.4 End-to-end test: microservice scoped analyze `memory analyze services/auth/`
- [ ] 9.5 Verify `npx tsc --noEmit` passes
- [ ] 9.6 Add pre-commit hook: typecheck + lint
