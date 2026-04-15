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
- 与此同时，pre-OpenSpec 时代留下的 historical implementation plan false-open 状态也已 truth-sync：
  - `openspec/changes/2026-04-08-local-backend-implementation-plan-truth-sync/`

进度补充（2026-03-28）：

- `src/core/ingestion/workers/parse-worker.ts` 的 Laravel route extraction 已完成并落地：
  - `src/core/ingestion/routes/types.ts`
  - `src/core/ingestion/routes/laravel-route-extraction.ts`
  - `src/core/ingestion/routes/php-route-shared.ts`
  - 下游 `call-processor.ts` / `parsing-processor.ts` 已切到新的 route type 边界
  - pre-OpenSpec 时代遗留的 historical implementation plan false-open 状态
    也已 truth-sync：
    `openspec/changes/2026-04-08-parse-worker-implementation-plan-truth-sync/`
- `src/core/wiki/generator.ts` 的历史 wiki 拆分记录不能再被笼统视为“仍在进行”
  - `generator-support.ts`、`run-pipeline.ts` 以及对应
    `wiki-generator-support.test.ts` / `wiki-run-pipeline.test.ts` /
    `wiki-generator-orchestration.test.ts` 已存在于当前主仓
  - `incremental-update.ts` 与 `wiki-incremental-update.test.ts` 也已存在于当前主仓，
    且 `generator.ts` 已走抽取后的 helper dispatch 路径
  - `module-tree/types.ts`、`module-tree/builder.ts` 与
    `wiki-module-tree.test.ts` 也已存在于当前主仓，且 `generator.ts` 已走抽取后的
    module-tree builder / type 边界
  - `pages/leaf-page.ts`、`pages/parent-page.ts` 与
    `wiki-page-generation.test.ts` 也已存在于当前主仓，且 `generator.ts` 已走抽取后的
    page-generation helper 边界
  - `pages/overview-page.ts` 也已存在于当前主仓，且相关 prompt / trim /
    fallback / `overview.md` 输出契约已在 `wiki-page-generation.test.ts` 中有
    focused coverage
  - `2026-03-28` 技术债审计也已把 support / orchestration / adjacent wiki
    extraction tests 记为已验证
  - 因此 `support-run-pipeline` 这条历史 implementation plan 的 false-open
    状态已关闭：
    `openspec/changes/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync/`
  - `incremental-update` 这条历史 implementation plan 的 false-open 状态
    也已关闭：
    `openspec/changes/2026-04-08-wiki-generator-incremental-update-implementation-plan-truth-sync/`
  - `module-tree` 这条历史 implementation plan 的 false-open 状态
    也已关闭：
    `openspec/changes/2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync/`
  - `page-generation` 这条历史 implementation plan 的 false-open 状态
    也已关闭：
    `openspec/changes/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync/`
  - `overview-page` 这条历史 implementation plan 的 false-open 状态
    也已关闭：
    `openspec/changes/2026-04-08-wiki-generator-overview-page-implementation-plan-truth-sync/`
  - `full-generation` 这条历史 implementation plan 的 false-open 状态
    也已关闭：
    `openspec/changes/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync/`
  - `full-generation review` 文档里残留的
    `before implementation` / `Should fix before implementation` blocker 叙事
    也已 truth-sync 为 historical review record：
    `openspec/changes/2026-04-08-wiki-generator-full-generation-review-truth-sync/`
  - `support-run-pipeline review` 文档也已从“进入实现阶段前”语气收敛为
    historical review record：
    `openspec/changes/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync/`
  - 旧 worktree review / merge 叙事只能作为历史背景，不能继续代表当前主仓
    对该子切片的真实状态
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

进度补充（2026-04-06）：

- `gitnexus-web` 的 production build boundary 已先完成一轮修复，构建不再因为仓库外父级配置探测而失败
- 随后的 bundle/chunk 收敛切片已把浏览器主入口从约 `3.0 MB` 压到 `315.97 KB`，并把 `ingestion.worker` 主入口从 `4,496.87 KB` 压到 `272.33 KB`
- 该切片同时把 markdown 高亮切到 light Prism、把 Mermaid 改为运行时懒加载、并把 worker 的 langgraph / provider / langchain core / transformers / onnx / parser / zip 依赖拆成独立 chunk
- 该切片还补上了一个 `gitnexus-web` Vite chunk helper 回归测试，锁住浏览器 runtime 与 worker heavyweight chunk 的关键分包规则
- 后续 worker runtime lazy-loading 切片又把 `ingestion.worker` 主入口从 `272.33 KB` 进一步压到 `196.29 KB`，并把 `embedder` / `embedding-pipeline` / `context-builder` / `agent` 从 worker bootstrap 路径中拆成独立运行时块
- 该切片同时补上了 `gitnexus-web-worker-lazy-imports` 回归测试，防止 embedding / agent 运行时重新回流到 worker 顶层静态 import
- 最新的 ONNX external-wasm resolution 切片又把 `worker-onnx-*` 从 `704.18 KB` 压到 `612.45 KB`，并把 `onnxruntime-web-use-extern-wasm` 解析条件在 app/inline Vite 配置中显式收敛
- 该切片同时补上了 `gitnexus-web-vite-config` 回归测试，锁住两套 Vite 配置的 ONNX resolve 条件一致性
- 2026-04-07 还对 `worker-langchain-core` 做过两轮 finer chunk 实验：
  - 一轮按 `messages` / `runnables` / `utils` 等高体量子树拆分
  - 一轮仅拆 `langsmith` 与 prompt-related 子树
  - 两轮都引入了新的循环 chunk 警告，因此最终回退到稳定的 `worker-langchain-core` 边界
  - 这意味着 LangChain warning 仍是 follow-up，但当前已明确“继续按现有子树边界强拆”不是可接受方向
- 2026-04-07 还重新验证了 Mermaid `core` 入口路线：
  - 将 alias 切到 `mermaid.core.mjs`
  - 并额外尝试了 `vendor-mermaid` manual chunk
  - 结果把产物恶化为 `vendor-mermaid 2,529.52 KB`、`vendor-cytoscape 877.37 KB`、`vendor-text 644.80 KB`
  - 因此该路线再次被否决，后续 Mermaid warning 不应再通过重试 `core` 入口解决
- 2026-04-07 还重新验证了 `mermaid.esm.mjs` 入口路线：
  - 保持现有 manual chunk 不变，只切换入口
  - 结果仍停留在 `mermaid 785.75 KB` 与共享块 `608.34 KB`
  - 这说明 Mermaid 方向的纯入口/预构建 bundle 切换已经基本被证伪
  - 后续 Mermaid warning 更合理的方向应转向 capability boundary，而不是继续切入口
- 2026-04-07 已落地第一轮 Mermaid capability boundary：
  - 聊天与流程弹窗现在只承诺 flowchart（`graph TD/LR` 与 `flowchart TD/LR`）
  - agent prompt 也已明确禁止输出其他 Mermaid 图家族
  - 该切片补上了 `gitnexus-web-mermaid-capability-boundary` 回归测试
  - 但构建结果显示 `mermaid.esm.min 781.40 KB` 与共享块 `608.01 KB` 仍未下降
  - 这意味着本轮完成的是产品契约收口，而不是 warning 体积下降
- 2026-04-07 还验证了直接使用 Mermaid 内部 `flowDiagram` runtime 的路线：
  - 目标是基于已收紧的 flowchart-only 产品边界，跳过 `mermaid` 总入口
  - 实验结果把产物劣化为 `mermaid-flowchart-runtime 701.93 KB`、`vendor-text 644.80 KB`、`vendor-cytoscape 690.52 KB`
  - 主入口虽然仍在约 `318.31 KB`，但总体 warning 面明显比稳定基线更差
  - 因此这条路线也已被否决
- 2026-04-07 还重新验证了 ONNX provider shim 路线：
  - 通过本地 `onnxruntime-web` shim 在 session 创建时按 `webgpu/wasm` 选择 provider
  - 产物虽然拆出了 `worker-onnx-wasm 91.24 KB`
  - 但同时把 `worker-transformers` 推高到 `905.35 KB`
  - 因此这条路线也被否决，后续 ONNX warning 不应再通过 provider shim 继续推进
- 剩余 warning 已继续收敛为更明确的 follow-up：
  - Mermaid / cytoscape 相关懒加载块仍偏大
  - `worker-langchain-core` 仍然偏大
  - `worker-onnx` 已下降，但仍需下一轮进一步越过 warning 阈值
- 2026-04-09 再做了一轮前端-only follow-up：
  - Mermaid runtime 不再进入 Rollup bundle，而是作为生产静态 runtime 资产按需加载
  - 构建产物中已不再出现 `mermaid.esm.min-*` 与原 Mermaid / cytoscape 共享 warning 块
  - `web-tree-sitter` 的 `fs` / `path` browser externalization warning 已清除，仅剩上游 `eval` 提示
  - `worker-onnx-*` 又从 `612.45 KB` 进一步降到 `581.07 KB`
  - 并新增了 `worker-onnx-support 18.91 KB` 的 support 子块
  - 同日还完成了 LangChain shared vendor split：
    - `worker-langchain-core-*` 从 `618.62 KB` 降到 `450.99 KB`
    - 新增 `worker-langchain-vendor 175.81 KB`
    - 且未引入新的循环 chunk warning
  - 这意味着 LangChain warning 已从“剩余大块”转为“已收敛到稳定双层边界”
  - 同日后续又对 `web-tree-sitter/tree-sitter.js` 的单点 upstream `eval` warning 加了 scoped Vite `onwarn` filter：
    - 只过滤这一个 `EVAL + web-tree-sitter/tree-sitter.js` 组合
    - 其他 Rollup warning 仍保持透传
    - 当前 `gitnexus-web` 构建日志已不再出现本地可控 warning
  - 同日还复测过一条 embedding runtime narrow-entry 路线：
    - 目标是绕开 `@huggingface/transformers` 顶层 `pipeline()` 宽入口
    - 实验确实把 `worker-transformers-*` 从 `451.39 KB` 压到 `317.90 KB`
    - 但 `worker-onnx-*` 反而从 `581.07 KB` 回升到 `587.37 KB`
    - 同时重新引入了 `node:*` / `sharp` / `detect-libc` 的 browser externalization warning
    - 因此该路线已回退，并记录为新的已证伪方向
  - 同日也复测了 `onnxruntime-web` bare-package runtime shim 路线：
    - 目标是把 `webgpu/wasm` 子入口拆成更细的 ONNX runtime chunks
    - 结果虽然形成了 `worker-onnx-webgpu 580.93 KB` 与 `worker-onnx-wasm 91.24 KB`
    - 但 `worker-transformers-*` 同时膨胀到 `904.51 KB`
    - 这在工程效果上再次复现了已证伪的 provider shim 失败模式
    - 因此该路线也已回退，并记录为新的已证伪方向
  - 同日还复测了 `onnxruntime-web` static runtime assetization 路线：
    - 目标是把 ORT runtime 直接搬到 `/vendor/onnxruntime/ort.min.mjs`，从 Rollup worker bundle 中整体移出
    - 构建虽然成功，且 warning 面没有恶化
    - 但 `worker-transformers-*` 仍从 `451.39 KB` 膨胀到 `904.86 KB`
    - 说明 runtime 重量只是从 `worker-onnx` 回流到了 `worker-transformers`
    - 因此该路线也已回退，并记录为新的已证伪方向

### Phase P2：语言支持确定性工程

建立语言支持分级与环境检测。

截至 `2026-04-09`，P2 已完成的收敛包括：

- Kotlin / Swift grammar 加载状态已显式化
- `doctor --json` 已输出结构化 `language-support` 数据
- CI summary / 校验已能消费稳定 `supportLevel + reasonCode` 语义
- 默认安装路径中的 Swift `postinstall` patch 已退役
- operator-facing language support matrix 与 availability 说明已补齐

因此，P2 作为“语言支持确定性工程”基线已闭合。

后续若再处理 Kotlin / Swift，只应视为新的支持面扩展或环境兼容性切片，
而不是继续把已完成的确定性/诊断治理重复计为 P2 未完成项。

### Phase P3：兼容层抽象收敛

把以下逻辑抽离出业务层：

- Linux `/proc` 与 macOS `lsof`
- Windows `cmd /c npx`
- optional grammar 探测
- native 运行时能力开关
- path normalization / host-specific behavior

截至 `2026-04-10`，P3 已完成的新一轮低风险收敛包括：

- `path-comparison.ts` 已成为平台路径归一化 / 判等的共享 helper
- 以下路径已切到共享 helper，并补上 focused tests：
  - `gitnexus/src/core/augmentation/engine.ts`
  - `gitnexus/src/cli/doctor.ts`
  - `gitnexus/src/mcp/local/runtime/pinned-repo-runtime.ts`
  - `gitnexus/src/storage/repo-manager.ts`
  - `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
  - `gitnexus/src/cli/platform-process-scan.ts`
- 这意味着一批原本散落在 CLI / MCP / storage / runtime 中的
  Windows path case-folding 与 host-specific path equality 逻辑，
  已从“各写各的局部实现”收敛成“单点 helper + 定向回归测试”

当前边界也已更明确：

- 剩余 compatibility shim / workaround 已单独登记到
  `docs/audits/2026-04-10-compatibility-shim-watchlist.md`，后续应按退出条件治理，
  而不是继续作为 opportunistic cleanup 顺手删除
- 其中 `parsing-processor.ts` 的历史 compatibility export 已补单独退役边界说明，且已把 future cutover 所需的 migration-note draft 单独落地：
  `docs/audits/2026-04-10-parsing-processor-compatibility-export-retirement.md`
  `docs/audits/2026-04-10-parsing-processor-compatibility-export-migration-note-draft.md`
- `suffixResolve()` 的 no-index fallback 也已补单独退役边界说明，且当前 blast radius
  已从旧文档里的 `HIGH` 收敛成 helper-contract 风险；当前还额外补了 import-processing
  direct indexed-path tests，明确 `processImports()` / `processImportsFromExtracted()` 主路径都在传递 suffix index：
  `docs/audits/2026-04-10-suffix-resolve-no-index-fallback-retirement.md`
- `useSigma.ts` 的 camera nudge workaround 也已补单独退役边界说明，并新增 mocked runtime /
  reducer-level 行为测试与 `GraphCanvas` selection sync 组件级覆盖；当前剩余缺口已收敛成“缺少真实 Sigma render / edge refresh 的 integration-grade 证据”：
  `docs/audits/2026-04-10-use-sigma-camera-nudge-retirement.md`
- `gitnexus/src/mcp/local/runtime/backend-runtime.ts:normalizePathForKey`
  仍然是 `HIGH` impact 路径
- 它直接参与 `init` / `resolveRepo` 主流程，不再适合继续按
  “低 blast radius 的小切片”硬切
- 当前已补单独高风险边界说明：
  `docs/audits/2026-04-10-backend-runtime-normalize-path-risk-boundary.md`
- 后续若要继续推进 P3 主路径收敛，应作为单独高风险治理任务处理，
  先按该边界说明复核调用链、测试矩阵和失败模式，再考虑把它切到共享 helper

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

截至 `2026-04-06`，前一轮文档里基于 worktree 的“待合并 / 待推送”判断已经过时。当前更有价值的下一步是：

1. 先把技术债与治理文档同步到当前 `main` 的真实状态，停止继续传播旧的 pending 叙事
2. 清理并归档 `.sisyphus/`、`tmp_exports/` 等容易污染仓库上下文的残留资产
3. 在仓库状态重新变得可信后，再执行 `gitnexus-web` 调试日志收敛、依赖债登记，以及面向 `upstream/main` 的收敛策略文档化

P0 与主要 P1 切片已经不再处于“是否落地”的阶段。当前重点从“继续证明它们已完成”转向“把仓库文档、资产和后续治理方向收敛到同一个事实源”。

### 6.1 观察名单（不再默认继续拆）

以下文件仍然是“可继续治理”的热点，但**不再因为行数本身就默认拆分**：

- `src/cli/skill-gen.ts`
- `src/core/kuzu/kuzu-adapter.ts`
- `src/core/ingestion/utils.ts`
- `src/core/ingestion/import-processor.ts`
- `src/core/ingestion/framework-detection.ts`

这些文件当前的体量和职责复杂度仍值得关注，但已经不属于“必须立刻拆”的状态。后续是否继续切片，应由修改频率、review 摩擦和测试边界需要来决定，而不是单纯由文件行数驱动。

### 6.2 停刀标准

当以下信号不足时，默认停止继续拆分：

- 没有新的高频改动命中该文件
- 没有明显不相关职责继续混在一起
- review 已经可以聚焦于单一主题
- 现有测试已经能较清楚地锁住行为边界
- 文件不再持续成为冲突热点

建议规则：

- 只有当上述信号里至少出现 2 项时，才把某个热点重新提升为主动治理目标
- 如果近期的价值重心转向 `P2` / `P3`，则优先做确定性和平台抽象，而不是继续做“为了降行数而降行数”的 P1 切片

---

## 7. 当前进度（2026-04-06 状态同步）

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
  - pre-OpenSpec 时代遗留的 historical implementation plan false-open 状态
    也已 truth-sync：
    `openspec/changes/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync/`
- MCP 已完成 router + per-repo worker 隔离切换：
  - 当前架构不再是单进程 multi-repo MCP baseline
  - `gitnexus/src/mcp/router-backend.ts`、`repo-worker-manager.ts`、
    `repo-worker.ts`、`local/runtime/pinned-repo-runtime.ts` 已落地
  - 相关 unit / integration anchors 已在仓内存在
  - corresponding historical implementation-plan false-open 状态也已 truth-sync：
    `openspec/changes/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync/`
- MCP process management control plane 已完成并通过 archived OpenSpec 归档：
  `openspec/changes/archive/2026-04-06-mcp-process-management/`
  - 已落地 runtime registry、router/worker ownership metadata、
    `gitnexus mcp ps` / `gc` / `drain`
  - `analyze` 已支持 cooperative drain first，再回退到 signal-based quiesce
  - reindex lock ownership hardening 已与这条治理切片一并落地
  - 对应 historical implementation plan false-open 状态也已 truth-sync：
    `openspec/changes/2026-04-08-mcp-process-management-implementation-plan-truth-sync/`
  - 对应 historical review stale-gate 状态也已 truth-sync：
    `openspec/changes/2026-04-08-mcp-process-management-review-truth-sync/`
- `README.md` 与 `CHANGELOG.md` 已补充最近几波平台级更新摘要
- `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md` 与对应 OpenSpec 变更已建立，作为仓库卫生治理入口
  - 其中 `detect_changes` 宿主 Finding 3 的后续状态同步已补做：`docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md`
  - 其中 stale-doc / repair-order 相关的 broader historical follow-up 也已补做：
    `docs/audits/2026-04-08-repo-technical-debt-audit-broader-status-sync.md`
  - `docs/superpowers/specs/2026-03-28-technical-debt-audit.md` 这份
    worktree-era 基线审计也已补做 historical status sync，避免其中
    `pending merge` / `local slice committed` / `in progress` 叙事继续被误读为
    当前主仓状态：`openspec/changes/2026-04-08-technical-debt-audit-historical-status-sync/`
- `.sisyphus/` / `tmp_exports/` 中的跟踪残留已迁移到 `docs/archive/`，并通过 `.gitignore` 阻止旧暂存目录回流
- `gitnexus-web` 首轮日志收敛已完成，并新增 `gitnexus-web/scripts/check-log-hygiene.sh` 作为目标回归检查
- `kuzu` / `kuzu-wasm` 以及 `tar` / `npmlog` / `gauge` / `are-we-there-yet` / `boolean` 的 deprecated 依赖链已登记为显式技术债
- `kuzu` / `kuzu-wasm` 的后续处理已拆为独立评审切片：`openspec/changes/2026-04-06-kuzu-dependency-review/`
- `kuzu` / `kuzu-wasm` 的退出条件、候选结论与双 CLI 约束已进一步固化为：`openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/`
- 面向 `upstream/main` 的文档收敛规则已明确：先对齐最新本地文档事实，再做 doc/governance-only replay review
- 在 `upstream/main` 再次推进到 `cb772b9` 后，shared 顶层文档 replay review 已补做，并明确当前没有新的安全 replay 片段：`openspec/changes/2026-04-06-upstream-shared-doc-replay-review/`
- 在 `git fetch upstream` 再次把 `upstream/main` 推进到 `be24010` 后，latest
  shared-doc replay 基线也已继续 status-sync：
  - 当前双向分叉基线更新为 `285 209`
  - 重新复核的 shared hotspot 仍是 `README.md`、`AGENTS.md`、`CLAUDE.md`、
    `gitnexus/README.md`
  - 结论仍是当前没有新的安全 shared-file replay 片段，应继续以本地已收敛文档为真源
  - 该结论已登记为：`openspec/changes/2026-04-08-upstream-shared-doc-replay-status-sync/`
- `gitnexus` 本地 `dist` 直连入口已补做一轮双 CLI 收敛刷新：
  - 根 `.gitignore` 忽略 `dist/`，因此这类 residual 不会自然出现在当前 git scope 里
  - 已通过 `cd gitnexus && npm run build` 刷新本地 `dist/cli` 入口
  - 并验证 `node dist/cli/index.js setup --help`、`doctor --json --host codex --repo .`、`doctor --json --host claude-code --repo .` 三条直连路径都已对齐当前双 CLI 源码行为
  - 该结论已登记为：`openspec/changes/2026-04-07-dual-cli-dist-entry-convergence/`
- `ci-report.yml` 已补上 `language-support` 门禁的 PR 汇总收敛：
  - `ci.yml` 本来就会把 `language_support_result` 写入 `pr-meta`
  - 本轮补齐了 PR sticky report 的 metadata 读取、状态表行与 overall gating
  - 避免再次出现“真实 required gate 已存在，但 PR 汇总少报”的 workflow residual
  - 该结论已登记为：`openspec/changes/2026-04-07-ci-report-language-support-convergence/`
  - 对应 historical implementation plan 的 false-open state 也已 truth-sync：`openspec/changes/2026-04-08-ci-report-language-support-implementation-plan-truth-sync/`
- `language-support` 的 PR 汇总摘要也已补齐：
  - `ci.yml` 现在会把编译后的 `dist/ci/language-support-report.js` 输出持久化为 `language-support-summary.md`
  - 并通过 `language-support-report` artifact 提供给 `ci-report.yml`
  - PR sticky report 现在既显示 `Language Support` 门禁状态，也显示折叠的 `Language Support Summary`
  - 该结论已登记为：`openspec/changes/2026-04-07-ci-report-language-support-summary/`
  - 对应 historical implementation plan 的 false-open state 也已 truth-sync：`openspec/changes/2026-04-08-ci-report-language-support-summary-implementation-plan-truth-sync/`
- `language-support` 的 runtime / CI policy 也已收敛到单一事实源：
  - `language-registry.ts` 现在显式导出 `getLanguageSupportPolicy()`
  - reporter 实现已迁入 `src/ci/language-support-report.ts`
  - `scripts/ci/language-support-report.mjs` 仅保留为 thin compatibility shim
  - 避免 builtin / optional 语言名单继续在 runtime 与 CI 两边独立维护
  - 该结论已登记为：`openspec/changes/2026-04-07-language-support-policy-convergence/`
- `doctor --json` 的 `language-support` transport 也已结构化：
  - `DoctorCheck` 现在支持可选 `data`
  - `runDoctor()` 会对 `language-support` 输出结构化 `LanguageSupportSummaryEntry[]`
  - reporter 优先消费 `data`，仅在旧 payload 下回退解析 `detail`
  - 避免 CI reporter 继续把人类可读字符串当成唯一 machine-readable 契约
  - 该结论已登记为：`openspec/changes/2026-04-07-language-support-structured-doctor-output/`
  - 对应 historical implementation plan 的 false-open state 也已 truth-sync：`openspec/changes/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync/`
- `doctor --json` 的 `embeddings-config` 也已结构化：
  - `embeddings-config` check 现在输出 `effective`、`sources`、`precedence` 与 `probe` 的结构化 `data`
  - 保留现有 detail 文本摘要不变
  - 避免后续自动化继续解析 `provider=...` / `nodeLimit=...` 这类字符串细节
  - 该结论已登记为：`openspec/changes/2026-04-07-embeddings-config-structured-doctor-output/`
  - 对应 historical implementation plan 的 false-open state 也已 truth-sync：`openspec/changes/2026-04-08-embeddings-config-structured-doctor-output-implementation-plan-truth-sync/`
- `doctor --json` 的 `native-runtime` 也已结构化：
  - 默认 `native-runtime` check 现在输出 `NativeRuntimeSnapshot` 作为结构化 `data`
  - 保留现有 detail 文本摘要不变
  - 避免后续自动化继续解析 `kuzuActiveRepos=...` / `coreEmbedderActive=...` 这类字符串
  - 该结论已登记为：`openspec/changes/2026-04-07-native-runtime-structured-doctor-output/`
  - 对应 historical implementation plan 的 false-open state 也已 truth-sync：`openspec/changes/2026-04-08-native-runtime-structured-doctor-output-implementation-plan-truth-sync/`
- `Mmap for size 8796093022208 failed` 的根因与 runtime drain 修复链已补做专门审计：
  - 已确认主因不是索引永久损坏，而是长期驻留 repo-worker 的 native 异常状态被反复复用，同时旧 drain / liveness 控制面对 `bwrap --unshare-pid` 下的 PID / signal 语义过度乐观
  - 修复、实测验证、宿主边界与证据分层已沉淀为：`docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md`
  - 对应 docs-only 治理切片已登记为：`openspec/changes/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit/`
- `doctor --json` 的 `host-config` 也已结构化：
  - 已评估的 `host-config` check 现在输出 host id / displayName / detected / configured / needsManualConfig / detectionReason 的结构化 `data`
  - Claude Code 与 Codex 两条主路径都已有定向回归测试锁定
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-host-config-structured-doctor-output/`
- `doctor --json` 的 `host-config` 边界分支也已结构化：
  - `Unknown host` 与 `No host checks requested` 两条 early-return 路径现在输出 `requestedHost` / `matchedHosts` / `skipped` / `reasonCode` 的结构化 `data`
  - 已覆盖 `unknown-host` 与 `no-host-requested` 两条边界路径
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-host-config-edge-structured-output/`
- `doctor --json` 的 `registry-entry` 也已结构化：
  - `registry-entry` check 现在输出 `repoPath` / `matched` / `entry` 的结构化 `data`
  - 覆盖命中与未命中全局 registry 两种状态
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-registry-entry-structured-doctor-output/`
- `doctor --json` 的 repo-state 也已结构化：
  - `git-repo` check 现在输出 `requestedPath` / `repoPath` / `isGitRepo` 的结构化 `data`
  - `repo-indexed` check 现在输出 `repoPath` / `indexed` / `indexPath` 的结构化 `data`
  - 覆盖 git / non-git 以及 indexed / not-indexed 四类共享前置状态
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-repo-state-structured-doctor-output/`
- `doctor --json` 的 `gpu-device-node` 也已结构化：
  - `gpu-device-node` check 现在输出 `platform` / `checkedPaths` / `visibleNodes` / `skipped` 的结构化 `data`
  - 已覆盖 Linux 下 visible-node 与 missing-node 两条主路径
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-gpu-device-node-structured-doctor-output/`
- `doctor --json` 的 `gpu-host-runtime` 也已结构化：
  - `gpu-host-runtime` check 现在输出 `command` / `ok` / `exitCode` / `errorCode` / `summary` 的结构化 `data`
  - 已覆盖 `nvidia-smi` 成功与 `ENOENT` 缺失命令两条主路径
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-gpu-host-runtime-structured-doctor-output/`
- `doctor --json` 的 `gpu-docker-config` 也已结构化：
  - `gpu-docker-config` check 现在输出 `dockerPresent` / `inspectOk` / `running` / `hasGpuDeviceRequest` / `llmLibrary` / `visibleDevices` / `driverCapabilities` / `missingConfig` / `skipped` 的结构化 `data`
  - 已覆盖 healthy-container 与 missing-container 两条主路径
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-gpu-docker-config-structured-doctor-output/`
- `doctor --json` 的 `gpu-container-runtime` 也已结构化：
  - `gpu-container-runtime` check 现在输出 `command` / `attempted` / `ok` / `exitCode` / `errorCode` / `summary` / `skipped` 的结构化 `data`
  - 已覆盖 successful-probe 与 missing-container skip 两条主路径
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-gpu-container-runtime-structured-doctor-output/`
  - 其历史 implementation plan 的 false-open 状态也已 truth-synced：`openspec/changes/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync/`
- `doctor --json` 的 `gpu-ollama-runtime` 也已结构化：
  - `gpu-ollama-runtime` check 现在输出 `provider` / `probeStatus` / `queryAttempted` / `queryOk` / `model` / `sizeVram` / `skipped` / `reason` 的结构化 `data`
  - 已覆盖 GPU-offload pass 与 CPU-fallback fail 两条主路径
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-gpu-ollama-runtime-structured-doctor-output/`
- `doctor --json` 的 `gpu-fix` 也已结构化：
  - `gpu-fix` check 现在输出 `appliedFixes` / `manualFollowUps` 的结构化 `data`
  - 已覆盖 safe-fix application 路径
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-gpu-fix-structured-doctor-output/`
- `doctor --json` 的 `host-detect-changes-guidance` 也已结构化：
  - `host-detect-changes-guidance` check 现在输出 `hostId` / `command` / `repoArg` / `cwdArg` / `reasonCode` 的结构化 `data`
  - Claude Code 与 Codex 两条主路径都已有定向回归测试锁定
  - 保留现有 detail 文本摘要不变
  - 该结论已登记为：`openspec/changes/2026-04-07-host-detect-changes-guidance-structured-output/`
- 共享的 post-mutation freshness guidance 也已按双 CLI 收敛：
  - 生成的 `AGENTS.md` / `CLAUDE.md` 现在会同时说明：
    - Claude Code 通过 `PostToolUse` 自动处理 `git commit` / `git merge` 后的索引新鲜度
    - Codex 当前没有等价自动 hook，需要按需手动重跑 `gitnexus analyze`
  - quick-start 文档与 mini-repo fixture 也已同步到同一方向
  - 避免共享文档继续只讲 Claude Code 自动路径、却让 Codex 用户自行猜测
  - 该结论已登记为：`openspec/changes/2026-04-07-dual-cli-post-mutation-freshness-guidance/`
- `mini-repo` AI context fixture 也已与当前生成器契约重新对齐：
  - 样例 `AGENTS.md` / `CLAUDE.md` 不再嵌入动态 repo 计数
  - `detect_changes` 示例与自检条目现在显式包含 `repo: "mini-repo"` 的 multi-repo guidance
  - 该收敛已由 `ai-context` 焦点测试直接锁定，避免夹具再次落回旧模板
  - 该结论已登记为：`openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/`
- `gitnexus-pr-review` skill 也已与当前 `detect_changes` 契约重新对齐：
  - source skill 与 repo 内安装副本现在都显式教授 multi-repo `repo` 与 worktree `cwd` guidance
  - PR review 主示例不再继续传播旧的 `detect_changes({scope: "compare", base_ref: "main"})` 调用形态
  - 该收敛已由一个 focused skill-doc 测试直接锁定
  - 该结论已登记为：`openspec/changes/2026-04-07-pr-review-skill-detect-changes-guidance-convergence/`
- `detect_changes` 的 worktree review 文档也已 truth-sync 到当前测试现实：
  - 旧 review 中“显式 `cwd` 优先级测试尚未补齐”与“`fallback_reason` 尚未被直接断言”的说法已被移除
  - 当前 review 只保留真正未完成的外部宿主兼容性矩阵与设计文档同步项
  - 该 truth-sync 已重新验证对应的 unit 与 native integration 测试
  - 该结论已登记为：`openspec/changes/2026-04-07-detect-changes-worktree-review-truth-sync/`
- `detect_changes` 的 worktree design 文档也已继续 truth-sync：
  - 设计文档已明确当前实现使用 `params.cwd || process.cwd()`
  - 已补齐 `--git-common-dir` / `--git-dir` / `--show-toplevel` 的语义边界
  - review 文档的剩余开放项现已只剩外部宿主兼容性矩阵
  - 该结论已登记为：`openspec/changes/2026-04-07-detect-changes-worktree-design-truth-sync/`
- `detect_changes` 的外部宿主兼容性矩阵也已建立 research baseline：
  - Codex / Claude Code / Cursor 的官方文档边界已整理成矩阵
  - 其中 Codex 还叠加了仓内既有实测，确认当前不能默认假设自动传 `cwd`
  - 随后的 Claude Code 当前 CLI live probe 又进一步确认：在仓目录与临时 git worktree 中都未见自动注入 `cwd`
  - 对当前项目要求的 `Codex + Claude Code` 双 CLI 主支持面而言，host guidance 已闭环
  - Cursor / 其他 MCP 客户端 probe 现已降级为外部宿主扩展 follow-up，而不是当前主仓阻塞债务
  - 该结论已登记为：`openspec/changes/2026-04-07-detect-changes-host-compatibility-matrix-baseline/`
  - Claude Code live probe 结论已登记为：`openspec/changes/2026-04-07-detect-changes-claude-code-cwd-live-probe/`
  - 主支持面收敛结论已登记为：`openspec/changes/2026-04-07-detect-changes-primary-dual-cli-host-convergence/`
- 一组较早 dual-CLI implementation plan 的 execution state 也已 truth-sync：
  - 四份 2026-04-06 dual-CLI implementation plan 不再继续保留全量 `- [ ]` 的 false-open 状态
  - 现在都显式回指各自对应的 OpenSpec `tasks.md` 作为 execution-truth source
  - 避免后续审计继续把已完成的 Claude Code / Codex 收敛切片误判为“计划未执行”
  - 该结论已登记为：`openspec/changes/2026-04-07-dual-cli-implementation-plan-truth-sync/`
- shared README host framing 也已继续收敛：
  - 根 `README.md` 与 `gitnexus/README.md` 现在显式区分 primary maintained pair 与 optional MCP integrations
  - `Claude Code + Codex` 作为当前仓库主支持面被前置表达
  - Cursor / Windsurf / OpenCode 仍保留为可选集成文档，而不是被误写成同层主支持面
  - 该结论已登记为：`openspec/changes/2026-04-08-readme-primary-dual-cli-framing-convergence/`
- secondary entrypoint docs 的 host framing 也已继续收敛：
  - `docs/gitnexus-quick-start-guide.md` 现在显式区分主支持面与可选 MCP host
  - `eval/README.md` 的 grep augmentation 描述改成了更中性的 hook-style wording
  - 避免 secondary docs 再把 optional hosts 与当前主支持面对外混成同层
  - 该结论已登记为：`openspec/changes/2026-04-08-secondary-entrypoint-host-framing-convergence/`
- `docs/ai-cli-local-quick-start.md` 的 host scope 也已继续收敛：
  - 该一级入口文档现在显式声明当前本地 fork 的主维护 CLI 支持面是
    `Claude Code + Codex`
  - 文档继续只记录这两个受维护 CLI 的本地期望，不再让“AI CLI local quick
    start”标题被误读成对所有外部 MCP host 的同层承诺
  - 可选外部 host 仍可通过 generic MCP setup 使用，但不属于这份 quick start
    的主支持边界
  - 该结论已登记为：`openspec/changes/2026-04-08-ai-cli-local-quick-start-host-framing-convergence/`
- `docs/gitnexus-skills-modification-suggestions.md` 的 MCP prompt 示例边界也已继续收敛：
  - 建议文档中的 `@gitnexus ...` 示例现在显式标注为 Claude Code specific host example
  - 同时保留 `Claude Code + Codex` 作为当前仓库主维护 CLI 支持面的治理结论
  - 避免文档继续在 host-specific prompt UX 与 dual-CLI support framing 之间留下歧义
  - 该结论已登记为：`openspec/changes/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence/`
- 根 `README.md` 的 MCP prompt 入口边界也已继续收敛：
  - README 里的 `@gitnexus ...` 示例现在显式补充为 Claude Code specific host example
  - 同时保留 `Claude Code + Codex` 作为当前仓库主维护 CLI 支持面的治理结论
  - 避免入口 README 在 direct prompt syntax 与 dual-CLI support framing 之间继续留下歧义
  - 该结论已登记为：`openspec/changes/2026-04-08-readme-mcp-prompt-host-boundary-convergence/`
- `gitnexus-cli` skill 的 dual-CLI freshness guidance 也已继续收敛：
  - source skill 与 package skill 副本现在都同时说明：
    - Claude Code 通过 `PostToolUse` 自动处理 post-mutation freshness
    - Codex 当前没有等价自动 hook，需要按需手动重跑 `gitnexus analyze`
  - 避免 skill 文档面继续只保留 Claude Code 单边叙事
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence/`
- `gitnexus-cli` skill 的 troubleshooting host wording 也已继续收敛：
  - source skill 与 package skill 副本的 stale-index troubleshooting 不再只写
    “Restart Claude Code”
  - 现在统一改成 host-neutral guidance，并显式补充：
    - Claude Code：重启 Claude Code 以重新连接 MCP
    - Codex：若现有 MCP 连接仍然显示 stale context，则重启 Codex session
  - 避免 skill 文档在 troubleshooting 段落重新退回 Claude Code 单宿主叙事
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence/`
- `gitnexus-pr-review` skill 的 source/package 漂移也已继续收敛：
  - package skill 副本已补回 source skill 里已有的 worktree path-verification guidance
  - checklist 现在明确要求在 worktree 场景下检查 `path_resolution`
  - review dimensions 也重新补回 `git_diff_path` / `path_resolution` 的验证维度
  - 避免 package skill 再次落回较弱的 `detect_changes` 路径校验叙事
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence/`
- `gitnexus-guide` skill 的 schema / alias 文档也已继续收敛：
  - source skill 与 package skill 现在都显式补充：
    - `search` → `query`
    - `explore` → `context`
  - Graph schema 摘要也已补齐 `Folder`、`CodeElement`、多语言节点，以及
    `HAS_METHOD` / `OVERRIDES` 边类型
  - 避免 guide skill 继续停留在较早的 schema 摘要，削弱工具与知识图谱边界说明
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-guide-skill-schema-alias-convergence/`
- `gitnexus-exploring` skill 的 alias 提示也已继续收敛：
  - source skill 与 package skill 现在都显式补充：
    - `search` → `query`
    - `explore` → `context`
  - 避免 exploring skill 在“如何理解代码流”这个低门槛入口上继续漏掉当前别名映射
  - 该结论已登记为：`openspec/changes/2026-04-15-gitnexus-exploring-alias-guidance-convergence/`
- `gitnexus-refactoring` skill 的 rename 置信度文案也已继续收敛：
  - source skill 与 package skill 不再继续使用过时的 `ast_search` 命名
  - 现在统一改成当前 `graph` / `text_search` taxonomy
  - 避免重构指导继续引用旧版 rename confidence 分类
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence/`
- `gitnexus-refactoring` skill 的 `detect_changes` 路径元数据指导也已继续收敛：
  - source skill 与 package skill 现在都显式补充：
    - `git_repo_path`
    - `git_diff_path`
    - `process_cwd`
    - `path_resolution`
    - `fallback_reason`
  - rename checklist 现在明确要求在重构后的范围校验阶段检查这些输出字段
  - 同时把 `path_resolution = registry_repo` 明确标记为需要解释的 fallback
  - 避免 refactoring skill 继续只写 “传 `cwd`”，却不说明如何验证分析实际落在哪个路径
  - 该结论已登记为：`openspec/changes/2026-04-15-gitnexus-refactoring-detect-changes-metadata-convergence/`
- `docs/gitnexus-skills-review.md` 这份历史技能审核报告也已补做 status sync：
  - 顶部已明确它是 2026-03-26 baseline，而不是当前状态板
  - 同时新增 current follow-up snapshot，提醒读者优先参考路线图与后续
    2026-04-08 的 skill-doc convergence 记录
  - 避免旧审核摘要继续把已关闭的 skill-doc drift 原样表达成当前 backlog
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-skills-review-status-sync/`
- `docs/gitnexus-skills-review.md` 的 current follow-up snapshot 也已继续收敛：
  - 顶部 status-sync note 现在明确把 `gitnexus-exploring` 列为已关闭的后续 drift
  - snapshot 表格里对应行也已从“可选 follow-up”更新为“已有后续收敛记录”
  - 避免历史 skills-review 页面在 snapshot 这一层继续把已关闭的 exploring alias drift 读成未完成小尾巴
  - 该结论已登记为：`openspec/changes/2026-04-15-gitnexus-skills-review-exploring-follow-up-sync/`
- `gitnexus-impact-analysis` skill 的 `detect_changes` 路径元数据指导也已继续收敛：
  - source skill 与 package skill 现在都显式补充：
    - `git_repo_path`
    - `git_diff_path`
    - `process_cwd`
    - `path_resolution`
    - `fallback_reason`
  - checklist 现在明确要求在 pre-commit impact review 时检查这些输出字段
  - 同时把 `path_resolution = registry_repo` 明确标记为需要解释的 fallback
  - 避免 impact-analysis skill 继续只写 “传 `cwd`”，却不说明如何验证分析实际落在哪个路径
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence/`
- `docs/gitnexus-skills-review.md` 的 current follow-up snapshot 也已继续收敛：
  - 顶部 status-sync note 现在明确把 `gitnexus-impact-analysis` 列为已关闭的后续 drift
  - snapshot 表格里对应行也已从“需重新判断”更新为“已有后续收敛记录”
  - 避免历史 skills-review 页面在 follow-up snapshot 这一层继续漏掉刚完成的 impact-analysis convergence
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-skills-review-impact-analysis-follow-up-sync/`
- `docs/gitnexus-skills-modification-suggestions.md` 的历史建议页也已补做 status sync：
  - 顶部 status-sync note 现在明确标出当天已经关闭的 `cli` / `guide` /
    `impact-analysis` / `refactoring` / `pr-review` drift
  - 同时新增 current follow-up snapshot，避免旧建议页继续把已完成收敛原样读成当前待办
  - `gitnexus-debugging` 的 regression note 也已明确标成“已被当前 skill 吸收”
  - 该结论已登记为：`openspec/changes/2026-04-08-gitnexus-skills-modification-suggestions-status-sync/`
- `docs/gitnexus-skills-modification-suggestions.md` 的 follow-up snapshot 也已继续收敛：
  - 顶部 status-sync note 现在明确把 `gitnexus-exploring` 列为已关闭的后续 drift
  - snapshot 表格里也已补上 `gitnexus-exploring` 的已收敛读法
  - 避免历史 suggestions 页面在 snapshot 这一层继续漏掉刚完成的 exploring alias convergence
  - 该结论已登记为：`openspec/changes/2026-04-15-gitnexus-skills-suggestions-exploring-follow-up-sync/`
- historical skills 状态页的 snapshot 日期标签也已继续收敛：
  - `docs/gitnexus-skills-review.md` 与 `docs/gitnexus-skills-modification-suggestions.md`
    顶部的 `Status sync` / `Current Follow-Up Snapshot` 日期现在都更新为 `2026-04-15`
  - 避免页面内容已吸收 2026-04-15 收敛项，但顶部日期标签仍停留在 2026-04-08
  - 该结论已登记为：`openspec/changes/2026-04-15-skills-historical-snapshot-date-sync/`
- historical skills 页面旧正文的边界说明也已继续收敛：
  - `docs/gitnexus-skills-review.md` 与 `docs/gitnexus-skills-modification-suggestions.md`
    现在都在旧表格/旧正文入口前显式注明“以下是 2026-03-26 historical baseline”
  - 避免读者继续把下半部保留的 `当前状态: ⚠️ 需更新` 误读成当前待办
  - 该结论已登记为：`openspec/changes/2026-04-15-skills-historical-body-boundary-sync/`
- 仓库级技术债基线审计的旧正文边界说明也已继续收敛：
  - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
    现在在 `Summary` / `Findings` 入口前显式注明这些段落是 2026-04-06
    audit-capture baseline
  - 避免读者继续把下方保留的原始 findings/severity 直接读成当前阻塞项总表
  - 该结论已登记为：`openspec/changes/2026-04-15-repo-technical-debt-audit-body-boundary-sync/`
- `docs/superpowers/specs/2026-03-28-technical-debt-audit.md` 的旧表格边界说明也已继续收敛：
  - 顶部之外，现在在 `Design Documents Status` 与 `Tech Debt Roadmap Progress`
    入口前也显式注明这些表格属于 2026-03-28 worktree-era baseline
  - 避免读者继续把旧 `Document Status` / `Status` 列直接读成当前主仓状态板
  - 该结论已登记为：`openspec/changes/2026-04-15-technical-debt-audit-body-boundary-sync/`
- upstream shared-doc replay 基线审计的旧正文边界说明也已继续收敛：
  - `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
    现在在 `Refresh Summary` / `High-Level Decision` 入口前显式注明这些段落是
    2026-04-06 refreshed-fetch baseline
  - 避免读者继续把旧 replay counts 与 “right now” 口吻直接读成当前 live baseline
  - 该结论已登记为：`openspec/changes/2026-04-15-upstream-shared-replay-body-boundary-sync/`
- `docs/superpowers/specs/2026-04-05-mcp-process-management-review.md`
  的旧 review gate 边界说明也已继续收敛：
  - 现在在 `Overall Assessment` / `Summary` 入口前显式注明这些段落属于
    2026-04-05 pre-implementation review baseline
  - 避免读者继续把保留的 “Approve with revisions” recommendation 读成当前 gate
  - 该结论已登记为：`openspec/changes/2026-04-15-mcp-process-review-body-boundary-sync/`
- `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
  的旧 review 正文边界说明也已继续收敛：
  - 现在在 `整体评价` / `总结` 入口前显式注明这些段落属于
    2026-03-27 design-review baseline
  - 避免读者继续把保留的设计反馈与建议读成当前 implementation gate
  - 该结论已登记为：`openspec/changes/2026-04-15-support-run-pipeline-review-body-boundary-sync/`
- `docs/gitnexus-quick-start-guide.md` 的双 CLI 标签也已继续收敛：
  - 配置段不再用 `Claude Code（完整支持）` 这种单边标签
  - 现在显式说明 `Claude Code + Codex` 都属于主支持面，差异只在宿主 UX /
    自动化行为，而不是支持层级
  - 避免 secondary entrypoint quick-start 在细节标签上重新退回单边主支持叙事
  - 该结论已登记为：`openspec/changes/2026-04-08-quick-start-dual-cli-label-parity-convergence/`
- shared README 的 integration-depth wording 也已继续收敛：
  - 根 `README.md` 与 `gitnexus/README.md` 的 host support table 不再把
    `Claude Code` 写成 `Full` 支持、把 `Codex` 隐含成次级支持面
  - 现在统一改成 `Integration Profile` 语义，并明确：
    - `Claude Code` 当前拥有更深的宿主侧集成与自动化
    - `Codex` 仍属于同一个 primary maintained CLI surface
    - 两者差异属于 integration depth / automation，而不是支持层级
  - manual setup 段也同步改成双 CLI 并列主支持面 wording
  - 避免共享 README 在更细的标签层继续回退成单边 host tier 叙事
  - 该结论已登记为：`openspec/changes/2026-04-08-readme-dual-cli-integration-depth-convergence/`
- `repo-hygiene-doc-convergence` 的 historical implementation plan 也已 truth-sync：
  - 原计划中遗留的三条未勾选 commit steps 已回填为已完成
  - 该计划现在显式回指 `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md` 作为 execution-truth source
  - 避免后续治理继续把一条已完成的仓库卫生切片误判成“仍卡在提交前”
  - 该结论已登记为：`openspec/changes/2026-04-07-repo-hygiene-implementation-plan-truth-sync/`
- `gitnexus-web` 的宿主边界构建阻塞已修复：显式本地 PostCSS 配置与 Vite build wrapper 已落地，`npx tsc -b --noEmit`、`npm run build`、日志卫生检查均通过

当前仍待推进：

- 若继续清理前端债务，下一步应转向 chunk 体积与 `web-tree-sitter` 警告，而不是再处理构建边界问题
- 仅在出现新的维护信号、安装/运行失败、或合规压力时，才重新打开 CLI `kuzu` 与 Web `kuzu-wasm` 的替代/升级切片；在此之前维持精确 pin
- 若未来重开 CLI `kuzu` 迁移，必须同时验证 Claude Code 与 Codex 两条 CLI 主路径
- 只有在本地代码能力或根治理文档与 upstream 文案重新对齐后，才重开下一轮 `upstream/main` shared doc replay
- 观察名单已于 `2026-04-10` 完成一次重新分流，结论见
  `docs/audits/2026-04-10-watchlist-hotspot-retriage.md`：
  - `src/core/ingestion/framework-detection.ts`、`src/cli/skill-gen.ts`、`src/core/ingestion/utils.ts` 继续观察，不主动切片
  - `src/core/kuzu/kuzu-adapter.ts` 仅在 dedicated runtime slice 中重开
  - 若需要主动开下一条实现治理切片，优先候选为 `src/core/ingestion/import-processor.ts`
- 若未来重开 P3 主路径收敛，优先单独评估 `src/mcp/local/runtime/backend-runtime.ts`，
  而不是继续在低风险切片里混入 `normalizePathForKey` / `resolveRepo` 主路径修改
