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
- 两方都改过的文件（真实冲突面）：**66 个**，其中核心源码 21 个、测试 17 个、文档/skills 10+、工作流/hooks/web 约 10 个、依赖文件 4 个。

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
| 核心源码（21）| `local-backend.ts`、`tools.ts`、`git.ts`、`run-analyze.ts`、`repo-manager.ts`、cli 11 个、ingestion/pipeline、embeddings 等 | **按功能合并，不整文件二选一**：upstream 新功能保留 + 本地定制逻辑重新叠加。重点核对 07-29 事故文件（git.ts 的 getCoreExcludesFilePath 等）完整性 |
| 依赖文件（4）| package.json/lockfile ×2、package-lock.json、eval/uv.lock | **以 upstream 为准**（其 dependabot 更新更全）；本地 dependabot merge 提交的旧版本自动被覆盖 |
| 测试（17）| git.test.ts、incremental-orchestration.test.ts 等 | 以 upstream 新测试为主，本地新增用例合并；恢复 upstream 版 incremental-orchestration 测试 |
| 文档/skills（10+）| CLAUDE.md、AGENTS.md、.claude/skills/ 7 个 | 逐段合并：本地定制说明保留 + upstream 更新合入 |
| 工作流/hooks/web（~10）| .github/workflows 4 个、web 组件 3 个、hook-db-lock-probe 2 个 | 以 upstream 结构为准 + 本地改动重放 |

## 防翻车措施（07-29 教训）

1. 只用 merge，禁止 rebase/cherry-pick。
2. 冲突解决后先跑 export 一致性检查（复用既有扫描器，目标 0 缺失导出），再构建。
3. 逐文件核对事故文件（git.ts、incremental-orchestration.test.ts）未再被截断。
4. 每个冲突文件的解决都基于"本地定制逻辑 + upstream 新功能"的合并原则，禁止整文件覆盖本地深度定制。

## 验证与验收

1. `npm run build` → **0 类型错误**。
2. **全量测试**：`npx vitest run`（205 unit + 77 integration = 282 文件），甄别 merge 引入 vs 既有 flaky。
3. **MCP 冒烟**：initialize + tools/list（14 工具）+ 实际调用 `list_repos`。
4. **本地定制抽验**：
   - P0/P1/P2 MCP 响应增强（feat 4ad039c6 相关路径）
   - repo-specific 文件分类覆盖（feat 5793c6fa）
   - incremental analyze 模式（openspec incremental-analyze）
   - git 扩展函数（getCoreExcludesFilePath / getGitInfoExcludePath 等）

## 提交与回滚

- 单独一个 merge commit（+ 必要的冲突解决提交），提交信息注明同步日期与 upstream 基线。
- reflog 保留全部先兆；merge 失败可 abort，回归后状态可 reset 回 b4281859。

## 后续（本次不做）

- 定期同步节奏建议（merge 模式，每 1-2 周一次）。
- upstream 新功能引入后的行为变化记录到本地 KB/CHANGELOG。
