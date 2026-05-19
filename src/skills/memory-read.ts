export const NAME = 'memory-read';
export const DESCRIPTION = 'Use when reading detailed content of a knowledge entry. Supports section-based reading (methods, routes, states) for depth entries.';

export const SKILL = `---
name: memory-read
description: "Use when reading detailed content of a knowledge entry. Guide AI to progressively expand details after search. Supports section-based reading for depth entries. Examples: '详细说明 JWT 流程', 'Read token-service docs', '展开这个配置'"
---

# Reading Knowledge Entries

## When to Use
- After \`memory_search\` identifies a relevant entry
- User asks to "展开" (expand) or "详细" (detail) a specific entry
- Need to see full implementation details, config values, or decision rationale

## Workflow
\`\`\`
1. Identify the target node ID from search results
2. memory_read({id, related?, section?}) → full or section content
3. Present key information to user:
   - Summary + type + status + tags
   - If section requested: only that section
   - Full Markdown body (when section: "all" or omitted)
   - Related nodes (if --related option used)
4. If related nodes are relevant, offer to read them individually.
   Do NOT automatically read nodes whose summaries were already shown.
\`\`\`

## Section-based Reading (depth entries)

When entries are built from \`memory analyze --detail\`, use \`section\` to read specific parts:

- \`section: "methods"\` → Only show "导出 API" method signature table
- \`section: "routes"\` → Only show "路由表" route table
- \`section: "states"\` → Only show "状态转换表" state transitions
- \`section: "all"\` (default) → Full body

## Decision Rules
- **Avoid redundant reads**: if a summary from \`--related\` was already shown, do not re-read unless user asks
- **One read at a time**: do not batch-read multiple nodes simultaneously unless explicitly requested
- **Progressive**: only go deeper when the user signals interest
- **Section-first for large entries**: Use section="methods"/"routes"/"states" when entry body is large and user only needs specific info

## Checklist
- [ ] Confirm target node ID from search results
- [ ] For depth entries: consider using \`section\` to read only relevant parts
- [ ] Call \`memory_read\` with appropriate options
- [ ] Present full content clearly
- [ ] Check if \`--related\` summaries answer adjacent questions
- [ ] Ask user if they want to read related nodes before doing so

## Tools
| Tool | Purpose | Example |
|------|---------|---------|
| \`memory_read\` | Full entry content | \`memory_read({id: "component/token-service", related: true})\` |
| \`memory_read\` (section) | Read specific section | \`memory_read({id: "component/token-service", section: "methods"})\` |
| \`memory_graph\` | Deeper relationships | \`memory_graph({id: "component/token-service", depth: 2})\` |
`;
