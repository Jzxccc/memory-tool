## ADDED Requirements

### Requirement: Analyze command extracts symbols from source

The `memory analyze [path]` command SHALL scan source files and extract language-level symbols using tree-sitter. When a `path` argument is provided, the system SHALL scope scanning to that directory only. When omitted, the system SHALL scan the entire project.

Extracted symbols SHALL include: function definitions, class definitions, import/export statements, config key-value pairs, and route registration calls. The extraction result SHALL be written to `.memory/.analyze-dump.json`.

The system SHALL NOT classify symbols into node types. Classification is deferred to the AI agent via the memory-build skill.

#### Scenario: Full project scan for a monolith

- **WHEN** `memory analyze` runs on a monolith project
- **THEN** the system SHALL scan all source files and write a discovery dump to `.memory/.analyze-dump.json`

#### Scenario: Scoped scan for a single microservice module

- **WHEN** `memory analyze services/auth-service/` runs on a microservice project
- **THEN** the system SHALL only scan files under that directory

#### Scenario: Scoped scan produces focused AI context

- **WHEN** `memory analyze services/auth-service/` discovers 12 files with 8 exported symbols
- **THEN** the AI agent SHALL receive a focused discovery dump limited to the auth-service scope

### Requirement: Project mode detection for unscoped scans

When `memory analyze` runs without a path argument, the system SHALL auto-detect the project structure. If the project has a `services/` or `packages/` directory with subdirectories, the system SHALL treat it as a microservice project and scan all service directories. Otherwise, if `src/` has subdirectories, the system SHALL treat it as a monolith project and scan the entire tree.

When a path argument is provided, detection is bypassed — the system scans only the given directory.

#### Scenario: Monolith project full scan

- **WHEN** `memory analyze` runs on a monolith project with `src/auth/` and `src/payment/`
- **THEN** the system SHALL scan all files under `src/`

#### Scenario: Microservice project full scan

- **WHEN** `memory analyze` runs on a project with `services/auth-service/` and `services/payment-service/`
- **THEN** the system SHALL scan files under both service directories

#### Scenario: Path argument overrides detection

- **WHEN** `memory analyze services/auth-service/` is invoked
- **THEN** the system SHALL only scan that directory, regardless of project structure

### Requirement: Symbol extraction via tree-sitter (6 languages, no classification)

The `memory analyze` command SHALL use tree-sitter to extract language-level symbols from source files. The system SHALL support six target languages: TypeScript, JavaScript, Vue (frontend); Java, Python, Go (backend). The extraction result SHALL be written to `.memory/.analyze-dump.json` as a raw discovery dump.

The system SHALL NOT classify extracted symbols into node types (System/Component/API/etc.). Classification is deferred to the AI agent via the memory-build skill, which reads the dump and applies structured knowledge.

#### Scenario: Extract TypeScript symbols

- **WHEN** `memory analyze src/auth/` scans `token-service.ts` containing `export function issueToken()` and `import { sign } from 'jsonwebtoken'`
- **THEN** the system SHALL record `issueToken` as an exported function and `sign` as an imported symbol in the discovery dump

#### Scenario: Extract Python symbols

- **WHEN** `memory analyze services/user/` scans `models.py` containing `class User(Model)` and `from .config import DB_URL`
- **THEN** the system SHALL record `User` as a class and `DB_URL` as an imported config reference

#### Scenario: Extract Java symbols

- **WHEN** `memory analyze services/order/` scans `OrderService.java` containing `public class OrderService` and `import com.example.PaymentClient`
- **THEN** the system SHALL record `OrderService` as a class and `PaymentClient` as an imported class reference

#### Scenario: Extract Go symbols

- **WHEN** `memory analyze services/gateway/` scans `handler.go` containing `func HandleRequest()` and `import "internal/auth"`
- **THEN** the system SHALL record `HandleRequest` as a function and `internal/auth` as an imported package

#### Scenario: Extract Vue symbols

- **WHEN** `memory analyze src/views/` scans `Login.vue` containing `export default { methods: { login() {} } }` and `import TokenService from '@/services/token'`
- **THEN** the system SHALL record `login` as a component method and `TokenService` as an imported module

#### Scenario: Discovery dump is language-tagged

- **WHEN** `memory analyze` completes extraction
- **THEN** the system SHALL write `.memory/.analyze-dump.json` containing arrays of files, functions, classes, imports, configs, and route candidates, each tagged with `language` and `filePath`

### Requirement: No automatic node type classification

The `memory analyze` command SHALL NOT classify extracted symbols into node types (System/Component/API/Config/Flow/Decision). Classification is deferred to the AI agent via the memory-build skill, which reads `.analyze-dump.json` and applies structured knowledge to create properly typed `.md` files.

#### Scenario: analyze produces raw dump only

- **WHEN** `memory analyze src/auth/` completes
- **THEN** the system SHALL write only `.memory/.analyze-dump.json` and SHALL NOT create any `.md` skeleton files under `.memory/systems/`, `.memory/components/`, etc.

#### Scenario: AI classifies from dump

- **WHEN** the AI agent runs the memory-build skill after analyze
- **THEN** it SHALL read `.analyze-dump.json`, determine node types for each discovered symbol, and create `.md` files with correct frontmatter

### Requirement: Analyze pipeline runs rebuild at the end

After AI completes classification and generates all `.md` files, the system SHALL support running `memory rebuild` to update `index.json` and `graph.json`. This ensures the generated knowledge is immediately searchable.

#### Scenario: rebuild after AI generation

- **WHEN** AI creates 15 `.md` files via memory-write after analyze
- **THEN** `memory rebuild` SHALL index all new entries and subsequent `memory search` SHALL return them
