---
name: memory-write
description: "Use when writing or updating knowledge entries. Guide AI to create correct frontmatter schema per node type AND fill rich business-logic body. Supports depth-extracted methods, routes, state machines from --detail analyze. Examples: '记录这个 API', 'Write documentation for this component', '保存技术决策', 'Update token-service exports'"
---

# Writing Knowledge Entries

## When to Use
- "记录一下这个 API 的设计"
- "把这个组件文档保存到知识库"
- "为什么选 JWT？记录这个决策"
- "更新 token-service 的 exports"
- Writing or updating any knowledge node

## Core Principle

**Frontmatter is metadata. Body is business logic.** A knowledge entry is only useful when the body tells the reader what they need to know before modifying the code. Frontmatter can be auto-generated; body requires reading the source code.

## Workflow

```
1. memory_search to check if entry exists
2. Determine node type (see decision tree below)
3. READ the source file (Component, API, Config) or design docs (Decision, Flow)
4. **IF depth data available** (from memory analyze --detail): extract methods, routes, states
5. Write frontmatter following the schema for that type
6. Write body following the "Body Writing Guide" for that type
7. Save .md file under .memory/{type}s/{slug}.md
8. Prompt: "Run `memory rebuild` to index."
```

## Node Type Decision Tree

```
What is being documented?
├── A top-level service or module boundary → System
│   → Body: What's inside? Where's the entry? How to run? Key sub-modules?
├── An end-to-end business process with ordered steps → Flow
│   → Body: Who triggers it? What happens at each step? What's the result?
│   → Frontmatter: + steps[{order, component, description}], stateEnum[]
│   → Body (depth): + 状态转换表 (当前状态, 触发, 条件, 目标状态, 副作用)
├── A specific source file or implementation unit → Component
│   → Body: What does each export do? What does it depend on? What are the gotchas?
│   → Frontmatter: + filePath, language, exports[], depends_on[]
│   → Frontmatter (depth): + methods[{name, params[{name,type}], returnType, visibility}]
│   → Body (depth): + 导出 API 方法签名表
├── A configuration key or environment variable → Config
│   → Body: What behavior does it control? What happens if missing? Who reads it?
│   → Frontmatter: + key, envType (env|secret|config), required
│   → subtype: api-contract (for shared type definitions recording API contracts)
├── An API endpoint or service interface → API
│   → Body: What request body/params? What response? What errors? What does the handler do?
│   → Frontmatter: + method, path, request, response, errors[]
│   → Body (depth): + 路由表 (Method, Path, Auth, Rate Limit, Params, Response)
└── A technical decision or trade-off → Decision
    → Body: What problem did it solve? What alternatives were rejected? What would trigger a change?
    → Frontmatter: + context, options[{name, pros, cons}], chosen, reason
```

## Body Writing Guide — By Node Type

### System

**Purpose**: Orient someone unfamiliar with the module. Tell them where things are and what this module does at a high level.

**Must answer**:
- What package/directory is this?
- What is its responsibility in the project?
- Where is the entry point? How do you run/dev it?
- What sub-modules or sub-systems does it contain?
- How does it communicate with other systems?

**Write after** reading the project's top-level config (package.json, pyproject.toml) and entry files.

---

### Component

**Purpose**: Tell a developer what they need to know before changing this file.

**Must answer**:
- What does each exported function/class do? (one sentence each)
- What are the key dependencies? (files it imports from)
- What calls this component? (trace upstream callers)
- What are the gotchas or edge cases? (read comments, error handling)

**Write after** reading the component's source file. For each exported symbol in the frontmatter's `exports[]`, read its implementation and summarize the logic in one sentence.

**Depth mode**: When `.analyze-dump.json` has `"detail": true` and function symbols include `params`, extract method signatures from the dump data:

- Frontmatter `methods` field: `[{name: "wechatLogin", params: [{name: "code", type: "string"}], returnType: "Promise<LoginResult>"}]`
- Body "导出 API" section: method signature table with Name, Params, Return, Description columns

**Example body structure (depth enhanced)**:
```markdown
# ComponentName

## 导出 API

| 方法 | 参数 | 返回类型 | 说明 |
|------|------|----------|------|
| wechatLogin | code: string | Promise<LoginResult> | 微信登录 |
| bindPhone | phone: string, code: string | Promise<void> | 绑定手机号 |
| getProfile | - | Promise<UserProfile> | 获取个人信息 |
| updateProfile | data: UpdateProfileReq | Promise<void> | 更新个人信息 |

## 依赖

- config/jwt-secret — 签名私钥
- 不依赖数据库（无状态设计）

## 调用链

login-controller → TokenService.issueToken → 返回 → httpOnly cookie

## 注意事项

- 改签名算法必须同步更新 jwks.json 端点
- verifyToken 不返回具体错误原因（防信息泄露）
```

---

### API

**Purpose**: Document the request/response contract and handler logic.

**Must answer**:
- What request body or query parameters are accepted? (type, required, default)
- What response shape is returned? (success and error)
- What does the handler actually do? (validation, data access, transformation)
- What rate limits or auth apply?
- Who calls this endpoint? (frontend, CLI, MCP tools)

**Write after** reading the route handler source code (e.g., api.ts, controller files).

**Depth mode**: When routes include `handler` info from `--detail` analysis, generate a route table in the body:

```markdown
## 路由表

| Method | Path | Auth | Rate Limit | Handler | Description |
|--------|------|------|------------|---------|-------------|
| POST | /auth/wechat-login | - | 60/min | auth.wechatLogin | 微信登录 |
| GET | /auth/profile | JWT | 120/min | auth.getProfile | 获取个人信息 |
| PUT | /auth/profile | JWT | 60/min | auth.updateProfile | 更新个人信息 |
```

**Example body structure (with route table)**:
```markdown
# API Name

## 路由表

| Method | Path | Auth | Rate Limit | Handler | Description |
|--------|------|------|------------|---------|-------------|
| POST | /payment/create | JWT | 30/min | payment.createPayment | 创建支付 |
| POST | /payment/notify | - | unlimited | payment.handleNotify | 微信回调 |
| POST | /payment/refund | Admin | 10/min | payment.handleRefund | 退款 |

## 响应格式

统一使用 `ApiResponse<T>`:

```json
{ "code": 0, "data": { ... }, "message": "ok" }
```

## 认证

- /payment/create: JWT (customer role)
- /payment/notify: 微信签名验证（X-WX-Signature header）
- /payment/refund: JWT (admin role)
```

---

### Flow

**Purpose**: Document the end-to-end execution path.

**Must answer**:
- What triggers this flow? (user action, cron, event)
- What happens at each step? (the decision or transformation)
- What is the final result? (what changes in the system)
- Where can this flow fail? (error branches)

**Write after** reading the entry function and tracing the call chain through import paths.

**Depth mode**: When StateEnum/StateUnion configs are identified (from `--detail` analysis), include a state transition table:

```markdown
## 状态转换表

| 当前状态 | 触发事件 | 条件 | 目标状态 | 副作用 |
|----------|----------|------|----------|--------|
| pending_payment | 微信支付回调 | 支付成功 | paid | WebSocket通知服务者 |
| paid | 服务者接单 | 指定打手/随机匹配 | accepted | WebSocket通知用户 |
| paid | 全部拒绝 | 3轮派单后 | cancelled → refunded | 退款处理 |
| accepted | 服务者开始 | - | in_progress | - |
| in_progress | 服务者完成 | - | completed | 通知双方, 开放评价 |
```

**Example body structure (with state transitions)**:
```markdown
# Flow Name

## 触发

用户创建订单并完成支付

## 状态转换表

[state transition table as above]

## 步骤

1. **支付完成** — 微信回调验证，订单 paid
2. **派单/接单** — 指定模式自动接单，随机模式轮询派单
3. **服务进行** — 服务者标记 in_progress
4. **服务完成** — 服务者标记 completed，通知用户
5. **评价** — 用户可选评价（24h内）

## 取消/退款

- pending_payment: 用户取消 → cancelled
- paid/accepted: 用户取消 → cancelled → 管理员 refunded
- 调度器超时: 未接单 → cancelled → refunded

## 结果

订单 completed，系统记录服务历史，服务者获得收入。
```

---

### Config

**Purpose**: Document what a config key controls and the impact of changing it.

**Must answer**:
- What behavior does this config control? (be specific about which code paths)
- What is the default value? What happens if missing?
- Where is it read? (trace to the file that uses it)
- What is the impact of changing it? (security, performance, behavior)

**Write after** searching for usages of the config key across the codebase.

**Config subtype: api-contract**

When documenting shared types that define API request/response contracts:

```markdown
# API Contract Name

## 类型定义

### CreateOrderRequest

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| providerId | number | 是 | 服务者ID |
| serviceId | number | 是 | 服务项目ID |
| mode | "designated" | "random" | 是 | 交易模式 |
| remark | string | 否 | 备注 |
| gameplayModeId | number | 否 | 玩法模式ID |

### OrderDetail (Response)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 订单ID |
| status | OrderStatus | 订单状态 |
| provider | ProviderInfo | 服务者信息 |
| service | ServiceInfo | 服务信息 |
| ... | ... | ... |
```

---

### Decision

**Purpose**: Record why a technical choice was made, so future developers know the context.

**Must answer**:
- What problem needed solving? (the situation at the time)
- What alternatives were considered? (with pros/cons)
- Why was this option chosen? (the decisive factor)
- Under what conditions should this be revisited? (what would trigger changing this decision)

**Write after** reading commit messages, PR discussions, or existing design docs.

---

## Common Fields

| Field | Required | Description |
|-------|----------|-------------|
| id | YES | Format: `{type}/{slug}`. System: package name. Component: path-derived slug. API: path-slug. |
| type | YES | One of: system, flow, component, config, api, decision |
| summary | YES | ONE line. What it IS, not where it is. Search must return enough to decide. |
| tags | YES | Lowercase. All applicable tags. Search uses these for filtering. |
| status | YES | `draft` (auto-gen), `stable` (manually reviewed), `deprecated` (no longer used) |
| created | YES | ISO-8601 date (date of first write) |
| lastModified | YES | ISO-8601 date (date of last edit, update when body changes) |
| relates | NO | Array of related node IDs. Fill when relationships are known from imports or architecture. |
| methods | NO | (Depth) Array of {name, params[{name,type}], returnType, visibility} for Component type |
| stateEnum | NO | (Depth) Array of state value strings for Flow/Config type |

## Checklist

Before saving the .md file, verify:

- [ ] Node type correctly identified (use the decision tree)
- [ ] id format is `{type}/{slug}`
- [ ] **Source code was READ** before writing (Component, API, Config types)
- [ ] **If depth data exists**: methods[] extracted to frontmatter, state enums noted
- [ ] Summary is one line describing WHAT, not WHERE (good: "签发 JWT 令牌" bad: "src/auth/token.ts")
- [ ] Body answers the "Must answer" questions for this node type
- [ ] Exports list matches actual exports in source file
- [ ] depends_on entries reference real imports from source code
- [ ] relates entries reference existing or newly created node IDs
- [ ] Tags are lowercase, no spaces, 2-6 relevant tags
- [ ] File saved to correct subdirectory (`.memory/{type}s/`)
- [ ] Checked for existing entries with same id (`memory search "id: {type}/xxx"`)
- [ ] Prompt user: "Run `memory rebuild` to index"
