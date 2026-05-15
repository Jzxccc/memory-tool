# Memory-Tool 完整架构设计

> 文档化代码知识库：项目级业务逻辑记忆工具，供 AI 编程助手使用。

---

## 设计约束

| 约束 | 说明 |
|------|------|
| 存储引擎 | file（Markdown + frontmatter） + libsql（FTS5），二选一 |
| 搜索 | 无向量搜索，纯关键词 + FTS5，后续可选 |
| 写入 | 通过 `memory-write` skill 驱动 AI 代理写入 |
| 披露 | 渐进式：search 返回摘要 → AI 决策 → read 取详情 |
| 部署 | CLI 工具 + AI 编程工具 MCP 插件 |
| 形态 | 独立 npm 包，类比 gitnexus |

---

## 一、知识图谱节点体系

### 1.1 节点类型（6 类）

```
┌─────────────────────────────────────────────────┐
│                  System (系统)                    │
│  顶层模块入口，如 "认证系统"、"支付系统"           │
│  ┌──────────────────┐  ┌──────────────────┐     │
│  │   Flow (流程)     │  │  Decision (决策)  │     │
│  │ 端到端业务流程    │  │ 技术选型/分歧点   │     │
│  └────────┬─────────┘  └──────────────────┘     │
│           │                                      │
│  ┌────────┴─────────┐                            │
│  │ Component (组件)  │                            │
│  │ 具体实现单元      │                            │
│  └────────┬─────────┘                            │
│           │                                      │
│  ┌────────┴─────────┐  ┌──────────────────┐     │
│  │   Config (配置)   │  │    API (接口)     │     │
│  │ 参数和环境变量    │  │ API/服务端点定义   │     │
│  └──────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────┘
```

| 类型 | 标识 | 含义 | 示例 |
|------|------|------|------|
| **System** | `system` | 顶层模块，逻辑边界 | 认证系统、支付系统、数据库层 |
| **Flow** | `flow` | 端到端业务流程，带步骤 | 用户登录流程、订单创建流程 |
| **Component** | `component` | 具体代码实现单元 | TokenService、PaymentGateway |
| **Config** | `config` | 配置项、环境变量 | JWT_SECRET、DB_URL、REDIS_HOST |
| **API** | `api` | 服务接口、端点定义 | POST /api/auth/login、GET /api/users/:id |
| **Decision** | `decision` | 技术决策、分歧点、为什么 | "为什么选择 JWT 而非 Session" |

> 你提出的 3 类（根/业务/分歧）可以完全映射到这 6 类中：System=根，Flow+Component+Config+API=业务，Decision=分歧。6 类的优势是语义更精确，查询时可以按类型过滤。

### 1.2 关系类型（6 种）

| 关系 | 含义 | 示例 |
|------|------|------|
| **contains** | 层级包含 | System → Flow, System → Component |
| **flows_through** | 流程经过 | Flow → Component（流程第 3 步调用此组件） |
| **implements** | 代码实现 | Component → API（组件实现了该接口） |
| **depends_on** | 依赖关系 | Component → Config（需要该配置项） |
| **alternative_to** | 替代方案 | Decision → Component（否决的方案） |
| **references** | 引用外部 | Component → External（引用外部文档/RFC） |

### 1.3 图结构示例

```
System: 认证系统
  │
  ├── contains ── Flow: 用户名密码登录
  │                 │
  │                 ├── flows_through (step 1) ── Component: LoginController
  │                 │                               │
  │                 │                               ├── depends_on ── Config: MAX_LOGIN_ATTEMPTS
  │                 │                               └── implements ── API: POST /auth/login
  │                 │
  │                 ├── flows_through (step 2) ── Component: PasswordValidator
  │                 └── flows_through (step 3) ── Component: TokenService
  │                                                    │
  │                                                    └── depends_on ── Config: JWT_SECRET
  │
  └── contains ── Decision: 为什么用 JWT 而非 Session
                    │
                    └── alternative_to ── Component: SessionAuthService (已废弃)
```

---

## 二、文件存储规范

### 2.1 目录结构

```
.memory/
├── systems/              ← System 节点
│   └── auth-system.md
├── flows/                ← Flow 节点
│   └── login-flow.md
├── components/           ← Component 节点
│   ├── login-controller.md
│   ├── password-validator.md
│   └── token-service.md
├── configs/              ← Config 节点
│   ├── jwt-secret.md
│   └── max-login-attempts.md
├── apis/                 ← API 节点
│   └── auth-login-api.md
├── decisions/            ← Decision 节点
│   └── jwt-vs-session.md
├── index.json            ← 元数据索引（文件哈希、最后更新时间）
└── graph.json            ← 关系图（节点 → 边的序列化）
```

### 2.2 统一 Frontmatter Schema

按节点类型定义不同的 frontmatter 字段：

```yaml
# === 所有类型共有 ===
id: "component/token-service"     # 唯一标识符 {type}/{slug}
type: component                   # system|flow|component|config|api|decision
summary: "JWT 令牌的签发、验证和刷新服务"
tags: [auth, jwt, token, security]
relates: [flow/login-flow, config/jwt-secret, api/auth-login]
status: stable                    # draft|stable|deprecated
created: 2026-05-10
lastModified: 2026-05-15
```

```yaml
# === Component 特有 ===
# 继承共有字段
filePath: src/auth/token-service.ts      # 代码文件路径
language: typescript                     # 编程语言
exports: [issueToken, verifyToken, refreshToken]  # 导出符号
```

```yaml
# === Flow 特有 ===
# 继承共有字段
trigger: "用户点击登录按钮"             # 触发条件
steps:                                   # 步骤列表
  - order: 1
    component: component/login-controller
    description: "接收用户名密码"
  - order: 2
    component: component/password-validator
    description: "校验密码强度"
  - order: 3
    component: component/token-service
    description: "签发 JWT 令牌"
result: "返回 access_token + refresh_token"  # 最终结果
```

```yaml
# === Config 特有 ===
# 继承共有字段
key: JWT_SECRET                          # 配置键名
defaultValue: ""                         # 默认值
required: true                           # 是否必填
envType: secret                          # env|secret|config
```

```yaml
# === API 特有 ===
# 继承共有字段
method: POST
path: /api/auth/login
request: { body: { username: string, password: string } }
response: { access_token: string, refresh_token: string }
errors: [401 认证失败, 429 频率限制]
```

```yaml
# === Decision 特有 ===
# 继承共有字段
context: "需要选择认证方案"
options:
  - name: JWT
    pros: [无状态, 跨域友好, 生态成熟]
    cons: [无法主动失效, payload 公开]
  - name: Session
    pros: [服务器可控, 立即可失效]
    cons: [需要 Redis/DB, 跨域麻烦]
chosen: JWT
reason: "微服务架构，需要跨服务认证，Session 引入中心化状态违背设计目标"
```

### 2.3 索引文件 index.json

对标 GitNexus 的 `meta.json`：

```json
{
  "schemaVersion": 1,
  "lastFullIndex": "2026-05-15T10:30:00Z",
  "entityCount": 42,
  "entries": {
    "system/auth-system.md": {
      "id": "system/auth-system",
      "type": "system",
      "contentHash": "sha256:abc123...",
      "frontmatterHash": "sha256:def456...",
      "tags": ["auth"],
      "lastModified": "2026-05-15T10:00:00Z"
    },
    "component/token-service.md": {
      "id": "component/token-service",
      "type": "component",
      "contentHash": "sha256:ghi789...",
      "tags": ["auth", "jwt"],
      "exports": ["issueToken", "verifyToken", "refreshToken"],
      "lastModified": "2026-05-15T10:00:00Z"
    }
  }
}
```

> `contentHash` 用于 O(1) 判断文件是否变化（对标 GitNexus parse-cache.json 的内容寻址）

### 2.4 关系图 graph.json

对标 GitNexus 的 `CodeRelation` 表：

```json
{
  "relationships": [
    {
      "from": "system/auth-system",
      "to": "flow/login-flow",
      "type": "contains",
      "confidence": 1.0
    },
    {
      "from": "flow/login-flow",
      "to": "component/token-service",
      "type": "flows_through",
      "step": 3
    },
    {
      "from": "component/token-service",
      "to": "config/jwt-secret",
      "type": "depends_on",
      "confidence": 1.0
    }
  ]
}
```

---

## 三、CLI 架构设计

### 3.1 命令注册（对标 GitNexus）

```
entry: src/cli/index.ts
  └── Commander.js + createLazyAction（懒加载）

src/cli/
├── index.ts            # 入口，注册所有命令
├── lazy-action.ts      # 泛型懒加载包装器（复用 GitNexus 模式）
├── search.ts           # memory search 命令
├── read.ts             # memory read 命令
├── status.ts           # memory status 命令
├── rebuild.ts          # memory rebuild 命令
├── audit.ts            # memory audit 命令
└── graph.ts            # memory graph 命令（导出关系图）
```

### 3.2 命令详情

#### `memory search <query>`

```bash
$ memory search "jwt token refresh"

┌─────────────────────────────────────────────────────────────┐
│  Score │ Type        │ ID                          │ Tags   │
├────────┼─────────────┼─────────────────────────────┼────────┤
│  9.2   │ flow        │ flow/login-flow             │ auth   │
│        │ JWT 登录流程：用户输入凭据 → 签发 token              │
├────────┼─────────────┼─────────────────────────────┼────────┤
│  8.7   │ component   │ component/token-service      │ jwt    │
│        │ TokenService：签发、验证、刷新 JWT 令牌              │
├────────┼─────────────┼─────────────────────────────┼────────┤
│  7.1   │ config      │ config/jwt-secret            │ jwt    │
│        │ JWT_SECRET：签名密钥，rs256 算法                     │
├────────┼─────────────┼─────────────────────────────┼────────┤
│  6.3   │ decision    │ decision/jwt-vs-session      │ auth   │
│        │ 为什么选择 JWT 而非 Session？                         │
└─────────────────────────────────────────────────────────────┘
```

**渐进式披露第一层**：每行只展示 type + summary + tags。

**选项**：
| 选项 | 作用 |
|------|------|
| `--category <type>` | 按类型过滤 |
| `--tag <tag>` | 按标签过滤 |
| `--related-to <id>` | 查找与某节点的关联节点 |
| `--top <n>` | 返回 top N（默认 10） |
| `--format json` | JSON 输出（供 AI 代理使用） |

#### `memory read <id>`

```bash
$ memory read component/token-service

╔══════════════════════════════════════════════════════════════╗
║  Component: TokenService                                    ║
║  类型: component | 状态: stable | 标签: auth, jwt, token    ║
║  最近更新: 2026-05-15                                       ║
╠══════════════════════════════════════════════════════════════╣
║  ## 概述                                                    ║
║  负责 JWT 令牌的签发、验证和刷新...                            ║
║  ...完整 Markdown 内容...                                    ║
╠══════════════════════════════════════════════════════════════╣
║  关联条目:                                                   ║
║    ← depends_on: config/jwt-secret                          ║
║    → flows_through: flow/login-flow (step 3)               ║
║    → implements: api/auth-login                             ║
╚══════════════════════════════════════════════════════════════╝
```

**渐进式披露第二层**：完整 Markdown + frontmatter + 关系图。

**选项**：
| 选项 | 作用 |
|------|------|
| `--summary` | 仅返回摘要（等同 search 的详情行） |
| `--related` | 同时返回关联条目的摘要 |
| `--format json` | JSON 输出 |

#### `memory status`

```bash
$ memory status

知识库状态
────────────────────────────────
条目总数:        42
系统模块:        4
业务流程:        8
实现组件:        15
配置项:          6
API 接口:        5
技术决策:        4

索引新鲜度:      ✓ 最新 (2026-05-15 10:30)
过期条目:        0
孤儿节点:        0

存储引擎:        libsql (FTS5)
文件引擎状态:    ✓ 同步
```

#### `memory rebuild`

```bash
$ memory rebuild
  扫描文件 ── 解析 Frontmatter ── 构建图谱 ── 写入索引
  ████████████████████████████████████████████████  100%
  
完成！42 个条目已索引。
```

对标 GitNexus 的 `analyze`。

**选项**：`--force` 强制重建，`--engine file|libsql` 选择引擎。

#### `memory audit <id>`

```bash
$ memory audit component/token-service

检查结果：
  ✓ 文件存在
  ✓ contentHash 匹配（内容未变化）
  ✗ 引入的代码不存在: src/auth/token-service.ts → 已重命名为 token.service.ts
  ✗ Flow 中 step 2 已修改：PasswordValidator → PasswordService
  建议：运行 memory rebuild 更新索引
```

对标 GitNexus 的 staleness 检测。

#### `memory graph <id>`

```bash
$ memory graph component/token-service --depth 2

token-service ──depends_on──→ jwt-secret
     │
     ├──flows_through──→ login-flow (step 3)
     │                       │
     │                       └──flows_through──→ login-controller
     │
     └──implements──→ POST /auth/login
```

将图结构可视化输出。

### 3.3 搜索后端设计

```
                    ┌──────────────────┐
用户查询 ──────────▶│   SearchOrchestrator │
                    └────────┬─────────┘
                             │
                ┌────────────┼────────────┐
                ▼                         ▼
          FileSearcher              LibsqlSearcher
          (关键词+frontmatter)      (FTS5 + 结构化查询)
                │                         │
                └────────────┬────────────┘
                             ▼
                      ┌──────────────┐
                      │  RRF 融合器   │
                      │  (K=60)      │
                      └──────┬───────┘
                             ▼
                       ScoreSorter
                       (归一化 0-10)
                             │
                             ▼
                      ResultEnricher
                      (附加关联信息)
```

**各引擎评分逻辑**：

```
FileSearcher:
  title 命中            +3
  summary 命中          +2
  tags 命中 (每个)       +1
  body 内容命中          +0.5/次
  type 匹配              +1 (如果用户指定 --category)

LibsqlSearcher:
  FTS5 match_score      * 归一化到 0-10
  tag 过滤               WHERE tags MATCH
  type 过滤              WHERE type =
  lastModified boost     * 1.1 (最近更新的微加权)

RRF 融合：
  score = Σ 1/(K + rank_i)  where K=60
  最终归一化到 0-10
```

---

## 四、SKILL 系统设计

### 4.1 技能架构

对标 GitNexus 的 7-skill 系统。Memory-tool 精简为 4 个核心 skill：

```
.claude/skills/memory/
├── memory-search/
│   └── SKILL.md          # 搜索知识库
├── memory-read/
│   └── SKILL.md          # 渐进式读取详情
├── memory-write/
│   └── SKILL.md          # AI 代理写入知识
└── memory-status/
    └── SKILL.md          # 健康检查
```

### 4.2 SKILL 统一模板

每个 skill 文件采用与 GitNexus 一致的 5 段式结构：

```markdown
---
name: memory-search
description: "Use when the user asks to find, search, or look up knowledge about the codebase. Examples: '搜索认证相关', 'Find API docs', '有没有关于数据库的知识'"
---

# 搜索知识库

## When to Use
- "认证是怎么实现的？"
- "查找 JWT 相关的所有知识"
- "有没有用户模块的文档？"

## Workflow
1. 解析用户意图 → 提取关键词和预期的节点类型
2. memory_search({query, category?, tag?}) → 返回摘要列表
3. 评估结果 → 判断是否需要继续细化搜索或深入阅读
4. 如需深入 → memory_read({id}) 获取完整内容

## Checklist
- [ ] 确定搜索关键词
- [ ] 如有线索，指定 category 或 tag 缩小范围
- [ ] 分析返回结果的关联度
- [ ] 判断是否命中足够 → 不够则调整关键词重新搜索
- [ ] 命中后渐进式展开

## Tools
| 工具 | 用途 | 示例 |
|------|------|------|
| memory_search | 跨引擎搜索，返回摘要 | `memory_search({query: "jwt token", category: "component"})` |
| memory_read | 渐进式读取完整内容 | `memory_read({id: "component/token-service"})` |
```

### 4.3 各 skill 的核心差异

| Skill | 关键 Workflow | 核心工具 |
|-------|--------------|---------|
| **memory-search** | 解析意图 → search → 评估 → 决定深入 or 调整 | search, read |
| **memory-read** | read → 展示 full content + related → 提供下一步建议 | read, search(related) |
| **memory-write** | 确认类型 → 生成 frontmatter → 写入文件 → 验证 → 提示 rebuild | write, validate, rebuild |
| **memory-status** | status → 检查过期条目 → audit 具体条目 → 建议 actions | status, audit, rebuild |

### 4.4 memory-write skill 详细设计

这是最关键的 skill，需要引导 AI 代理按正确格式写入：

```markdown
---
name: memory-write
description: "Use when the user wants to record, save, or document code knowledge. Examples: '记录这个 API', '保存架构决策', '写一下这个组件'"
---

# 写入知识

## When to Use
- "记录一下这个 API 的设计"
- "把这个组件文档保存到知识库"
- "为什么选 JWT？记录一下这个决策"

## Workflow
1. 确认要记录的知识类型（system|flow|component|config|api|decision）
2. 根据类型选择对应的 frontmatter 模板
3. 补充必填字段
4. 声明关联关系（relates、depends_on 等）
5. 写入 .memory/{type}s/{slug}.md
6. 提示用户是否需要运行 memory rebuild

## Node Type Decision Flow
```
知识的粒度是什么？
  ├── 顶层模块/子系统 ──▶ system
  ├── 端到端业务流程 ──▶ flow (需要 steps 字段)
  ├── 具体代码实现 ──▶ component (需要 filePath)
  ├── 配置/环境变量 ──▶ config (需要 key, envType)
  ├── API 端点定义 ──▶ api (需要 method, path)
  └── 技术选型/分歧 ──▶ decision (需要 options, chosen)
```

## Frontmatter Templates

### Component 模板
---yaml
id: "component/{slug}"
type: component
summary: "{一句话描述}"
tags: [{相关标签}]
relates: [{关联 id}]
status: stable
filePath: "{代码路径}"
language: "{语言}"
exports: [{导出的函数/类}]
---

### Decision 模板
---yaml
id: "decision/{slug}"
type: decision
summary: "{决策摘要}"
tags: [{相关标签}]
relates: [{关联 id}]
context: "{什么场景下做出的决策}"
options:
  - name: "{选项 A}"
    pros: [{优点}]
    cons: [{缺点}]
  - name: "{选项 B}"
    pros: [{优点}]
    cons: [{缺点}]
chosen: "{最终选择}"
reason: "{选择理由}"
---

## Checklist
- [ ] 确定节点类型
- [ ] id 格式正确：{type}/{slug}
- [ ] summary 简洁（一行内）
- [ ] 所有必填 frontmatter 字段已填写
- [ ] relates 引用的 id 存在或即将创建
- [ ] 提醒是否需要 memory rebuild
```

---

## 五、MCP 服务器设计

### 5.1 工具定义

对标 GitNexus 的 `src/mcp/tools.ts`：

```typescript
const MEMORY_TOOLS = [
  {
    name: 'memory_search',
    description: '搜索项目知识库，返回匹配的节点摘要列表（渐进式披露第一层）',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
        category: { type: 'string', enum: ['system','flow','component','config','api','decision'] },
        tag: { type: 'string' },
        top: { type: 'integer', default: 10 }
      },
      required: ['query']
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  {
    name: 'memory_read',
    description: '读取单个知识节点的完整内容（渐进式披露第二层）',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: '节点 ID，如 component/token-service' },
        related: { type: 'boolean', description: '同时返回关联节点摘要' }
      },
      required: ['id']
    },
    annotations: { readOnlyHint: true }
  },
  {
    name: 'memory_graph',
    description: '查询某节点的关系图（入/出边）',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        depth: { type: 'integer', default: 1 }
      },
      required: ['id']
    },
    annotations: { readOnlyHint: true }
  },
  {
    name: 'memory_status',
    description: '检查知识库健康状态：条目数、过期、孤儿节点',
    inputSchema: { type: 'object' },
    annotations: { readOnlyHint: true }
  }
];
```

### 5.2 资源 URI 系统

对标 GitNexus 的 `gitnexus://repo/{name}/...`：

| Resource URI | 提供内容 |
|-------------|---------|
| `memory://categories` | 所有 6 种节点类型及其统计 |
| `memory://category/{type}` | 某类型的条目列表 + 标签云 |
| `memory://entry/{id}` | 单个知识节点的完整内容 |
| `memory://status` | 索引新鲜度 + 过期条目列表 |
| `memory://tags` | 全局标签索引（所有标签） |
| `memory://graph/{id}` | 某节点的入边和出边列表 |

### 5.3 与 GitNexus 的差异

| | GitNexus | Memory-Tool |
|--|---------|------------|
| **数据来源** | AST 解析（自动） | AI 代理写入（手动+自动辅助） |
| **索引触发** | `analyze` 命令 | `rebuild` 命令 |
| **查询语义** | 符号级（函数、类） | 概念级（模块、流程、决策） |
| **关系来源** | 代码引用关系 | 人工声明的关系 + frontmatter relates |
| **新鲜度检测** | git commit 比较 | contentHash 比较 |

---

## 六、渐进式披露流程

```
用户: "JWT 怎么用的？"
  │
  ▼
AI 调用 memory_search({query: "jwt"})
  │
  ▼
返回 (第一层 — 摘要):
  ┌─────────────────────────────────────────┐
  │ flow/login-flow (9.2)                    │
  │ "JWT 登录流程"                            │
  │ component/token-service (8.7)            │
  │ "TokenService：签发、验证、刷新 JWT 令牌"   │
  │ config/jwt-secret (7.1)                  │
  │ "JWT_SECRET：签名密钥，rs256 算法"         │
  └─────────────────────────────────────────┘
  │
  ▼
AI 评估：token-service 和 login-flow 相关
  │
  ▼
AI 调用 memory_read({id: "component/token-service"})
  │
  ▼
返回 (第二层 — 完整内容):
  ├── 完整 Markdown 正文
  ├── Frontmatter（filePath, exports, 等）
  └── 关系图:
      depends_on → config/jwt-secret
      flows_through → flow/login-flow (step 3)
  │
  ▼
AI 继续调用 memory_graph({id: "component/token-service"})
  │
  ▼
返回 (第三层 — 关系图):
  token-service
    ├── depends_on → jwt-secret
    └── flows_through → login-flow → login-controller → ...
  │
  ▼
AI 理解完整链路，给出回答
```

---

## 七、目录结构总览

```
memory-tool/
├── package.json
├── tsconfig.json
│
├── src/
│   ├── cli/                    # CLI 层
│   │   ├── index.ts            # 入口，Commander 注册
│   │   ├── lazy-action.ts      # 懒加载包装器
│   │   ├── search.ts           # memory search
│   │   ├── read.ts             # memory read
│   │   ├── status.ts           # memory status
│   │   ├── rebuild.ts          # memory rebuild
│   │   ├── audit.ts            # memory audit
│   │   └── graph.ts            # memory graph
│   │
│   ├── mcp/                    # MCP 服务器层
│   │   ├── server.ts           # 创建 MCP Server
│   │   └── tools.ts            # 工具定义（4 个）
│   │
│   ├── core/                   # 核心引擎
│   │   ├── search/             # 搜索
│   │   │   ├── orchestrator.ts # SearchOrchestrator（统一后端）
│   │   │   ├── file-engine.ts  # FileSearcher
│   │   │   ├── libsql-engine.ts # LibsqlSearcher
│   │   │   ├── rrf.ts          # RRF 融合器
│   │   │   └── scorer.ts       # 归一化评分
│   │   │
│   │   ├── graph/              # 内存知识图谱
│   │   │   ├── graph.ts        # 创建 MemoryGraph
│   │   │   └── types.ts        # 节点/关系类型
│   │   │
│   │   ├── rebuild/            # 重建管道
│   │   │   ├── pipeline.ts     # Pipeline 编排
│   │   │   └── phases/         # 阶段模块
│   │   │       ├── scan.ts     # 扫描文件
│   │   │       ├── parse.ts    # 解析 frontmatter
│   │   │       ├── validate.ts # 验证 schema
│   │   │       ├── index.ts    # 写入 libsql
│   │   │       └── link.ts     # 构建关系图
│   │   │
│   │   └── staleness/          # 新鲜度检测
│   │       └── checker.ts      # 比对 contentHash
│   │
│   ├── storage/                # 持久化
│   │   ├── repo-manager.ts     # .memory 目录管理
│   │   └── index-handler.ts    # index.json 读写
│   │
│   └── types/                  # 类型定义
│       ├── node-types.ts       # 6 种节点类型
│       ├── relation-types.ts   # 6 种关系类型
│       └── search-types.ts     # SearchResult 等
│
├── .claude/
│   └── skills/
│       └── memory/
│           ├── memory-search/
│           │   └── SKILL.md
│           ├── memory-read/
│           │   └── SKILL.md
│           ├── memory-write/
│           │   └── SKILL.md
│           └── memory-status/
│               └── SKILL.md
│
└── .mcp.json                  # MCP 配置（供 AI 工具自动发现）
```

---

## 八、实施路线

| 阶段 | 内容 | 优先级 |
|------|------|--------|
| **Phase 1** | 节点体系定义 + frontmatter schema + index.json / graph.json 格式 | P0 基础 |
| **Phase 2** | CLI 框架（Commander + 懒加载）+ search/read 命令 + 文件搜索引擎 | P0 核心 |
| **Phase 3** | 4 个 SKILL.md 文件 (search/read/write/status) | P1 可用 |
| **Phase 4** | libsql 引擎 + RRF 融合 | P1 完善 |
| **Phase 5** | memory rebuild 管道 (scan→parse→validate→index→link) | P2 增强 |
| **Phase 6** | memory audit + staleness 检测 | P2 增强 |
| **Phase 7** | MCP 服务器 (4 tools + 6 resources) | P3 集成 |
| **Phase 8** | memory graph 命令 + 关系图可视化 | P3 探索 |
