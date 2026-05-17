## ADDED Requirements

### Requirement: Init command writes skill files to target project

The `memory init` command SHALL write the 5 memory skill files into the target project's skill directories.

#### Scenario: Init to single tool

- **WHEN** user runs `memory init --tool claude`
- **THEN** 5 SKILL.md files are created under `.claude/skills/memory/<name>/SKILL.md`
- **AND** existing directories are preserved

#### Scenario: Init to all tools

- **WHEN** user runs `memory init --all`
- **THEN** 5 SKILL.md files are created in `.claude/`, `.codebuddy/`, and `.lingma/` directories
- **AND** each tool uses its correct directory convention

### Requirement: Init respects directory conventions per tool

The `memory init` command SHALL use the correct directory structure for each target tool.

| Tool | Convention | Skill Path |
|------|-----------|------------|
| Claude | Nested | `.claude/skills/memory/{name}/SKILL.md` |
| CodeBuddy | Flat | `.codebuddy/skills/{name}/SKILL.md` |
| Lingma | Flat | `.lingma/skills/{name}/SKILL.md` |

#### Scenario: Claude directory convention

- **WHEN** user runs `memory init --tool claude`
- **THEN** `memory-build/SKILL.md` is created under `.claude/skills/memory/`
- **AND** all 5 skills share the `.claude/skills/memory/` parent directory

#### Scenario: CodeBuddy directory convention

- **WHEN** user runs `memory init --tool codebuddy`
- **THEN** `memory-build/SKILL.md` is created under `.codebuddy/skills/`
- **AND** each skill is a direct subdirectory of `.codebuddy/skills/`

### Requirement: Init skips existing files by default

The `memory init` command SHALL skip skill files that already exist, unless `--force` is specified.

#### Scenario: Skip existing

- **WHEN** user runs `memory init --tool claude`
- **AND** `.claude/skills/memory/memory-build/SKILL.md` already exists
- **THEN** that file is skipped and a warning is printed
- **AND** non-existing skill files are created normally

#### Scenario: Force overwrite

- **WHEN** user runs `memory init --tool claude --force`
- **THEN** all 5 SKILL.md files are overwritten with fresh content

### Requirement: Init reports results

The `memory init` command SHALL report which files were created, skipped, and any errors.

#### Scenario: Summary output

- **WHEN** user runs `memory init --all`
- **THEN** total created count and skipped count are printed
- **AND** any errors are reported with the affected file path
