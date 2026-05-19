## ADDED Requirements

### Requirement: 深度分析阶段
`memory-build` skill SHALL 在符号分类后新增深度分析阶段，从 `.analyze-dump.json` 中提取结构化信息。

#### Scenario: 深度分析触发
- **WHEN** memory-build skill 检测到 `.analyze-dump.json` 包含函数签名、路由定义、状态枚举等结构化数据
- **THEN** 自动进入深度提取阶段，生成包含方法表、路由表、状态转换表的知识条目

#### Scenario: 无结构化数据回退
- **WHEN** `.analyze-dump.json` 不包含结构化数据（快速 analyze 模式）
- **THEN** skill 保持现有行为，仅生成 README 级别概览

### Requirement: 分析 dump 格式适配
memory-build skill SHALL 支持解析扩展后的 `.analyze-dump.json` 格式。

#### Scenario: 解析函数签名
- **WHEN** analyze dump 中符号包含 `params` 和 `returnType` 字段
- **THEN** skill 提取并填充 frontmatter 的 `methods` 字段

#### Scenario: 解析路由定义
- **WHEN** analyze dump 中符号类型为 `Route`
- **THEN** skill 生成 API 类型条目，body 包含路由表

#### Scenario: 解析状态枚举
- **WHEN** analyze dump 中枚举标记为 `StateEnum`
- **THEN** skill 生成 flow 类型条目，body 包含状态转换表

### Requirement: 条目模板扩展
memory-build skill SHALL 使用扩展后的条目模板生成更详细的 body 内容。

#### Scenario: component 条目含方法表
- **WHEN** 生成 component 类型条目
- **THEN** body 的"导出 API"章节包含函数/方法签名的 Markdown 表格

#### Scenario: api 条目含路由表
- **WHEN** 生成 api 类型条目
- **THEN** body 包含 HTTP 路由表的 Markdown 表格（Method, Path, Auth, Rate Limit, Params, Response）

#### Scenario: flow 条目含状态转换表
- **WHEN** 生成 flow 类型条目
- **THEN** body 包含状态转换表的 Markdown 表格（当前状态, 触发, 条件, 目标状态, 副作用）
