---
id: flow/code-analysis
type: flow
summary: Source code analysis pipeline — scan directories → extract symbols via tree-sitter/regex → write analyze dump → build knowledge entries → rebuild index
tags: [analysis, pipeline, scan, extract]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
trigger: User runs `memory analyze [path]` or invokes memory-build skill
relates:
  - component/scanner
  - component/extractor
  - component/repo-manager
  - component/index-handler
steps:
  - order: 1
    component: component/scanner
    description: Scan project directory to discover source files, excluding build artifacts and deps
  - order: 2
    component: component/extractor
    description: Parse each source file using tree-sitter (primary) or regex (fallback) to extract symbols
  - order: 3
    component: component/dump-writer
    description: Serialize extracted symbols to .analyze-dump.json in .memory/
  - order: 4
    component: system/cli
    description: User or AI classifies symbols into 6 node types (system/flow/component/config/api/decision)
  - order: 5
    component: component/index-handler
    description: Rebuild index.json with SHA256 hashes from .md files (memory rebuild)
result: Structured knowledge base with indexed .md files in .memory/
---

# Code Analysis 代码分析流程

memory-tool 的核心工作流，将原始源代码转化为结构化知识库。

## 完整流水线

```
源代码目录
    │
    ▼
┌─────────────────────────────┐
│ 1. Scanner (scanner.ts)     │
│    递归发现源文件              │
│    排除: node_modules, dist  │
│    → SourceFile[]            │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 2. Extractor (extractor.ts) │
│    tree-sitter AST 解析       │
│    (回退: regex 模式匹配)     │
│    → ExtractedSymbol[]       │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 3. DumpWriter (dump-writer) │
│    生成 .analyze-dump.json   │
│    → AnalyzeDump             │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 4. 分类 (memory-build skill) │
│    AI 辅助符号分类             │
│    生成 .md 知识文件           │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ 5. Rebuild (memory rebuild) │
│    重建 index.json           │
│    重建 graph.json           │
│    → 可搜索的知识库           │
└─────────────────────────────┘
```
