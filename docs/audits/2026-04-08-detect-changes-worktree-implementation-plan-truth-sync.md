# Detect Changes Worktree Implementation Plan Truth Sync

日期：2026-04-08
范围：`docs/superpowers/plans/2026-03-25-detect-changes-worktree-resolution-implementation-plan.md`
目标：把 pre-OpenSpec 时期的 `detect_changes` worktree resolution implementation plan 从 false-open 状态同步回当前已落地事实。

---

## 1. 背景

`detect_changes` 的 worktree-aware path resolution 是一条已经落地并且近期
连续做过 design/review truth-sync 的 correctness 切片。

现在的问题不在实现，而在历史 implementation plan：

- 这份计划仍保留全量 `- [ ]`
- 但 design / review 文档都已经同步为 implemented 状态
- 路线图和当前仓内源码 / 测试也都已经把这条切片写成已落地事实

因此它属于典型 false-open plan debt。

---

## 2. 事实源

由于这条切片早于当前 OpenSpec 工作流，本轮没有复用旧 task ledger，而是使用以下
merged-state truth sources：

- [2026-03-25-detect-changes-worktree-resolution-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md)
  - 状态已明确写为：`Implemented; truth-synced to current behavior on 2026-04-07`
- [2026-03-25-detect-changes-worktree-resolution-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md)
  - 已明确写明 GitNexus 主仓实现完成，剩余开放项只在外部宿主兼容性研究
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已明确写明 `detect_changes` 支持 worktree-aware path resolution 和显式
    fallback metadata
- 当前仓内实现与测试锚点
  - `gitnexus/src/storage/git.ts`
  - `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
  - `gitnexus/test/unit/git.test.ts`
  - `gitnexus/test/unit/calltool-dispatch.test.ts`
  - `gitnexus/test/integration/local-backend.test.ts`

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 把旧计划里 17 条已落地步骤回填为已完成
- 增加一段 historical verification summary，明确当前采用的事实源
- 在技术债路线图中登记这条 false-open residual 已关闭
- 建立对应的 audit / OpenSpec 台账，避免这条计划继续被误读为 active work

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `detect_changes` / worktree resolution / dual-CLI host guidance 行为

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不改 TypeScript 行为
- 不改测试
- 不改 `detect_changes` 合同
- 只修历史 implementation plan 状态漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-detect-changes-worktree-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
# fallback used in this session because the GitNexus MCP transport had already closed
node --input-type=module -e 'import { LocalBackend } from "./gitnexus/dist/mcp/local/local-backend.js"; const backend = new LocalBackend(); await backend.init(); console.log(JSON.stringify(await backend.callTool("detect_changes", { scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus" }), null, 2)); await backend.disconnect();'
```

结果：

- `openspec validate 2026-04-08-detect-changes-worktree-implementation-plan-truth-sync`
  返回 `Change '2026-04-08-detect-changes-worktree-implementation-plan-truth-sync' is valid`
- 本会话中的 GitNexus MCP transport 已处于不可用状态，因此最终 scope review
  使用当前仓内 `LocalBackend` 的 `detect_changes` handler 直连回退执行
- 回退执行返回：
  - `risk_level = critical`
  - `changed_files = 80`
  - `changed_count = 243`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 truth-sync 自身引入了新的 `detect_changes` worktree blast radius
- 本轮实际修改范围仍然只落在治理文档、历史 implementation plan、
  路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical implementation plan drift，而不是产品缺陷。

修完后，`detect_changes` worktree resolution 这条已经落地多时的 correctness
切片，不会再继续被旧 implementation plan 误报为“尚未执行”。
