## Context

当前 memory-tool 项目为空白初始化状态，需要从零设计一套面向 AI 编程助手的项目级代码知识库。主要约束：

- 双存储引擎：file（Markdown + YAML frontmatter）+ libsql（SQLite + FTS5），二者选一使用
- 无向量搜索（对人工开发场景延迟敏感）
- 写入由 AI 代理通过 `memory-write` skill 驱动
- 渐进式披露：search(摘要) → read(完整) → graph(关系)
- 部署形态：独立 CLI + MCP stdio 插件
- 参考架构：GitNexus 的 CLI 懒加载、RRF 排名融合、Skill 模板、资源 URI 系统

## Goals / Non-Goals

**Goals:**
- 建立 6 类代码知识节点体系，覆盖项目级业务逻辑的完整表达
- 提供渐进式查询 CLI（search → read → graph），按需展示信息
- 4 个结构化 SKILL 文件，指导 AI 代理进行搜索、读取、写入、健康检查
- MCP 服务器暴露 4 个工具 + 6 个资源 URI，与 AI 编程工具集成
- 统一搜索后端抽象 file 和 libsql 引擎，通过 RRF 融合结果

**Non-Goals:**
- 不替代 GitNexus 的 AST 级代码分析——Memory-Tool 面向业务逻辑文档
- 不做语义向量搜索（保留扩展点，当前不实现）
- 不做实时协作编辑——单用户、单项目
- 不做 Web UI——纯 CLI + MCP

## Decisions

### D1: 6 类节点体系（而非用户最初提出的 3 类）

**选择**: System / Flow / Component / Config / API / Decision

**理由**: 
- 3 类（Root/Business/Branch）语义模糊，AI 代理难以精确选择类型
- 6 类映射清晰：System=根，Flow+Component+Config+API=业务，Decision=分歧
- 每种类型有独立的必填 frontmatter 字段，类型安全
- 对标 GitNexus 的 32 节点表设计理念——不同语义类型独立建模

**替代方案**: 3 类简化模型——被否决，因为会导致同一类型承载过多语义，frontmatter schema 膨胀

### D2: 双引擎架构（file + libsql，二选一）

**选择**: 用户自行选择 file 或 libsql 引擎，两个引擎实现统一 `SearchEngine` 接口

**理由**:
- file 引擎零依赖，适合小型项目，git 友好
- libsql 引擎（含 FTS5）提供更快的全文搜索，适合中型项目
- 二选一降低复杂度（无需同步双写），用户按需切换
- `memory rebuild` 命令统一从 file 重新构建 libsql 索引

**替代方案**: 仅 file 引擎——被否决，缺少结构化查询能力；libsql 强制——被否决，增加小型项目的使用门槛

### D3: RRF(K=60) 融合双引擎结果

**选择**: Reciprocal Rank Fusion，K=60，对标 GitNexus 的混合搜索融合策略

**理由**:
- 当两个引擎返回结果重叠时，RRF 比简单的分数平均更稳健（排名信息比原始分数更可靠）
- K=60 是论文推荐值，GitNexus 已验证有效
- 当只有单引擎激活时，RRF 退化为直通（无额外开销）

**替代方案**: 分数归一化后加权求和——被否决，因为 file 引擎的匹配分数和 FTS5 的 BM25 分数不在同一尺度

### D4: CLI 懒加载（Commander.js + createLazyAction）

**选择**: 复用 GitNexus 的 `createLazyAction` 模式

**理由**:
- 6 个命令模块仅在调用时 import，CLI 启动瞬时完成
- Commander.js 生态成熟，命令行解析和 help 输出开箱即用
- 与 GitNexus 一致的 lazy-action 模式降低维护心智负担

### D5: SKILL 文件五段式结构

**选择**: When to Use / Workflow / Checklist / Tools / Example，对标 GitNexus 的 7-skill 模板

**理由**:
- Workflow 指导 AI 代理的标准化执行流程
- Checklist 确保任务完整性
- Tools + Example 提供可直接复制的调用代码

### D6: 内容寻址过期检测（SHA256）

**选择**: index.json 中存储每个文件的 `contentHash`（SHA256 摘要），对标 GitNexus 的 parse-cache.json

**理由**:
- O(1) 判断文件是否变化（无需逐字节比较）
- `memory audit` 命令可检测出代码重构导致的路径变更
- 对标 GitNexus 的内容寻址缓存设计

### D7: rebuild 管道 5 阶段（scan → parse → validate → index → link）

**选择**: 简单线性管道，无需 Kahn 拓扑排序（依赖关系为严格链式）

**理由**:
- memory-tool 的重建流程比 GitNexus 的 12 阶段 DAG 简单得多
- 5 个阶段线性依赖，无需拓扑排序
- 对标 GitNexus 的模块化阶段设计，但保持轻量

## Risks / Trade-offs

- **[风险] file 引擎在文件数超过 500 时全文扫描变慢** → 建议迁移到 libsql 引擎；CLI 命令提示用户在 status 中看到文件数增长时切换
- **[风险] index.json 和 graph.json 在崩溃时可能不一致** → 采用 GitNexus 的脏标志模式：写入前设 `incrementalInProgress = true`，完成后清除，启动时检测并强制重建
- **[风险] frontmatter schema 演化导致旧文件不兼容** → schemaVersion 版本号 + 向后兼容读取（未知字段忽略而非报错）
- **[权衡] 没有向量搜索意味着概念级查询精度受限** → 当前设计保留向量搜索扩展点，SearchEngine 接口预留 `vector?()` 方法；当项目规模需要时可通过 `--embeddings` 标志启用
- **[权衡] CLI 不直接支持写入命令（仅通过 SKILL）** → memory-write skill 引导 AI 代理按正确格式写入，减少格式错误。如果用户需要手动编辑，直接编辑 Markdown 文件后运行 `memory rebuild`
