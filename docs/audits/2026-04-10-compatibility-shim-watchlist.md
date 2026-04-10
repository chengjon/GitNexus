# Compatibility Shim Watchlist

日期：2026-04-10
类型：兼容层 / workaround watchlist
范围：`/opt/claude/GitNexus`
规则基线：`DEVELOPMENT_RULES.md`

## 目的

把当前仓内仍然存在、但暂时没有足够证据安全删除的 compatibility shim / workaround
显式登记为 watchlist，避免它们继续以“低优先级注释”形式长期漂浮，最终变成默认架构。

本记录不主张立即删除这些路径；它只回答三件事：

- 当前的 canonical path 是什么
- 为什么现在不能直接 cutover / 删除
- 满足什么退出条件后才可以退休

## Measured State

### 1. `parsing-processor.ts` backward-compat re-export

- Compatibility Layer / Shim:
  `gitnexus/src/core/ingestion/parsing-processor.ts`
  中对 `isNodeExported` 的 backward-compatibility re-export
- Canonical Path:
  `gitnexus/src/core/ingestion/export-detection.ts`
- Measured:
  `scope: internal imports + release history + package surface, time: 2026-04-10`
  - `gitnexus/src/core/ingestion/workers/parse-worker.ts` 已直接从 canonical path 导入
  - `gitnexus/test/integration/parsing.test.ts` 已在 `ef2fb72` 切到 canonical path
  - 当前仓内检索未发现新的内部测试或源码继续通过 `parsing-processor.js`
    导入 `isNodeExported`
  - git 历史显示该 re-export 在 `7376e92` 引入，措辞是
    `for backward compatibility with any external consumers`
  - 发布线检查显示它至少随 `v1.4.0` 与 `v1.4.5` 对外发布过
  - `v1.5.0` / `v1.5.3` 的 `parsing-processor.ts` 已不再包含该 re-export
  - `gitnexus/package.json` 在 `v1.4.0`、`v1.5.3` 和当前本地都仍没有显式 `exports` map
  - `gitnexus/README.md` 现已明确：文档化 CLI / MCP surface 才是默认受支持入口，
    `dist/*`、`src/*` 与内部模块 deep import 不属于稳定公共 API，除非未来另行声明
- Direct Cutover Risk:
  当前 package surface 边界虽然已经在 `gitnexus/README.md` 外显化，
  但这条入口仍然属于“历史上已发布过的 deep import”。
  现在直接删 re-export，仍然会从“文档声明”跨到“真实兼容性收缩”，
  因而依旧不是普通内部清理。
- Exit Condition:
  当前已完成第一项 package-surface 明确化，且已补 migration-note draft：
  `docs/audits/2026-04-10-parsing-processor-compatibility-export-migration-note-draft.md`
  剩余退出条件至少还要满足以下之一：
  - 真正 cutover 时发布该 release note / migration note
  - 有足够证据证明受支持 consumers 已迁到 `export-detection.ts`
- Cleanup Tracking:
  后续应作为单独 shim-retirement slice 处理，而不是混在 parsing / ingestion
  功能改动里顺手删除。具体退役边界见
  [2026-04-10-parsing-processor-compatibility-export-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-10-parsing-processor-compatibility-export-retirement.md)。

### 2. `suffixResolve()` no-index linear scan fallback

- Compatibility Layer / Shim:
  `gitnexus/src/core/ingestion/resolvers/utils.ts`
  中 `suffixResolve()` 的 `Fallback: linear scan (for backward compatibility)` 分支
- Canonical Path:
  `gitnexus/src/core/ingestion/resolvers/utils.ts`
  中基于 `buildSuffixIndex(...)` 的 indexed suffix lookup 路径
- Measured:
  `scope: call graph + caller audit + focused regression coverage, time: 2026-04-10`
  - 源码仍显式把该分支标注为 backward-compatibility fallback
  - GitNexus `impact(target="suffixResolve", direction="upstream")` 当前返回 `LOW`
  - 直接 callers 至少包括：
    - `gitnexus/src/core/ingestion/resolvers/standard.ts:resolveImportPath`
    - `gitnexus/src/core/ingestion/resolvers/php.ts:resolvePhpImport`
    - `gitnexus/src/core/ingestion/resolvers/csharp.ts:resolveCSharpImport`
  - 仓内生产主链里，这 3 个 callers 当前都经由 `import-processor.ts:resolveLanguageImport` 显式收到并传入 `index`
  - `processImports()` 与 `processImportsFromExtracted()` 当前都会构建并传入 indexed context
  - 当前仓内 repo-wide 未发现生产路径继续无 index 调用这些 resolver helper；
    无 index reachability 主要由 focused compatibility tests 显式保留
  - 当前本地已补 direct indexed-path tests：
    - `gitnexus/test/unit/import-processor-indexed-resolution.test.ts` 锁定 `processImports()` 会构建 suffix index 并传给 `resolveImportPath()`
    - 同文件也锁定 `processImportsFromExtracted()` 在有 prebuilt context 时复用已有 suffix index、无 prebuilt context 时自建 suffix index
  - 当前本地已补 focused compatibility tests：
    - `gitnexus/test/unit/resolver-utils.test.ts` 锁定 no-index fallback 的直接行为
    - `gitnexus/test/unit/resolver-callers-compatibility.test.ts` 锁定 3 个直接 callers 的无 index 兼容路径
- Direct Cutover Risk:
  当前风险已不再是主 ingestion 流程风险，而是
  “这些 resolver helper 的无 index 直接调用契约是否可以整体退休”。
  因而它属于 helper-contract 收缩，不是普通内部清理。
- Exit Condition:
  只有在以下条件都满足后才可退休：
  - 仓内与受支持调用点都明确改成 indexed path，或明确声明 no-index helper 调用不再受支持
  - 对 no-index 调用的行为有回归测试证明已不再需要兼容，并同步移除当前 compatibility tests
  - 相关多语言 resolver 集成测试确认 indexed-only 路径未回归
- Cleanup Tracking:
  应放入 dedicated resolver-contract retirement slice，不应作为 opportunistic cleanup。
  具体退役边界见
  [2026-04-10-suffix-resolve-no-index-fallback-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-10-suffix-resolve-no-index-fallback-retirement.md)。

### 3. `useSigma.ts` camera nudge workaround

- Compatibility Layer / Workaround:
  `gitnexus-web/src/hooks/useSigma.ts`
  中 `setSelectedNode()` 的 camera nudge，用于强制 edge refresh
- Canonical Path:
  `gitnexus-web/src/hooks/useSigma.ts`
  内正常的 selection / refresh flow，本应不依赖 synthetic camera animation
- Measured:
  `scope: hook source + GraphCanvas selection sync + focused coverage, time: 2026-04-10`
  - 源码在 `setSelectedNode()` 处仍有明确注释：
    `workaround for Sigma edge caching`
  - `focusNode()` 当前仍显式绕开这段 workaround，源码注释保留了
    `without the camera nudge from setSelectedNode`
  - `GraphCanvas.tsx` 当前在 app selected node -> sigma selected node 同步时仍会调用
    `setSigmaSelectedNode(appSelectedNode.id)`，因此常规 selection sync 仍会走这段 workaround
  - 当前本地已补 `gitnexus/test/unit/gitnexus-web-use-sigma-workaround.test.ts`，
    锁定源码边界仍保留 workaround / 绕开路径
  - 当前本地已补 `gitnexus-web/test/unit/useSigma.behavior.test.tsx`，
    用 mocked runtime / reducer-level 行为测试锁定 `setSelectedNode()` 的 camera nudge + refresh、selection 后的 edge highlighting 输出，以及 `focusNode()` 的 direct focus 行为
  - 当前本地已补 `gitnexus-web/test/unit/GraphCanvas.selection-sync.test.tsx`，
    用 component-hook selection sync 测试锁定 `GraphCanvas.tsx` 的 app selected node -> sigma selected node 路径当前仍会触发同一 workaround，并改变 connected / unrelated edge highlighting 输出
  - 但当前仍缺少真实 Sigma render / edge refresh integration-grade regression coverage
- Direct Cutover Risk:
  当前缺口不再是“完全没有行为测试”，而是
  “虽然已有 mocked runtime + component-hook selection sync 证据，但还没有真实 Sigma render / edge refresh 的回归证据，或 deterministic 替代路径”。
  在这之前直接删除，仍可能重新引入 edge stale render。
- Exit Condition:
  满足以下条件后再退休：
  - 上游 Sigma 行为已确认修复，或本地改成不依赖 camera animation 的 deterministic refresh 路径
  - 对 selection/highlight/edge refresh 补上更接近真实渲染路径的 regression coverage
  - 删除 workaround 时同步退役当前源码边界测试，并调整 mocked runtime 行为测试
- Cleanup Tracking:
  应归入 dedicated `gitnexus-web` UI/runtime retirement slice，而不是 opportunistic cleanup。
  具体退役边界见
  [2026-04-10-use-sigma-camera-nudge-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-10-use-sigma-camera-nudge-retirement.md)。

## Current Interpretation

- Measured:
  `scope: current shim inventory, time: 2026-04-10`
  当前剩余 shim/workaround 已经从“到处散落且未命名”收敛为
  “少量已知残留，且每条都能说清 canonical path 与 cutover risk”。
- Inferred:
  `scope: next safe action, time: 2026-04-10`
  下一步最合理的动作不是继续 opportunistic 删除，而是：
  - 对 package-surface shim 按显式 retirement gate 处理
  - 对 resolver helper fallback 按 helper-contract 收缩治理
  - 对前端 workaround 继续从 reducer-level 行为证据推进到 integration-grade evidence，或给出 deterministic 替代路径

在这些退出条件满足前，继续保留这些 shim/workaround 是可接受的；
把它们当作“已经自然消失的旧代码”则不可接受。
