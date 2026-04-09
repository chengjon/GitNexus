# GitNexus Web Worker Runtime Lazy-Loading Review

日期：2026-04-06  
范围：`gitnexus-web/src/workers/ingestion.worker.ts` 的运行时依赖加载边界  
相关变更：`openspec/changes/2026-04-06-gitnexus-web-worker-runtime-lazy-loading`

---

## 1. 背景

`gitnexus-web` 的 bundle/chunk 收敛切片已经把：

- 浏览器主入口压到约 `315.97 KB`
- `ingestion.worker` 主入口压到约 `272.33 KB`

但这并不代表 worker 启动阶段已经真正“按需加载”。

当前 `ingestion.worker.ts` 仍在模块顶层静态导入：

- embedding pipeline / embedder
- Graph RAG agent runtime
- context builder
- `@langchain/core/messages`

这会继续制造两个问题：

1. 只做 ingestion 或 BM25 搜索时，worker 仍会在初始化时解析 AI / embedding 相关运行时代码
2. 后续如果有人把重依赖重新放回顶层 import，之前的 chunk 收敛成果会悄悄回退

因此需要补一个更窄的 follow-up 切片，把“已经拆成独立 chunk”继续推进到“确实只在调用对应能力时再加载”。

---

## 2. 本轮目标

本轮只处理 worker 内部的运行时加载边界：

1. 保持 `IngestionWorkerApi` 的对外方法签名不变
2. 把 embedding 相关运行时代码改为首次使用时加载
3. 把 agent / chat / enrichment 相关运行时代码改为首次使用时加载
4. 增加一个回归测试，禁止这些重依赖重新回到 worker 顶层静态 import

本轮不做：

- UI 行为改动
- Claude Code / Codex CLI 兼容逻辑变更
- Mermaid / cytoscape 继续瘦身
- `chunkSizeWarningLimit` 粗暴放宽

---

## 3. 已实施修改

### 3.1 Worker 运行时模块改为缓存式动态加载

在 `ingestion.worker.ts` 中增加了缓存式 loader，按需加载：

- `../core/embeddings/embedding-pipeline`
- `../core/embeddings/embedder`
- `../core/llm/agent`
- `../core/llm/context-builder`
- `@langchain/core/messages`

实现结果：

- 首次调用时通过 `import(...)` 动态导入
- 后续复用同一个模块实例
- `IngestionWorkerApi` 的方法签名未改动

### 3.2 受影响方法

以下 worker 方法已改为通过 lazy loader 访问重依赖：

- `startEmbeddingPipeline`
- `semanticSearch`
- `semanticSearchWithContext`
- `hybridSearch`
- `isEmbeddingModelReady`
- `disposeEmbeddingModel`
- `initializeAgent`
- `initializeBackendAgent`
- `chatStream`
- `enrichCommunities`

### 3.3 回归测试

新增：

- `gitnexus/test/unit/gitnexus-web-worker-lazy-imports.test.ts`

验证点：

- 上述重依赖不再以运行时静态 import 形式出现在 `ingestion.worker.ts` 顶层
- worker 内仍保留对应的动态 `import(...)` 边界
- 测试先失败、重构后转绿

---

## 4. 结果

### 4.1 构建产物变化

本轮完成后，`npm run build` 的关键 worker 产物变为：

| 产物 | 上一轮 | 本轮后 |
| --- | ---: | ---: |
| `ingestion.worker` 主入口 | `272.33 KB` | `196.29 KB` |
| `embedder` | 并入 worker 运行时路径 | `2.08 KB` |
| `embedding-pipeline` | 并入 worker 运行时路径 | `5.21 KB` |
| `context-builder` | 并入 worker 运行时路径 | `3.26 KB` |
| `agent` | 并入 worker 运行时路径 | `41.66 KB` |

这说明 worker bootstrap 已不再默认背负 embedding / agent / context 的直接运行时代码。

### 4.2 本轮收敛到位的边界

本轮已明确做到：

- worker 启动路径不再默认解析 embedding / agent 运行时
- 仅在用户启动 embedding、chat、cluster enrichment 等功能时才加载对应模块
- worker 对外 API 未发生破坏性变化
- 后续维护者有测试和审计记录可依赖，避免再次把重依赖塞回 worker 顶层

### 4.3 仍然存在的技术债

本轮没有继续处理下列 warning-sized chunk：

| chunk | 尺寸 | 说明 |
| --- | ---: | --- |
| `worker-langchain-core-*` | `618.62 KB` | LangChain core 仍偏大，但已不再位于 worker bootstrap 入口 |
| `worker-onnx-*` | `704.18 KB` | ONNX runtime 仍偏大，但已是 embedding 相关后续治理问题 |
| `mermaid.esm.min-*` | `781.40 KB` | Mermaid 懒加载块仍重 |
| `chunk-7SRKK4IT-*` | `608.01 KB` | Mermaid / cytoscape 相关块仍偏大 |

---

## 5. 验证

本轮已验证：

```bash
cd gitnexus
npx vitest run test/unit/gitnexus-web-worker-lazy-imports.test.ts --config vitest.config.ts

npx vitest run test/unit/gitnexus-web-vite-chunking.test.ts --config vitest.config.ts

cd gitnexus-web
npm run build

cd ..
openspec validate 2026-04-06-gitnexus-web-worker-runtime-lazy-loading
```

结果：

- worker lazy-import 回归测试通过
- 既有 Vite chunking 回归测试通过
- 生产构建通过
- OpenSpec change 验证通过

另外已执行：

```bash
gitnexus_detect_changes({ scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus" })
```

返回 `low` 风险摘要，未发现新的高风险受影响流程。
