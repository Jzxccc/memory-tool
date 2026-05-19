## ADDED Requirements

### Requirement: 前后端接口契约记录
系统 SHALL 支持在 `config` 类型知识条目中记录前后端接口契约，包含请求/响应 Schema 定义。

#### Scenario: 契约条目关联 API
- **WHEN** memory-build skill 发现 shared 类型定义文件
- **THEN** 生成 config 类型条目，frontmatter 包含 `subtype: api-contract`，body 包含请求类型和响应类型的字段表

#### Scenario: 请求类型字段表
- **WHEN** 契约条目记录请求类型（如 `CreateOrderRequest`）
- **THEN** body 包含该类型的字段名、类型、是否必填、说明的表格

#### Scenario: 响应类型字段表
- **WHEN** 契约条目记录响应类型（如 `ApiResponse<OrderDetail>`）
- **THEN** body 包含 `OrderDetail` 实体类型的完整字段说明

### Requirement: 契约查询
系统 SHALL 支持按接口名搜索契约。

#### Scenario: 搜索接口契约
- **WHEN** 用户执行 `memory search "CreateOrderRequest" -c config`
- **THEN** 返回关联的当前端接口契约条目

#### Scenario: 关联 API 条目
- **WHEN** 契约条目关联某个 API 路由
- **THEN** frontmatter 的 `relates_to` 字段包含对应的 API 条目 ID（如 `api/server-routes`）
