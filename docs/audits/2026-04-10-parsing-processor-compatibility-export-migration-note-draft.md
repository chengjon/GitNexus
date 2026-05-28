# Parsing Processor Compatibility Export Migration Note Draft

日期：2026-04-10
状态：draft only, not yet published
范围：历史 deep import
`gitnexus/dist/core/ingestion/parsing-processor.js` -> `isNodeExported`

用途：

- 仅作为未来真正退休该 compatibility export 时的同切片 migration / release note 草稿
- 当前不代表该入口已经退休
- 只有在同一切片里实际删除 re-export，并同步退役相关 compatibility test 后，才应把本草稿转成正式 release note / migration note

治理基线：

- [DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
- [2026-04-10-parsing-processor-compatibility-export-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-10-parsing-processor-compatibility-export-retirement.md)

---

## Draft Note

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

---

## Required Co-Changes Before Publishing

在把上面的草稿转成正式对外说明之前，至少还要与以下动作同切片落地：

1. 删除 `gitnexus/src/core/ingestion/parsing-processor.ts` 中的 compatibility re-export
2. 同步删除或改写
   `gitnexus/test/unit/parsing-processor-compatibility-export.test.ts`
3. 保留 canonical path 的回归覆盖：
   `gitnexus/test/integration/parsing.test.ts`
4. 在对应切片中明确该变更首次生效的版本或发布线

---

## Why This Exists Separately

当前仓库已经明确：

- 文档化 CLI / MCP surface 才是默认受支持入口
- deep imports into `dist/*` / `src/*` 默认不属于稳定公共 API

但这个入口属于“历史上实际发布过的 compatibility export”。
因此它不能只在退役边界文档中以建议文案存在；单独草稿文件的作用是：

- 让未来 cutover 切片可以直接复用最小对外说明
- 避免再把“是否需要 migration note”回退成临时争论
- 把当前状态准确固定为：draft exists, but retirement not yet executed
