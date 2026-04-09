# Detect Changes Host Compatibility Matrix Baseline

日期：2026-04-07
范围：`detect_changes` 在外部宿主 / MCP 客户端中的 `cwd` 透传研究基线
目标：把“外部宿主兼容性矩阵待补”收敛为一份可复用的官方文档 + 仓内实测基线，明确哪些结论已经成立，哪些仍需 live probe。

---

## 1. 背景

截至上一轮 truth-sync，`detect_changes` worktree 文档只剩一个真实开放项：

- 外部宿主兼容性矩阵

这个开放项本身需要拆开看：

- 哪些宿主官方文档已经明确说明了相关能力
- 哪些只是有旁证（例如 hooks cwd、MCP Roots、server startup `cwd`）
- 哪些仍然没有官方说明、只能靠 live probe

---

## 2. 研究方法

本轮只做 baseline research，不做主机端 live probe。

证据来源分两类：

1. 官方文档
   - Claude Code MCP / Hooks 文档
   - Codex MCP 文档
   - Cursor MCP 文档
2. 仓内已有实测结论
   - `detect_changes` worktree review 中的 Codex 实测结果

---

## 3. 兼容性矩阵基线

| 宿主 | 官方文档确认 MCP 支持 | 官方文档确认工作区/路径信号 | 官方文档是否明确“自动把 active cwd 作为 MCP tool 参数传入” | 当前 GitNexus 结论 |
|------|------------------------|------------------------------|--------------------------------------------------------------|--------------------|
| Codex | 是 | 部分是：MCP server config 支持 `cwd`，但这是**server 启动目录** | 未发现 | **已知不能默认假设自动透传**；仓内既有实测表明当前 Codex host 默认不会自动传 `cwd` |
| Claude Code | 是 | 部分是：hooks 暴露 `cwd`、`CLAUDE_PROJECT_DIR`、worktree path | 未发现 | **当前 CLI live probe 未见自动透传**；仓目录与临时 git worktree 中都只收到 `scope` |
| Cursor | 是 | 部分是：官方文档声明支持 MCP `Roots` capability | 未发现 | 官方文档只提供 workspace boundary 旁证；当前项目未把 Cursor 纳入主支持面，如未来扩展外部宿主再补 live probe |
| 其他 MCP 客户端 | 不定 | 不定 | 不定 | 当前不在主支持面，保持 unknown |

---

## 4. 逐项结论

### 4.1 Codex

官方 Codex MCP 文档确认：

- CLI 与 IDE extension 共享 MCP 配置
- stdio server 可以在 `config.toml` 中配置 `cwd`

但这条 `cwd` 是：

- server 的**启动工作目录**
- 不是官方文档明确承诺的“每次 tool call 自动注入 active worktree cwd”

与此同时，仓内既有 review 已记录 Codex 实测：

- 默认 `detect_changes({scope: "all"})` 不会自动得到目标 worktree 的 `cwd`
- 显式传入 `cwd` 后，`path_resolution` 才转为 `cwd_worktree`

因此当前可操作结论是：

- 对 Codex，GitNexus 必须继续保留显式 `cwd` guidance
- 在多 worktree / server cwd 不匹配场景下，不能假设 Codex 会自动帮我们补这个参数

### 4.2 Claude Code

Claude Code MCP 文档确认：

- 支持本地 / project / user scope 的 MCP server 配置

Claude Code Hooks 文档同时确认：

- hook payload 里存在 `cwd`
- hooks 可使用 `$CLAUDE_PROJECT_DIR`
- WorktreeCreate / WorktreeRemove 流程中有明确的 worktree path 信号

这说明 Claude Code **具备 path-aware host signal**，但我们本轮没有找到官方文档明确写出：

- MCP tool 调用会自动把 active cwd 注入到 arbitrary tool params

因此当前可操作结论是：

- Claude Code 不应被标记为“已验证自动透传 `cwd`”
- 但它比“完全无路径信号”的宿主更接近可验证状态
- 下一步需要 live probe，而不是继续基于文档做推断

### 4.3 Cursor

Cursor MCP 文档确认：

- 支持 MCP
- 支持 `Roots`

`Roots` 的官方定义是：

- server 可发起对 URI / 文件系统边界的查询

这说明 Cursor 至少在协议层承认 workspace boundary 这类信息是可用的。

但本轮没有找到官方文档明确写出：

- Cursor 会在每次 MCP tool 调用时自动向工具参数注入 active `cwd`

因此当前可操作结论是：

- Cursor 不能被直接标成“已验证支持 GitNexus 所需的 `cwd` 透传”
- 但可被标为“具有相关协议能力旁证（Roots）”
- 真正确认仍需 live probe

---

## 5. 当前可落地判断

基于官方文档、仓内实测与 Claude Code live probe，本轮可以把旧的模糊 TODO 改写成更严格的边界：

- **已确认**：
  - GitNexus handler 侧 `cwd` 解析逻辑正确
  - Codex 当前不能默认假设自动传 `cwd`
  - Claude Code 当前 CLI live probe 未见自动传 `cwd`
  - 对当前项目要求的 `Codex + Claude Code` 双 CLI 主支持面，host guidance 已闭环
- **仍未确认但非阻塞**：
  - Cursor MCP tool 调用是否自动传 `cwd`
  - 其他 MCP 客户端行为

---

## 6. 后续动作建议

如果未来继续推进外部客户端研究，不应再叫“矩阵待补”，而应拆成明确的 external follow-up：

1. Cursor live probe
2. 其他 MCP 客户端按需补充

但对当前项目主支持面而言，现有共享文档和 doctor guidance 已足够保持保守且可执行的规则：

- multi-repo 显式传 `repo`
- worktree / server cwd 不匹配时显式传 `cwd`
- 不对任何宿主做“肯定会自动帮你透传 cwd”的承诺

相关收敛记录见：

- [detect-changes Claude Code cwd live probe](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md)
- [detect-changes primary dual CLI host convergence](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)

---

## 7. 官方来源

- Claude Code MCP: <https://docs.anthropic.com/en/docs/claude-code/mcp>
- Claude Code Hooks: <https://docs.anthropic.com/en/docs/claude-code/hooks>
- Codex MCP: <https://developers.openai.com/codex/mcp>
- Cursor MCP: <https://docs.cursor.com/context/model-context-protocol>

---

## 8. 仓内来源

- [detect-changes worktree review](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md)

---

## 9. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-detect-changes-host-compatibility-matrix-baseline
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-detect-changes-host-compatibility-matrix-baseline`
  返回 `Change '2026-04-07-detect-changes-host-compatibility-matrix-baseline' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  返回：
  - `risk_level = low`
  - `changed_files = 68`
  - `changed_symbols = 0`
  - `affected_processes = 0`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

---

## 10. 结论

这轮已经把“外部宿主兼容性矩阵待补”收敛成一份明确 baseline：

- Codex：文档边界已核对，仓内也已有“默认不会自动传 `cwd`”的实测
- Claude Code：文档显示存在路径信号，但是否自动注入 MCP tool `cwd` 仍需 live probe
- Cursor：文档显示支持 Roots，但是否自动注入 MCP tool `cwd` 仍需 live probe

最终 scope review 也确认：

- 没有新增受影响 symbol
- 没有新增受影响 process
- 本轮仍然只是 research / review / governance 文档收敛
