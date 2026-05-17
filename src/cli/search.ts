// memory search <query> — cross-type search with summary output (layer 1)

import { SearchOrchestrator } from '../core/search/orchestrator.js';
import { defaultSearchEngineRegistry } from '../core/backend.js';
import { getMemoryDir, initMemoryDir } from '../storage/repo-manager.js';

export async function searchCommand(queryArg: string, options: {
  category?: string;
  tag?: string;
  top?: string;
  format?: string;
  strategy?: string;
}) {
  const projectRoot = process.cwd();
  const memoryDir = getMemoryDir(projectRoot);
  initMemoryDir(projectRoot);

  const registry = defaultSearchEngineRegistry(projectRoot);
  const orchestrator = new SearchOrchestrator(registry);

  const results = await orchestrator.search(queryArg, {
    category: options.category,
    tag: options.tag,
    top: parseInt(options.top || '10', 10),
    strategy: (options.strategy as any) || 'auto',
  });

  if (results.length === 0) {
    console.log('No results found.');
    return;
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Show engine info
  const engines = orchestrator.getEngines();
  const engineInfo = engines.length > 0 ? ` (engines: ${engines.join(', ')})` : '';

  // Table output
  console.log('');
  console.log(`Search results${engineInfo}:`);
  console.log('');
  for (const r of results) {
    console.log(`  ${r.score.toFixed(1)}  ${r.type.padEnd(10)}  ${r.id.padEnd(30)}  ${r.tags.join(', ')}`);
    console.log(`       ${r.summary}`);
    console.log('');
  }
}
