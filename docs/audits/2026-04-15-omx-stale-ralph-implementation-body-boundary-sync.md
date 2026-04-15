# OMX Stale Ralph Implementation Body Boundary Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md`  
目标：给 stale-Ralph implementation audit 的旧正文补更显式的 boundary 说明，避免保留的 publication timeline 和 `Recommended Next Step` 被继续读成当前 live upstream handoff 或当前 GitNexus 待办

---

## 1. 背景

[`2026-04-12-omx-stale-ralph-cancel-implementation.md`](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md)
顶部已经说明这项修复是“本地已实现”，而且实现目标落在已安装的 `oh-my-codex`
包路径，不是 GitNexus 产品代码。

但继续进入正文后，读者仍会直接看到：

- `Publication Status`
- 多段 PR / fork-only stop point / review timeline
- `Recommended Next Step`

这些段落仍带有很强的 live handoff 与当前后续动作语气。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部状态说明，
直接把这份 2026-04-12 implementation audit 的旧 replay / next-step 叙事读成当前仍在推进的 GitNexus 待办或活跃 upstream handoff。

因此 residual 不在 stale-Ralph 结论本身，而在 historical implementation 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-12-omx-stale-ralph-cancel-implementation.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md)
  - 实现与验证记录已存在，但正文入口前还缺少单独 boundary note
- [2026-04-12-omx-stale-ralph-upstream-replay-note.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md)
  - 已承接 upstream replay / PR timeline / replay strategy 这类后续上下文
- [docs/audits/README.md](/opt/claude/GitNexus/docs/audits/README.md)
  - 当前 audits 入口，需要更明确地把这份 OMX implementation audit 标成历史实现记录

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 implementation audit 顶部补一条 historical implementation note
- 在 `Publication Status` 入口前补一条 note，说明 replay / PR timeline 只是 2026-04-12 publication state
- 在 `Recommended Next Step` 入口前补一条 note，说明它只是 historical follow-up posture
- 在 audits 入口与 OpenSpec 中登记这条 OMX stale-Ralph implementation boundary sync

本轮不改：

- 任何 OMX 命令
- 任何 GitNexus 产品代码
- 任何外部包路径文件

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 stale-Ralph 实现或验证结论
- 不重开 OMX / upstream replay 工作
- 只让读者更难把旧 replay / next-step 叙事误读成当前 live handoff 或当前 GitNexus 待办

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-omx-stale-ralph-implementation-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-omx-stale-ralph-implementation-body-boundary-sync`
  - 返回 `Change '2026-04-15-omx-stale-ralph-implementation-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 OMX stale-Ralph implementation historical-boundary 切片
- `changed_count = 1` 对应的是本轮被索引识别到的 audits entrypoint 文档变更，而不是代码路径扩散
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 stale-Ralph implementation audit 旧正文边界不够显式的问题，
不是新的 OMX 实现任务。

修完后，读者会更清楚地知道：

- `Publication Status` 只是 2026-04-12 的历史 publication snapshot
- `Recommended Next Step` 只是当时的 historical follow-up posture，不是当前 GitNexus 默认待办
