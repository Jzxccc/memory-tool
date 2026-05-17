// Libsql (SQLite) search engine using FTS5 for full-text search.
// Scores normalized to 0-10 range using BM25.
//
// Uses @libsql/client as an optional dependency — degrades gracefully
// when the package is not installed or the database file is missing.

import type { EngineCapability, ParsedQuery, SearchEngine, SearchOptions, SearchResult } from '../../../types/search-types.js';

export class LibsqlEngine implements SearchEngine {
  name = 'libsql';
  capabilities: EngineCapability[] = ['keyword'];
  priority = 0;

  private memoryDir: string;
  private client: any = null;
  private loadAttempted = false;

  constructor(memoryDir: string) {
    this.memoryDir = memoryDir;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.tryConnect();
      if (!client) return false;

      const result = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='knowledge_fts'",
      );
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  async tryConnect(): Promise<any | null> {
    if (this.client) return this.client;
    if (this.loadAttempted) return null;

    this.loadAttempted = true;
    try {
      const libsql = await import('@libsql/client');
      const path = await import('node:path');
      const dbPath = path.join(this.memoryDir, 'memory.db');

      this.client = libsql.createClient({
        url: `file:${dbPath}`,
      });

      await this.client.execute('SELECT 1');
      return this.client;
    } catch {
      return null;
    }
  }

  async buildFtsIndex(entryContents: Array<{ id: string; type: string; tags: string; summary: string; body: string }>): Promise<void> {
    const client = await this.tryConnect();
    if (!client) return;

    try {
      await client.execute('DROP TABLE IF EXISTS knowledge_fts');
      await client.execute(`
        CREATE VIRTUAL TABLE knowledge_fts USING fts5(
          id, type, tags, summary, body,
          content='', contentless_delete=1
        )
      `);

      for (const entry of entryContents) {
        await client.execute({
          sql: 'INSERT INTO knowledge_fts (id, type, tags, summary, body) VALUES (?, ?, ?, ?, ?)',
          args: [entry.id, entry.type, entry.tags, entry.summary, entry.body],
        });
      }
    } catch (err) {
      console.error(`LibsqlEngine: FTS index build failed: ${err}`);
    }
  }

  async search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]> {
    const client = await this.tryConnect();
    if (!client) return [];

    try {
      const matchTerms = query.terms.map((t: string) => `"${t.replace(/"/g, '""')}"`);
      const matchClause = query.operator === 'OR'
        ? matchTerms.join(' OR ')
        : matchTerms.join(' ');

      let sql = `
        SELECT id, type, tags, summary, bm25(knowledge_fts, 0, 1, 0, 0.75) as bm25_score
        FROM knowledge_fts
        WHERE knowledge_fts MATCH ?
      `;
      const args: any[] = [matchClause];

      if (options.category) {
        sql += ' AND type = ?';
        args.push(options.category);
      }

      if (options.tag) {
        sql += ' AND tags MATCH ?';
        args.push(`"${options.tag}"`);
      }

      sql += ' ORDER BY bm25_score LIMIT ?';
      args.push(options.top);

      const result = await client.execute({ sql, args });

      const rows = result.rows as Array<{ id: string; type: string; tags: string; summary: string; bm25_score: number }>;
      if (rows.length === 0) return [];

      const maxBm25 = Math.max(...rows.map(r => Math.abs(r.bm25_score)));

      return rows.map(row => ({
        id: row.id,
        type: row.type,
        summary: row.summary || '(no summary)',
        tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
        score: maxBm25 > 0 ? Math.round((Math.abs(row.bm25_score) / maxBm25) * 10 * 10) / 10 : 0,
        source: 'libsql' as const,
      }));
    } catch {
      return [];
    }
  }
}
