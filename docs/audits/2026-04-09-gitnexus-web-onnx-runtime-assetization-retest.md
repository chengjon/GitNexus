# GitNexus Web ONNX Runtime Assetization Retest

日期：2026-04-09
范围：`gitnexus-web` 前端-only `worker-onnx` follow-up 复测
治理：`DEVELOPMENT_RULES.md`

---

## 1. 背景

在 `2026-04-09` 之前的稳定前端基线下，剩余主要 AI runtime 大块为：

- `worker-onnx-*` `581.07 KB`
- `worker-transformers-*` `451.39 KB`

此前已经证伪的方向包括：

- embedding runtime narrow-entry
- ONNX provider-aware runtime shim
- bare-package runtime shim 拆分 `webgpu/wasm` 子入口

因此本轮只验证一个更窄的变体：

- 不改 `@huggingface/transformers` 调用层
- 不改 `gitnexus/src/**`
- 只把裸包 `onnxruntime-web` alias 到本地 asset shim
- 让 shim 在运行时导入复制到 `/vendor/onnxruntime/ort.min.mjs` 的静态 runtime 资产

目标是假设：

- 若 ORT runtime 从 Rollup worker bundle 中整体搬出
- 则 `worker-onnx` 也许能继续下降，且不会把重量回流到其他 AI worker chunk

---

## 2. 实验做法

实验包含四部分：

1. 新增本地 `onnxruntime-web` asset shim
   - 保留 `InferenceSession.create` / `env` / `Tensor` 等最小表面
   - 在首个 session 创建前动态导入 `/vendor/onnxruntime/ort.min.mjs`
   - 并把 `wasmPaths` 指向复制后的：
     - `ort-wasm-simd-threaded.jsep.mjs`
     - `ort-wasm-simd-threaded.jsep.wasm`

2. Vite bare-package alias
   - 仅让裸包 `onnxruntime-web` 命中本地 shim
   - 不影响子路径入口

3. 静态资产复制
   - 将 `node_modules/onnxruntime-web/dist/*.{mjs,wasm}` 复制到 `vendor/onnxruntime`

4. 回归测试
   - 先用红测确认 alias / static-copy / shim 常量缺失
   - 再补最小实现转绿

---

## 3. 结果

### 3.1 回归测试

新增的前端回归测试在实验实现下能够通过：

- `gitnexus-web-vite-static-copy`
- `gitnexus-web-vite-config`
- `gitnexus-web-onnx-runtime-asset-shim`

说明：

- bare-package alias 与静态资产复制都按预期接通
- shim 常量也正确指向复制后的 runtime 资产路径

### 3.2 构建结果

实验构建成功，且本地 warning 面没有恶化。

但 chunk 结果显示这条路线失败：

| 产物 | 稳定基线 | 实验结果 |
| --- | ---: | ---: |
| `worker-onnx-*` | `581.07 KB` | 从主构建产物中消失 |
| `worker-transformers-*` | `451.39 KB` | `904.86 KB` |
| `worker-onnx-support-*` | `18.91 KB` | `18.93 KB` |

也就是说：

- ORT runtime 确实被搬离了原先的 `worker-onnx` 包体
- 但它没有真正消失，而是大规模回流到了 `worker-transformers`

这比稳定基线更差，因为当前最大的 AI worker warning 面重新落回了：

- `worker-transformers-*` `904.86 KB`

---

## 4. 结论

这条 “ONNX runtime static assetization” 路线被否决。

原因：

1. 它没有真正降低 AI runtime 总体重量
2. 它把 `worker-transformers-*` 从 `451.39 KB` 推高到 `904.86 KB`
3. 它在工程效果上再次复现了此前 ONNX shim 系列实验的失败模式：
   - 表面上改变了 ORT runtime 的装载位置
   - 实际上只是把重量换到另一个更坏的 worker chunk

因此当前应更新的工程结论是：

- 不应继续通过 `onnxruntime-web` 静态资产化来压 `worker-onnx`
- 这条路线属于新的已证伪方向

---

## 5. 处理结果

本次实验实现已回退，不保留在工作区。

当前稳定前端基线仍为：

- Mermaid runtime 静态资产化
- LangChain shared vendor split
- ONNX support split
- `web-tree-sitter` upstream `eval` warning scoped filter

剩余 bundle 技术债仍收敛为：

- `worker-onnx-*` `581.07 KB`

在出现新的稳定边界证据前，不应继续沿 `onnxruntime-web` asset shim / runtime assetization 方向反复试验。
