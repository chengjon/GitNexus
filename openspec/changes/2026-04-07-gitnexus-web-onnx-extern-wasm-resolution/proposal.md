## Why

`gitnexus-web` 在 worker bootstrap 路径已经完成一轮 lazy-loading 收敛，但
`worker-onnx-*` 仍保持 warning-sized JS chunk。

检查 `onnxruntime-web` 包结构后可以确认，它为 ESM 导出暴露了
`onnxruntime-web-use-extern-wasm` 条件，用于选择 external-wasm 入口而不是更重的 bundle 入口。

当前 `gitnexus-web` 的 Vite app/inline 配置都没有显式声明这个条件，
这会让构建继续走更重的默认解析路径，也让两个配置之间存在再次漂移的风险。

因此需要一个独立切片，把 ONNX runtime 的解析条件显式化并加回归测试锁住。

## What Changes

- 在 `vite.config.ts` 中显式添加 `onnxruntime-web-use-extern-wasm` 解析条件
- 在 `vite.inline.config.mjs` 中同步添加同一解析条件
- 增加一个配置回归测试，确保两个配置保持同样的 ONNX resolve 条件
- 记录构建前后 `worker-onnx-*` 的实际结果

## Capabilities

### New Capabilities

- `gitnexus-web-onnx-extern-wasm-resolution`: Keep `gitnexus-web` Vite app and inline builds aligned on the external-wasm resolution path for `onnxruntime-web`.

### Modified Capabilities

- None.

## Impact

- Affected frontend build files:
  - `gitnexus-web/vite.config.ts`
  - `gitnexus-web/vite.inline.config.mjs`
- Affected tests:
  - `gitnexus/test/unit/gitnexus-web-vite-config.test.ts`
- Affected audit trail:
  - `docs/audits/2026-04-07-gitnexus-web-onnx-extern-wasm-resolution.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
