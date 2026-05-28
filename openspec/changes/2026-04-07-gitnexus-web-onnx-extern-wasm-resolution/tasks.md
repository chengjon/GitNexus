## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the `gitnexus-web` ONNX external-wasm resolution slice
- [x] 1.2 Bound the slice to build resolution behavior rather than runtime feature changes

## 2. Build Resolution Convergence

- [x] 2.1 Add a shared regression test that locks `onnxruntime-web-use-extern-wasm` across both Vite configs
- [x] 2.2 Apply the ONNX external-wasm resolve condition to `vite.config.ts`
- [x] 2.3 Apply the same ONNX external-wasm resolve condition to `vite.inline.config.mjs`

## 3. Validation And Audit

- [x] 3.1 Run the targeted Vite config regression
- [x] 3.2 Run `npm run build`
- [x] 3.3 Validate the new OpenSpec change
- [x] 3.4 Record the actual effect on `worker-onnx-*` and roadmap status
