## Why

`gitnexus-web` 的 bundle/chunk 收敛切片已经把 `ingestion.worker` 主入口压小，
但 worker 仍在模块顶层静态导入 embedding 与 agent 相关运行时。

这意味着即使用户只是做 ingestion、BM25 搜索或 Kuzu 查询，worker 初始化时仍会
解析本应可选的 AI / embedding 运行时代码。

这类问题不会立即造成功能错误，但会持续制造：

- worker 启动阶段的非必要解析成本
- 可选能力与默认能力边界不清晰
- 后续维护者把重依赖重新拉回顶层 import 的回归风险

因此需要一个独立切片，把 worker 的运行时边界继续从
“已拆成独立 chunk”收敛到“只在调用对应能力时才加载”。

## What Changes

- 把 `ingestion.worker.ts` 中 embedding 相关运行时访问改为缓存式动态导入
- 把 `ingestion.worker.ts` 中 Graph RAG agent / context / LangChain messages 相关运行时访问改为缓存式动态导入
- 保持现有 `IngestionWorkerApi` 对外方法签名与调用方式不变
- 为 worker 顶层 import 边界新增一个回归测试
- 记录本轮运行时边界收敛与验证结果

## Capabilities

### New Capabilities

- `gitnexus-web-worker-runtime-lazy-loading`: Keep optional embedding and agent runtimes out of the `ingestion.worker` bootstrap path until the corresponding worker APIs are invoked.

### Modified Capabilities

- None.

## Impact

- Affected frontend worker runtime:
  - `gitnexus-web/src/workers/ingestion.worker.ts`
- Affected tests:
  - `gitnexus/test/unit/gitnexus-web-worker-lazy-imports.test.ts`
- Affected audit trail:
  - `docs/audits/2026-04-06-gitnexus-web-worker-runtime-lazy-loading.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
