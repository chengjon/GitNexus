# README Primary Dual CLI Framing Convergence Design

日期：2026-04-08
类型：doc-only README convergence
范围：shared README host-support framing

---

## 1. 问题定义

当前仓内治理文档已经明确，项目要求的 primary maintained CLI surface 是
`Claude Code + Codex`。但根 `README.md` 与 `gitnexus/README.md` 仍把这些
host 与 Cursor / Windsurf / OpenCode 并列成同层叙事，缺少“主支持面”和
“可选集成面”的分层。

因此 residual 不在运行时，而在 entry docs 的 support-surface framing drift。

---

## 2. 设计选择

本轮 truth source 采用：

- 已收敛的 dual-CLI host governance audit
- 技术债路线图中的 primary support-surface 结论
- 当前 `README.md` 与 `gitnexus/README.md`

本轮不删除其他 host 的 MCP 配置示例，只补上 framing：

- 先明确 primary maintained pair
- 再保留 optional MCP integrations

---

## 3. 目标文件

- `README.md`
- `gitnexus/README.md`
- `docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md`
- `docs/superpowers/specs/2026-04-08-readme-primary-dual-cli-framing-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-readme-primary-dual-cli-framing-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-readme-primary-dual-cli-framing-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- host-adapter / setup / doctor 行为

唯一目标是让 shared README 对主支持面与可选 host 的层级表达和当前治理结论一致。
