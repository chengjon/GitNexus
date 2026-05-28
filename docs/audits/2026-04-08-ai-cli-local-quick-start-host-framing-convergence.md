# AI CLI Local Quick Start Host Framing Convergence

日期：2026-04-08  
范围：`docs/ai-cli-local-quick-start.md`  
目标：把本地 AI CLI quick start 的 host scope 明确收敛到当前仓库要求的主支持面

---

## 1. 背景

共享 README 与二级入口文档已经完成一轮 host-framing 收敛，当前仓库对外的
主维护 CLI 支持面已经明确为：

- **主支持面**：`Claude Code + Codex`
- **可选集成面**：其他 MCP host

但 `docs/ai-cli-local-quick-start.md` 作为一级入口文档，仍只有通用
`AI agents, AI CLIs, and local coding assistants` 表述，缺少清晰的 host scope
边界。

这会留下一个轻量但真实的文档残留：读者可能把这份 local quick start 误读成
对所有外部 MCP host 的同层支持承诺，而不是当前本地 fork 实际维护的双 CLI
主路径说明。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [README primary dual CLI framing convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md)
  - 已明确 shared README 的主支持面与可选集成面
- [Secondary entrypoint host framing convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-secondary-entrypoint-host-framing-convergence.md)
  - 已明确 quick-start guide / eval README 的分层表述
- [detect-changes primary dual CLI host convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)
  - 已确认当前仓库要求的主支持面是 `Claude Code + Codex`
- [docs/ai-cli-local-quick-start.md](/opt/claude/GitNexus/docs/ai-cli-local-quick-start.md)
  - 当前一级入口文档仍缺少显式 host-scope 边界

---

## 3. 本轮修复

本轮只做 bounded doc wording convergence：

- 给 `docs/ai-cli-local-quick-start.md` 增加明确的 `Host Scope` 段落
- 说明当前本地 fork 的主维护 CLI 支持面对内/对外应理解为
  `Claude Code + Codex`
- 继续保留该文档对两个受维护 CLI 的本地 MCP 期望说明
- 在 `Host Expectations` 段落前补一句边界说明，避免读者误读
- 在路线图与 OpenSpec 中登记这条 quick-start host-scope convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 host runtime / MCP behavior
- 任何外部 host 配置实现

---

## 4. 风险边界

这轮仍然只是文档层 truth-sync：

- 不删除任何已有主机能力
- 不扩大也不缩小实际运行时支持范围
- 只把一级 local quick start 的 framing 调整到和当前仓库治理结论一致

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-ai-cli-local-quick-start-host-framing-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-ai-cli-local-quick-start-host-framing-convergence`
  返回 `Change '2026-04-08-ai-cli-local-quick-start-host-framing-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 106`
  - `changed_count = 268`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 local quick-start convergence 自身引入了新的运行时 blast radius
- 本轮实际修改范围仍然只落在文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 local quick start host-scope drift，而不是新的运行时支持缺陷。

修完后，`docs/ai-cli-local-quick-start.md` 会与当前仓库其他入口文档保持一致：

- **主支持面**：`Claude Code + Codex`
- **可选集成面**：generic MCP setup 下的其他外部 host
