## ADDED Requirements

### Requirement: 状态机自动识别
系统 SHALL 从服务层代码中识别状态枚举定义和状态转换逻辑，提取状态机。

#### Scenario: 识别状态枚举
- **WHEN** `memory analyze --detail` 处理包含 status 枚举的 TypeScript 文件
- **THEN** 输出的 analyze dump 中标记该枚举为 `StateEnum`，记录所有可能值

#### Scenario: 识别状态转换函数
- **WHEN** 分析包含 switch-case 或 if-else 状态判断的函数
- **THEN** 提取状态转换条件、目标状态、触发操作，标记为 `StateTransition`

### Requirement: 流程条目状态转换表
系统 SHALL 在 `flow` 类型知识条目的 body 中包含状态转换表。

#### Scenario: 自动生成状态转换表
- **WHEN** memory-build skill 处理 flow 类型条目
- **THEN** 条目 body 包含 Markdown 表格，每行记录：当前状态、触发事件、条件、目标状态、副作用（WebSocket 通知、数据库更新等）

#### Scenario: 状态转换触发方标注
- **WHEN** 状态转换由不同角色触发
- **THEN** 表格的"触发方"列区分 system/provider/customer/admin

### Requirement: 流程图格式
系统 SHALL 支持在 flow 条目中嵌入文本流程图。

#### Scenario: ASCII 流程图
- **WHEN** 流程有多个分支
- **THEN** 条目 body 包含 ASCII 流程图，用箭头和缩进表示分支节点

#### Scenario: 分支条件说明
- **WHEN** 流程有 split 节点
- **THEN** 每个分支标注条件，如 "[已接受]"、"[全部拒绝]"
