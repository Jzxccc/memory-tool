#!/usr/bin/env node
import { Command } from 'commander';
import { createLazyAction } from './lazy-action.js';

const program = new Command();

program
  .name('memory')
  .description('AI-assisted programming tool knowledge base — document project-level code business logic')
  .version('0.1.0');

// memory analyze [path]
program
  .command('analyze [path]')
  .description('Extract symbols from source code using tree-sitter')
  .action(createLazyAction(() => import('./analyze.js'), 'analyzeCommand'));

// memory search <query>
program
  .command('search <query>')
  .description('Search knowledge base (supports | for OR, & for AND)')
  .option('-c, --category <type>', 'Filter by node type')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('--top <n>', 'Limit results', '10')
  .option('--format <fmt>', 'Output format (json)', 'text')
  .action(createLazyAction(() => import('./search.js'), 'searchCommand'));

// memory read <id>
program
  .command('read <id>')
  .description('Read full content of a knowledge entry')
  .option('--related', 'Include related node summaries')
  .option('--summary', 'Only show summary line')
  .option('--format <fmt>', 'Output format (json)', 'text')
  .action(createLazyAction(() => import('./read.js'), 'readCommand'));

// memory graph <id>
program
  .command('graph <id>')
  .description('Traverse relationship graph from a node')
  .option('--depth <n>', 'Traversal depth', '1')
  .option('--direction <dir>', 'Edge direction (in|out|both)', 'both')
  .action(createLazyAction(() => import('./graph.js'), 'graphCommand'));

// memory status
program
  .command('status')
  .description('Check knowledge base health and staleness')
  .action(createLazyAction(() => import('./status.js'), 'statusCommand'));

// memory rebuild
program
  .command('rebuild')
  .description('Rebuild index.json and graph.json from .md files')
  .option('--force', 'Skip confirmation')
  .option('--engine <engine>', 'Storage engine (file|libsql)', 'file')
  .action(createLazyAction(() => import('./rebuild.js'), 'rebuildCommand'));

// memory audit <id>
program
  .command('audit <id>')
  .description('Check staleness of a single entry')
  .action(createLazyAction(() => import('./audit.js'), 'auditCommand'));

// memory mcp
program
  .command('mcp')
  .description('Start MCP stdio server for AI tool integration')
  .action(createLazyAction(() => import('./mcp.js'), 'mcpCommand'));

program.parse();
