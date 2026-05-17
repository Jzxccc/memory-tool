// Unified backend shared by CLI and MCP server.
// Exposes search, read, graph, status, analyze, and rebuild operations.

import * as path from 'node:path';
import { getMemoryDir } from '../storage/repo-manager.js';
import { SearchOrchestrator } from './search/orchestrator.js';
import { SearchEngineRegistry } from './search/engines/registry.js';
import { FileEngine } from './search/engines/file.js';
import { LibsqlEngine } from './search/engines/libsql.js';
import { HybridSearch } from './search/engines/hybrid.js';
import type { SearchResult } from '../types/search-types.js';

/**
 * Create the default search engine registry with FileEngine and
 * optionally LibsqlEngine (if database exists).
 */
export function defaultSearchEngineRegistry(projectRoot: string): SearchEngineRegistry {
  const registry = new SearchEngineRegistry();
  const memoryDir = getMemoryDir(projectRoot);

  // Always register FileEngine as the baseline keyword engine
  registry.register(new FileEngine(memoryDir));

  // Register HybridSearch that combines keyword (FileEngine) + semantic (future)
  const hybrid = new HybridSearch(new FileEngine(memoryDir));
  registry.register(hybrid);

  // Try to register LibsqlEngine (will be unhealthy if DB doesn't exist)
  registry.register(new LibsqlEngine(memoryDir));

  return registry;
}

export interface BackendResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class LocalBackend {
  private orchestrator: SearchOrchestrator;

  constructor(private projectRoot: string, registry?: SearchEngineRegistry) {
    this.orchestrator = new SearchOrchestrator(
      registry || defaultSearchEngineRegistry(projectRoot),
    );
  }

  async search(
    query: string,
    options?: { category?: string; tag?: string; top?: number; strategy?: string },
  ): Promise<SearchResult[]> {
    return this.orchestrator.search(query, {
      category: options?.category,
      tag: options?.tag,
      top: options?.top || 10,
      strategy: (options?.strategy as any) || 'auto',
    });
  }

  async read(id: string): Promise<string | null> {
    const memoryDir = getMemoryDir(this.projectRoot);
    const fs = await import('node:fs');
    const { getNodeFilePath } = await import('../storage/repo-manager.js');
    const filePath = getNodeFilePath(memoryDir, id);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  }

  async status(): Promise<{
    entryCount: number;
    typeCounts: Record<string, number>;
    stale: string[];
    missing: string[];
  }> {
    const memoryDir = getMemoryDir(this.projectRoot);
    const { listNodeFiles, parseNodeId } = await import('../storage/repo-manager.js');
    const { readIndex, checkStale } = await import('../storage/index-handler.js');

    const files = listNodeFiles(memoryDir);
    const typeCounts: Record<string, number> = {};
    for (const file of files) {
      const id = parseNodeId(file);
      if (id) {
        const type = id.split('/')[0];
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    }

    const indexPath = path.join(memoryDir, 'index.json');
    const index = readIndex(indexPath);
    const { stale, missing } = index
      ? checkStale(index, memoryDir)
      : { stale: [], missing: [] };

    return { entryCount: files.length, typeCounts, stale, missing };
  }
}
