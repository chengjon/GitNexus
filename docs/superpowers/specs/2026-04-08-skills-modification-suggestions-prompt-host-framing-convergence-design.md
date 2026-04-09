# Skills Modification Suggestions Prompt Host Framing Convergence Design

日期：2026-04-08  
类型：doc-only prompt-host framing convergence  
范围：`docs/gitnexus-skills-modification-suggestions.md`

---

## 1. 问题定义

共享 README 与近期 host-governance 文档已经明确：

- 当前仓库主维护 CLI 支持面是 `Claude Code + Codex`
- 但 host-specific UX 需要按已验证的宿主边界分别表述

`docs/gitnexus-skills-modification-suggestions.md` 的 MCP prompt 建议段目前只有
`Usage in Claude Code`，却没有解释这是 host-specific prompt syntax example。

因此 residual 不在 prompt 功能，而在建议文档的 host 边界表达不够清晰。

---

## 2. 设计选择

本轮 truth source 采用：

- dual-CLI primary-support conclusion
- shared README host-framing convergence
- 当前 README 中已显式限定为 Claude Code 的 MCP prompt 示例
- 当前 `docs/gitnexus-skills-modification-suggestions.md`

本轮只修文档边界说明，不改任何技能实现或 host 行为。

---

## 3. 目标文件

- `docs/gitnexus-skills-modification-suggestions.md`
- `docs/audits/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence.md`
- `docs/superpowers/specs/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence/`

---

## 4. 风险边界

本轮不触及：

- `.claude/skills/gitnexus/**`
- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 host prompt runtime

唯一目标是让建议文档中的 prompt 示例与当前主支持面/host-specific 边界保持一致。
