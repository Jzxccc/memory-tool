// memory status — health check with entry count, type breakdown, staleness, engine info

import * as path from 'node:path';
import { getMemoryDir, listNodeFiles, parseNodeId } from '../storage/repo-manager.js';
import { readIndex, checkStale } from '../storage/index-handler.js';
import { defaultSearchEngineRegistry } from '../core/backend.js';

export async function statusCommand() {
  const projectRoot = process.cwd();
  const memoryDir = getMemoryDir(projectRoot);
  const indexPath = path.join(memoryDir, 'index.json');

  // Count by type
  const files = listNodeFiles(memoryDir);
  const typeCounts: Record<string, number> = {};
  for (const file of files) {
    const id = parseNodeId(file);
    if (id) {
      const type = id.split('/')[0];
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }
  }

  console.log('');
  console.log('知识库状态');
  console.log('────────────────────────────────');
  console.log(`条目总数:        ${files.length}`);
  console.log(`系统模块:        ${typeCounts['system'] || 0}`);
  console.log(`业务流程:        ${typeCounts['flow'] || 0}`);
  console.log(`实现组件:        ${typeCounts['component'] || 0}`);
  console.log(`配置项:          ${typeCounts['config'] || 0}`);
  console.log(`API 接口:        ${typeCounts['api'] || 0}`);
  console.log(`技术决策:        ${typeCounts['decision'] || 0}`);
  console.log('');

  // Engine health
  const registry = defaultSearchEngineRegistry(projectRoot);
  const engines = registry.getAll();
  console.log('搜索引擎:');
  for (const engine of engines) {
    const healthy = engine.healthCheck ? (await engine.healthCheck()) : true;
    const status = healthy ? '✓' : '✗';
    console.log(`  ${status} ${engine.name} (${engine.capabilities.join(', ')}, priority=${engine.priority})`);
  }
  console.log('');

  // Check staleness
  const index = readIndex(indexPath);
  if (index) {
    const { stale, missing, fresh } = checkStale(index, memoryDir);
    console.log(`索引新鲜度:      ${stale.length === 0 && missing.length === 0 ? '✓ 最新' : '✗ 有变更'}`);
    console.log(`  Fresh: ${fresh}, Stale: ${stale.length}, Missing: ${missing.length}`);
    if (stale.length > 0) {
      console.log(`  过期条目: ${stale.join(', ')}`);
    }
    if (missing.length > 0) {
      console.log(`  缺失条目: ${missing.join(', ')}`);
    }
    console.log(`  最后索引: ${index.lastFullIndex}`);
  } else {
    console.log('索引新鲜度:      无索引，请运行 memory rebuild');
  }
  console.log('');
}
