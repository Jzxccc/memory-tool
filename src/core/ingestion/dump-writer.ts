// Writes discovery dump to .memory/.analyze-dump.json

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ExtractedSymbol } from './extractor.js';

export interface AnalyzeDump {
  generatedAt: string;
  mode: 'monolith' | 'micro';
  sourceCount: number;
  symbolCount: number;
  detail?: boolean;
  files: Array<{
    relativePath: string;
    language: string;
    symbolCount: number;
  }>;
  symbols: ExtractedSymbol[];
}

export function writeDump(memoryDir: string, dump: AnalyzeDump): string {
  const dumpPath = path.join(memoryDir, '.analyze-dump.json');
  fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2), 'utf-8');
  return dumpPath;
}
