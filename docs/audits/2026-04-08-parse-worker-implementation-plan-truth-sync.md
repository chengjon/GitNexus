# Parse Worker Implementation Plan Truth Sync

日期：2026-04-08  
范围：`docs/superpowers/plans/2026-03-26-parse-worker-laravel-route-extraction-implementation-plan.md`  
目标：把 pre-OpenSpec 时期的 `parse-worker` Laravel route extraction implementation plan 从 false-open 状态同步回当前已落地事实。

---

## 1. 背景

`parse-worker.ts` 的 Laravel route extraction 是技术债路线图里已经落地的一条
P1 热点拆分切片。

现在的问题不在实现，而在历史计划文档：

- 这份 implementation plan 仍保留全量 `- [ ]`
- 但路线图已经把该切片登记为 `2026-03-28` 时点上的已落地状态
- 当前仓内也已经存在计划里要求的 route extraction 模块、route type 边界和
  focused regression test

因此它属于典型 false-open plan debt。

---

## 2. 事实源

由于这条切片早于当前 OpenSpec 工作流，本轮没有复用旧 task ledger，而是使用以下
merged-state truth sources：

- [2026-03-26-parse-worker-laravel-route-extraction-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-26-parse-worker-laravel-route-extraction-design.md)
  - 本轮已补做 implementation sync，并把状态收敛为 historical landed record
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已明确写明该切片在 `2026-03-28` 进度更新中完成落地
- 当前仓内文件存在性
  - `gitnexus/src/core/ingestion/routes/types.ts`
  - `gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts`
  - `gitnexus/src/core/ingestion/routes/php-route-shared.ts`
  - `gitnexus/test/unit/laravel-route-extraction.test.ts`
  - 下游 `call-processor.ts` / `parsing-processor.ts` 已改用 `routes/types.ts`

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 把旧计划里 21 条已落地步骤回填为已完成
- 增加一段 historical verification summary，明确当前采用的事实源
- 把旧设计文档状态从 draft 收敛为 historical landed record，并注明
  `php-route-shared.ts` 这一 bounded implementation detail
- 在技术债路线图中登记这条 false-open residual 已关闭

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `parse-worker` / route extraction 运行时行为

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不改 TypeScript 行为
- 不改测试
- 不改 route-to-CALLS 合同
- 只修历史计划与设计状态漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-parse-worker-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
# fallback used in this session because the GitNexus MCP transport returned `Transport closed`
node --input-type=module -e 'import { LocalBackend } from "./gitnexus/dist/mcp/local/local-backend.js"; const backend = new LocalBackend(); await backend.init(); console.log(JSON.stringify(await backend.callTool("detect_changes", { scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus" }), null, 2)); await backend.disconnect();'
```

结果：

- `openspec validate 2026-04-08-parse-worker-implementation-plan-truth-sync`
  返回 `Change '2026-04-08-parse-worker-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  在当前会话中先返回 `Transport closed`
- 随后使用当前仓内 `LocalBackend` 的 `detect_changes` handler 直连回退执行，
  返回：
  - `risk_level = critical`
  - `changed_files = 79`
  - `changed_count = 242`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 truth-sync 自身引入了 `parse-worker` 级别的新 blast radius
- 本轮实际修改范围仍然只落在治理文档、历史 implementation/design docs
  与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical implementation plan / design drift，而不是产品缺陷。

修完后，`parse-worker` 这条已经落地多时的 Laravel route extraction
不会再继续被历史计划文档误报为“尚未执行”。
