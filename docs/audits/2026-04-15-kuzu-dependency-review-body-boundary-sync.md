# Kuzu Dependency Review Body Boundary Sync

日期：2026-04-15  
范围：`docs/audits/2026-04-06-kuzu-dependency-review.md`  
目标：给 historical `kuzu` dependency review 的旧正文补更显式的 boundary 说明，避免保留的 `Provisional Recommendation`、`Immediate Operating Rule` 和 `Recommended Next Step` 被继续读成当前 live package policy

---

## 1. 背景

[`2026-04-06-kuzu-dependency-review.md`](/opt/claude/GitNexus/docs/audits/2026-04-06-kuzu-dependency-review.md)
顶部已经明确它是 review-only decision baseline，而且页面里也已回指后续的
exit-strategy follow-up。

但继续进入正文后，读者仍会直接看到：

- `Provisional Recommendation`
- `Immediate Operating Rule`
- `Recommended Next Step`

这些段落里还保留着很强的当前决策与操作建议语气。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部状态说明，
直接把这份 review-only baseline 的旧 recommendation / next-step 读成当前
live dependency policy。

因此 residual 不在 `kuzu` 结论本身，而在 historical dependency-review 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-06-kuzu-dependency-review.md](/opt/claude/GitNexus/docs/audits/2026-04-06-kuzu-dependency-review.md)
  - review-only baseline 已存在，但正文入口前还缺少单独 boundary note
- [2026-04-06-kuzu-dependency-exit-strategy.md](/opt/claude/GitNexus/docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md)
  - 后续切片已把 tracked exception、exit criteria 与 reopen triggers 固化成当前 follow-up truth source
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 dependency-governance follow-up entrypoint

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在文档顶部补一条 historical review note，覆盖 preserved dependency-review body
- 在 `Provisional Recommendation` 入口前补一条 note，说明它只是 review-time decision posture
- 在 `Immediate Operating Rule` 入口前补一条 note，说明当前 tracked-exception reading 应以后续 exit-strategy 为准
- 在路线图与 OpenSpec 中登记这条 kuzu dependency review boundary sync

本轮不改：

- 任何依赖版本
- 任何 exit criteria
- `gitnexus/**`
- `gitnexus-web/**`

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 2026-04-06 dependency review 结论
- 不重开 `kuzu` / `kuzu-wasm` 替代方案评审
- 只让读者更难把旧 review-only recommendation 误读成当前 live package policy

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-kuzu-dependency-review-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-kuzu-dependency-review-body-boundary-sync`
  - 返回 `Change '2026-04-15-kuzu-dependency-review-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 `kuzu` dependency-review historical-boundary 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 historical `kuzu` dependency review 旧正文边界不够显式的问题，
不是新的依赖修复或替代决策。

修完后，读者会更清楚地知道：

- `Provisional Recommendation` 属于 2026-04-06 review-time recommendation
- `Immediate Operating Rule` / `Recommended Next Step` 只是 review-only baseline 的操作语气，不是独立于 exit-strategy 之外的当前 package policy
