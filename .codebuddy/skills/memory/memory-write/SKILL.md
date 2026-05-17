---
name: memory-write
description: "Use when writing or updating knowledge entries. Guide AI to create correct frontmatter schema per node type AND fill rich business-logic body. Examples: '记录这个 API', 'Write documentation for this component', '保存技术决策', 'Update token-service exports'"
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
4. Write frontmatter following the schema for that type
5. Write body following the "Body Writing Guide" for that type
6. Save .md file under .memory/{type}s/{slug}.md
7. Prompt: "Run `memory rebuild` to index."
```

## Node Type Decision Tree

```
What is being documented?
├── A top-level service or module boundary → System
│   → Body: What's inside? Where's the entry? How to run? Key sub-modules?
├── An end-to-end business process with ordered steps → Flow
│   → Body: Who triggers it? What happens at each step? What's the result?
│   → Frontmatter: + steps[{order, component, description}]
├── A specific source file or implementation unit → Component
│   → Body: What does each export do? What does it depend on? What are the gotchas?
│   → Frontmatter: + filePath, language, exports[], depends_on[]
├── A configuration key or environment variable → Config
│   → Body: What behavior does it control? What happens if missing? Who reads it?
│   → Frontmatter: + key, envType (env|secret|config), required
├── An API endpoint or service interface → API
│   → Body: What request body/params? What response? What errors? What does the handler do?
│   → Frontmatter: + method, path, request, response, errors[]
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

**Example body structure**:
```markdown
# ComponentName

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| issueToken | (userId, claims) → TokenPair | 签发 JWT 令牌对 |
| verifyToken | (token) → claims | 验证并解码令牌 |

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

**Example body structure**:
```markdown
# HTTP Method /path

## 请求

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| repoName | string | 是 | - | 已索引仓库名 |
| query | string | 是 | - | 搜索关键词 |
| limit | number | 否 | 10 | 1-100 |

## 响应

```json
{ "results": [...], "total": 42 }
```

## 错误

| 状态码 | 条件 |
|--------|------|
| 400 | query 为空 |
| 404 | 仓库未找到 |

## 实现

`server/api.ts:L1234` — 参数验证 → resolveRepo → executeQuery → 返回。

## 调用方

- Web UI 搜索框
- MCP query 工具
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

**Example body structure**:
```markdown
# Flow Name

## 触发

用户输入 `npx gitnexus analyze`

## 步骤

1. **增量检查** — 比较 lastCommit vs HEAD，工作树干净度
2. **管道执行** — 12 阶段 DAG 构建内存 KnowledgeGraph
3. **图持久化** — CSV 流式写入 LadybugDB
4. **FTS 索引** — 创建全文搜索索引
5. **嵌入生成** — 向量嵌入（可选）
6. **元数据保存** — 更新 meta.json + AGENTS.md

## 结果

`.gitnexus/` 目录下完整的图数据库 + 搜索索引。

## 错误分支

- LadybugDB 锁冲突 → 重试
- 管道阶段失败 → 包装错误含阶段名
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

## Checklist

Before saving the .md file, verify:

- [ ] Node type correctly identified (use the decision tree)
- [ ] id format is `{type}/{slug}`
- [ ] **Source code was READ** before writing (Component, API, Config types)
- [ ] Summary is one line describing WHAT, not WHERE (good: "签发 JWT 令牌" bad: "src/auth/token.ts")
- [ ] Body answers the "Must answer" questions for this node type
- [ ] Exports list matches actual exports in source file
- [ ] depends_on entries reference real imports from source code
- [ ] relates entries reference existing or newly created node IDs
- [ ] Tags are lowercase, no spaces, 2-6 relevant tags
- [ ] File saved to correct subdirectory (`.memory/{type}s/`)
- [ ] Checked for existing entries with same id (`memory search "id: {type}/xxx"`)
- [ ] Prompt user: "Run `memory rebuild` to index"
