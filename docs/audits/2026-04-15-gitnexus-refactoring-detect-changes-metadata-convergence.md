# GitNexus Refactoring Detect Changes Metadata Convergence

日期：2026-04-15  
范围：`.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`、`gitnexus/skills/gitnexus-refactoring.md`  
目标：把 `gitnexus-refactoring` skill 对 `gitnexus_detect_changes` 的路径解析元数据说明收敛到当前契约

---

## 1. 背景

当前 `gitnexus-refactoring` 的 source skill 与 package skill 已经提示：

- 多仓场景要传 `repo`
- worktree 场景要传 `cwd`

但它们仍停留在“记得传参”的层面，没有继续解释：

- 哪些 `gitnexus_detect_changes` 输出字段能确认分析实际跑在哪个路径
- 当 `path_resolution = registry_repo` 时应如何解释这次回退

因此 residual 不在重构能力本身，而在重构技能文档还没有把当前
`detect_changes` metadata contract 交代完整。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md)
  - 当前 source skill 只写了 `repo` / `cwd`
- [gitnexus/skills/gitnexus-refactoring.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-refactoring.md)
  - package skill 副本存在同样残留
- [2026-04-08 refactoring rename taxonomy convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence.md)
  - 证明 refactoring skill 曾做过一轮文案收敛，但未覆盖 metadata guidance
- [2026-04-08 impact-analysis metadata convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence.md)
  - 提供当前 metadata/path-verification guidance 的可复用基线
- 当前 `gitnexus_detect_changes` metadata contract
  - `git_repo_path`、`git_diff_path`、`process_cwd`、`path_resolution`、`fallback_reason`

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 给 source skill 与 package skill 都补 `detect_changes` 输出元数据示例
- 给 rename checklist 补上路径验证要求
- 把 `path_resolution = registry_repo` 明确标注为需要解释的 fallback
- 在路线图与 OpenSpec 中登记这条 refactoring metadata convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `gitnexus_detect_changes` runtime behavior

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不改 refactoring / rename 实现
- 不改 Git diff path resolution 行为
- 只修 refactoring skill 对当前 `detect_changes` 元数据契约的缺口

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-gitnexus-refactoring-detect-changes-metadata-convergence
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-gitnexus-refactoring-detect-changes-metadata-convergence`
  - 返回 `Change '2026-04-15-gitnexus-refactoring-detect-changes-metadata-convergence' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = low`
    - `changed_files = 7`
    - `changed_count = 2`
    - `affected_count = 0`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- staged scope review 只看到本轮预期的文档切片
- 它没有把用户未暂存的
  `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  卷入本轮收敛范围

---

## 6. 结论

这轮关闭的是 `gitnexus-refactoring` skill 的 metadata guidance drift，
不是新的 refactoring 功能缺陷。

修完后，refactoring skill 不再只告诉读者“记得传 `cwd`”，还会明确告诉读者：

- 分析实际跑在哪个路径
- 当前路径解析是否回退
- 如果发生回退，应看什么字段解释原因
