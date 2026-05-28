# Kuzu Exit Strategy Body Boundary Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md`  
目标：给 historical `kuzu` dependency exit-strategy 文档的旧正文补更显式的 boundary 说明，避免保留的 `Exit Criteria`、`Current Decision` 和 reopen-trigger 语气被继续读成当前唯一 live package policy

---

## 1. 背景

[`2026-04-06-kuzu-dependency-exit-strategy.md`](/opt/claude/GitNexus/docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md)
已经明确它是 review-only 与 exact-pinning 之后的 decision follow-up，而且没有改动依赖版本。

但继续进入正文后，读者仍会直接看到：

- `Exit Criteria`
- `Current Decision`
- reopen-trigger 语气

这些段落仍带有强烈的当前决策与执行规则口吻。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部状态说明，
直接把这份 2026-04-06 exit-strategy baseline 的旧条件与 reopen rule 读成当前唯一的 live package policy。

因此 residual 不在 `kuzu` exit-strategy 结论本身，而在 historical follow-up 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-06-kuzu-dependency-exit-strategy.md](/opt/claude/GitNexus/docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md)
  - 当前 follow-up baseline 已存在，但正文入口前还缺少单独 boundary note
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 dependency-governance follow-up entrypoint
- [2026-04-06-kuzu-dependency-review.md](/opt/claude/GitNexus/docs/audits/2026-04-06-kuzu-dependency-review.md)
  - 前一层 review-only baseline，帮助限定本轮不重开 review 结论

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在文档顶部补一条 historical decision note，覆盖 preserved exit-strategy body
- 在 `Exit Criteria` 入口前补一条 note，说明这些条件只是 2026-04-06 tracked-exception baseline 的 exit conditions
- 在 `Current Decision` 入口前补一条 note，说明当前 live package-policy reading 仍应结合路线图和后续 dependency change
- 在路线图与 OpenSpec 中登记这条 kuzu exit-strategy boundary sync

本轮不改：

- 任何依赖版本
- 任何 exit criteria 内容
- `gitnexus/**`
- `gitnexus-web/**`

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 2026-04-06 exit-strategy 结论
- 不新增新的依赖替代方案
- 只让读者更难把旧 exit criteria / reopen-trigger 语气误读成当前唯一 live package policy

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-kuzu-exit-strategy-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-kuzu-exit-strategy-body-boundary-sync`
  - 返回 `Change '2026-04-15-kuzu-exit-strategy-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 `kuzu` exit-strategy historical-boundary 切片
- `changed_count = 2` 对应的是本轮被索引识别到的两个已修改文档文件，而不是代码路径扩散
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 historical `kuzu` exit-strategy 文档旧正文边界不够显式的问题，
不是新的依赖变更或替代决策。

修完后，读者会更清楚地知道：

- `Exit Criteria` 属于 2026-04-06 dependency-governance baseline 的 exit conditions
- `Current Decision` 与 reopen-trigger 只是当时 follow-up 时点的决策语气，不应脱离后续路线图和未来 dependency change 记录单独解读
