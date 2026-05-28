# Repo Hygiene Implementation Plan Truth Sync

日期：2026-04-07  
范围：`docs/superpowers/plans/2026-04-06-repo-hygiene-doc-convergence-implementation-plan.md`  
目标：把 repo-hygiene implementation plan 里已经完成却仍显示为未执行的历史步骤，同步回当前 OpenSpec task ledger 与已落地仓内事实。

---

## 1. 背景

`repo-hygiene-doc-convergence` 是本轮仓库治理的起点切片之一。

它已经完成了：

- stale governance 文档 truth-sync
- `.sisyphus/` / `tmp_exports/` 残留处置
- audit / OpenSpec reference 收敛
- 第一轮 `gitnexus-web` logging cleanup
- `kuzu` / `kuzu-wasm` 依赖债登记
- `upstream/main` 收敛规则记录

对应 OpenSpec task ledger 已全部完成，change 也仍然 valid。

---

## 2. 残留问题

当前残留不在实现，而在 plan execution state：

- `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md` 已全部完成
- `openspec validate 2026-04-06-repo-hygiene-doc-convergence` 仍返回 valid
- 但 [2026-04-06-repo-hygiene-doc-convergence-implementation-plan.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-04-06-repo-hygiene-doc-convergence-implementation-plan.md)
  还保留三条未勾选的 commit 步骤

这会让阅读者误以为该切片仍停在未完成状态。

---

## 3. 本轮修复

本轮采用 bounded doc truth-sync：

- 给 repo-hygiene implementation plan 增加 execution status sync note
- 把三条已经被 OpenSpec ledger 与当前仓内状态证实完成的历史 commit steps 回填为已完成
- 在技术债路线图中登记这一条 false-open plan debt 已关闭

本轮不改：

- `gitnexus-web` 代码
- dependency 策略
- upstream convergence 规则
- 任何 Claude Code / Codex 行为

---

## 4. 风险边界

这轮仍然是纯治理文档收敛：

- 不改 TypeScript
- 不改测试
- 不改 OpenSpec capability 行为
- 只修 plan 台账状态漂移

---

## 5. 验证

前置事实验证：

- `openspec validate 2026-04-06-repo-hygiene-doc-convergence`
  - `Change '2026-04-06-repo-hygiene-doc-convergence' is valid`
- `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md`
  - 当前无未勾选任务

本轮治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-repo-hygiene-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-repo-hygiene-implementation-plan-truth-sync`
  返回 `Change '2026-04-07-repo-hygiene-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  返回：
  - `risk_level = low`
  - `changed_files = 67`
  - `changed_symbols = 0`
  - `affected_processes = 0`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

---

## 6. 结论

这轮关闭的是 repo-hygiene plan state drift，而不是功能债。

修完后，这份 implementation plan 将重新和其 OpenSpec ledger 保持一致，不再继续报告一条已经收口的历史治理切片为“未完成”。

最终 scope review 也确认：

- 没有新增受影响 symbol
- 没有新增受影响 process
- 本轮仍只是仓库卫生治理文档的 truth-sync
