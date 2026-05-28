# Skills Historical Body Boundary Sync

日期：2026-04-15  
范围：`docs/gitnexus-skills-review.md`、`docs/gitnexus-skills-modification-suggestions.md`  
目标：给两份 historical skills 页面保留的旧正文补一层明确的 historical-boundary 说明，避免旧 `当前状态` 小节继续被误读成当前待办

---

## 1. 背景

两份 historical skills 页面顶部已经有 current follow-up snapshot，
也已经把最新收敛项同步进去。

但在页面下半部，它们仍保留：

- `状态`
- `当前状态`
- `缺失内容`
- `建议修改`

这类 2026-03-26 原始审核/建议语句。

如果没有在旧正文入口处再补一层边界说明，读者仍可能跳过顶部 snapshot，
直接把下半部的 `当前状态: ⚠️ 需更新` 读成当前仓库待办。

因此 residual 不在结论内容，而在历史正文边界还不够显式。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [docs/gitnexus-skills-review.md](/opt/claude/GitNexus/docs/gitnexus-skills-review.md)
  - 顶部已有 current snapshot，但旧摘要表与详细审核仍保留原始 `当前状态`
- [docs/gitnexus-skills-modification-suggestions.md](/opt/claude/GitNexus/docs/gitnexus-skills-modification-suggestions.md)
  - 顶部已有 current snapshot，但详细建议正文仍保留原始 `当前状态`
- [2026-04-15-skills-historical-snapshot-date-sync 审计](/opt/claude/GitNexus/docs/audits/2026-04-15-skills-historical-snapshot-date-sync.md)
  - 说明顶部日期标签已经同步到最新 snapshot 事实

---

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 `docs/gitnexus-skills-review.md` 的旧摘要表前和详细审核入口前补 historical note
- 在 `docs/gitnexus-skills-modification-suggestions.md` 的旧正文入口前补 historical note
- 在路线图与 OpenSpec 中登记这条 historical-body boundary sync

本轮不改：

- 任何历史正文判断
- snapshot 表格内容
- `gitnexus/src/**`
- `gitnexus/test/**`

---

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 2026-03-26 原始内容
- 不新增新的技能结论
- 只让读者更难把旧正文误读成当前状态板

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-skills-historical-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-skills-historical-body-boundary-sync`
  - 返回 `Change '2026-04-15-skills-historical-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 historical-body boundary sync 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是 historical skills 页面旧正文边界不够显式的问题，
不是新的技能或治理缺陷。

修完后，读者会在进入旧表格/旧正文前就看到：

- 这些 `状态` / `当前状态` 属于 2026-03-26 historical baseline
- 当前仓库状态应以上方 current snapshot、路线图和后续 convergence 记录为准
