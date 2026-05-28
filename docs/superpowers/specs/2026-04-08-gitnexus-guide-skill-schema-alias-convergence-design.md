# GitNexus Guide Skill Schema Alias Convergence Design

日期：2026-04-08
类型：doc-only guide skill convergence
范围：`gitnexus-guide` skill 文档

---

## 1. 问题定义

`gitnexus-guide` skill 当前仍缺少：

- `search` → `query`
- `explore` → `context`
- 较新的 schema 摘要节点/边类型

因此 residual 不在 GitNexus 工具本身，而在入口型技能文档没有同步当前工具与 schema 契约。

---

## 2. 设计选择

本轮 truth source 采用：

- 当前 source skill 与 package skill
- 既有技能审核报告中对 guide skill 的 drift 记录
- 当前 GitNexus 工具与 schema 契约

本轮只修 skill 文案，不改任何运行时逻辑。

---

## 3. 目标文件

- `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`
- `gitnexus/skills/gitnexus-guide.md`
- `docs/audits/2026-04-08-gitnexus-guide-skill-schema-alias-convergence.md`
- `docs/superpowers/specs/2026-04-08-gitnexus-guide-skill-schema-alias-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-gitnexus-guide-skill-schema-alias-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-gitnexus-guide-skill-schema-alias-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 MCP runtime / graph build behavior

唯一目标是让 `gitnexus-guide` 的 alias/schema 摘要重新对齐当前契约。
