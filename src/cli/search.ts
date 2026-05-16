// memory search <query> — cross-type search with summary output (layer 1)

import * as path from 'node:path';
import { SearchOrchestrator } from '../core/search/orchestrator.js';
import { FileEngine } from '../core/search/file-engine.js';
import { getMemoryDir, initMemoryDir } from '../storage/repo-manager.js';

export async function searchCommand(queryArg: string, options: {
  category?: string;
  tag?: string;
  top?: string;
  format?: string;
}) {
  const projectRoot = process.cwd();
  const memoryDir = getMemoryDir(projectRoot);
  initMemoryDir(projectRoot);

  const orchestrator = new SearchOrchestrator();
  orchestrator.addEngine(new FileEngine(memoryDir));

  const results = await orchestrator.search(queryArg, {
    category: options.category,
    tag: options.tag,
    top: parseInt(options.top || '10', 10),
  });

  if (results.length === 0) {
    console.log('No results found.');
    return;
  }

  if (options.format === 'json') {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Table output
  console.log('');
  for (const r of results) {
    console.log(`  ${r.score.toFixed(1)}  ${r.type.padEnd(10)}  ${r.id.padEnd(30)}  ${r.tags.join(', ')}`);
    console.log(`       ${r.summary}`);
    console.log('');
  }
}
