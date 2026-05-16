## ADDED Requirements

### Requirement: Six node types for project knowledge

The system SHALL support six node types for modeling project-level knowledge. Each node SHALL have a unique identifier in the format `{type}/{slug}`. The types are:

| Type | Identifier | Semantic |
|------|-----------|---------|
| System | `system` | Service or module boundary (unified for monolith and microservices) |
| Flow | `flow` | End-to-end business process with ordered steps |
| Component | `component` | Concrete implementation unit (file/directory) |
| Config | `config` | Configuration item or environment variable |
| API | `api` | Service interface or endpoint definition |
| Decision | `decision` | Technical decision, trade-off, or rationale |

#### Scenario: Create a System node for a monolith module

- **WHEN** a monolith project has `src/auth/` as a top-level directory
- **THEN** the system SHALL recognize it as a System node with id `system/auth`

#### Scenario: Create a System node for a microservice

- **WHEN** a microservice project has `services/auth-service/` as a top-level directory
- **THEN** the system SHALL recognize it as a System node with id `system/auth-service`

#### Scenario: Create a Flow node with steps

- **WHEN** an author creates a Flow node named `login-flow`
- **THEN** the system SHALL require a `steps` field containing an ordered array of `{order, component, description}` objects

#### Scenario: Create a Decision node

- **WHEN** an author creates a Decision node named `jwt-vs-session`
- **THEN** the system SHALL require `context`, `options`, `chosen`, and `reason` fields

### Requirement: Type-specific frontmatter schema

Each node type SHALL have a distinct frontmatter schema. Every node SHALL include common fields: `id` (required), `type` (required), `summary` (required, one line), `tags` (required, array of strings), `status` (enum: draft|stable|deprecated), `created`, `lastModified`, and `relates` (optional array of node IDs).

Type-specific required fields:

| Type | Required fields beyond common |
|------|------|
| System | (none beyond common) |
| Flow | `steps`: ordered array of `{order: number, component: string, description: string}` |
| Component | `filePath`: source file path. `language`: programming language. `exports`: array of exported symbols |
| Config | `key`: configuration key name. `envType`: one of `env`, `secret`, `config` |
| API | `method`: HTTP method. `path`: URL path. `request`: input shape. `response`: output shape |
| Decision | `context`: situation. `options`: array of `{name, pros, cons}`. `chosen`: selected option. `reason`: rationale |

#### Scenario: Validate a Component node frontmatter

- **WHEN** an author writes a Component node without `filePath`
- **THEN** the system SHALL reject it and report `filePath is required for type component`

#### Scenario: Accept a valid Config node

- **WHEN** an author writes a Config node with `key: JWT_SECRET` and `envType: secret`
- **THEN** the system SHALL accept it and populate `type: config` automatically

### Requirement: Six relationship types between nodes

The system SHALL support six directed relationship types. Each relationship SHALL be stored with `from` (source node ID), `to` (target node ID), and `type` (relationship kind). Optional fields include `confidence` (0.0-1.0) and `step` (for flows_through).

| Relationship | FROM | TO | Meaning |
|-------------|------|----|---------|
| `contains` | System | any | Module contains sub-element |
| `flows_through` | Flow | Component | Process step passes through component; requires `step` (order number) |
| `implements` | Component | API | Component implements the interface |
| `depends_on` | Component or Flow | Config or Component | Dependency between entities |
| `alternative_to` | Decision | Component | Decision's alternative (rejected option) |
| `references` | any | any | Cross-reference between any node types |

#### Scenario: A flow step references a component

- **WHEN** Flow `login-flow` has step 3 pointing to Component `token-service`
- **THEN** the system SHALL create a `flows_through` relationship with `from: flow/login-flow`, `to: component/token-service`, `step: 3`

#### Scenario: A component depends on a config

- **WHEN** Component `token-service` declares `depends_on: [config/jwt-secret]` in frontmatter
- **THEN** the system SHALL create a `depends_on` relationship linking the two nodes

#### Scenario: A decision references rejected alternatives

- **WHEN** Decision `jwt-vs-session` lists `session-auth-service` as an option not chosen
- **THEN** the system SHALL create an `alternative_to` relationship to the rejected component

### Requirement: File-based storage convention

All knowledge nodes SHALL be stored as Markdown files with YAML frontmatter under the `.memory/` directory. Each node type SHALL have its own subdirectory:

```
.memory/
├── systems/          ← System nodes
├── flows/            ← Flow nodes
├── components/       ← Component nodes
├── configs/          ← Config nodes
├── apis/             ← API nodes
├── decisions/        ← Decision nodes
├── index.json        ← Metadata index
└── graph.json        ← Relationship graph
```

File names SHALL follow the pattern `{slug}.md` (e.g., `token-service.md`). The full node ID is derived as `{type}/{slug}` where type matches the parent directory.

#### Scenario: Write a component node to disk

- **WHEN** a Component node with slug `token-service` is saved
- **THEN** the system SHALL write `.memory/components/token-service.md` with YAML frontmatter followed by Markdown content

#### Scenario: Read a config node from disk

- **WHEN** the system needs to read node `config/jwt-secret`
- **THEN** the system SHALL locate `.memory/configs/jwt-secret.md` and parse its frontmatter

### Requirement: index.json metadata persistence

The system SHALL maintain an `index.json` file under `.memory/` that tracks metadata for every knowledge node. Each entry SHALL include:

- `id`: node identifier
- `type`: node type
- `contentHash`: SHA256 hash of the file content (for stale detection)
- `frontmatterHash`: SHA256 hash of frontmatter only
- `tags`: array of tags
- `lastModified`: ISO-8601 timestamp

#### Scenario: Detect a modified file via content hash

- **WHEN** `memory status` runs and `components/token-service.md` has changed content
- **THEN** the system SHALL compare the stored `contentHash` against a fresh SHA256 and report the file as stale

#### Scenario: Add a new entry to index.json

- **WHEN** `memory rebuild` processes a newly created file `apis/auth-login.md`
- **THEN** the system SHALL compute hashes and append an entry to `index.json`

### Requirement: graph.json relationship persistence

The system SHALL maintain a `graph.json` file under `.memory/` that stores all relationships between nodes. Each relationship SHALL include `from`, `to`, `type`, and optional `confidence` and `step` fields.

```json
{
  "relationships": [
    {
      "from": "system/auth",
      "to": "component/token-service",
      "type": "contains",
      "confidence": 1.0
    },
    {
      "from": "flow/login-flow",
      "to": "component/token-service",
      "type": "flows_through",
      "step": 3,
      "confidence": 1.0
    }
  ]
}
```

#### Scenario: Rebuild regenerates graph.json from frontmatter relations

- **WHEN** `memory rebuild` runs
- **THEN** the system SHALL scan all node files, extract `relates` and `depends_on` from frontmatter, extract `steps[].component` from Flow nodes, and write all relationships to `graph.json`

#### Scenario: Query relationships for a node

- **WHEN** `memory graph component/token-service` is invoked
- **THEN** the system SHALL load `graph.json`, filter relationships where `from` or `to` matches the node ID, and return the subgraph

### Requirement: System boundary semantics for monolith and microservices

The System node type SHALL represent a service or module boundary. In monolith projects it SHALL mean a top-level module (e.g., `system/auth`, `system/payment`). In microservice projects it SHALL mean an independent service (e.g., `system/auth-service`, `system/payment-service`). The underlying storage, search, and relationship model SHALL be identical for both modes.

Cross-System dependencies SHALL be expressed via `depends_on` relationships, naturally modeling both intra-module and inter-service dependencies.

#### Scenario: Monolith project stores module as System

- **WHEN** a monolith project has `src/auth/` directory
- **THEN** the system SHALL create `systems/auth.md` with `type: system` and `id: system/auth`

#### Scenario: Microservice project stores service as System

- **WHEN** a microservice project has `services/auth-service/` directory
- **THEN** the system SHALL create `systems/auth-service.md` with `type: system` and `id: system/auth-service`

#### Scenario: Cross-service dependency expressed via depends_on

- **WHEN** Component `payment-gateway` in System `payment-service` calls an API in System `user-service`
- **THEN** the system SHALL store a `depends_on` relationship with `from: component/payment-gateway`, `to: component/user-client`
