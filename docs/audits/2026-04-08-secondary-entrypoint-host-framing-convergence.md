# Secondary Entrypoint Host Framing Convergence

日期：2026-04-08  
范围：`docs/gitnexus-quick-start-guide.md`、`eval/README.md`  
目标：把二级入口文档中的 host framing 收敛到当前仓库的主支持面对外结论

---

## 1. 背景

根 `README.md` 与 `gitnexus/README.md` 已经完成一轮主支持面收敛，明确：

- **主支持面**：`Claude Code + Codex`
- **可选集成面**：Cursor / Windsurf / OpenCode 等其他 MCP host

但二级入口文档仍残留旧层级：

- `docs/gitnexus-quick-start-guide.md` 在配置段直接把 Cursor / Windsurf 与
  Claude Code / Codex 并列，未显式说明优先级
- `eval/README.md` 仍写着 “Claude Code / Cursor hook integration”，容易把
  host 类比语句误读成当前仓库对外同层承诺

因此 residual 不在功能，而在 secondary entrypoint docs 的 framing drift。

---

## 2. 事实源

本轮直接使用以下 truth sources：

- [README primary dual CLI framing convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md)
  - 已明确 shared README 的主支持面与可选集成面
- [detect-changes primary dual CLI host convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)
  - 已明确当前仓库要求的主支持面是 `Codex + Claude Code`
- [docs/gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md)
  - 当前仍缺少主支持面对外分层说明
- [eval/README.md](/opt/claude/GitNexus/eval/README.md)
  - 当前仍保留 `Claude Code / Cursor hook integration` 类比措辞

---

## 3. 本轮修复

本轮只做 bounded secondary-entrypoint convergence：

- 给 quick-start guide 增加主支持面与可选集成面的分层说明
- 保留 Cursor / Windsurf 的配置示例，不删除可选集成入口
- 把 eval harness 中的 host 类比改写成更中性的 hook-style augmentation 描述
- 在路线图中登记这条 secondary entrypoint convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- eval harness 运行逻辑
- 任何 host runtime / MCP behavior

---

## 4. 风险边界

这轮仍然只是文档表述收敛：

- 不移除任何现有可选配置示例
- 不新增 host 支持承诺
- 只修 secondary entrypoint docs 与 shared README 结论之间的层级漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-secondary-entrypoint-host-framing-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-secondary-entrypoint-host-framing-convergence`
  返回 `Change '2026-04-08-secondary-entrypoint-host-framing-convergence' is valid`
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
- 它不等于本轮 secondary entrypoint convergence 自身引入了新的 host blast radius
- 本轮实际修改范围仍然只落在文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 secondary entrypoint host-framing drift，而不是运行时支持缺陷。

修完后，quick start 与 eval harness 文档都会和当前仓库的主支持面结论保持同一层级：

- **主支持面**：`Claude Code + Codex`
- **可选/类比宿主**：Cursor / Windsurf / 其他外部 host
