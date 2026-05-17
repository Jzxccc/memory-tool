import { describe, it, expect, vi } from 'vitest';
import { SearchEngineRegistry } from '../src/core/search/engines/registry.js';
import type { ParsedQuery, SearchEngine, SearchResult } from '../src/types/search-types.js';

function mockEngine(
  name: string,
  capabilities: ('keyword' | 'semantic' | 'hybrid')[],
  priority: number,
  healthy = true,
): SearchEngine {
  const results: SearchResult[] = [];
  return {
    name,
    capabilities,
    priority,
    search: vi.fn().mockResolvedValue(results),
    healthCheck: healthy !== undefined ? vi.fn().mockResolvedValue(healthy) : undefined,
  };
}

describe('SearchEngineRegistry', () => {
  it('registers and retrieves an engine', () => {
    const registry = new SearchEngineRegistry();
    const engine = mockEngine('test', ['keyword'], 0);
    registry.register(engine);
    expect(registry.get('test')).toBe(engine);
  });

  it('unregisters an engine', () => {
    const registry = new SearchEngineRegistry();
    const engine = mockEngine('test', ['keyword'], 0);
    registry.register(engine);
    registry.unregister('test');
    expect(registry.get('test')).toBeUndefined();
  });

  it('returns all engines sorted by priority', () => {
    const registry = new SearchEngineRegistry();
    const low = mockEngine('low', ['keyword'], 2);
    const high = mockEngine('high', ['keyword'], 0);
    const mid = mockEngine('mid', ['keyword'], 1);
    registry.register(low);
    registry.register(high);
    registry.register(mid);

    const all = registry.getAll();
    expect(all).toHaveLength(3);
    expect(all[0].name).toBe('high');
    expect(all[1].name).toBe('mid');
    expect(all[2].name).toBe('low');
  });

  it('filters engines by capability', () => {
    const registry = new SearchEngineRegistry();
    const keyword = mockEngine('keyword', ['keyword'], 0);
    const semantic = mockEngine('semantic', ['semantic'], 0);
    const hybrid = mockEngine('hybrid', ['hybrid'], 1);
    registry.register(keyword);
    registry.register(semantic);
    registry.register(hybrid);

    expect(registry.getByCapability('keyword')).toHaveLength(1);
    expect(registry.getByCapability('semantic')).toHaveLength(1);
    expect(registry.getByCapability('hybrid')).toHaveLength(1);
  });

  it('selects engines by strategy', async () => {
    const registry = new SearchEngineRegistry();
    const kw = mockEngine('kw', ['keyword'], 1);
    const sem = mockEngine('sem', ['semantic'], 0);
    registry.register(kw);
    registry.register(sem);

    const query: ParsedQuery = { terms: ['test'], operator: 'AND' };

    const keywordEngines = await registry.selectForQuery(query, 'keyword');
    expect(keywordEngines).toHaveLength(1);
    expect(keywordEngines[0].name).toBe('kw');

    const semanticEngines = await registry.selectForQuery(query, 'semantic');
    expect(semanticEngines).toHaveLength(1);
    expect(semanticEngines[0].name).toBe('sem');

    const autoEngines = await registry.selectForQuery(query, 'auto');
    expect(autoEngines).toHaveLength(2);
  });

  it('excludes unhealthy engines from selection', async () => {
    const registry = new SearchEngineRegistry();
    const healthy = mockEngine('healthy', ['keyword'], 0, true);
    const unhealthy = mockEngine('unhealthy', ['keyword'], 1, false);
    registry.register(healthy);
    registry.register(unhealthy);

    const query: ParsedQuery = { terms: ['test'], operator: 'AND' };
    const selected = await registry.selectForQuery(query, 'keyword');

    expect(selected).toHaveLength(1);
    expect(selected[0].name).toBe('healthy');
  });

  it('includes engines without healthCheck as healthy', async () => {
    const registry = new SearchEngineRegistry();
    const noCheck = mockEngine('no-check', ['keyword'], 0);
    delete (noCheck as any).healthCheck;
    registry.register(noCheck);

    const query: ParsedQuery = { terms: ['test'], operator: 'AND' };
    const selected = await registry.selectForQuery(query, 'keyword');

    expect(selected).toHaveLength(1);
    expect(selected[0].name).toBe('no-check');
  });

  it('getSize returns engine count', () => {
    const registry = new SearchEngineRegistry();
    registry.register(mockEngine('a', ['keyword'], 0));
    registry.register(mockEngine('b', ['semantic'], 0));
    expect(registry.getSize()).toBe(2);
  });
});
