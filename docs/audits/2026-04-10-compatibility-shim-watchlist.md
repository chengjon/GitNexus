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
  - 但 `gitnexus/package.json` 在 `v1.4.0`、`v1.5.3` 和当前本地都仍没有显式 `exports` map，
    README 也未把该 deep import 写成受支持 surface
- Direct Cutover Risk:
  这说明该入口既不是“从未发布过”，也不是“有明确 package 契约保护的公共 API”。
  现在直接删 re-export，风险从“内部清理”升级成“对历史上已发布 deep import 的兼容性赌博”。
- Exit Condition:
  满足以下至少一项后再退休：
  - package surface 明确声明该 deep import 不受支持
  - release note / migration note 明确完成该入口退役
  - 有足够证据证明受支持 consumers 已迁到 `export-detection.ts`
- Cleanup Tracking:
  后续应作为单独 shim-retirement slice 处理，而不是混在 parsing / ingestion
  功能改动里顺手删除。

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
  - GitNexus `impact(target="suffixResolve", direction="upstream")` 当前返回 `HIGH`
  - 直接 callers 至少包括：
    - `gitnexus/src/core/ingestion/resolvers/standard.ts:resolveImportPath`
    - `gitnexus/src/core/ingestion/resolvers/php.ts:resolvePhpImport`
    - `gitnexus/src/core/ingestion/resolvers/csharp.ts:resolveCSharpImport`
  - 仓内生产主链里，这 3 个 callers 当前都经由 `import-processor.ts:resolveLanguageImport` 显式收到并传入 `index`
  - 间接上游仍穿到 `import-processor.ts` 主流程，因此 symbol-level blast radius 依旧是 `HIGH`
  - 当前本地已补 focused unit tests：
    - `gitnexus/test/unit/resolver-utils.test.ts` 锁定 no-index fallback 的直接行为
    - `gitnexus/test/unit/resolver-callers-compatibility.test.ts` 锁定 3 个直接 callers 的无 index 兼容路径
- Direct Cutover Risk:
  现在删除 fallback，不再是在赌“当前仓内主流程是否传 index”，而是在赌
  “这些 resolver helper 的无 index 直接调用契约已经可以整体退休”。
  这依然属于高风险兼容性变更，不是低风险清理。
- Exit Condition:
  只有在以下条件都满足后才可退休：
  - 仓内与受支持外部调用点都明确改成 indexed path，或明确声明 no-index helper 调用不再受支持
  - 对 no-index 调用的行为有回归测试证明已不再需要兼容，并同步移除当前 compatibility tests
  - 相关多语言 resolver 集成测试确认 indexed-only 路径未回归
- Cleanup Tracking:
  应放入 dedicated import-resolution high-risk slice，不应作为 opportunistic cleanup。

### 3. `useSigma.ts` camera nudge workaround

- Compatibility Layer / Workaround:
  `gitnexus-web/src/hooks/useSigma.ts`
  中 `setSelectedNode()` 的 camera nudge，用于强制 edge refresh
- Canonical Path:
  `gitnexus-web/src/hooks/useSigma.ts`
  内正常的 selection / refresh flow，本应不依赖 synthetic camera animation
- Measured:
  `scope: hook source + focused boundary coverage, time: 2026-04-10`
  - 源码在 `setSelectedNode()` 处仍有明确注释：
    `workaround for Sigma edge caching`
  - `GraphCanvas.tsx` 仍经由 `useSigma()` 消费该逻辑
  - 当前本地已补 `gitnexus/test/unit/gitnexus-web-use-sigma-workaround.test.ts`，
    锁定 `setSelectedNode()` 仍保留 camera nudge，且 `focusNode()` 仍绕开该 workaround
- Direct Cutover Risk:
  虽然已有 workaround boundary test，但仍没有证明“去掉 camera nudge 后 edge refresh 仍正确”的替代机制或行为回归证据。
  现在直接删除，仍可能重新引入 edge stale render。
- Exit Condition:
  满足以下至少一项后再退休：
  - 上游 Sigma 行为已确认修复，且本仓完成版本验证
  - 本地改成不依赖 camera animation 的 deterministic refresh 路径
  - 对 selection/highlight/edge refresh 补上 focused regression coverage
- Cleanup Tracking:
  应归入 `gitnexus-web` UI/runtime follow-up，而不是当前 backend/runtime P3 小切片。

## Current Interpretation

- Measured:
  `scope: current shim inventory, time: 2026-04-10`
  当前剩余 shim/workaround 已经从“到处散落且未命名”收敛为
  “少量已知残留，且每条都能说清 canonical path 与 cutover risk”。
- Inferred:
  `scope: next safe action, time: 2026-04-10`
  下一步最合理的动作不是继续 opportunistic 删除，而是：
  - 对 package-surface shim 做显式 retirement 决策
  - 对 import-resolution fallback 做高风险专项治理
  - 对前端 workaround 先补 focused regression evidence

在这些退出条件满足前，继续保留这些 shim/workaround 是可接受的；
把它们当作“已经自然消失的旧代码”则不可接受。
