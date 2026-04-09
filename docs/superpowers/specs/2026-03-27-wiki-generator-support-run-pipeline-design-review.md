# Wiki Generator Support And Run Pipeline Design — 代码审核意见

Date: 2026-03-27  
Source: `2026-03-27-wiki-generator-support-run-pipeline-design.md`

## Status Sync (2026-04-08)

- This review is retained as a historical design-review record.
- The support-helper and run-pipeline extraction slice is already landed on
  current `main`, with current source/test anchors at:
  - `gitnexus/src/core/wiki/generator-support.ts`
  - `gitnexus/src/core/wiki/run-pipeline.ts`
  - `gitnexus/test/unit/wiki-generator-support.test.ts`
  - `gitnexus/test/unit/wiki-run-pipeline.test.ts`
- The truth-synced design record and roadmap already treat this slice as
  landed, not as a pending worktree-only proposal.
- The comments below should therefore be read as historical design-review
  context, not as current pre-implementation blockers.

---

## 整体评价

这份文档整体质量很高，结构清晰，推理充分。选择 **Option B**（提取 support helpers + `run()` shell together）是正确的权衡。以下问题与建议保留为历史 review 语境下的设计反馈。

| 维度 | 评分 | 说明 |
|------|------|------|
| Problem clarity | ✅ 清晰 | 三个 practical problems 描述准确 |
| Scope definition | ✅ 明确 | 显式排除项清晰 |
| Design reasoning | ✅ 充分 | Option 选择推理合理 |
| Interface design | ⚠️ 需调整 | 依赖分类不够清晰 |
| Test strategy | ⚠️ 需澄清 | mock 定义需具体化 |
| Risk mitigation | ⚠️ 部分弱 | 需要更可验证的标准 |
| Completeness | ✅ 好 | 覆盖了关键场景 |

---

## 问题 1：接口设计过于宽泛（Section 7.2）

`RunWikiGenerationOptions` 包含了 10 个依赖项，其中有些是核心的（如 `fullGeneration`），有些应该保持内联（如 `ensureHTMLViewer` 明确不在提取范围内，却在接口中）。

### 建议

在接口中明确区分两类依赖：

- **必须注入**（Owned by pipeline）：`initWikiDb`, `closeWikiDb`, `fullGeneration`, `runIncrementalUpdate`
- **可选回调**（Owned by generator, passed through）：`ensureHTMLViewer`, `getCurrentCommit`, `loadWikiMeta`

或者考虑让 `prepareWikiDir` 和 `cleanupForceMode` 也保持内联，因为它们与 generator 状态紧耦合。

---

## 问题 2：Section 8.3 的 "still regenerates the HTML viewer on up-to-date short-circuit" 需要澄清

这是当前行为还是应该调整的行为？规格说 "preserving current wiki generation behavior"，但这个行为值得在设计中显式标记为 **preserve exactly**，因为它会影响用户体验。

### 建议

在 Section 8.3 开头加上警告标记：

> ⚠️ This behavior is intentionally preserved exactly — changing it would affect user-visible output.

---

## 问题 3：测试策略中 "pure mocks" 的定义不够清晰（Section 9.2）

"pure mocks" 可能导致测试脆弱或过度模拟。

### 建议

明确定义每类 mock 的行为：

| Mock 目标 | 建议行为 |
|-----------|----------|
| `prepareWikiDir` / `cleanupForceMode` | mock 为 no-op 或 verify 调用次数 |
| `initWikiDb` / `closeWikiDb` | 验证调用顺序 |
| `loadWikiMeta` / `getCurrentCommit` | mock 返回值以触发不同分支 |
| `fullGeneration` / `runIncrementalUpdate` | mock 返回模拟的 page count |
| `onProgress` | mock 为 sinon.spy |

---

## 问题 4：缺少对 `onProgress` 回调的显式处理说明

`RunWikiGenerationOptions` 中有 `onProgress: ProgressCallback`，但 Section 8 没有说明进度回调在提取后是否保持相同行为。

### 建议

在 Section 8.3 补充：

> - `onProgress` callback is forwarded unchanged to `fullGeneration` / `runIncrementalUpdate`

---

## 问题 5：Section 9.3 描述与实现可能不匹配

当前描述：
> `WikiGenerator.run()` dispatches through `runWikiGeneration(...)`

如果 `run()` 只是一个 thin wrapper，那么这个测试实际上是在验证包装行为，而不是 "dispatch"。这没有错，但描述不够精确。

### 建议

改为更精确的描述：

> Verify `WikiGenerator.run()` delegates to `runWikiGeneration(...)` and passes the correct resolved dependencies.

---

## 问题 6：风险 3 的 Mitigation 过于依赖 "treat as"（Section 10.3）

当前 mitigation：
> treat this as shell/support extraction only

这不是一个可验证的 mitigation。需要更具体的机制。

### 建议

添加客观标准，例如：

- 在 PR reviewer checklist 中加入：*"Did this change touch any function listed in Section 6 (Explicitly not included)?"*
- 或者在代码中添加 `// @generator-owned` 注释标记哪些函数暂时不移动

---

## 问题 7：文件路径需要确认

Section 6 说添加：

```
gitnexus/src/core/wiki/
  generator-support.ts
  run-pipeline.ts
```

需要确认这些路径相对于工作树根目录还是 `gitnexus/` 子目录。根据上下文应该是后者。

### 建议

在 Section 6 开头加上：

> All paths are relative to the `gitnexus/` submodule root.

---

## 次要建议

1. **Section 5** 可以补充一个图示 showing 提取前后的依赖关系
2. **Section 11** Success Criteria 可以加一项：*"All tests pass in under 30s"* 作为性能基准
3. **Section 8.1** 的 char limit (500, 1000) 应该用常量引用而不是 magic number，例如 `const CONFIG_EXCERPT_MAX_LENGTH = 500`

---

## 总结

这份设计文档的方向是正确的。核心价值在于：

- 一个更小且更易读的 `generator.ts`
- 更清晰的 support helpers、orchestration shell 和 generation internals 之间的分离
- 为后续关于剩余 utility/helper 所有权决策奠定更清洁的基础

在 review 当时，这些问题用于约束进入实现阶段前的设计澄清。对当前已落地主仓
而言，这份文档应被视为 historical review record，而不是当前仍待清空的
implementation gate。

---

*Reviewer: Sisyphus (GitNexus Code Intelligence)*  
*Date: 2026-03-27*
