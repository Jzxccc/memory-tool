---
id: component/lazy-action
type: component
summary: Lazy command loading pattern — wraps dynamic import for Commander.js commands, deferring module load until command invocation
tags: [cli, lazy-load, commander, pattern]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/cli/lazy-action.ts
language: typescript
exports:
  - createLazyAction
relates: [system/cli]
---

# LazyAction 懒加载模式

基于 GitNexus 的 `createLazyAction` 模式，将 Commander.js 命令模块延迟到实际调用时才加载。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `createLazyAction` | `<T>(importFn, exportName) => (...args: T) => Promise<void>` | 创建延迟加载的命令处理器 |

## 工作原理

```typescript
function createLazyAction<T>(
  importFn: () => Promise<Record<string, (...args: T) => Promise<void>>>,
  exportName: string,
) {
  return async (...args: T) => {
    const mod = await importFn();
    await mod[exportName](...args);
  };
}
```

## 使用位置

`cli/index.ts` 中所有 8 个子命令都使用此模式：

```typescript
.action(createLazyAction(() => import('./analyze.js'), 'analyzeCommand'));
.action(createLazyAction(() => import('./search.js'), 'searchCommand'));
// ... 6 more commands
```

## 优势

- **快速启动**: 文件注册时命令模块不加载，仅在 command 被调用时才执行 `import()`
- **隔离错误**: 某命令模块的加载错误不影响其他命令
- **类型安全**: 泛型 `T` 约束参数类型，`Record<string, ...>` 约束导出的函数名

## 来源

基于 GitNexus 项目中已验证的 lazy-loading 模式，被 memory-tool 采纳以减少 CLI 冷启动延迟。
