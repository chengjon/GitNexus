# GitNexus Web Mermaid ESM Entry Retest

日期：2026-04-07  
范围：`gitnexus-web` Mermaid 入口别名  
目标：确认把别名从 `mermaid.esm.min.mjs` 切到 `mermaid.esm.mjs` 是否能保留 Mermaid 包自己的预切 chunks，并降低残余 warning

---

## 1. 背景

当前稳定构建下，Mermaid 相关残余 warning 主要是：

- `mermaid.esm.min-*` 约 `781.40 KB`
- `chunk-7SRKK4IT-*` 约 `608.01 KB`

此前已经证伪过：

- `mermaid.core.mjs`
- `mermaid.core.mjs + vendor-mermaid manual chunk`

因此本次只测试一个尚未证伪的更小改动：

- 保持现有 manual chunk 规则不变
- 仅把 Mermaid alias 从 `mermaid.esm.min.mjs` 改为 `mermaid.esm.mjs`

假设是：Vite 也许能更好地保留 Mermaid 包内部 `chunks/mermaid.esm/*` 的切分结果。

---

## 2. 实验结果

构建通过，但结果没有实质改善。

关键产物变为：

- `mermaid.esm 785.75 KB`
- `chunk-2N6VOINK 608.34 KB`

对比稳定基线：

- 稳定基线：
  - `mermaid.esm.min 781.40 KB`
  - `chunk-7SRKK4IT 608.01 KB`
- 本次实验：
  - `mermaid.esm 785.75 KB`
  - `chunk-2N6VOINK 608.34 KB`

差异只体现在：

- 入口从 minified 版本变成了普通 ESM 版本
- chunk 名称与 hash 变化
- 体积没有下降，反而轻微上升

也就是说，`mermaid.esm.mjs` 并没有把 Mermaid 生态从“两个超阈值懒加载块”收敛到更细的稳定边界。

---

## 3. 结论

本次 `mermaid.esm.mjs` 入口路线已回退。

这意味着到目前为止，以下三条纯入口/打包路线都已经被证伪：

1. `mermaid.core.mjs`
2. `mermaid.core.mjs + vendor-mermaid manual chunk`
3. `mermaid.esm.mjs`

因此，后续如果还要继续治理 Mermaid warning，方向不应再是：

- 切换 Mermaid 入口文件
- 重复尝试不同的 Mermaid 预构建 bundle

更合理的后续方向应该是：

- 显式收敛 GitNexus Web 支持的 Mermaid 图类型
- 或为 Mermaid 能力建立更强的 feature boundary

在没有产品层面的 Mermaid 能力边界之前，继续做入口别名实验的收益已经非常低。
