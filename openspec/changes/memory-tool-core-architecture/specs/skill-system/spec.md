## ADDED Requirements

### Requirement: Five structured skill files for AI agent guidance

The system SHALL provide five SKILL.md files under `.claude/skills/memory/` to guide AI agents. Each file SHALL use YAML frontmatter with `name` and `description` for intent matching, and a body following the five-section template: When to Use, Workflow, Checklist, Tools, Example.

The five skills SHALL be:

| Skill | File | Role |
|-------|------|------|
| memory-build | `memory-build/SKILL.md` | Guide AI to discover and build project knowledge from `.analyze-dump.json` |
| memory-search | `memory-search/SKILL.md` | Guide AI to search knowledge base and evaluate results |
| memory-read | `memory-read/SKILL.md` | Guide AI to progressively read and explore entries |
| memory-write | `memory-write/SKILL.md` | Guide AI to write or update knowledge entries |
| memory-status | `memory-status/SKILL.md` | Guide AI to check knowledge base health |

#### Scenario: AI agent matches intent from description

- **WHEN** the user asks "记录一下这个 API 的设计"
- **THEN** the AI agent SHALL match the memory-write skill because its description includes "记录", "保存", "写入知识"

#### Scenario: AI agent reads skill workflow for execution steps

- **WHEN** the AI agent loads `memory-search/SKILL.md` after intent match
- **THEN** it SHALL follow the Workflow section: parse intent → search → evaluate → decide to refine or read

### Requirement: memory-build skill - systematic knowledge discovery

The `memory-build` skill SHALL guide the AI agent to read `.memory/.analyze-dump.json` and classify extracted symbols into the six node types. The workflow SHALL be: read dump → identify System boundaries → classify symbols → generate .md files with correct frontmatter → declare relationships (relates/depends_on) → prompt `memory rebuild`.

#### Scenario: Build knowledge from analyze dump

- **WHEN** the AI agent runs memory-build after `memory analyze services/auth/`
- **THEN** it SHALL read the dump, classify `TokenService` as a Component, `JWT_SECRET` as a Config, and `POST /auth/login` as an API, then create corresponding .md files

#### Scenario: Build skill warns about duplicate detection

- **WHEN** the AI agent tries to create a node that already exists in `.memory/`
- **THEN** the skill SHALL instruct it to `memory search` first to check for duplicates, then update existing rather than creating new

### Requirement: memory-search skill - guided search and evaluation

The `memory-search` skill SHALL guide the AI agent to formulate effective queries, interpret search results, and decide the next action. The workflow SHALL be: parse user intent → extract keywords and expected node types → invoke `memory search` → evaluate results (scores, coverage) → decide to refine search or proceed to `memory read`.

#### Scenario: Search and decide to refine

- **WHEN** the AI agent searches "jwt" and gets 12 results but none from the "config" type
- **THEN** the skill SHALL suggest narrowing with `--category config` to find specific config entries

#### Scenario: Search and proceed to read

- **WHEN** the AI agent searches "token refresh" and gets `component/token-service (9.2)` as top result
- **THEN** the skill SHALL suggest proceeding to `memory read component/token-service`

### Requirement: memory-read skill - progressive detail expansion

The `memory-read` skill SHALL guide the AI agent to progressively expand knowledge details without overloading context. The workflow SHALL be: identify the target node → `memory read <id>` → present full content to user → if related nodes are relevant, `memory read <related-id>` individually.

The skill SHALL instruct the AI agent to avoid reading nodes whose summaries were already shown via `--related`, unless the user explicitly requests deeper detail.

#### Scenario: Read a node and its dependency

- **WHEN** the user asks "token-service 依赖什么配置"
- **THEN** the AI agent SHALL `memory read component/token-service --related`, show the `depends_on: config/jwt-secret` summary, and ask if the user wants the full config content

#### Scenario: Avoid redundant reads

- **WHEN** the AI agent has already seen `config/jwt-secret` as a related summary
- **THEN** it SHALL NOT automatically `memory read` it unless the user asks "展开 jwt-secret 的详细内容"

### Requirement: memory-write skill - structured knowledge entry

The `memory-write` skill SHALL guide the AI agent to create or update knowledge entries with correct frontmatter schema. The workflow SHALL be: determine node type → select frontmatter template → fill required fields → generate .md file → prompt `memory rebuild`.

The skill SHALL include a node-type decision tree:

```
What is being documented?
├── A top-level service or module boundary → System
├── An end-to-end business process with steps → Flow
├── A specific code implementation unit → Component
├── A configuration item or environment variable → Config
├── An API endpoint or service interface → API
└── A technical decision or trade-off → Decision
```

#### Scenario: Write a Decision node

- **WHEN** the AI agent needs to document "why JWT over Session"
- **THEN** the skill SHALL guide it to use the Decision template with `context`, `options[]`, `chosen`, and `reason` fields

#### Scenario: Write a Flow node with steps

- **WHEN** the AI agent documents a login process with 3 steps
- **THEN** the skill SHALL guide it to populate `steps` with ordered `{order, component, description}` objects

#### Scenario: Update an existing entry

- **WHEN** the user says "更新 token-service 的 exports 列表"
- **THEN** the skill SHALL instruct the AI agent to read the existing file, modify the `exports` frontmatter field, and suggest `memory rebuild`

### Requirement: memory-status skill - health check guidance

The `memory-status` skill SHALL guide the AI agent to check knowledge base health and recommend actions. The workflow SHALL be: `memory status` → review stale entries → `memory audit` on specific entries → recommend `memory rebuild` or manual fixes.

#### Scenario: Status check reveals stale entries

- **WHEN** the AI agent runs `memory status` and sees "3 stale entries"
- **THEN** the skill SHALL instruct it to `memory audit` each stale entry and report findings

#### Scenario: All healthy

- **WHEN** `memory status` reports 42 entries, 0 stale, 0 orphans
- **THEN** the skill SHALL instruct the AI agent to report "知识库健康" and take no further action

### Requirement: Skill file location and discovery

All five SKILL.md files SHALL be stored under `.claude/skills/memory/<skill-name>/SKILL.md`. AI tools SHALL discover them via the directory convention. Each skill's frontmatter `description` SHALL include trigger examples in Chinese and English for broad intent matching.

#### Scenario: Skill discovery by AI tool

- **WHEN** an AI tool enters a project with `.claude/skills/memory/`
- **THEN** it SHALL load all five skill files and match user intent against their descriptions
