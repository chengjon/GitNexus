# GitNexus CLI Skill Dual CLI Freshness Convergence Design

日期：2026-04-08
类型：doc-only dual-cli freshness convergence
范围：`gitnexus-cli` skill 文档

---

## 1. 问题定义

共享 quick-start、生成上下文和 fixture 文档已经明确：

- Claude Code 有自动 post-mutation freshness handling
- Codex 需要手动重跑 `gitnexus analyze`

但 `gitnexus-cli` skill 的 source 文档和 package skill 副本仍只有 Claude Code
自动路径。

因此 residual 不在 CLI 功能，而在 skill 文档没有同步当前 dual-CLI freshness
契约。

---

## 2. 设计选择

本轮 truth source 采用：

- dual-cli post-mutation freshness guidance 审计
- 当前 quick-start / fixture 文档中的双 CLI freshness 说明
- 当前 source skill 与 package skill 副本

本轮只修 skill 文案，不改任何运行时逻辑。

---

## 3. 目标文件

- `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
- `gitnexus/skills/gitnexus-cli.md`
- `docs/audits/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence.md`
- `docs/superpowers/specs/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 host hook/runtime

唯一目标是让 CLI skill 文档与当前双 CLI freshness 契约保持一致。
