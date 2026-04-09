# Quick Start Dual CLI Label Parity Convergence Design

日期：2026-04-08
类型：doc-only host-label convergence
范围：`docs/gitnexus-quick-start-guide.md`

---

## 1. 问题定义

`docs/gitnexus-quick-start-guide.md` 已声明 `Claude Code + Codex` 是双 CLI 主支持面，
但配置段里 `Claude Code（完整支持）` 的单边标签仍可能让读者误读支持层级。

因此 residual 不在 host framing 总体结论，而在 secondary entrypoint 文案细节没有完全跟上。

---

## 2. 设计选择

本轮 truth source 采用：

- 当前 quick-start guide
- 已完成的 secondary-entrypoint host-framing convergence
- 当前 remediation roadmap

本轮只修标签和一句 clarifying note，不改命令内容或支持矩阵。

---

## 3. 目标文件

- `docs/gitnexus-quick-start-guide.md`
- `docs/audits/2026-04-08-quick-start-dual-cli-label-parity-convergence.md`
- `docs/superpowers/specs/2026-04-08-quick-start-dual-cli-label-parity-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-quick-start-dual-cli-label-parity-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-quick-start-dual-cli-label-parity-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 命令示例与 host runtime 行为

唯一目标是让 quick-start guide 的标题标签重新对齐当前双 CLI 主支持面。
