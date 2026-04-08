# README Dual CLI Integration Depth Convergence

日期：2026-04-08  
范围：`README.md`、`gitnexus/README.md`  
目标：把 shared README 中 `Claude Code + Codex` 的差异表述收敛为 integration depth / automation 差异，而不是 support-tier split

---

## 1. 背景

仓内治理已经明确：

- 当前主维护 CLI 支持面是 `Claude Code + Codex`
- Claude Code 的差异主要来自更深的宿主侧集成与自动化
- 这不应被写成“Codex 只是次级支持”

但 shared README 仍残留一组容易误读的词：

- 支持矩阵列名写成 `Support`
- `Claude Code` 行值写成 `Full`
- manual setup 标题直接写成 `full support`

这些表述会把已经完成的 dual-CLI framing 再次拉回 support-tier 语义。

---

## 2. 事实源

本轮直接复用以下 truth sources：

- [README primary dual CLI framing convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md)
  - 已确认 shared README 的主支持面应该是 `Claude Code + Codex`
- [Quick start dual CLI label parity convergence](/opt/claude/GitNexus/docs/audits/2026-04-08-quick-start-dual-cli-label-parity-convergence.md)
  - 已确认差异应表述为宿主 UX / 自动化差异，而不是支持层级
- [README.md](/opt/claude/GitNexus/README.md)
  - 当前仍保留 `Support` / `Full` / `full support` 词汇
- [gitnexus/README.md](/opt/claude/GitNexus/gitnexus/README.md)
  - package README 也保留同类 wording drift

---

## 3. 本轮修复

本轮只做 bounded wording convergence：

- 把 support table 列名从 `Support` 改成 `Integration Profile`
- 把 `Claude Code` 的 `Full` 改成更具体的 `MCP + Skills + Hooks`
- 保留 `Codex` 为 `MCP`，但明确它仍属于主维护 CLI 支持面
- 在 shared README note 中补一句：差异属于 integration depth / automation，而不是 support-tier status
- 同步修 manual setup 标题，让 `Claude Code` 与 `Codex` 都被表达为 primary maintained CLI
- 在路线图与 OpenSpec 中登记这条 convergence

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- MCP 命令示例
- host runtime behavior

---

## 4. 风险边界

这轮仍然只是 shared README wording convergence：

- 不改变任何实际 CLI 能力矩阵
- 不移除其他 MCP host 的可选集成文档
- 只修 support-tier 词汇残留

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-readme-dual-cli-integration-depth-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-readme-dual-cli-integration-depth-convergence`
  - 返回 `Change '2026-04-08-readme-dual-cli-integration-depth-convergence' is valid`
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
- 它不等于本轮 README wording convergence 自身引入了新的 runtime blast radius
- 本轮实际修改范围仍然只落在 shared README、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 shared README 里的 support-tier wording residual，而不是新的宿主功能缺陷。

修完后，入口 README 会更明确地区分：

- `Claude Code`：当前更深的宿主侧集成与自动化
- `Codex`：同属主维护 CLI 支持面，但当前 setup / automation 更轻
- 两者差异是 integration depth，不是 support tier
