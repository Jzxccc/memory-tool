---
id: system/cli
type: system
summary: CLI command interface — unified entry point for all memory-tool commands via commander.js with lazy-loaded module actions
tags: [cli, commander, entry-point]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
relates: [system/core, system/mcp, system/storage, flow/code-analysis, flow/knowledge-search]
---

# CLI 命令行系统

Command-line interface 系统是 memory-tool 的用户界面入口，通过 `memory` 命令暴露所有功能。

## 架构

基于 commander.js 构建，使用 `createLazyAction` 模式延迟加载各命令模块，减少启动时间。

## 子命令

| 命令 | 功能 | 实现文件 |
|------|------|----------|
| `memory analyze [path]` | 从源码提取符号 | `cli/analyze.ts` |
| `memory search <query>` | 搜索知识库 | `cli/search.ts` |
| `memory read <id>` | 读取知识条目 | `cli/read.ts` |
| `memory graph <id>` | 遍历关系图 | `cli/graph.ts` |
| `memory status` | 检查知识库健康状态 | `cli/status.ts` |
| `memory rebuild` | 从 .md 文件重建索引 | `cli/rebuild.ts` |
| `memory audit <id>` | 检查单条目过时 | `cli/audit.ts` |
| `memory mcp` | 启动 MCP stdio 服务器 | `cli/mcp.ts` |

## 搜索语法

搜索支持使用 `|` 进行 OR 查询、`&` 进行 AND 查询，可按类型、标签过滤。

## 帮助系统

每个命令均支持 `-h` / `--help` 查看详细帮助和使用示例：

```bash
memory -h              # 主程序帮助 + 常见工作流
memory -V              # 显示版本号
memory search -h       # search 命令的选项和示例
memory rebuild -h      # rebuild 命令的选项和示例
```

各命令帮助包含实际可运行的示例命令。主程序帮助展示了典型工作流（analyze → build → rebuild → search）。
