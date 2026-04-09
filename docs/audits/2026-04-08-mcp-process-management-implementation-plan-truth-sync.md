# MCP Process Management Implementation Plan Truth Sync

日期：2026-04-08
范围：`docs/superpowers/plans/2026-04-05-mcp-process-management-implementation-plan.md`
目标：把历史 `mcp-process-management` implementation plan 的 false-open 状态同步回当前已落地事实。

---

## 1. 背景

`mcp-process-management` 这条治理切片已经在 OpenSpec 账本里落地并归档。

现在的问题不在实现，而在历史 implementation plan：

- 这份计划除了最后两条环境相关的 `detect_changes` 说明外，基本都已勾完
- archived OpenSpec 任务账本已经把实现与验证任务记为完成
- 当前仓内也已经存在 runtime registry、CLI `mcp ps/gc/drain`、
  repo-worker drain 和 analyze drain-first 相关源码与测试锚点

因此它属于“执行已完成，但历史 implementation plan 仍残留 false-open 叙事”的
治理残留。

---

## 2. 事实源

本轮直接使用以下 merged-state truth sources：

- [2026-04-06-mcp-process-management archived OpenSpec tasks](/opt/claude/GitNexus/openspec/changes/archive/2026-04-06-mcp-process-management/tasks.md)
  - 已把 implementation / verification / cooperative drain /
    reindex-lock hardening 任务全部记为完成
- [2026-04-05-mcp-process-management-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-05-mcp-process-management-design.md)
  - 本轮补做 implementation sync，明确这是 historical landed design
- [2026-04-05-mcp-process-management-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-05-mcp-process-management-review.md)
  - 保留为历史 review 记录，但不再作为 active implementation blocker
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 本轮补登记 archived change 与 false-open closure
- 当前仓内实现与测试锚点
  - `gitnexus/src/runtime/mcp-process-config.ts`
  - `gitnexus/src/runtime/mcp-process-registry.ts`
  - `gitnexus/src/cli/mcp.ts`
  - `gitnexus/src/cli/analyze.ts`
  - `gitnexus/src/mcp/repo-worker-manager.ts`
  - `gitnexus/src/mcp/repo-worker.ts`
  - `gitnexus/test/unit/mcp-process-registry.test.ts`
  - `gitnexus/test/unit/mcp-command.test.ts`
  - `gitnexus/test/unit/analyze-scope.test.ts`
  - `gitnexus/test/integration/repo-worker.test.ts`

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 把最后两条环境相关的 `detect_changes` 说明回填为已处理状态
- 增加一段 historical verification summary，明确 archived OpenSpec ledger
  与当前源码 / 测试锚点
- 把历史设计文档状态从 `Draft for review` 收敛为 historical landed record
- 在技术债路线图中登记这条 false-open residual 已关闭

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- MCP runtime / CLI / analyze 行为

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不改 TypeScript 行为
- 不改测试
- 不改双 CLI 合同
- 只修历史 implementation plan / design 状态漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-mcp-process-management-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
# fallback used in this session because the GitNexus MCP transport had already closed
node --input-type=module -e 'import { LocalBackend } from "./gitnexus/dist/mcp/local/local-backend.js"; const backend = new LocalBackend(); await backend.init(); const result = await backend.callTool("detect_changes", { scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus" }); console.log(JSON.stringify({ summary: result.summary, metadata: result.metadata }, null, 2)); await backend.disconnect();'
```

结果：

- `openspec validate 2026-04-08-mcp-process-management-implementation-plan-truth-sync`
  返回 `Change '2026-04-08-mcp-process-management-implementation-plan-truth-sync' is valid`
- 本会话中的 GitNexus MCP transport 已先前关闭，因此最终 scope review
  使用当前仓内 `LocalBackend` 的 `detect_changes` handler 直连回退执行
- 回退执行返回：
  - `risk_level = critical`
  - `changed_files = 88`
  - `changed_count = 245`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 truth-sync 自身引入了新的 MCP process-management blast radius
- 本轮实际修改范围仍然只落在治理文档、历史 implementation/design docs、
  路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical implementation-plan / design drift，而不是产品缺陷。

修完后，`mcp-process-management` 这条已经通过 archived OpenSpec 落地的治理切片，
不会再继续被历史 implementation plan 误报为“尚未执行”。
