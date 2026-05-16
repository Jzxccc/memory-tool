// Reusable lazy-loading pattern for Commander.js commands.
// Based on GitNexus's createLazyAction pattern.
export function createLazyAction(importFn, exportName) {
    return async (...args) => {
        const mod = await importFn();
        await mod[exportName](...args);
    };
}
//# sourceMappingURL=lazy-action.js.map