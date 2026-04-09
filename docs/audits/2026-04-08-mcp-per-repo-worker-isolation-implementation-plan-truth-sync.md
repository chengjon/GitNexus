# MCP Per-Repo Worker Isolation Implementation Plan Truth Sync

日期：2026-04-08  
范围：`docs/superpowers/plans/2026-04-04-mcp-per-repo-worker-isolation-implementation-plan.md`  
目标：把 historical `mcp-per-repo-worker-isolation` implementation plan 从 false-open 状态同步回当前已落地事实。

---

## 1. 背景

当前仓内已经存在完整的 MCP router + per-repo worker 架构。

现在的问题不在实现，而在历史文档：

- implementation plan 仍保留全量 `- [ ]`
- `docs/mcp-per-repo-worker-isolation-design.md` 仍把自己写成
  “Proposed replacement”
- `docs/sigusr1-cooperative-release-design.md` 仍把单进程 MCP 写成 current
  baseline

因此这是一组相互放大的 stale governance 残留。

---

## 2. 事实源

本轮直接使用以下 merged-state truth sources：

- [mcp-per-repo-worker-isolation-design.md](/opt/claude/GitNexus/docs/mcp-per-repo-worker-isolation-design.md)
  - 本轮补做 implementation sync，收敛为 historical landed design
- [sigusr1-cooperative-release-design.md](/opt/claude/GitNexus/docs/sigusr1-cooperative-release-design.md)
  - 本轮补做 historical sync，明确它只是旧单进程模型下的 blocked alternative
- 当前仓内实现与测试锚点
  - `gitnexus/src/mcp/backend-contract.ts`
  - `gitnexus/src/mcp/router-backend.ts`
  - `gitnexus/src/mcp/repo-worker-manager.ts`
  - `gitnexus/src/mcp/repo-worker.ts`
  - `gitnexus/src/mcp/local/runtime/pinned-repo-runtime.ts`
  - `gitnexus/test/unit/router-backend.test.ts`
  - `gitnexus/test/unit/repo-worker-manager.test.ts`
  - `gitnexus/test/integration/repo-worker.test.ts`
  - `gitnexus/test/integration/router-backend-worker.test.ts`
  - `gitnexus/test/integration/mcp-worker-isolation.test.ts`
- later merged-state records
  - [2026-04-06-mcp-process-management proposal](/opt/claude/GitNexus/openspec/changes/archive/2026-04-06-mcp-process-management/proposal.md)
  - [2026-04-06-mcp-process-management design](/opt/claude/GitNexus/openspec/changes/archive/2026-04-06-mcp-process-management/design.md)
  - 它们都把 router + per-repo worker 架构写成既有前提，而不是待实现项

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 把旧计划里 38 条已落地步骤回填为已完成
- 增加一段 historical verification summary，明确当前采用的事实源
- 把 `mcp-per-repo-worker-isolation-design.md` 状态收敛为 historical landed record
- 把 `sigusr1` 文档状态收敛为 historical blocked alternative
- 在技术债路线图中登记这条 false-open residual 已关闭

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- MCP router/worker 行为

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不改 TypeScript 行为
- 不改测试
- 不改双 CLI / MCP 合同
- 只修历史 implementation/design/status 漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
# fallback used in this session because the GitNexus MCP transport had already closed
node --input-type=module -e 'import { LocalBackend } from "./gitnexus/dist/mcp/local/local-backend.js"; const backend = new LocalBackend(); await backend.init(); const result = await backend.callTool("detect_changes", { scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus" }); console.log(JSON.stringify({ summary: result.summary, metadata: result.metadata }, null, 2)); await backend.disconnect();'
```

结果：

- `openspec validate 2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync`
  返回 `Change '2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync' is valid`
- 本会话中的 GitNexus MCP transport 已先前关闭，因此最终 scope review
  使用当前仓内 `LocalBackend` 的 `detect_changes` handler 直连回退执行
- 回退执行返回：
  - `risk_level = critical`
  - `changed_files = 83`
  - `changed_count = 246`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 truth-sync 自身引入了新的 router/worker architecture blast radius
- 本轮实际修改范围仍然只落在治理文档、历史 implementation/design/status docs、
  路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 router/worker architecture 的 historical plan/design drift，
而不是产品缺陷。

修完后，当前 MCP 架构不会再继续被旧 implementation plan 和旧 SIGUSR1
状态描述误报为“仍在提案阶段”。
