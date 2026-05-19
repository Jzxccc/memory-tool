## 1. 分析器增强 — 函数签名提取

- [x] 1.1 扩展 `src/core/ingestion/extractor.ts`，新增参数和返回类型提取（集成到现有 walkTree，detail 模式）
- [x] 1.2 修改 `memory analyze` 命令，新增 `--detail` 选项控制深度分析模式
- [x] 1.3 扩展 `.analyze-dump.json` 输出格式，符号增加 `params: [{name, type}]` 和 `returnType` 字段
- [ ] 1.4 编写 `SignatureExtractor` 单元测试（普通函数、类方法、Arrow Function、未声明返回类型）

## 2. 分析器增强 — 路由与状态机提取

- [x] 2.1 增强路由提取，detail 模式提取 handler 名称（集成到现有 walkTree）
- [x] 2.2 增强状态机提取，detail 模式识别状态枚举和字符串字面量联合类型（集成到现有 walkTree）
- [x] 2.3 扩展 `.analyze-dump.json` 输出格式，新增 StateEnum/StateUnion 配置符号类型
- [ ] 2.4 编写 `RouteExtractor` 和 `StateMachineExtractor` 单元测试

## 3. 知识条目模板扩展

- [x] 3.1 修改 Component 模板：body 新增"导出 API"章节含方法签名表，frontmatter 新增 methods 字段
- [x] 3.2 修改 API 模板：body 新增"路由表"（Method, Path, Auth, Rate Limit, Handler, Description）
- [x] 3.3 修改 Flow 模板：body 新增"状态转换表"（当前状态, 触发, 条件, 目标状态, 副作用）
- [x] 3.4 新增 api-contract 子类型模板（Config 类型），支持请求/响应字段表

## 4. memory-build skill 更新

- [x] 4.1 修改 `memory-build` skill SKILL.md，增加"深度提取阶段"指令、detail flag 检查
- [x] 4.2 skill 流程更新：分类 → 检测 detail → 深度提取函数/路由/状态机 → 写入条目
- [x] 4.3 回退逻辑：detail:false 或无结构化数据时保持现有行为（README 级别）

## 5. memory-search 增强

- [x] 5.1 搜索引擎支持索引 `methods[].name`，搜索结果可按函数名匹配
- [x] 5.2 搜索引擎支持索引路由路径，搜索结果可按路由路径匹配
- [x] 5.3 搜索结果摘要增强：显示方法数/路由数/状态数
- [x] 5.4 `memory rebuild` 重建索引时处理新增的 `methodNames`、`routePaths` 字段

## 6. memory-read 增强

- [x] 6.1 MCP `memory_read` 工具增加 `--section` 参数，支持分段读取
- [x] 6.2 深度条目时显示方法/路由/状态概览（via frontmatter parsing in file engine）

## 7. CLI 与 MCP 适配

- [x] 7.1 `memory search` 增加 `--method`、`--route` 过滤选项
- [x] 7.2 MCP `memory_search` 工具的 inputSchema 增加 `methodName`、`routePath` 可选参数
- [ ] 7.3 `memory status` 报告中增加"深度条目数/浅度条目数"统计

## 8. 构建与验证

- [x] 8.1 运行 `memory analyze --detail` 在 delta-serve 项目，验证输出格式（866 symbols, 211 with params, 11 state enums）
- [x] 8.2 运行 `memory rebuild --force`，验证索引正确生成（build passed, search works）
- [x] 8.3 使用 `memory search` 验证函数名/路由路径搜索可用（file engine enhanced with method/route matching）
- [x] 8.4 验证完成：211 函数带 params，60 路由带 handler，11 状态枚举已提取。old entries 需用 memory-build skill 重建
