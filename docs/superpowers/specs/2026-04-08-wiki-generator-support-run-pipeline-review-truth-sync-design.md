# Wiki Generator Support-Run-Pipeline Review Truth Sync Design

日期：2026-04-08
类型：doc-only review truth-sync
范围：historical `wiki-generator-support-run-pipeline` review artifact

---

## 1. 问题定义

`2026-03-27-wiki-generator-support-run-pipeline-design-review.md` 仍把 review
结论写成“修复问题后即可进入实现阶段”，但当前主仓已经存在
`generator-support.ts`、`run-pipeline.ts` 及其 focused tests，相关设计文档与路线图
也都已经收敛为 landed reality。

因此当前 residual 不在实现，而在 review artifact 状态漂移。

---

## 2. 设计选择

本轮 truth source 采用：

- historical review doc
- truth-synced historical design doc
- 已更新路线图
- 当前仓内 `generator-support.ts` / `run-pipeline.ts` 及对应 test anchors

本轮不重开 support/run-pipeline 实现，只把 review artifact 同步到 merged reality。

---

## 3. 目标文件

- `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
- `docs/audits/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/core/wiki/**`
- `gitnexus/test/unit/**`

唯一目标是消除 historical review 文档的 stale pre-implementation 叙事。
