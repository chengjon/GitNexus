## Why

`gitnexus-web` 的生产构建边界修复完成后，构建已能稳定通过，但 bundle 仍然暴露出明显的入口膨胀问题：

- 浏览器主入口曾达到约 `3.0 MB`
- `ingestion.worker` 曾达到约 `4.5 MB`
- markdown 高亮、Mermaid、LangChain、ONNX、tree-sitter 等重量级能力仍然会被粗粒度打包

这类问题不会立刻让构建失败，但会持续制造：

- 首屏与 worker 启动成本偏高
- 分包 warning 持续噪声化
- 后续再做功能迭代时更难判断“哪些重量是必要的，哪些是被静态耦合带进来的”

因此需要一个独立切片，把 bundle 技术债从“构建能过就先放着”收敛到“主入口 / worker 入口 / 可选能力边界更清楚”的状态。

## What Changes

- 新增共享的 Vite app/worker 分包规则，避免 `vite.config.ts` 与 `vite.inline.config.mjs` 漂移
- 把浏览器 framework runtime 从主入口中拆出独立 vendor chunk
- 把语法高亮改为 light Prism 注册表，去掉全量 Prism 语言包
- 把 Mermaid 改成运行时懒加载，避免继续从模块顶层静态拉入浏览器主入口
- 把 worker 中的 langgraph / providers / langchain core / transformers / onnx / parser / zip 图谱依赖拆成独立 chunk
- 为 chunk helper 增加回归测试
- 记录构建前后产物尺寸与剩余 warning 的真实边界

## Capabilities

### New Capabilities

- `gitnexus-web-bundle-chunk-convergence`: Keep `gitnexus-web` browser and worker entry bundles bounded by separating heavyweight optional visualization, markdown, LLM, embedding, parser, and zip dependencies into clearer chunk boundaries.

### Modified Capabilities

- None.

## Impact

- Affected frontend build files:
  - `gitnexus-web/vite.config.ts`
  - `gitnexus-web/vite.inline.config.mjs`
  - `gitnexus-web/scripts/vite-chunking.mjs`
- Affected tests:
  - `gitnexus/test/unit/gitnexus-web-vite-chunking.test.ts`
- Affected frontend runtime files:
  - `gitnexus-web/src/components/MarkdownRenderer.tsx`
  - `gitnexus-web/src/components/CodeReferencesPanel.tsx`
  - `gitnexus-web/src/components/MermaidDiagram.tsx`
  - `gitnexus-web/src/components/ProcessFlowModal.tsx`
  - `gitnexus-web/src/lib/syntax-highlighter.ts`
  - `gitnexus-web/src/lib/mermaid-loader.ts`
  - `gitnexus-web/src/types/react-syntax-highlighter-modules.d.ts`
- Affected audit trail:
  - `docs/audits/2026-04-06-gitnexus-web-bundle-chunk-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
