# Wiki Generator Module Tree Implementation Plan Truth Sync

日期：2026-04-08  
范围：`docs/superpowers/plans/2026-03-26-wiki-generator-module-tree-implementation-plan.md`  
目标：把历史 `wiki-generator-module-tree` implementation plan 的 false-open 状态同步回当前已落地事实。

---

## 1. 背景

`module-tree` 这条 wiki generator 拆分切片，当前问题不在实现，而在历史计划与设计
叙事：

- 历史 implementation plan 仍把整条执行链保留成未勾选状态
- 历史设计文档仍写成 `Draft for review`
- 但当前仓内已经存在 `module-tree/types.ts`、`module-tree/builder.ts`、
  `wiki-module-tree.test.ts`，以及 `generator.ts` 对这些模块的实际导入锚点
- `builder.ts` 里也已经存在历史计划列出的核心 helper 边界：
  `buildModuleTree`、`parseGroupingResponse`、`fallbackGrouping`、
  `splitBySubdirectory`、`countModules`、`flattenModuleTree`

因此它属于典型的 historical false-open plan debt，而不是 module-tree
builder 缺失。

---

## 2. 事实源

本轮直接使用以下 merged-state truth sources：

- [2026-03-26-wiki-generator-module-tree-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-26-wiki-generator-module-tree-design.md)
  - 本轮补做 implementation sync，并把状态收敛为 historical landed record
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 本轮补登记这条 false-open residual 已关闭
- 当前仓内实现与测试锚点
  - `gitnexus/src/core/wiki/module-tree/types.ts`
  - `gitnexus/src/core/wiki/module-tree/builder.ts`
  - `gitnexus/test/unit/wiki-module-tree.test.ts`
  - `gitnexus/src/core/wiki/generator.ts`
  - `gitnexus/src/core/wiki/pages/leaf-page.ts`
  - `gitnexus/src/core/wiki/pages/parent-page.ts`

---

## 3. 本轮修复

本轮只做 bounded truth-sync：

- 为历史 implementation plan 增加 execution status sync note
- 把旧计划里 20 条已落地步骤回填为已完成
- 增加一段 historical verification summary，明确当前采用的事实源
- 把旧设计文档状态从 `Draft for review` 收敛为 historical landed record
- 在技术债路线图中登记这条 false-open residual 已关闭
- 为这次文档收敛登记新的 OpenSpec change

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- wiki module-tree runtime 行为

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
openspec validate 2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync`
  返回 `Change '2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 96`
  - `changed_count = 258`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 truth-sync 自身引入了新的 wiki module-tree blast radius
- 本轮实际修改范围仍然只落在治理文档、历史 implementation/design docs、
  路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical implementation-plan / design drift，而不是 wiki
generator 产品缺陷。

修完后，`module-tree` 这条已经落地的 wiki generator 拆分切片，
不会再继续被历史计划文档误报为“尚未执行”。
