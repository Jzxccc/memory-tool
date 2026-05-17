## Context

当前 `src/cli/index.ts` 使用 Commander.js v14 定义 8 个子命令，`--help`/`-h` 和 `--version`/`-V` 已被 Commander 默认启用。

需要增强的是帮助内容，而非添加新的 flag 或 option。

## Goals / Non-Goals

**Goals:**
- 每个子命令的 `--help` 输出包含使用示例
- 主程序 `--help` 输出包含全局工作流示例
- 版本命令可被 `-V` 触发（已支持）

**Non-Goals:**
- 不改动 Commander.js 默认行为
- 不添加自定义 help formatter
- 不在 MCP server 中添加 help（MCP 通过 tools 列表暴露）
- 不进行国际化

## Decisions

### Decision 1: 使用 `.addHelpText('after', ...)` 追加示例

Commander.js 的 `.addHelpText()` 允许在默认帮助输出后追加自定义文本。选择 `'after'` 位置（默认帮助 → 选项列表 → 示例）。

**Alternative**: `.helpInformation()` 完全覆盖帮助文本 → 拒绝，维护成本高，Commander 自动生成的选项列表质量好。

### Decision 2: 示例用英文编写

CLI 输出全部为英文（description 字段），示例保持一致。中文示例会增加显示宽度问题。

### Decision 3: 不分拆 help 逻辑到独立文件

当前只有 8 个命令，每个 2-3 行示例，直接写在 `index.ts` 中即可。如果未来命令数 >15，再考虑抽取。

## Risks / Trade-offs

- [Risk] 帮助文本硬编码在代码中 → Trade-off: 与项目规模匹配，无需复杂化
- [Risk] 示例过时（命令参数变化） → Mitigation: 示例紧挨命令定义，修改命令时可见
