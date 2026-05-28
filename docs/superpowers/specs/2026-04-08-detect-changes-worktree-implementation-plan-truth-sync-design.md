# Detect Changes Worktree Implementation Plan Truth Sync Design

日期：2026-04-08
类型：doc-only truth-sync
范围：pre-OpenSpec `detect_changes` worktree resolution implementation plan

---

## 1. 问题定义

`2026-03-25-detect-changes-worktree-resolution-implementation-plan.md`
仍保留全量未勾选步骤，但 design / review / roadmap 与当前仓内实现都已表明
该切片早已落地。

问题不是实现未完成，而是 historical plan state 没有跟上 merged reality。

---

## 2. 设计选择

这条切片早于当前 OpenSpec 账本，因此本轮 truth source 采用：

- 已 truth-sync 的 historical design doc
- 已 truth-sync 的 historical review doc
- 已更新路线图
- 当前仓内 detect_changes worktree 实现与测试锚点

本轮不伪造旧 ledger，也不重开原始 `detect_changes` worktree 修复切片。

---

## 3. 目标文件

- `docs/superpowers/plans/2026-03-25-detect-changes-worktree-resolution-implementation-plan.md`
- `docs/audits/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/storage/git.ts`
- `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- `gitnexus/test/**`
- 任何 `detect_changes` / host guidance / metadata 合同

唯一目标是消除这份 pre-OpenSpec 历史 implementation plan 的 false-open 状态。
