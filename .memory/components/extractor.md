---
id: component/extractor
type: component
summary: Symbol extractor — uses tree-sitter (primary) or regex (fallback) to parse source code and extract functions, classes, imports, configs, and routes
tags: [extractor, tree-sitter, regex, symbols, ast]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/ingestion/extractor.ts
language: typescript
exports:
  - extractSymbols
  - isTreeSitterAvailable
depends_on:
  - component/scanner
relates: [system/core, flow/code-analysis]
---

# Extractor 符号提取器

从源代码中提取结构化符号信息。

## 双引擎策略

### 主引擎: tree-sitter
使用 tree-sitter 进行 AST 解析，支持 `.so`/`.dylib`/`.dll` 原生二进制。通过 `tryLoadTreeSitter()` 动态加载。

### 回退: Regex
当 tree-sitter 不可用时，使用正则表达式模式匹配：`extractWithRegex()`。

## 支持的提取类型
- **function** — 函数声明
- **class** — 类声明
- **import** — 导入语句
- **config** — 配置常量
- **route** — 路由定义

## Tree-sitter 节点类型映射 (NODE_MAP)
将各语言的 AST 节点类型统一映射到内部类型标识：
- `function_declaration`, `method_definition`, `arrow_function` → `function`
- `class_declaration` → `class`
- `import_statement`, `import_declaration` → `import`
- `variable_declarator` (大写/常量名) → `config`

## 导出检查
`isExported()` 通过检测 `export` 或 `export default` 前缀判断符号是否被导出。

## 语言支持

| 标识 | 语言 | tree-sitter 模块 |
|------|------|------------------|
| JS | JavaScript | 共享 TS |
| TS | TypeScript | tree-sitter-typescript |
| PY | Python | tree-sitter-python |
| JAVA | Java | tree-sitter-java |
| GO | Go | tree-sitter-go |
