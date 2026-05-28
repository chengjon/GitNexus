# Detect Changes Primary Dual CLI Host Convergence

日期：2026-04-07  
范围：`detect_changes` 外部宿主治理收敛  
目标：把当前项目要求的主支持面明确收敛到 `Codex + Claude Code`，并把 Cursor / 其他客户端从“当前残留主债务”降级为按需 follow-up。

---

## 1. 背景

当前仓内关于 `detect_changes` 外部宿主行为，已经有两条关键事实源：

- Codex：仓内既有实测表明当前默认不能假设自动透传 `cwd`
- Claude Code：2026-04-07 当前 CLI live probe 已确认，在仓目录与临时 git worktree 中都未见自动注入 `cwd`

与此同时，项目侧的当前要求也已经明确：

- 本项目主要使用 Claude Code 与 Codex
- 如果要支持 host guidance，必须同时支持这两个 CLI

因此，此时继续把 Cursor live probe 表述成“当前主残留”会造成新的 false-open 叙事。

---

## 2. 当前机器约束

本轮没有伪造 Cursor 实测，而是先检查当前机器是否存在可直接调用的 Cursor CLI：

```bash
which cursor || true
which cursor-agent || true
which code || true
```

结果：三条命令都没有输出。

这意味着：

- 当前机器上没有现成可执行的 Cursor CLI / agent 入口
- 若要继续做 Cursor live probe，需要额外引入新的外部宿主环境
- 在没有这类环境前，不应把 Cursor probe 继续包装成“仓内当前阻塞债务”

---

## 3. 当前可操作结论

对当前项目真正需要覆盖的主支持面而言，`detect_changes` host guidance 已经足够闭环：

- Codex：不能默认假设自动传 `cwd`
- Claude Code：当前 CLI live probe 同样未见自动传 `cwd`
- 共享规则保持不变：
  - multi-repo 场景显式传 `repo`
  - worktree / server cwd 不匹配时显式传 `cwd`
  - 不对任何宿主承诺“肯定会自动补 `cwd`”

因此当前更准确的治理结论是：

- **已闭环**：项目要求的 `Codex + Claude Code` 双 CLI 主支持面
- **保留 follow-up**：Cursor / 其他 MCP 客户端，仅在未来要扩展外部宿主支持时再补 live probe

---

## 4. 文档收敛动作

本轮把上述判断回写到以下事实源：

- `docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md`
- `docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md`
- `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

回写目标只有一个：

- 让“双 CLI 主支持面已闭环”成为当前文档事实
- 不再把未安装、未实测的 Cursor probe 伪装成当前仓库的阻塞性未完成项

---

## 5. 边界说明

本轮不声称：

- Cursor 已被实测验证
- Cursor 一定不会自动传 `cwd`
- 未来永远不需要外部宿主 probe

本轮只声称：

- 对当前项目要求的双 CLI 范围，现有证据已经足够
- Cursor / 其他客户端属于外部扩展支持研究，而不是当前主仓阻塞债务

---

## 6. 相关文档

- [detect-changes host compatibility matrix baseline](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md)
- [detect-changes Claude Code cwd live probe](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md)
- [detect-changes worktree review](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md)

---

## 7. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-detect-changes-primary-dual-cli-host-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-detect-changes-primary-dual-cli-host-convergence`
  返回 `Change '2026-04-07-detect-changes-primary-dual-cli-host-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  返回：
  - `risk_level = low`
  - `changed_files = 74`
  - `changed_symbols = 0`
  - `affected_processes = 0`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`
