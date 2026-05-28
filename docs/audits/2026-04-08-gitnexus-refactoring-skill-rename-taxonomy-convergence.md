# GitNexus Refactoring Skill Rename Taxonomy Convergence

日期：2026-04-08  
范围：`.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`、`gitnexus/skills/gitnexus-refactoring.md`  
目标：把 `gitnexus-refactoring` skill 里的 rename confidence wording 收敛到当前 `graph` / `text_search` taxonomy

---

## 1. 背景

当前 `gitnexus-refactoring` 的 source skill 与 package skill 仍在多处写：

- `ast_search edits`

但当前 rename 契约已经使用：

- `graph`
- `text_search`

因此 residual 不在重命名功能，而在重构技能文档仍停留在旧版置信度分类命名。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md)
  - 当前 source skill 仍写 `ast_search`
- [gitnexus/skills/gitnexus-refactoring.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-refactoring.md)
  - package skill 副本存在同样残留
- 当前 `gitnexus_rename` 工具契约
  - 预览输出区分 `graph` 与 `text_search`

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 把 source skill 与 package skill 里的 `ast_search` wording 统一替换为 `text_search`
- 保留现有 graph-vs-text review guidance
- 在路线图与 OpenSpec 中登记这条 refactoring skill convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `gitnexus_rename` runtime behavior

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不改 rename 实现
- 不改调用图或文本搜索逻辑
- 只修重构技能文档中的旧 taxonomy 命名

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence`
  - 返回 `Change '2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence' is valid`
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
- 它不等于本轮 refactoring skill convergence 自身引入了新的 rename runtime blast radius
- 本轮实际修改范围仍然只落在技能文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 `gitnexus-refactoring` skill 的 rename taxonomy drift，而不是新的重构功能缺陷。

修完后，source skill 与 package skill 都会使用当前一致的：

- `graph`
- `text_search`

而不会继续保留过时的 `ast_search` 命名。
