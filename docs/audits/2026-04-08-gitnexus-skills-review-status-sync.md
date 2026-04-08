# GitNexus Skills Review Status Sync

日期：2026-04-08  
范围：`docs/gitnexus-skills-review.md`  
目标：保留 2026-03-26 技能审核报告的历史价值，同时避免它继续把已收敛的 skill-doc 项原样表达成当前待办

---

## 1. 背景

`docs/gitnexus-skills-review.md` 记录了 2026-03-26 对技能文件的一轮集中审核。

这份文档本身仍有价值，但其摘要表现在已经容易被误读成当前状态板，尤其是：

- `gitnexus-cli`
- `gitnexus-guide`
- `gitnexus-refactoring`
- `gitnexus-pr-review`

这些项在后续 2026-04-08 的多条收敛切片里已经被继续修正。

如果不补 status sync，后来读者仍容易把旧审核表格当成当前 backlog。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [docs/gitnexus-skills-review.md](/opt/claude/GitNexus/docs/gitnexus-skills-review.md)
  - 当前仍按 2026-03-26 视角展示技能状态
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已登记多条 2026-04-08 skill-doc convergence
- 已完成的后续收敛记录
  - `gitnexus-cli` dual-cli freshness / troubleshooting convergence
  - `gitnexus-guide` schema / alias convergence
  - `gitnexus-refactoring` rename taxonomy convergence
  - `gitnexus-pr-review` path verification convergence
- 当前技能文档现状
  - `gitnexus-debugging` 已吸收 regression note

---

## 3. 本轮修复

本轮只做 bounded status-sync：

- 给旧审核报告增加顶部状态同步说明
- 增加一个 current follow-up snapshot，提醒读者哪些项已被后续收敛覆盖
- 保留原始 2026-03-26 审核表格与建议内容，避免抹掉历史判断

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何技能 runtime behavior

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不新增技能功能
- 不重写旧审核结论
- 只修“历史审核表被误读成当前状态板”的治理歧义

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-skills-review-status-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-skills-review-status-sync`
  - 返回 `Change '2026-04-08-gitnexus-skills-review-status-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = critical`
    - `changed_files = 110`
    - `changed_count = 271`
    - `affected_count = 56`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码与文档改动放大
- 它不等于本轮 historical skills-review sync 自身引入了新的技能 runtime blast radius
- 本轮实际修改范围仍然只落在治理文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical skills-review drift，而不是新的技能实现缺陷。

修完后，`docs/gitnexus-skills-review.md` 会继续保留它作为 2026-03-26 审核基线的价值，
但不再容易被直接读成当前技能待办总表。
