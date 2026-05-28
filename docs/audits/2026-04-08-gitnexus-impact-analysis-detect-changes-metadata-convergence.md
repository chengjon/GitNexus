# GitNexus Impact Analysis Detect Changes Metadata Convergence

日期：2026-04-08  
范围：`.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`、`gitnexus/skills/gitnexus-impact-analysis.md`  
目标：把 `gitnexus-impact-analysis` skill 对 `gitnexus_detect_changes` 的路径解析元数据说明收敛到当前契约

---

## 1. 背景

`gitnexus-impact-analysis` 已经补过 multi-repo / worktree 场景下的 `repo` / `cwd`
提示，但仍缺少一层关键 guidance：

- 调用者应看哪些输出字段来确认分析真的跑在预期路径上
- 当工具回退到 registry repo 路径时，应如何解释

这使得 skill 文档仍停留在“知道要传 `cwd`”，却没有把
`gitnexus_detect_changes` 的可解释性元数据完整交给读者。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md)
  - 当前 source skill 只写了 `repo` / `cwd`，未写输出元数据校验点
- [gitnexus/skills/gitnexus-impact-analysis.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-impact-analysis.md)
  - package skill 副本存在同样残留
- [docs/gitnexus-skills-review.md](/opt/claude/GitNexus/docs/gitnexus-skills-review.md)
  - 2026-03-26 技能审核已把 impact-analysis 的 `detect_changes` 输出元数据增强列为高优先级待更新项
- [2026-03-25 detect_changes worktree 设计](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md)
  - 已明确输出元数据包括 `git_repo_path`、`git_diff_path`、`process_cwd`、`path_resolution`、`fallback_reason`

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 给 source skill 与 package skill 都补 `detect_changes` 输出元数据示例
- 给 checklist 补上路径验证要求
- 把 `path_resolution = registry_repo` 明确标注为需要解释的 fallback
- 在路线图与 OpenSpec 中登记这条 impact-analysis convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `detect_changes` 运行时实现

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不改 blast-radius 计算逻辑
- 不改 Git diff path resolution 行为
- 只修 impact-analysis skill 对当前 `detect_changes` 元数据契约的缺口

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence`
  - 返回 `Change '2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence' is valid`
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
- 它不等于本轮 impact-analysis skill convergence 自身引入了新的 runtime blast radius
- 本轮实际修改范围仍然只落在技能文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 `gitnexus-impact-analysis` skill 的 metadata guidance drift，
不是新的 `detect_changes` 实现缺陷。

修完后，impact-analysis skill 不再只告诉读者“记得传 `cwd`”，还会明确告诉读者：

- 分析实际跑在哪个路径
- 当前路径解析是否回退
- 如果发生回退，应看什么字段解释原因
