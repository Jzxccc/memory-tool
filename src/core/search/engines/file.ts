// File-based search engine: keyword matching + frontmatter weighted scoring.
// Searches Markdown files under .memory/ using content and frontmatter fields.

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EngineCapability, ParsedQuery, SearchEngine, SearchOptions, SearchResult } from '../../../types/search-types.js';
import { listNodeFiles, parseNodeId } from '../../../storage/repo-manager.js';

// Scoring weights
const WEIGHTS = {
  ID_MATCH: 5,
  SUMMARY_MATCH: 3,
  TAG_MATCH: 1,
  BODY_OCCURRENCE: 0.5,
  METHOD_MATCH: 4,
  ROUTE_MATCH: 4,
} as const;

function extractFrontmatter(content: string): { frontmatter: string; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function parseFrontmatter(fm: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = fm.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim();
    let value: unknown = line.substring(colonIdx + 1).trim();
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    result[key] = value;
  }

  // Post-process: extract method names from nested YAML
  const methodNames = extractMethodNamesFromYaml(fm);
  if (methodNames.length > 0) {
    result.methods = methodNames.map(name => ({ name }));
  }

  return result;
}

// Extract method names from YAML frontmatter with nested structure
function extractMethodNamesFromYaml(fm: string): string[] {
  const names: string[] = [];
  const lines = fm.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s+-\s+name:\s*(\S+)/);
    if (match) {
      names.push(match[1]);
    }
  }
  return names;
}

function matchTerm(text: string, term: string): number {
  const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function scoreFile(
  content: string,
  query: ParsedQuery,
  options: SearchOptions,
  filePath: string,
  memoryDir: string,
): SearchResult | null {
  const parsed = extractFrontmatter(content);
  if (!parsed) return null;

  const fm = parseFrontmatter(parsed.frontmatter);
  const id = parseNodeId(filePath) || (fm.id as string) || path.basename(filePath, '.md');
  const type = (fm.type as string) || 'unknown';
  const summary = (fm.summary as string) || '';
  const tags = Array.isArray(fm.tags) ? fm.tags as string[] : [];

  // Extract methods from frontmatter (depth extraction)
  const methods = Array.isArray(fm.methods) ? fm.methods as Array<Record<string, unknown>> : [];
  const methodNames: string[] = methods
    .map((m: Record<string, unknown>) => (m.name as string) || '')
    .filter((n: string) => n.length > 0);

  // Count routes in body
  const routeMatches = parsed.body.match(/\| \w+ \| (\/[\w/-]*)/g);
  const routeCount = routeMatches ? routeMatches.length : 0;

  if (options.category && type !== options.category) return null;
  if (options.tag && !tags.includes(options.tag)) return null;

  // Method name filter
  if (options.methodName) {
    const found = methodNames.some((n: string) =>
      n.toLowerCase().includes(options.methodName!.toLowerCase())
    );
    if (!found && !parsed.body.toLowerCase().includes(options.methodName.toLowerCase())) {
      return null;
    }
  }

  // Route path filter
  if (options.routePath) {
    if (!parsed.body.includes(options.routePath)) {
      return null;
    }
  }

  const operator = query.operator;
  let totalScore = 0;
  let allMatched = true;

  for (const term of query.terms) {
    let termScore = 0;

    if (id.toLowerCase().includes(term.toLowerCase())) {
      termScore += WEIGHTS.ID_MATCH;
    }
    termScore += matchTerm(summary, term) * WEIGHTS.SUMMARY_MATCH;
    for (const tag of tags) {
      if (tag.toLowerCase().includes(term.toLowerCase())) {
        termScore += WEIGHTS.TAG_MATCH;
      }
    }
    // Method name matching
    for (const mName of methodNames) {
      if (mName.toLowerCase().includes(term.toLowerCase())) {
        termScore += WEIGHTS.METHOD_MATCH;
      }
    }
    // Route path matching
    if (routeMatches) {
      for (const rm of routeMatches) {
        if (rm.toLowerCase().includes(term.toLowerCase())) {
          termScore += WEIGHTS.ROUTE_MATCH;
        }
      }
    }
    termScore += matchTerm(parsed.body, term) * WEIGHTS.BODY_OCCURRENCE;

    if (termScore === 0) {
      if (operator === 'AND') {
        allMatched = false;
        break;
      }
      continue;
    }
    totalScore += termScore;
  }

  if (!allMatched || totalScore === 0) return null;

  // Enhanced summary
  let enhancedSummary = summary || '(no summary)';
  if (methodNames.length > 0) {
    const preview = methodNames.slice(0, 3).join(', ');
    enhancedSummary += ` [${methodNames.length} methods: ${preview}${methodNames.length > 3 ? '...' : ''}]`;
  }
  if (routeCount > 0) {
    enhancedSummary += ` [${routeCount} routes]`;
  }

  return {
    id,
    type,
    summary: enhancedSummary,
    tags,
    score: totalScore,
    source: 'file',
    methodCount: methodNames.length,
    methodNames,
    routeCount,
  };
}

export class FileEngine implements SearchEngine {
  name = 'file';
  capabilities: EngineCapability[] = ['keyword'];
  priority = 1;

  constructor(private memoryDir: string) {}

  async healthCheck(): Promise<boolean> {
    try {
      const fs = await import('node:fs');
      return fs.existsSync(this.memoryDir);
    } catch {
      return false;
    }
  }

  async search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]> {
    const files = listNodeFiles(this.memoryDir);
    const results: SearchResult[] = [];

    for (const relPath of files) {
      const fullPath = path.join(this.memoryDir, relPath);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const result = scoreFile(content, query, options, relPath, this.memoryDir);
        if (result) results.push(result);
      } catch {
        // Skip unreadable files
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.top);
  }
}
