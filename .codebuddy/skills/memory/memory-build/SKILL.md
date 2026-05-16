---
name: memory-build
description: "Use to build project knowledge from source code analysis. Guide AI to read .analyze-dump.json, classify symbols, and generate structured .md files. Examples: '构建项目知识', 'Build knowledge from analyze dump', '分类提取的符号'"
---

# Building Project Knowledge

## When to Use
- After `memory analyze` generates `.analyze-dump.json`
- When starting a new project and need to build the knowledge base
- When adding a new service module to an existing knowledge base

## Workflow
```
1. READ .memory/.analyze-dump.json → Understand discovered symbols
2. Identify System boundaries (services/ or src/ subdirectories)
3. Classify symbols into 6 node types:
   - Directories → System
   - Entry-point files → Component
   - Config files → Config
   - Route/handler files → API
   - Multi-component chains → Flow (manual)
   - Trade-offs → Decision (manual)
4. For each symbol, generate a .md file with correct frontmatter
5. Declare relationships (relates, depends_on, steps)
6. Prompt: "Knowledge built. Run `memory rebuild` to index."
```

## Node Type Decision Tree
```
What is being documented?
├── A top-level service or module boundary → System
├── An end-to-end business process with steps → Flow
├── A specific code implementation unit → Component
├── A configuration item or environment variable → Config
├── An API endpoint or service interface → API
└── A technical decision or trade-off → Decision
```

## Checklist
- [ ] Read `.memory/.analyze-dump.json`
- [ ] Identify all System boundaries
- [ ] Classify each symbol to correct node type
- [ ] Fill all required frontmatter fields per type
- [ ] Set `status: draft` for auto-generated entries
- [ ] Declare `relates` and `depends_on` relationships
- [ ] Check for existing nodes to avoid duplicates
- [ ] Prompt user to run `memory rebuild`

## Tools
| Tool | Purpose | Example |
|------|---------|---------|
| `memory analyze` | Generate discovery dump | `memory analyze services/auth/` |
| `memory write` | Create individual .md files | Via memory-write skill |
| `memory rebuild` | Index all entries | `memory rebuild` |
| `memory search` | Check for existing entries | `memory search "token"` |
