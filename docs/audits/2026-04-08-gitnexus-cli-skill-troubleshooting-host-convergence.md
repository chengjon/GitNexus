# GitNexus CLI Skill Troubleshooting Host Convergence

日期：2026-04-08  
范围：`.claude/skills/gitnexus/gitnexus-cli/SKILL.md`、`gitnexus/skills/gitnexus-cli.md`  
目标：把 `gitnexus-cli` skill troubleshooting 段落里的 stale-index 恢复指引收敛为真实的双 CLI host wording

---

## 1. 背景

当前仓库已经在多个共享文档中明确：

- 主维护 CLI 支持面是 `Claude Code + Codex`
- Claude Code 与 Codex 在 post-mutation freshness 上存在真实差异

但 `gitnexus-cli` skill 的 troubleshooting 段落仍保留了单宿主表述：

- `Index is stale after re-analyzing`: `Restart Claude Code to reload the MCP server`

这会留下一个新的文档残留：

- 同一份 skill 前文已经并列讲了 Claude Code / Codex 的 freshness guidance
- 但 troubleshooting 段落又退回成 Claude Code 单宿主恢复路径

因此 residual 仍不在运行时，而在 skill 文档没有把 stale-index 恢复动作同步成双 CLI 语境。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [2026-04-08 GitNexus CLI skill dual CLI freshness convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence.md)
  - 已确认 `gitnexus-cli` skill 必须同时面向 Claude Code 与 Codex 叙述 freshness guidance
- [docs/gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md)
  - 当前 quick-start 已把双 CLI freshness 差异写明
- [.claude/skills/gitnexus/gitnexus-cli/SKILL.md](/opt/claude/GitNexus/.claude/skills/gitnexus/gitnexus-cli/SKILL.md)
  - 当前 source skill troubleshooting 仍写成 `Restart Claude Code`
- [gitnexus/skills/gitnexus-cli.md](/opt/claude/GitNexus/gitnexus/skills/gitnexus-cli.md)
  - package skill 副本存在同样残留

---

## 3. 本轮修复

本轮只做 bounded skill-doc convergence：

- 把 stale-index troubleshooting 从单宿主 wording 改成 host-neutral wording
- 在 source skill 与 package skill 副本中都显式补充：
  - Claude Code：重启 Claude Code
  - Codex：如果现有 MCP 连接仍然显示 stale context，则重启 Codex session
- 在路线图与 OpenSpec 中登记这条 troubleshooting convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 Claude Code / Codex runtime behavior

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不新增 Codex 自动刷新承诺
- 不修改 MCP 协议或 host adapter
- 只把 stale-index troubleshooting wording 收敛到当前双 CLI 支持语境

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence`
  - 返回 `Change '2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence' is valid`
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
- 本轮切片本身仍是纯文档收敛，没有改动任何 `gitnexus` runtime 或 test symbol

---

## 6. 结论

这轮关闭的是 `gitnexus-cli` skill troubleshooting wording drift，而不是新的 host 功能缺陷。

修完后，这两份 skill 文档在 stale-index troubleshooting 上都会明确告诉读者：

- 这是一个通用的 MCP host reconnect 问题
- Claude Code 与 Codex 都有各自对应的恢复动作
- 不再把 Claude Code 单独写成默认唯一恢复路径
