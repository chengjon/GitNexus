# GitNexus Web ONNX Provider Shim Retest

日期：2026-04-07  
范围：`gitnexus-web` worker ONNX 分包与 `onnxruntime-web` 裸包入口  
目标：确认本地 provider shim 能否把 ONNX runtime 安全拆成 `webgpu/wasm` 两个 worker chunk

---

## 1. 背景

在当前稳定构建下：

- `worker-onnx-*` 约 `612.45 KB`
- `worker-transformers-*` 约 `451.35 KB`

`worker-onnx` 仍然超过 warning 阈值，因此尝试了一条新的 worker bundling 路线：

- 不再让 `@huggingface/transformers` 直接绑定 `onnxruntime-web` 的单一根入口
- 改为通过本地 shim 在 `InferenceSession.create()` 时按 `executionProviders` 选择：
  - `onnxruntime-web/webgpu`
  - `onnxruntime-web/wasm`
- 同时把 worker manual chunk 细化为：
  - `worker-onnx-webgpu`
  - `worker-onnx-wasm`

---

## 2. 实验结果

该实验构建通过，并且确实把 ORT runtime 拆成了两个独立 worker chunk：

- `worker-onnx-webgpu 612.51 KB`
- `worker-onnx-wasm 91.24 KB`

但同时引入了更坏的副作用：

- `worker-transformers 905.35 KB`

也就是说，这条路线没有真正把 AI runtime 总体收敛到更细的稳定边界，而是把原先 `worker-onnx` 的一部分重量回流到了 `worker-transformers`。

从产物结构看：

- `worker-transformers` 顶部静态依赖 `worker-onnx-webgpu`
- shim 逻辑被并入 `worker-transformers`
- 最终形成了更大的 `transformers + shim + runtime bridge` 组合块

结果比稳定基线更差：

- 稳定基线：
  - `worker-transformers 451.35 KB`
  - `worker-onnx 612.45 KB`
- 本次实验：
  - `worker-transformers 905.35 KB`
  - `worker-onnx-webgpu 612.51 KB`
  - `worker-onnx-wasm 91.24 KB`

虽然 `wasm` 被拆出来了，但新增的 `worker-transformers` warning 让总体 warning 面更差。

---

## 3. 结论

本次 ONNX provider shim 路线已回退，不保留在稳定配置中。

原因不是“不能运行”，而是：

- 拆分收益只体现在 `wasm` 子块
- 但主 `webgpu` 运行时没有下降
- 还把 `worker-transformers` 从可接受范围推到了新的超阈值大块

因此，这条路线当前的工程结论是：

- 可以证明 `onnxruntime-web` 的 provider 选择可通过本地 shim 延后到 session 创建时
- 但在当前 Vite + `@huggingface/transformers` 打包结构下，这种做法会恶化 chunk 拓扑
- 后续不应再沿这条 shim 路线继续推进

下一步如果还要收敛 ONNX warning，应该优先考虑：

- 研究 `@huggingface/transformers` 是否存在更细的入口或按任务拆分边界
- 或把 embeddings/transformers 功能本身再往更显式的 feature boundary 上推
