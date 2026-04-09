# GitNexus Web LangChain Core Chunk Decomposition Review

日期：2026-04-07  
范围：`gitnexus-web/scripts/vite-chunking.mjs` 的 worker LangChain Core 分包策略  
相关变更：`openspec/changes/2026-04-07-gitnexus-web-langchain-core-chunk-decomposition`

---

## 1. 背景

经过前两轮收敛后：

- `ingestion.worker` 主入口已压到 `196.29 KB`
- `worker-onnx-*` 已从 `704.18 KB` 降到 `612.45 KB`

但 `worker-langchain-core-*` 仍停留在约 `618.62 KB`。

继续检查 `@langchain/core` 的包结构后可以确认：

- 当前 `worker-langchain-core` 规则把整个 `@langchain/core/` 与 `langsmith/` 粗粒度塞进一个 chunk
- 实际体量主要集中在 `@langchain/core/dist/` 下的多个大子树：
  - `utils` 约 `422.9 KB`
  - `messages` 约 `249.8 KB`
  - `runnables` 约 `214.7 KB`
  - `prompts` 约 `114.9 KB`
  - `tracers` 约 `96.7 KB`
  - `output_parsers` 约 `84.3 KB`

这说明当前的主要问题已经不是“没有分包”，而是“LangChain core 仍被一个过大的 catch-all 规则捏在一起”。

---

## 2. 本轮目标

本轮最初计划只做 worker LangChain core 的分包粒度收敛：

1. 让 `createWorkerManualChunks()` 对 `@langchain/core/dist/*` 使用更细的子树分组
2. 把 `langsmith/` 从 `worker-langchain-core` 中单独拆出
3. 用回归测试锁住新的代表性路由
4. 重新跑构建，确认 `worker-langchain-core-*` 是否继续下降或拆散到 warning 以下

本轮不做：

- 修改 agent/chat 行为
- 修改 LangChain provider 选择逻辑
- 修改 `worker-onnx` 解析条件
- Mermaid / cytoscape 优化

---

## 3. 实验结果

本轮实际验证了两种拆分方向：

1. 高体量子树拆分
   - 把 `messages` / `runnables` / `language_models` / `callbacks` / `tracers` / `tools` 与部分 `utils/*` 拆到 `worker-langchain-runtime`
   - 把剩余 `utils` / `prompts` / `output_parsers` / `load` / `singletons` 等拆到 `worker-langchain-utils`
   - 构建体积一度降到：
     - `worker-langchain-runtime 440.86 KB`
     - `worker-langchain-utils 178.66 KB`
   - 但新增 `worker-langchain-utils -> worker-langchain-runtime -> worker-langchain-utils` 循环 chunk 警告

2. 更保守的 observability / prompting 拆分
   - 仅把 `langsmith/` 与 `prompts` / `output_parsers` 拆出
   - 构建体积一度变成：
     - `worker-langchain-core 440.79 KB`
     - `worker-langchain-prompting 47.58 KB`
     - `worker-langchain-observability 130.21 KB`
   - 但仍新增两条循环 chunk 警告：
     - `worker-langchain-observability -> worker-langchain-core -> worker-langchain-observability`
     - `worker-langchain-core -> worker-langchain-prompting -> worker-langchain-core`

这说明当前 worker 实际依赖图里，`@langchain/core` 与 `langsmith`、prompt-related 子树都存在双向 chunk 依赖风险。

## 4. 结论

本轮没有把 LangChain core 的细粒度拆分保留下来，而是回退到最后一个无新增循环警告的稳定边界：

- `@langchain/core/` 与 `langsmith/` 继续合并在 `worker-langchain-core`
- `worker-langchain-core-*` 仍约 `618.62 KB`
- 该 warning 仍是后续治理项，但当前没有找到可接受的无环拆分边界

因此，这个切片当前的有效产出不是“已完成的分包优化”，而是：

- 证明了两类 LangChain 子树拆分方案都会引入新的循环 chunk 警告
- 把失败边界记录为审计资产，避免后续再次重复尝试同一错误方向
- 把 `worker-langchain-core` 明确保留为后续 warning 收敛项

---

## 5. 验证计划

```bash
cd gitnexus
npx vitest run test/unit/gitnexus-web-vite-chunking.test.ts --config vitest.config.ts

cd ../gitnexus-web
npm run build

cd ..
openspec validate 2026-04-07-gitnexus-web-langchain-core-chunk-decomposition
```
