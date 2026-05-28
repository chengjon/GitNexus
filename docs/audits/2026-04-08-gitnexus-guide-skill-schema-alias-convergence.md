# GitNexus Guide Skill Schema Alias Convergence

日期：2026-04-08  
范围：`.claude/skills/gitnexus/gitnexus-guide/SKILL.md`、`gitnexus/skills/gitnexus-guide.md`  
目标：把 `gitnexus-guide` skill 的工具别名与 graph schema 摘要收敛到当前 GitNexus 工具面

---

## 1. 背景

`gitnexus-guide` 是技能入口文档，负责解释：

- 有哪些 MCP 工具
- 图谱 schema 长什么样
- 读者应如何理解资源与工作流

但当前 source skill 与 package skill 都停留在较早摘要：

- 没有写 `search` → `query`、`explore` → `context` 这两个别名
- graph schema 摘要也缺少：
  - `Folder`
  - `CodeElement`
  - 多语言节点
  - `HAS_METHOD`
  - `OVERRIDES`

因此 residual 不在运行时，而在入口型技能文档没有同步当前工具与 schema 边界。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [.claude/skills/gitnexus/gitnexus-guide/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-guide/SKILL.md)
  - 当前 source skill 仍缺少 alias 与较新的 schema 摘要
- [gitnexus/skills/gitnexus-guide.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-guide.md)
  - package skill 副本存在同样残留
- [docs/gitnexus-skills-review.md](/opt/claude/GitNexus/docs/gitnexus-skills-review.md)
  - 2026-03-26 的技能审核已把 guide 的 alias/schema 漂移列为待更新项
- 当前 GitNexus MCP 工具与 schema 契约
  - `query` / `context` 的别名关系
  - 当前 schema 中的 `Folder`、`CodeElement`、多语言节点、`HAS_METHOD`、`OVERRIDES`

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 给 source skill 与 package skill 都补 alias 说明
- 更新 graph schema 摘要
- 在路线图与 OpenSpec 中登记这条 guide skill convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- GitNexus MCP / schema runtime behavior

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不改工具实现
- 不改知识图谱生成逻辑
- 只修入口型技能文档对当前工具面与 schema 的摘要漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-guide-skill-schema-alias-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-guide-skill-schema-alias-convergence`
  - 返回 `Change '2026-04-08-gitnexus-guide-skill-schema-alias-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = critical`
    - `changed_files = 108`
    - `changed_count = 270`
    - `affected_count = 56`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码与文档改动放大
- 它不等于本轮 guide skill convergence 自身引入了新的 MCP 或 schema runtime blast radius
- 本轮实际修改范围仍然只落在技能文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 `gitnexus-guide` skill 的入口摘要漂移，而不是新的工具或 schema 缺陷。

修完后，guide skill 会更接近当前真实工具面：

- 工具别名不会再缺席
- schema 摘要不会再停留在较旧节点/边类型集合
