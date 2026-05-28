# PR Review Skill Detect Changes Guidance Convergence

日期：2026-04-07  
范围：`gitnexus/skills/gitnexus-pr-review.md`、`.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md`、`gitnexus/test/unit/pr-review-skill.test.ts`  
目标：让 PR review skill 的 `detect_changes` 用法与当前 multi-repo / worktree guidance 保持一致

---

## 1. 背景

GitNexus 主文档和 AI context 最近几轮已经把 `detect_changes` 的关键调用约束收敛清楚了：

- multi-repo 场景下显式传 `repo`
- worktree 或 server cwd 漂移场景下显式传 `cwd`

但 `gitnexus-pr-review` skill 仍保留旧版示例，尤其是对 PR review 这种最依赖
`detect_changes` 的工作流来说，这会把维护者重新带回过时调用方式。

---

## 2. 残留问题

修复前的 skill 文档存在几类残留：

- source skill 仍把主示例写成 `gitnexus_detect_changes({scope: "compare", base_ref: "main"})`
- repo 内安装副本虽然加入了 worktree `cwd` 提示，但主示例仍未显式要求 `repo`
- 两份 skill 之间本身也已经出现内容漂移

这会导致：

- PR review skill 与当前 README / quick-start / AI context 契约不一致
- 读 skill 的人仍可能遗漏 multi-repo `repo` 参数
- source skill 和已安装副本继续各自演化

---

## 3. 本轮修复

本轮采用低风险文档收敛：

- 新增 [pr-review-skill.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/pr-review-skill.test.ts)
  - 先用红测锁住两份 skill 共同的关键契约：
    - 主示例显式包含 `repo`
    - checklist 明确包含 multi-repo `repo` guidance
    - worktree 示例同时包含 `repo` 和 `cwd`
- 更新 [gitnexus-pr-review.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-pr-review.md)
- 更新 [SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md)
  - 将两份 skill 同步到当前 guidance 方向

本轮不改：

- `detect_changes` 实现
- PR review 运行逻辑
- Claude Code / Codex host 行为

---

## 4. 风险边界

本轮只修改：

- skill 文档
- 一个读取文档内容的 focused test

因此风险很低：

- 不涉及运行时代码
- 不改变任何 MCP/CLI 行为
- 只消除文档契约与当前实现方向之间的漂移

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/pr-review-skill.test.ts --config vitest.config.ts
```

结果：

- `1` 个测试文件通过
- `1` 个测试通过

构建验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build
```

结果：

- `tsc` 构建通过

额外治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-pr-review-skill-detect-changes-guidance-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-pr-review-skill-detect-changes-guidance-convergence' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 67`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 67` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只修复 skill 文档与测试漂移”的低风险边界

---

## 6. 结论

PR review skill 现在已经与当前 `detect_changes` 契约重新对齐：

- 主示例显式写出 `repo`
- worktree 示例同时写出 `repo` 与 `cwd`
- source skill 与 repo 内安装副本恢复同步

这样 PR review 这条高频使用路径不再把维护者带回旧版 guidance。
