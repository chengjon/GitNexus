# GitNexus Web ONNX Runtime Shim Retest

日期：2026-04-09
范围：`gitnexus-web` 前端-only `worker-onnx` follow-up 复测
治理：`DEVELOPMENT_RULES.md`

---

## 1. 背景

在已有稳定前端基线下，剩余最大的未收敛 bundle 债务是：

- `worker-onnx-*` `581.07 KB`

此前已经证伪过的路线包括：

- ONNX provider shim 路线
- embedding runtime narrow-entry 路线

因此本轮只测试一个新的、更窄的变体：

- 不改 `transformers` 业务调用层
- 只把裸包 `onnxruntime-web` alias 到一个前端本地 shim
- 让 shim 在运行时按 execution provider 动态导入：
  - `onnxruntime-web/webgpu`
  - `onnxruntime-web/wasm`

目标是验证：

- 是否能把 `worker-onnx` 从单块继续拆散
- 且不重新把重量回流到别的 worker chunk

---

## 2. 实验做法

实验包含三部分：

1. Vite bare-package alias
   - 只对裸包 `onnxruntime-web` 生效
   - 不影响 `onnxruntime-web/webgpu` 与 `onnxruntime-web/wasm` 子入口

2. 本地 runtime shim
   - 保留 `Tensor` / `env` / `InferenceSession.create`
   - 在 `create()` 时根据 `executionProviders` 选择 `webgpu` 或 `wasm` 子入口

3. worker chunk 规则
   - `ort.webgpu.min.mjs` 单独路由到 `worker-onnx-webgpu`
   - `ort.wasm.min.mjs` 单独路由到 `worker-onnx-wasm`

同时补了对应回归测试，验证：

- alias 只命中裸包
- chunking 规则按预期分流
- shim 对 string/object 两种 execution provider 都能做相同选择

---

## 3. 结果

### 3.1 表面结果

这条路线确实把 ONNX runtime 从单块拆成了两块：

| 产物 | 稳定基线 | 实验结果 |
| --- | ---: | ---: |
| `worker-onnx-*` | `581.07 KB` | `worker-onnx-webgpu 580.93 KB` |
| `worker-onnx-wasm-*` | `N/A` | `91.24 KB` |
| `worker-onnx-support-*` | `18.91 KB` | `18.92 KB` |

但这只是表面上“切开了”。

### 3.2 真实失败点

同一次构建里，更大的问题是：

- `worker-transformers-*` 从 `451.39 KB` 膨胀到 `904.51 KB`

也就是说，这条路线虽然把 ONNX runtime 名义上拆成了 `webgpu/wasm` 子块，
但总体重量并没有消失，而是再次回流到了 `worker-transformers`。

这与 `2026-04-07` 已经证伪的 ONNX provider shim retest 结果在工程性质上高度一致：

- `worker-onnx` 形态发生变化
- 但 AI runtime 总体 warning 面没有改善
- 反而把另一块 worker 顶到了更坏的位置

---

## 4. 结论

这条 `onnxruntime-web` bare-package runtime shim 路线被否决。

原因：

1. 它没有真正收敛 AI runtime 总体重量
2. 它把 `worker-transformers` 推高到 `904.51 KB`
3. 它本质上再次复现了此前 provider shim 路线的坏结果，只是入口形态不同

因此当前结论应更新为：

- 不应再通过 `onnxruntime-web` 入口 shim / provider-aware runtime shim 继续压 `worker-onnx`
- 这条路线属于新的已证伪方向

---

## 5. 处理结果

本次实验实现已经回退，不保留在工作区。

当前稳定前端基线仍为：

- Mermaid runtime 静态资产化
- LangChain shared vendor split
- ONNX support split
- `web-tree-sitter` upstream `eval` warning scoped filter

剩余 bundle 技术债仍收敛为：

- `worker-onnx-*` `581.07 KB`

在没有新的稳定边界证据前，不应继续沿 ONNX runtime shim / provider split 方向反复试验。
