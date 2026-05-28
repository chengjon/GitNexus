# Suffix Resolve No-Index Fallback Retirement

日期：2026-04-10
范围：`gitnexus/src/core/ingestion/resolvers/utils.ts`、`gitnexus/src/core/ingestion/import-processor.ts`、相关 resolver callers、相关 tests
目标：把 `suffixResolve()` 中 no-index linear scan fallback 的当前 reachability、真实风险边界和未来退役 gate 写清楚，避免继续沿用已经过时的 `HIGH` blast-radius 叙事。

治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
相关基线：[2026-04-10-compatibility-shim-watchlist.md](/opt/claude/GitNexus/docs/audits/2026-04-10-compatibility-shim-watchlist.md)

---

## 1. 背景

`gitnexus/src/core/ingestion/resolvers/utils.ts:suffixResolve()` 当前有两条路径：

- canonical path：传入 `SuffixIndex` 后的 indexed suffix lookup
- compatibility fallback：未传 `index` 时的 linear scan

源码仍把后一条路径注释成：

- `Fallback: linear scan (for backward compatibility)`

因此当前问题不是“这里有没有 fallback”，而是：

- 当前仓内主流程是否还会主动走 no-index 路径
- 如果不会，剩余风险到底是主流程风险，还是 helper-level compatibility contract 风险

---

## 2. 当前 Reachability 判定

### Graph / Callers

截至 `2026-04-10`，GitNexus 图谱给出的当前状态是：

- `gitnexus_impact(target="suffixResolve", direction="upstream", repo="GitNexus")`
  返回 `LOW`
- `gitnexus_context(name="suffixResolve", repo="GitNexus")`
  当前只显示 3 个源码 callers：
  - `gitnexus/src/core/ingestion/resolvers/standard.ts:resolveImportPath`
  - `gitnexus/src/core/ingestion/resolvers/php.ts:resolvePhpImport`
  - `gitnexus/src/core/ingestion/resolvers/csharp.ts:resolveCSharpImport`

这与上一轮文档里的 `HIGH` 结论不同，说明当前索引下的真实 blast radius 已经缩小。

### 仓内生产主链

当前仓内生产路径里，这 3 个 callers 都经由 `import-processor.ts:resolveLanguageImport`
显式传入 `index`：

- `resolveImportPath(..., index)`
- `resolvePhpImport(..., index)`
- `resolveCSharpImport(..., index)`

同时，两条仓内 import-processing 主路径也都明确构建了 index：

- `processImports()` 会先 `buildSuffixIndex(normalizedFileList, allFileList)`
- `processImportsFromExtracted()` 会复用 `buildImportResolutionContext(...)`
  中预构建的 `suffixIndex`

也就是说，在当前仓内主 ingestion 流程中：

- worker 快路径走 indexed path
- 全顺序 fallback 也会自建 index

当前仓内并不存在“主流程因为没传 index 而被迫依赖 no-index linear scan”这一事实。

### 剩余 Reachability

当前仓内 repo-wide 检索显示，未传 index 的 reachability 主要只剩：

- `gitnexus/test/unit/resolver-utils.test.ts`
- `gitnexus/test/unit/resolver-callers-compatibility.test.ts`

与此同时，indexed 主路径的直接证据也已补到 import-processing 层：

- `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
  - 锁定 `processImports()` 会构建 suffix index 并把它传给 `resolveImportPath()`
  - 锁定 `processImportsFromExtracted()` 在有 prebuilt context 时会复用已有 suffix index
  - 锁定 `processImportsFromExtracted()` 在无 prebuilt context 时会自建 suffix index

这些测试不是偶然遗漏；它们是显式锁定的 compatibility contract：

- `suffixResolve()` 本身仍支持 no-index 调用
- `resolveImportPath()` / `resolvePhpImport()` / `resolveCSharpImport()` 仍支持无 index 直接调用

因此当前剩余风险已经从“仓内主流程会不会炸”收敛成：

- helper-level no-index compatibility contract 是否允许退休

---

## 3. 当前不能直接删除的理由

当前不应直接删除 `suffixResolve()` 的 linear scan fallback，理由有三个：

- 仓内 focused tests 仍把 no-index 行为当成显式兼容契约
- import-processing 主路径虽然已有 direct indexed-path evidence，但相关 callers 仍保留可选 `index?` 形态，而不是 indexed-only 签名
- 即便 package README 已声明 internal deep import 不属于稳定公共 API，
  helper-level behavior contract 的收缩仍然需要单独切片和回归证据

这说明现在删除 fallback，不是在做“主流程性能清理”，而是在做：

- resolver helper API / contract tightening

---

## 4. Retirement Gate

只有在以下动作明确完成后，才适合删除当前 no-index fallback：

1. helper contract 决策明确化
   - 明确 `suffixResolve()` 及相关 callers 是否转为 indexed-only
   - 如果保留可选参数形态，则不应删除 linear scan fallback

2. callers 同步收紧
   - `resolveImportPath()` / `resolvePhpImport()` / `resolveCSharpImport()`
     需要同步决定是否仍接受无 index 调用
   - 如果要收紧，应在同一切片里一起调整，而不是只删 `suffixResolve()` 内部分支

3. compatibility tests 同切片退役
   - 删除或改写
     `gitnexus/test/unit/resolver-utils.test.ts`
   - 删除或改写
     `gitnexus/test/unit/resolver-callers-compatibility.test.ts`

4. indexed-only 回归验证
   - generic import resolution 仍通过
   - PHP composer-missing fallback 场景仍有明确结论
   - C# namespace resolution 仍通过

---

## 5. 建议的 Migration / Change Note 文案

如果未来真的退休 no-index helper contract，建议在同一切片里至少写出类似说明：

```text
Resolver contract change:

The historical no-index fallback path in `suffixResolve()` has been retired.

Internal resolver helpers now expect an indexed suffix lookup context.
Callers that invoked `suffixResolve()` or related resolver helpers without an
index must migrate to the indexed path.
```

如果发布时不想把它写成 breaking note，也至少应保留这三个信息：

- 被退休的是 no-index helper contract，不是 indexed path
- callers 现在需要传入 index
- 相关行为测试已同步切到 indexed-only 语义

---

## 6. 不应如何删除

不应采用以下方式处理：

- 只看到当前 `impact=LOW`，就把 fallback 当成纯死代码删掉
- 只删 `suffixResolve()` 里的 linear scan，而不处理 3 个 callers 的 helper contract
- 在 unrelated import-resolution cleanup 里顺手删除 compatibility tests

这些做法都会把“helper 契约收缩”伪装成“内部清理”。

---

## 7. 结论

当前更准确的状态是：

- `suffixResolve()` 的 canonical path 已经是 indexed suffix lookup
- 当前仓内主 ingestion 流程已经不依赖 no-index fallback
- 但 no-index 路径仍作为 helper-level compatibility contract 被测试锁定

因此，下一步正确动作不是继续沿用旧的 `HIGH` 主流程风险叙事，也不是马上删代码，而是：

- 先把 watchlist 更新到当前真实 blast radius
- 未来在单独的 resolver-contract slice 中，连同 callers 与 tests 一起退休 no-index 兼容契约
