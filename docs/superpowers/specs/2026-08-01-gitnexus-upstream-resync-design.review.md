# 审核意见：2026-08-01-gitnexus-upstream-resync-design

审核日期：2026-08-01
审核对象：`docs/superpowers/specs/2026-08-01-gitnexus-upstream-resync-design.md`
审核方式：基于仓库实态逐项核查（基线 commit、提交数、冲突面、引用符号、reflog 事故证据）

## 结论

**方案方向正确、依据充分，批准状态合理**。merge 模式有 2026-06-05 成功先例（`ccf9e39f` = Merge PR #29），07-29 rebase 事故在 reflog 中有确凿证据（`HEAD@{5} rebase (finish)` → `HEAD@{1} reset b4281859`），回滚设计（`merge --abort` / reset 基线 / reflog）成立。但存在 **1 处实质性事实错误**（验收项符号归属写反）和**若干流程缺口**，应在写实施计划前修正。

## 事实核查（逐项对照实测）

| 文档声明 | 实测 | 判定 |
|---|---|---|
| 基线 `b4281859` 干净可用 | 存在，是 HEAD（设计文档提交 `598f2a45`）的直接父提交；`git.ts` 450 行，恢复完整 | ✅ |
| upstream 领先 527 个提交 | `HEAD..upstream/main` = 527 | ✅ 精确一致 |
| 本地独有 91 个提交 | `upstream/main..HEAD` = 92，恰为 91（文档写作时）+ 1（设计文档提交本身） | ✅ 口径成立 |
| 冲突面 66 个文件 | 实测 **61**（merge-base `bd59fa95` = 2026-06-04 upstream RING4-2 提交，与 06-05 同步时间吻合）。核心源码 21、测试 17 与文档**完全一致**；差异：依赖 6（文档 4）、web 5（文档 3 组件 + 2 hook，接近）、文档/skills 6（文档 10+，偏高） | ⚠️ 差 5，建议修正并注明口径 |
| 07-29 rebase 事故（git.ts 截断 9 行等） | reflog 证实；历史中另发现 rebase 重放产生的**孤儿副本**（`bf81e114` 与原始提交 `4ad039c6` 同 message、不同 hash、tree 差 2047 文件） | ✅ 事故属实；主线已干净 |
| `feat 4ad039c6`（P0/P1/P2 响应增强） | 存在，本地独有（P0 MCP stale metadata / P1 文件分类 / P1 incremental analyze / P2 risk rationale / P2 grammar warning 抑制 / zh-CN i18n） | ✅ |
| `feat 5793c6fa`（repo-specific 文件分类覆盖） | 存在，本地独有（`file-classifier.ts` +110 行） | ✅ |
| 2026-06-05 merge 成功先例 | `ccf9e39f` = Merge PR #29，含 `de40bfe5` upstream/main 合并 | ✅ |

## 🔴 实质性错误：验收项 4 的 git 扩展函数归属写反

设计文档将 `getCoreExcludesFilePath / getGitInfoExcludePath` 列为"本地 git 扩展函数"抽验项。实测：

- 这两个函数**在本地 HEAD 全仓库不存在**（本地 `gitnexus/src/storage/git.ts` 450 行，无此函数）；
- 它们是 **upstream 新功能**（`#2606`，upstream `git.ts` 672 行含之，由 `gitnexus/src/config/ignore-service.ts` 引用）。

影响：不仅是归类错误，还直接关系到冲突解决姿势 —— 若 git.ts 冲突时用本地旧版整文件覆盖，会**丢掉 upstream 的 excludesFile 功能**，与文档"禁止整文件覆盖本地深度定制"原则方向恰好相反。应改为"**upstream 新功能未丢失**"验收项，并列为 git.ts 冲突解决的核对重点。

## 🟠 流程缺口（建议在实施计划中补齐）

1. **依赖文件"以 upstream 为准"会丢弃本地安全修复**：本地独有提交 `c1f89ace chore: remediate dependency security alerts`（改 3 个 lockfile，+919/-581）不是 dependabot 提交，不能简单"被覆盖"。需先核对 upstream lockfile 是否已含同等修复，否则手动补回。
2. **缺 `npm ci` 可安装验证**：依赖整体切换后，lockfile 与本地 node 平台/原生绑定（tree-sitter 等）可能不兼容。
3. **缺索引重建步骤**：527 提交含大量 ingestion/schema 改动（`gitnexus/src/core/lbug/schema.ts`、`gitnexus-shared/src/lbug/schema-constants.ts` 均在冲突面内，RING4-2 删除 legacy resolution）。合并后 `.gitnexus/lbug` 必须 rebuild，否则 MCP 结果不可信。验收与提交部分均未提及。
4. **验收覆盖不完整**：只覆盖 `gitnexus/` 的 build + vitest。冲突面内有 `gitnexus-web/` 5 个文件、`gitnexus-shared/` 2 个文件，缺 `npx tsc --noEmit`、web 包 typecheck/test（AGENTS.md 明确要求）。
5. **"单个 merge commit"与 21 个核心文件复杂合并的矛盾**：一次性 commit 承载全部冲突解决难以 review。建议附加**逐文件 merge 决策日志**（每个冲突文件：取 upstream / 取本地 / 手动合并及理由），并按 AGENTS.md 要求 commit 前跑 `gitnexus_detect_changes`。

## 🟡 建议补充（非阻塞）

- merge 前导出**本地 91 提交完整清单**（`git rev-list upstream/main..HEAD`）并标注保留意图；对深度定制文件（`file-classifier.ts`、`local-backend.ts`、`tools.ts`、P0/P1/P2 系列）保存**补丁快照**作为合并后核对基准 —— merge 后 diff 无法区分"upstream 变化"与"冲突解决引入的变化"。
- 预审 upstream 2 个月新功能清单（日志中可见 `#1749`、`#2106`、`#2192`、`#2548`、`#2558`、`#2566`、`#2606`、`#2640` 等），提前列出"合入后行为变化清单"，比合完再记录更稳。
- merge 前 `git fsck` 清理 07-29 事故留下的孤儿提交，防误合。

## 已验证无问题

- `incremental-orchestration.test.ts`：本地 285 行 vs upstream 1139 行，"恢复 upstream 版"策略正确。
- merge-base 时间点、远程配置（origin=chengjon / upstream=abhigyanpatwari）、历史同步分支均与文档一致。

## 一句话总结

方案可批准，但实施前请修正验收项 4 的函数归属（改为 upstream 新功能核对），并在实施计划中加入依赖安全修复核对、`npm ci`、索引重建、web/shared 验证与逐文件 merge 决策日志。
