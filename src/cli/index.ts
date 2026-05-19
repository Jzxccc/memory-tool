#!/usr/bin/env node
import { Command } from 'commander';
import { createLazyAction } from './lazy-action.js';

const program = new Command();

program
  .name('memory')
  .description('AI-assisted programming tool knowledge base — document project-level code business logic')
  .version('0.1.0')
  .addHelpText('after', `
Examples:
  $ memory analyze                  Analyze current project source code
  $ memory search "auth | login"    Search with OR operator
  $ memory search "auth & jwt"      Search with AND operator
  $ memory read component/scanner   Read full entry content
  $ memory graph system/cli         View relationship graph
  $ memory status                   Check knowledge base health
  $ memory rebuild --force          Rebuild index from .md files
  $ memory mcp                      Start MCP stdio server

Common workflow:
  memory analyze → memory-build skill → memory rebuild → memory search
`);

// memory analyze [path]
program
  .command('analyze [path]')
  .description('Extract symbols from source code using tree-sitter')
  .addHelpText('after', `
Examples:
  $ memory analyze                  Analyze entire current project
  $ memory analyze src/core/        Analyze specific directory

Uses tree-sitter when available, falls back to regex.
Output written to .memory/.analyze-dump.json
`)
  .action(createLazyAction(() => import('./analyze.js'), 'analyzeCommand'));

// memory search <query>
program
  .command('search <query>')
  .description('Search knowledge base (supports | for OR, & for AND)')
  .option('-c, --category <type>', 'Filter by node type')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('--top <n>', 'Limit results', '10')
  .option('--format <fmt>', 'Output format (json)', 'text')
  .option('-s, --strategy <strategy>', 'Search strategy (keyword|semantic|hybrid|auto)', 'auto')
  .addHelpText('after', `
Examples:
  $ memory search "cli"                           Basic keyword search
  $ memory search "auth | login"                  OR search — match any term
  $ memory search "auth & jwt"                    AND search — match all terms
  $ memory search "cli" -c component              Filter by category
  $ memory search "graph" -t search               Filter by tag
  $ memory search "cli" -s auto                   Auto strategy (all engines)
  $ memory search "cli" -s keyword                Keyword-only engines

Node types: system, flow, component, config, api, decision
`)
  .action(createLazyAction(() => import('./search.js'), 'searchCommand'));

// memory read <id>
program
  .command('read <id>')
  .description('Read full content of a knowledge entry')
  .option('--related', 'Include related node summaries')
  .option('--summary', 'Only show summary line')
  .option('--format <fmt>', 'Output format (json)', 'text')
  .addHelpText('after', `
Examples:
  $ memory read system/cli                        Read entry body
  $ memory read system/cli --summary              Show summary only
  $ memory read system/cli --related              Include related nodes
  $ memory read system/cli --format json          Output as JSON

Entry IDs follow the pattern: {type}/{slug}
e.g. system/cli, component/scanner, flow/code-analysis
`)
  .action(createLazyAction(() => import('./read.js'), 'readCommand'));

// memory graph <id>
program
  .command('graph <id>')
  .description('Traverse relationship graph from a node')
  .option('--depth <n>', 'Traversal depth', '1')
  .option('--direction <dir>', 'Edge direction (in|out|both)', 'both')
  .addHelpText('after', `
Examples:
  $ memory graph system/cli                       Default traversal (depth=1, both)
  $ memory graph system/cli --depth 2             Two levels of neighbors
  $ memory graph system/cli --direction out       Only outgoing edges
  $ memory graph system/cli --direction in        Only incoming edges

Edge types: references, depends_on, flows_through
`)
  .action(createLazyAction(() => import('./graph.js'), 'graphCommand'));

// memory status
program
  .command('status')
  .description('Check knowledge base health and staleness')
  .addHelpText('after', `
Examples:
  $ memory status                                 Show full health report

Displays: entry counts by type, engine health, index freshness (stale/missing)
`)
  .action(createLazyAction(() => import('./status.js'), 'statusCommand'));

// memory rebuild
program
  .command('rebuild')
  .description('Rebuild index.json and graph.json from .md files')
  .option('--force', 'Skip confirmation')
  .option('--engine <engine>', 'Storage engine (file|libsql)', 'file')
  .addHelpText('after', `
Examples:
  $ memory rebuild                                Rebuild index (asks confirmation)
  $ memory rebuild --force                        Rebuild without confirmation
  $ memory rebuild --engine libsql                Build FTS5 index for libsql engine

Regenerates index.json with SHA256 hashes and graph.json with relationships.
`)
  .action(createLazyAction(() => import('./rebuild.js'), 'rebuildCommand'));

// memory audit <id>
program
  .command('audit <id>')
  .description('Check staleness of a single entry')
  .addHelpText('after', `
Examples:
  $ memory audit component/scanner                Check if entry is up-to-date

Verifies: file existence, content hash match, referenced source file existence.
`)
  .action(createLazyAction(() => import('./audit.js'), 'auditCommand'));

// memory mcp [project-path]
program
  .command('mcp [project-path]')
  .description('Start MCP stdio server for AI tool integration')
  .addHelpText('after', `
Examples:
  $ memory mcp                                    Start MCP server on current project
  $ memory mcp /path/to/project                   Start MCP server for specific project

Provides 5 tools: memory_search, memory_read, memory_graph, memory_status, memory_categories
Provides 3 resources: memory://categories, memory://status, memory://tags
`)
  .action(createLazyAction(() => import('./mcp.js'), 'mcpCommand'));

// memory init
program
  .command('init')
  .description('Deploy memory skill files to target tool directories')
  .option('--tool <name>', 'Target tool (claude|codebuddy|lingma)')
  .option('--all', 'Deploy to all supported tools')
  .option('--force', 'Overwrite existing SKILL.md files')
  .addHelpText('after', `
Examples:
  $ memory init --tool claude                      Deploy to Claude only
  $ memory init --tool codebuddy                   Deploy to CodeBuddy only
  $ memory init --all                              Deploy to all tools
  $ memory init --all --force                      Overwrite all existing files

Directory conventions:
  Claude:    .claude/skills/memory/{name}/SKILL.md  (nested)
  CodeBuddy: .codebuddy/skills/{name}/SKILL.md      (flat)
  Lingma:    .lingma/skills/{name}/SKILL.md         (flat)
`)
  .action(createLazyAction(() => import('./init.js'), 'initCommand'));

program.parse();
