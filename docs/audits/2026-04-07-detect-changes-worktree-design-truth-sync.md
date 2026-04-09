# Detect Changes Worktree Design Truth Sync

日期：2026-04-07  
范围：

- `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md`
- `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

目标：把 `detect_changes` worktree 设计文档同步到当前实现与测试现实，并把 review 文档的剩余未完成项收敛到真正还开放的外部宿主兼容性研究。

---

## 1. 背景

上一轮 worktree review truth-sync 已经清掉了两条过时测试债：

- 显式 `cwd` 优先级测试已补齐
- `fallback_reason` 直接断言已存在

但 review 里仍保留一条真实 follow-up：

- 设计文档本身还没有同步到当前实现状态

---

## 2. 残留问题

当前 design 文档还停留在旧设计阶段，和仓内事实有三处关键偏差：

1. 仍把 `process.cwd()` 写成唯一输入，没有写出已经落地的 `params.cwd || process.cwd()` 解析顺序  
2. 只写了 `--git-common-dir` / `--show-toplevel`，没有把 `--git-dir` 与两者的语义边界讲清楚  
3. 没有把当前 metadata / warning / `fallback_reason` 合同和已有测试覆盖同步进去

这会让设计文档继续落后于当前实现与 review 结论。

---

## 3. 本轮修复

本轮采用 docs-only truth-sync：

- 更新 design 文档的状态、解析顺序、git 命令语义、metadata 合同、warning 边界与测试状态
- 明确当前剩余开放项只在外部宿主兼容性矩阵，而不在 GitNexus 主仓实现
- 更新 review 文档，把“更新设计文档”从待完成项移出，只保留真正未完成的宿主研究
- 在技术债路线图中登记这条 residual 已关闭

本轮不改：

- `detect-changes-handler.ts`
- `git.ts`
- unit / integration tests
- Claude Code / Codex / Cursor 的实际宿主行为

---

## 4. 风险边界

这轮只改设计与审计文档：

- 不改变 `detect_changes` 运行逻辑
- 不新增测试
- 不改变任何双 CLI 契约
- 只消除设计文档与 review 之间的事实漂移

---

## 5. 验证

本轮引用的当前事实来源：

- `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- `gitnexus/src/storage/git.ts`
- `gitnexus/test/unit/calltool-dispatch.test.ts`
- `gitnexus/test/integration/local-backend.test.ts`
- `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-detect-changes-worktree-design-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-detect-changes-worktree-design-truth-sync`
  返回 `Change '2026-04-07-detect-changes-worktree-design-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  返回：
  - `risk_level = low`
  - `changed_files = 68`
  - `changed_symbols = 0`
  - `affected_processes = 0`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

---

## 6. 结论

这轮关闭的是 design/review 文档漂移，不是运行时代码缺陷。

修完后，`detect_changes` worktree 这组文档会只留下一个真实开放项：

- 外部宿主兼容性矩阵

最终 scope review 也确认：

- 没有新增受影响 symbol
- 没有新增受影响 process
- 本轮仍只是 `detect_changes` worktree 文档的 truth-sync
