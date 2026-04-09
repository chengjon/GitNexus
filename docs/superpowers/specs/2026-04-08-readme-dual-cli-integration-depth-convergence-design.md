# README Dual CLI Integration Depth Convergence Design

日期：2026-04-08  
类型：doc-only wording convergence  
范围：`README.md`、`gitnexus/README.md`

---

## 1. 问题定义

shared README 已经明确把 `Claude Code + Codex` 放在同一个 primary
maintained CLI surface 上，但支持矩阵和 manual setup 仍残留
`Support` / `Full` / `full support` 这类 support-tier 词汇。

因此 residual 不在 dual-CLI framing 结论本身，而在 README 细粒度标签没有完全跟上。

---

## 2. 设计选择

本轮 truth source 采用：

- 当前 root README 与 package README
- 已完成的 README primary dual-CLI framing convergence
- 已完成的 quick-start dual-CLI label parity convergence
- 当前 remediation roadmap

本轮只修表头、profile label、clarifying note 和 manual setup heading，
不改命令内容，不改 host capability 表。

---

## 3. 目标文件

- `README.md`
- `gitnexus/README.md`
- `docs/audits/2026-04-08-readme-dual-cli-integration-depth-convergence.md`
- `docs/superpowers/specs/2026-04-08-readme-dual-cli-integration-depth-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-readme-dual-cli-integration-depth-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-readme-dual-cli-integration-depth-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- CLI / MCP 命令示例
- runtime 集成行为

唯一目标是让 shared README 的更细粒度标签继续对齐当前 dual-CLI 主支持面治理结论。
