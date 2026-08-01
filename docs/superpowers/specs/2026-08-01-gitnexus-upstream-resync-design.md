# GitNexus Fork ↔ Upstream 重新同步设计

日期：2026-08-01
状态：已批准（设计审阅通过，待写实施计划）

## 背景与根因

- 本 fork（origin: chengjon/GitNexus，upstream: abhigyanpatwari/GitNexus）历史上用 **merge 模式**成功同步过（2026-06-05 `sync/upstream-main-20260605`）。
- 2026-07-29 首次改用 `pull --rebase upstream main`，重放本地提交时发生重大冲突，冲突解决过程把 `gitnexus/src/storage/git.ts` 截断为 9 行（-368 行）、`incremental-orchestration.test.ts` 砍掉 958 行等，导致 import/export 不匹配、`gitnexus mcp` 启动即 `SyntaxError`、构建 87 个类型错误。
- 已回退到 rebase 前基线 `b4281859`：构建 0 错误、MCP 正常（14 工具 / 16 仓库）。基线干净可用。

## 现状数据

- upstream 领先 **527 个提交**（2026-06-05 之后约 2 个月新开发）。
- 本地独有 **91 个提交**（docs 27 / fix 15 / feat 15 / merge 13 / deps 9 / test 4 / ci 4 / chore 4）。
- 两方都改过的文件（真实冲突面）：**61 个**（口径：merge-base `bd59fa95` 两侧树差异的交集），其中核心源码 21 个、测试 17 个、依赖 6 个、web 5 个、文档/skills 6 个、工作流/hooks 6 个。（本文件初版曾以"提交触碰交集"口径统计为 66，偏保守，已修正。）

## 目标

跟上 upstream 全部 527 个新提交，同时**完整保留本地 91 个提交的全部定制**（P0/P1/P2 改进、repo-specific 文件分类覆盖、incremental analyze、本地 docs/skills/agents 等）。

## 方案：git merge（历史成功模式）

```
git fetch upstream
git merge upstream/main
```

- 不用 rebase、不用 cherry-pick（07-29 事故即 rebase 重放冲突所致）。
- 冲突一次性解决（非逐提交重放），git 3-way 自动合并其余文件。
- merge 可随时 `git merge --abort` 回退到 b4281859，reflog 全程安全网。

## 冲突解决原则（逐文件分类）

| 类别 | 文件 | 原则 |
|---|---|---|
| 核心源码（21）| `local-backend.ts`、`tools.ts`、`git.ts`、`run-analyze.ts`、`repo-manager.ts`、cli 11 个、ingestion/pipeline、embeddings 等 | **按功能合并，不整文件二选一**：upstream 新功能保留 + 本地定制逻辑重新叠加。重点核对：`git.ts` 必须保留 upstream 672 行完整版（含 `getCoreExcludesFilePath`/`getGitInfoExcludePath` 与 excludesFile 功能），本地小修重新叠加，**禁止本地 450 行旧版整文件覆盖** |
| 依赖文件（6）| package.json/lockfile ×2、package-lock.json、eval/uv.lock | **以 upstream 为准**，但**先核对本地安全修复是否被覆盖**：本地 `c1f89ace chore: remediate dependency security alerts`（+919/-581，非 dependabot 提交）改过 3 个 lockfile。若 upstream lockfile 未含同等修复，需手动补回该修复 |
| 测试（17）| git.test.ts、incremental-orchestration.test.ts 等 | 以 upstream 新测试为主，本地新增用例合并；恢复 upstream 版 incremental-orchestration 测试（本地 285 行 vs upstream 1139 行） |
| 文档/skills（6）| CLAUDE.md、AGENTS.md、.claude/skills/ 7 个 | 逐段合并：本地定制说明保留 + upstream 更新合入 |
| 工作流/hooks（6）| .github/workflows 4 个、hook-db-lock-probe 2 个 | 以 upstream 结构为准 + 本地改动重放 |
| web（5）| gitnexus-web 组件 3 个、web/package.json + lockfile | 以 upstream 为准，本地改动核对后重放 |

## 防翻车措施（07-29 教训）

1. 只用 merge，禁止 rebase/cherry-pick。
2. merge 前 `git fsck --no-reflogs` 清理 07-29 事故留下的孤儿提交（实测 430 个 dangling，含孤儿副本 `bf81e114`），防误合。
3. merge 前导出本地 91 提交完整清单（`git rev-list upstream/main..HEAD`）标注保留意图；对深度定制文件（`file-classifier.ts`、`local-backend.ts`、`tools.ts`、P0/P1/P2 系列）保存**补丁快照**作为合并后核对基准（merge 后 diff 无法区分"upstream 变化"与"冲突解决引入的变化"）。
4. 冲突解决后先跑 export 一致性检查（复用既有扫描器，目标 0 缺失导出），再构建。
5. 逐文件核对事故文件（git.ts、incremental-orchestration.test.ts）未再被截断；git.ts 核对 `getCoreExcludesFilePath`/`getGitInfoExcludePath` 存在。
6. 每个冲突文件的解决都基于"本地定制逻辑 + upstream 新功能"的合并原则，禁止整文件覆盖本地深度定制。
7. 预审 upstream 2 个月新功能清单（日志可见 `#1749`、`#2106`、`#2192`、`#2548`、`#2558`、`#2566`、`#2606`、`#2640` 等），提前列出"合入后行为变化清单"，合完对照核对。

## 验证与验收

1. `npm run build` → **0 类型错误**。
2. **全量测试**：`npx vitest run`（205 unit + 77 integration = 282 文件），甄别 merge 引入 vs 既有 flaky。
3. **`npm ci` 可安装验证**：依赖整体切换后，lockfile 与本地 node 平台/原生绑定（tree-sitter 等）兼容性确认。
4. **web/shared 类型与测试**：`npx tsc --noEmit`（gitnexus-web、gitnexus-shared 冲突面内的包）+ web 包测试（AGENTS.md 要求）。
5. **索引重建**：527 提交含大量 ingestion/schema 改动（`core/lbug/schema.ts`、`gitnexus-shared/src/lbug/schema-constants.ts` 在冲突面内，RING4-2 删除 legacy resolution），合并后 `.gitnexus/lbug` 必须 rebuild，否则 MCP 结果不可信。
6. **MCP 冒烟**：initialize + tools/list（14 工具）+ 实际调用 `list_repos`。
7. **本地定制抽验**：
   - P0/P1/P2 MCP 响应增强（feat `4ad039c6`：P0 MCP stale metadata / P1 文件分类 / P1 incremental analyze / P2 risk rationale / P2 grammar warning 抑制 / zh-CN i18n）
   - repo-specific 文件分类覆盖（feat `5793c6fa`：`file-classifier.ts`）
   - incremental analyze 模式（openspec incremental-analyze）
8. **upstream 新功能未丢失抽验**（重点核对项）：
   - `git.ts` excludesFile 功能：`getCoreExcludesFilePath` / `getGitInfoExcludePath` 存在且 `ignore-service.ts` 正常引用
   - 其余按行为变化清单逐项核对

## 提交与回滚

- merge commit + 冲突解决提交，并附**逐文件 merge 决策日志**（每个冲突文件：取 upstream / 取本地 / 手动合并及理由），便于 review。
- commit 前按 AGENTS.md 要求跑 `gitnexus_detect_changes`。
- reflog 保留全部先兆；merge 失败可 `git merge --abort`，回归后状态可 reset 回 `b4281859`。

## 后续（本次不做）

- 定期同步节奏建议（merge 模式，每 1-2 周一次）。
- upstream 新功能引入后的行为变化记录到本地 KB/CHANGELOG。
