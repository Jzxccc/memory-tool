## ADDED Requirements

### Requirement: Skills defined in TypeScript source files

Each skill SHALL be defined as a TypeScript source file that exports the complete SKILL.md content as a string constant.

#### Scenario: Skill source structure

- **WHEN** developer opens `src/skills/memory-build.ts`
- **THEN** file exports `const SKILL = \`...\`` containing the full frontmatter + body
- **AND** file exports metadata: `const NAME = 'memory-build'`

### Requirement: Skill index aggregates all skills

A central `src/skills/index.ts` SHALL export a registry of all 5 skills with their names, content, and metadata.

#### Scenario: Skill registry export

- **WHEN** `src/skills/index.ts` is imported
- **THEN** `SKILLS` is a `Map<string, SkillDef>` keyed by skill name
- **AND** each `SkillDef` contains `{ name, content, description }`

### Requirement: Build script generates SKILL.md files

The `build` npm script SHALL generate SKILL.md files into the three tool directories as a post-compile step.

#### Scenario: Build output

- **WHEN** `npm run build` is executed
- **THEN** `tsc` compiles TypeScript to `dist/`
- **THEN** `scripts/generate-skills.js` writes SKILL.md files to `.claude/`, `.codebuddy/`, `.lingma/`
- **AND** all 5 skills are present in each tool's directory

### Requirement: Generated files are in .gitignore

Generated SKILL.md files SHALL be listed in `.gitignore` since they can be regenerated from source.

#### Scenario: Git excludes generated skills

- **WHEN** `git status` is run after `npm run build`
- **THEN** `.claude/skills/memory/*/SKILL.md` files are ignored by git
- **AND** `.codebuddy/skills/memory-*/SKILL.md` files are ignored by git
- **AND** `.lingma/skills/memory-*/SKILL.md` files are ignored by git
- **BUT** `src/skills/*.ts` source files ARE tracked by git

### Requirement: Init command can use compiled or source skills

The `memory init` command SHALL load skill templates from compiled assets when installed as npm package, or from `src/` when running in dev mode.

#### Scenario: npm package mode

- **WHEN** `memory init --tool claude` is run from a globally installed package
- **THEN** skill content is loaded from bundled compiled assets
- **AND** no TypeScript compilation is required on the user's machine

#### Scenario: Development mode

- **WHEN** `memory init --tool claude` is run from `tsx src/cli/index.ts` in the repo
- **THEN** skill content is imported directly from `src/skills/`
