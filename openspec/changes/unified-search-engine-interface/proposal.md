## Why

当前搜索引擎的实现与 SearchOrchestrator 紧密耦合，FileEngine 硬编码在 LocalBackend 构造函数中。LibsqlEngine 存在但未激活，轮换或组合引擎需要在多处修改代码。需要将搜索能力抽象为可插拔的统一接口，支持引擎灵活组合和混合检索模式。

## What Changes

- 定义 `SearchEngine` 接口的扩展规范，支持引擎注册、优先级、能力声明（如 `keyword` `semantic` `hybrid`）
- 将引擎注册从 LocalBackend 构造函数中解耦，提供外部配置化注册入口
- **BREAKING**: 重构 `SearchOrchestrator` 使其接受引擎配置而非硬编码注册
- 新增 `HybridSearch` 引擎，组合 keyword + semantic 策略
- LibsqlEngine 从存根升级为可用的 FTS5 全文检索引擎
- 支持运行时引擎热切换（通过 CLI 选项或 MCP 参数）

## Capabilities

### New Capabilities
- `search-engine-interface`: 统一搜索引擎接口定义，包含引擎能力声明、优先级、健康检查
- `search-engine-registry`: 引擎注册与发现机制，支持外部配置化注册
- `hybrid-search-engine`: 混合检索引擎，组合 keyword + semantic 策略的检索管道
- `libsql-fts-engine`: LibSQL FTS5 搜索引擎完整实现，替代当前存根

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **Affected code**: `src/core/backend.ts`, `src/core/search/orchestrator.ts`, `src/core/search/file-engine.ts`, `src/core/search/libsql-engine.ts`, `src/types/search-types.ts`, `src/cli/search.ts`, `src/cli/rebuild.ts`, `src/mcp/server.ts`
- **Affected deps**: 新增依赖 `@libsql/client`
- **Affected knowledge entries**: `component/search-orchestrator`, `component/file-engine`, `component/libsql-engine`, `component/local-backend`, `flow/knowledge-search`
