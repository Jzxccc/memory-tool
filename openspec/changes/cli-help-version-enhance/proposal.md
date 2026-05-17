## Why

Commander.js 自带 `--help`/`-h` 和 `--version`/`-V`，但当前帮助输出过于简洁 — 缺少使用示例、参数详细说明、常见场景演示。新用户无法通过 `memory search --help` 快速理解如何使用布尔搜索操作符或引擎策略选择。

## What Changes

- 为每个子命令添加 `.addHelpText('after', ...)` 调用，展示使用示例
- `memory search` 帮助添加 `|` 和 `&` 操作符示例
- `memory rebuild` 帮助添加 `--engine libsql` 使用场景
- `memory analyze` 帮助添加 path 参数说明
- `memory graph` 帮助添加关系类型图例
- `memory read` 帮助添加 `--related` 和 `--summary` 用法
- 主程序 `memory -h` 添加全局使用示例和常见工作流
- version 命令显式启用 `-V` / `--version` 快捷方式

## Capabilities

### New Capabilities
- `cli-help-examples`: 为所有 CLI 命令添加 `.addHelpText()` 使用示例，增强用户引导

### Modified Capabilities
<!-- 无现有 spec 需要修改 -->

## Impact

- **Affected code**: `src/cli/index.ts` (唯一修改文件)
- **Affected deps**: 无新增依赖
- **Affected knowledge entries**: `system/cli`
