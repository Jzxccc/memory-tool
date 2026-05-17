## 1. Main program help enhancement

- [x] 1.1 Add `.addHelpText('after', ...)` to `memory` root program with workflow examples
- [x] 1.2 Verify `memory -h` / `memory --help` shows examples
- [x] 1.3 Verify `memory -V` / `memory --version` prints version

## 2. Subcommand help examples

- [x] 2.1 Add help examples to `memory analyze` (with/without path)
- [x] 2.2 Add help examples to `memory search` (| OR, & AND, --category, --strategy)
- [x] 2.3 Add help examples to `memory read` (basic read, --related, --summary)
- [x] 2.4 Add help examples to `memory graph` (depth, direction)
- [x] 2.5 Add help examples to `memory rebuild` (basic, --engine libsql)
- [x] 2.6 Add help examples to `memory status`
- [x] 2.7 Add help examples to `memory audit`
- [x] 2.8 Add help examples to `memory mcp`

## 3. Verification

- [x] 3.1 Build and verify all 8 subcommand --help outputs
- [x] 3.2 Verify -h / --help on main program
- [x] 3.3 Verify -V / --version
- [x] 3.4 Update `system/cli` knowledge entry with help examples note
- [x] 3.5 Run `memory rebuild` to index
