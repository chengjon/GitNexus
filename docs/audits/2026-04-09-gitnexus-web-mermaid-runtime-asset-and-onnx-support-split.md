# GitNexus Web Mermaid Runtime Asset And ONNX Support Split

日期：2026-04-09
范围：`gitnexus-web` 前端生产构建中的 Mermaid / ONNX / `web-tree-sitter` 剩余 bundle 技术债
治理：`DEVELOPMENT_RULES.md`

---

## 1. 背景

截至本轮开始前，`gitnexus-web` 的稳定生产构建仍残留四类前端 bundle 技术债：

- `mermaid.esm.min-*` 约 `781.40 KB`
- Mermaid / cytoscape 共享块 `chunk-7SRKK4IT-*` 约 `608.01 KB`
- `worker-onnx-*` 约 `612.45 KB`
- `worker-langchain-core-*` 约 `618.62 KB`

同时，构建日志里还持续出现 `web-tree-sitter` 的三类上游提示：

- `fs` browser externalization
- `path` browser externalization
- `eval` warning

结合 `2026-04-07` 的历史审计记录，可以确认：

- Mermaid 方向的 `core` / `esm` / direct flowchart runtime 路线都已被证伪
- LangChain core 的 finer subtree split 也已被证伪，因为会引入新的循环 chunk warning
- ONNX provider shim 路线同样被证伪，会把重量回流到 `worker-transformers`

因此本轮只做三件低风险收敛：

1. 把 Mermaid runtime 从 Rollup bundle 中挪到生产静态资产，不再重试入口变体
2. 把 ONNX support 依赖从 `worker-onnx` 主块中进一步拆出
3. 清掉 `web-tree-sitter` 的 `fs` / `path` browser externalization 噪音，保留 `eval` 作为上游已知提示

本轮不做：

- backend / doctor / CI / host guidance
- `gitnexus/src/**`
- LangChain core 运行时行为调整
- 已经完成的 build-boundary 修复回头重做

---

## 2. 已实施修改

### 2.1 Mermaid 改为生产静态 runtime 资产

新增：

- `gitnexus-web/scripts/vite-static-copy.mjs`

修改：

- `gitnexus-web/src/lib/mermaid-loader.ts`
- `gitnexus-web/vite.config.ts`
- `gitnexus-web/vite.inline.config.mjs`

实现方式：

- 生产构建时不再让 Rollup 直接打包 Mermaid runtime
- 改为通过 `viteStaticCopy` 复制 `node_modules/mermaid/dist/**/*.mjs` 到 `dist/vendor/mermaid`
- `mermaid-loader.ts` 在生产环境通过
  `import('/vendor/mermaid/mermaid.esm.min.mjs')` 按需加载官方运行时
- 开发环境仍保留 `import('mermaid')`，不改变本地开发体验

这条路线与 `2026-04-07` 被否决的 Mermaid entry retest 不同：

- 它没有继续切 `mermaid` 入口文件
- 也没有重开 `core` / `esm` / direct flowchart runtime 的实验
- 它只是把稳定可用的 Mermaid runtime 从 Rollup warning 面中移出

### 2.2 ONNX support 依赖继续拆分

修改：

- `gitnexus-web/scripts/vite-chunking.mjs`

新增 worker 分包：

- `worker-onnx-support`

承接的代表性依赖：

- `onnxruntime-common`
- `protobufjs`
- `flatbuffers`
- `long`
- `platform`
- `guid-typescript`

保留：

- `worker-onnx` 继续承接 `onnxruntime-web`

目标不是改变 ONNX 行为，而是把 runtime-support 依赖从主 `worker-onnx` 块再剥一层。

### 2.3 `web-tree-sitter` browser shim

新增：

- `gitnexus-web/src/shims/empty-browser-module.js`

修改：

- `gitnexus-web/scripts/vite-resolution.mjs`
- `gitnexus-web/vite.config.ts`
- `gitnexus-web/vite.inline.config.mjs`

实现方式：

- 为 `fs` / `path` 添加 exact-match 浏览器 shim alias
- 避免 `web-tree-sitter` 的 Node-only 分支再触发 Vite 的 browser externalization 提示

本轮没有去 patch 上游 `web-tree-sitter` 包本身，因此 `eval` 提示仍保留。

---

## 3. 结果

### 3.1 实测构建结果

本轮完成后的关键产物如下：

| 产物 | 本轮前 | 本轮后 |
| --- | ---: | ---: |
| `index-*` | `319.01 KB` | `317.57 KB` |
| `worker-onnx-*` | `612.45 KB` | `581.07 KB` |
| `worker-onnx-support-*` | `N/A` | `18.91 KB` |
| `worker-langchain-core-*` | `618.62 KB` | `618.62 KB` |

### 3.2 Mermaid / cytoscape 结果

本轮最大的收敛收益在 Mermaid：

- 构建产物中不再出现 `mermaid.esm.min-*`
- 也不再出现原来的 Mermaid / cytoscape 共享 warning 块 `chunk-7SRKK4IT-*`
- Rollup 输出不再为 Mermaid / cytoscape 打出超阈值 warning

注意：

- 这不是 Mermaid runtime 体积“变小”了
- 而是 Mermaid runtime 现在作为生产静态资产按需加载，不再计入 Rollup bundle warning 面

### 3.3 `web-tree-sitter` 结果

本轮前构建会出现：

- `Module "fs" has been externalized for browser compatibility`
- `Module "path" has been externalized for browser compatibility`
- `Use of eval ...`

本轮后仅剩：

- `Use of eval in "node_modules/web-tree-sitter/tree-sitter.js" is strongly discouraged`

也就是说：

- `fs` / `path` browser externalization 噪音已清掉
- `eval` 仍是上游包自身实现带来的已知提示

### 3.4 LangChain core 状态

`worker-langchain-core-*` 仍保持 `618.62 KB`，本轮没有进一步修改其稳定边界。

原因不是遗漏，而是遵守 `2026-04-07` 已记录的工程结论：

- finer subtree split 已被证明会引入新的循环 chunk warning
- 在没有新的无环边界证据前，不应再次沿同一路线硬拆

因此本轮把 LangChain 视为“明确仍在 follow-up 队列中的剩余技术债”，而不是假装已经收敛。

---

## 4. 回归测试与验证

本轮已验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run \
  test/unit/gitnexus-web-vite-chunking.test.ts \
  test/unit/gitnexus-web-vite-config.test.ts \
  test/unit/gitnexus-web-vite-static-copy.test.ts \
  --config vitest.config.ts

cd /opt/claude/GitNexus/gitnexus-web
npm run build
```

结果：

- `3` 个 test file、`8` 个测试通过
- 生产构建通过
- `web-tree-sitter` 的 `fs/path` externalization warning 已消失
- Mermaid / cytoscape 的 Rollup warning 块已退场
- 剩余构建提示仅为 `web-tree-sitter` 的 `eval`

---

## 5. 结论

这轮前端剩余 bundle 债务收敛后，可以把当前状态明确为：

- Mermaid / cytoscape：已从 Rollup warning 面退出，但通过“生产静态 runtime 资产”达成，而不是继续切入口
- ONNX：`worker-onnx` 继续下降，并新增了 `worker-onnx-support` 的细分边界
- `web-tree-sitter`：只剩上游 `eval` 提示
- LangChain core：仍是剩余大块，但已有明确的“当前不能安全细拆”的审计前提

下一轮如果继续做，只应优先考虑：

1. 是否存在不引入循环 chunk warning 的 LangChain 新边界
2. 是否要把 `web-tree-sitter` 的 `eval` 提示单独作为 upstream-warning follow-up 记录

不应再继续重复：

- Mermaid `core` / `esm` / direct flowchart runtime 实验
- 旧的 ONNX provider shim 路线
- 已被审计否决的 LangChain subtree split 组合
