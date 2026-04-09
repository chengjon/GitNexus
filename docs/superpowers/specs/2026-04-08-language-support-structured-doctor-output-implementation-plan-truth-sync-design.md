# Language Support Structured Doctor Output Implementation Plan Truth Sync Design

日期：2026-04-08
类型：doc-only truth-sync
范围：`language-support-structured-doctor-output` historical implementation plan

---

## 1. 问题定义

`2026-04-07-language-support-structured-doctor-output-implementation-plan.md`
的执行步骤已经全部完成，但计划顶部仍没有 execution-status sync note。

当前问题不是 `language-support` structured output residual 未修，而是
historical plan state 没有完整跟上真实交付状态。

---

## 2. 设计选择

本轮只做 plan truth-sync：

- 以对应 `openspec/changes/.../tasks.md` 为执行状态事实源
- implementation plan 只补 execution status sync note 与治理登记
- 不重开 `doctor` / reporter / tests 本身

---

## 3. 目标文件

- `docs/superpowers/plans/2026-04-07-language-support-structured-doctor-output-implementation-plan.md`
- `docs/audits/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync.md`
- `docs/superpowers/specs/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync-design.md`
- `docs/superpowers/plans/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/cli/doctor.ts`
- `gitnexus/src/ci/language-support-report.ts`
- `gitnexus/test/**`
- `doctor` 行为

唯一目标是消除 historical implementation plan 的 false-open 状态。
