# OMX Stale Ralph Upstream Replay Body Boundary Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md`  
目标：给 stale-Ralph upstream replay note 的旧正文补更显式的 boundary 说明，避免保留的 replay strategy、checklist 和 PR timeline 被继续读成当前 live upstream handoff 或当前 GitNexus 执行队列

---

## 1. 背景

[`2026-04-12-omx-stale-ralph-upstream-replay-note.md`](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md)
已经说明它的目的，是解释如何把本地已验证的 `omx cancel ralph --stale`
实现回放到 canonical `oh-my-codex` 源仓。

但继续进入正文后，读者仍会直接看到：

- `Upstream Source Replay Status`
- `Replay Strategy`
- `Minimum Replay Checklist`
- `Verification Commands To Reuse`

这些段落仍带有很强的当前 replay / handoff / 执行清单语气。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部用途说明，
直接把这份 2026-04-12 replay note 的旧 PR timeline 和 replay checklist 读成当前仍在推进的 live upstream handoff 或当前 GitNexus 默认执行队列。

因此 residual 不在 stale-Ralph replay 结论本身，而在 historical replay 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-12-omx-stale-ralph-upstream-replay-note.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md)
  - replay note 已存在，但正文入口前还缺少单独 boundary note
- [2026-04-12-omx-stale-ralph-cancel-implementation.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md)
  - 提供同一 stale-Ralph 线的实现与验证历史上下文
- [docs/audits/README.md](/opt/claude/GitNexus/docs/audits/README.md)
  - 当前 audits 入口，需要更明确地把这份 replay note 标成历史 replay 记录

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 replay note 顶部补一条 historical replay note
- 在 `Upstream Source Replay Status` 入口前补一条 note，说明它只是 2026-04-12 publication snapshot
- 在 `Replay Strategy` 入口前补一条 note，说明 replay strategy / checklist 只是 historical replay guidance
- 在 audits 入口与 OpenSpec 中登记这条 stale-Ralph replay boundary sync

本轮不改：

- 任何 OMX 命令
- 任何 replay 结论
- 任何 GitNexus 产品代码
- 任何外部包路径文件

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 stale-Ralph replay note 内容
- 不重开 OMX / upstream replay 工作
- 只让读者更难把旧 replay strategy / checklist / PR timeline 误读成当前 live handoff 或当前 GitNexus 默认执行队列

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-omx-stale-ralph-upstream-replay-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-omx-stale-ralph-upstream-replay-body-boundary-sync`
  - 返回 `Change '2026-04-15-omx-stale-ralph-upstream-replay-body-boundary-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = low`
    - `changed_files = 6`
    - `changed_count = 1`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- staged scope review 只看到本轮预期的 stale-Ralph upstream-replay historical-boundary 切片
- `changed_count = 1` 对应的是本轮被索引识别到的 audits entrypoint 文档变更，而不是代码路径扩散
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 stale-Ralph upstream replay note 旧正文边界不够显式的问题，
不是新的 OMX replay 任务。

修完后，读者会更清楚地知道：

- `Upstream Source Replay Status` 只是 2026-04-12 的历史 publication snapshot
- `Replay Strategy` / `Minimum Replay Checklist` 只是 historical replay guidance，而不是当前默认执行队列
