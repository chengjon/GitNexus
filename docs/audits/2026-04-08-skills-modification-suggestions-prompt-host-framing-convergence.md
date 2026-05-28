# Skills Modification Suggestions Prompt Host Framing Convergence

日期：2026-04-08  
范围：`docs/gitnexus-skills-modification-suggestions.md`  
目标：把技能修改建议文档中的 MCP prompt 示例收敛为显式 host-specific 表述

---

## 1. 背景

当前仓库已经把主维护 CLI 支持面对外收敛到：

- **主支持面**：`Claude Code + Codex`
- **可选集成面**：其他 MCP host

但 `docs/gitnexus-skills-modification-suggestions.md` 里的 MCP prompts 建议段仍直接写成
`Usage in Claude Code`，且没有补一句 host 边界说明。

这会留下一个轻量但真实的文档残留：

- 读者可能把这段建议误读成“当前 prompt UX 只围绕 Claude Code”
- 也可能反过来误读成“既然项目主支持面包含 Codex，这里等价承诺了 Codex 也有同样的 `@gitnexus` prompt 语法”

因此 residual 不在功能，而在 host-specific prompt wording 的边界不够清晰。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [detect-changes primary dual CLI host convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)
  - 已明确当前项目要求的主支持面是 `Claude Code + Codex`
- [README primary dual CLI framing convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md)
  - 已明确 shared README 的主支持面与可选集成面层级
- [README.md](/opt/claude/GitNexus/README.md)
  - 当前 README 里的 MCP prompt 直接调用示例本身就明确限定在 Claude Code
- [docs/gitnexus-skills-modification-suggestions.md](/opt/claude/GitNexus/docs/gitnexus-skills-modification-suggestions.md)
  - 当前建议文档缺少显式 host-specific prompt 边界说明

---

## 3. 本轮修复

本轮只做 bounded doc wording convergence：

- 把建议中的 MCP prompt 调用段改成更明确的 `Prompt Invocation Example`
- 显式声明 `@gitnexus ...` 是 Claude Code specific host example
- 明确说明 Codex 仍属于主支持面，但此处不应顺带承诺同等 direct prompt syntax
- 在路线图与 OpenSpec 中登记这条 prompt-host framing convergence

本轮不改：

- `.claude/skills/gitnexus/**`
- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 host runtime / prompt implementation

---

## 4. 风险边界

这轮仍然只是文档 truth-sync：

- 不新增 Codex prompt UX 承诺
- 不删除 Claude Code 的 prompt 示例
- 只把建议文档的 host-specific 边界写清楚

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence`
  返回 `Change '2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence' is valid`
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
- 它不等于本轮 prompt-host framing convergence 自身引入了新的运行时 blast radius
- 本轮实际修改范围仍然只落在文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 prompt-host wording drift，而不是新的 CLI 功能缺陷。

修完后，该建议文档会更准确地表达：

- `Claude Code + Codex` 仍是当前仓库主支持面
- `@gitnexus ...` 这种直接 prompt 调用示例在这里是 Claude Code-specific example
