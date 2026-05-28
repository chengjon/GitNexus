# useSigma Camera Nudge Retirement

日期：2026-04-10
范围：`gitnexus-web/src/hooks/useSigma.ts`、`gitnexus-web/src/components/GraphCanvas.tsx`、相关 tests
目标：把 `useSigma.ts` 中 `setSelectedNode()` 的 camera nudge workaround 的当前边界、剩余风险和未来退役 gate 写清楚，避免后续把一个尚无行为级替代证据的 UI workaround 误删成“顺手清理”。

治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
相关基线：[2026-04-10-compatibility-shim-watchlist.md](/opt/claude/GitNexus/docs/audits/2026-04-10-compatibility-shim-watchlist.md)

---

## 1. 背景

`gitnexus-web/src/hooks/useSigma.ts` 当前在 `setSelectedNode()` 中保留了这样一段逻辑：

- 先读取 `sigma.getCamera()`
- 再做一个几乎不可见的 ratio 动画
- 然后调用 `sigma.refresh()`

源码注释已经明确把它标成：

- `Tiny camera nudge to force edge refresh (workaround for Sigma edge caching)`

因此当前问题不是“这里是不是 workaround”，而是：

- 这段 workaround 现在是否仍然承担真实 UI 语义
- 如果未来要删，替代机制或行为证据在哪里

---

## 2. 当前 Reachability 与行为边界

### Source Boundary

当前 `useSigma.ts` 中有两个相关入口：

- `setSelectedNode(nodeId)`
  - 会更新 selected state
  - 会执行 camera nudge workaround
  - 会执行 `sigma.refresh()`
- `focusNode(nodeId)`
  - 会直接设置 selected state
  - 会按需要执行定位动画
  - 源码注释明确写着：
    `without the camera nudge from setSelectedNode`

也就是说，当前代码已经明确区分了：

- 一般 selection path 继续依赖 workaround
- focused camera navigation path 刻意绕开 workaround

### Consumption Path

`gitnexus-web/src/components/GraphCanvas.tsx` 当前会：

- 在 app selected node 变化时，调用 `setSigmaSelectedNode(appSelectedNode.id)`
- 这意味着常规 app-state → sigma selection 同步会走 `setSelectedNode()`
- `focusNode()` 则主要用于显式聚焦动作，而不是所有 selection 同步

因此，这个 workaround 不是孤立死分支；它仍处在常规 selection sync 路径上。

### Current Test Boundary

当前本地关于这条 workaround 的 focused coverage 已有三层：

- [gitnexus-web-use-sigma-workaround.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/gitnexus-web-use-sigma-workaround.test.ts)
  - source-boundary test
  - 锁定 `setSelectedNode()` 仍保留 camera nudge
  - 锁定 `focusNode()` 仍明确绕开这段 workaround
- [useSigma.behavior.test.tsx](/opt/claude/GitNexus/gitnexus-web/test/unit/useSigma.behavior.test.tsx)
  - mocked runtime behavior test
  - 锁定 `setSelectedNode()` 会触发 camera nudge + `sigma.refresh()`
  - 锁定 selection 后 `edgeReducer` 会对 connected / unrelated edges 产生不同输出
  - 锁定 `focusNode()` 走 direct focus path，且对同一节点重复 focus 时不再重复触发 camera animation
- [GraphCanvas.selection-sync.test.tsx](/opt/claude/GitNexus/gitnexus-web/test/unit/GraphCanvas.selection-sync.test.tsx)
  - component-hook selection sync test
  - 锁定 `GraphCanvas.tsx` 的 app selected node -> `setSigmaSelectedNode(appSelectedNode.id)` 同步路径
  - 锁定这条同步路径当前仍会触发 camera nudge + `sigma.refresh()`，且会影响 connected / unrelated edge highlighting 输出

这说明当前 coverage 已不再只有源码字符串/正则边界，也不再只停留在 hook 级 mocked runtime。

但它仍不能证明：

- 在真实 Sigma 渲染环境里，去掉 workaround 后 edge refresh 仍然正确
- 现在是否已经有别的 deterministic refresh 机制足以替代它

---

## 3. 当前不能直接删除的理由

当前不应直接删除这段 camera nudge，理由有三个：

- 源码仍显式把它作为 Sigma edge caching workaround 保留
- `GraphCanvas.tsx` 的常规 selection sync 仍会走到 `setSelectedNode()`
- 当前虽然已有 mocked runtime + component-hook selection sync + reducer-level behavior coverage，但还没有真实 Sigma render / edge refresh 级别的回归证据

因此现在删除它，不是在做“无用动画清理”，而是在赌：

- selection/highlight/edge refresh 在无 workaround 下已经稳定

这个赌当前没有证据支持。

---

## 4. Retirement Gate

只有在以下动作明确完成后，才适合删除当前 workaround：

1. 替代机制明确化
   - 要么确认上游 Sigma 行为已修复
   - 要么本地实现一个不依赖 camera nudge 的 deterministic refresh 路径

2. 更强的行为级回归测试补齐
   - 当前已有源码边界、mocked runtime，以及 component-hook selection sync coverage，但还需要更接近真实 Sigma 渲染的 edge refresh / highlight 回归证据
   - 不能只依赖源码边界测试，或只依赖 mocked runtime / jsdom 级调用断言

3. 调用边界复核
   - 确认 `GraphCanvas.tsx` 和其他 selection sync 调用点在无 workaround 下仍符合预期
   - 确认 `focusNode()` 与一般 selection path 的行为差异仍然合理或已被收敛

4. 同切片退役源码边界测试
   - 删除 workaround 时，必须同步修改
     `gitnexus/test/unit/gitnexus-web-use-sigma-workaround.test.ts`
   - 并用行为级测试替代当前“保留 workaround”的断言

---

## 5. 建议的 Change Note 文案

如果未来真的退休这段 workaround，建议在同一切片里至少记录类似说明：

```text
UI runtime change:

The temporary camera-nudge workaround in `useSigma.ts:setSelectedNode()` has
been removed.

Selection and edge-refresh behavior now rely on the deterministic Sigma refresh
path validated by regression coverage.
```

即便不把它写成对外 release note，也至少应在同切片记录里保留这三个信息：

- 被删除的是哪一段 workaround
- 替代机制是什么
- 哪些行为级测试证明它现在可以安全删除

---

## 6. 不应如何删除

不应采用以下方式处理：

- 只因为 `focusNode()` 能绕开 workaround，就推断 `setSelectedNode()` 也可以直接去掉
- 只保留当前源码边界测试，就宣布 workaround 已可退休
- 在 unrelated hook cleanup / UI polish 里顺手删掉 camera nudge

这些做法都会把“缺少行为证据的运行时 workaround 退役”伪装成“样式级清理”。

---

## 7. 结论

当前更准确的状态是：

- `setSelectedNode()` 里的 camera nudge 仍是显式 workaround
- 它当前仍位于常规 selection sync 路径上
- 当前虽然已有 source-boundary + mocked runtime + component-hook selection sync/reducer-level coverage，但仍不足以证明 workaround 已可删除

因此，下一步正确动作不是直接删实现，而是：

- 先补 deterministic refresh 证据或行为级回归测试
- 然后再在单独的 UI/runtime retirement slice 中删除 workaround 与对应源码边界测试
