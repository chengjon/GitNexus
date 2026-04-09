# GitNexus CLI Skill Troubleshooting Host Convergence Design

日期：2026-04-08  
类型：doc-only troubleshooting host convergence  
范围：`gitnexus-cli` skill 文档

---

## 1. 问题定义

`gitnexus-cli` skill 已经在 analyze guidance 中明确区分：

- Claude Code 自动 freshness handling
- Codex 手动 rerun guidance

但 troubleshooting 段落仍把 stale-index 恢复动作写成单一的
`Restart Claude Code to reload the MCP server`。

因此 residual 不在 CLI 功能，而在 skill 文档没有把 stale-index 恢复动作同步到
当前双 CLI host 语境。

---

## 2. 设计选择

本轮 truth source 采用：

- 已完成的 dual-cli freshness convergence 审计
- 当前 quick-start 双 CLI freshness wording
- 当前 source skill 与 package skill 副本

本轮只修 troubleshooting 文案，不改任何运行时逻辑。

---

## 3. 目标文件

- `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
- `gitnexus/skills/gitnexus-cli.md`
- `docs/audits/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence.md`
- `docs/superpowers/specs/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 host hook/runtime

唯一目标是让 `gitnexus-cli` troubleshooting 文档与当前双 CLI host framing 保持一致。
