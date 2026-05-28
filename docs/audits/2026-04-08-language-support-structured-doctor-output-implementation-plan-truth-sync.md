# Language Support Structured Doctor Output Implementation Plan Truth Sync

日期：2026-04-08
范围：`docs/superpowers/plans/2026-04-07-language-support-structured-doctor-output-implementation-plan.md`
目标：把已完成的 `language-support structured doctor output` implementation plan 从 false-open 状态同步回其 OpenSpec task ledger 与当前仓内事实。

---

## 1. 背景

`language-support-structured-doctor-output` 这一切片已经完成：

- OpenSpec task ledger 全部勾选
- 对应 audit 已落盘
- 技术债路线图已把该切片登记为已完成收敛项

但历史 implementation plan 顶部仍缺少 execution-status sync note，看起来仍像一条需要继续推进的活动计划。

这不是实现残留，而是 plan state drift。

---

## 2. 事实源

本轮以以下内容为 execution-truth source：

- [openspec/changes/2026-04-07-language-support-structured-doctor-output/tasks.md](/opt/claude/GitNexus/openspec/changes/2026-04-07-language-support-structured-doctor-output/tasks.md)
- [2026-04-07-language-support-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-language-support-structured-doctor-output.md)
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)

这些事实源已经一致表明：

- `doctor --json` 已对 `language-support` 暴露结构化 `data`
- reporter 已优先消费该结构化数据，同时保留 fallback
- 这条 P2 残留已被关闭，而不是仍停留在计划阶段

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 在路线图中登记这条 false-open plan debt 已关闭
- 为这条治理修正补 audit / OpenSpec 记录

本轮不改：

- `doctor.ts`
- `language-support-report.ts`
- Vitest
- OpenSpec capability 行为

---

## 4. 风险边界

这轮仍是纯治理文档收敛：

- 不改 TypeScript
- 不改测试
- 不改 `doctor --json` 协议
- 只修 historical plan state drift

---

## 5. 验证

前置事实验证：

- `openspec validate 2026-04-07-language-support-structured-doctor-output`
  - `Change '2026-04-07-language-support-structured-doctor-output' is valid`
- `openspec/changes/2026-04-07-language-support-structured-doctor-output/tasks.md`
  - 当前无未勾选任务

本轮治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync`
  - 返回 `Change '2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 返回：
    - `risk_level = low`
    - `changed_files = 112`
    - `changed_count = 0`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- 当前 worktree-wide review 下，工具没有把本轮 docs-only truth-sync 映射到新的 indexed symbol 或 affected process
- `changed_files = 112` 仍说明整仓存在大量未提交改动噪声
- 但这条 truth-sync 自身仍保持治理文档范围

---

## 6. 结论

这轮关闭的是 plan state drift，而不是功能债。

修完后，这份 implementation plan 会重新和其 OpenSpec ledger 对齐，不再继续误报一条已经完成的 P2 doctor/output convergence 切片为“仍在执行”。
