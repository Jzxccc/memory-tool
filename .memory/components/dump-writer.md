---
id: component/dump-writer
type: component
summary: Analysis dump writer — serializes scanned source files and extracted symbols to .memory/.analyze-dump.json
tags: [dump, serialization, cache, analyze]
status: stable
created: 2026-05-17
lastModified: 2026-05-17
filePath: src/core/ingestion/dump-writer.ts
language: typescript
exports:
  - writeDump
relates: [system/core, component/scanner, component/extractor, flow/code-analysis]
---

# DumpWriter 分析缓存写入器

将代码分析结果序列化为 `.analyze-dump.json`，供后续的 memory-build 流程使用。

## 导出的函数

| 函数 | 签名 | 作用 |
|------|------|------|
| `writeDump` | `(memoryDir: string, dump: AnalyzeDump) => string` | 写入 dump 文件并返回路径 |

## AnalyzeDump 结构

```typescript
interface AnalyzeDump {
  generatedAt: string;      // ISO-8601
  mode: 'monolith' | 'micro';
  sourceCount: number;       // 扫描到的源文件数
  symbolCount: number;       // 提取到的符号总数
  files: Array<{             // 文件级摘要
    relativePath: string;
    language: string;
    symbolCount: number;
  }>;
  symbols: ExtractedSymbol[];  // 完整符号列表
}
```

## 写入位置

`.memory/.analyze-dump.json` — 以 `memoryDir` 为根目录

## 调用者

`cli/analyze.ts` → `writeDump(memoryDir, dump)` — 分析命令完成后

## 注意事项

- 无错误处理（直接 `writeFileSync`），写入失败会向上抛出
- 不做增量/差异化，每次全量覆盖
- dump 文件被解析为中间缓存，正式知识存在于 `.md` 文件中
