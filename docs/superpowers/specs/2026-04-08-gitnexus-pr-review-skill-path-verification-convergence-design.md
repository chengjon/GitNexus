# GitNexus PR Review Skill Path Verification Convergence Design

日期：2026-04-08  
类型：doc-only skill source/package convergence  
范围：`gitnexus-pr-review` skill 文档

---

## 1. 问题定义

`gitnexus-pr-review` 的 source skill 已经明确包含：

- worktree 场景下传 `cwd` 后继续检查 `path_resolution`
- review dimensions 中的 `Path verification`

但 package skill 副本缺了这两处 wording。

因此 residual 不在 PR review 功能，而在同一技能的 source/package 文档面没有保持同步。

---

## 2. 设计选择

本轮 truth source 采用：

- 当前 source skill
- 当前 package skill
- 已完成的 pr-review detect-changes guidance convergence 审计

本轮只修 skill 文案，不改任何运行时逻辑。

---

## 3. 目标文件

- `gitnexus/skills/gitnexus-pr-review.md`
- `docs/audits/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence.md`
- `docs/superpowers/specs/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 PR review runtime / MCP behavior

唯一目标是让 package skill 重新对齐 source skill 的 path-verification guidance。
