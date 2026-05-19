## ADDED Requirements

### Requirement: 精细粒度搜索
`memory-search` skill SHALL 支持按函数名、路由路径、参数名进行搜索。

#### Scenario: 按函数名搜索
- **WHEN** 用户执行 `memory search "wechatLogin"` 匹配到 frontmatter 的 `methods[].name`
- **THEN** 返回包含该方法的 component 条目，摘要显示该方法签名

#### Scenario: 按路由路径搜索
- **WHEN** 用户执行 `memory search "/payment/notify"` 匹配到 API 条目的路由表
- **THEN** 返回对应 API 条目，摘要显示该路由的方法和说明

#### Scenario: 按参数名搜索
- **WHEN** 用户执行 `memory search "orderId"` 匹配到 frontmatter `methods[].params[].name`
- **THEN** 返回使用该参数的所有条目

### Requirement: 搜索结果摘要增强
搜索结果摘要 SHALL 显示关键结构化信息而非仅显示"存储了X信息缺失"。

#### Scenario: component 摘要显示方法数
- **WHEN** 搜索匹配到 component 条目，且该条目有 `methods` 字段
- **THEN** 摘要行显示 `N methods: methodA, methodB, ...`

#### Scenario: api 摘要显示路由数
- **WHEN** 搜索匹配到 api 条目
- **THEN** 摘要行显示 `N routes`，关键词匹配时高亮对应路由

#### Scenario: flow 摘要显示状态数
- **WHEN** 搜索匹配到 flow 条目
- **THEN** 摘要行显示 `N states` 或匹配到的状态名称

### Requirement: 按方法表建立索引
搜索引擎 SHALL 将 frontmatter 的 `methods` 字段纳入索引，支持方法名匹配。

#### Scenario: 方法名索引
- **WHEN** `memory rebuild` 重建索引
- **THEN** `index.json` 中每个有 `methods` 的条目额外存储 `methodNames: [string]` 用于快速匹配
