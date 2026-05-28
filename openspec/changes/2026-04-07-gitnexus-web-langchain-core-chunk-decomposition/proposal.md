## Why

`gitnexus-web` 的 worker runtime 与 ONNX 解析条件已经完成两轮收敛，但
`worker-langchain-core-*` 仍保持 warning-sized chunk。

检查当前 `vite-chunking.mjs` 后可以确认，问题来自分包粒度本身：

- `@langchain/core/` 整个包被粗粒度塞进 `worker-langchain-core`
- `langsmith/` 也被一并并入这个 chunk
- 实际大体量分散在 `dist/utils`、`dist/messages`、`dist/runnables`、`dist/prompts` 等不同子树

因此需要一个独立切片验证 LangChain core 的 worker chunk 能否从“整包 catch-all”
安全收敛到“按高体量子树拆分”的状态。

## What Changes

- 试验两类 LangChain worker 分包方案，并通过构建结果验证它们是否引入新的循环 chunk 警告
- 由于两种方案都引入了双向 chunk 依赖警告，最终保持稳定的 `worker-langchain-core` 边界不变
- 更新 chunking 回归测试，锁住当前稳定边界
- 记录构建实验结果，作为后续 LangChain warning 收敛的审计依据

## Capabilities

### New Capabilities

- `gitnexus-web-langchain-core-chunk-decomposition`: Keep the LangChain worker chunk follow-up auditable by recording which subtree decomposition attempts introduced circular chunk warnings and were rejected.

### Modified Capabilities

- None.

## Impact

- Affected build helper:
  - `gitnexus-web/scripts/vite-chunking.mjs`
- Affected tests:
  - `gitnexus/test/unit/gitnexus-web-vite-chunking.test.ts`
- Affected audit trail:
  - `docs/audits/2026-04-07-gitnexus-web-langchain-core-chunk-decomposition.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
