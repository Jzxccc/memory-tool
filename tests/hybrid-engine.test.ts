import { describe, it, expect, vi } from 'vitest';
import { HybridSearch } from '../src/core/search/engines/hybrid.js';
import type { ParsedQuery, SearchEngine, SearchResult } from '../src/types/search-types.js';

function mockEngine(
  name: string,
  results: SearchResult[],
  shouldThrow = false,
): SearchEngine {
  return {
    name,
    capabilities: ['keyword'],
    priority: 0,
    search: shouldThrow
      ? vi.fn().mockRejectedValue(new Error('fail'))
      : vi.fn().mockResolvedValue(results),
  };
}

function result(id: string, score: number): SearchResult {
  return { id, type: 'component', summary: `Summary ${id}`, tags: [], score, source: 'file' };
}

describe('HybridSearch', () => {
  const query: ParsedQuery = { terms: ['test'], operator: 'AND' };

  it('passes through with single keyword engine', async () => {
    const kw = mockEngine('kw', [result('a', 10), result('b', 5)]);
    const hybrid = new HybridSearch(kw);

    const results = await hybrid.search(query, { top: 10 });

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('a');
  });

  it('returns empty when no engines registered', async () => {
    const hybrid = new HybridSearch();
    const results = await hybrid.search(query, { top: 10 });
    expect(results).toHaveLength(0);
  });

  it('fuses keyword and semantic results via RRF', async () => {
    const kw = mockEngine('kw', [result('a', 10)]);
    const sem = mockEngine('sem', [result('a', 5), result('b', 3)]);
    const hybrid = new HybridSearch(kw, sem);

    const results = await hybrid.search(query, { top: 10 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe('a');
  });

  it('degrades gracefully when keyword engine fails', async () => {
    const kw = mockEngine('kw', [], true);
    const sem = mockEngine('sem', [result('b', 5)]);
    const hybrid = new HybridSearch(kw, sem);

    const results = await hybrid.search(query, { top: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('b');
  });

  it('degrades gracefully when semantic engine fails', async () => {
    const kw = mockEngine('kw', [result('a', 10)]);
    const sem = mockEngine('sem', [], true);
    const hybrid = new HybridSearch(kw, sem);

    const results = await hybrid.search(query, { top: 10 });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('a');
  });

  it('has correct metadata', () => {
    const hybrid = new HybridSearch();
    expect(hybrid.name).toBe('hybrid');
    expect(hybrid.capabilities).toEqual(['hybrid']);
    expect(hybrid.priority).toBe(0);
  });
});
