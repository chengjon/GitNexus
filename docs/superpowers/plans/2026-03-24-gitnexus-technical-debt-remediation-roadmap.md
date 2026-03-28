# GitNexus 技术债治理路线图

日期：2026-03-24  
类型：架构 / 工程治理路线图  
范围：`/opt/claude/GitNexus`  
目标：把 GitNexus 当前的技术债从“分散兜底”收敛为“可阶段治理、可验证收敛”的工程计划。

---

## 1. 背景

GitNexus 现在已经具备较强的图谱能力、MCP 暴露能力、多仓库支持、上下文注入和基础 wiki 生成能力。

当前的主要问题已不再是“能不能工作”，而是：

- 能否稳定跨平台运行
- 能否安全承载原生依赖
- 能否在测试和 CI 中保持确定性
- 能否在持续迭代中避免大型热点模块继续膨胀

换句话说，GitNexus 的主要技术债已经从“功能不足”转移为“运行时与工程化边界不够稳固”。

---

## 2. 核心问题总览

### 2.1 P0：原生生命周期治理与测试基建脆弱

当前 Kuzu / ONNX / optional grammar 等原生依赖的生命周期治理，仍然依赖：

- 忽略未处理错误
- 强制 `process.exit(...)`
- 避免显式 close
- 依赖进程退出回收资源
- 测试基建中的 no-op cleanup

这类策略短期有效，但长期会持续制造：

- 难定位的跨平台失败
- 资源释放不确定
- CI 脆弱
- 业务逻辑与原生兜底耦合

### 2.2 P1：热点模块过大、职责缠绕

核心热点模块体积和责任都已偏大：

- `src/mcp/local/local-backend.ts`
- `src/core/ingestion/workers/parse-worker.ts`
- `src/core/wiki/generator.ts`
- `src/core/kuzu/kuzu-adapter.ts`
- `src/cli/analyze.ts`

这会放大变更成本、降低 review 质量、增加跨平台修复时的误伤面。

### 2.3 P2：语言支持与环境确定性不足

Kotlin / Swift 等语言支持仍然带有明显环境依赖：

- grammar 是否可加载
- 本机是否存在匹配 Node ABI 的 native build
- Swift 是否仍需补丁脚本

这会导致“本地可过、CI 才爆”的问题反复出现。

### 2.4 P3：兼容层散布在各处

平台差异、锁冲突探测、Windows 命令包装、optional grammar 探测、native 运行时兜底，仍散落在：

- CLI
- MCP
- 测试
- postinstall 脚本

这类兼容层没有统一抽象边界，维护成本会不断累积。

---

## 3. 设计原则

### 3.1 P0 不拆优先级：生命周期治理 + 测试基建并行推进

测试脆弱并不是独立问题，而是原生生命周期债务的外在表现。

因此：

- 不应先“修测试”再“修运行时”
- 也不应只修运行时、不动测试基建

两者必须并行治理。

### 3.2 短期目标：从分散兜底到集中治理

短期不追求彻底消灭原生问题，重点是：

- 把散落在 CLI / MCP / test helper 中的原生兜底策略收拢
- 形成单一运行时治理入口
- 明确哪些策略是暂时兼容，哪些是稳定契约

### 3.3 长期目标：原生组件隔离到独立子进程 / IPC

长期目标不是在主进程里无限修补 Kuzu / ONNX 的行为，而是：

- Kuzu 独立服务化
- Embedder / ONNX 独立服务化
- 主进程通过 IPC / RPC 调用

这样才能从根上把 native crash 与主流程隔离。

### 3.4 模块拆分按风险、体积、变更频率排序

不是“谁行数最长先拆谁”，而是优先拆：

- 最常改
- 最容易引起跨模块回归
- 一次改动最容易伤及多处流程

### 3.5 语言支持要从“能跑就行”升级为“分级支持”

每种语言支持都应显式区分：

- fully supported
- supported with optional native grammar
- best effort
- disabled / unavailable

并且在 CI 与本地环境检测中保持可解释性。

### 3.6 兼容层必须集中抽象

建议把所有平台 / 运行时兼容逻辑收敛成三层：

1. `platform-capabilities`
2. `native-runtime`
3. `lock-discovery / quiesce`

而不是继续零散分布在业务代码里。

---

## 4. 推荐总体路线

### Phase P0-A：统一原生运行时治理

建立 `NativeRuntimeManager` 或等价抽象，统一管理：

- Kuzu 生命周期
- Embedder / ONNX 生命周期
- shutdown hooks
- reindex locks
- lock-holder quiesce
- native health / failure state

目标不是立刻实现完美关闭，而是把所有策略集中到一层。

### Phase P0-B：测试基建去脆弱化

围绕 `NativeRuntimeManager` 重构测试基建：

- 降低 `dangerouslyIgnoreUnhandledErrors` 依赖
- 把 no-op cleanup 迁移成显式 runtime fixture
- 明确哪些 suite 必须进程隔离
- 把“测试为什么要串行”变成可解释、可追踪的测试层策略

### Phase P1：拆分核心热点模块

推荐顺序：

1. `src/mcp/local/local-backend.ts`
2. `src/core/ingestion/workers/parse-worker.ts`
3. `src/core/wiki/generator.ts`
4. `src/core/kuzu/kuzu-adapter.ts`
5. `src/cli/analyze.ts`

进度更新（2026-03-26）：

- `src/mcp/local/local-backend.ts` 的 handler-first 拆分已完成，并已合并、验证、推送到 `main`
- `detect_changes` 已补上 git worktree 解析能力：
  - 支持显式 `cwd`
  - 输出 `git_diff_path`、`path_resolution`、`fallback_reason`
  - 对 worktree 限制给出更可解释的 metadata / warnings
- 这意味着 `LocalBackend` 相关的第一轮结构治理已经从“巨型热点”降到“已拆分并带有回归测试的可维护模块”

进度补充（2026-03-28）：

- `src/core/ingestion/workers/parse-worker.ts` 的 Laravel route extraction 已完成并落地：
  - `src/core/ingestion/routes/types.ts`
  - `src/core/ingestion/routes/laravel-route-extraction.ts`
  - `src/core/ingestion/routes/php-route-shared.ts`
  - 下游 `call-processor.ts` / `parsing-processor.ts` 已切到新的 route type 边界
- `src/core/wiki/generator.ts` 的 worktree 拆分仍在进行，但 `full-generation` review 中提出的 `failedModules` 双通道问题已在本地 worktree 修复并通过针对性测试
- `src/core/kuzu/kuzu-adapter.ts` 已在当前工作区完成第一轮局部拆分：
  - FTS 逻辑已抽到 `src/core/kuzu/fts.ts`
  - 原 `kuzu-adapter.ts` 保留外部 API，转为薄包装
  - 相关 unit / native integration / build 均已通过
  - 已形成本地 commit：`ecd70ee` (`refactor(kuzu): extract fts helpers`)
- `src/cli/analyze.ts` 已在当前工作区完成一轮 orchestration helper 拆分：
  - `src/cli/analyze-finalization.ts`
  - `src/cli/analyze-embeddings.ts`
  - `src/cli/analyze-summary.ts`
  - `src/cli/analyze-kuzu.ts`
  - `src/cli/analyze-session.ts`
  - 相关 analyze unit tests、native search integration、CLI e2e 与 build 均已通过
  - 已形成本地 commit：`df9ae67` (`refactor(analyze): extract workflow helpers`)

说明：

- 上述 `kuzu-adapter.ts` / `analyze.ts` 的补充进度代表**已在本地 `main` 提交并验证**的切片
- 它们仍然需要按团队流程决定是否进一步 review / push / release，因此不能简单等同于“所有后续治理都完成”

### Phase P2：语言支持确定性工程

建立语言支持分级与环境检测：

- Kotlin / Swift grammar 加载状态显式化
- `doctor` 或等价诊断输出语言能力状态
- CI 约束不再依赖“是否偶然跳过测试”
- 移除或收编 Swift patch 脚本

### Phase P3：兼容层抽象收敛

把以下逻辑抽离出业务层：

- Linux `/proc` 与 macOS `lsof`
- Windows `cmd /c npx`
- optional grammar 探测
- native 运行时能力开关
- path normalization / host-specific behavior

---

## 5. 阶段成功标准

### P0 成功标准

- 没有业务层直接决定原生资源关闭策略
- 测试不再依赖“忽略原生未处理错误”作为默认常态
- Kuzu / ONNX 状态可以从单一入口观测
- shutdown / lock / stale lock 行为都有统一实现

### P1 成功标准

- `LocalBackend`、`parse-worker`、`generator` 明显缩小
- 核心职责边界清晰，文件更聚焦
- 相关测试不再依赖巨型模块内部细节

### P2 成功标准

- Kotlin / Swift 的可用性可诊断、可复现
- CI 的语言能力不是“隐式成功”，而是“显式声明”

### P3 成功标准

- 平台差异逻辑不再散落在 CLI / MCP / tests 中
- 兼容策略可复用、可测试、可单独 review

---

## 6. 当前推荐下一步

从当前治理价值来看，下一步最应该做的是：

1. 收口 `src/core/wiki/generator.ts` worktree：完成最终 commit / review / merge
2. 审阅并按需要推送当前工作区里 `src/core/kuzu/kuzu-adapter.ts` 与 `src/cli/analyze.ts` 的已提交切片
3. 在这些 P1 热点切片都落地后，再决定是否继续深入到更细颗粒的 runtime / test helpers，还是转向 P2 / P3

P0 的原生运行时与测试基建已经完成第一轮落地，当前最值钱的工作不再是继续补 `NativeRuntimeManager` 骨架，而是把剩余的大热点模块按职责边界继续拆开。

---

## 7. 当前进度（2026-03-26）

已完成：

- `NativeRuntimeManager` 骨架已建立，并接入 `analyze`、MCP Kuzu adapter、`mcp/server`、`server/api`、`eval-server`
- `doctor --json` 已暴露 `native-runtime` 与 `language-support`
- 测试基建已拆成：
  - `unit`
  - `integration`
  - `integration:native`
- `dangerouslyIgnoreUnhandledErrors` 已从当前 active Vitest 配置中移除
- `test/setup.ts` 已从所有 active Vitest 配置路径移除
- `native-runtime` 已能显示：
  - `kuzuActiveRepos`
  - `coreEmbedderActive`
  - `mcpEmbedderActive`
- CI workflow 已对齐新的三层测试配置
- `LocalBackend` 已完成以下结构化拆分：
  - `runtime/`
  - `tools/handlers/`
  - `tools/shared/`
  - `tool-context` / `tool-registry`
- `query`、`cypher`、`context`、`overview`、`impact`、`detect_changes`、`rename` 已全部从 `LocalBackend` 中抽出为独立 handler
- `detect_changes` 已支持 worktree-aware path resolution 和显式 fallback metadata
- `README.md` 与 `CHANGELOG.md` 已补充最近几波平台级更新摘要

仍待完成：

- 合并 `src/core/wiki/generator.ts` 当前 worktree 切片
- 审阅并按需要推送 `src/core/kuzu/kuzu-adapter.ts` 当前 FTS 抽取 commit
- 审阅并按需要推送 `src/cli/analyze.ts` 当前 helper 抽取 commit
- 评估 `src/core/kuzu/kuzu-adapter.ts` 在 FTS 之外是否还要继续缩薄为更明确的 runtime adapter / query helper 边界
- 评估 `src/cli/analyze.ts` 在当前 helper 拆分之后是否还需要继续收敛顶层 orchestration
- 继续推进 P2：语言支持确定性与 `doctor` / CI 诊断一致性
- 继续推进 P3：平台兼容层进一步集中化
- 决定这一阶段是否已经足够形成评审 PR，还是继续深入到 `global-setup` / `test-indexed-db` 的更细颗粒治理
