# Repo Technical Debt Audit Status Sync Design

日期：2026-04-08  
类型：doc-only governance sync  
范围：repository technical-debt baseline audit 的后续状态注记

---

## 1. 问题定义

2026-04-06 的仓库技术债审计是一份正确的历史基线，但其中关于
`detect_changes` 宿主验证未完成的 Finding 3，已经被 2026-04-07 的后续
治理部分关闭。

当前问题不是基线写错了，而是它缺少“后续状态已变化”的显式入口。

---

## 2. 设计选择

本轮保持基线文档的历史定位不变：

- 不删除原始审计结论
- 不把基线审计改写成“当前状态总览”
- 只补充 status sync 注记和后续事实源链接

---

## 3. 目标文件

- `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
- `docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md`
- `docs/superpowers/specs/2026-04-08-repo-technical-debt-audit-status-sync-design.md`
- `docs/superpowers/plans/2026-04-08-repo-technical-debt-audit-status-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`
- repo-hygiene 原始 capability 行为

唯一目标是让历史基线审计与后续治理事实之间建立清晰的时间边界。

