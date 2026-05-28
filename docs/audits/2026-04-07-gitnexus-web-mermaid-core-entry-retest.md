# GitNexus Web Mermaid Core Entry Retest

日期：2026-04-07  
范围：`gitnexus-web` Mermaid 懒加载入口与 Vite app chunk 路由  
目标：确认 `mermaid.core.mjs` 加专属 manual chunk 是否优于当前 `mermaid.esm.min.mjs` alias

---

## 1. 背景

当前稳定构建下，Mermaid 相关 warning 仍主要体现在：

- `mermaid.esm.min-*` 约 `781.40 KB`
- `chunk-7SRKK4IT-*` 约 `608.01 KB`

仓库在 2026-04-06 已做过一次简单的 `mermaid.esm.min.mjs -> mermaid.core.mjs` 切换实验，
结论是整体 warning 面没有改善，因此回退。

本次重试不是简单重复旧实验，而是增加一个更明确的假设：

- 如果切到官方 `mermaid.core.mjs`
- 并给 Mermaid runtime 自己一个专属 `vendor-mermaid` manual chunk

那么 Vite 也许能把 Mermaid core 和 diagram-level lazy chunks 切得比当前更干净。

---

## 2. 实验设计

本次临时实验包含两部分：

1. 将 app/inline Vite 配置中的 Mermaid alias 改到：
   - `node_modules/mermaid/dist/mermaid.core.mjs`
2. 在 `createAppManualChunks()` 中增加：
   - `vendor-mermaid`
   - 匹配 `mermaid.core.mjs`
   - 匹配 `mermaid/dist/chunks/mermaid.core/*`
   - 匹配 `@mermaid-js/parser/*`

并同步补了一条 chunking 回归断言，确保 Mermaid core 路由确实命中该专属 chunk。

---

## 3. 实验结果

实验构建通过，但结果显著劣化。

关键产物体积：

- `vendor-mermaid 2,529.52 KB`
- `vendor-cytoscape 877.37 KB`
- `vendor-text 644.80 KB`
- `vendor-graph 370.74 KB`
- `index 314.98 KB`

对比稳定基线：

- 稳定基线是 `mermaid.esm.min 781.40 KB` 与 `chunk-7SRKK4IT 608.01 KB`
- 本次实验直接把 Mermaid 相关总代价放大到多个超阈值 vendor chunk
- `modules transformed` 也从稳定构建的 `2369` 上升到 `5960`

这不是“warning 换位置”，而是：

- Mermaid 运行时被更激进地卷入 app vendor 体系
- `cytoscape` 与 markdown/text 相关 vendor chunk 也明显膨胀
- 总体构建时间与 chunk 噪音都更差

---

## 4. 结论

本次复测再次证明：

- `mermaid.core.mjs` 不是当前 GitNexus Web 的更优打包入口
- 即便给 Mermaid runtime 增加专属 manual chunk，结果也比现有方案明显更差

因此本次实验已回退，保留当前稳定方案：

- Mermaid alias 继续使用 `mermaid.esm.min.mjs`
- 不引入 `vendor-mermaid` manual chunk

后续如果继续治理 Mermaid warning，方向不应再是“重试 core 入口”，而应转向：

- 明确缩减支持的 Mermaid 图类型
- 或给 Mermaid 功能建立更强的 feature boundary

在没有产品层面的图类型收敛前，不建议再次重开这条入口切换路线。
