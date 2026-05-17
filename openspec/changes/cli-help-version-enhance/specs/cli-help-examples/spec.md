## ADDED Requirements

### Requirement: All commands SHALL include usage examples in help output
Every subcommand MUST use `.addHelpText('after', text)` to append usage examples after the default Commander.js help output.

#### Scenario: memory search --help shows examples
- **WHEN** user runs `memory search --help`
- **THEN** the output SHALL include examples demonstrating `|` (OR) and `&` (AND) operators
- **AND** the output SHALL include an example of `--category` filter

#### Scenario: memory rebuild --help shows engine examples
- **WHEN** user runs `memory rebuild --help`
- **THEN** the output SHALL include an example of `--engine libsql`

#### Scenario: memory analyze --help shows path examples
- **WHEN** user runs `memory analyze --help`
- **THEN** the output SHALL include examples with and without path argument

### Requirement: Main program SHALL include global workflow examples
The main `memory --help` output MUST include a section explaining common workflows (analyze → search → read).

#### Scenario: memory --help shows workflow
- **WHEN** user runs `memory --help` or `memory -h`
- **THEN** the output SHALL include at least one workflow example showing a typical usage sequence

### Requirement: Version flag SHALL be accessible via -V and --version
The program MUST display its version number when invoked with `-V` or `--version`.

#### Scenario: memory -V shows version
- **WHEN** user runs `memory -V`
- **THEN** the program SHALL output the version string `0.1.0`

#### Scenario: memory --version shows version
- **WHEN** user runs `memory --version`
- **THEN** the program SHALL output the version string `0.1.0`
