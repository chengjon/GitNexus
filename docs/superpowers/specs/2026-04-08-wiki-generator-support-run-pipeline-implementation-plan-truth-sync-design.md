# Wiki Generator Support And Run Pipeline Implementation Plan Truth Sync Design

日期：2026-04-08  
类型：doc-only truth-sync  
范围：historical `wiki-generator-support-run-pipeline` implementation plan

---

## 1. 问题定义

`2026-03-27-wiki-generator-support-run-pipeline-implementation-plan.md` 仍保留
全量未勾选执行步骤，而当前主仓已经存在 support-helper 与 run-pipeline 抽取模块、
对应测试、以及 `generator.ts` 的实际导入锚点。

原始设计文档也仍写成 `Draft for review`，继续放大了这条历史 worktree 叙事。

---

## 2. 设计选择

这条切片早于当前 OpenSpec 落地主线，因此本轮 truth source 采用：

- historical design / review docs
- `2026-03-28` 技术债审计
- 已更新路线图
- 当前仓内 wiki source / test anchors

本轮不重开原始 support-helper 或 run-pipeline 实现，只把历史文档同步到 merged
reality。

---

## 3. 目标文件

- `docs/superpowers/plans/2026-03-27-wiki-generator-support-run-pipeline-implementation-plan.md`
- `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design.md`
- `docs/audits/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/core/wiki/**`
- `gitnexus/test/unit/**`

唯一目标是消除 historical implementation plan / design 的 false-open 状态。
