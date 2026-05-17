## ADDED Requirements

### Requirement: Search engine SHALL declare capabilities
Every search engine implementation MUST declare its capabilities via the `capabilities` field, which SHALL be an array of one or more `EngineCapability` values: `keyword`, `semantic`, or `hybrid`.

#### Scenario: FileEngine declares keyword capability
- **WHEN** FileEngine is instantiated
- **THEN** its `capabilities` field SHALL be `['keyword']`

#### Scenario: Hybrid engine declares hybrid capability
- **WHEN** HybridSearch is instantiated
- **THEN** its `capabilities` field SHALL be `['hybrid']`

---

### Requirement: Search engine SHALL declare priority
Every search engine MUST declare a numeric `priority` value where 0 represents highest priority. The orchestrator SHALL use priority to determine engine ordering when multiple engines match a query strategy.

#### Scenario: FileEngine has lower priority than LibsqlEngine
- **WHEN** both FileEngine (priority=1) and LibsqlEngine (priority=0) are registered
- **THEN** LibsqlEngine SHALL be selected before FileEngine when choosing keyword engines

---

### Requirement: Search engine MAY implement health check
A search engine MAY implement an optional `healthCheck()` method that returns a Promise<boolean>. The registry SHALL call `healthCheck()` before selecting engines and SHALL exclude unhealthy engines from search.

#### Scenario: LibsqlEngine health check fails when database is missing
- **WHEN** LibsqlEngine.healthCheck() is called and `.memory/memory.db` does not exist
- **THEN** it SHALL return `false`

#### Scenario: FileEngine health check always passes
- **WHEN** FileEngine.healthCheck() is called
- **THEN** it SHALL return `true` as long as `.memory/` directory exists
