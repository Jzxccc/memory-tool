## 1. SearchEngine Interface Enhancement

- [x] 1.1 Extend `SearchEngine` interface in `src/types/search-types.ts`: add `capabilities`, `priority`, `healthCheck?` fields
- [x] 1.2 Define `EngineCapability` type and `SearchStrategy` type
- [x] 1.3 Update `FileEngine` to implement the extended interface (capabilities=['keyword'], priority=1, healthCheck)
- [x] 1.4 Update `LibsqlEngine` to implement the extended interface (capabilities=['keyword'], priority=0, healthCheck)

## 2. SearchEngineRegistry Implementation

- [x] 2.1 Create `src/core/search/registry.ts` with `SearchEngineRegistry` class
- [x] 2.2 Implement `register()`, `unregister()`, `get()` for engine management
- [x] 2.3 Implement `getByCapability()` for capability-based engine lookup
- [x] 2.4 Implement `selectForQuery()` for strategy-based engine selection with health check filtering
- [x] 2.5 Write unit tests for `SearchEngineRegistry`

## 3. SearchOrchestrator Refactoring

- [x] 3.1 Add `SearchEngineRegistry` dependency to `SearchOrchestrator` constructor
- [x] 3.2 Replace `addEngine()`/`removeEngine()` with registry delegation
- [x] 3.3 Update `search()` to use `registry.selectForQuery()` instead of iterating `this.engines`
- [x] 3.4 Add `SearchStrategy` parameter to `SearchOptions` type (keyword|semantic|hybrid|auto)

## 4. LocalBackend Refactoring

- [x] 4.1 Remove hardcoded FileEngine registration from `LocalBackend` constructor
- [x] 4.2 Create `defaultSearchEngineRegistry()` factory function that registers FileEngine + attempts LibsqlEngine
- [x] 4.3 Update MCP memory_search tool to accept optional `strategy` parameter
- [x] 4.4 Update CLI `memory search` to accept `--strategy` option

## 5. HybridSearchEngine Implementation

- [x] 5.1 Create `src/core/search/hybrid-engine.ts` with `HybridSearch` class
- [x] 5.2 Implement parallel sub-engine delegation via `Promise.all`
- [x] 5.3 Implement RRF fusion of keyword + semantic results with configurable weights
- [x] 5.4 Implement graceful degradation when a sub-engine fails
- [x] 5.5 Register HybridSearch in default registry factory
- [x] 5.6 Write unit tests for HybridSearch

## 6. LibsqlEngine Full Implementation

- [x] 6.1 Add `@libsql/client` as optional dependency in package.json
- [x] 6.2 Implement `tryConnect()` with dynamic import and fallback
- [x] 6.3 Implement FTS5 virtual table creation in `memory rebuild --engine libsql`
- [x] 6.4 Implement `search()` using FTS5 MATCH query with BM25 scoring
- [x] 6.5 Implement BM25 score normalization to 0-10 range
- [x] 6.6 Implement `healthCheck()` with connection/database validation

## 7. Integration & CLI Updates

- [x] 7.1 Update `memory rebuild --engine libsql` to build FTS5 index via LibsqlEngine
- [x] 7.2 Update `memory search` CLI with `--strategy` option and engine reporting
- [x] 7.3 Update `memory status` to display engine health information
- [x] 7.4 Update `memory rebuild` to show engine registration summary

## 8. Knowledge Base Updates

- [x] 8.1 Update `component/search-orchestrator` knowledge entry
- [x] 8.2 Update `component/file-engine` knowledge entry
- [x] 8.3 Update `component/local-backend` knowledge entry
- [x] 8.4 Update `component/libsql-engine` knowledge entry (promote from draft to stable)
- [x] 8.5 Create `component/search-registry` knowledge entry
- [x] 8.6 Create `component/hybrid-search` knowledge entry
- [x] 8.7 Run `memory rebuild` to index all updated entries
