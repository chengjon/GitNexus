## Why

`gitnexus-web` 在完成主入口收敛、worker runtime lazy-loading 和 ONNX resolve 条件修复后，
剩余最稳定、最顽固的前端 warning 仍集中在 Mermaid 生态：

- `mermaid.esm.min-*` 约 `781 KB`
- Mermaid 共享块约 `608 KB`

截至 2026-04-07，以下纯 bundling / 入口切换路线都已被审计否决：

- `mermaid.core.mjs`
- `mermaid.core.mjs + vendor-mermaid manual chunk`
- `mermaid.esm.mjs`

这说明问题已经不再是“是否选对入口”，而是“GitNexus Web 对 Mermaid 的能力边界仍然过宽”。

因此下一步需要一个独立切片，把 Mermaid 从“默认承载整个 Mermaid 图类型全集”收敛为
“只承载 GitNexus 产品语义真正需要的图类型集合”。

## What Changes

- 明确 GitNexus Web 在聊天渲染和流程图渲染里实际承诺支持的 Mermaid 图类型
- 为 Mermaid loader / renderer 建立 capability boundary，避免默认承载整个 Mermaid 图类型全集
- 补充审计与回归验证，确保该能力边界可维护、可解释

## Capabilities

### New Capabilities

- `gitnexus-web-mermaid-capability-boundary`: Keep Mermaid bundle convergence tied to an explicit, documented diagram capability boundary instead of repeated entry-file experiments.

### Modified Capabilities

- None.

## Impact

- Expected affected app surface:
  - `gitnexus-web/src/lib/mermaid-loader.ts`
  - `gitnexus-web/src/components/MermaidDiagram.tsx`
  - `gitnexus-web/src/components/ProcessFlowModal.tsx`
- Expected audit trail:
  - `docs/audits/2026-04-07-gitnexus-web-mermaid-esm-entry-retest.md`
  - `docs/audits/2026-04-07-gitnexus-web-mermaid-core-entry-retest.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
