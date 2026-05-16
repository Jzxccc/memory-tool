## ADDED Requirements

### Requirement: Three-layer progressive disclosure model

The system SHALL expose knowledge through three layers of increasing detail, enabling AI agents to retrieve information incrementally without context overflow. Each layer SHALL be accessed via a distinct CLI command or MCP tool.

| Layer | Command | Returns | Token budget |
|-------|---------|---------|-------------|
| 1 - Summary | `search` | type + id + summary (one line) + tags + score | ~80 chars/result |
| 2 - Detail | `read` | full Markdown + all frontmatter + neighbor IDs | ~500-2000 tokens |
| 3 - Network | `graph` | inbound/outbound relationship edges | ~200-1000 tokens |

#### Scenario: Full progressive disclosure flow

- **WHEN** user asks "JWT 怎么用的"
- **THEN** the AI agent SHALL `search "jwt"` (layer 1), select `component/token-service`, `read component/token-service --related` (layer 2), then `graph component/token-service --depth 2` (layer 3) to understand the complete relationship network

#### Scenario: Agent stops at layer 1 when nothing relevant found

- **WHEN** `memory search "unknown-concept"` returns zero results
- **THEN** the AI agent SHALL report "no results" without proceeding to layers 2 or 3

### Requirement: Layer 1 - search returns minimal summaries

The search layer SHALL return only the minimal information needed to identify relevance: type, id, summary (one line), tags, and normalized score (0-10). This layer SHALL NOT expose full Markdown content or relationships.

The compact format SHALL enable AI agents to scan 10+ results without consuming excessive context.

#### Scenario: Search result format

- **WHEN** `memory search "jwt"` is invoked
- **THEN** each result row SHALL contain exactly: score, type, id, summary, tags. Body content and relationships SHALL NOT be included.

### Requirement: Layer 2 - read returns full content with neighbor hints

The read layer SHALL return the complete Markdown body, all frontmatter fields, and a list of neighbor node IDs (1-hop from graph.json). The neighbor list SHALL include relationship type and direction for each neighbor, enabling the AI agent to decide which node to explore next.

When `--related` is passed, neighbor summaries (one line each, same format as layer 1 results) SHALL be appended. Without `--related`, only neighbor IDs and relationship types SHALL be shown.

#### Scenario: Read with neighbor IDs only

- **WHEN** `memory read component/token-service` is invoked without `--related`
- **THEN** the output SHALL include `depends_on: config/jwt-secret` and `flows_through: flow/login-flow (step 3)` as neighbor references, but NOT their full content

#### Scenario: Read with related summaries

- **WHEN** `memory read component/token-service --related` is invoked
- **THEN** the output SHALL include one-line summaries for each neighbor: `config/jwt-secret: JWT_SECRET 签名密钥` and `flow/login-flow: 用户登录流程（4步）`

### Requirement: Layer 3 - graph returns relationship topology

The graph layer SHALL traverse `graph.json` and return the relationship subgraph centered on a node. It SHALL support depth control (`--depth`) and direction control (`--direction in|out|both`).

The output SHALL show edges as `from → [type] → to`, optionally with confidence and step numbers. This layer helps AI agents understand how a node fits into the broader knowledge structure.

#### Scenario: 1-hop graph of a component

- **WHEN** `memory graph component/token-service --depth 1 --direction both` is invoked
- **THEN** the output SHALL show `depends_on → config/jwt-secret`, `flows_through ← flow/login-flow (step 3)`, `implements → api/auth-login`

#### Scenario: 2-hop outgoing graph

- **WHEN** `memory graph component/token-service --depth 2 --direction out` is invoked
- **THEN** the output SHALL show 1-hop: `→ jwt-secret, → api/auth-login` and 2-hop: `jwt-secret → used_by → auth-middleware`

### Requirement: Layer decisions are AI agent responsibility

The AI agent SHALL decide when to progress from one layer to the next, guided by the skill files. The system SHALL NOT automatically cascade layers. Each layer call is an explicit, independent action by the agent.

The memory-read and memory-search skill files SHALL encode decision heuristics:
- If search returns 0 results → stop
- If search returns 1-3 high-score results (>8.0) → proceed to read on top result
- If search returns many medium-score results → refine search (add category/tag filter, adjust operators) before proceeding

#### Scenario: Agent refines search before reading

- **WHEN** `memory search "auth"` returns 28 results across 5 types with scores 4-8
- **THEN** the skill SHALL guide the agent to narrow the search (e.g., `memory search "auth & jwt" --category component`) rather than reading 28 entries

#### Scenario: Agent reads top result directly

- **WHEN** `memory search "jwt refresh token"` returns 3 results with scores 9.5, 7.2, 4.1
- **THEN** the skill SHALL guide the agent to `memory read` the 9.5-scored result immediately

### Requirement: No context duplication across layers

When the AI agent advances from layer 1 to layer 2 for the same node, the system SHALL NOT re-send the layer 1 summary within the layer 2 response. Layer 2 SHALL only contain information not already seen in layer 1 (full body, frontmatter beyond summary/tags, neighbor relationships).

#### Scenario: Read does not repeat search content

- **WHEN** `memory read component/token-service` is called after the AI agent already saw this node in search results
- **THEN** the read output SHALL exclude the fields already shown in search (score, type, id, summary, tags are omitted; full body and neighbors are new)
