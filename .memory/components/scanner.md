---
id: component/scanner
type: component
summary: Source file scanner — recursively discovers project source files, filters by extension, excludes build artifacts, and detects project mode (monolith/micro)
tags: [scanner, filesystem, discovery]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/ingestion/scanner.ts
language: typescript
exports:
  - scanDirectory
  - detectProjectMode
  - walk
relates: [system/core, component/extractor, flow/code-analysis]
---

# Scanner 源文件扫描器

递归扫描项目目录，发现源代码文件，排除构建产物和依赖目录。

## 默认排除
`node_modules`, `dist`, `build`, `.git`, `__tests__`, `coverage`, `target`, `vendor`, `.next`, `out`, `.turbo`, `.storybook`

## 支持的源文件扩展名
`.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.java`, `.kt`, `.py`, `.go`, `.rs`

## 核心 API

### scanDirectory(rootDir, excludes?)
返回 `SourceFile[]`，包含文件路径、语言类型、大小等信息。

### detectProjectMode(rootDir)
检测项目模式：
- 存在 `services/` 或 `packages/` → `micro` (微服务)
- 存在 `src/` → `monolith` (单体)
- 默认 → `monolith`

### walk
导出的内部递归函数，可被外部扩展使用。
