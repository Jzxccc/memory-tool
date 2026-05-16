import { describe, it, expect } from 'vitest';
import { computeSHA256, createIndexEntry, createEmptyIndex, writeIndex, readIndex } from './index-handler.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('index-handler', () => {
  it('computes SHA256 hash', () => {
    const hash = computeSHA256('hello');
    expect(hash).toHaveLength(64);
    // Same input = same hash
    expect(computeSHA256('hello')).toBe(hash);
    // Different input = different hash
    expect(computeSHA256('world')).not.toBe(hash);
  });

  it('creates index entry with hashes', () => {
    const entry = createIndexEntry(
      'component/test',
      'component',
      'full content',
      'frontmatter content',
      ['test', 'component'],
      'components/test.md',
    );

    expect(entry.id).toBe('component/test');
    expect(entry.type).toBe('component');
    expect(entry.tags).toContain('test');
    expect(entry.contentHash).toHaveLength(64);
    expect(entry.frontmatterHash).toHaveLength(64);
  });

  it('creates empty index', () => {
    const index = createEmptyIndex();
    expect(index.schemaVersion).toBe(1);
    expect(index.entryCount).toBe(0);
    expect(Object.keys(index.entries)).toHaveLength(0);
  });

  it('writes and reads index atomically', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-test-'));
    const indexPath = path.join(tmpDir, 'index.json');

    const index = createEmptyIndex();
    index.entries['component/a'] = createIndexEntry(
      'component/a', 'component', 'content', 'fm', ['tag'], 'a.md',
    );
    index.entryCount = 1;

    writeIndex(indexPath, index);
    expect(fs.existsSync(indexPath)).toBe(true);

    const loaded = readIndex(indexPath);
    expect(loaded).not.toBeNull();
    expect(loaded!.entryCount).toBe(1);
    expect(loaded!.entries['component/a'].id).toBe('component/a');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true });
  });
});
