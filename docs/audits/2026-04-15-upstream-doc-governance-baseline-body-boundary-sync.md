# Upstream Doc Governance Baseline Body Boundary Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`  
目标：给 upstream doc/governance convergence baseline 的旧正文补更显式的 historical-boundary 说明，避免保留的 `Refresh Summary`、热点清单和 `Recommended Replay Order` 被继续读成当前 live replay baseline

---

## 1. 背景

[`2026-04-06-upstream-doc-governance-convergence-baseline.md`](/opt/claude/GitNexus/docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md)
顶部已经说明：

- 这是 2026-04-06 第一次 refreshed-fetch convergence pass
- 当天稍后已有新的 shared replay decision
- 2026-04-08 又有更新后的 replay baseline

但继续进入正文后，读者仍会直接看到：

- `Refresh Summary`
- shared/local inventory 与 convergence rules
- `Recommended Replay Order`

这些段落里仍保留着 “current replay baseline” 和操作顺序语气。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部 status note，
直接把这份 first-pass baseline 的旧 cut line 和旧顺序读成当前 live checklist。

因此 residual 不在 convergence 结论本身，而在 historical baseline 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-06-upstream-doc-governance-convergence-baseline.md](/opt/claude/GitNexus/docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md)
  - 顶部已有 later replay pointer，但正文入口前还缺少单独 boundary note
- [2026-04-06-upstream-shared-doc-replay-review.md](/opt/claude/GitNexus/docs/audits/2026-04-06-upstream-shared-doc-replay-review.md)
  - 已把当天稍后的 shared replay baseline 与决策写成后续 truth source
- [2026-04-08-upstream-shared-doc-replay-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-upstream-shared-doc-replay-status-sync.md)
  - 已把 live baseline 继续更新到更晚的 fetch 结果
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 stale-doc / replay follow-up entrypoint 之一

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 `Refresh Summary` 入口前补一条 historical baseline note
- 在 `Recommended Replay Order` 入口前补一条 note，说明当前 live replay sequencing 应以后续 follow-up 为准
- 在路线图与 OpenSpec 中登记这条 upstream doc/governance baseline boundary sync

本轮不改：

- 任何 divergence counts
- 任何 inventory / reconcile 结论
- `gitnexus/src/**`
- `gitnexus/test/**`

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 2026-04-06 first-pass convergence baseline 内容
- 不新增新的 replay 结论
- 只让读者更难把旧 same-day baseline 误读成当前 live replay checklist

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-upstream-doc-governance-baseline-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-upstream-doc-governance-baseline-body-boundary-sync`
  - 返回 `Change '2026-04-15-upstream-doc-governance-baseline-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 upstream doc/governance baseline historical-boundary 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 upstream doc/governance first-pass baseline 正文边界不够显式的问题，
不是新的 replay 或代码缺陷。

修完后，读者会更清楚地知道：

- `Refresh Summary`、inventory、convergence rules 属于 2026-04-06 first refreshed-fetch baseline
- `Recommended Replay Order` 只是同日 baseline 时点的顺序建议，而不是当前 live checklist
