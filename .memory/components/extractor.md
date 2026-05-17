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
  - walkTree
  - extractWithTreeSitter
  - extractWithRegex
  - tryLoadTreeSitter
  - extractName
  - isExported
depends_on:
  - component/scanner
relates: [system/core, flow/code-analysis]
---

# Extractor 符号提取器

从源代码中提取结构化符号信息。支持 5 种语言、tree-sitter 主引擎 + regex 回退。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `extractSymbols` | `(filePath, language) => Promise<ExtractedSymbol[]>` | 主入口，根据可用性选择 tree-sitter 或 regex 提取 |
| `isTreeSitterAvailable` | `() => Promise<boolean>` | 检查 tree-sitter 原生模块是否可加载 |
| `tryLoadTreeSitter` | `() => Promise<boolean>` | 懒加载 tree-sitter 及 5 种语言的 parser，结果缓存 |
| `extractWithTreeSitter` | `(content, filePath, language) => ExtractedSymbol[]` | 使用 tree-sitter AST 完整遍历提取符号 |
| `extractWithRegex` | `(content, filePath, language) => ExtractedSymbol[]` | 使用正则逐行匹配提取（回退） |
| `walkTree` | `(node, filePath, language, content) => ExtractedSymbol[]` | AST 递归遍历，识别 5 种节点类型 |
| `extractName` | `(node) => string \| null` | 从 AST 节点提取标识名 |
| `isExported` | `(node, content, language) => boolean` | 检测符号是否被导出 |

## 提取的 5 种符号类型

| 类型 | tree-sitter 识别 | regex 识别 |
|------|-----------------|-----------|
| `function` | `function_declaration`, `method_definition`, `arrow_function` | `function`, `=>` 变量, `def`, `func` |
| `class` | `class_declaration`, `interface_declaration` | `class` 关键字 |
| `import` | `import_statement`, `import_declaration` | `import`/`require` 模式 |
| `config` | `variable_declarator`（全大写下划线命名） | `process.env`, `CONST_NAME =` |
| `route` | `decorator`（@Get/@Post 等）, `call_expression`（app.get 等） | 路由正则模式 |

## Tree-sitter 节点类型映射 (NODE_MAP)

按语言映射 AST 节点类型到内部符号类型：

| 语言 | function | class | import | 备注 |
|------|----------|-------|--------|------|
| typescript | function_declaration, method_definition, arrow_function | class_declaration, class | import_statement | 共享 JS parser |
| javascript | function_declaration, method_definition, arrow_function | class_declaration, class | import_statement | - |
| python | function_definition | class_definition | import_statement, import_from_statement | - |
| java | method_declaration, constructor_declaration | class_declaration, interface_enum | import_declaration | 支持 public 检测 |
| go | function_declaration, method_declaration | type_declaration | import_declaration | - |
| vue | function_declaration, method_definition | class_declaration | import_statement | 复用 JS parser |

## 引擎选择策略

```
tryLoadTreeSitter() → 成功 + 解析返回符号 > 0 → 使用 tree-sitter 结果
                     → 成功 + 解析返回 0 → 回退 regex
                     → 失败 → 使用 regex
```

tree-sitter 的 parser 对象被缓存 (`tsAvailable` 全局标志)，避免每次调用都尝试重新加载。

## 注意事项

- **空符号回退**：tree-sitter 解析成功但返回 0 个符号时（如不支持的语法），自动回退 regex
- **下划线跳过**：`extractName` 会跳过单字符名和以下划线开头的 function 名（私有/忽略函数）
- **Import 递归**：`import_statement` 的 `collectSpecifiers` 递归处理嵌套的 `named_imports` → `import_specifier` 结构
- **Config 检测**：仅识别大写+下划线命名的 `variable_declarator`（`/^[A-Z_]{2,}$/`），避免误抓普通变量
- **Route 双匹配**：同时支持装饰器模式 (`@Get('/path')`) 和调用表达式模式 (`app.get('/path')`)
- **错误处理**：所有提取函数都有 try/catch，文件不可读时返回空数组
