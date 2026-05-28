# Dual CLI Implementation Plan Truth Sync Design

日期：2026-04-07
类型：doc-only truth-sync
范围：四份 2026-04-06 dual-CLI implementation plan

---

## 1. 问题定义

四份 dual-CLI implementation plan 仍保留全量未勾选步骤，但对应的
OpenSpec changes 已经完成且仍然 valid。

这不是实现回退，而是 plan execution state 没有跟上真实交付状态。

---

## 2. 设计选择

本轮只做 plan truth-sync，不重开旧切片：

- 以对应 `openspec/changes/<change-id>/tasks.md` 为执行状态事实源
- implementation plan 只回填 execution state 与必要注记
- 不重写原切片设计，不重新组织原验证命令

---

## 3. 目标文件

- `docs/superpowers/plans/2026-04-06-dual-cli-doctor-doc-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-04-06-dual-cli-doctor-worktree-guidance-implementation-plan.md`
- `docs/superpowers/plans/2026-04-06-dual-cli-manual-mcp-command-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-04-06-dual-cli-setup-context-convergence-implementation-plan.md`
- `docs/audits/2026-04-07-dual-cli-implementation-plan-truth-sync.md`
- `docs/superpowers/plans/2026-04-07-dual-cli-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-07-dual-cli-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- dual-CLI host behavior

唯一目标是消除 false-open plan debt。
