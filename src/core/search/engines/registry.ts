// Search engine registry — manages engine registration, discovery,
// and selection by capability or query strategy.
//
// Decoupled from SearchOrchestrator so that other components (CLI help,
// status commands, health checks) can query the registry directly.

import type { EngineCapability, ParsedQuery, SearchEngine, SearchStrategy } from '../../../types/search-types.js';

export class SearchEngineRegistry {
  private engines = new Map<string, SearchEngine>();

  register(engine: SearchEngine): void {
    this.engines.set(engine.name, engine);
  }

  unregister(name: string): void {
    this.engines.delete(name);
  }

  get(name: string): SearchEngine | undefined {
    return this.engines.get(name);
  }

  getByCapability(capability: EngineCapability): SearchEngine[] {
    return Array.from(this.engines.values())
      .filter(e => e.capabilities.includes(capability))
      .sort((a, b) => a.priority - b.priority);
  }

  getAll(): SearchEngine[] {
    return Array.from(this.engines.values())
      .sort((a, b) => a.priority - b.priority);
  }

  getSize(): number {
    return this.engines.size;
  }

  async selectForQuery(
    _query: ParsedQuery,
    strategy: SearchStrategy = 'auto',
  ): Promise<SearchEngine[]> {
    let candidates: SearchEngine[];

    switch (strategy) {
      case 'keyword':
        candidates = this.getByCapability('keyword');
        break;
      case 'semantic':
        candidates = this.getByCapability('semantic');
        break;
      case 'hybrid':
        candidates = this.getByCapability('hybrid');
        break;
      case 'auto':
      default:
        candidates = this.getAll();
        break;
    }

    const healthResults = await Promise.all(
      candidates.map(async (engine) => {
        if (engine.healthCheck) {
          try {
            const healthy = await engine.healthCheck();
            return { engine, healthy };
          } catch {
            return { engine, healthy: false };
          }
        }
        return { engine, healthy: true };
      }),
    );

    return healthResults
      .filter(r => r.healthy)
      .map(r => r.engine);
  }
}
