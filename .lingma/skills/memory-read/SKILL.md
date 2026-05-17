---
name: memory-read
description: "Use when reading detailed content of a knowledge entry. Guide AI to progressively expand details after search. Examples: '详细说明 JWT 流程', 'Read token-service docs', '展开这个配置'"
---

# Reading Knowledge Entries

## When to Use
- After `memory_search` identifies a relevant entry
- User asks to "展开" (expand) or "详细" (detail) a specific entry
- Need to see full implementation details, config values, or decision rationale

## Workflow
```
1. Identify the target node ID from search results
2. memory_read({id, related?}) → full content
3. Present key information to user:
   - Summary + type + status + tags
   - Full Markdown body
   - Related nodes (if --related option used)
4. If related nodes are relevant, offer to read them individually.
   Do NOT automatically read nodes whose summaries were already shown.
```

## Decision Rules
- **Avoid redundant reads**: if a summary from `--related` was already shown, do not re-read unless user asks
- **One read at a time**: do not batch-read multiple nodes simultaneously unless explicitly requested
- **Progressive**: only go deeper when the user signals interest

## Checklist
- [ ] Confirm target node ID from search results
- [ ] Call `memory_read` with appropriate options
- [ ] Present full content clearly
- [ ] Check if `--related` summaries answer adjacent questions
- [ ] Ask user if they want to read related nodes before doing so

## Tools
| Tool | Purpose | Example |
|------|---------|---------|
| `memory_read` | Full entry content | `memory_read({id: "component/token-service", related: true})` |
| `memory_graph` | Deeper relationships | `memory_graph({id: "component/token-service", depth: 2})` |
