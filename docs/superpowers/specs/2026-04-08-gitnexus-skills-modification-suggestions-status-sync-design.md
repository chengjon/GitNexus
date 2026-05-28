# GitNexus Skills Modification Suggestions Status Sync Design

日期：2026-04-08
类型：doc-only historical status sync
范围：historical `docs/gitnexus-skills-modification-suggestions.md`

---

## 1. 问题定义

`docs/gitnexus-skills-modification-suggestions.md` 是 2026-03-26 的建议基线，但当前
读者仍可能把其中多个建议块直接读成当前 skill-doc backlog。

因此当前 residual 不在原始建议内容，而在缺少 current-state framing。

---

## 2. 设计选择

本轮 truth source 采用：

- historical suggestions doc itself
- 已完成的 2026-04-08 skill-doc convergence records
- 当前 remediation roadmap

本轮不重写原始建议结论，只补 reader guidance，让文档继续作为 historical
baseline 可用。

---

## 3. 目标文件

- `docs/gitnexus-skills-modification-suggestions.md`
- `docs/audits/2026-04-08-gitnexus-skills-modification-suggestions-status-sync.md`
- `docs/superpowers/specs/2026-04-08-gitnexus-skills-modification-suggestions-status-sync-design.md`
- `docs/superpowers/plans/2026-04-08-gitnexus-skills-modification-suggestions-status-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-gitnexus-skills-modification-suggestions-status-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`

唯一目标是把一份 historical suggestions doc 补成更不易误读的
current-state-aware record。
