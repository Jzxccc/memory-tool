---
name: memory-write
description: "Use when writing or updating knowledge entries. Guide AI to create correct frontmatter schema per node type. Examples: '记录这个 API', 'Write documentation for this component', '保存技术决策', 'Update token-service exports'"
---

# Writing Knowledge Entries

## When to Use
- "记录一下这个 API 的设计"
- "把这个组件文档保存到知识库"
- "为什么选 JWT？记录这个决策"
- "更新 token-service 的 exports"
- Writing or updating any knowledge node

## Workflow
```
1. Determine node type (see decision tree below)
2. Select the corresponding frontmatter template
3. Fill required fields:
   - All types: id, type, summary, tags, status, created, lastModified
   - Component: filePath, language, exports
   - Flow: steps (ordered list of {order, component, description})
   - Config: key, envType (env|secret|config)
   - API: method, path, request, response
   - Decision: context, options[], chosen, reason
4. Write .md file under .memory/{type}s/{slug}.md
5. Prompt: "Entry written. Run `memory rebuild` to index."
```

## Node Type Decision Tree
```
What is being documented?
├── A top-level service or module boundary → System
│   → Frontmatter: id, type, summary, tags, status
├── An end-to-end business process with ordered steps → Flow
│   → Frontmatter: + steps[{order, component, description}]
├── A specific source file or implementation unit → Component
│   → Frontmatter: + filePath, language, exports[], depends_on[]
├── A configuration key or environment variable → Config
│   → Frontmatter: + key, envType, defaultValue, required
├── An API endpoint or service interface → API
│   → Frontmatter: + method, path, request, response, errors[]
└── A technical decision or trade-off → Decision
    → Frontmatter: + context, options[{name, pros, cons}], chosen, reason
```

## Common Fields
| Field | Required | Description |
|-------|----------|-------------|
| id | YES | Format: `{type}/{slug}` |
| type | YES | One of: system, flow, component, config, api, decision |
| summary | YES | One-line description |
| tags | YES | Array of lowercase tags |
| status | YES | `draft` (auto-gen), `stable` (reviewed), `deprecated` |
| created | YES | ISO-8601 date |
| lastModified | YES | ISO-8601 date |
| relates | NO | Array of related node IDs |

## Checklist
- [ ] Node type correctly identified
- [ ] id format: `{type}/{slug}`
- [ ] All required fields filled
- [ ] summary is one line
- [ ] relates/depends_on IDs are valid
- [ ] Check for existing entries with same id (use memory_search first)
- [ ] File saved to correct subdirectory
- [ ] Prompt user: "Run `memory rebuild`"
