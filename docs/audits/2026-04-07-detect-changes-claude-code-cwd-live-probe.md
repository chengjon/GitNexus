# Detect Changes Claude Code CWD Live Probe

日期：2026-04-07  
范围：Claude Code CLI 在 MCP tool 调用时是否自动注入 `cwd`  
目标：用 live probe 关闭 `detect_changes` 外部宿主矩阵中最重要的一条剩余不确定性。

---

## 1. 背景

此前矩阵 baseline 已经确认：

- Codex：仓内已有实测，默认不能假设自动传 `cwd`
- Claude Code：官方文档显示有 path/worktree 相关信号，但是否自动注入 MCP tool `cwd` 仍未实测

因为本项目明确要求同时支持 Claude Code 与 Codex，所以 Claude Code 是下一条最值得优先关闭的 probe。

---

## 2. 探测方法

本轮使用一个临时 stdio MCP probe server：

- tool 名称：`detect_changes_probe`
- schema：只暴露 `scope` 与可选 `cwd`
- server 侧把收到的原始 `arguments` 直接落盘到 `/tmp/claude_cwd_probe.log`

探测分两次：

1. 当前仓目录：`/opt/claude/GitNexus`
2. 临时 git worktree：`/tmp/claude_cwd_probe_worktree`

两次都要求 Claude：

- 只调用一次 probe tool
- 只显式传 `scope='all'`
- 不自己传 `cwd`

因此如果最终日志里出现 `cwd`，它就应被视为宿主层自动注入，而不是 prompt 诱导。

---

## 3. 结果

### 3.1 仓目录 probe

Claude 最终响应：

```json
{"receivedArguments":{"scope":"all"}}
```

server 日志真值：

```json
{"event":"tool_call","arguments":{"scope":"all"}}
```

### 3.2 git worktree probe

Claude 最终响应：

```json
{"receivedArguments":{"scope":"all"}}
```

server 日志真值：

```json
{"event":"tool_call","arguments":{"scope":"all"}}
```

两次 probe 都没有出现 `cwd` 字段。

---

## 4. 结论

在本机 2026-04-07 的 Claude Code CLI live probe 中：

- Claude Code 会正常连接自定义 MCP server
- Claude Code 会正常调用带可选 `cwd` 的 tool
- 但在我们明确只要求传 `scope='all'` 的情况下，宿主**没有额外自动注入 `cwd`**
- 这个结论在仓目录与临时 git worktree 目录里都成立

因此当前对 GitNexus 的可操作结论是：

- Claude Code 也不能默认假设会自动为 `detect_changes` 补 `cwd`
- 在 worktree / server cwd 不匹配场景下，GitNexus 文档仍应继续要求显式传 `cwd`

---

## 5. 边界说明

这条 probe 证明的是：

- 当前这台机器上的 Claude Code CLI
- 在 `claude -p` 非交互模式
- 通过自定义 MCP stdio server

没有自动注入 `cwd`

它**不直接证明**：

- 所有 Claude Code 版本都永远如此
- interactive TUI 模式一定完全一致

但对当前项目的 host guidance 来说，这已经足以把 Claude Code 从“文档未证实”推进到“当前 CLI live probe 未见自动注入”。

---

## 6. 后续动作

这条 probe 完成后，对当前项目要求的主支持面而言：

- `Codex + Claude Code` 双 CLI host guidance 已闭环
- 共享规则仍然是：multi-repo 显式传 `repo`，worktree / server cwd 不匹配时显式传 `cwd`

如果未来要扩展外部宿主支持，再继续补：

1. Cursor live probe
2. 其他 MCP 客户端按需补充

---

## 7. 相关文档

- [detect-changes host compatibility matrix baseline](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md)
- [detect-changes primary dual CLI host convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)
- [detect-changes worktree review](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md)

---

## 8. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-detect-changes-claude-code-cwd-live-probe
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-detect-changes-claude-code-cwd-live-probe`
  返回 `Change '2026-04-07-detect-changes-claude-code-cwd-live-probe' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  返回：
  - `risk_level = low`
  - `changed_files = 74`
  - `changed_symbols = 0`
  - `affected_processes = 0`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

---

## 9. 最终结论

这条 probe 已把 Claude Code 从“文档存在 path signal 但未验证”推进到：

- 当前 CLI 已 probe
- 在仓目录与临时 git worktree 中都未见自动注入 `cwd`

最终 scope review 也确认：

- 没有新增受影响 symbol
- 没有新增受影响 process
- 本轮仍然只是 host-behavior 审计与治理文档收敛
