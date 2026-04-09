# LocalBackend Implementation Plan Truth Sync Design

日期：2026-04-08  
类型：doc-only truth-sync  
范围：pre-OpenSpec `LocalBackend` handler-first implementation plan

---

## 1. 问题定义

`2026-03-24-local-backend-handler-first-implementation-plan.md` 仍保留全量未勾选步骤，
但后续 design doc、roadmap 与当前文件结构都已表明该切片早已落地。

问题不是实现未完成，而是 historical plan state 没有跟上 merged reality。

---

## 2. 设计选择

这条切片早于当前 OpenSpec 账本，因此本轮 truth source 采用：

- landed 设计文档
- 已更新路线图
- 当前仓内文件存在性

本轮不伪造旧 ledger，也不重开原始实现切片。

---

## 3. 目标文件

- `docs/superpowers/plans/2026-03-24-local-backend-handler-first-implementation-plan.md`
- `docs/audits/2026-04-08-local-backend-implementation-plan-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-local-backend-implementation-plan-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-local-backend-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-local-backend-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/mcp/local/**`
- `gitnexus/test/**`
- 任何 `LocalBackend` / handler / runtime 行为

唯一目标是消除这份 pre-OpenSpec 历史计划的 false-open 状态。

