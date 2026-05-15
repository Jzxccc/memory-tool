## Why

AI 编程助手（如 CodeBuddy Code、Claude Code）在处理项目级代码时，缺乏对业务逻辑、技术决策和代码上下文的持久化记忆。每次会话都需要重新理解项目，效率低下。Memory-Tool 提供一个文档化的代码知识库，让 AI 代理能渐进式地查询、理解和维护项目级知识。

## What Changes

- **知识图谱节点体系**：定义 6 类节点（System/Flow/Component/Config/API/Decision）和 6 种关系（contains/flows_through/implements/depends_on/alternative_to/references），构成项目知识的有向图
- **CLI 命令层**：实现 6 个命令（search/read/status/rebuild/audit/graph），支持渐进式信息披露
- **AI 代理技能系统**：4 个 SKILL 文件（search/read/write/status），面向 AI 编程助手的意图匹配和工作流引导
- **统一搜索后端**：file 引擎（关键词 + frontmatter 匹配）和 libsql 引擎（FTS5）双引擎，通过 RRF（K=60）融合排序
- **MCP 协议服务器**：暴露 4 个 MCP 工具（memory_search/memory_read/memory_graph/memory_status）和 6 个资源 URI，供 AI 编程工具集成
- **渐进式披露机制**：search 返回摘要（第一层）→ read 返回完整内容（第二层）→ graph 返回关系图（第三层），避免一次性加载过多上下文

## Capabilities

### New Capabilities

- `knowledge-graph`: 知识图谱的节点类型定义（6 类）、关系类型定义（6 种）、frontmatter schema（按节点类型区分必填/可选字段）、index.json 和 graph.json 持久化格式
- `cli-commands`: CLI 命令体系，包括 search（搜索摘要）、read（渐进式读取详情）、status（健康检查）、rebuild（索引重建管道）、audit（过期检测）、graph（关系图遍历）
- `skill-system`: AI 代理的技能文件系统，4 个 SKILL.md（memory-search/memory-read/memory-write/memory-status），每个包含 When to Use / Workflow / Checklist / Tools / Example 五段式结构
- `mcp-server`: MCP stdio 服务器，4 个工具定义（含 annotations 和 inputSchema）+ 6 个资源 URI（memory://categories, memory://category/{type}, memory://entry/{id}, memory://status, memory://tags, memory://graph/{id}）
- `search-engine`: 统一搜索后端，file 引擎（关键词+frontmatter 打分）和 libsql 引擎（FTS5）的抽象接口，RRF（K=60）融合评分，归一化输出
- `progressive-disclosure`: 三层信息展开机制，search 返回 type+summary+tags+score，read 返回完整 Markdown+frontmatter+related，graph 返回入边/出边关系图

## Impact

- **项目结构**：新建 npm 包（TypeScript），依赖 Commander.js、libsql、@modelcontextprotocol/sdk
- **文件存储**：定义 `.memory/` 目录下的 6 个子目录、frontmatter schema、index.json、graph.json 格式
- **AI 集成**：通过 `.mcp.json` + SKILL 文件实现 AI 编程工具自动发现
- **参考架构**：借鉴 GitNexus 的 CLI 懒加载、内容寻址缓存、RRF 融合、Skill 模板、MCP 资源 URI 等设计模式
