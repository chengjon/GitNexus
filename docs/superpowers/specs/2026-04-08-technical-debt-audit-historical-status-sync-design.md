# Technical Debt Audit Historical Status Sync Design

日期：2026-04-08  
类型：doc-only historical status sync  
范围：historical `2026-03-28-technical-debt-audit.md`

---

## 1. 问题定义

`2026-03-28-technical-debt-audit.md` 是 worktree-era 的历史基线审计，但当前读者仍
可能把其中 `generator.ts in progress`、`local slice committed`、
`execute the generator worktree merge` 等叙事误读成当前主仓状态。

因此当前 residual 不在原始审计内容，而在缺少 current-state framing。

---

## 2. 设计选择

本轮 truth source 采用：

- historical audit doc itself
- 当前 remediation roadmap
- 仓库级 status sync 审计
- 2026-04-08 的 wiki-generator truth-sync records

本轮不重写原始审计结论，只补 reader guidance，让文档继续作为 historical
baseline 可用。

---

## 3. 目标文件

- `docs/superpowers/specs/2026-03-28-technical-debt-audit.md`
- `docs/audits/2026-04-08-technical-debt-audit-historical-status-sync.md`
- `docs/superpowers/specs/2026-04-08-technical-debt-audit-historical-status-sync-design.md`
- `docs/superpowers/plans/2026-04-08-technical-debt-audit-historical-status-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-technical-debt-audit-historical-status-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`

唯一目标是把一份 historical audit 补成更不易误读的 current-state-aware record。
