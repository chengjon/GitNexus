# MCP Per-Repo Worker Isolation Implementation Plan Truth Sync Design

日期：2026-04-08
类型：doc-only truth-sync
范围：historical `mcp-per-repo-worker-isolation` implementation/design docs

---

## 1. 问题定义

当前 MCP router + per-repo worker 架构已经落地，但相关历史文档仍保留旧叙事：

- implementation plan 仍全量未勾选
- isolation design 仍写成 proposed replacement
- SIGUSR1 alternative 仍写成 current single-process baseline

问题不是实现未完成，而是 historical plan / design / status 没有跟上 merged
reality。

---

## 2. 设计选择

本轮 truth source 采用：

- 当前仓内 router/worker source/test anchors
- 后续 archived `mcp-process-management` OpenSpec 文档
- 已更新路线图

本轮不重开原始 MCP router/worker 实现，只把历史文档同步到 landed reality。

---

## 3. 目标文件

- `docs/superpowers/plans/2026-04-04-mcp-per-repo-worker-isolation-implementation-plan.md`
- `docs/mcp-per-repo-worker-isolation-design.md`
- `docs/sigusr1-cooperative-release-design.md`
- `docs/audits/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/mcp/**`
- `gitnexus/test/**`
- 任何 router/worker runtime 行为

唯一目标是消除 router/worker 历史计划与状态文档的 false-open / stale-status。
