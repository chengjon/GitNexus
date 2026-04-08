# GitNexus CLI Skill Dual CLI Freshness Convergence

日期：2026-04-08  
范围：`.claude/skills/gitnexus/gitnexus-cli/SKILL.md`、`gitnexus/skills/gitnexus-cli.md`  
目标：把 CLI skill 文档里的 post-mutation freshness guidance 收敛为真实的双 CLI 差异说明

---

## 1. 背景

当前仓库已经在共享上下文和 quick-start 文档里明确区分：

- **Claude Code**：有 `PostToolUse` 自动 freshness handling
- **Codex**：当前没有等价自动 hook，需要按需手动重跑 `gitnexus analyze`

但 `gitnexus-cli` skill 的 source 文档与 package 副本仍只写了 Claude Code 自动路径，
没有并列写出 Codex 手动路径。

这会留下一个双 CLI 文档残留：

- 主支持面包含 `Claude Code + Codex`
- 但 CLI skill 只把 Claude Code freshness 路径说完整

因此 residual 不在运行时，而在 skill 文档面没有同步当前 dual-CLI freshness 契约。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [Dual CLI post-mutation freshness guidance](/opt/claude/GitNexus/docs/audits/2026-04-07-dual-cli-post-mutation-freshness-guidance.md)
  - 已明确共享文档应同时说明 Claude Code 自动路径与 Codex 手动路径
- [docs/gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md)
  - 当前 quick-start 已明确写出双 CLI freshness 差异
- [gitnexus/test/fixtures/mini-repo/AGENTS.md](/opt/claude/GitNexus/gitnexus/test/fixtures/mini-repo/AGENTS.md)
  - 当前 fixture 已明确写出 Codex 手动重跑 `gitnexus analyze`
- [.claude/skills/gitnexus/gitnexus-cli/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-cli/SKILL.md)
  - 当前 source skill 仍只写 Claude Code 自动路径
- [gitnexus/skills/gitnexus-cli.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-cli.md)
  - package skill 副本也存在同样残留

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 在 source skill 与 package skill 副本中并列写出：
  - Claude Code 自动 freshness handling
  - Codex 手动重跑 `gitnexus analyze`
- 保持原有 analyze 命令语义不变
- 在路线图与 OpenSpec 中登记这条双 CLI skill-doc convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 Claude Code / Codex runtime behavior

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不新增 Codex 自动 hook 承诺
- 不改 CLI 行为
- 只把 skill 文档同步到当前真实的双 CLI freshness 契约

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence`
  返回 `Change '2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 107`
  - `changed_count = 269`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码与文档改动放大
- 其中 `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` 也已经存在并行未提交差异；
  本轮只在该文件上追加双 CLI freshness 说明，没有回退那些既有修改
- 本轮实际治理目标仍然只是把 source skill 与 package skill 收敛到相同的
  dual-CLI freshness wording

---

## 6. 结论

这轮关闭的是 CLI skill dual-CLI freshness wording drift，而不是新的 host 功能缺陷。

修完后，`gitnexus-cli` skill 的两个文档面都会明确告诉读者：

- Claude Code 有自动 freshness handling
- Codex 当前没有等价自动 hook，需要按需手动重跑 `gitnexus analyze`
