// Unified backend shared by CLI and MCP server.
// Exposes search, read, graph, status, analyze, and rebuild operations.

import * as path from 'node:path';
import { getMemoryDir } from '../storage/repo-manager.js';
import { SearchOrchestrator } from './search/orchestrator.js';
import { FileEngine } from './search/file-engine.js';
import type { SearchResult } from '../types/search-types.js';

export interface BackendResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export class LocalBackend {
  private orchestrator: SearchOrchestrator;

  constructor(private projectRoot: string) {
    this.orchestrator = new SearchOrchestrator();
    const memoryDir = getMemoryDir(projectRoot);
    this.orchestrator.addEngine(new FileEngine(memoryDir));
  }

  async search(query: string, options?: { category?: string; tag?: string; top?: number }): Promise<SearchResult[]> {
    return this.orchestrator.search(query, {
      category: options?.category,
      tag: options?.tag,
      top: options?.top || 10,
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
