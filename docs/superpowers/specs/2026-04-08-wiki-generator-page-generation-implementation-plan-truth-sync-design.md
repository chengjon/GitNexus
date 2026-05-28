# Wiki Generator Page Generation Implementation Plan Truth Sync Design

日期：2026-04-08
类型：doc-only truth-sync
范围：historical `wiki-generator-page-generation` implementation plan

---

## 1. 问题定义

`2026-03-26-wiki-generator-page-generation-implementation-plan.md` 仍保留全量未勾选
执行步骤，而当前主仓已经存在 `pages/leaf-page.ts`、`pages/parent-page.ts`、
`wiki-page-generation.test.ts`，以及 `generator.ts` 上的真实导入锚点。

原始设计文档也仍写成 `Draft for review`，继续放大了这条历史计划叙事。

---

## 2. 设计选择

这条切片早于当前 OpenSpec 落地主线，因此本轮 truth source 采用：

- historical design docs
- 已更新路线图
- 当前仓内 wiki source / test anchors

本轮不重开原始 page-generation 实现，只把历史文档同步到 merged reality。

---

## 3. 目标文件

- `docs/superpowers/plans/2026-03-26-wiki-generator-page-generation-implementation-plan.md`
- `docs/superpowers/specs/2026-03-26-wiki-generator-page-generation-design.md`
- `docs/audits/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/core/wiki/**`
- `gitnexus/test/unit/**`

唯一目标是消除 historical implementation plan / design 的 false-open 状态。
