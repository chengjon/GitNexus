# Technical Debt Audit Historical Status Sync

日期：2026-04-08  
范围：`docs/superpowers/specs/2026-03-28-technical-debt-audit.md`  
目标：保留 2026-03-28 技术债审计的 worktree-era 历史价值，同时避免它继续被误读成当前主仓状态

---

## 1. 背景

`2026-03-28-technical-debt-audit.md` 本身是一份高价值文档，因为它记录了当时：

- wiki-page-generation-subagents worktree 的真实分叉与提交密度
- 设计文档与技术债路线图在那个时间点的偏差
- generator / kuzu-adapter / analyze 等切片在当时的推进状态

问题不在于这份审计“错误”，而在于它现在缺少足够明确的 current-state framing。

如果直接按正文阅读，今天的维护者仍可能把下面这些表达误读成当前主仓状态：

- `generator.ts` 仍 `In progress`
- `kuzu-adapter.ts` / `analyze.ts` 仍是 `Local slice committed`
- `Remaining` 里仍需执行 generator worktree merge sequence

因此它属于 historical baseline drift，而不是新的代码缺陷。

---

## 2. 事实源

本轮直接使用以下 current truth sources：

- [2026-03-28-technical-debt-audit.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-technical-debt-audit.md)
  - 本轮补做 historical status sync，保留原始审计内容但补充 current-state
    reader guidance
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前主仓技术债收敛入口
- [2026-04-08-repo-technical-debt-audit-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md)
  - 说明仓库级历史审计如何补 current-state follow-up
- 2026-04-08 wiki-generator implementation-plan / review truth-sync 记录
  - 这些记录已经把 `generator.ts` 相关 worktree-era false-open 与 stale review
    叙事逐条收口

---

## 3. 本轮修复

本轮只做 bounded status-sync：

- 不改 2026-03-28 审计的原始观测数据
- 只在文档顶部、关键状态表前、总结段前增加 current-state reader guidance
- 在技术债路线图中补入口，提醒后续读者把它当作 historical baseline 来读
- 为这次文档收敛登记新的 OpenSpec change

本轮不改：

- TypeScript
- 测试
- OpenSpec capability 行为
- 任何 P1/P2/P3 运行时实现

---

## 4. 风险边界

这轮只是治理文档收敛：

- 不改代码
- 不改测试
- 不改双 CLI 合同
- 只修正 historical audit 被误读成 current state 的风险

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-technical-debt-audit-historical-status-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-technical-debt-audit-historical-status-sync`
  返回 `Change '2026-04-08-technical-debt-audit-historical-status-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 105`
  - `changed_count = 267`
  - `affected_count = 53`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 docs-only historical status sync 自身扩大了代码 blast radius
- 本轮实际修改范围仍然只落在治理文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical audit framing drift，而不是产品缺陷。

修完后，`2026-03-28-technical-debt-audit.md` 会继续保留它的 worktree-era
历史价值，但不再那么容易被误读成当前主仓的 authoritative status board。
