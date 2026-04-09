# AI CLI Local Quick Start Host Framing Convergence Design

日期：2026-04-08  
类型：doc-only host-scope convergence  
范围：`docs/ai-cli-local-quick-start.md`

---

## 1. 问题定义

共享 README 与二级入口文档已经明确当前仓库的 primary maintained CLI
surface 是 `Claude Code + Codex`。但 `docs/ai-cli-local-quick-start.md`
仍停留在泛化的 AI CLI 入口表述，没有把当前本地 fork 的主支持面对外层级写清。

因此 residual 不在运行时，而在一级 quick start 文档的 host-scope drift。

---

## 2. 设计选择

本轮 truth source 采用：

- shared README host-framing convergence
- secondary entrypoint host-framing convergence
- dual-CLI host-governance conclusion
- 当前 `docs/ai-cli-local-quick-start.md`

本轮只修文档边界说明，不改 CLI 示例、运行逻辑或其他 host 集成实现。

---

## 3. 目标文件

- `docs/ai-cli-local-quick-start.md`
- `docs/audits/2026-04-08-ai-cli-local-quick-start-host-framing-convergence.md`
- `docs/superpowers/specs/2026-04-08-ai-cli-local-quick-start-host-framing-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-ai-cli-local-quick-start-host-framing-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-ai-cli-local-quick-start-host-framing-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 外部 host 的实际配置实现

唯一目标是让 AI CLI local quick start 与当前仓库的主支持面结论保持同一
framing。
