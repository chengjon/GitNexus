# GitNexus Skills Modification Suggestions Status Sync

日期：2026-04-08  
范围：`docs/gitnexus-skills-modification-suggestions.md`  
目标：保留 2026-03-26 技能修改建议报告的历史价值，同时避免它继续把已收敛的 skill-doc 项原样表达成当前待办

---

## 1. 背景

`docs/gitnexus-skills-modification-suggestions.md` 是基于当时技能审核结果整理出的
建议页，本身仍有历史价值。

但它当前仍整体使用“当前建议”口吻，且正文顶部没有 current-state framing。
在 2026-04-08 的多条 skill-doc convergence 已落地后，这会继续误导读者把
下列项读成当前 backlog：

- `gitnexus-cli`
- `gitnexus-guide`
- `gitnexus-impact-analysis`
- `gitnexus-refactoring`
- `gitnexus-pr-review`

同时，`gitnexus-debugging` 的 regression note 也已被当前 skill 吸收。

因此 residual 不在技能实现，而在历史建议页缺少 status sync。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [docs/gitnexus-skills-modification-suggestions.md](/opt/claude/GitNexus/docs/gitnexus-skills-modification-suggestions.md)
  - 当前仍按 2026-03-26 视角给出修改建议
- [docs/gitnexus-skills-review.md](/opt/claude/GitNexus/docs/gitnexus-skills-review.md)
  - 已补做 historical status sync，可作为同组治理文档的参照
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已登记多条 2026-04-08 skill-doc convergence
- 已完成的后续收敛记录
  - `gitnexus-cli` freshness / troubleshooting convergence
  - `gitnexus-guide` schema / alias convergence
  - `gitnexus-impact-analysis` metadata convergence
  - `gitnexus-refactoring` rename taxonomy convergence
  - `gitnexus-pr-review` path verification convergence
- 当前技能文档现状
  - `gitnexus-debugging` 已吸收 regression note

---

## 3. 本轮修复

本轮只做 bounded status-sync：

- 给旧建议页增加顶部状态同步说明
- 增加一个 current follow-up snapshot，提醒读者哪些项已被后续收敛覆盖
- 保留原始 2026-03-26 建议正文，避免抹掉历史建议语境

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何技能 runtime behavior

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不新增技能功能
- 不重写旧建议正文
- 只修“历史建议页被误读成当前待办总表”的治理歧义

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-skills-modification-suggestions-status-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-skills-modification-suggestions-status-sync`
  - 返回 `Change '2026-04-08-gitnexus-skills-modification-suggestions-status-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = critical`
    - `changed_files = 112`
    - `changed_count = 272`
    - `affected_count = 56`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码与文档改动放大
- 它不等于本轮 historical suggestions sync 自身引入了新的技能 runtime blast radius
- 本轮实际修改范围仍然只落在治理文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical skills-modification-suggestions drift，而不是新的技能实现缺陷。

修完后，`docs/gitnexus-skills-modification-suggestions.md` 会继续保留它作为
2026-03-26 建议基线的价值，但不再容易被直接读成当前技能待办总表。
