# Repo Technical Debt Audit Broader Status Sync

日期：2026-04-08
范围：`docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md` 的 broader stale-doc / repair-order 后续状态同步
目标：保留 2026-04-06 仓库级基线审计的历史价值，同时避免它继续把已部分收敛的 stale-doc repair order 表述成当前原封不动的 backlog

---

## 1. 背景

`2026-04-06-repo-technical-debt-and-residual-audit.md` 已经通过
[2026-04-08-repo-technical-debt-audit-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md)
补过 Finding 3 的主支持宿主状态同步。

但它还有另一类容易被误读的内容：

- Finding 2 仍把 stale technical-debt / roadmap docs 视为一个整体未收敛问题
- Recommended Repair Order 仍把 “Refresh stale debt and roadmap docs” 写成第 1 条完整待办
- Output Mapping 仍只指向 2026-04-06 那一波 repo-hygiene change，而没有指向后续
  2026-04-08 的多条 truth-sync 落地记录

这些表述在 2026-04-06 的 baseline 时点是成立的，但在今天已经不够完整。

---

## 2. 后续事实源

当前与这类 stale-doc / repair-order 直接相关的后续事实源包括：

- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
- 多条 2026-04-08 implementation-plan truth-sync records
  - local-backend
  - detect-changes-worktree
  - parse-worker
  - wiki-generator support / incremental / module-tree / page-generation /
    overview / full-generation
- 多条 2026-04-08 review truth-sync records
  - wiki-generator full-generation review
  - wiki-generator support-run-pipeline review
- [2026-04-08-technical-debt-audit-historical-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-technical-debt-audit-historical-status-sync.md)

这些文档给出的当前可操作结论是：

- “刷新 stale debt / roadmap docs” 这条 repair direction 仍然有效
- 但它已经不再是 untouched backlog，而是已经被多条 2026-04-08 doc/governance
  convergence slices 部分执行过
- 当前主入口应是 remediation roadmap，而不是单独回看 2026-04-06 repair order

---

## 3. 本轮修复

本轮只做 bounded broader-status-sync：

- 不重写 2026-04-06 基线审计的原始 finding
- 只在 Finding 2、Recommended Repair Order、Output Mapping 附近增加后续入口
- 在技术债路线图中补一条指向，提醒读者该仓库级 baseline 审计已经有第二层 follow-up sync

这样可以同时保留：

- 2026-04-06 baseline 的历史真实性
- 当前读者对“哪些 stale-doc repair items 已经部分执行”的正确理解

---

## 4. 风险边界

本轮不改：

- TypeScript
- 测试
- OpenSpec capability 行为
- 仓库技术债 repair order 本身的历史排序

唯一目标是修正“历史 baseline repair order 被误读成当前原封不动 backlog”的治理歧义。

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-repo-technical-debt-audit-broader-status-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-repo-technical-debt-audit-broader-status-sync`
  返回 `Change '2026-04-08-repo-technical-debt-audit-broader-status-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 106`
  - `changed_count = 268`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 broader status sync 自身引入了新的代码 blast radius
- 本轮实际修改范围仍然只落在治理文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮没有新增功能，只是把 2026-04-06 仓库级审计从“只有一层宿主状态同步”推进到
“stale-doc / repair-order 也有后续入口”的更完整历史记录。
