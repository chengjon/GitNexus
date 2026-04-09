# Detect Changes Worktree Review Truth Sync

日期：2026-04-07  
范围：`docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`  
目标：把 worktree review 文档里已经被现有测试证伪的“未完成项”同步回当前事实

---

## 1. 背景

`detect_changes` 的 worktree-aware path resolution 早已落地，近期又完成了：

- host guidance 收敛
- `doctor --json` transport 结构化
- PR review / AI context / fixture 文档中的 `repo` / `cwd` guidance 收敛

但旧 review 文档里仍保留着两类已经过时的判断：

- “显式 `cwd` 优先级测试尚未补齐”
- “`fallback_reason` 还没有直接断言覆盖”

这会把已经完成的测试债继续写成未完成项。

---

## 2. 残留问题

修复前的 review 文档仍然宣称：

- 缺少显式 `cwd` 覆盖 `process.cwd()` 的测试
- `fallback_reason` 尚未被合同级测试锁定

但当前仓内实际已经有直接证据：

- unit:
  - `calltool-dispatch.test.ts`
- native integration:
  - `local-backend.test.ts`

两层测试都已经覆盖了显式 `cwd` 优先级，而且 unit/integration 都有
`fallback_reason` 的直接断言。

因此这份 review 文档本身已经成为新的 stale-debt 来源。

---

## 3. 本轮修复

本轮继续采用 doc truth-sync 方式：

- 更新 [2026-03-25-detect-changes-worktree-resolution-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md)
  - 把“显式 `cwd` 优先级测试”从待完成改为已完成
  - 把 “`fallback_reason` 未覆盖” 改为当前已有直接断言的事实
  - 更新评分和最终待办，只保留真正剩余的宿主兼容性矩阵与设计文档同步项

本轮不改：

- `detect_changes` 代码
- handler / LocalBackend 行为
- Claude Code / Cursor / 其他 host 的实际兼容性研究结论

---

## 4. 风险边界

本轮只改 review 文档，不改运行逻辑。

因此风险边界是：

- 不改变任何测试结果
- 不改变任何 CLI / MCP 行为
- 只消除文档里的 false-open debt

---

## 5. 验证

引用的 unit 测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts --config vitest.config.ts
```

结果：

- `1` 个测试文件通过
- `86` 个测试通过

引用的 native integration 测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/integration/local-backend.test.ts --config vitest.integration.native.config.ts
```

结果：

- `1` 个测试文件通过
- `37` 个测试通过

额外治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-detect-changes-worktree-review-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-detect-changes-worktree-review-truth-sync`
  返回 `Change '2026-04-07-detect-changes-worktree-review-truth-sync' is valid`
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

这轮没有新增功能，只把 review 文档从“继续报告已关闭测试债”收敛回
“准确描述当前剩余问题”。

现在这份 review 的真正未完成项只剩：

- 外部宿主兼容性矩阵
- 相关设计文档的 truth-sync

最终 scope review 也说明这轮仍是纯治理收敛：

- 没有新增受影响 symbol
- 没有新增受影响 process
- 只是在已有大工作树噪音背景下继续缩减一条 stale review debt
