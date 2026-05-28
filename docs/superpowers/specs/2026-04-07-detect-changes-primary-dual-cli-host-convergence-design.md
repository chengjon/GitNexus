# Detect Changes Primary Dual CLI Host Convergence Design

日期：2026-04-07
类型：doc-only governance convergence
范围：`detect_changes` 外部宿主支持表述

---

## 1. 问题定义

Codex 与 Claude Code 的当前事实已经足够支撑本项目要求的双 CLI 主支持面，
但 review / roadmap / baseline audit 仍把 Cursor probe 表述成当前残留主债务。

这会把“外部宿主扩展研究”误写成“当前主仓未完成项”。

---

## 2. 设计选择

本轮只做文档治理收敛：

- 以已有 Codex 实测与 Claude Code live probe 为事实源
- 记录当前机器没有现成 Cursor CLI，可证明本轮不具备无新增环境的 Cursor probe 条件
- 把 Cursor / 其他客户端统一重分类为按需 external follow-up

---

## 3. 目标文件

- `docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md`
- `docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md`
- `docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md`
- `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `docs/superpowers/plans/2026-04-07-detect-changes-primary-dual-cli-host-convergence-implementation-plan.md`
- `openspec/changes/2026-04-07-detect-changes-primary-dual-cli-host-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 Claude Code / Codex / Cursor 运行时行为

唯一目标是消除主支持面与外部 follow-up 之间的 false-open 叙事。
