# Watchlist Hotspot Retriage

日期：2026-04-10
范围：`/opt/claude/GitNexus`
目标：对 roadmap 中仍保留在观察名单里的 5 个热点文件做一次新的事实回看，判断哪些仍值得主动切片，哪些应继续停留在 watchlist，而不是因为文件大就默认继续拆。

治理入口：

- [DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
- [2026-04-10-residual-debt-stopline.md](/opt/claude/GitNexus/docs/audits/2026-04-10-residual-debt-stopline.md)

---

## 1. 测量口径

本次只按以下口径判断，不引入“主观上看着大”的叙事：

- 实测：
  - 当前文件体量
  - 是否仍存在显式兼容层 / workaround / TODO 标记
  - 当前仓内是否已有 focused tests / integration tests 锁边界
  - 当前 roadmap / 已落地审计是否已经给出专门退出条件
- 推断：
  - 是否值得重新提升为主动治理目标
  - 更适合 dedicated slice，还是继续留在观察名单

---

## 2. 分项结论

### A. `src/core/ingestion/framework-detection.ts`

- 实测：
  - 当前体量约 `141` 行
  - 主要职责清晰，集中在 `detectFrameworkFromAST()` 与框架模式表
  - 仓内已有 `gitnexus/test/unit/framework-detection.test.ts`
  - 当前检索未发现显式 shim / workaround / temporary 标记
- 推断：
  - 它已经不构成“因为过大而需要继续拆”的热点
  - 后续只有在新增框架、误报/漏报回归、或路径检测与 AST 检测边界重新变化时，才值得重开

### B. `src/cli/skill-gen.ts`

- 实测：
  - 当前体量约 `656` 行
  - 对外主入口仍相对收敛，核心公开面是 `generateSkillFiles()`
  - 仓内已有 `gitnexus/test/unit/skill-gen.test.ts`
  - `analyze` 相关单测也对其进行了 mock 约束：
    - `gitnexus/test/unit/analyze-head-refresh.test.ts`
    - `gitnexus/test/unit/analyze-command-cached-embeddings.test.ts`
  - 还有 `gitnexus/test/integration/skills-e2e.test.ts` 作为 CLI 侧集成证据
  - 当前检索未发现显式兼容层 / workaround 标记
- 推断：
  - 它仍是体量偏大的聚合文件，但当前更像“单入口的生成器实现”，不是立即要拆的结构风险
  - 只有在 skill 模板格式、目录写入策略、社区筛选逻辑再次频繁演进时，才值得开 dedicated skill-generation slice

### C. `src/core/kuzu/kuzu-adapter.ts`

- 实测：
  - 当前体量约 `591` 行
  - 已经完成过一轮局部拆分，`fts.ts`、`load-graph.ts`、`copy-path.ts` 已从该文件抽出
  - 当前文件仍承接 native DB 生命周期、session lock、schema 初始化、query helper 等原生运行时边界
  - 仓内已有较多测试与集成约束，包括：
    - `gitnexus/test/unit/kuzu-adapter-executeWithReusedStatement.test.ts`
    - `gitnexus/test/integration/kuzu-core-adapter.test.ts`
    - `gitnexus/test/helpers/test-indexed-db.ts`
  - 相关依赖 / 退出策略也已有专门审计：
    [2026-04-06-kuzu-dependency-exit-strategy.md](/opt/claude/GitNexus/docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md)
- 推断：
  - 它不适合再按“降行数”逻辑做 opportunistic cleanup
  - 如果未来重开，应作为 dedicated kuzu/runtime slice，围绕 native runtime、锁、query/FTS、宿主行为矩阵来推进

### D. `src/core/ingestion/import-processor.ts`

- 实测：
  - 当前体量约 `563` 行
  - 当前仍同时承接 import-resolution context、语言分发、结果应用、公共类型导出
  - 仓内已有较多 focused tests：
    - `gitnexus/test/unit/import-processor.test.ts`
    - `gitnexus/test/unit/import-processor-indexed-resolution.test.ts`
    - `gitnexus/test/unit/sequential-language-availability.test.ts`
    - `gitnexus/test/unit/ingestion-refactor-boundary.test.ts`
  - 最近刚补过 indexed suffix-resolution 主路径证据，相关 no-index fallback 已有单独 retirement 边界
  - 当前检索未发现显式 workaround / temporary 标记
- 推断：
  - 这是 5 个观察项里，最接近“如果还要主动开一条实现切片，应优先考虑”的目标
  - 原因不是行数，而是它仍处在 ingestion 的共享分发边界，未来一旦继续加语言支持、路径解析、上下文缓存或 resolver contract 收紧，就容易再次承压
  - 但在没有新变更压力前，仍不建议为拆而拆

### E. `src/core/ingestion/utils.ts`

- 实测：
  - 当前体量约 `653` 行
  - 内容以共享常量、节点类型映射、噪声过滤、AST helper 为主
  - 仓内已有至少一部分直接或间接边界测试，例如：
    - `gitnexus/test/integration/has-method.test.ts`
  - 当前检索未发现除字符串常量 `'TODO'` 之外的显式 TODO / workaround / compat 标记
  - 该文件目前更像“共享规则表 + helper 集合”，不是单一兼容层
- 推断：
  - 仅凭体量不足以把它提升为主动治理目标
  - 只有在某个子域开始高频变更，例如 built-in 噪声过滤、definition capture、container label 映射，才值得按子主题拆出 dedicated helper 模块

---

## 3. 重新分流后的默认策略

### 继续留在观察名单

- `src/core/ingestion/framework-detection.ts`
- `src/cli/skill-gen.ts`
- `src/core/ingestion/utils.ts`

原因：

- 当前职责边界相对清晰，或已有足够 focused tests
- 当前没有新的兼容层 / workaround 信号
- 当前没有充分证据说明继续拆分会带来更高确定性

### 仅在 dedicated slice 中重开

- `src/core/kuzu/kuzu-adapter.ts`

原因：

- 它仍是 native runtime / query / lock / schema 的交汇点
- 风险重心在运行时边界，不在“文件大”

### 若需要主动开下一条实现治理切片，优先候选

- `src/core/ingestion/import-processor.ts`

原因：

- 它仍是共享语言分发与 import-resolution contract 的汇合处
- 未来如果继续演进 ingestion 主链，它最容易重新出现 review 摩擦和职责扩张

---

## 4. 结论

截至 `2026-04-10`，roadmap 观察名单中的 5 个热点并没有出现“都该继续拆”的结论。

更准确的当前结论是：

- `framework-detection`、`skill-gen`、`utils` 继续观察，不主动切片
- `kuzu-adapter` 只在 dedicated runtime slice 中重开
- 如果需要主动开下一条实现收敛切片，`import-processor` 是最合理的优先候选

这次 re-triage 关闭的是“是否还要继续按行数驱动拆分”这个问题，而不是为 5 个文件重新制造新的统一待办。
