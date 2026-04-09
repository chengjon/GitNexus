# README MCP Prompt Host Boundary Convergence Design

日期：2026-04-08
类型：doc-only prompt-host boundary convergence
范围：`README.md`

---

## 1. 问题定义

根 README 已经在 host framing 上明确当前仓库主支持面是
`Claude Code + Codex`。但 MCP prompt 段仍只给出 Claude Code 的
`@gitnexus ...` 示例，没有补一句 host-specific boundary。

因此 residual 不在 prompt 功能，而在 README 入口层对 host-specific prompt UX
的边界表达不够完整。

---

## 2. 设计选择

本轮 truth source 采用：

- dual-CLI primary-support conclusion
- shared README host-framing convergence
- 刚完成的 skills suggestion prompt-host convergence
- 当前 `README.md`

本轮只修 README 文案边界，不改任何 host 行为或 prompt runtime。

---

## 3. 目标文件

- `README.md`
- `docs/audits/2026-04-08-readme-mcp-prompt-host-boundary-convergence.md`
- `docs/superpowers/specs/2026-04-08-readme-mcp-prompt-host-boundary-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-readme-mcp-prompt-host-boundary-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-readme-mcp-prompt-host-boundary-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `gitnexus/README.md`
- 任何 host prompt runtime

唯一目标是让根 README 的 prompt 示例与当前 dual-CLI support framing 保持一致。
