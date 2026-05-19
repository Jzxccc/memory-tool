## Why

当前 memory-build 技能生成的知识条目停留在"项目 README"级别的概览——知道模块存在、知道技术栈选型，但缺少函数签名、API 接口定义、业务流程细节和组件间交互契约，无法支撑实际的代码修改任务。用户修改一行订单退款逻辑，仍需回到源码逐文件阅读。

## What Changes

- **memory-build skill**：增加深度分析阶段，从 `.analyze-dump.json` 中提取函数签名、参数、返回类型，写入知识条目的"接口/方法"章节
- **API 路由记忆**：新增 API entry 的详细信息模板，包含请求方法、路径、参数 schema、响应格式、中间件栈
- **流程记忆细化**：flow 类型条目新增状态转换表、触发条件、数据变更描述
- **组件记忆细化**：component 类型条目新增导出表（函数/类签名一览）
- **memory-search CLI/skill**：支持按函数名、路由路径、参数名搜索（精细粒度）

## Capabilities

### New Capabilities

- `function-signature-extraction`: 从 TypeScript 源码提取函数签名（名称、参数列表、返回类型），写入 component/api/config 类型条目的方法表
- `api-route-detail`: API 类型的条目模板增加路由表（方法、路径、认证、限流、参数、响应），从路由代码中自动提取
- `flow-state-machine`: flow 类型条目模板增加状态转换图/表，描述每步的条件、触发方、副作用
- `interface-contract`: 新增 entry 类型 `contract` 或作为 config 扩展，记录前后端接口契约（请求/响应 Schema）

### Modified Capabilities

- `memory-build`: 现有 build skill 只做了符号分类→概览。需要增加深度提取阶段，从符号列表进到函数/路由/状态机的结构化信息
- `memory-search`: 搜索结果摘要需要显示方法表或关键函数，而不只是"存储了X信息缺失"

## Impact

- 受影响代码：`src/skills/memory-build/`、`src/core/analyzer/`、`templates/`（知识条目模板）
- `.analyze-dump.json` 格式可能需要扩展（增加函数参数、返回类型字段）
- `memory analyze` CLI 命令可能需要新选项（`--detail` 深度分析）
- 已生成的知识条目需要重新构建（不兼容，但可通过 `memory rebuild --force` 覆盖）
