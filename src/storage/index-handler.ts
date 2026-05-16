// Reads and writes `index.json` — metadata index with SHA256 content hashes
// for stale detection. Based on GitNexus's content-addressed cache pattern.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { NodeType } from '../types/node-types.js';

export interface IndexEntry {
  id: string;
  type: NodeType;
  contentHash: string;
  frontmatterHash: string;
  tags: string[];
  lastModified: string;
  filePath: string; // Relative to .memory/
}

export interface IndexFile {
  schemaVersion: number;
  lastFullIndex: string; // ISO-8601
  entryCount: number;
  entries: Record<string, IndexEntry>; // Keyed by ID
}

const SCHEMA_VERSION = 1;

export function computeSHA256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function createIndexEntry(
  id: string,
  type: NodeType,
  fullContent: string,
  frontmatterContent: string,
  tags: string[],
  filePath: string,
): IndexEntry {
  return {
    id,
    type,
    contentHash: computeSHA256(fullContent),
    frontmatterHash: computeSHA256(frontmatterContent),
    tags,
    lastModified: new Date().toISOString(),
    filePath,
  };
}

export function readIndex(indexPath: string): IndexFile | null {
  if (!fs.existsSync(indexPath)) return null;
  try {
    const raw = fs.readFileSync(indexPath, 'utf-8');
    return JSON.parse(raw) as IndexFile;
  } catch {
    return null;
  }
}

export function writeIndex(indexPath: string, index: IndexFile): void {
  const dir = path.dirname(indexPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Atomic write: write to temp, then rename
  const tmpPath = indexPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(index, null, 2), 'utf-8');
  fs.renameSync(tmpPath, indexPath);
}

export function createEmptyIndex(): IndexFile {
  return {
    schemaVersion: SCHEMA_VERSION,
    lastFullIndex: new Date().toISOString(),
    entryCount: 0,
    entries: {},
  };
}

export function checkStale(
  index: IndexFile,
  memoryDir: string,
): { stale: string[]; missing: string[]; fresh: number } {
  const stale: string[] = [];
  const missing: string[] = [];
  let fresh = 0;

  for (const [id, entry] of Object.entries(index.entries)) {
    const filePath = path.join(memoryDir, entry.filePath);
    if (!fs.existsSync(filePath)) {
      missing.push(id);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const currentHash = computeSHA256(content);
    if (currentHash !== entry.contentHash) {
      stale.push(id);
    } else {
      fresh++;
    }
  }

  return { stale, missing, fresh };
}
