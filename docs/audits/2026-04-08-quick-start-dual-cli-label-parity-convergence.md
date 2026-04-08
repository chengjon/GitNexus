# Quick Start Dual CLI Label Parity Convergence

日期：2026-04-08  
范围：`docs/gitnexus-quick-start-guide.md`  
目标：把 quick-start guide 中对 `Claude Code + Codex` 的主支持面标签收敛到同一层级

---

## 1. 背景

`docs/gitnexus-quick-start-guide.md` 已经通过 earlier host-framing slice 明确：

- **主支持面**：`Claude Code + Codex`
- **可选集成面**：Cursor / Windsurf 等其他 host

但配置段仍保留了一个容易造成层级漂移的细节：

- 标题写成 `Claude Code（完整支持）`
- `Codex` 标题则没有对应并列说明

这会让读者重新把双 CLI 主支持面误读成“Claude Code 是完整主支持，Codex 是次级支持”。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [docs/gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md)
  - 当前已完成主支持面 framing，但仍有单边标签残留
- [secondary entrypoint host framing convergence 审计](/opt/claude/GitNexus/docs/audits/2026-04-08-secondary-entrypoint-host-framing-convergence.md)
  - 已明确 quick-start guide 应与 `Claude Code + Codex` 双 CLI 主支持面保持同一层级
- [2026-03-24 技术债路线图](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 当前治理入口

---

## 3. 本轮修复

本轮只做 bounded label-parity convergence：

- 去掉 `Claude Code（完整支持）` 这类单边层级暗示
- 显式补一句说明：`Claude Code` 与 `Codex` 的差异是宿主 UX / 自动化行为差异，而不是支持层级差异
- 在路线图与 OpenSpec 中登记这条 quick-start label convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- MCP 命令示例
- 任何 host runtime behavior

---

## 4. 风险边界

这轮仍然只是文档表述收敛：

- 不改支持矩阵
- 不新增 CLI 能力
- 只修 quick-start guide 细节标签与双 CLI 主支持面结论之间的漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-quick-start-dual-cli-label-parity-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-quick-start-dual-cli-label-parity-convergence`
  - 返回 `Change '2026-04-08-quick-start-dual-cli-label-parity-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - 直接返回：
    - `risk_level = critical`
    - `changed_files = 112`
    - `changed_count = 272`
    - `affected_count = 56`
    - `git_repo_path = /opt/claude/GitNexus`
    - `git_diff_path = /opt/claude/GitNexus`
    - `process_cwd = /opt/claude/GitNexus`
    - `path_resolution = cwd_worktree`
    - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码与文档改动放大
- 它不等于本轮 quick-start label convergence 自身引入了新的 host blast radius
- 本轮实际修改范围仍然只落在文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 quick-start guide 的 label-parity drift，而不是新的宿主支持缺陷。

修完后，quick-start 会继续保留 `Claude Code` 与 `Codex` 的实际 UX 差异说明，
但不再通过标题标签暗示它们属于不同支持层级。
