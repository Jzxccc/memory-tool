// memory rebuild — regenerate index.json and graph.json from .md files

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getMemoryDir, listNodeFiles, parseNodeId } from '../storage/repo-manager.js';
import {
  createIndexEntry,
  writeIndex,
  createEmptyIndex,
  type IndexFile,
} from '../storage/index-handler.js';
import { MemoryGraph } from '../core/graph/graph.js';
import { writeGraph } from '../core/graph/graph-io.js';
import type { GraphRelationship } from '../types/relation-types.js';
import type { Frontmatter, FlowFrontmatter } from '../types/node-types.js';

function extractFrontmatter(content: string): { frontmatter: string; body: string } | null {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function parseYamlLike(text: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = text.split('\n');
  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0) continue;
    const key = line.substring(0, colonIdx).trim();
    let value: unknown = line.substring(colonIdx + 1).trim();
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(s => s.trim().replace(/"/g, '')).filter(s => s.length > 0);
    }
    result[key] = value;
  }
  return result;
}

export async function rebuildCommand(options: {
  force?: boolean;
  engine?: string;
}) {
  const projectRoot = process.cwd();
  const memoryDir = getMemoryDir(projectRoot);
  const indexPath = path.join(memoryDir, 'index.json');
  const graphPath = path.join(memoryDir, 'graph.json');

  console.log('Rebuilding index...');

  // Phase 1: Scan
  const files = listNodeFiles(memoryDir);
  console.log(`  Scan: ${files.length} files found`);

  // Phase 2: Parse
  const index = createEmptyIndex();
  const graph = new MemoryGraph();
  let parsed = 0;

  for (const relPath of files) {
    const fullPath = path.join(memoryDir, relPath);
    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const parsedContent = extractFrontmatter(content);
      if (!parsedContent) continue;

      const fm = parseYamlLike(parsedContent.frontmatter);
      const id = (fm.id as string) || parseNodeId(relPath) || path.basename(relPath, '.md');
      const type = (fm.type as string) || 'unknown';
      const tags = Array.isArray(fm.tags) ? fm.tags as string[] : [];
      const relates = Array.isArray(fm.relates) ? fm.relates as string[] : [];
      const depends = Array.isArray(fm.depends_on) ? fm.depends_on as string[] : [];

      // Add to index
      index.entries[id] = createIndexEntry(
        id,
        type as any,
        content,
        parsedContent.frontmatter,
        tags,
        relPath,
      );

      // Add node to graph
      graph.addNode({ id, type, data: fm });

      // Phase 4: Link — add relationship edges
      // contains (for flow steps and relates)
      for (const relatedId of relates) {
        graph.addEdge({
          from: id,
          to: relatedId,
          type: 'references',
          confidence: 1.0,
        });
      }

      // depends_on
      for (const depId of depends) {
        graph.addEdge({
          from: id,
          to: depId,
          type: 'depends_on',
          confidence: 1.0,
        });
      }

      // Flow steps → flows_through
      if (type === 'flow' && fm.steps) {
        const steps = fm.steps as Array<{ order: number; component: string; description: string }>;
        for (const step of steps) {
          graph.addEdge({
            from: id,
            to: step.component,
            type: 'flows_through',
            step: step.order,
            confidence: 1.0,
          });
        }
      }

      parsed++;
    } catch (err) {
      console.error(`  Error parsing ${relPath}: ${err}`);
    }
  }

  index.entryCount = parsed;

  // Phase 5: Write
  console.log(`  Parse: ${parsed} entries parsed`);
  writeIndex(indexPath, index);
  console.log(`  Index: written to index.json`);
  writeGraph(graphPath, graph);
  console.log(`  Graph: ${graph.getEdgeCount()} relationships written to graph.json`);

  // Engine mode
  if (options.engine === 'libsql') {
    console.log(`  Engine: libsql mode not yet implemented`);
  }

  console.log(`\nDone! ${parsed} entries indexed.`);
}
