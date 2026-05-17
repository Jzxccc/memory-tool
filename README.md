# memory-tool

为 AI 辅助编程工具构建项目级代码业务逻辑知识库。

```
memory analyze src/           # 提取代码符号
memory build                  # AI 分类符号 → 知识条目
memory write                  # AI 补充业务逻辑
memory search "pipeline"      # 搜索知识
memory read component/xxx     # 读取正文
memory graph system/xxx       # 遍历关系图
```

---

## 安装

```bash
npm install -g memory-tool
```

可选：安装 tree-sitter 获得精确 AST 符号提取（否则自动降级为正则匹配）。

```bash
npm rebuild tree-sitter
```

## 快速开始

```bash
cd your-project

# 1. 提取源码符号（自动检测 tree-sitter / regex）
memory analyze src/

# 2. AI 代理读取 .analyze-dump.json 并分类生成 .md 文件
#    （通过 memory-build skill 完成）

# 3. AI 代理补充业务逻辑（通过 memory-write skill 完成）

# 4. 重建索引
memory rebuild

# 5. 搜索
memory search "auth"
```

---

## 命令

### 构建类

| 命令 | 说明 |
|------|------|
| `memory analyze [path]` | 提取源码符号。支持 TS/JS/Vue/Python/Java/Go。tree-sitter → regex 自动降级 |
| `memory rebuild` | 从 `.memory/` 的 `.md` 文件重建 index.json + graph.json |

### 查询类

| 命令 | 说明 |
|------|------|
| `memory search <query>` | 全文搜索。支持 `\|` (OR)、`&` (AND)、`--tag`、`--category` |
| `memory read <id>` | 读取条目的正文内容（不含前端元数据） |
| `memory graph <id>` | 遍历关系图。`--depth`、`--direction` |
| `memory status` | 查看知识库健康度：条目数、类型分布、新鲜度 |

### 维护类

| 命令 | 说明 |
|------|------|
| `memory audit <id>` | 检查单个条目的文件存在性、contentHash、代码引用 |

### 集成类

| 命令 | 说明 |
|------|------|
| `memory mcp` | 启动 MCP stdio 服务器，供 AI 编程工具集成 |

---

## 渐进式三层检索

```
Layer 1 (search)
  → 仅返回 type + id + summary + tags + score
  → 快速浏览，定位目标

Layer 2 (read)
  → 仅返回正文（不重复前端元数据）
  → 深入理解业务逻辑、开发注意、调用链

Layer 3 (graph)
  → 遍历关系图拓扑
  → 了解模块间依赖和影响范围
```

---

## 知识节点类型

| 类型 | 目录 | 用途 |
|------|------|------|
| System | `.memory/systems/` | 顶层服务或模块边界 |
| Flow | `.memory/flows/` | 端到端业务流程，含步骤链 |
| Component | `.memory/components/` | 具体源码文件或实现单元 |
| Config | `.memory/configs/` | 配置项或环境变量 |
| API | `.memory/apis/` | API 端点和服务接口 |
| Decision | `.memory/decisions/` | 技术决策和权衡 |

---

## AI 工具集成

支持 Claude Code、CodeBuddy Code、Lingma 三套工具。

```json
// .mcp.json（自动发现）
{
  "mcpServers": {
    "memory-tool": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "memory-tool@latest", "mcp"]
    }
  }
}
```

### 技能文件

| 技能 | 用途 |
|------|------|
| `memory-build` | 读 analyze dump → 分类符号 → 生成知识条目 |
| `memory-search` | 搜索意图 → 检索 → 评估 → 决策 |
| `memory-read` | 渐进展开知识条目详情 |
| `memory-write` | 读源码 → 理解业务逻辑 → 补充正文 |
| `memory-status` | 检查知识库健康度与新鲜度 |

三个工具的技能文件完全一致：
- Claude Code: `.claude/skills/memory/`
- CodeBuddy Code: `.codebuddy/skills/memory/`
- Lingma: `.lingma/skills/memory/`

### MCP 工具

| 工具 | 说明 |
|------|------|
| `memory_search` | 全文搜索知识库 |
| `memory_read` | 读取知识条目全文 |
| `memory_graph` | 遍历关系图 |
| `memory_status` | 健康检查 |
| `memory_categories` | 类别统计 |

---

## 降级策略

```
tree-sitter 已安装且可用  → 引擎: tree-sitter → AST 精确提取
tree-sitter 不可用         → 引擎: regex → 正则降级提取
```

## 开发

```bash
npm install
npm run build          # tsc
npm run dev            # tsx watch
npm test               # vitest run
npm run typecheck      # tsc --noEmit
```

## 许可

MIT
