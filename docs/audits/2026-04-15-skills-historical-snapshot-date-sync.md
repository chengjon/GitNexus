# Skills Historical Snapshot Date Sync

日期：2026-04-15  
范围：`docs/gitnexus-skills-review.md`、`docs/gitnexus-skills-modification-suggestions.md`  
目标：把 historical skills 状态页顶部的 snapshot 日期标签同步到当前已吸收的 2026-04-15 收敛事实

---

## 1. 背景

两份 historical skills 状态页已经吸收了 2026-04-15 完成的 exploring follow-up sync，
但它们顶部仍保留：

- `Status sync (2026-04-08)`
- `Current Follow-Up Snapshot (2026-04-08)`

这会让页面在日期层面自相矛盾：顶部日期像停在 2026-04-08，但内容已经包含
2026-04-15 的 follow-up 收敛。

因此 residual 不在文档结论本身，而在顶部 snapshot 日期标签没有跟上当前事实。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [docs/gitnexus-skills-review.md](/opt/claude/GitNexus/docs/gitnexus-skills-review.md)
  - 顶部 snapshot 已吸收 `gitnexus-exploring` 收敛，但日期仍写 2026-04-08
- [docs/gitnexus-skills-modification-suggestions.md](/opt/claude/GitNexus/docs/gitnexus-skills-modification-suggestions.md)
  - 顶部 snapshot 同样已吸收 `gitnexus-exploring` 收敛，但日期仍写 2026-04-08
- [2026-04-15-gitnexus-skills-review-exploring-follow-up-sync 审计](/opt/claude/GitNexus/docs/audits/2026-04-15-gitnexus-skills-review-exploring-follow-up-sync.md)
- [2026-04-15-gitnexus-skills-suggestions-exploring-follow-up-sync 审计](/opt/claude/GitNexus/docs/audits/2026-04-15-gitnexus-skills-suggestions-exploring-follow-up-sync.md)

---

## 3. 本轮修复

本轮只做 bounded date-label sync：

- 把两份历史状态页顶部的 `Status sync` 日期更新为 `2026-04-15`
- 把两份历史状态页顶部的 `Current Follow-Up Snapshot` 日期更新为 `2026-04-15`
- 在路线图与 OpenSpec 中登记这条 snapshot-date sync

本轮不改：

- 任何 snapshot 表格内容判断
- 历史正文内容
- `gitnexus/src/**`
- `gitnexus/test/**`

---

## 4. 风险边界

这轮仍然只是日期标签 truth-sync：

- 不新增结论
- 不扩张历史状态页的收敛范围
- 只修顶部日期标签晚于实际内容的问题

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-skills-historical-snapshot-date-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-skills-historical-snapshot-date-sync`
  - 返回 `Change '2026-04-15-skills-historical-snapshot-date-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = low`
    - `changed_files = 7`
    - `changed_count = 3`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- staged scope review 只看到本轮预期的历史状态页日期标签同步切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是 historical skills 状态页顶部日期标签的滞后，
不是新的技能或治理缺陷。

修完后，两份页面顶部的 snapshot 日期会与它们已经吸收的最新 follow-up 事实保持一致。
