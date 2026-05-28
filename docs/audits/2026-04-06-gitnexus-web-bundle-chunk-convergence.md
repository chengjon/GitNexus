# GitNexus Web Bundle Chunk Convergence Review

日期：2026-04-06  
范围：`gitnexus-web` 前端生产构建分包与 worker 构建边界  
相关变更：`openspec/changes/2026-04-06-gitnexus-web-bundle-chunk-convergence`

---

## 1. 背景

在 `gitnexus-web` build-boundary 修复完成后，`npm run build` 已可通过，但产物仍暴露出明显的 bundle 技术债：

- 浏览器主入口曾达到约 `3.0 MB`
- `ingestion.worker` 曾达到约 `4.5 MB`
- 初始 `manualChunks` 尝试把多组重依赖粗暴捏在一起，产生了新的超大 vendor chunk

这说明当前问题已从“构建会不会失败”转移为“构建是否仍把可选重量级能力静态塞进主入口 / worker 入口”。

---

## 2. 本轮目标

本轮只做低风险收敛，不改用户可见能力，不碰 GitNexus CLI / Claude Code / Codex 双 CLI 兼容逻辑。

目标是：

1. 降低浏览器主入口对 markdown 高亮与 Mermaid 的静态耦合
2. 把 `ingestion.worker` 中的 LLM / embeddings / parser / zip 相关重量级依赖拆成独立 chunk
3. 让分包规则在 `vite.config.ts` 与 `vite.inline.config.mjs` 间保持一致
4. 记录已完成收敛与剩余 warning 的真实边界

---

## 3. 已实施修改

### 3.1 共享构建分包规则

新增：

- `gitnexus-web/scripts/vite-chunking.mjs`

作用：

- 统一浏览器主包与 worker 的 `manualChunks`
- 避免 `vite.config.ts` 与 `vite.inline.config.mjs` 再次漂移
- 对浏览器主包补充拆出：
  - `vendor-react`
- 对 worker 单独拆出：
  - `worker-langgraph`
  - `worker-llm-providers`
  - `worker-langchain-core`
  - `worker-transformers`
  - `worker-onnx`
  - `worker-tree-sitter`
  - `worker-graph`
  - `worker-zip`

### 3.2 语法高亮改为 light Prism 注册表

新增：

- `gitnexus-web/src/lib/syntax-highlighter.ts`
- `gitnexus-web/src/types/react-syntax-highlighter-modules.d.ts`

修改：

- `gitnexus-web/src/components/MarkdownRenderer.tsx`
- `gitnexus-web/src/components/CodeReferencesPanel.tsx`

作用：

- 从全量 `Prism` 导入切到 `prism-light`
- 只注册项目实际需要的语言集合
- 保留现有主题视觉
- 统一 markdown fence 与文件路径到语言名的解析

### 3.3 Mermaid 改为运行时懒加载

新增：

- `gitnexus-web/src/lib/mermaid-loader.ts`

修改：

- `gitnexus-web/src/components/MermaidDiagram.tsx`
- `gitnexus-web/src/components/ProcessFlowModal.tsx`

作用：

- 去掉模块顶层 `import mermaid from 'mermaid'`
- 改为按需 `import('mermaid')`
- 保留 inline diagram 与 process-flow modal 各自的初始化配置

### 3.4 补充构建回归测试

新增：

- `gitnexus/test/unit/gitnexus-web-vite-chunking.test.ts`

作用：

- 锁住 `vite-chunking.mjs` 对浏览器 runtime chunk 与 worker heavyweight chunk 的关键分包行为
- 防止后续再把 `react` / `react-dom` 或 worker AI 栈静态回流进入口 helper 逻辑

---

## 4. 结果对比

### 4.1 关键产物尺寸变化

| 产物 | 变更前 | 本轮后 |
| --- | ---: | ---: |
| 浏览器主入口 `index` | 约 `3.0 MB` | `315.97 KB` |
| `ingestion.worker` 主入口 | `4,496.87 KB` | `272.33 KB` |
| markdown/highlight 相关 chunk | 曾并入超大主包 / vendor chunk | `vendor-text 319.57 KB` |
| Mermaid 主模块 | 曾并入超大 vendor chunk | `mermaid.esm.min 781.29 KB` |
| 浏览器框架 runtime | 曾并入主入口 | `vendor-react 229.63 KB` |

### 4.2 当前构建输出中的已收敛部分

当前 `npm run build` 已稳定通过，并且出现了明确的职责分包：

- `vendor-react 229.63 KB`
- `worker-langgraph 132.92 KB`
- `worker-llm-providers 372.76 KB`
- `worker-transformers 451.35 KB`
- `worker-tree-sitter 65.85 KB`
- `worker-zip 97.05 KB`
- `worker-graph 82.94 KB`
- `vendor-text 319.57 KB`

这说明：

- 浏览器主入口已经不再静态背负 React / ReactDOM / Lucide runtime
- worker 主入口不再静态背负完整 LLM / embeddings / parser 栈
- markdown 与 syntax highlight 已从全量 Prism 导入收敛到可控范围

---

## 5. 仍然存在的技术债

本轮没有把所有 chunk warning 清零，残留问题如下：

| chunk | 尺寸 | 说明 |
| --- | ---: | --- |
| `chunk-7SRKK4IT-*.js` | `608.01 KB` | 主要是 Mermaid 依赖的 `cytoscape` / layout 相关代码 |
| `mermaid.esm.min-*.js` | `781.40 KB` | Mermaid 核心仍偏重，但已从主入口剥离为懒加载模块 |
| `worker-langchain-core-*.js` | `616.88 KB` | LangChain core 仍偏大 |
| `worker-onnx-*.js` | `704.18 KB` | ONNX runtime 相关代码仍偏大 |

### 5.1 这些 warning 的性质

这些 warning 已不再是“所有重量都压在单入口”的同类问题，而是分裂成三类：

1. 主入口边缘超阈值  
   这一项已在补充的 `vendor-react` 分包后收口，浏览器主入口现在是 `315.97 KB`。

2. Mermaid 生态自身重量  
   Mermaid 核心与其 layout / cytoscape 依赖已经改成懒加载，但其懒加载块本身仍较大。

3. worker 中可选 AI / native 运行时能力仍偏重  
   `worker-langchain-core` 与 `worker-onnx` 已被拆出主 worker，但还没有进一步做到“只在调用相关功能时再动态加载”。

### 5.2 已排除的一次低收益实验

本轮额外试过把 Mermaid alias 从 `mermaid.esm.min.mjs` 切到
`mermaid.core.mjs`。

结果：

- `index` 维持在低位
- 但产物退化为更大的 `vendor-text` 与 `vendor-cytoscape`
- 总体 warning 面并没有改善

因此该实验已回退，保留当前 `mermaid.esm.min.mjs` alias 方案。

---

## 6. 推荐下一步

下一轮如果继续做，应优先按下面顺序推进：

### 6.1 P1：worker 侧继续懒加载 LLM / embedding 栈

优先把以下路径从 worker 静态入口挪到按需导入：

- `createGraphRAGAgent` / `streamAgentResponse`
- `createChatModel`
- embeddings / ONNX 初始化路径

目标：

- 进一步压缩 `worker-langchain-core`
- 进一步压缩 `worker-onnx`
- 避免“仅做 ingestion 也预先加载完整 AI 栈”

### 6.2 P1：继续削减浏览器主入口边缘超阈值

可以评估：

- 继续拆分 browser runtime / worker orchestration runtime
- 对非首屏必需面板做更细粒度懒加载

### 6.3 P2：评估 Mermaid 能否继续轻量化

如果必须把 warning 数量继续压下去，再评估：

- 是否可以只保留 GitNexus 实际需要的 Mermaid 图类型
- 是否需要把 Mermaid 图能力做更显式的 feature boundary

当前不建议为了消 warning 而简单调高 `chunkSizeWarningLimit`。

---

## 7. 验证

本轮已验证：

```bash
cd gitnexus
npx vitest run test/unit/gitnexus-web-vite-chunking.test.ts --config vitest.config.ts

cd gitnexus-web
npm run build
```

结果：

- 构建通过
- 仍有大 chunk warning，但 warning 的位置与性质已明显收敛
- 早先的构建边界回归未复发

已知非阻塞 warning：

- `web-tree-sitter` 的 `fs` / `path` browser externalization 提示
- `web-tree-sitter` 使用 `eval` 的上游警告

这些不是本轮新增问题。
