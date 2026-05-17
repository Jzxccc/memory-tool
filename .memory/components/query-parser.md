---
id: component/query-parser
type: component
summary: Search query parser — splits raw query strings by | (OR) and & (AND) operators, defaults whitespace-separated terms to AND semantics
tags: [search, parser, query, boolean]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/search/query-parser.ts
language: typescript
exports:
  - parseQuery
depends_on:
  - system/types
relates: [system/core, component/search-orchestrator, component/file-engine, flow/knowledge-search]
---

# QueryParser 查询解析器

将原始搜索查询字符串解析为结构化的 `ParsedQuery`，供搜索引擎使用。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `parseQuery` | `(query: string) => ParsedQuery` | 解析查询字符串，返回结构化查询对象 |

## 解析规则

```
"redis | memcached | dragonfly"
→ { terms: ["redis", "memcached", "dragonfly"], operator: "OR" }

"auth & jwt & token"
→ { terms: ["auth", "jwt", "token"], operator: "AND" }

"cli command"
→ { terms: ["cli", "command"], operator: "AND" }
```

| 输入特征 | 操作符 | 分隔方式 |
|----------|--------|---------|
| 包含 `\|` 且不包含 `&` | `OR` | `split('\|')` |
| 包含 `&` | `AND` | `split('&')` |
| 纯空格分隔 | `AND` | `split(/\s+/)` |
| 单个词 | `AND` | 单元素数组 |

## 优先级

当查询同时包含 `|` 和 `&` 时，优先按 `&` 分割（AND 语义优先）。因此：

- `"auth | login & jwt"` → AND of `["auth | login", "jwt"]`，其中 `"auth | login"` 作为字面量
- 设计上不支持嵌套布尔表达式

## 输出类型

```typescript
interface ParsedQuery {
  terms: string[];         // 查询词列表
  operator: 'AND' | 'OR';  // 布尔操作符
}
```

## 注意事项

- 空查询词会被过滤 (`filter(t => t.length > 0)`)
- trim 仅处理首尾空白
- 不支持括号分组或嵌套布尔运算
