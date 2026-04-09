# Wiki Generator Full Generation Review Truth Sync Design

日期：2026-04-08
类型：doc-only review truth-sync
范围：historical `wiki-generator-full-generation` review artifact

---

## 1. 问题定义

`2026-03-28-wiki-generator-full-generation-review.md` 仍把 review 结论写成
“before implementation” blocker，但当前主仓已经存在
`full-generation.ts`、`generator.ts` 的 wrapper/helper 边界，并且同日技术债审计
已经记录 `failedModules` review finding 在 landed code 中被修复。

因此当前 residual 不在实现，而在 review artifact 状态漂移。

---

## 2. 设计选择

本轮 truth source 采用：

- historical review doc
- `2026-03-28` technical-debt audit
- 已更新路线图
- 当前仓内 `full-generation.ts` / `generator.ts` 实现锚点

本轮不重开 full-generation 实现，只把 review artifact 同步到 merged reality。

---

## 3. 目标文件

- `docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md`
- `docs/audits/2026-04-08-wiki-generator-full-generation-review-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-wiki-generator-full-generation-review-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-wiki-generator-full-generation-review-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-wiki-generator-full-generation-review-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/core/wiki/**`
- `gitnexus/test/unit/**`

唯一目标是消除 historical review 文档的 stale blocker 叙事。
