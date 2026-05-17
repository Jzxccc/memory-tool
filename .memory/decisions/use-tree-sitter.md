---
id: decision/use-tree-sitter
type: decision
summary: Chose tree-sitter as primary extraction engine with regex fallback, rejecting pure regex and custom parser approaches
tags: [decision, tree-sitter, parser, extraction, architecture]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
context: 需要从 5+ 种语言的源代码中可靠地提取符号（函数、类、导入、配置、路由）
options:
  - name: Pure regex
    pros:
      - 零依赖
      - 极快，逐行匹配 O(n)
      - 所有语言统一模式
    cons:
      - 无法处理嵌套结构 (class { method() })
      - 父子关系检测不可靠
      - 各语言差异大，模式维护成本高
  - name: tree-sitter + regex fallback
    pros:
      - AST 级精度，准确提取嵌套结构
      - 支持 parent/child 关系推断
      - 5 种语言原生 parser (TS, JS, Python, Java, Go)
      - 业界标准，社区活跃
    cons:
      - 需要原生二进制 (.so/.dylib/.dll)
      - 加载失败时必须回退
      - 包体积增加
  - name: Custom recursive descent parser
    pros:
      - 完全控制
      - 无外部依赖
    cons:
      - 开发量极大，每种语言都需要实现
      - 维护成本高，语言版本更新需适配
chosen: tree-sitter + regex fallback
reason: 在精度和技术可行性之间的最佳平衡。tree-sitter 提供 AST 级精度，regex 回退确保在所有环境下都能工作（包括无法安装原生二进制的环境）。混合策略使项目具有最大的环境兼容性。

## 什么情况下需要重新考虑

- tree-sitter 二进制分发问题持续影响大多数用户 → 考虑纯 regex + 简单解析器
- 需要支持的语言增加到 10+ 种 → 评估是否仍使用 tree-sitter 的模块化 loading 还是考虑统一的通用解析器
- 社区出现更好的通用解析方案（如 unified/tree-sitter 替代品）
