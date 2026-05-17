---
id: component/search-registry
type: component
summary: Search engine registry — manages engine registration/discovery, capability-based lookup, strategy-based selection with health check filtering
tags: [search, registry, discovery, engine]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/engines/registry.ts
language: typescript
exports:
  - SearchEngineRegistry
depends_on:
  - system/types
relates: [system/core, component/search-orchestrator]
---

# SearchEngineRegistry 引擎注册表

可插拔的搜索引擎管理，支持按能力、策略、健康状态选择和过滤引擎。

## API

| 方法 | 说明 |
|------|------|
| `register(engine)` | 注册引擎（按 name 唯一标识） |
| `unregister(name)` | 移出引擎 |
| `get(name)` | 按名获取引擎 |
| `getAll()` | 所有引擎（按 priority 升序） |
| `getSize()` | 引擎数量 |
| `getByCapability(cap)` | 按能力过滤并排序 |
| `selectForQuery(query, strategy)` | 按策略选择 + 并行健康检查过滤 |

## 策略映射

| strategy | 选择逻辑 |
|----------|---------|
| `keyword` | `getByCapability('keyword')` |
| `semantic` | `getByCapability('semantic')` |
| `hybrid` | `getByCapability('hybrid')` |
| `auto` | `getAll()` — 所有引擎 |

## 健康检查

`selectForQuery()` 对候选项并行执行 `healthCheck()`，自动排除不健康的引擎。没有 `healthCheck` 方法的引擎视为健康。

## 注册示例

```typescript
const registry = new SearchEngineRegistry();
registry.register(new FileEngine(memoryDir));        // keyword, p=1
registry.register(new LibsqlEngine(memoryDir));       // keyword, p=0
registry.register(new HybridSearch(fileEng, semEng)); // hybrid, p=0

// Automatic: keyword strategy selects LibsqlEngine (p=0) over FileEngine (p=1)
// If LibsqlEngine unhealthy → falls back to FileEngine
```
