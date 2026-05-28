# GitNexus Web Build Boundary Body Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md`  
目标：给 `gitnexus-web` build-boundary 修复审计的旧正文补更显式的 boundary 说明，避免保留的 `Problem` / `Fix` / `Verification` / `Residual Notes` 被继续读成当前 live blocker 或当前待修构建问题

---

## 1. 背景

[`2026-04-06-gitnexus-web-build-boundary-fix.md`](/opt/claude/GitNexus/docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md)
顶部已经明确这条切片是：

- fixed and verified in the current repo
- 一次已完成的 build-boundary 修复

但继续进入正文后，读者仍会直接看到：

- `Problem`
- `Fix`
- `Verification`
- `Residual Notes`

这些段落仍保留着较强的当前故障与当前后续事项语气。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部状态说明，
直接把这份 2026-04-06 fixed baseline 的旧问题描述和 residual wording 读成当前 live blocker 或当前待修构建问题。

因此 residual 不在 build-boundary 结论本身，而在 historical fix 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-06-gitnexus-web-build-boundary-fix.md](/opt/claude/GitNexus/docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md)
  - fixed-and-verified baseline 已存在，但正文入口前还缺少单独 boundary note
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 frontend debt / follow-up entrypoint
- `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/`
  - 原始 fixed slice 的 OpenSpec truth source

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在文档顶部补一条 historical fix note，覆盖 preserved build-fix body
- 在 `Residual Notes` 入口前补一条 note，说明这些后续项只是 2026-04-06 post-fix posture
- 在路线图与 OpenSpec 中登记这条 `gitnexus-web` build-boundary body sync

本轮不改：

- 任何 `gitnexus-web/**` 构建文件
- 任何构建结论
- 任何产品代码

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 build-boundary 修复结论
- 不重开前端构建修复工作
- 只让读者更难把旧问题描述和 residual wording 误读成当前 live blocker

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-gitnexus-web-build-boundary-body-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-gitnexus-web-build-boundary-body-sync`
  - 返回 `Change '2026-04-15-gitnexus-web-build-boundary-body-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = low`
    - `changed_files = 6`
    - `changed_count = 2`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- staged scope review 只看到本轮预期的 `gitnexus-web` build-boundary historical-body 切片
- `changed_count = 2` 对应的是本轮被索引识别到的目标 audit 与路线图文档变更，而不是代码路径扩散
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 `gitnexus-web` build-boundary 修复审计旧正文边界不够显式的问题，
不是新的前端构建修复任务。

修完后，读者会更清楚地知道：

- `Problem` / `Fix` / `Verification` 属于 2026-04-06 fixed-and-verified baseline
- `Residual Notes` 只是当时的 post-fix follow-up posture，而不是当前仍未解决的 build blocker
