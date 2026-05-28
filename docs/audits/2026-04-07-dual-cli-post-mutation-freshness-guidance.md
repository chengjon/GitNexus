# Dual CLI Post-Mutation Freshness Guidance

日期：2026-04-07  
范围：`gitnexus/src/cli/ai-context.ts`、`docs/gitnexus-quick-start-guide.md`  
目标：让共享文档明确区分 Claude Code 的自动索引刷新路径与 Codex 的手动刷新路径

---

## 1. 背景

GitNexus 当前确实为 Claude Code 提供了 `PostToolUse` hook，可在
`git commit` / `git merge` 后自动处理索引新鲜度。

但共享文档生成路径里，与“保持索引新鲜”相关的说明仍然只点名 Claude Code，
没有同时说明 Codex 当前没有等价自动 hook。

在本项目已经把 Claude Code 与 Codex 同时视为一等 CLI 入口的前提下，这会留下
一个典型的 dual-CLI 文档残留：

- Claude Code 路径被明确描述
- Codex 路径仍要靠用户自行推断

---

## 2. 残留问题

修复前的状态是：

- [ai-context.ts](/opt/claude/GitNexus/gitnexus/src/cli/ai-context.ts) 生成的共享上下文只写：
  - Claude Code 有 `PostToolUse` 自动处理
- [gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md) 也只有 Claude Code 提示
- 但仓内实际并不存在 Codex 对等的自动刷新 hook

这样一来，共享文档没有把真实行为说完整：

- Claude Code：自动
- Codex：手动

这不是功能缺失，而是契约表达残留。

---

## 3. 本轮修复

本轮继续采用最小加法修复：

- 更新 [ai-context.ts](/opt/claude/GitNexus/gitnexus/src/cli/ai-context.ts)
  - 在 “Keeping the Index Fresh” 段落保留现有 Claude Code 自动刷新说明
  - 同时新增 Codex 手动重跑 `gitnexus analyze` 的明确说明
- 更新 [ai-context.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/ai-context.test.ts)
  - 先新增红测，要求生成内容同时包含：
    - Claude Code 自动路径
    - Codex 手动路径
- 更新 [gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md)
  - 让共享 quick-start 文案与生成内容保持一致
- 同步更新测试夹具：
  - [AGENTS.md](/opt/claude/GitNexus/gitnexus/test/fixtures/mini-repo/AGENTS.md)
  - [CLAUDE.md](/opt/claude/GitNexus/gitnexus/test/fixtures/mini-repo/CLAUDE.md)

本轮不改：

- Claude Code hooks 行为
- Codex setup / host adapter 行为
- `doctor --json` 或 host-config 逻辑

---

## 4. 风险边界

按仓库规则，本轮先尝试对 `generateGitNexusContent` 做 GitNexus impact analysis；
但该查询仍被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮保持低风险：

- 只改共享文案和对应测试
- 不改任何 Claude Code / Codex 运行时行为
- 只把真实差异显式写清楚

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/ai-context.test.ts --config vitest.config.ts
```

结果：

- `1` 个测试文件通过
- `9` 个测试通过

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
openspec validate 2026-04-07-dual-cli-post-mutation-freshness-guidance
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-dual-cli-post-mutation-freshness-guidance' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 65`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 65` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只修正双 CLI 共享 freshness guidance 文案”的低风险边界

---

## 6. 结论

共享文档现在会明确告诉用户：

- Claude Code 有自动 post-mutation freshness handling
- Codex 当前没有等价自动 hook，需要按需手动重跑 `gitnexus analyze`

这让 GitNexus 的共享文档契约从“单边叙事”收敛为“真实的双 CLI 差异说明”。
