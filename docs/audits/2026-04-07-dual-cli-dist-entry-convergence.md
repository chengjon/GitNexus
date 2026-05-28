# GitNexus Dual CLI Dist Entry Convergence

日期：2026-04-07  
范围：`gitnexus` 本地 `dist/cli` 直连入口  
目标：确保仓库文档引用的 `node dist/cli/index.js ...` 本地入口，与当前 Claude Code / Codex 双 CLI 源码行为一致

---

## 1. 背景

2026-04-06 这一轮双 CLI 收敛切片已经把以下源码面收紧到当前事实：

- `gitnexus/src/cli/index.ts`
  - `setup --help` 明确列出 `Codex`
- `gitnexus/src/cli/doctor.ts`
  - `doctor --host codex|claude-code` 输出 worktree / `cwd` guidance
- `gitnexus/src/cli/host-adapters/*.ts`
  - Claude Code / Codex 的 manual MCP 命令统一从真实 `McpEntry` 派生

但仓库同时明确教用户直接运行：

```bash
node /opt/claude/GitNexus/gitnexus/dist/cli/index.js ...
```

而根 `.gitignore` 忽略 `dist/`，这意味着：

- `gitnexus/dist` 是本地 build 产物，不参加当前仓库的 git scope 统计
- 源码已经收敛，不代表本地 `dist` 入口已经被刷新
- 如果操作者直接依赖 `dist/cli/index.js`，仍可能命中旧行为

---

## 2. 本轮确认到的残留

在本轮 refresh 之前，对 `gitnexus/dist/cli` 的文本检查显示本地 `dist` 入口仍停留在旧状态：

- `dist/cli/index.js`
  - `setup` 描述仍是 `Cursor, Claude Code, OpenCode`
  - 未包含 `Codex`
- `dist/cli/host-adapters/claude-code.js`
  - 仍使用旧的硬编码 manual MCP 字符串
- `dist/cli/host-adapters/codex.js`
  - 仍使用旧的硬编码 manual MCP 字符串
- `dist/cli/doctor.js`
  - 尚未带上新的 `host-detect-changes-guidance`

结论：

- 这不是新的源码缺陷
- 这是一个典型的“源码已收敛，但本地分发入口未刷新”的残留问题

---

## 3. 修复动作

本轮不再改业务源码，只做本地分发入口刷新：

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build
```

本次动作的性质是：

- 刷新本地 `dist/` 运行时入口
- 让直接 `node dist/cli/index.js ...` 的路径重新与源码对齐
- 不引入新的产品能力，不改动双 CLI 行为契约

---

## 4. 验证

已执行：

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build

node dist/cli/index.js setup --help
node dist/cli/index.js doctor --json --host codex --repo .
node dist/cli/index.js doctor --json --host claude-code --repo .

rg -n "Claude Code, Codex|host-detect-changes-guidance|formatManualMcpAddCommand" \
  dist/cli -S

npx vitest run test/unit/doctor.test.ts test/unit/host-adapters.test.ts --config vitest.config.ts
npx vitest run test/integration/cli-e2e.test.ts \
  --config vitest.integration.config.ts \
  --testNamePattern "shows Codex in setup help because setup supports the dual CLI workflow"
```

结果：

- `npm run build` 通过
- `node dist/cli/index.js setup --help` 现在显示：
  - `One-time setup: configure MCP for Cursor, Claude Code, Codex, OpenCode`
- `node dist/cli/index.js doctor --json --host codex --repo .`
  - 输出 `host-detect-changes-guidance`
  - guidance 明确要求多仓显式传 `repo`，worktree / server cwd 不一致时显式传 `cwd`
- `node dist/cli/index.js doctor --json --host claude-code --repo .`
  - 同样输出 `host-detect-changes-guidance`
  - guidance 明确要求在 server cwd 与 active worktree 不一致时传 `cwd`
- `rg` 结果确认 `dist/cli` 现在包含：
  - `Claude Code, Codex`
  - `formatManualMcpAddCommand`
  - `host-detect-changes-guidance`
- `vitest` 结果：
  - `test/unit/doctor.test.ts` + `test/unit/host-adapters.test.ts`：`28` 个测试通过
  - `test/integration/cli-e2e.test.ts` 定向 setup help 验证：`1` 个目标测试通过

---

## 5. 结论

这次 residual 的本质是：

- 双 CLI 主线源码已经正确
- 但本地 `dist` 入口因为是 ignored build artifact，可能落后于源码

因此当前的收敛规则应补充为：

- 只要 `gitnexus/src/cli/index.ts`、`gitnexus/src/cli/doctor.ts`、`gitnexus/src/cli/host-adapters/*` 发生双 CLI 相关变更
- 且操作者仍需要依赖仓库文档中的 `node dist/cli/index.js ...` 路径
- 就必须先重新执行 `npm run build`，再宣称本地直连入口已经同步

这条修复属于本地分发入口收敛，不是新的产品功能切片。
