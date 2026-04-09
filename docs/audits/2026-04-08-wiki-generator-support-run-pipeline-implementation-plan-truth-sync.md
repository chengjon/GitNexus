# Wiki Generator Support And Run Pipeline Implementation Plan Truth Sync

日期：2026-04-08  
范围：`docs/superpowers/plans/2026-03-27-wiki-generator-support-run-pipeline-implementation-plan.md`  
目标：把历史 `wiki-generator-support-run-pipeline` implementation plan 的 false-open 状态同步回当前已落地事实。

---

## 1. 背景

`support-run-pipeline` 这条 wiki generator 拆分切片，当前问题不在实现，而在历史
计划与路线图叙事：

- 历史 implementation plan 仍把整条执行链保留成未勾选状态
- 旧路线图补充仍沿用当年 worktree merge 视角，容易把这个子切片误读成“主仓尚未落地”
- 但当前仓内已经存在 `generator-support.ts`、`run-pipeline.ts`、对应 focused
  tests，以及主 `generator.ts` 上的实际导入锚点
- `2026-03-28` 技术债审计也已把 support / orchestration / adjacent wiki
  extraction tests 记为已验证

因此这属于典型的 historical false-open plan debt，而不是产品代码缺失。

---

## 2. 事实源

本轮直接使用以下 merged-state truth sources：

- [2026-03-27-wiki-generator-support-run-pipeline-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design.md)
  - 本轮补做 implementation sync，并把状态收敛为 historical landed record
- [2026-03-27-wiki-generator-support-run-pipeline-design-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md)
  - 保留为历史 review 记录，但不再作为 active implementation blocker
- [2026-03-28-technical-debt-audit.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-technical-debt-audit.md)
  - 已把 `generator-support.ts`、`run-pipeline.ts`、orchestration tests 与邻接
    wiki extraction tests 记为已验证
- 当前仓内实现与测试锚点
  - `gitnexus/src/core/wiki/generator-support.ts`
  - `gitnexus/src/core/wiki/run-pipeline.ts`
  - `gitnexus/src/core/wiki/generator.ts`
  - `gitnexus/test/unit/wiki-generator-support.test.ts`
  - `gitnexus/test/unit/wiki-run-pipeline.test.ts`
  - `gitnexus/test/unit/wiki-generator-orchestration.test.ts`
  - `gitnexus/src/core/wiki/incremental-update.ts`
  - `gitnexus/src/core/wiki/full-generation.ts`
  - `gitnexus/src/core/wiki/module-tree/builder.ts`

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 把旧计划里 25 条已落地步骤回填为已完成
- 增加一段 historical verification summary，明确当前采用的事实源
- 把旧设计文档状态从 `Draft for review` 收敛为 historical landed record
- 在技术债路线图中登记这条 false-open residual 已关闭
- 为这次文档收敛登记新的 OpenSpec change

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- wiki generation runtime 行为

---

## 4. 风险边界

这轮仍然只是治理文档收敛：

- 不改 TypeScript 行为
- 不改测试
- 不改双 CLI 合同
- 只修历史 implementation plan / design / roadmap 状态漂移

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync`
  返回 `Change '2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 85`
  - `changed_count = 248`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 truth-sync 自身引入了新的 wiki generator blast radius
- 本轮实际修改范围仍然只落在治理文档、历史 implementation/design docs、
  路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical implementation-plan / design drift，而不是 wiki
generator 产品缺陷。

修完后，`support-run-pipeline` 这条已经落地的 wiki generator 拆分切片，
不会再继续被历史计划文档误报为“尚未执行”。
