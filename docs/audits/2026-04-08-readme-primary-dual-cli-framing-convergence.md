# README Primary Dual CLI Framing Convergence

日期：2026-04-08  
范围：`README.md`、`gitnexus/README.md`  
目标：把共享 README 的宿主支持表述收敛为“主支持面是 `Claude Code + Codex`，其他 MCP host 为可选集成面”

---

## 1. 背景

仓内治理结论已经明确：

- 当前项目要求的主支持面是 `Claude Code + Codex`
- Cursor / 其他 MCP 客户端属于 optional external follow-up，而不是当前主仓阻塞债务

但根 `README.md` 与 `gitnexus/README.md` 仍把 `Cursor / Windsurf / OpenCode`
与 `Claude Code / Codex` 放在同一层文案里，容易让读者误解为：

- 仓库当前同等维护所有 host 行为
- “主支持面”与“可选 MCP 集成”没有优先级差异

因此 residual 不在功能，而在 shared entry docs 的 framing drift。

---

## 2. 事实源

本轮直接使用以下 truth sources：

- [detect-changes primary dual CLI host convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)
  - 已明确主支持面是 `Codex + Claude Code`
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已登记当前项目要求的 `Codex + Claude Code` 双 CLI 主支持面已闭环
- [README.md](/opt/claude/GitNexus/README.md)
  - 当前仍混合 primary pair 与 optional integrations
- [gitnexus/README.md](/opt/claude/GitNexus/gitnexus/README.md)
  - package README 也存在同类 framing 混合

---

## 3. 本轮修复

本轮只做 bounded README framing convergence：

- 在根 README 与 package README 中显式声明 primary maintained CLI surface
- 把 Claude Code / Codex 调整为编辑器支持矩阵中的优先顺序
- 把 Cursor / Windsurf / OpenCode 保留为可选 MCP integrations，而不是删除
- 在 manual setup 段落里区分“主支持面”与“可选集成面”
- 在路线图中登记这条 shared-doc convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- 任何 host runtime / MCP 行为

---

## 4. 风险边界

这轮仍然只是共享文档收敛：

- 不收缩实际可用的 MCP 配置入口
- 不声称 Cursor / Windsurf / OpenCode 被移除支持
- 只修 shared README 对主支持面与可选集成面的表达层级

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-readme-primary-dual-cli-framing-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-readme-primary-dual-cli-framing-convergence`
  返回 `Change '2026-04-08-readme-primary-dual-cli-framing-convergence' is valid`
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
- 它不等于本轮 README framing convergence 自身引入了新的 host blast radius
- 本轮实际修改范围仍然只落在共享文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 shared README framing drift，而不是 host 功能缺陷。

修完后，仓库入口文档会更明确地区分：

- **主支持面**：`Claude Code + Codex`
- **可选集成面**：Cursor / Windsurf / OpenCode 等 MCP host
