# MCP Mmap Root Cause And Runtime Drain Audit

日期：2026-04-08  
范围：`gitnexus/src/mcp/repo-worker.ts`、`gitnexus/src/mcp/repo-worker-manager.ts`、`gitnexus/src/runtime/mcp-process-registry.ts`、`gitnexus/src/cli/platform-process-scan.ts` 及对应测试  
目标：把 `Buffer manager exception: Mmap for size 8796093022208 failed.` 的根因、修复路径、实测验证与剩余宿主边界沉淀为仓库内可复查审计记录。  
治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)

---

## 1. 结论

这次故障的核心不在索引文件本身，而在宿主机长期驻留的 GitNexus repo-worker
进入异常 native 状态后被反复复用，同时当前本地 fork 的 MCP drain / liveness
控制面又依赖 `process.kill(pid, 0)` 与 `SIGUSR1`，在 `bwrap --unshare-pid`
环境下无法把 host PID 当作可靠真相源。

修复后，以下三条链路已经实测打通：

- 发生 fatal native error 时，坏 worker 会被回收并自动重建，而不是无限复用
- `mcp drain` 不再只依赖 signal，可通过共享文件控制面命中 worker
- `analyze -f` 原始持锁重建路径已经成功走通，不再卡在 `Mmap for size ... failed`

---

## 2. 证据分类

### 2.1 Measured

- `scope: /opt/claude/GitNexus, time: 2026-04-08`
  新构建的 `gitnexus` 命令实际解析到
  [dist/cli/index.js](/opt/claude/GitNexus/gitnexus/dist/cli/index.js)，不是外部旧包：
  - `which gitnexus` -> `/root/.nvm/versions/node/v24.7.0/bin/gitnexus`
  - `readlink -f "$(which gitnexus)"` ->
    `/opt/claude/GitNexus/gitnexus/dist/cli/index.js`

- `scope: repo-worker native integration, time: 2026-04-08`
  以下测试通过：
  ```bash
  cd /opt/claude/GitNexus/gitnexus
  npx vitest run --config vitest.integration.native.config.ts \
    test/integration/repo-worker.test.ts \
    test/integration/router-backend-worker.test.ts
  ```
  结果：
  - `2` 个测试文件通过
  - `8` 个测试通过
  - 覆盖 `SIGUSR1` drain、runtime command drain、repo-local command drain

- `scope: unit verification, time: 2026-04-08`
  以下测试通过：
  ```bash
  cd /opt/claude/GitNexus
  npx vitest run \
    gitnexus/test/unit/analyze-scope.test.ts \
    gitnexus/test/unit/mcp-process-registry.test.ts \
    gitnexus/test/unit/mcp-command.test.ts
  ```
  结果：
  - `3` 个测试文件通过
  - `29` 个测试通过

- `scope: build verification, time: 2026-04-08`
  ```bash
  cd /opt/claude/GitNexus/gitnexus
  npm run build
  ```
  结果：
  - `tsc` 构建通过

- `scope: sandbox drain E2E on fresh worker, time: 2026-04-08`
  在同一 sandbox 内新拉起 repo-worker 后，再执行 `mcp drain`，返回：
  - `requestedPids = [10]`
  - `acknowledgedPids = [10]`
  - `completedPids = [10]`
  - `waitTimedOut = false`
  且 worker 退出码为 `0`，registry 记录清空。

- `scope: live GitNexus repo worker, time: 2026-04-08`
  对根仓库执行：
  ```bash
  cd /opt/claude/GitNexus/gitnexus
  node dist/cli/index.js mcp drain --repo /opt/claude/GitNexus --json
  ```
  实测返回过两次成功结果：
  - 一次排空旧坏 worker：`requested=[514761,719780]`
  - 一次排空新拉起 worker：`requested=[1484194]`
  两次均为 `acknowledged == completed` 且 `waitTimedOut = false`

- `scope: forced reindex path, time: 2026-04-08`
  ```bash
  cd /opt/claude/GitNexus
  node gitnexus/dist/cli/index.js analyze -f --no-register
  ```
  结果：
  - 先输出 `Drained 1 GitNexus MCP process(es) holding /opt/claude/GitNexus/.gitnexus/kuzu`
  - 然后成功输出 `Repository indexed successfully (10.3s)`
  - 未再出现 `Buffer manager exception: Mmap for size 8796093022208 failed.`

- `scope: refreshed CLI graph tooling, time: 2026-04-08`
  以下直连 CLI 查询都已恢复可用：
  ```bash
  node gitnexus/dist/cli/index.js context mcpCommand -r GitNexus
  node gitnexus/dist/cli/index.js impact startRepoWorkerProcess --direction upstream -r GitNexus --include-tests
  node gitnexus/dist/cli/index.js impact writeMcpProcessCommand --direction upstream -r GitNexus --include-tests
  ```

### 2.2 Inferred

- `scope: root cause analysis, time: 2026-04-08`
  真正触发 `Mmap for size 8796093022208 failed` 的主因是：
  - 宿主机 repo-worker native 状态已坏
  - 但 router 继续复用该坏 worker
  - drain / liveness 逻辑又把 PID 可见性误当作可置信控制面
  因而导致坏进程既排不干净，也会持续命中。

- `scope: host compatibility, time: 2026-04-08`
  `process.kill(pid, 0)` 在当前 sandbox 里对 host PID 返回 `ESRCH`，
  说明 PID namespace 分裂是本地环境里必须兼容的真实前提，而不是偶发噪音。

- `scope: remaining transport behavior, time: 2026-04-08`
  当前聊天会话内 `mcp__gitnexus__context` 报 `Transport closed`，
  更符合“当前会话绑定的 MCP transport 被手动终止后尚未重建”的宿主连接问题，
  不再指向仓库内 GitNexus 代码本身仍有 `Mmap` 故障。

### 2.3 Historical Baseline

- `scope: original failure baseline, time: 2026-04-06 to 2026-04-08 before repair`
  在修复前，`mcp__gitnexus__context`、`impact`、`cypher` 会持续报：
  ```text
  Buffer manager exception: Mmap for size 8796093022208 failed.
  ```

- `scope: pre-repair process management design, time: 2026-04-05 baseline`
  本地 fork 在以下提交后形成当前问题路径：
  - `0f4bc8b feat: isolate mcp repos in per-repo workers`
  - `f0bd8f4 feat: add MCP process registry and cooperative drain`
  - `de3b682 fix(mcp): harden repo worker startup lifecycle`

- `scope: pre-repair CLI behavior, time: 2026-04-08 before runtime command fallback`
  沙箱内执行 `mcp drain` 会因为写 `~/.gitnexus/runtime` 失败而退化，
  典型错误表现为：
  ```text
  Error: ENOENT: no such file or directory, mkdir '/root/.gitnexus/runtime/mcp-commands'
  ```
  或者对旧 worker 返回 `waitTimedOut = true`

---

## 3. 根因链条

### 3.1 不是索引文件损坏

此前已确认：

- Kuzu 数据目录可以被新鲜隔离 worker 正常打开
- 同样的 repo / kuzu 路径在新 worker 上 `context("mcpCommand")` 可成功返回

因此问题不应再归因于“索引已坏”或“数据库文件已永久损坏”。

### 3.2 真问题在长期驻留 host worker

Codex 当前命中的不是一次性新 worker，而是宿主机已经长期存在的 repo-worker。
当该 worker 进入异常 Kuzu native 状态后：

- router 继续把请求路由给它
- 旧 drain 逻辑又无法可靠命中和验证它已退出
- 后续 `context/impact/cypher` 因而反复撞上同一个坏进程

### 3.3 PID namespace 使旧控制面失真

本地环境里已确认：

- shell 文本层能看到 host `ps -ef`
- 但 sandbox 内 Node 的 `process.kill(hostPid, 0)` 会返回 `ESRCH`

这意味着旧逻辑里的三件事都不再可靠：

- `isPidAlive()`
- `SIGUSR1` cooperative drain
- 基于 `/proc/<pid>/fd` 的单一路径 holder 判断

---

## 4. 本轮修复

### 4.1 fatal native error 自愈

在 [repo-worker-manager.ts](/opt/claude/GitNexus/gitnexus/src/mcp/repo-worker-manager.ts)：

- 增加 fatal native error 匹配：
  - `Buffer manager exception`
  - `Mmap for size`
- 命中后自动：
  - 回收当前 worker
  - `SIGTERM` 清理该 worker
  - 自动拉起新 worker
  - 对当前请求重试一次

### 4.2 fresh heartbeat 不再误判 stale/completed

在 [mcp-process-registry.ts](/opt/claude/GitNexus/gitnexus/src/runtime/mcp-process-registry.ts)
与 [platform-process-scan.ts](/opt/claude/GitNexus/gitnexus/src/cli/platform-process-scan.ts)：

- PID 不可见但 heartbeat 仍新鲜时，状态改为 `suspect`
- drain 只有在：
  - PID 不可见
  - 且 heartbeat 不再新鲜
  时才判定 `completed`

### 4.3 文件式 drain 控制面

在 [mcp-process-registry.ts](/opt/claude/GitNexus/gitnexus/src/runtime/mcp-process-registry.ts)
与 [repo-worker.ts](/opt/claude/GitNexus/gitnexus/src/mcp/repo-worker.ts)：

- 新增 `McpProcessCommand`
- 支持写入 / 读取 / 删除 `drain` 命令文件
- repo-worker 定时轮询命令文件
- 命中 `drain` 后切到 `draining` 并在 in-flight 清空后退出

### 4.4 双路径 command delivery

为兼容 sandbox 与 host 视角差异，命令文件现在支持两条路径：

- 全局 runtime：`~/.gitnexus/runtime/mcp-commands`
- repo-local：`<storagePath>/mcp-commands`

在 [platform-process-scan.ts](/opt/claude/GitNexus/gitnexus/src/cli/platform-process-scan.ts)：

- `mcp drain` 会优先尝试 repo-local command
- 同时 best-effort 写入 global runtime command
- signal 失败时，只要命令文件至少有一条成功写入，就不再把整个 drain 视为失败

### 4.5 holder 扫描增加 registry fallback

在 [platform-process-scan.ts](/opt/claude/GitNexus/gitnexus/src/cli/platform-process-scan.ts)：

- `/proc` 或 `lsof` 扫描之外，再把 registry 中匹配当前 `storagePath/kuzu` 的 repo-worker 纳入 holder 集合
- 这样即使看不到 host-side fd，也不会漏掉 GitNexus 自己的持锁 worker

---

## 5. 风险边界

### 5.1 已验证风险

- [repo-worker.ts](/opt/claude/GitNexus/gitnexus/src/mcp/repo-worker.ts)
  的 upstream `impact` 仍是 `CRITICAL`
- 直接 d=1 调用者是
  [mcp.ts](/opt/claude/GitNexus/gitnexus/src/cli/mcp.ts)
  中的 `mcpCommand`

因此本轮验证重点放在：

- worker 启停
- drain
- router-backend 转发
- `analyze -f` 强制重建

### 5.2 未继续扩展的范围

本轮没有继续做：

- 宿主侧 transport 管理器实现改造
- `opencode mcp` 层的自动重建机制
- 对所有其他索引仓库的 router/worker 统一治理

---

## 6. 现状与剩余边界

当前仓库内 GitNexus 代码、worker 控制面、强制重建路径已经恢复正常。

剩余边界主要在宿主会话层：

- 本聊天会话原先绑定的 GitNexus MCP transport 在手动终止旧 router 时一起断开
- 因此此会话里的 `mcp__gitnexus__*` 工具目前表现为 `Transport closed`
- 但仓库内直连 CLI 查询、sandbox E2E、新 worker drain、强制 analyze 已全部正常

换句话说：

- 代码问题已收敛
- 当前残余问题属于宿主 MCP transport 生命周期，而不是 GitNexus 仓库内的
  `Mmap` 故障仍未修复

---

## 7. 建议

- 对当前工作树中的这批修复，后续如果要提交，建议在提交说明中把
  `fatal worker recycle`、`file-based drain`、`repo-local command fallback`
  明确写成同一条修复链，而不是拆成不相关小修。
- 若后续仍要继续追“当前聊天宿主如何自动重连 GitNexus MCP transport”，
  应把问题边界切换到宿主平台与 MCP server manager，而不是继续把它当作
  GitNexus 仓库内 Kuzu / index 故障。
