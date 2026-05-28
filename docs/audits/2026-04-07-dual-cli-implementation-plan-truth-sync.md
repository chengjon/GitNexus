# Dual CLI Implementation Plan Truth Sync

日期：2026-04-07  
范围：

- `docs/superpowers/plans/2026-04-06-dual-cli-doctor-doc-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-04-06-dual-cli-doctor-worktree-guidance-implementation-plan.md`
- `docs/superpowers/plans/2026-04-06-dual-cli-manual-mcp-command-convergence-implementation-plan.md`
- `docs/superpowers/plans/2026-04-06-dual-cli-setup-context-convergence-implementation-plan.md`

目标：把四份 dual-CLI implementation plan 中已经完成却仍显示为未执行的步骤，同步回对应 OpenSpec task ledger 的当前事实。

---

## 1. 背景

这一轮 dual-CLI 收敛工作已经先后完成了：

- doctor 文档收敛
- doctor worktree guidance
- manual MCP command convergence
- setup/context convergence

对应的 OpenSpec change 都还有效，task ledger 也都已经完成。

但四份 implementation plan 仍保留全量 `- [ ]` 状态，看起来像整个执行过程从未开始。

---

## 2. 残留问题

当前的 false-open plan debt 不是实现缺陷，而是执行状态文档漂移：

- OpenSpec tasks 已完成
- 变更记录仍有效
- 但 implementation plan 继续报告“全部未完成”

这会制造两类噪音：

- 让后续审计把已关闭切片误判为新残留
- 削弱 implementation plan 作为执行台账的可信度

---

## 3. 本轮修复

本轮采用 bounded doc truth-sync：

- 回填四份 dual-CLI implementation plan 的 checkbox 状态
- 在每份 plan 中补一条 execution status sync note，显式指向对应的 OpenSpec tasks ledger
- 对 `doctor-worktree-guidance` plan 补齐执行期实际出现的 `doctorCommand()` option-only parsing 修复步骤
- 更新技术债路线图，登记这轮 residual 已关闭

本轮不改：

- `doctor` 实现
- host adapter
- `setup --help`
- Claude Code / Codex 任何运行行为

---

## 4. 风险边界

这轮仍是纯文档治理：

- 不修改 TypeScript / tests
- 不改变 dual-CLI 共享契约
- 只消除 implementation plan 的 false-open 状态

---

## 5. 验证

前置事实验证：

- `openspec validate 2026-04-06-dual-cli-doctor-doc-convergence`
  - `Change '2026-04-06-dual-cli-doctor-doc-convergence' is valid`
- `openspec validate 2026-04-06-dual-cli-doctor-worktree-guidance`
  - `Change '2026-04-06-dual-cli-doctor-worktree-guidance' is valid`
- `openspec validate 2026-04-06-dual-cli-manual-mcp-command-convergence`
  - `Change '2026-04-06-dual-cli-manual-mcp-command-convergence' is valid`
- `openspec validate 2026-04-06-dual-cli-setup-context-convergence`
  - `Change '2026-04-06-dual-cli-setup-context-convergence' is valid`

本轮治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-dual-cli-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-dual-cli-implementation-plan-truth-sync`
  返回 `Change '2026-04-07-dual-cli-implementation-plan-truth-sync' is valid`
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

这轮修复关闭的是 dual-CLI 计划台账漂移，不是功能缺陷。

修完后，四份 implementation plan 将重新与各自的 OpenSpec task ledger 一致，不再继续制造“看似未执行”的假残留。

最终 scope review 也确认：

- 没有新增受影响 symbol
- 没有新增受影响 process
- 本轮仍然只是 Claude Code / Codex 共享治理文档的 truth-sync
