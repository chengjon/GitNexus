# Wiki Generator Full Generation Review Truth Sync

日期：2026-04-08
范围：`docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md`
目标：把 historical review 文档里已经被 landed code 修复的 blocker 叙事同步回当前事实

---

## 1. 背景

`2026-03-28-wiki-generator-full-generation-review.md` 仍保留两层会误导当前读者的
表述：

- Verdict 仍写着 `a few issues to address before implementation`
- 问题 1 仍带着 `Should fix before implementation` 的 blocker 语气

但当前主仓与同日技术债审计已经给出更强事实源：

- `gitnexus/src/core/wiki/full-generation.ts` 已落地
- `gitnexus/src/core/wiki/generator.ts` 已改为 wrapper + helper 边界
- `2026-03-28-technical-debt-audit.md` 已明确记录：
  `failedModules` review finding 在落地代码中已修复

因此，这份 review 文档继续保留“实施前 blocker”口吻，本身就成了新的 stale
review debt。

---

## 2. 事实源

本轮直接使用以下 merged-state truth sources：

- [2026-03-28-wiki-generator-full-generation-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md)
  - 本轮补做 status sync，使其回到 historical review record 定位
- [2026-03-28-technical-debt-audit.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-technical-debt-audit.md)
  - 已明确记录 `failedModules` review finding 在落地代码中已修复
- [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  - 本轮补登记这条 review stale-state residual 已关闭
- 当前仓内实现锚点
  - `gitnexus/src/core/wiki/full-generation.ts`
  - `gitnexus/src/core/wiki/generator.ts`

---

## 3. 本轮修复

本轮只做 bounded review-doc truth-sync：

- 给历史 review 文档增加 status sync note
- 把 Verdict 收敛为 historical review record，而不是当前 blocker
- 在问题 1 下补一段 landed-resolution note，明确 helper/wrapper 现在如何处理
  `failedModules`
- 更新总结段，避免继续把当前已合并切片写成“实施前”
- 在路线图中登记这条 review stale-state residual 已关闭
- 为这次文档收敛登记新的 OpenSpec change

本轮不改：

- `gitnexus/src/**`
- `gitnexus/test/**`
- wiki full-generation runtime 行为

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
openspec validate 2026-04-08-wiki-generator-full-generation-review-truth-sync
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-08-wiki-generator-full-generation-review-truth-sync`
  返回 `Change '2026-04-08-wiki-generator-full-generation-review-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  直接返回：
  - `risk_level = critical`
  - `changed_files = 103`
  - `changed_count = 265`
  - `affected_count = 54`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

说明：

- 当前 worktree-wide scope review 仍然被仓内其他未提交代码改动放大
- 它不等于本轮 review truth-sync 自身引入了新的 full-generation blast radius
- 本轮实际修改范围仍然只落在治理文档、路线图与 OpenSpec 台账

---

## 6. 结论

这轮关闭的是 historical review drift，而不是产品代码缺陷。

修完后，`2026-03-28-wiki-generator-full-generation-review.md` 不会再把已经合并的
`full-generation` 切片继续表述成“实施前 blocker”。
