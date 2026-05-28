# Upstream Shared Doc Replay Status Sync Design

日期：2026-04-08  
类型：doc-only baseline status sync  
范围：upstream replay baseline 审计、路线图与 OpenSpec 记录

---

## 1. 问题定义

2026-04-06 的 upstream baseline / replay review 仍然有效，但它们记录的 live
fetch 基线已经落后于最新 `upstream/main`。

在当前仓库把 upstream replay 当作持续治理主题的前提下，旧基线若不继续同步，
会让后续读者用过期的分叉数字和 replay 结论判断当前窗口。

---

## 2. 设计选择

本轮 truth source 采用：

- 最新 `git fetch upstream`
- 最新 divergence count
- 最新 shared hotspot diff
- 2026-04-06 的 baseline / replay review 历史记录
- 当前本地共享文档真源

本轮只做 status sync，不重写旧审计的主体分析，也不回放 upstream wording。

---

## 3. 目标文件

- `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
- `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
- `docs/audits/2026-04-08-upstream-shared-doc-replay-status-sync.md`
- `docs/superpowers/specs/2026-04-08-upstream-shared-doc-replay-status-sync-design.md`
- `docs/superpowers/plans/2026-04-08-upstream-shared-doc-replay-status-sync-implementation-plan.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- `openspec/changes/2026-04-08-upstream-shared-doc-replay-status-sync/`

---

## 4. 风险边界

本轮不触及：

- 任何代码路径
- 共享文档正文的大块 replay
- upstream/main 的代码或产品面前向移植

唯一目标是让 upstream replay baseline 继续跟上最新 fetch 结果。
