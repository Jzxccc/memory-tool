## ADDED Requirements

### Requirement: API 路由自动提取
系统 SHALL 从路由注册代码中提取 API 接口定义：HTTP 方法、路径、中间件栈、请求参数列表。

#### Scenario: 从 koa-router 代码提取路由
- **WHEN** `memory analyze --detail` 处理 `routes/*.ts` 文件
- **THEN** 输出的 analyze dump 中每个路由包含 `{method, path, middlewares: [string], handler: string}`

#### Scenario: 识别参数 schema
- **WHEN** 路由控制器引用了 JOI/zod/yup 校验 schema
- **THEN** 提取 schema 类型名标注在路由的 `validation` 字段

### Requirement: API 条目模板
系统 SHALL 为 `api` 类型知识条目提供专用模板，包含路由表、认证要求、限流策略。

#### Scenario: 自动生成 API 条目路由表
- **WHEN** memory-build skill 生成 api 类型条目
- **THEN** 条目 body 包含 Markdown 表格，列出每个路由的 Method、Path、Auth、Rate Limiter、Params、Response

#### Scenario: 路由搜索
- **WHEN** 用户执行 `memory search "/orders/:id" -c api`
- **THEN** 系统匹配路径模式 `/orders/:id`，返回对应 API 条目

### Requirement: 响应格式记录
系统 SHALL 在 API 条目中记录统一响应格式引用。

#### Scenario: 记录 ApiResponse 类型
- **WHEN** API 条目引用 `ApiResponse<T>` 作为响应类型
- **THEN** 条目 body 包含 `ApiResponse<T>` 的结构说明：`{code, data, message}`
