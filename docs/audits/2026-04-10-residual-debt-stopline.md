# Residual Debt Stopline

日期：2026-04-10
范围：`/opt/claude/GitNexus`
目标：把当前低风险证据收敛后，哪些债务仍值得继续推进、哪些应默认停刀等待触发条件，明确写成同一个事实源，避免后续再次落回“顺手继续补一点”的机械推进。

治理入口：

- [DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
- [2026-04-10-compatibility-shim-watchlist.md](/opt/claude/GitNexus/docs/audits/2026-04-10-compatibility-shim-watchlist.md)

---

## 1. 为什么现在需要 stopline

截至 `2026-04-10`，仓内已经完成了一轮连续的低风险治理收敛：

- `backend-runtime` repo identity 主路径已有 focused contract tests 与高风险边界说明
- `suffixResolve()` 已从旧的 `HIGH` 主流程叙事收敛到 helper-contract 风险，并补了 direct indexed-path evidence
- `parsing-processor` 历史 compatibility export 已补 retirement boundary 与 migration-note draft
- `useSigma` camera nudge workaround 已补 source-boundary、mocked runtime、component-hook selection sync 证据

这意味着继续“再补一条小证据”的边际收益已经明显下降。

当前更重要的不是继续证明这些边界，而是明确：

- 哪些线应该等触发条件再重开
- 哪些线现在重开只会制造 churn
- 哪些线一旦重开，必须按高风险 / 单独切片处理

---

## 2. 当前默认停刀的债务线

### A. `parsing-processor.ts` compatibility export

当前状态：

- canonical path 已明确为 `export-detection.ts`
- compatibility export test 仍在，migration-note draft 也已补
- 真正剩余动作已经不是“继续解释它为什么是 shim”，而是未来 cutover 时发布 note 并删除 re-export

默认策略：

- 现在停止继续补证据
- 只有在真正执行 shim-retirement slice 时再重开

允许重开的触发条件：

- 明确决定要删除该 re-export
- 或需要把 draft 转成正式 release note / migration note

### B. `suffixResolve()` no-index fallback

当前状态：

- 主 ingestion 流程已有 direct indexed-path evidence
- 剩余问题已收敛成 helper-level no-index contract 是否退休
- 当前 callers 仍保留可选 `index?` 形态

默认策略：

- 现在停止继续补“主流程已 indexed”的重复证据
- 不在 unrelated resolver cleanup 中继续动它

允许重开的触发条件：

- 明确决定收紧为 indexed-only contract
- 或出现真实回归，表明当前 indexed path / compatibility path 仍有缺口

### C. `useSigma.ts` camera nudge workaround

当前状态：

- 已有 source-boundary、mocked runtime、component-hook selection sync coverage
- 缺口只剩真实 Sigma render / edge refresh integration-grade 证据，或 deterministic 替代路径

默认策略：

- 暂停继续补 jsdom / mock 层证据
- 不在 UI polish / hook cleanup 中顺手碰 workaround

允许重开的触发条件：

- 有能力补真实 Sigma render 级回归 harness
- 或明确要实现 deterministic refresh 替代路径
- 或出现 selection/highlight stale render 的真实 bug 报告

### D. `backend-runtime.ts:normalizePathForKey`

当前状态：

- blast radius 仍是 `HIGH`
- 当前问题已不再是“重复 helper 没抽完”，而是 repo identity contract 主路径
- focused tests 与高风险边界说明已足够支撑下一次真正决策

默认策略：

- 停止继续按低风险 path-helper 小切片推进
- 不把它混进其他 runtime / CLI cleanup

允许重开的触发条件：

- 出现 host-specific path behavior 回归
- 明确启动 dedicated runtime identity slice
- 或需要改变 repo identity / resolve precedence 契约

---

## 3. 当前仍可主动推进的方向

如果继续做仓库治理，当前更合理的主动方向不是继续围绕上述四条线补边界，而是以下几类：

1. 新出现的真实故障或维护信号
   - 构建失败
   - CI / host setup 回归
   - upstream 差异重新产生实际影响

2. 观察名单中的真实热点再次升温
   - `src/cli/skill-gen.ts`
   - `src/core/kuzu/kuzu-adapter.ts`
   - `src/core/ingestion/utils.ts`
   - `src/core/ingestion/import-processor.ts`
   - `src/core/ingestion/framework-detection.ts`

3. 需要从“文档一致”切到“实现收敛”的明确项目
   - 例如 dedicated runtime identity slice
   - 或 dedicated shim-retirement slice
   - 或真实前端 deterministic refresh 替代实现

---

## 4. 默认不再做的事

在没有新触发条件前，默认不再继续做以下动作：

- 为现有 shim/workaround 再补一层同质化文档论证
- 为已收敛的 helper-contract 问题继续重复补低价值 focused tests
- 把高风险主路径伪装成“顺手清理”继续硬切
- 仅因为某段代码看起来老，就继续追问“还能不能再删一点”

这些动作会提升提交数量，但不会提升当前仓库的真实确定性。

---

## 5. 下一步决策规则

未来如果要继续推进，请优先按下面顺序决策：

1. 这是新故障，还是旧债务的重复补证据？
2. 如果是旧债务，它是否已经有明确的 retirement/risk boundary 文档？
3. 如果已有边界文档，现在是否满足其中列出的触发条件？
4. 如果不满足，默认停刀；不要再把“继续做一点”当成前进。

---

## 6. 结论

当前仓库已经完成一轮“把模糊债务变成显式边界”的治理。
下一阶段应从“继续补证据”切换到“等触发条件再开专门切片”。

更准确的默认策略是：

- 对 `parsing-processor`、`suffixResolve`、`useSigma`、`backend-runtime` 这四条线，先停刀
- 只在满足各自触发条件时再重开
- 日常治理优先处理新故障、真实热点和明确的单独项目
