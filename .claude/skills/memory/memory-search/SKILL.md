---
name: memory-search
description: "Use when searching the project knowledge base for code, architecture, configs, APIs, or decisions. Examples: '搜索认证相关', 'Find JWT documentation', '查找支付模块', 'Search API endpoints'"
---

# Searching Knowledge Base

## When to Use
- "认证是怎么实现的？"
- "查找 JWT 相关的所有知识"
- "有没有数据库配置的文档？"
- "搜索所有和用户模块相关的内容"
- Finding code documentation, architecture decisions, config values, or API specs

## Workflow
```
1. Parse user intent → extract keywords and expected node types
2. memory_search({query, category?, tag?}) → ranked summary list
3. Evaluate results:
   - High-score single result → proceed to memory_read
   - Many medium-score results → refine search (add category/tag, use operators)
   - Zero results → broaden search terms or check `memory status`
4. When target found → memory_read for full details
```

## Search Operators
- `|` OR: `"jwt | oauth | session"` → matches any term
- `&` AND: `"jwt & refresh"` → must match all terms
- Bare terms: `"jwt token"` → default AND

## Checklist
- [ ] Identify keywords and expected result types
- [ ] Use `--category` to narrow by type if applicable
- [ ] Use `|` for broad searches, `&` for precise
- [ ] Evaluate result scores (>8.0 = high confidence)
- [ ] Refine search if too many or zero results
- [ ] Proceed to `memory_read` for selected entries

## Tools
| Tool | Purpose | Example |
|------|---------|---------|
| `memory_search` | Search all types | `memory_search({query: "jwt & refresh", category: "component"})` |
| `memory_read` | Read full entry | `memory_read({id: "component/token-service"})` |
| `memory status` | Check index health | `memory_status({})` |
