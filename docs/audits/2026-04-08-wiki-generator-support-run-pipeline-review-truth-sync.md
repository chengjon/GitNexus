# Wiki Generator Support-Run-Pipeline Review Truth Sync

日期：2026-04-08
范围：`docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
目标：把 historical review 文档里仍按“进入实现阶段前”表达的叙事同步回当前已落地事实

---

## 1. 背景

`2026-03-27-wiki-generator-support-run-pipeline-design-review.md` 仍保留典型的
pre-implementation 口吻：

- “发现几个需要澄清或改进的点”
- “修复上述 7 个问题后即可进入实现阶段”

但当前主仓已经有更强事实源表明这条切片早已落地：

- `generator-support.ts` 与 `run-pipeline.ts` 已存在
- `wiki-generator-support.test.ts` 与 `wiki-run-pipeline.test.ts` 已存在
- truth-synced 设计文档已收敛为 landed historical design record
- 技术债路线图已把该 implementation-plan false-open 状态登记为已关闭

因此，这份 review 文档继续保留“进入实现阶段前”叙事，本身就成了新的 stale
review debt。

---

## 2. 事实源

本轮直接使用以下 merged-state truth sources：

- [2026-03-27-wiki-generator-support-run-pipeline-design-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md)
  - 本轮补做 status sync，使其回到 historical review record 定位
- [2026-03-27-wiki-generator-support-run-pipeline-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design.md)
  - 已 truth-sync 为 landed historical design record
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 已把该 implementation-plan false-open residual 标记为关闭
- 当前仓内实现与测试锚点
  - `gitnexus/src/core/wiki/generator-support.ts`
  - `gitnexus/src/core/wiki/run-pipeline.ts`
  - `gitnexus/test/unit/wiki-generator-support.test.ts`
  - `gitnexus/test/unit/wiki-run-pipeline.test.ts`

---

## 3. 本轮修复

本轮只做 bounded review-doc truth-sync：

- 给历史 review 文档增加 status sync note
- 把整体评价与总结段从“当前 gate”收敛为 historical review context
- 保留原始问题与建议内容，避免抹掉设计审查历史
- 在路线图中登记这条 review stale-state residual 已关闭
- 为这次文档收敛登记新的 OpenSpec change

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- wiki support/run-pipeline runtime 行为

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不改 TypeScript 行为
- 不改测试
- 不改双 CLI 合同
- 只修历史 review 文档状态漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync`
  返回 `Change '2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 104`
  - `changed_count = 266`
  - `affected_count = 53`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 review truth-sync 自身引入了新的 support/run-pipeline blast radius
- 本轮实际修改范围仍然只落在治理文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical review drift，而不是产品代码缺陷。

修完后，`2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
不会再把已经合并的 support/run-pipeline 切片继续表述成“进入实现阶段前”的当前 gate。
