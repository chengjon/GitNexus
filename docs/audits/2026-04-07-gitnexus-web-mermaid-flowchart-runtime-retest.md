# GitNexus Web Mermaid Flowchart Runtime Retest

日期：2026-04-07  
范围：`gitnexus-web` Mermaid flowchart-only runtime 实验  
目标：验证“能力边界已收窄为 flowchart 后，是否可以绕开 `mermaid` 总入口，只保留 `flowDiagram` runtime，从而继续压 Mermaid warning”

---

## 1. 背景

在前一轮 capability-boundary 切片里，GitNexus Web 已明确收口为：

- 聊天 Mermaid 只承诺 flowchart
- 流程弹窗只承诺 flowchart
- agent prompt 只允许输出 `graph TD` / `graph LR`

这意味着理论上可以继续测试一条更激进的路线：

- 不再从 `mermaid` 总入口按需加载
- 直接使用 Mermaid 内部 `flowDiagram` runtime
- 试图让 Vite 不再为其他 Mermaid 图家族产出大块文件

---

## 2. 实验设计

本次临时实验做了三件事：

1. 新建一个专用 flowchart runtime：
   - 直接 import Mermaid 内部 `flowDiagram-*` chunk
   - 只注册 flowchart diagram，不再走 `mermaid` 总入口
2. 将 `MermaidDiagram` / `ProcessFlowModal` 改为按需加载这个 flowchart runtime
3. 修复 Vite 配置：
   - 把 `mermaid` alias 从前缀匹配改成仅匹配 bare package name
   - 避免 `mermaid/dist/...` 子路径导入被错误重写

同时补了一条配置回归测试，锁住 `mermaid` alias 的 exact-match 行为。

---

## 3. 实验结果

实验构建通过，但产物整体明显劣化。

关键产物体积：

- `index-*`：`318.31 KB`
- `mermaid-flowchart-runtime-*`：`701.93 KB`
- `vendor-text-*`：`644.80 KB`
- `vendor-cytoscape-*`：`690.52 KB`

对比稳定基线：

- 稳定基线：
  - `index-*`：`315.97 KB`
  - `mermaid.esm.min-*`：`781.40 KB`
  - Mermaid 共享块：`608.01 KB`
- 本次实验：
  - 主入口虽然回到了约 `318 KB`
  - 但新增了三个额外的大懒加载 warning 块
  - `modules transformed` 也从稳定基线约 `2369` 上升到 `3694`

这不是“warning 换个名字”，而是：

- Mermaid 内部 source-level chunk 被更大范围地重新展开
- `vendor-text` / `vendor-cytoscape` 明显膨胀
- 总 warning 面比稳定基线更差

---

## 4. 结论

本次 direct flowchart runtime 路线已回退。

原因：

- 它没有继续压下 Mermaid warning
- 反而把 Mermaid 相关负担重新分散成更多超阈值块
- 总体 bundle 质量比稳定基线更差

因此当前明确不推荐的 Mermaid 路线已经扩展为四类：

1. `mermaid.core.mjs`
2. `mermaid.core.mjs + vendor-mermaid manual chunk`
3. `mermaid.esm.mjs`
4. 直接使用 Mermaid 内部 `flowDiagram` runtime

---

## 5. 保留结果

本轮只保留一项稳定收益：

- `mermaid` Vite alias 现在已收敛为 bare-package exact-match
  - 不会再误伤 `mermaid/dist/...` 子路径导入
  - 这是一个更正确的解析边界，即便当前主线仍使用 `mermaid` 总入口

---

## 6. 验证

本次实验与回退后已验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run \
  test/unit/gitnexus-web-mermaid-capability-boundary.test.ts \
  test/unit/gitnexus-web-vite-chunking.test.ts \
  test/unit/gitnexus-web-vite-config.test.ts \
  --config vitest.config.ts

cd /opt/claude/GitNexus/gitnexus-web
npm run build
```

回退后的稳定结果重新回到：

- `index-*`：约 `319.10 KB`
- `mermaid.esm.min-*`：`781.40 KB`
- Mermaid 共享块：`608.01 KB`
