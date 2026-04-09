# Mini Repo AI Context Fixture Convergence

日期：2026-04-07
范围：`gitnexus/test/fixtures/mini-repo/AGENTS.md`、`gitnexus/test/fixtures/mini-repo/CLAUDE.md`、`gitnexus/test/unit/ai-context.test.ts`
目标：让 `mini-repo` 的样例 AI context 文档与当前生成器输出保持一致

---

## 1. 背景

GitNexus 的 AI context 生成器最近已经完成过几轮收敛：

- 不再把动态 symbol / edge / process 计数直接写进生成文档
- 为 `detect_changes` 补上 multi-repo `repo` guidance
- 在共享 freshness guidance 里明确区分 Claude Code 自动路径与 Codex 手动路径

但 `gitnexus/test/fixtures/mini-repo/` 下的样例文档仍然停留在旧模板。

---

## 2. 残留问题

修复前的夹具状态仍然表现出几类旧模板漂移：

- 顶部 intro 仍然内嵌动态 repo 计数
- `detect_changes` 示例仍未带 `repo: "mini-repo"`
- 自检段落仍未写出 multi-repo 下的 `repo` 契约
- 虽然刚补过 dual-CLI freshness note，但夹具主体仍未整体跟上当前生成器方向

这会带来两个问题：

- 样例文档会误导读者和后续维护者，以为旧契约仍然是当前输出
- `ai-context` 的测试只能证明临时生成内容是对的，不能证明仓内夹具样例没有继续漂移

---

## 3. 本轮修复

本轮继续采用边界明确的低风险修复：

- 更新 [ai-context.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/ai-context.test.ts)
  - 先新增红测，要求 `mini-repo` 两份夹具都满足当前关键契约：
    - 不再嵌入动态计数
    - 显式包含 `repo` / `cwd` guidance
    - 保留 Codex 手动 freshness note
- 更新 [AGENTS.md](/opt/claude/GitNexus/gitnexus/test/fixtures/mini-repo/AGENTS.md)
- 更新 [CLAUDE.md](/opt/claude/GitNexus/gitnexus/test/fixtures/mini-repo/CLAUDE.md)
  - 同步到当前生成器的关键输出方向

本轮不改：

- `ai-context` 生成逻辑
- `detect_changes` 运行行为
- Claude Code / Codex 的 host 行为

---

## 4. 风险边界

这轮只涉及测试与夹具文档，不修改任何运行时符号或行为。

因此风险边界很清晰：

- 不改变 CLI 输出逻辑
- 不改变 MCP 行为
- 只把夹具样例收敛到当前已验证的生成器契约

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/ai-context.test.ts --config vitest.config.ts
```

结果：

- `1` 个测试文件通过
- `10` 个测试通过

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
openspec validate 2026-04-07-mini-repo-ai-context-fixture-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-mini-repo-ai-context-fixture-convergence' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 65`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 65` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只修复测试与夹具文档漂移”的低风险边界

---

## 6. 结论

`mini-repo` 的两份样例 AI context 文档现在不再是旧模板残影，而是受测试保护的当前契约样例。

这让仓内夹具、当前生成器输出、以及双 CLI 文档方向重新回到一致状态。
