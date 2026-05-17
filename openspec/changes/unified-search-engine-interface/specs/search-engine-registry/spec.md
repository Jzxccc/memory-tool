## ADDED Requirements

### Requirement: Registry SHALL support engine registration and discovery
The SearchEngineRegistry MUST provide methods to register, unregister, and look up engines by name, capability, or selection strategy.

#### Scenario: Register and retrieve a single engine
- **WHEN** `registry.register(new FileEngine(memoryDir))` is called
- **THEN** `registry.get('file')` SHALL return the registered FileEngine instance

#### Scenario: Unregister removes engine from all lookups
- **WHEN** `registry.unregister('file')` is called
- **THEN** `registry.get('file')` SHALL return `undefined`
- **AND** `registry.getAll()` SHALL not include the file engine
- **AND** `registry.getByCapability('keyword')` SHALL not include the file engine

---

### Requirement: Registry SHALL filter engines by capability
The registry MUST provide `getByCapability(capability)` that returns all registered engines whose `capabilities` array includes the requested capability, sorted by priority ascending.

#### Scenario: Filter keyword engines
- **WHEN** both FileEngine (keyword, priority=1) and HybridSearch (hybrid, priority=0) are registered
- **AND** `registry.getByCapability('keyword')` is called
- **THEN** it SHALL return `[FileEngine]` only

---

### Requirement: Registry SHALL support engine selection by search strategy
The registry MUST provide `selectForQuery(query, strategy)` that returns the appropriate engines based on a `SearchStrategy` value (`keyword`, `semantic`, `hybrid`, `auto`).

#### Scenario: Auto strategy selects all healthy engines
- **WHEN** strategy is `auto`
- **AND** both FileEngine and LibsqlEngine are healthy
- **THEN** `selectForQuery()` SHALL return both engines sorted by priority

#### Scenario: Keyword strategy selects only keyword engines
- **WHEN** strategy is `keyword`
- **THEN** `selectForQuery()` SHALL return only engines with `keyword` capability

#### Scenario: Hybrid strategy selects hybrid engines
- **WHEN** strategy is `hybrid`
- **THEN** `selectForQuery()` SHALL return only engines with `hybrid` capability

---

### Requirement: Registry SHALL exclude unhealthy engines from selection
When `selectForQuery()` is called, the registry MUST call `healthCheck()` on each candidate engine and SHALL exclude any engine whose health check fails.

#### Scenario: LibsqlEngine is unhealthy
- **WHEN** LibsqlEngine.healthCheck() returns false
- **AND** `selectForQuery(query, 'auto')` is called
- **THEN** LibsqlEngine SHALL be excluded from the result
