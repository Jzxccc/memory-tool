// Reusable lazy-loading pattern for Commander.js commands.
// Based on GitNexus's createLazyAction pattern.

import type { Command } from 'commander';

export function createLazyAction<T extends unknown[]>(
  importFn: () => Promise<Record<string, (...args: T) => Promise<void>>>,
  exportName: string,
) {
  return async (...args: T) => {
    const mod = await importFn();
    await mod[exportName](...args);
  };
}
