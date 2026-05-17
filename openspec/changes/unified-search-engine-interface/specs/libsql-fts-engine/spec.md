## ADDED Requirements

### Requirement: LibsqlEngine SHALL implement FTS5 full-text search
The LibsqlEngine MUST use libSQL/SQLite FTS5 to perform full-text search on indexed knowledge entry content, replacing the current stub implementation.

#### Scenario: Search returns matching entries
- **WHEN** `search({terms: ['cli'], operator: 'AND'})` is called
- **AND** the FTS5 index contains entries matching 'cli'
- **THEN** results SHALL contain matching entry IDs with scores

#### Scenario: Search with no matches returns empty
- **WHEN** `search({terms: ['xyznonexistent'], operator: 'AND'})` is called
- **AND** the FTS5 index has no matches
- **THEN** results SHALL be an empty array

---

### Requirement: LibsqlEngine SHALL build FTS5 index during rebuild
When `memory rebuild --engine libsql` is executed, the LibsqlEngine MUST create or refresh the FTS5 virtual table from all `.md` knowledge files.

#### Scenario: First rebuild creates FTS5 index
- **WHEN** `memory rebuild --engine libsql` is run for the first time
- **THEN** `.memory/memory.db` SHALL be created
- **AND** the FTS5 virtual table SHALL be created with content from all .md files

#### Scenario: Rebuild updates existing FTS5 index
- **WHEN** entries have been added/modified since last rebuild
- **AND** `memory rebuild --engine libsql` is run
- **THEN** the FTS5 index SHALL be rebuilt to reflect the latest content

---

### Requirement: LibsqlEngine SHALL use BM25 scoring
FTS5 search results MUST be scored using BM25 ranking and normalized to the 0-10 range for consistency with other engines.

#### Scenario: BM25 scores are normalized
- **WHEN** FTS5 returns raw BM25 scores for matching entries
- **THEN** the highest-scoring entry SHALL be normalized to 10.0
- **AND** other entries SHALL be proportionally normalized

---

### Requirement: LibsqlEngine SHALL degrade gracefully when libsql is unavailable
If `@libsql/client` cannot be loaded (missing dependency), the engine MUST become unhealthy and SHALL NOT throw during instantiation.

#### Scenario: Missing libsql dependency
- **WHEN** `@libsql/client` is not installed
- **AND** `new LibsqlEngine(memoryDir)` is called
- **THEN** the constructor SHALL NOT throw
- **AND** `healthCheck()` SHALL return `false`

#### Scenario: Graceful degradation in orchestrator
- **WHEN** LibsqlEngine reports unhealthy
- **AND** SearchOrchestrator uses the registry
- **THEN** the unhealthy engine SHALL be excluded from search
- **AND** search SHALL proceed with the remaining healthy engines

---

### Requirement: LibsqlEngine SHALL implement SearchEngine interface
LibsqlEngine MUST fully implement the expanded `SearchEngine` interface with `name = 'libsql'`, `capabilities = ['keyword']`, `priority = 0`, and an optional `healthCheck()`.

#### Scenario: Engine metadata
- **WHEN** LibsqlEngine is instantiated
- **THEN** `engine.name` SHALL be `'libsql'`
- **AND** `engine.capabilities` SHALL be `['keyword']`
- **AND** `engine.priority` SHALL be `0`
