# Parsing Processor Compatibility Export Retirement

日期：2026-04-10
范围：`gitnexus/src/core/ingestion/parsing-processor.ts`、`gitnexus/src/core/ingestion/export-detection.ts`、相关 tests、历史 release line
目标：把 `parsing-processor.ts` 中 `isNodeExported` 的历史兼容导出边界写清楚，避免后续把一个已发布过的 deep import 误当成“内部随手可删”的残留。

治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
相关基线：[2026-04-10-compatibility-shim-watchlist.md](/opt/claude/GitNexus/docs/audits/2026-04-10-compatibility-shim-watchlist.md)
状态同步（2026-04-10）：`gitnexus/README.md` 已新增 package surface 说明，明确文档化 CLI / MCP surface 才是默认受支持入口；当前还已补独立 migration-note draft：`docs/audits/2026-04-10-parsing-processor-compatibility-export-migration-note-draft.md`。本 note 剩余的 retirement gate 已从“先写文案”收敛成“在真实 cutover 切片中发布该文案并同步退役 compatibility test”。

---

## 1. 背景

当前 canonical 实现已经是：

- `gitnexus/src/core/ingestion/export-detection.ts`

当前本地分支仍保留：

- `gitnexus/src/core/ingestion/parsing-processor.ts`
  中对 `isNodeExported` 的 re-export

该兼容导出不是仓内早期私有实现自然遗留出来的偶发现象，而是带有明确历史语义：

- `7376e92`
  在把导出判定逻辑抽到 `export-detection.ts` 时，显式加入了
  `for backward compatibility with any external consumers`
- 发布线检查显示，这个兼容导出至少随 `v1.4.0`、`v1.4.5` 进入过对外版本
- 同时，`v1.5.0` / `v1.5.3` 的 `parsing-processor.ts` 已不再包含这个 re-export

因此当前问题不是“它是不是从未发布过”，而是：

- 本地这条分支还在保留它
- upstream 新版本线已经去掉它
- 仓库仍没有用 `exports` map 做 package-level 收口，但现在已在 `gitnexus/README.md` 明确默认受支持的是文档化 CLI / MCP surface

---

## 2. 删除前 Reachability 与 Feature-tree 判定

### 仓内直接引用

当前仓内源码与测试层面：

- `gitnexus/src/core/ingestion/workers/parse-worker.ts`
  已直接使用 canonical path
- `gitnexus/test/integration/parsing.test.ts`
  已直接从 `export-detection.ts` 导入
- 当前仓内检索未发现新的内部测试或源码继续通过
  `parsing-processor.js` 导入 `isNodeExported`

### Package Surface 判定

当前 package 元数据与文档层面：

- `gitnexus/package.json`
  在 `v1.4.0`、`v1.5.3` 和当前本地都没有显式 `exports` map
- `gitnexus/README.md`
  已明确：默认受支持的是文档化 CLI / MCP surface，`dist/*`、`src/*` 与内部模块 deep import 不属于稳定公共 API，除非未来另行声明
- 这意味着 `parsing-processor.js` 这类历史 deep import 的删除，仍然不能按“静默内部清理”处理，而应走显式 retirement / migration 路径

### Feature-tree 结论

这说明它不属于当前仓内主功能树的稳定运行入口；但它也不能直接按“纯内部死代码”处理。

更准确的判定是：

- 它是一个历史上已发布过的 deep-import compatibility surface
- 它不是当前 feature tree 的核心产品能力
- 它的删除属于 package-surface compatibility retirement，而不是普通内部清理

---

## 3. 当前保留的理由

本地当前继续保留这个导出，有两个理由：

- 删除它不会带来当前仓内主流程收益
- 即便 package surface 边界现在已在 `gitnexus/README.md` 外显化，历史已发布 deep import 的退休仍需要显式 migration / release note，而不是直接删实现

本轮新增的 focused regression 也已经把这个事实锁定：

- [parsing-processor-compatibility-export.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/parsing-processor-compatibility-export.test.ts)
  断言当前 `parsing-processor.js` 导出的 `isNodeExported`
  与 canonical `export-detection.js` 导出仍然是同一个函数

这条测试不代表“该入口应永久保留”；它代表：

- 在当前分支语义下，这仍是一个有意保留的 compatibility export
- 如果未来要退休，必须显式修改这条测试，并同步给出退役证据

---

## 4. Retirement Gate

只有在以下动作明确完成后，才适合删除当前 re-export：

1. package surface 决策明确化
   - 已完成第一步：`gitnexus/README.md` 已明确 deep import 默认不属于稳定公共 API
   - 如果未来要进一步收紧，可再引入 `exports` map，把受支持 surface 缩到公开入口

2. 迁移说明外显化
   - 已有草稿：
     `docs/audits/2026-04-10-parsing-processor-compatibility-export-migration-note-draft.md`
   - 真正 cutover 时，需要把该草稿随同切片转成正式 release note / migration note
   - 如果仍支持历史版本升级，需要写清从哪个版本开始不再保留兼容导出

3. 兼容测试与实现同切片退役
   - 删除 re-export 时，必须同步修改或删除
     `gitnexus/test/unit/parsing-processor-compatibility-export.test.ts`
   - 同时保留 canonical path 的行为测试

4. 删除后验证
   - `gitnexus/test/integration/parsing.test.ts`
     继续通过
   - package/documentation 不再暗示该 deep import 仍受支持

---

## 5. 建议的 Migration / Release Note 文案

如果未来真的执行这条 compatibility export 的退休，建议在同一切片里给出最小但明确的对外说明，例如：

```text
Breaking / migration note:

The historical deep-import compatibility export
`gitnexus/dist/core/ingestion/parsing-processor.js` -> `isNodeExported`
has been retired.

Canonical path:
`gitnexus/dist/core/ingestion/export-detection.js`

If you were importing `isNodeExported` from `parsing-processor.js`,
migrate to `export-detection.js`.

Note: deep imports under internal `dist/*` or `src/*` paths are not part of
GitNexus's stable public API unless explicitly documented.
```

如果发布时不想使用 breaking 标题，也至少应保留这四个信息：

- 被退休的旧入口是什么
- canonical path 是什么
- 使用者该改到哪里
- deep import 默认不属于稳定公共 API

## 6. 不应如何删除

不应采用以下方式处理：

- 在 unrelated parsing / ingestion refactor 里顺手删掉
- 只因为仓内没有内部 import，就把它当作纯死代码删除
- 只引用 upstream 已删除这一点，就假定本地当前分支也能零成本删除

这些做法都无法满足当前仓库治理里对 compatibility-layer retirement 的要求。

---

## 7. 结论

当前更准确的状态是：

- `isNodeExported` 的 canonical path 已经明确：`export-detection.ts`
- `parsing-processor.ts` 里的导出只是历史兼容层，不属于当前主功能树
- 但由于它有已发布版本历史，即便 package surface 决策现在已外显化，
  也仍应把它当作“需要显式退役”的 compatibility export，而不是内部杂物

因此，下一步正确动作不是继续争论“它能不能删”，而是：

- 在未来真正 cutover 的 shim-retirement slice 中，沿用并发布
  `docs/audits/2026-04-10-parsing-processor-compatibility-export-migration-note-draft.md`
- 然后再删除 re-export 与对应 compatibility test
