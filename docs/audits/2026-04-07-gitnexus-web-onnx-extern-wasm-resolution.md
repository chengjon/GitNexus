# GitNexus Web ONNX External-WASM Resolution Review

日期：2026-04-07  
范围：`gitnexus-web` 的 Vite app/inline 构建解析条件  
相关变更：`openspec/changes/2026-04-07-gitnexus-web-onnx-extern-wasm-resolution`

---

## 1. 背景

在前一轮 worker runtime lazy-loading 收敛后：

- `ingestion.worker` 主入口已降到 `196.29 KB`
- 但 `worker-onnx-*` 仍有约 `704.18 KB`

继续检查依赖结构后可以确认：

- `@huggingface/transformers` 在浏览器环境内部会导入 `onnxruntime-web`
- `onnxruntime-web` 包本身为 ESM 导出提供了 `onnxruntime-web-use-extern-wasm` 条件
- 如果构建工具没有显式启用该条件，默认会走 `*.bundle.min.mjs` 入口，而不是更轻的 external-wasm 入口

这意味着当前剩余的 worker ONNX 技术债里，有一部分并不是“业务代码必须更重”，而是“构建解析条件没有显式收敛”。

---

## 2. 本轮目标

本轮只做构建解析条件收敛：

1. 在 `vite.config.ts` 与 `vite.inline.config.mjs` 中统一启用 `onnxruntime-web-use-extern-wasm`
2. 用回归测试锁住这两个配置的同步行为
3. 重新跑生产构建，验证 `worker-onnx-*` 是否继续下降

本轮不做：

- 修改 embedding / agent 业务逻辑
- 放弃 WebGPU/WASM 双设备支持
- 调整 `chunkSizeWarningLimit`
- Mermaid / cytoscape 进一步优化

---

## 3. 已实施修改

### 3.1 统一 ONNX external-wasm 解析条件

已新增：

- `gitnexus-web/scripts/vite-resolution.mjs`

已修改：

- `gitnexus-web/vite.config.ts`
- `gitnexus-web/vite.inline.config.mjs`

实现方式：

- 把 `onnxruntime-web-use-extern-wasm` 抽成共享 resolve condition
- app build 与 inline build 同时复用这一条件
- 避免两套 Vite 配置再次漂移

### 3.2 配置回归测试

已新增：

- `gitnexus/test/unit/gitnexus-web-vite-config.test.ts`

验证点：

- `vite.config.ts` 与 `vite.inline.config.mjs` 都显式包含 `onnxruntime-web-use-extern-wasm`
- 两者的 `resolve.conditions` 保持一致
- 测试先失败、修复后转绿

---

## 4. 结果

### 4.1 实测收益

本轮构建后，关键 ONNX 产物变化如下：

| 产物 | 上一轮 | 本轮后 |
| --- | ---: | ---: |
| `worker-onnx-*` | `704.18 KB` | `612.45 KB` |
| `ingestion.worker` 主入口 | `196.29 KB` | `196.29 KB` |

这说明 extern-wasm 解析条件不是“只有文档意义”的改动，而是对 worker ONNX JS chunk 有真实压缩收益。

### 4.2 本轮结论

该收敛方向成立，已经确认：

- app config 与 inline config 共享同一 `resolve.conditions`
- `onnxruntime-web` 走 external-wasm 解析路径
- `worker-onnx-*` 的 JS chunk 明显下降，且构建仍然通过

### 4.3 仍然存在的技术债

这轮没有把 warning 清零，残留如下：

| chunk | 尺寸 | 说明 |
| --- | ---: | --- |
| `worker-onnx-*` | `612.45 KB` | 已下降，但仍高于 warning 阈值 |
| `worker-langchain-core-*` | `618.62 KB` | 本轮未变化，仍是 worker agent 栈的主要剩余大块 |
| `mermaid.esm.min-*` | `781.40 KB` | Mermaid 懒加载块仍重 |
| `chunk-7SRKK4IT-*` | `608.01 KB` | Mermaid / cytoscape 相关块仍偏大 |

---

## 5. 验证

本轮已验证：

```bash
cd gitnexus
npx vitest run test/unit/gitnexus-web-vite-config.test.ts --config vitest.config.ts

npx vitest run test/unit/gitnexus-web-vite-chunking.test.ts test/unit/gitnexus-web-vite-config.test.ts --config vitest.config.ts

cd ../gitnexus-web
npm run build

cd ..
openspec validate 2026-04-07-gitnexus-web-onnx-extern-wasm-resolution
```

结果：

- 新增 Vite config 回归测试通过
- 既有 chunking 回归测试继续通过
- 生产构建通过
- OpenSpec change 验证通过

另外已执行：

```bash
gitnexus_detect_changes({ scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus" })
```

返回 `low` 风险摘要，未发现新的高风险受影响流程。
