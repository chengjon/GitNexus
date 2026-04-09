# MCP Process Management Implementation Plan Truth Sync Design

日期：2026-04-08  
类型：doc-only truth-sync  
范围：historical `mcp-process-management` implementation plan

---

## 1. 问题定义

`2026-04-05-mcp-process-management-implementation-plan.md` 仍残留两条未勾选的
环境相关说明，而 archived OpenSpec change 与当前源码 / 测试都已表明该切片早已
落地。

另外，原始设计文档仍保留 `Draft for review` 状态，也会继续放大这种 stale
叙事。

---

## 2. 设计选择

这条切片已经有 archived OpenSpec 账本，因此本轮 truth source 采用：

- archived OpenSpec tasks / design / proposal
- historical design / review docs
- 已更新路线图
- 当前仓内 runtime / CLI / test anchors

本轮不重开原始 `mcp-process-management` 实现，只把历史文档同步到 merged reality。

---

## 3. 目标文件

- `docs/superpowers/plans/2026-04-05-mcp-process-management-implementation-plan.md`
- `docs/superpowers/specs/2026-04-05-mcp-process-management-design.md`
- `docs/audits/2026-04-08-mcp-process-management-implementation-plan-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-mcp-process-management-implementation-plan-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-mcp-process-management-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-mcp-process-management-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/runtime/**`
- `gitnexus/src/cli/**`
- `gitnexus/src/mcp/**`
- `gitnexus/test/**`

唯一目标是消除 historical implementation plan / design 的 false-open 状态。
