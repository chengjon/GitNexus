# Technical Debt Audit Body Boundary Sync

日期：2026-04-15  
范围：`docs/superpowers/specs/2026-03-28-technical-debt-audit.md`  
目标：给 2026-03-28 worktree-era technical debt audit 的旧状态表格补更显式的 historical-boundary 说明，避免保留的 `Document Status` / `Status` 列继续被读成当前主仓状态板

---

## 1. 背景

[`2026-03-28-technical-debt-audit.md`](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-technical-debt-audit.md)
已经有顶部 status-sync，而且第 1 节也明确写了这是 worktree snapshot。

但继续往下读时，页面仍会直接给出：

- `Design Documents Status`
- `Tech Debt Roadmap Progress`

两张带有 `Document Status` / `Status` 列的旧表格。

如果没有在这些表格入口前再补一层 boundary note，读者仍可能把这些旧状态值
直接当成当前主仓状态，而忽略后续 truth-sync 记录。

因此 residual 不在结论本身，而在旧状态表格的边界还不够显式。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-03-28-technical-debt-audit.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-technical-debt-audit.md)
  - 顶部已有 historical framing，但第 2/3 节表格入口前还缺少单独 boundary note
- [2026-04-08-technical-debt-audit-historical-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-technical-debt-audit-historical-status-sync.md)
  - 已把整页定位回 historical worktree-era audit baseline
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前主仓 backlog / convergence entrypoint

---

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在页首补一条通用 historical baseline note
- 在 `Design Documents Status` 入口前补一条表格级 boundary note
- 在 `Tech Debt Roadmap Progress` 入口前补一条表格级 boundary note
- 在路线图与 OpenSpec 中登记这条 technical-debt-audit body-boundary sync

本轮不改：

- 任何表格状态值
- 任何技术债结论
- `gitnexus/src/**`
- `gitnexus/test/**`

---

## 4. 风险边界

这轮仍然只是历史状态表格的边界说明收敛：

- 不重写 2026-03-28 worktree-era audit 内容
- 不新增新的主仓技术债结论
- 只让读者更难把旧状态表格误读成当前状态板

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-technical-debt-audit-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-technical-debt-audit-body-boundary-sync`
  - 返回 `Change '2026-04-15-technical-debt-audit-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 historical technical-debt table boundary sync 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是 2026-03-28 technical debt audit 旧状态表格边界不够显式的问题，
不是新的技术债或代码缺陷。

修完后，读者会更清楚地知道：

- 第 2/3 节表格是 2026-03-28 worktree-era baseline
- 当前主仓状态应优先参考路线图与后续 truth-sync 记录
