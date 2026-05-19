export const NAME = 'memory-build';
export const DESCRIPTION = 'Use to build project knowledge from source code analysis. Guide AI to read .analyze-dump.json, classify symbols, and generate structured .md files. Supports depth extraction for function signatures, routes, and state machines.';

export const SKILL = `---
name: memory-build
description: "Use to build project knowledge from source code analysis. Guide AI to read .analyze-dump.json, classify symbols, and generate structured .md files. Supports depth extraction (--detail) for function signatures, routes, state machines. Examples: '构建项目知识', 'Build knowledge from analyze dump', '分类提取的符号'"
---

# Building Project Knowledge

## When to Use
- After \`memory analyze\` generates \`.analyze-dump.json\`
- When starting a new project and need to build the knowledge base
- When adding a new service module to an existing knowledge base

## Workflow
\`\`\`
1. READ .memory/.analyze-dump.json → Understand discovered symbols
2. Check if detail: true → enable depth extraction mode
3. Identify System boundaries (services/ or src/ subdirectories)
4. Classify symbols into 6 node types:
   - Directories → System
   - Entry-point files → Component
   - Route/handler files → API
   - Config files → Config
   - Multi-component chains → Flow (manual)
   - Trade-offs → Decision (manual)
5. IF detail mode: Extract structured data from symbols
   - Functions with params[] → fill methods field in frontmatter
   - Routes with handler → fill route table in API body
   - StateEnum/StateUnion configs → note in Flow body for state machines
6. For each symbol, generate a .md file with correct frontmatter
7. Declare relationships (relates, depends_on, steps)
8. Prompt: "Knowledge built. Run \`memory rebuild\` to index."
\`\`\`

## Depth Extraction Phase

When \`.analyze-dump.json\` has \`"detail": true\`, the symbol data contains extra fields:

### Function/method symbols (params, returnType, visibility)
- Extract \`params\` array into frontmatter \`methods\` field:
  \`\`\`yaml
  methods:
    - name: wechatLogin
      params: [{name: code, type: string}]
      returnType: Promise<LoginResult>
  \`\`\`

### Route symbols (handler)
- Route symbols with \`handler\` field → include handler name in API body route table
- Group routes per file into a single API entry

### State enum/config symbols (source starts with "State")
- StateEnum/StateUnion symbols → compile into Flow body's state transition table
- Example: \`source: "StateUnion:pending_payment,paid,accepted,in_progress,completed"\`
  → Create a state list for the flow entry

## Node Type Decision Tree
\`\`\`
What is being documented?
├── A top-level service or module boundary → System
├── An end-to-end business process with steps → Flow
├── A specific code implementation unit → Component
├── A configuration item or environment variable → Config
├── An API endpoint or service interface → API
└── A technical decision or trade-off → Decision
\`\`\`

## Depth-Extracted Frontmatter Fields

| Field    | Types     | Description                                      |
|----------|-----------|--------------------------------------------------|
| methods  | Component | Array of {name, params[{name,type}], returnType} |
| stateEnum| Flow,Config | String list of state values from StateEnum/Union|

## Checklist
- [ ] Read \`.memory/.analyze-dump.json\`
- [ ] Check \`"detail": true\` → enable depth extraction
- [ ] Identify all System boundaries
- [ ] Classify each symbol to correct node type
- [ ] **If detail**: Extract methods[] from function symbols, state enums from config symbols
- [ ] Fill all required frontmatter fields per type
- [ ] Set \`status: draft\` for auto-generated entries
- [ ] Declare \`relates\` and \`depends_on\` relationships
- [ ] Check for existing nodes to avoid duplicates
- [ ] Prompt user to run \`memory rebuild\`

## Tools
| Tool | Purpose | Example |
|------|---------|---------|
| \`memory analyze\` | Generate discovery dump | \`memory analyze --detail\` |
| \`memory write\` | Create individual .md files | Via memory-write skill |
| \`memory rebuild\` | Index all entries | \`memory rebuild\` |
| \`memory search\` | Check for existing entries | \`memory search "token"\` |
`;
