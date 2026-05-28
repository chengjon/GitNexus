# Repo Technical Debt Audit Broader Status Sync Design

日期：2026-04-08
类型：doc-only broader status sync
范围：historical `2026-04-06-repo-technical-debt-and-residual-audit.md`

---

## 1. 问题定义

仓库级 2026-04-06 基线审计虽然已经补过 Finding 3 的主支持宿主状态同步，但
Finding 2、Recommended Repair Order 与 Output Mapping 仍缺少后续入口。

结果是当前读者仍可能把 “refresh stale debt and roadmap docs” 理解成完全未执行的
repair item。

---

## 2. 设计选择

本轮 truth source 采用：

- historical 2026-04-06 repo audit
- 当前 remediation roadmap
- 已存在的 repository-level host status sync
- 2026-04-08 doc/governance truth-sync records

本轮不重写原始 finding，只补 follow-up entrypoints。

---

## 3. 目标文件

- `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
- `docs/audits/2026-04-08-repo-technical-debt-audit-broader-status-sync.md`
- `docs/superpowers/specs/2026-04-08-repo-technical-debt-audit-broader-status-sync-design.md`
- `docs/superpowers/plans/2026-04-08-repo-technical-debt-audit-broader-status-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-repo-technical-debt-audit-broader-status-sync/`

---

## 4. 风险边界

本轮不触及：

- `gitnexus/src/**`
- `gitnexus/test/**`

唯一目标是给 historical repo audit 增加更完整的后续状态入口。
