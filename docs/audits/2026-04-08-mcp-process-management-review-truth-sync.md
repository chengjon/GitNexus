# MCP Process Management Review Truth Sync

日期：2026-04-08  
范围：`docs/superpowers/specs/2026-04-05-mcp-process-management-review.md`  
目标：把 historical review 文档中仍像当前实现 gate 的叙事同步回已归档、已落地的 MCP process-management 事实

---

## 1. 背景

`2026-04-05-mcp-process-management-review.md` 仍以典型 pre-implementation
review 口吻收尾：

- “should be resolved before implementation begins”
- “approve with revisions”
- “address C1-C3 and I1-I2 before implementation starts”

但这条治理切片后续已经有更强事实源：

- historical design 已 truth-sync 为 landed historical design record
- archived OpenSpec change `2026-04-06-mcp-process-management` 已归档
- 当前仓内已经存在 runtime registry、session identity、`mcp ps/gc/drain`
  与 analyze drain-first 的源码和测试锚点

因此，这份 review 继续保留“当前 gate”语气，会把已经完成的切片重新误读成
仍待进入实现阶段。

---

## 2. 事实源

本轮直接使用以下 merged-state truth sources：

- [2026-04-05-mcp-process-management-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-05-mcp-process-management-review.md)
  - 本轮补做 status sync，使其回到 historical review record 定位
- [2026-04-05-mcp-process-management-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-05-mcp-process-management-design.md)
  - 已 truth-sync 为 landed historical design record
- [2026-04-06-mcp-process-management archived OpenSpec change](/opt/claude/GitNexus/openspec/changes/archive/2026-04-06-mcp-process-management/design.md)
  - 明确记录了 global registry、session identity、`mcp ps/gc` 和 analyze integration 的最终设计取舍
- [2026-04-06-mcp-process-management archived OpenSpec tasks](/opt/claude/GitNexus/openspec/changes/archive/2026-04-06-mcp-process-management/tasks.md)
  - 已把 runtime registry、CLI、drain 与 reindex-lock hardening 全部记为完成
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已登记 MCP process-management implementation-plan false-open closure
- 当前仓内实现与测试锚点
  - `gitnexus/src/runtime/mcp-process-registry.ts`
  - `gitnexus/src/runtime/mcp-process-config.ts`
  - `gitnexus/src/cli/mcp.ts`
  - `gitnexus/src/cli/analyze.ts`
  - `gitnexus/test/unit/mcp-process-registry.test.ts`
  - `gitnexus/test/unit/mcp-command.test.ts`
  - `gitnexus/test/unit/analyze-scope.test.ts`

---

## 3. 本轮修复

本轮只做 bounded review-doc truth-sync：

- 给历史 review 文档增加 status sync note
- 增加 implementation sync note，说明后续 design / OpenSpec / landed code
  已经吸收或定案这些 concern
- 把 summary 和 recommendation 从“当前 gate”收敛为 historical review context
- 保留原始 concern 列表，避免抹掉设计审查历史
- 在路线图中登记这条 stale review residual 已关闭
- 为这次文档收敛登记新的 OpenSpec change

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
- 只修历史 review 文档状态漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-mcp-process-management-review-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-mcp-process-management-review-truth-sync`
  返回 `Change '2026-04-08-mcp-process-management-review-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 106`
  - `changed_count = 268`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 预计仍会被仓内其他未提交代码改动放大
- 它不等于本轮 review truth-sync 自身引入了新的 MCP process-management blast radius
- 本轮实际修改范围仍然只落在治理文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical review drift，而不是产品代码缺陷。

修完后，`2026-04-05-mcp-process-management-review.md` 不会再把已经归档并落地的
MCP process-management 切片继续表述成“实现前必须先解决”的当前 gate。
