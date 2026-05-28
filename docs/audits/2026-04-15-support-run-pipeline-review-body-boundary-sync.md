# Support-Run-Pipeline Review Body Boundary Sync

日期：2026-04-15  
范围：`docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`  
目标：给 historical support/run-pipeline review 的旧 review 正文补更显式的 boundary 说明，避免保留的 `整体评价` / `总结` / 建议段落被读成当前 implementation gate

---

## 1. 背景

[`2026-03-27-wiki-generator-support-run-pipeline-design-review.md`](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md)
顶部已经明确：

- 这是 historical design-review record
- 下方评论不应再被读成当前 pre-implementation blockers

但继续进入正文后，读者仍会直接看到：

- `整体评价`
- 各个 `问题`
- `次要建议`
- `总结`

这些完整的 review/gate 结构。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部 status sync，
直接把保留的建议段落误读成当前 implementation gate。

因此 residual 不在 review 结论本身，而在旧 review 正文边界还不够显式。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-03-27-wiki-generator-support-run-pipeline-design-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md)
  - 顶部已有 historical framing，但 `整体评价` / `总结` 入口前还缺少单独 boundary note
- [2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync.md)
  - 已把这份 review 从“进入实现阶段前”收敛回 historical review record
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 convergence entrypoint

---

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在页首下方补一条历史 review baseline note
- 在 `总结` 入口前补一条 note，说明这些建议只是 review-time 反馈
- 在路线图与 OpenSpec 中登记这条 support/run-pipeline review boundary sync

本轮不改：

- 任何问题与建议内容
- 任何设计结论
- `gitnexus/src/**`
- `gitnexus/test/**`

---

## 4. 风险边界

这轮仍然只是历史 review 正文边界说明收敛：

- 不重写 2026-03-27 review 内容
- 不新增新的 wiki 结论
- 只让读者更难把旧 review 正文误读成当前 implementation gate

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-support-run-pipeline-review-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-support-run-pipeline-review-body-boundary-sync`
  - 返回 `Change '2026-04-15-support-run-pipeline-review-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 support/run-pipeline historical review boundary 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是 historical support/run-pipeline review 旧正文边界不够显式的问题，
不是新的代码或设计缺陷。

修完后，读者会更清楚地知道：

- `整体评价` / `总结` 属于 2026-03-27 design-review baseline
- 保留的建议只是 review-time 反馈，而不是当前 implementation gate
