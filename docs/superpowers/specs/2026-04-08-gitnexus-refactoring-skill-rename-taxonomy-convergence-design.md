# GitNexus Refactoring Skill Rename Taxonomy Convergence Design

日期：2026-04-08
类型：doc-only refactoring skill convergence
范围：`gitnexus-refactoring` skill 文档

---

## 1. 问题定义

`gitnexus-refactoring` skill 当前仍把 rename preview 的低置信度编辑写成
`ast_search`，而当前 rename 契约已经使用 `text_search`。

因此 residual 不在重构工具本身，而在技能文档没有同步当前 rename taxonomy。

---

## 2. 设计选择

本轮 truth source 采用：

- 当前 source skill 与 package skill
- 当前 rename taxonomy 契约

本轮只修 skill 文案，不改任何运行时逻辑。

---

## 3. 目标文件

- `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`
- `gitnexus/skills/gitnexus-refactoring.md`
- `docs/audits/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence.md`
- `docs/superpowers/specs/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 `gitnexus_rename` runtime behavior

唯一目标是让 refactoring skill 的 rename taxonomy wording 重新对齐当前契约。
