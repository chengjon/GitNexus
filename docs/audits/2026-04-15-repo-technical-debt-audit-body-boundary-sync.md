# Repo Technical Debt Audit Body Boundary Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`  
目标：给仓库级技术债基线审计的旧正文补一层明确的 historical-boundary 说明，避免保留的 `Summary` / `Findings` 被直接误读成当前阻塞项总表

---

## 1. 背景

[`2026-04-06-repo-technical-debt-and-residual-audit.md`](/opt/claude/GitNexus/docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md)
顶部已经有两层 status sync：

- 针对 Finding 3 的 host-surface sync
- 针对 Finding 2 与 repair-order guidance 的 broader sync

但页面进入正文后，读者仍会直接看到：

- `Summary`
- `Current State`
- `Findings`
- `Registered Follow-Up Decisions`

这些 2026-04-06 audit-capture 基线内容。

如果没有在正文入口处再补一层边界说明，读者仍可能跳过顶部 sync，
直接把下方原始 findings/severity 读成当前仓库的完整阻塞项列表。

因此 residual 不在结论本身，而在历史正文边界还不够显式。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-06-repo-technical-debt-and-residual-audit.md](/opt/claude/GitNexus/docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md)
  - 顶部已有 status-sync，但正文入口前没有单独的 historical-boundary note
- [2026-04-08-repo-technical-debt-audit-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md)
  - 已把 Finding 3 的 current-state reading 与 baseline reasoning 拆开
- [2026-04-08-repo-technical-debt-audit-broader-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-repo-technical-debt-audit-broader-status-sync.md)
  - 已把 Finding 2 / stale-doc backlog reading 的 current-state 入口重定向到路线图
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 backlog entrypoint

---

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在基线审计的 `Summary` 入口前补一段 historical baseline note
- 在 `Findings` 入口前补一段 reader note，说明 later status-sync 优先于原始 severity/推荐语句
- 在路线图与 OpenSpec 中登记这条 repo-technical-debt body-boundary sync

本轮不改：

- 任何 finding 内容判断
- 任何 severity 等级
- `gitnexus/src/**`
- `gitnexus/test/**`

---

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 2026-04-06 基线审计内容
- 不新增新的技术债结论
- 只让读者更难把保留的基线正文误读成当前阻塞项总表

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-repo-technical-debt-audit-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-repo-technical-debt-audit-body-boundary-sync`
  - 返回 `Change '2026-04-15-repo-technical-debt-audit-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的仓库级技术债基线审计边界说明切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是仓库级技术债基线审计旧正文边界不够显式的问题，
不是新的技术债或运行时缺陷。

修完后，读者会在进入旧正文前就看到：

- 下方 `Summary` / `Findings` 属于 2026-04-06 audit-capture baseline
- 当前仓库状态应优先参考顶部 sync、路线图和后续 truth-sync 记录
