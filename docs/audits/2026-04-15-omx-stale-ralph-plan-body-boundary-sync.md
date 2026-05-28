# OMX Stale Ralph Plan Body Boundary Sync

日期：2026-04-15  
范围：`docs/superpowers/plans/2026-04-12-omx-stale-ralph-cancel-implementation-plan.md`  
目标：给 stale-Ralph implementation plan 的旧正文补更显式的 boundary 说明，避免保留的 `Goal`、`Architecture` 和未勾选任务步骤被继续读成当前 live implementation board

---

## 1. 背景

[`2026-04-12-omx-stale-ralph-cancel-implementation-plan.md`](/opt/claude/GitNexus/docs/superpowers/plans/2026-04-12-omx-stale-ralph-cancel-implementation-plan.md)
顶部已经明确它是 historical implementation plan，而且已要求读者以后续
audit/OpenSpec 作为 authoritative completion history。

但继续进入正文后，读者仍会直接看到：

- `Goal`
- `Architecture`
- `Planned File Map`
- 多组未勾选任务步骤

这些段落仍保留着很强的当前计划与当前执行队列语气。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部状态说明，
直接把这份 2026-04-12 plan baseline 的旧 task breakdown 读成当前 live implementation board。

因此 residual 不在 stale-Ralph implementation plan 结论本身，而在 historical plan 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-12-omx-stale-ralph-cancel-implementation-plan.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-04-12-omx-stale-ralph-cancel-implementation-plan.md)
  - historical implementation plan 已存在，但正文入口前还缺少单独 boundary note
- [2026-04-12-omx-stale-ralph-cancel-implementation.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md)
  - 提供同一 stale-Ralph 线的实现与验证历史上下文
- [2026-04-12-omx-stale-ralph-upstream-replay-note.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md)
  - 提供同一 stale-Ralph 线的 replay / PR 历史上下文

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 implementation plan 顶部补一条 historical implementation-plan note
- 在 `Constraints` 入口前补一条 note，说明下方未勾选任务只是 2026-04-12 planning-time task breakdown
- 在 audit 与 OpenSpec 中登记这条 stale-Ralph plan boundary sync

本轮不改：

- 任何 OMX 命令
- 任何任务步骤内容
- 任何实现或 replay 结论
- 任何 GitNexus 产品代码
- 任何外部包路径文件

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 stale-Ralph implementation plan 内容
- 不重开 OMX / implementation / replay 工作
- 只让读者更难把旧未勾选步骤误读成当前 live task board

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-omx-stale-ralph-plan-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-omx-stale-ralph-plan-body-boundary-sync`
  - 返回 `Change '2026-04-15-omx-stale-ralph-plan-body-boundary-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = low`
    - `changed_files = 5`
    - `changed_count = 0`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- staged scope review 只看到本轮预期的 stale-Ralph historical-plan boundary 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 stale-Ralph implementation plan 旧正文边界不够显式的问题，
不是新的 OMX 计划或实现任务。

修完后，读者会更清楚地知道：

- `Goal` / `Architecture` 属于 2026-04-12 的 planning-time baseline
- 下方未勾选任务只是 historical plan artifacts，而不是当前默认执行队列
