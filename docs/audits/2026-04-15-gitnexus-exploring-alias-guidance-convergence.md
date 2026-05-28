# GitNexus Exploring Alias Guidance Convergence

日期：2026-04-15  
范围：`.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`、`gitnexus/skills/gitnexus-exploring.md`  
目标：把 `gitnexus-exploring` skill 的工具别名提示收敛到当前 `search/query` 与 `explore/context` 契约

---

## 1. 背景

`gitnexus-exploring` 一直被当作“怎么理解代码结构/执行流”的低门槛入口。

当前工具别名契约已经支持：

- `search` → `query`
- `explore` → `context`

但 source skill 与 package skill 仍没有把这层别名提示交给读者。

因此 residual 不在探索工具本身，而在 exploring skill 仍停留在较早的工具命名说明。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [.claude/skills/gitnexus/gitnexus-exploring/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-exploring/SKILL.md)
  - 当前 source skill 没有 alias note
- [gitnexus/skills/gitnexus-exploring.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-exploring.md)
  - package skill 副本存在同样残留
- [docs/gitnexus-skills-review.md](/opt/claude/GitNexus/docs/gitnexus-skills-review.md)
  - 历史审核仍把 exploring alias note 视为低优先级小改进建议
- 当前 GitNexus 工具别名契约
  - `search` → `query`
  - `explore` → `context`

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 给 source skill 与 package skill 都补一段 alias note
- 保持 exploring skill 的其他 workflow / example wording 不变
- 在路线图与 OpenSpec 中登记这条 exploring alias convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何查询或上下文工具的 runtime behavior

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不改知识图谱查询逻辑
- 不改 MCP 工具别名实现
- 只修 exploring skill 对当前别名契约的提示缺口

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-15-gitnexus-exploring-alias-guidance-convergence
gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-15-gitnexus-exploring-alias-guidance-convergence`
  - 返回 `Change '2026-04-15-gitnexus-exploring-alias-guidance-convergence' is valid`
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

这轮关闭的是 `gitnexus-exploring` skill 的 alias guidance drift，
不是新的 exploring / query / context 功能缺陷。

修完后，exploring skill 会在最靠近工具入口的位置直接告诉读者：

- `search` 是 `query` 的别名
- `explore` 是 `context` 的别名
