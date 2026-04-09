# LocalBackend Implementation Plan Truth Sync

日期：2026-04-08  
范围：`docs/superpowers/plans/2026-03-24-local-backend-handler-first-implementation-plan.md`  
目标：把 pre-OpenSpec 时期的 `LocalBackend` handler-first implementation plan 从 false-open 状态同步回当前已落地事实。

---

## 1. 背景

`LocalBackend` handler-first refactor 是本仓早期最关键的一条 P1 热点拆分切片。

现在的问题不在实现，而在历史计划文档：

- 这份 implementation plan 仍保留全量 `- [ ]`
- 但后续设计文档与路线图都已经把它登记为已落地
- 当前仓内计划里列出的 runtime / registry / handlers / tests 文件也都已存在

因此它属于典型 false-open plan debt。

---

## 2. 事实源

由于这条切片早于当前 OpenSpec 工作流，本轮没有复用旧 task ledger，而是使用以下 merged-state truth sources：

- [2026-03-24-local-backend-handler-first-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md)
  - 状态已明确写为：landed on current `main` via `2038325` and follow-up fixes
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已明确写明 `LocalBackend` handler-first 拆分已完成、合并、验证并推送到 `main`
- 当前仓内文件存在性
  - implementation plan 中列出的 runtime / tool-registry / shared helpers / handlers / `tool-registry.test.ts` 均已存在

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 把旧计划里 35 条已落地步骤回填为已完成
- 增加一段 historical verification summary，明确当前采用的事实源
- 在技术债路线图中登记这条 false-open residual 已关闭

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `LocalBackend` 运行时行为

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不改 TypeScript
- 不改测试
- 不改现有 MCP/CLI 合同
- 只修历史计划状态漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-local-backend-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-local-backend-implementation-plan-truth-sync`
  返回 `Change '2026-04-08-local-backend-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  返回：
  - `risk_level = critical`
  - `changed_files = 77`
  - `changed_symbols = 239`
  - `affected_processes = 41`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 已被仓内其他未提交代码改动放大
- 它不等于本轮 truth-sync 自身引入了 `LocalBackend` 级别的新 blast radius
- 本轮实际修改范围仍然只落在治理文档、历史 implementation plan 与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical implementation plan drift，而不是产品缺陷。

修完后，`LocalBackend` 这条已经落地多时的 handler-first refactor 不会再继续被历史计划文档误报为“尚未执行”。
