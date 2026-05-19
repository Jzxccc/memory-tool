## Context

当前 memory-tool 的知识构建流程是：`memory analyze` (tree-sitter 提取符号) → `memory-build skill` (AI 分类符号生成概览 .md) → `memory rebuild` (建立索引)。

问题在于 **memory-build skill 只做了"分类"这一步**——知道每个文件属于哪个模块，写了什么，但不会深入提取函数签名、路由定义、状态机转换等结构化细节。这使得知识条目停留在 README 级别，无法支撑实际的代码修改工作。

## Goals / Non-Goals

**Goals:**
- 从 `.analyze-dump.json` 的符号表中自动提取函数签名（名称、参数、返回类型）
- 从路由代码中自动提取 API 定义（方法、路径、参数 schema、中间件栈）
- 从服务层代码中推断状态机/流程（状态枚举、转换条件、触发方）
- 记录前后端接口契约（请求/响应 Schema）
- 搜索结果能按函数名、路径、参数名定位

**Non-Goals:**
- 不追求 100% 自动提取（复杂泛型、动态路由等边缘 case 仍需 AI skill 干预）
- 不引入向量搜索（保持 latency 敏感的约束）
- 不重构存储格式（保持 Markdown + YAML frontmatter）

## Decisions

| 决策 | 选择 | 替代方案 | 理由 |
|------|------|----------|------|
| 符号深度提取引擎 | 扩展 `src/core/analyzer/` 模块，新增 `SignatureExtractor`、`RouteExtractor`、`StateMachineExtractor` | 全部交给 AI skill | TypeScript 编译器 API 能精确提取签名；路由/状态机规则明确，适合代码分析；AI 用于填充语义描述 |
| 函数签名存储 | YAML frontmatter 新增 `methods` 字段，值结构化 Array | 内联 Markdown 表格 | YAML frontmatter 可被索引引擎结构化搜索；Markdown body 保留人类可读版本 |
| API 路由条目 | 新增 `entry_type: api`，body 包含路由表 Markdown | 嵌入 component body | API 独立为一级类型符合用户 mental model；方便按路径搜索 |
| 前后端契约 | 扩展 `config` 类型的 `api-contract` 子类型 | 新增 `contract` 顶级类型 | 避免类型爆炸；契约本质是配置/规范，语义归 config |
| 兼容性 | `memory rebuild --force` 重新生成所有条目 | 增量更新 | 涉及字段结构变更，增量复杂且容易遗漏 |

## Risks / Trade-offs

- **符号提取完整度**: TypeScript 编译器 API 对动态模式、高阶函数、泛型的提取可能不完整 → 在 AI skill 阶段补充缺失信息，`memory-build` skill 收到"可能不完整"标记时可追加分析
- **条目体量膨胀**: 函数签名、路由表的加入会使单个条目从 50 行膨胀到 200+ 行 → `memory_read` 增加 `--summary` 和 `--section` 分段读取选项
- **构建时间增加**: 深度分析增加 2-3 倍耗时 → 默认 `memory analyze --detail` 可选，快速模式保持现有行为
