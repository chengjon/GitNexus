# GitNexus Web Embedding Runtime Narrow Entry Retest

日期：2026-04-09
范围：`gitnexus-web` embedding runtime 对 `@huggingface/transformers` 顶层入口的 follow-up 复测
治理：`DEVELOPMENT_RULES.md`

---

## 1. 背景

在前一轮前端收敛后，构建面上还剩一个主要大块：

- `worker-onnx-*` `581.07 KB`

同时 `worker-transformers-*` 仍有：

- `451.39 KB`

由于 `embedder.ts` 当前通过：

- `import { pipeline, env } from '@huggingface/transformers'`

加载 embedding runtime，因此做了一次新的前端-only 复测：

- 不继续碰 ONNX provider shim
- 不改 backend / doctor / CI / host guidance
- 不改 `gitnexus/src/**`
- 只验证“去掉顶层 `pipeline()` 宽入口，是否能进一步收窄 worker runtime”

---

## 2. 复测路线

实验做法是：

1. 不再从 `@huggingface/transformers` 顶层入口导入 `pipeline()`
2. 改为直接使用 upstream source 子模块：
   - `src/env.js`
   - `src/models.js`
   - `src/tokenizers.js`
   - `src/utils/tensor.js`
3. 在本地实现一个最小 feature-extraction runner，仅保留 embedding 所需的：
   - tokenizer
   - model
   - mean pooling / normalize / quantize

目标是假设：

- `pipeline()` 入口过宽，可能把许多与 embedding 无关的 pipeline/task 代码一起卷进 `worker-transformers`

---

## 3. 结果

### 3.1 体积变化

实验构建结果显示：

| 产物 | 稳定基线 | 实验结果 |
| --- | ---: | ---: |
| `worker-transformers-*` | `451.39 KB` | `317.90 KB` |
| `worker-onnx-*` | `581.07 KB` | `587.37 KB` |
| `worker-onnx-support-*` | `18.91 KB` | `18.97 KB` |
| `ingestion.worker-*` | `196.29 KB` | `196.64 KB` |

也就是说：

- `worker-transformers` 确实下降了
- 但用户当前优先级更高的 `worker-onnx` 反而回升了

### 3.2 warning 面恶化

更关键的是，这条路线重新引入了一组不接受的 browser externalization warning，包括：

- `node:fs`
- `node:path`
- `node:url`
- `node:events`
- `node:os`
- `child_process`
- `node:util`
- `node:stream`
- `node:crypto`
- 以及 `sharp` / `detect-libc` 相关链路

这些 warning 并不是当前稳定基线上存在的问题，而是由深层源码入口重新把 Node-side 分支暴露给 Vite 解析造成的。

---

## 4. 结论

这条“embedding runtime narrow entry”路线最终被否决，原因有二：

1. 它没有进一步压低当前更优先的 `worker-onnx`
2. 它重新引入了一串此前已经收敛掉的 browser externalization warning

因此当前应保留的工程结论是：

- `@huggingface/transformers` 顶层 `pipeline()` 在本项目里仍是当前更稳定的入口
- 不应为了压 `worker-transformers`，把 `worker-onnx` 和 warning 面一起恶化

---

## 5. 处理结果

本次实验代码已回退，不保留在工作区。

稳定前端基线仍为：

- Mermaid runtime 静态资产化
- LangChain shared vendor split
- ONNX support split
- `web-tree-sitter` upstream `eval` warning scoped filter

剩余真正未解决的 bundle 债务仍收敛为：

- `worker-onnx-*` `581.07 KB`

下一轮如果继续尝试，只能寻找不会重新引入 Node/browser warning、也不会把重量回流到 `worker-onnx` 的新边界。
