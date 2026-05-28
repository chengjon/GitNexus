# GitNexus vNext P0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把 GitNexus 的下一阶段重点收敛到 `Host Adapter + doctor + index health + analyze 职责拆分`，让它更稳定地服务 `Codex / Claude Code / Cursor / 通用 MCP host`。

**Architecture:** 先抽离 host 集成层，再补统一诊断层，随后把 stale 逻辑升级为 index health，最后收敛 `analyze` 的职责边界。所有改动优先采用 TDD，并尽量保持 CLI 兼容。

**Tech Stack:** TypeScript, Commander, Vitest, MCP stdio, local filesystem config writers

---

## Task 1: 抽离 Host Adapter 基础层

**Files:**
- Create: `gitnexus/src/cli/host-adapters/types.ts`
- Create: `gitnexus/src/cli/host-adapters/shared.ts`
- Create: `gitnexus/src/cli/host-adapters/claude-code.ts`
- Create: `gitnexus/src/cli/host-adapters/codex.ts`
- Create: `gitnexus/src/cli/host-adapters/cursor.ts`
- Create: `gitnexus/src/cli/host-adapters/generic-stdio.ts`
- Modify: `gitnexus/src/cli/setup.ts`
- Modify: `gitnexus/test/unit/cli-commands.test.ts`
- Create: `gitnexus/test/unit/host-adapters.test.ts`

**Step 1: 写失败测试，定义 Host Adapter 目标接口**

在 `gitnexus/test/unit/host-adapters.test.ts` 写用例，至少覆盖：

- `Claude Code` adapter 可返回 manual MCP 配置步骤
- `Codex` adapter 可返回 `codex mcp add gitnexus -- npx -y gitnexus@latest mcp`
- `Cursor` adapter 可返回 `mcp.json` 目标结构
- generic adapter 可返回通用 `command/args` 配置

示例断言：

```ts
expect(adapter.id).toBe('codex');
expect(adapter.getMcpEntry().command).toBe('npx');
expect(adapter.getManualCommand()).toContain('codex mcp add gitnexus');
```

**Step 2: 运行失败测试，确认当前仓库还没有 adapter 层**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/host-adapters.test.ts
```

Expected:

- FAIL，原因是文件或导出尚不存在

**Step 3: 写最小 Host Adapter 抽象与实现**

在 `gitnexus/src/cli/host-adapters/types.ts` 定义：

- `HostAdapter`
- `HostDetectionResult`
- `HostConfigureResult`
- `HostDoctorResult`

在各 adapter 文件里只实现当前需要的最小方法：

- `id`
- `detect()`
- `getMcpEntry()`
- `configure()`
- `manualInstructions()`

先不要做过度抽象，不要引入复杂注册表。

**Step 4: 把 `setup.ts` 改为调 adapter，而不是继续内联所有 host 分支**

最低要求：

- 保持现有 `Cursor / Claude Code / OpenCode` 行为兼容
- 新增 `Codex` 作为正式 host
- 输出中区分：
  - 自动配置完成
  - 需要手动执行
  - 未检测到

**Step 5: 跑单测确认通过**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/host-adapters.test.ts test/unit/cli-commands.test.ts
```

Expected:

- PASS

**Step 6: 提交**

```bash
git add gitnexus/src/cli/host-adapters gitnexus/src/cli/setup.ts gitnexus/test/unit/host-adapters.test.ts gitnexus/test/unit/cli-commands.test.ts
git commit -m "refactor: extract host adapter layer for MCP setup"
```

---

## Task 2: 增加 `gitnexus doctor`

**Files:**
- Create: `gitnexus/src/cli/doctor.ts`
- Modify: `gitnexus/src/cli/index.ts`
- Modify: `gitnexus/src/cli/setup.ts`
- Create: `gitnexus/test/unit/doctor.test.ts`
- Modify: `gitnexus/test/unit/cli-commands.test.ts`

**Step 1: 写失败测试，定义 doctor 最小输出**

在 `gitnexus/test/unit/doctor.test.ts` 写用例，覆盖：

- `doctor --host codex` 能返回 host 检查结果
- repo 未索引时提示 `Run: gitnexus analyze`
- 多项检查结果按结构输出，而不是散乱日志

最小目标结构：

```ts
{
  overall: 'pass' | 'warn' | 'fail',
  checks: [
    { name: 'repo-indexed', status: 'pass' },
    { name: 'registry-entry', status: 'pass' },
    { name: 'host-config', status: 'warn' },
  ]
}
```

**Step 2: 运行失败测试**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/doctor.test.ts
```

Expected:

- FAIL，原因是 `doctor` CLI 不存在

**Step 3: 写最小实现**

在 `gitnexus/src/cli/doctor.ts` 实现：

- `--host <name>`
- `--repo <path>`
- `--json`

初版检查项只做：

- git repo 检测
- index 是否存在
- registry 是否存在对应 entry
- host 配置是否存在
- host 是否需要手工步骤

先不要做真实启动 MCP 子进程验证；留到后续小版本。

**Step 4: 注册新命令**

在 `gitnexus/src/cli/index.ts` 增加：

```ts
program
  .command('doctor')
  .description('Diagnose index, registry, and host MCP readiness')
```

**Step 5: 跑测试**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/doctor.test.ts test/unit/cli-commands.test.ts
```

Expected:

- PASS

**Step 6: 提交**

```bash
git add gitnexus/src/cli/doctor.ts gitnexus/src/cli/index.ts gitnexus/test/unit/doctor.test.ts gitnexus/test/unit/cli-commands.test.ts
git commit -m "feat: add gitnexus doctor for MCP readiness checks"
```

---

## Task 3: 把 stale 升级为 index health

**Files:**
- Modify: `gitnexus/src/mcp/staleness.ts`
- Modify: `gitnexus/src/cli/status.ts`
- Modify: `gitnexus/src/mcp/resources.ts`
- Modify: `gitnexus/src/storage/repo-manager.ts`
- Create: `gitnexus/test/unit/index-health.test.ts`
- Modify: `gitnexus/test/unit/staleness.test.ts`
- Modify: `gitnexus/test/unit/resources.test.ts`
- Modify: `gitnexus/test/unit/repo-manager.test.ts`

**Step 1: 写失败测试，定义新的 health 结果结构**

建议新结构：

```ts
{
  level: 'fresh' | 'warning' | 'degraded' | 'invalid',
  reasons: ['commit-behind', 'dirty-worktree'],
  commitsBehind: 2,
  dirty: true,
}
```

测试点：

- HEAD 一致且工作树干净 -> `fresh`
- HEAD 落后 -> `warning`
- dirty worktree -> `warning` 或 `degraded`
- git 失败 -> `invalid`

**Step 2: 运行失败测试**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/staleness.test.ts test/unit/index-health.test.ts
```

Expected:

- FAIL，因为当前接口仍然只返回 `isStale`

**Step 3: 实现 index health**

在 `gitnexus/src/mcp/staleness.ts`：

- 保留兼容导出或加 wrapper，避免立即打断旧调用
- 增加新主函数，例如 `getIndexHealth()`

在 `gitnexus/src/storage/repo-manager.ts` 的 metadata 里预留：

- `indexedBranch`
- `schemaVersion`
- `toolVersion`

如果当前版本还取不到全部值，也先把字段和默认值铺好。

**Step 4: 把 status 和 resource 输出改成 health 视角**

在 `gitnexus/src/cli/status.ts`：

- 输出 `Health: fresh/warning/degraded`
- 输出原因列表

在 `gitnexus/src/mcp/resources.ts`：

- `context` 资源里不再只写 stale hint
- 改成结构化 health 提示

**Step 5: 跑相关测试**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/staleness.test.ts test/unit/index-health.test.ts test/unit/resources.test.ts test/unit/repo-manager.test.ts
```

Expected:

- PASS

**Step 6: 提交**

```bash
git add gitnexus/src/mcp/staleness.ts gitnexus/src/cli/status.ts gitnexus/src/mcp/resources.ts gitnexus/src/storage/repo-manager.ts gitnexus/test/unit/staleness.test.ts gitnexus/test/unit/index-health.test.ts gitnexus/test/unit/resources.test.ts gitnexus/test/unit/repo-manager.test.ts
git commit -m "feat: introduce index health model"
```

---

## Task 4: 拆分 `analyze` 的职责边界

**Files:**
- Modify: `gitnexus/src/cli/analyze.ts`
- Modify: `gitnexus/src/cli/index.ts`
- Create: `gitnexus/src/cli/init-project.ts`
- Create: `gitnexus/src/cli/refresh-context.ts`
- Modify: `gitnexus/src/cli/ai-context.ts`
- Modify: `gitnexus/test/unit/cli-commands.test.ts`
- Create: `gitnexus/test/unit/analyze-scope.test.ts`
- Modify: `gitnexus/README.md`
- Modify: `README.md`

**Step 1: 写失败测试，固定 CLI 兼容策略**

测试目标：

- `gitnexus analyze --no-context` 存在
- `gitnexus init-project` 存在
- `gitnexus refresh-context` 存在
- 默认 `analyze` 仍兼容当前行为

**Step 2: 运行失败测试**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/analyze-scope.test.ts test/unit/cli-commands.test.ts
```

Expected:

- FAIL，命令尚未注册

**Step 3: 实现最小职责拆分**

实现策略：

- `analyze` 继续保留现有默认行为
- 新增 flags：
  - `--no-context`
  - `--no-gitignore`
  - `--no-register`
- 新增：
  - `init-project`
  - `refresh-context`

其中：

- `init-project` 负责：
  - `.gitignore`
  - `AGENTS.md / CLAUDE.md`
  - repo skills
- `refresh-context` 只负责：
  - context 文件和 skills 更新

**Step 4: 更新 README**

在两个 README 中明确：

- `analyze` 的核心职责
- 何时使用 `init-project`
- 何时使用 `refresh-context`
- `setup` 与 host adapter / doctor 的关系

**Step 5: 跑测试和基础构建**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- test/unit/analyze-scope.test.ts test/unit/cli-commands.test.ts test/unit/ai-context.test.ts
npm --prefix /opt/claude/GitNexus/gitnexus run build
```

Expected:

- Tests PASS
- Build PASS

**Step 6: 提交**

```bash
git add gitnexus/src/cli/analyze.ts gitnexus/src/cli/index.ts gitnexus/src/cli/init-project.ts gitnexus/src/cli/refresh-context.ts gitnexus/src/cli/ai-context.ts gitnexus/test/unit/analyze-scope.test.ts gitnexus/test/unit/cli-commands.test.ts gitnexus/README.md README.md
git commit -m "refactor: split analyze from project context setup"
```

---

## Task 5: P0 回归与收尾

**Files:**
- Modify: `gitnexus/test/unit/cli-commands.test.ts`
- Modify: `gitnexus/test/unit/resources.test.ts`
- Modify: `gitnexus/test/unit/ai-context.test.ts`
- Optional: `docs/plans/2026-03-11-gitnexus-vnext-optimization-roadmap-design.md`

**Step 1: 跑 P0 相关单测集合**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test -- \
  test/unit/host-adapters.test.ts \
  test/unit/doctor.test.ts \
  test/unit/index-health.test.ts \
  test/unit/analyze-scope.test.ts \
  test/unit/cli-commands.test.ts \
  test/unit/resources.test.ts \
  test/unit/staleness.test.ts \
  test/unit/repo-manager.test.ts \
  test/unit/ai-context.test.ts
```

Expected:

- PASS

**Step 2: 跑一次全量 unit 测试**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test
```

Expected:

- PASS

**Step 3: 跑基础集成回归**

Run:

```bash
npm --prefix /opt/claude/GitNexus/gitnexus run test:integration -- test/integration/cli-e2e.test.ts test/integration/local-backend.test.ts
```

Expected:

- PASS，或只剩与本次改动无关的已知基线问题

**Step 4: 文档回写**

把实现后的实际命令与行为，回写到：

- `README.md`
- `gitnexus/README.md`
- 如有必要，再补 `tmp_exports/` 下对外操作手册

**Step 5: 最终提交**

```bash
git add gitnexus README.md gitnexus/README.md docs/plans/2026-03-11-gitnexus-vnext-optimization-roadmap-design.md docs/plans/2026-03-11-gitnexus-vnext-p0-implementation-plan.md
git commit -m "docs: add GitNexus vNext roadmap and P0 implementation plan"
```

---

## 依赖与风险

### 依赖

- 当前 CLI 命令注册方式保持 `commander + lazy-action`
- 现有测试基线可运行
- 各 host 的配置文件路径和命令格式不发生突变

### 风险

- `setup` 改造过程中容易破坏现有兼容行为
- stale -> health 升级会影响 MCP resource 文本输出
- `analyze` 拆分如果处理不好，会让用户误以为默认行为改变

### 控制策略

- 所有变更先走 unit test
- `analyze` 默认行为第一阶段保持兼容
- `doctor` 第一版先做静态诊断，不急着上真实子进程探测

---

## 完成标准

P0 完成后，GitNexus 至少应达到：

1. `Codex` 被正式纳入 host 集成层
2. `gitnexus doctor` 可用于安装后验证
3. `status` 与 `context` 不再只给出粗糙 stale 提示
4. `analyze` 的职责边界更清晰
5. README 与实际行为更一致
