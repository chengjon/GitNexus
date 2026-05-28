# GitNexus Web Mermaid Capability Boundary

日期：2026-04-07  
范围：`gitnexus-web` Mermaid 聊天渲染 / 流程弹窗渲染  
目标：把 Mermaid 支持面从“默认尝试全语法”收敛为“只承诺 GitNexus 实际需要的 flowchart 能力”

---

## 1. 背景

截至 2026-04-07，以下 Mermaid bundling 路线均已审计否决：

- `mermaid.core.mjs`
- `mermaid.core.mjs + vendor-mermaid manual chunk`
- `mermaid.esm.mjs`

因此本轮不再继续入口切换，而是收口产品层面的 Mermaid 能力边界。

---

## 2. 需求面盘点

本轮通过源码引用审查盘点 Mermaid 实际使用面。`gitnexus impact` 仍被
`Buffer manager exception: Mmap for size 8796093022208 failed.` 阻断，因此这里使用源码级直接引用作为依据。

### 2.1 聊天 Mermaid 渲染

- `gitnexus-web/src/components/MarkdownRenderer.tsx`
  - 仅在 markdown fenced code block 的 language 为 `mermaid` 时渲染 `MermaidDiagram`
- `gitnexus-web/src/components/MermaidDiagram.tsx`
  - 既负责 inline 预览，也把原始 Mermaid 代码传给 `ProcessFlowModal` 做放大查看

### 2.2 流程 Mermaid 渲染

- `gitnexus-web/src/components/ProcessFlowModal.tsx`
  - 如果没有原始 Mermaid，就用 `generateProcessMermaid(process)` 生成流程图
- `gitnexus-web/src/lib/mermaid-generator.ts`
  - 默认输出 `graph TD`
  - 简化预览输出 `graph LR`

### 2.3 LLM Mermaid 输出约束

- `gitnexus-web/src/core/llm/agent.ts`
  - 原本已经明确写了 `Flowchart: graph TD or graph LR`
  - 仓库内没有产品级证据显示聊天面必须支持 `sequenceDiagram`、`classDiagram`、`stateDiagram`、`erDiagram` 等其他 Mermaid 家族

结论：

- GitNexus Web 当前有明确产品语义支撑的 Mermaid 能力只有 flowchart
- 其他 Mermaid 图类型更像“历史上默认能渲染就顺手渲染”，而不是产品契约

---

## 3. 本轮边界定义

本轮把 GitNexus Web 的 Mermaid 支持面定义为：

- 支持：
  - `graph TD`
  - `graph LR`
  - `flowchart TD`
  - `flowchart LR`
- 不承诺：
  - `sequenceDiagram`
  - `classDiagram`
  - `stateDiagram`
  - `erDiagram`
  - `gantt`
  - `journey`
  - `pie`
  - `architecture`
  - `mindmap`
  - 以及其他 Mermaid 图类型

行为约束：

- 聊天 Mermaid 代码块只在检测到 flowchart 语法时才进入 Mermaid runtime
- 流程弹窗如果拿到 AI 原始 Mermaid 且不是 flowchart，不再尝试渲染
- agent prompt 明确收紧到“只输出 flowchart”

---

## 4. 实现收口

本轮代码收口包括：

- 新增 `gitnexus-web/src/lib/mermaid-capability.ts`
  - 用纯函数检测 Mermaid 首个有效语句
  - 明确识别 flowchart 与常见非 flowchart 家族
- 更新 `gitnexus-web/src/components/MermaidDiagram.tsx`
  - 非 flowchart Mermaid 直接显示边界提示，不再调用 Mermaid runtime
- 更新 `gitnexus-web/src/components/ProcessFlowModal.tsx`
  - 原始 Mermaid 非 flowchart 时显示 supported-boundary 提示
  - 复制按钮对 raw Mermaid 保持原样复制
- 更新 `gitnexus-web/src/lib/mermaid-loader.ts`
  - 移除 inline Mermaid 初始化中的 `sequence` 配置，避免继续暗示 sequence 是产品承诺
- 更新 `gitnexus-web/src/core/llm/agent.ts`
  - 明确禁止输出其他 Mermaid 图家族

---

## 5. 验证

已执行：

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

结果：

- `3` 个 test file、`7` 个测试通过
- `npm run build` 通过

---

## 6. 对 Mermaid Warning 的实际影响

本轮并没有立即降低 Mermaid warning 体积。

构建结果：

- `mermaid.esm.min-*` 仍为 `781.40 KB`
- Mermaid 共享块 `chunk-7SRKK4IT-*` 仍为 `608.01 KB`
- 主入口 `index-*` 从稳定基线 `315.97 KB` 小幅升到 `319.10 KB`

这说明：

- 本轮收益是“产品契约收口”与“后续治理不再默认背负 Mermaid 全语法面”
- 本轮不是一条直接减小 Mermaid warning 的 bundling 切片

---

## 7. 结论

Mermaid 后续治理现在已经有了更明确的边界：

- 不再继续重复入口切换实验
- 产品层只承诺 flowchart
- 如果未来还要进一步压 Mermaid warning，应基于这条收紧后的能力边界继续评估更轻的运行时，而不是重新放开图类型全集
