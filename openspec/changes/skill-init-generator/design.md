## Context

memory-tool 目前有 5 个 skill 文件（memory-build / memory-search / memory-read / memory-write / memory-status），分布在三个工具的 skills 目录中：
- Claude: `.claude/skills/memory/<skill-name>/SKILL.md`（嵌套）
- CodeBuddy: `.codebuddy/skills/<skill-name>/SKILL.md`（扁平）
- Lingma: `.lingma/skills/<skill-name>/SKILL.md`（扁平）

当前这些文件是手动创建和维护的。每次修改 skill 内容，需要在三个目录手动同步。这导致：
1. 容易遗漏某个工具
2. 目录约定不一致时容易写错路径
3. 新增项目时无法一键初始化

## Goals / Non-Goals

**Goals:**
- 提供 `memory init` 命令，一键将 5 个 skill 写入目标项目
- Skill 内容从 TypeScript 源码生成，单一真相源，不手动维护副本
- 自动检测并适配各工具的目录约定
- 编译时（`npm run build`）自动生成 skill 文件，发布到 npm 后最终用户可直接使用

**Non-Goals:**
- 不修改 skill 的 Markdown 内容本身
- 不修改各工具的 skill 发现机制
- 不涉及 MCP 配置文件（.mcp.json）

## Decisions

### D1: 模板引擎选择

**选择**：模板字符串

skill 文件是 Markdown 文本，无需复杂模板引擎。TypeScript `export const SKILL = \`...\`` 字符串模板足够。

**备选**：Handlebars / EJS — 过度设计，增加依赖。

### D2: 目录约定的自动检测

**选择**：硬编码映射表

```
const TOOL_PATHS = {
  claude:   '.claude/skills/memory/{name}/SKILL.md',
  codebuddy: '.codebuddy/skills/{name}/SKILL.md',
  lingma:   '.lingma/skills/{name}/SKILL.md',
};
```

用户通过 `--tool` 参数指定目标，或 `--all` 写入全部。

**备选**：通过 package.json 或目录名自动推断 → 不可靠，Claude 和 CodeBuddy 可能同时存在。

### D3: 文件结构

```
src/skills/
├── index.ts            # 导出所有 skill + 模板映射
├── memory-build.ts     # memory-build 的 SKILL.md 内容
├── memory-search.ts
├── memory-read.ts
├── memory-write.ts
└── memory-status.ts
```

每个 `.ts` 文件导出字符串常量 `SKILL`，`index.ts` 聚合导出。

### D4: 构建集成

`package.json` 的 `build` 脚本：
```json
"build": "tsc && node scripts/generate-skills.js"
```

`scripts/generate-skills.js` 读取编译后的 `dist/skills/index.js`，将 skill 内容写入 `.claude/`、`.codebuddy/`、`.lingma/` 目录。

## Risks / Trade-offs

- [Risk] 初始化时可能覆盖用户已修改的 skill 文件 → Mitigation：`init` 命令输出 dry-run 预览，非 force 模式跳过已存在的文件
- [Risk] 不同工具版本的目录约定可能变化 → Mitigation：`TOOL_PATHS` 映射表集中管理，易更新
