---
name: memory-status
description: "Use when checking knowledge base health, freshness, or completeness. Guide AI to run status and audit checks. Examples: 'Check knowledge base status', '检查知识库状态', '有没有过时的内容', 'Audit token-service'"
---

# Checking Knowledge Base Health

## When to Use
- "检查知识库状态"
- "有没有过期的条目？"
- "看看 token-service 的文档是否还准确"
- Periodically to ensure knowledge remains fresh
- Before making code changes to verify knowledge accuracy

## Workflow
```
1. memory_status() → overall health report
2. If stale entries exist:
   - memory_audit({id}) for each stale entry
   - Report what changed and what needs updating
3. If index is missing or broken:
   - Suggest running `memory rebuild`
4. If all healthy: report "知识库健康" and continue
```

## Interpretation
| Status Output | Meaning | Action |
|---------------|---------|--------|
| `✓ 最新` | All content hashes match | No action needed |
| `✗ 有变更` / Stale entries | Content changed since last rebuild | Run `memory rebuild` |
| Missing entries | File was deleted | Run `memory rebuild` to clean index |
| Orphan nodes | Referenced in relations but file missing | Remove stale relations or recreate file |

## Checklist
- [ ] Run `memory status`
- [ ] Check entry count and type breakdown
- [ ] Review any stale entries
- [ ] For each stale entry, run `memory audit`
- [ ] Recommend `memory rebuild` if needed
- [ ] Report summary to user

## Tools
| Tool | Purpose | Example |
|------|---------|---------|
| `memory_status` | Overall health | `memory_status({})` |
| `memory audit` | Per-entry check | `memory audit({id: "component/token-service"})` |
| `memory rebuild` | Rebuild index | `memory rebuild` |
