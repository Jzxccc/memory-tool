## 1. 分析器增强 — 函数签名提取

- [ ] 1.1 扩展 `src/core/analyzer/`，新增 `SignatureExtractor` 模块，使用 TypeScript compiler API 提取函数签名（参数名+类型、返回类型）
- [ ] 1.2 修改 `memory analyze` 命令，新增 `--detail` 选项控制深度分析模式
- [ ] 1.3 扩展 `.analyze-dump.json` 输出格式，符号增加 `params: [{name, type}]` 和 `returnType` 字段
- [ ] 1.4 编写 `SignatureExtractor` 单元测试（普通函数、类方法、Arrow Function、未声明返回类型）

## 2. 分析器增强 — 路由与状态机提取

- [ ] 2.1 新增 `RouteExtractor` 模块，从 `koa-router` 代码中提取 HTTP 方法、路径、中间件栈、handler
- [ ] 2.2 新增 `StateMachineExtractor` 模块，从服务层代码识别状态枚举和 switch-case 状态转换
- [ ] 2.3 扩展 `.analyze-dump.json` 输出格式，新增 `Route` 和 `StateMachine` 符号类型
- [ ] 2.4 编写 `RouteExtractor` 和 `StateMachineExtractor` 单元测试

## 3. 知识条目模板扩展

- [ ] 3.1 修改 skill 模板，component 类型 body 新增"导出 API"章节，含方法签名 Markdown 表格
- [ ] 3.2 修改 API 类型条目模板，body 新增路由表（Method, Path, Auth, Rate Limit, Params, Response）
- [ ] 3.3 修改 flow 类型条目模板，body 新增状态转换表（当前状态, 触发, 条件, 目标状态, 副作用）
- [ ] 3.4 新增 api-contract 子类型模板，支持请求/响应字段表

## 4. memory-build skill 更新

- [ ] 4.1 修改 `memory-build` skill SKILL.md，增加"深度提取阶段"的指令描述
- [ ] 4.2 skill 流程：分类 → 检测结构化数据 → 深度提取函数/路由/状态机 → 写入条目
- [ ] 4.3 处理无结构化数据时的回退（保持现有 README 级别行为）

## 5. memory-search 增强

- [ ] 5.1 搜索引擎支持索引 `methods[].name`，搜索结果可按函数名匹配
- [ ] 5.2 搜索引擎支持索引路由路径，搜索结果可按路由路径匹配
- [ ] 5.3 搜索结果摘要增强：显示方法数/路由数/状态数，而非"存储了X信息缺失"
- [ ] 5.4 `memory rebuild` 重建索引时处理新增的 `methodNames`、`routePaths` 字段

## 6. memory-read 增强

- [ ] 6.1 `memory_read` 工具增加 `--section` 参数，支持分段读取（methods/routes/states）
- [ ] 6.2 `memory_read` 的 `--summary` 参数在深度条目时显示方法/路由/状态概览

## 7. CLI 与 MCP 适配

- [ ] 7.1 `memory search` 增加 `--method`、`--route` 过滤选项
- [ ] 7.2 MCP `memory_search` 工具的 inputSchema 增加 `methodName`、`routePath` 可选参数
- [ ] 7.3 `memory status` 报告中增加"深度条目数/浅度条目数"统计

## 8. 构建与验证

- [ ] 8.1 运行 `memory analyze --detail` 在 delta-serve 项目，验证输出格式
- [ ] 8.2 运行 `memory rebuild --force`，验证索引正确生成
- [ ] 8.3 使用 `memory search` 验证函数名/路由路径搜索可用
- [ ] 8.4 更新 `memory-build` skill 技能后，在 delta-serve 重新构建知识库验证深度条目质量
