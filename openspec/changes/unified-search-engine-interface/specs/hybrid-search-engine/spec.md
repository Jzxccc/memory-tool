## ADDED Requirements

### Requirement: Hybrid engine SHALL combine multiple search strategies
The HybridSearch engine MUST delegate search to multiple sub-engines (keyword and semantic) and fuse their results using Reciprocal Rank Fusion.

#### Scenario: Hybrid search with keyword engine only
- **WHEN** a FileEngine is registered as the keyword sub-engine
- **AND** no semantic engine is registered
- **THEN** `search()` SHALL return FileEngine results as-is (single engine pass-through)

#### Scenario: Hybrid search with keyword and semantic engines
- **WHEN** both a keyword engine (FileEngine) and a semantic engine are registered
- **THEN** `search()` SHALL run both engines in parallel via Promise.all
- **AND** SHALL fuse results using RRF

---

### Requirement: Hybrid engine SHALL be a valid SearchEngine
HybridSearch MUST implement the `SearchEngine` interface with `name = 'hybrid'`, `capabilities = ['hybrid']`, and `priority = 0` (highest).

#### Scenario: Hybrid engine can be registered like any other engine
- **WHEN** `registry.register(new HybridSearch(keywordEngine, semanticEngine))` is called
- **THEN** `registry.get('hybrid')` SHALL return a valid SearchEngine

---

### Requirement: Hybrid engine SHALL support configurable weights
The HybridSearch engine MUST accept an optional `weights` configuration to control keyword vs semantic result weighting during fusion.

#### Scenario: Default weights are 0.7 keyword / 0.3 semantic
- **WHEN** weights are not specified
- **THEN** keyword results SHALL be weighted at 0.7
- **AND** semantic results SHALL be weighted at 0.3

#### Scenario: Custom weights override defaults
- **WHEN** `new HybridSearch(kwEngine, semEngine, { keywordWeight: 0.5, semanticWeight: 0.5 })` is specified
- **THEN** the custom weights SHALL be used during fusion

---

### Requirement: Hybrid engine SHALL degrade gracefully
When one sub-engine fails (health check failure or search error), HybridSearch MUST continue with the remaining engines and SHALL NOT fail entirely.

#### Scenario: Semantic engine fails
- **WHEN** the semantic engine throws during search
- **THEN** HybridSearch SHALL catch the error
- **AND** SHALL return results from the keyword engine only
- **AND** SHALL NOT throw or return an error
