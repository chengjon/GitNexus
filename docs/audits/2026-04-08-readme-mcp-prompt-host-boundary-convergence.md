# README MCP Prompt Host Boundary Convergence

日期：2026-04-08  
范围：`README.md`  
目标：把根 README 里的 MCP prompt 直接调用示例收敛为显式 host-specific 边界表述

---

## 1. 背景

当前仓库已经把主维护 CLI 支持面对外收敛为：

- **主支持面**：`Claude Code + Codex`
- **可选集成面**：其他 MCP host

根 README 的 host framing 本身已经完成一轮收敛，但 MCP prompt 段仍只写了：

- `In Claude Code with GitNexus MCP configured, invoke prompts directly`
- `@gitnexus detect_impact`
- `@gitnexus generate_map`

这会留下一个小但真实的表述残留：

- 它虽然正确地限定了 Claude Code 示例
- 但还没有补一句“这是 host-specific prompt syntax，不等价承诺 Codex 也暴露同样 UX”

因此 residual 不在 MCP prompt 功能，而在入口 README 的 prompt-host boundary 说明不够完整。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [detect-changes primary dual CLI host convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)
  - 已明确当前项目要求的主支持面是 `Claude Code + Codex`
- [README primary dual CLI framing convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md)
  - 已明确 shared README 应区分 primary pair 与 optional integrations
- [Skills modification suggestions prompt host framing convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence.md)
  - 已明确 `@gitnexus ...` 类 direct prompt syntax 应写成 host-specific example
- [README.md](/opt/claude/GitNexus/README.md)
  - 当前 prompt 段缺少显式 host-boundary 补句

---

## 3. 本轮修复

本轮只做 bounded README wording convergence：

- 在根 README 的 MCP prompt 段补一句 host-boundary 说明
- 明确 `@gitnexus ...` 是 Claude Code specific host example
- 明确 Codex 仍属于主支持面，但此处不应顺带承诺等价 prompt UX
- 在路线图与 OpenSpec 中登记这条 prompt-boundary convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- `gitnexus/README.md`
- 任何 host runtime / prompt implementation

---

## 4. 风险边界

这轮仍然只是 README truth-sync：

- 不新增 Codex prompt UX 承诺
- 不删除 Claude Code prompt 示例
- 只把入口 README 的 host-specific boundary 写清楚

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-readme-mcp-prompt-host-boundary-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-readme-mcp-prompt-host-boundary-convergence`
  返回 `Change '2026-04-08-readme-mcp-prompt-host-boundary-convergence' is valid`
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
- 它不等于本轮 README prompt-boundary convergence 自身引入了新的运行时 blast radius
- 本轮实际修改范围仍然只落在 README、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 README MCP prompt host-boundary drift，而不是新的 host 功能缺陷。

修完后，根 README 会更准确地表达：

- `Claude Code + Codex` 仍是当前仓库主支持面
- `@gitnexus ...` 这种 direct prompt syntax 在这里是 Claude Code-specific example
