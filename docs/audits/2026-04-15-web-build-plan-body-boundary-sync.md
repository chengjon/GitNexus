# Web Build Plan Body Boundary Sync

日期：2026-04-15  
范围：`docs/superpowers/plans/2026-04-06-gitnexus-web-build-boundary-fix-implementation-plan.md`  
目标：给 `gitnexus-web` build-boundary implementation plan 的旧正文补更显式的 boundary 说明，避免保留的 `Goal`、`Architecture` 和已勾选计划步骤被继续读成当前 live build-fix plan

---

## 1. 背景

[`2026-04-06-gitnexus-web-build-boundary-fix-implementation-plan.md`](/opt/claude/GitNexus/docs/superpowers/plans/2026-04-06-gitnexus-web-build-boundary-fix-implementation-plan.md)
目前仍保留着完整的 implementation-plan 结构，但页面顶部还没有明确指出：

- 后续 authoritative completion record 已转移到 audit / OpenSpec
- 下方的 `Goal`、`Architecture` 与已勾选任务只是 planning-time baseline

如果没有这层 boundary note，读者仍可能直接把这份计划页读成当前 live build-fix plan，而不是已经被后续 audit / OpenSpec 吸收的历史计划。

因此 residual 不在 build-boundary 修复结论本身，而在 historical implementation-plan 正文边界还不够显式。

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-06-gitnexus-web-build-boundary-fix-implementation-plan.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-04-06-gitnexus-web-build-boundary-fix-implementation-plan.md)
  - historical implementation plan 已存在，但正文入口前还缺少单独 boundary note
- [2026-04-06-gitnexus-web-build-boundary-fix.md](/opt/claude/GitNexus/docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md)
  - 提供同一 build-boundary 线的 authoritative fixed-and-verified baseline
- `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/`
  - 提供同一切片的 authoritative OpenSpec completion record

## 3. 本轮修复

本轮只做 bounded boundary sync：

- 在 implementation plan 顶部补一条 status note，明确后续 audit/OpenSpec 才是 authoritative completion record
- 在正文入口补一条 historical implementation-plan note
- 在任务区入口前补一条 note，说明下方步骤只是 2026-04-06 planning-time breakdown
- 在 audit 与 OpenSpec 中登记这条 web build plan boundary sync

本轮不改：

- 任何 `gitnexus-web/**` 构建文件
- 任何修复结论
- 任何产品代码

## 4. 风险边界

这轮仍然只是历史正文边界说明收敛：

- 不重写 build-boundary implementation plan 内容
- 不重开前端构建修复工作
- 只让读者更难把旧 plan 结构误读成当前 live plan

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-web-build-plan-body-boundary-sync
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-web-build-plan-body-boundary-sync`
  - 返回 `Change '2026-04-15-web-build-plan-body-boundary-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = low`
    - `changed_files = 5`
    - `changed_count = 1`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- staged scope review 只看到本轮预期的 web build historical-plan boundary 切片
- `changed_count = 1` 对应的是本轮被索引识别到的目标 implementation plan 文档，而不是代码路径扩散
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

## 6. 结论

这轮关闭的是 `gitnexus-web` build-boundary implementation plan 旧正文边界不够显式的问题，
不是新的前端构建修复任务。

修完后，读者会更清楚地知道：

- `Goal` / `Architecture` 属于 2026-04-06 的 planning-time baseline
- 下方已勾选步骤只是 historical plan artifacts，而不是当前默认执行队列
