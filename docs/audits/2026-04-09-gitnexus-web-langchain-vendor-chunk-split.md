# GitNexus Web LangChain Vendor Chunk Split

日期：2026-04-09
范围：`gitnexus-web/scripts/vite-chunking.mjs` 的 worker LangChain follow-up 收敛
治理：`DEVELOPMENT_RULES.md`

---

## 1. 背景

`2026-04-07` 的 LangChain 审计已经证明两类路线不可接受：

1. 直接按 `@langchain/core/dist/*` 子树硬拆
2. 把 `langsmith` / prompt-related 子树单独拆出

它们都会引入新的循环 chunk warning，因此当时的结论是：

- 保留稳定的 `worker-langchain-core`
- 把 finer subtree split 记为已证伪路线

但这并不等于 LangChain warning 永久无解。

截至本轮开始前，构建结果仍为：

- `worker-langchain-core-*` `618.62 KB`

继续检查依赖结构后，可以确认一个更窄的事实：

- 上一次被证伪的是“拆 LangChain 自身子树”
- 但 `@langchain/core` / `langsmith` 共同依赖的一批第三方 vendor 包仍然被一起卷进 `worker-langchain-core`
- 这些第三方依赖本身不属于 LangChain internal subtree，因此更适合单独拆出为 vendor 边界

因此本轮只测试一条新路线：

- 不拆 `@langchain/core` 自身子树
- 不拆 `langsmith`
- 只把共享 third-party vendor 依赖从 `worker-langchain-core` 中抽离

---

## 2. 本轮修改

修改：

- `gitnexus-web/scripts/vite-chunking.mjs`
- `gitnexus/test/unit/gitnexus-web-vite-chunking.test.ts`

新增稳定 worker chunk：

- `worker-langchain-vendor`

本轮把以下代表性 shared vendor 依赖路由到这个新 chunk：

- `zod`
- `@cfworker/json-schema`
- `uuid`
- `p-queue`
- `mustache`
- `ansi-styles`
- `camelcase`
- `decamelize`

保持不变：

- `@langchain/core/**` 仍归 `worker-langchain-core`
- `langsmith/**` 仍归 `worker-langchain-core`

这点非常关键：

- 本轮不是对 `2026-04-07` 结论的推翻
- 本轮只是把“LangChain internal subtree split”与“shared vendor split”区分开来

---

## 3. 结果

### 3.1 实测构建结果

本轮构建后，关键 worker chunk 变为：

| 产物 | 本轮前 | 本轮后 |
| --- | ---: | ---: |
| `worker-langchain-core-*` | `618.62 KB` | `450.99 KB` |
| `worker-langchain-vendor-*` | `N/A` | `175.81 KB` |
| `worker-langgraph-*` | `132.92 KB` | `126.27 KB` |

### 3.2 最重要的验证结论

这轮和 `2026-04-07` 最大的差别不是体积，而是：

- 没有出现新的循环 chunk warning

因此这条路线通过了此前 LangChain 跟进切片最关键的失败门槛。

也就是说，新的工程结论应改写为：

- LangChain internal subtree split：仍然是已证伪路线
- Shared vendor split：已验证可行，并形成新的稳定边界

### 3.3 当前剩余状态

完成这轮后，原本的 `worker-langchain-core` warning 已被清掉。

前端构建剩余的大块只剩：

- `worker-onnx-*` `581.07 KB`
- `web-tree-sitter` 上游 `eval` 提示

---

## 4. 回归测试与验证

本轮已验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run \
  test/unit/gitnexus-web-vite-chunking.test.ts \
  --config vitest.config.ts

cd /opt/claude/GitNexus/gitnexus-web
npm run build
```

验证点：

- shared vendor 代表路径路由到 `worker-langchain-vendor`
- `@langchain/core` / `langsmith` 仍保持在 `worker-langchain-core`
- 构建通过
- 未新增循环 chunk warning

---

## 5. 结论

这轮 LangChain follow-up 说明此前的“不可继续拆”需要更精确地表述：

- 不可继续重复的是 LangChain internal subtree split
- 仍可继续做的是 non-cyclic shared vendor split

因此现在的稳定前端边界是：

- Mermaid：生产静态 runtime 资产
- ONNX：runtime / support 双层 chunk
- LangChain：core / vendor 双层 chunk

如果下一轮还继续做，优先级应收窄到：

1. `worker-onnx-*` 是否还能在不恶化 `worker-transformers` 的前提下进一步下降
2. `web-tree-sitter` 的 `eval` 是否需要单独作为 upstream-warning follow-up 记录
