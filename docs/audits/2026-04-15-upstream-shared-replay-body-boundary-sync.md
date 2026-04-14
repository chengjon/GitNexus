# Upstream Shared Replay Body Boundary Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`  
目标：给 upstream shared-doc replay 基线审计的旧正文补更显式的 historical-boundary 说明，避免保留的 replay counts 与“right now”口吻继续被读成当前 live baseline

---

## 1. 背景

[`2026-04-06-upstream-shared-doc-replay-review.md`](/opt/claude/GitNexus/docs/audits/2026-04-06-upstream-shared-doc-replay-review.md)
顶部已经有一条 2026-04-08 的 follow-up sync，说明 live shared replay baseline
后来已经继续移动。

但继续往下读时，页面仍会直接看到：

- `Refresh Summary`
- `High-Level Decision`
- `Evidence Review`

这些 2026-04-06 refreshed-fetch baseline 内容，而且其中仍有
“right now” / “live baseline” 语气与旧 replay counts。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部 sync，
直接把下方旧数字和旧 cut line 读成当前结论。

因此 residual 不在 replay 结论本身，而在旧正文边界不够显式。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-06-upstream-shared-doc-replay-review.md](/opt/claude/GitNexus/docs/audits/2026-04-06-upstream-shared-doc-replay-review.md)
  - 顶部已有 2026-04-08 follow-up 指针，但旧正文入口前缺少单独 boundary note
- [2026-04-08-upstream-shared-doc-replay-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-upstream-shared-doc-replay-status-sync.md)
  - 已把 live replay baseline 继续更新到更晚的 fetch 结果
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 stale-doc / replay follow-up entrypoint 之一

---

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 `Refresh Summary` 入口前补一条 historical baseline note
- 在 `High-Level Decision` 入口前补一条 note，说明当前 live baseline 应以后续 follow-up 为准
- 在路线图与 OpenSpec 中登记这条 upstream shared replay boundary sync

本轮不改：

- 任何 replay 结论
- 任何 divergence counts
- `gitnexus/src/**`
- `gitnexus/test/**`

---

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 2026-04-06 refreshed-fetch review 内容
- 不新增新的 replay 结论
- 只让读者更难把旧 replay baseline 误读成当前 live baseline

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-upstream-shared-replay-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-upstream-shared-replay-body-boundary-sync`
  - 返回 `Change '2026-04-15-upstream-shared-replay-body-boundary-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = low`
    - `changed_files = 6`
    - `changed_count = 0`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- staged scope review 只看到本轮预期的 upstream shared replay historical-boundary 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是 upstream shared replay 基线审计旧正文边界不够显式的问题，
不是新的 replay 或代码缺陷。

修完后，读者会更清楚地知道：

- `Refresh Summary` / `High-Level Decision` 属于 2026-04-06 refreshed-fetch baseline
- 当前 live replay baseline 应优先参考 2026-04-08 follow-up record
