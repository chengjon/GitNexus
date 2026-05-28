# Full Generation Review Body Boundary Sync

日期：2026-04-15  
范围：`docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md`  
目标：给 historical full-generation review 的旧 review-gate 正文补更显式的 boundary 说明，避免保留的 `Verdict` / `Summary` / blocker severity 被读成当前 implementation gate

---

## 1. 背景

[`2026-03-28-wiki-generator-full-generation-review.md`](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md)
顶部已经明确：

- 这是 historical design-review record
- `failedModules` blocker 已在 landed code 中修复
- 下方评论不应再被读成当前 blocker

但继续进入正文后，读者仍会直接看到：

- `Verdict`
- issue 列表
- `Severity at review time: Should fix before implementation`
- `Summary`

这些强 review-gate 结构。

如果没有在正文入口前再补一层 boundary note，读者仍可能跳过顶部 status sync，
直接把保留的 severity / blocker 叙事误读成当前 implementation gate。

因此 residual 不在 review 结论本身，而在旧 review gate 正文边界还不够显式。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-03-28-wiki-generator-full-generation-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md)
  - 顶部已有 historical framing，但 `Verdict` / `Summary` 入口前还缺少单独 boundary note
- [2026-04-08-wiki-generator-full-generation-review-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-full-generation-review-truth-sync.md)
  - 已把这份 review 从“当前 blocker”收敛回 historical review record
- [2026-03-28-technical-debt-audit.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-technical-debt-audit.md)
  - 已记录 `failedModules` review finding 在落地代码中已修复
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前 convergence entrypoint

---

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 `Verdict` 入口前补一条历史 review baseline note
- 在 `Summary` 入口前补一条 note，说明 blocker/severity 语气仅代表 review-time 反馈
- 在路线图与 OpenSpec 中登记这条 full-generation review boundary sync

本轮不改：

- 任何 issue 内容
- 任何 landed-resolution note
- `gitnexus/src/**`
- `gitnexus/test/**`

---

## 4. 风险边界

这轮仍然只是历史 review 正文边界说明收敛：

- 不重写 2026-03-28 review 内容
- 不新增新的 wiki 结论
- 只让读者更难把旧 blocker/severity 叙事误读成当前 implementation gate

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-full-generation-review-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-full-generation-review-body-boundary-sync`
  - 返回 `Change '2026-04-15-full-generation-review-body-boundary-sync' is valid`
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

- staged scope review 只看到本轮预期的 full-generation historical review boundary 切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是 historical full-generation review 旧 gate 正文边界不够显式的问题，
不是新的代码或设计缺陷。

修完后，读者会更清楚地知道：

- `Verdict` / `Summary` 属于 2026-03-28 design-review baseline
- 保留的 blocker/severity 语气只是 review-time 反馈，而不是当前 implementation gate
