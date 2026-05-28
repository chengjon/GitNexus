# Repo Hygiene Implementation Plan Truth Sync Design

日期：2026-04-07
类型：doc-only truth-sync
范围：`2026-04-06-repo-hygiene-doc-convergence-implementation-plan.md`

---

## 1. 问题定义

`repo-hygiene-doc-convergence` 的 OpenSpec task ledger 已全部完成，但对应
implementation plan 仍保留三个未勾选 commit steps。

这不是执行缺失，而是 plan 粒度状态没有随着已落地仓内事实一起收敛。

---

## 2. 设计选择

本轮不重做旧切片，只同步状态：

- 以 `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md`
  作为完成状态事实源
- 在 implementation plan 中补执行状态说明
- 回填遗留的未勾选历史步骤

---

## 3. 风险边界

本轮不触及：

- `gitnexus-web/src/**`
- `gitnexus/package*.json`
- `gitnexus-web/package*.json`
- 任何运行时代码

唯一目标是消除一条 false-open plan debt。
