## ADDED Requirements

### Requirement: Dual engine architecture with unified interface

The system SHALL support two search engines behind a unified `SearchEngine` interface. The user SHALL select the active engine via `memory rebuild --engine file|libsql` or via configuration.

| Engine | Storage | Search Method |
|--------|---------|---------------|
| file | `.memory/` Markdown files | Keyword matching on content + frontmatter field matching |
| libsql | SQLite database (FTS5) | Full-text search via FTS5 + structured tag/type queries |

Both engines SHALL implement the same `SearchEngine` interface:

```typescript
interface SearchEngine {
  name: string;
  search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
}
```

#### Scenario: Switch from file to libsql engine

- **WHEN** `memory rebuild --engine libsql` is invoked
- **THEN** the system SHALL rebuild the index from file storage into libsql with FTS5, and all subsequent search calls SHALL use the libsql engine

#### Scenario: Default to file engine when no engine specified

- **WHEN** `memory rebuild` is invoked without `--engine` flag on a fresh project
- **THEN** the system SHALL default to the file engine

### Requirement: File engine - keyword and frontmatter scoring

The file engine SHALL search Markdown files under `.memory/` by matching query terms against content and frontmatter fields. It SHALL assign scores based on weighted field matches:

| Match Location | Weight |
|---------------|--------|
| `summary` | ×3 |
| `tags` (each match) | ×1 |
| `id` | ×5 |
| Body content | ×0.5 per occurrence |
| `--category` filter match | ×1 |

AND queries (`&`) SHALL require all terms present. OR queries (`|`) SHALL match any term and sum scores.

#### Scenario: Summary match scores higher than body match

- **WHEN** the file engine searches "jwt" and finds it in `summary` of token-service.md and in body of another file
- **THEN** the token-service result SHALL rank higher because summary match weight is ×3 vs body ×0.5

#### Scenario: AND query on file engine

- **WHEN** the file engine searches `"jwt & refresh"` against files
- **THEN** only files containing both "jwt" and "refresh" SHALL appear in results

### Requirement: Libsql engine - FTS5 full-text search

The libsql engine SHALL use SQLite FTS5 for full-text search over node content and frontmatter. It SHALL normalize FTS5 `bm25()` scores to 0-10 range. Structured filters (category, tags) SHALL be applied via SQL WHERE clauses in addition to FTS5 matching.

#### Scenario: FTS5 search with category filter

- **WHEN** the libsql engine searches "jwt" with `category: config`
- **THEN** it SHALL execute a FTS5 query with a SQL WHERE `type = 'config'` clause, returning only config-type nodes

#### Scenario: FTS5 score normalization to 0-10

- **WHEN** the libsql engine returns a result with raw BM25 score of 4.7
- **THEN** the system SHALL normalize it to the 0-10 output range

### Requirement: RRF (K=60) fusion for multi-engine results

When both engines are active (file engine as primary, libsql as index), the system SHALL fuse results using Reciprocal Rank Fusion with K=60. Each engine SHALL produce an independent ranked list. The fusion formula SHALL be:

```
RRF_score(d) = Σ 1 / (K + rank_i(d))
```

Where `rank_i(d)` is the position of document `d` in engine `i`'s result list (1-indexed), and K=60.

When only one engine is active, RRF SHALL degrade to pass-through (no fusion overhead).

#### Scenario: RRF fusion of overlapping results

- **WHEN** the file engine ranks `token-service` at position 1 and the libsql engine ranks it at position 3
- **THEN** the RRF score SHALL be `1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323`

#### Scenario: Single engine pass-through

- **WHEN** only the file engine is active
- **THEN** the fused result SHALL be identical to the file engine's raw result list

### Requirement: Final score normalization to 0-10

After RRF fusion, the system SHALL normalize all scores to the 0-10 range for consistent display. The highest-score result SHALL anchor at 10, and others SHALL scale proportionally.

#### Scenario: Score display in search output

- **WHEN** `memory search "jwt"` returns results with RRF scores of 0.032, 0.028, 0.015
- **THEN** the system SHALL normalize to display scores of 10.0, 8.7, 4.7

### Requirement: Query parsing with boolean operators

The search orchestrator SHALL parse user queries before dispatching to engines. It SHALL recognize `|` as OR, `&` as AND. Multiple bare terms without operators SHALL default to AND. The parsed query SHALL be passed to each engine as a structured `ParsedQuery` object with `terms` and `operator` fields.

#### Scenario: Parse OR query

- **WHEN** the user inputs `"jwt | oauth | session"`
- **THEN** the system SHALL parse to `{terms: ["jwt", "oauth", "session"], operator: "OR"}`

#### Scenario: Parse AND query

- **WHEN** the user inputs `"jwt & refresh & token"`
- **THEN** the system SHALL parse to `{terms: ["jwt", "refresh", "token"], operator: "AND"}`

#### Scenario: Parse bare multi-term as AND

- **WHEN** the user inputs `"jwt refresh token"` without operators
- **THEN** the system SHALL parse to `{terms: ["jwt", "refresh", "token"], operator: "AND"}`

### Requirement: Cross-type search by default

Both engines SHALL search across all six node types by default. The `--category` flag SHALL filter results to a single type. Results SHALL include the `type` field so callers can distinguish node types without additional queries.

#### Scenario: Search returns mixed types

- **WHEN** `memory search "jwt"` is invoked without `--category`
- **THEN** the system SHALL return results from System, Flow, Component, Config, API, and Decision types in a single ranked list
