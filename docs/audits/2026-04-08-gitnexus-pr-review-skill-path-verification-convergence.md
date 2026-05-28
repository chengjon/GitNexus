# GitNexus PR Review Skill Path Verification Convergence

日期：2026-04-08  
范围：`.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md`、`gitnexus/skills/gitnexus-pr-review.md`  
目标：把 `gitnexus-pr-review` 的 package skill 副本重新收敛到 source skill 的 worktree path-verification guidance

---

## 1. 背景

当前仓内的 `gitnexus-pr-review` skill 有两份文档面：

- source skill：`.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md`
- package skill：`gitnexus/skills/gitnexus-pr-review.md`

两者大部分内容一致，但 package skill 少了两处关键 guidance：

- checklist 里没有要求在 worktree 场景下检查 `path_resolution`
- review dimensions 里缺少 `Path verification` 这一维

这会留下一个真实的维护残留：

- source skill 已经把 `detect_changes` 的 worktree path validation 讲完整
- package skill 却退回成较弱版本

因此 residual 不在运行时，而在同一技能的 source/package 文档面已经发生漂移。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md)
  - 当前 source skill 已明确要求 worktree 场景检查 `path_resolution`
- [gitnexus/skills/gitnexus-pr-review.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-pr-review.md)
  - 当前 package skill 少了这两处 path-verification wording
- [2026-04-07 PR review skill detect-changes guidance convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-pr-review-skill-detect-changes-guidance-convergence.md)
  - 已确认 `gitnexus-pr-review` 应保持 multi-repo `repo` 与 worktree `cwd` guidance 完整同步

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 让 package skill checklist 与 source skill 一致
- 补回 `Path verification` review dimension
- 在路线图与 OpenSpec 中登记这条 source/package convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- PR review runtime / MCP 行为

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不改 `detect_changes` 实现
- 不改 `gitnexus_impact` / `gitnexus_context` 行为
- 只修技能文档 source/package 漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-pr-review-skill-path-verification-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-pr-review-skill-path-verification-convergence`
  - 返回 `Change '2026-04-08-gitnexus-pr-review-skill-path-verification-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = critical`
    - `changed_files = 107`
    - `changed_count = 269`
    - `affected_count = 56`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码与文档改动放大
- 它不等于本轮 skill-doc convergence 自身引入了新的 PR review runtime blast radius
- 本轮实际修改范围仍然只落在技能文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 `gitnexus-pr-review` skill 的 source/package wording drift，而不是新的 PR review 功能缺陷。

修完后，source skill 与 package skill 都会一致强调：

- worktree 场景下不只要传 `cwd`
- 还要验证 `path_resolution`
- `git_diff_path` / `path_resolution` 本身属于 review 质量的一部分
