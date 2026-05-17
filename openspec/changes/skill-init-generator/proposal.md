## Why

当前 skill 文件是手动创建并维护的，每次修改 skill 内容需要在 `.claude/`、`.codebuddy/`、`.lingma/` 三个目录手动同步，且 Claude 的目录约定（`skills/memory/memory-write/`）与其他工具的约定（`skills/memory-write/`）不同。缺少一个脚本化的初始化机制，导致 skill 不能被正确部署到目标项目。

## What Changes

- 新增 `memory init` CLI 命令，将 skill 文件从内置模板部署到目标项目
- 将 skill 文件从手动维护的 `.md` 改为由 TypeScript 源码生成
- `memory init` 自动检测目标工具类型并使用正确的目录约定
- `package.json` 的 `files` 字段包含编译后的 skill 模板，确保 npm 发布后可用

## Capabilities

### New Capabilities
- `skill-init`: CLI 命令将内置 skill 模板写入目标项目的技能目录
- `skill-codegen`: 从 TypeScript 源码生成 skill 文件（源码即真相，生成物为产出）

## Impact

- 新增文件：`src/cli/init.ts`（init 命令）
- 新增目录：`src/skills/`（skill 模板生成源码）
- 删除手动维护的 `.claude/skills/memory/`、`.codebuddy/skills/memory-*/`、`.lingma/skills/memory-*/` 下的 `.md` 文件
- 修改 `package.json` 的 `build` 脚本，加入 skill 生成步骤
- `.gitignore` 添加生成的 skill 文件（因为可重新生成）
