## ADDED Requirements

### Requirement: 函数签名提取
系统 SHALL 从 `.analyze-dump.json` 的符号表中提取每个 export 函数的签名，包括函数名、参数列表（名称+类型）、返回类型。

#### Scenario: 提取普通函数签名
- **WHEN** `memory analyze --detail` 处理 TypeScript 源文件
- **THEN** 输出的 analyze dump 中每个 `FunctionDeclaration` 包含 `params: [{name, type}]` 和 `returnType` 字段

#### Scenario: 提取类方法签名
- **WHEN** 分析 TypeScript 类文件
- **THEN** 该类下的每个方法包含 `params` 和 `returnType`，标注 `visibility` (public/protected/private)

#### Scenario: 未声明返回类型
- **WHEN** 函数未显式声明返回类型
- **THEN** `returnType` 标记为 `"inferred"`，AI skill 阶段尝试推断

### Requirement: 方法表写入知识条目
系统 SHALL 在 `component` 和 `config` 类型知识条目的 frontmatter 中可选包含 `methods` 字段，值为函数签名数组。

#### Scenario: 生成带方法表的 component 条目
- **WHEN** memory-build skill 生成 component 类型条目
- **THEN** frontmatter 包含 `methods: [{name, params: [{name, type}], returnType, visibility}]`

#### Scenario: 无导出函数的空方法表
- **WHEN** 源文件无 export 函数
- **THEN** `methods` 字段不存在（而非空数组），保持 frontmatter 简洁
