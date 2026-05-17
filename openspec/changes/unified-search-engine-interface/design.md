## Context

当前搜索系统架构：
- `SearchEngine` 接口已定义（`src/types/search-types.ts`），包含 `name` 和 `search()` 两个字段
- `FileEngine` 实现了此接口，直接读取 `.md` 文件进行关键词加权匹配
- `LibsqlEngine` 是存根实现，`search()` 始终返回空数组
- `SearchOrchestrator` 管理引擎注册和 RRF 融合，但引擎是在构造函数中硬编码的
- `LocalBackend` 在构造函数中创建 `FileEngine` 并注册

需要将引擎系统重构为可插拔架构。

## Goals / Non-Goals

**Goals:**
- 定义更完整的 `SearchEngine` 接口，包含能力声明（keyword/semantic/hybrid）、优先级、健康检查
- 创建 `SearchEngineRegistry` 实现引擎的注册/发现/选择逻辑
- 实现 `HybridSearch` 引擎，支持 keyword + semantic 混合检索策略
- 从存根实现完整的 `LibsqlEngine`，使用 FTS5 全文搜索和 BM25 评分
- SearchOrchestrator 接受外部引擎配置，支持运行时引擎切换

**Non-Goals:**
- 不引入向量搜索或 embedding 生成（保持 latency-sensitive 设计约束）
- 不改变现有的 RRF 融合算法
- 不改变 CLI/MCP 的外部 API 接口
- 不引入远程搜索引擎（仅本地）

## Decisions

### Decision 1: 引擎能力声明 (EngineCapability)

扩展 `SearchEngine` 接口添加 `capabilities` 字段：

```typescript
type EngineCapability = 'keyword' | 'semantic' | 'hybrid';

interface SearchEngine {
  name: string;
  capabilities: EngineCapability[];
  priority: number; // 0 = highest
  healthCheck?(): Promise<boolean>;
  search(query: ParsedQuery, options: SearchOptions): Promise<SearchResult[]>;
}
```

**Rationale**: 声明 capabilities 使 orchestrator 可以智能选择引擎（如用户想用纯语义搜索时跳过 FileEngine）。

### Decision 2: 引擎注册表 (SearchEngineRegistry)

创建独立的 `SearchEngineRegistry` 类，与 `SearchOrchestrator` 解耦：

```typescript
class SearchEngineRegistry {
  register(engine: SearchEngine): void;
  unregister(name: string): void;
  get(name: string): SearchEngine | undefined;
  getByCapability(capability: EngineCapability): SearchEngine[];
  getAll(): SearchEngine[];
  selectForQuery(query: ParsedQuery, strategy: SearchStrategy): SearchEngine[];
}
```

**Rationale**: 当前 `addEngine`/`removeEngine` 直接耦合在 `SearchOrchestrator` 中，分离后 registry 成为独立的关注点，其他组件（如 CLI help、status）可以直接查询。

### Decision 3: HybridSearch 引擎设计

`HybridSearch` 本身是一个 `SearchEngine`（capabilities: ['hybrid']），内部委托给多个子引擎：

```
HybridSearch:
  1. keyword → FileEngine or LibsqlEngine
  2. semantic → (future: embedding engine)
  3. RRF fusion → merge keyword + semantic results
```

**Rationale**: 混合检索作为一等引擎实现，而非 orchestrator 的特殊模式。这样 `HybridSearch` 可以有自己的配置（权重分配），且对上层透明。

### Decision 4: LibsqlEngine 实现方案

- 使用 `@libsql/client` 连接 `.memory/memory.db`
- 在 `memory rebuild` 时创建/更新 FTS5 虚拟表
- `search()` 执行 FTS5 MATCH 查询 + BM25 排序
- 与 FileEngine 互补：FileEngine 用于快速开发/扫描，LibsqlEngine 用于大规模知识库

## Risks / Trade-offs

- [Risk] `@libsql/client` 作为新增依赖，增加安装复杂度 → Mitigation: 保持 optional，无法加载时回退到 FileEngine-only 模式
- [Risk] FTS5 索引与 `.md` 文件的一致性 → Mitigation: `memory rebuild` 时重建索引，`memory status` 检测一致性
- [Risk] HybridSearch 增加查询延迟（多个引擎串行或并行） → Mitigation: 并行查询子引擎，单引擎延迟不变
- [Risk] EngineRegistry 引入额外抽象层 → Trade-off: 接受少量复杂度换取可插拔性和可测试性

## Open Questions

- **Q**: Hybrid search 的 keyword/semantic 权重分配策略？
  - **A (draft)**: 默认 keyword:semantic = 0.7:0.3，通过 MCP 参数 `--strategy` 覆盖
- **Q**: `memory rebuild --engine libsql` 是否替代现有 FileEngine 还是并行？
  - **A**: 并行 — FileEngine 始终可用作为 baseline，LibsqlEngine 作为加速引擎
- **Q**: 是否需要为每个引擎单独配置权重？
  - **A**: 暂不需要，保持 RRF K=60 统一参数
