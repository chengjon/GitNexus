# Secondary Entrypoint Host Framing Convergence Design

日期：2026-04-08  
类型：doc-only host-framing convergence  
范围：secondary entrypoint docs

---

## 1. 问题定义

shared README 已明确当前仓库的 primary maintained CLI surface 是
`Claude Code + Codex`。但 `docs/gitnexus-quick-start-guide.md` 与
`eval/README.md` 仍保留旧的 host framing：

- quick-start guide 缺少 primary vs optional 的优先级说明
- eval harness 仍用 `Claude Code / Cursor hook integration` 这类同层类比

因此 residual 不在运行时，而在 secondary entrypoint docs 的 framing drift。

---

## 2. 设计选择

本轮 truth source 采用：

- 已收敛的 shared README host framing
- 已收敛的 dual-CLI host governance 结论
- 当前 quick-start guide 与 eval README

本轮只修表述层级，不重写具体配置步骤或评测架构说明。

---

## 3. 目标文件

- `docs/gitnexus-quick-start-guide.md`
- `eval/README.md`
- `docs/audits/2026-04-08-secondary-entrypoint-host-framing-convergence.md`
- `docs/superpowers/specs/2026-04-08-secondary-entrypoint-host-framing-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-secondary-entrypoint-host-framing-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-secondary-entrypoint-host-framing-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `eval/` 运行逻辑

唯一目标是让二级入口文档与当前主支持面结论保持同一 framing。
