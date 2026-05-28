# GitNexus Web Tree-Sitter Upstream Eval Warning Filter

日期：2026-04-09
范围：`gitnexus-web` 前端构建中 `web-tree-sitter` 剩余 upstream warning 收敛
治理：`DEVELOPMENT_RULES.md`

---

## 1. 背景

在 Mermaid runtime 静态资产化、LangChain shared vendor split、ONNX support split 完成后，
`gitnexus-web` 生产构建里只剩一条 warning：

- `Use of eval in "node_modules/web-tree-sitter/tree-sitter.js" is strongly discouraged`

这条 warning 与前几轮已清掉的 warning 不同：

- 它不是 chunk 过大 warning
- 它也不是 `fs` / `path` browser externalization 噪音
- 它来自 `web-tree-sitter` 上游发布包自身的 Emscripten 产物

本轮目标不是 patch 第三方依赖，也不是重新引入依赖治理路线，而是把当前前端构建面上的
已知单点 upstream warning 收敛到一个可审计、可回归测试的 scoped filter。

本轮不做：

- backend / doctor / CI / host guidance
- `gitnexus/src/**`
- 修改 `web-tree-sitter` 包内容
- 调高全局 warning 阈值

---

## 2. 已实施修改

新增：

- `gitnexus-web/scripts/vite-warnings.mjs`

修改：

- `gitnexus-web/vite.config.ts`
- `gitnexus-web/vite.inline.config.mjs`
- `gitnexus/test/unit/gitnexus-web-vite-config.test.ts`
- `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

实现方式：

- 抽出 `createScopedBuildOnWarn()`
- 只匹配以下 warning 特征：
  - `code === 'EVAL'`
  - `id` 命中 `node_modules/web-tree-sitter/tree-sitter.js`
- 对这条 warning 直接忽略
- 其他 warning 一律继续透传给 Rollup 默认 `warn`

当前这个 filter 挂在：

- `build.rollupOptions.onwarn`

这是当前 Vite 配置层允许的稳定挂载点；本轮没有为 worker 配置引入额外的类型逃逸或非标准接法。

---

## 3. 结果

### 3.1 构建结果

本轮后重新跑 `gitnexus-web` 生产构建，构建成功，日志中不再出现 `web-tree-sitter` 的
`eval` warning。

这意味着当前前端构建 warning 面已进一步收敛为：

- Mermaid / cytoscape warning：已退出
- LangChain core warning：已退出
- `web-tree-sitter` externalization warning：已退出
- `web-tree-sitter` upstream eval warning：已在前端构建层被 scoped filter 收敛

### 3.2 风险边界

本轮不是“修复 upstream 实现”，而是“精确过滤已知单点 warning”。

因此需要明确边界：

- 如果未来 `web-tree-sitter` 升级后不再使用这段实现，这个 filter 可以删除
- 如果未来出现新的 `EVAL` warning，但来源不是 `web-tree-sitter/tree-sitter.js`，本轮 filter 不会吞掉
- 如果未来 `web-tree-sitter` warning 文本或入口路径变化，现有测试会帮助发现 drift

---

## 4. 回归测试与验证

本轮已验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run \
  test/unit/gitnexus-web-vite-config.test.ts \
  --config vitest.config.ts

cd /opt/claude/GitNexus/gitnexus
npx vitest run \
  test/unit/gitnexus-web-mermaid-capability-boundary.test.ts \
  test/unit/gitnexus-web-vite-chunking.test.ts \
  test/unit/gitnexus-web-vite-config.test.ts \
  test/unit/gitnexus-web-vite-static-copy.test.ts \
  --config vitest.config.ts

cd /opt/claude/GitNexus/gitnexus-web
npm run build
```

验证点：

- app / inline 配置都暴露 scoped `onwarn`
- 只忽略 `web-tree-sitter` 的已知 `eval` warning
- 其他 warning 继续透传
- 前端相关回归测试全通过
- 生产构建通过，且日志不再出现该 warning

---

## 5. 结论

这轮 follow-up 之后，`gitnexus-web` 当前已没有剩余的本地可控构建 warning 面。

剩余前端 bundle 技术债只剩：

- `worker-onnx-*` 仍然偏大，但当前主要来自 `onnxruntime-web` runtime 自身

后续如果继续做，应优先评估：

1. `worker-onnx` 是否还存在不重开 provider shim 路线的稳定边界
2. `web-tree-sitter` 升级后是否可以删掉本轮 scoped filter
