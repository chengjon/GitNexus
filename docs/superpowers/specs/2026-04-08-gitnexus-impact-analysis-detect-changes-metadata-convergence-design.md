# GitNexus Impact Analysis Detect Changes Metadata Convergence Design

日期：2026-04-08
类型：doc-only impact-analysis skill convergence
范围：`gitnexus-impact-analysis` skill 文档

---

## 1. 问题定义

`gitnexus-impact-analysis` skill 当前只把 `repo` / `cwd` 作为 worktree guidance
写出来，但没有继续解释 `gitnexus_detect_changes` 的输出元数据。

因此 residual 不在 `detect_changes` 工具本身，而在技能文档没有把当前
path-resolution contract 解释完整。

---

## 2. 设计选择

本轮 truth source 采用：

- 当前 source skill 与 package skill
- 2026-03-26 skills review 中对 impact-analysis 的 drift 记录
- `detect_changes` worktree-resolution 设计中的元数据契约

本轮只修 skill 文案，不改任何运行时逻辑。

---

## 3. 目标文件

- `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
- `gitnexus/skills/gitnexus-impact-analysis.md`
- `docs/audits/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence.md`
- `docs/superpowers/specs/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence-design.md`
- `docs/superpowers/plans/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 `detect_changes` runtime / git path-resolution behavior

唯一目标是让 `gitnexus-impact-analysis` 的 `detect_changes` guidance
重新对齐当前元数据契约。
