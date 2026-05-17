## 1. Skill source files

- [ ] 1.1 Create `src/skills/memory-build.ts` — export SKILL content string
- [ ] 1.2 Create `src/skills/memory-search.ts`
- [ ] 1.3 Create `src/skills/memory-read.ts`
- [ ] 1.4 Create `src/skills/memory-write.ts`
- [ ] 1.5 Create `src/skills/memory-status.ts`
- [ ] 1.6 Create `src/skills/index.ts` — aggregate registry of all 5 skills

## 2. Build script

- [ ] 2.1 Create `scripts/generate-skills.js` — reads compiled skills and writes SKILL.md files
- [ ] 2.2 Update `package.json` build script to include generate-skills step
- [ ] 2.3 Update `.gitignore` to exclude generated SKILL.md files
- [ ] 2.4 Verify `npm run build` produces all 15 SKILL.md files (3 tools × 5 skills)

## 3. Init command

- [ ] 3.1 Create `src/cli/init.ts` — `memory init` command with --tool, --all, --force options
- [ ] 3.2 Implement directory convention mapping (Claude nested, CodeBuddy/Lingma flat)
- [ ] 3.3 Implement skip-existing logic with --force override
- [ ] 3.4 Implement result reporting (created, skipped, errors)
- [ ] 3.5 Register init command in `src/cli/index.ts`

## 4. Migration

- [ ] 4.1 Remove manually maintained SKILL.md files from `.claude/skills/memory/`
- [ ] 4.2 Remove manually maintained SKILL.md files from `.codebuddy/skills/memory-*/`
- [ ] 4.3 Remove manually maintained SKILL.md files from `.lingma/skills/memory-*/`
- [ ] 4.4 Rebuild and verify `memory init --all --force` produces identical output

## 5. Verify

- [ ] 5.1 Run `npx tsc --noEmit` to verify TypeScript compilation
- [ ] 5.2 Run `npx vitest run` to verify all tests pass
- [ ] 5.3 Test `memory init --tool claude` on a clean project
- [ ] 5.4 Test `memory init --tool codebuddy` on a clean project
- [ ] 5.5 Test `memory init --all` on the GitNexus project
