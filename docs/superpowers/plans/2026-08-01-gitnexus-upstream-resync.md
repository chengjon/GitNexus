# GitNexus Fork ↔ Upstream 重新同步 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在干净基线 `b4281859` 上以 merge 模式合入 upstream 全部 527 个新提交，完整保留本地 91 个提交的全部定制，达到构建 0 错误、全量测试通过、MCP 正常、本地定制与 upstream 新功能均不丢失。

**Architecture:** 用 `git merge upstream/main`（本地 06-05 验证过的成功模式，禁止 rebase/cherry-pick）。merge 是单次 3-way 合并，冲突集中在 61 个两方都改过的文件；按 spec 的分类原则逐文件解决（核心源码按功能合并、依赖以 upstream 为准并核对安全修复、测试以 upstream 为主叠加本地用例、文档逐段合并）。解决完成后依次验证：export 一致性 → build → npm ci → vitest 全量 → web/shared typecheck → 索引重建 → MCP 冒烟与定制/新功能抽验，最后产出逐文件 merge 决策日志并提交。

**Tech Stack:** git (merge/3-way)、TypeScript (tsc noEmitOnError=false 已确认)、vitest 4.1.7、npm ci、gitnexus 自带 CLI（detect_changes、doctor）。

**关键前置产物（已完成，勿重复）：** `/tmp/opencode/resync/` 下已有：`local-commits.txt`（本地 91 提交清单）、`conflicts-61.txt`（61 冲突文件清单）、12 个深度定制文件快照（`*.snap`，含 `git.ts.snap`、`local-backend.ts.snap`、`file-classifier.ts.snap` 等）。merge 后 diff 无法区分 upstream 变化与冲突解决引入的变化，用快照做核对基准。

**安全网：** merge 全程可 `git merge --abort`；基线 `b4281859` 及 spec/plan 均已提交（`598f2a45`、`0711864d`），reflog 完整。

---

## Task 1: 清理孤儿提交（07-29 事故残留）

**Files:** 无（git 对象库操作）

- [ ] **Step 1: 确认工作区干净**

Run: `cd /opt/claude/GitNexus && git status --short`
Expected: 空（或仅 `.codewhale/` 未跟踪目录——可忽略，它不在 git 库内）

- [ ] **Step 2: 确认孤儿提交存在（430 个）**

Run: `git fsck --no-reflogs 2>/dev/null | grep -c "dangling commit"`
Expected: 430（含孤儿副本 `bf81e114`，它是 07-29 rebase 重放的 `4ad039c6` 副本，与主线的原提交并存）

- [ ] **Step 3: 不删除孤儿提交**

说明：`git fsck` 列出的 dangling commit 不会被 merge 带入历史（merge 只合 reachable 提交），无需 `git gc --prune=now` 强删——保留它们作为 reflog 之外的事故取证。**本步仅确认存在，不做删除。**（与 spec 防翻车 2 的"fsck 清理"口径：清理=确认无 merge 会触碰的孤儿，实测 reachable 图干净即可。）

- [ ] **Step 4: 验证 merge-base 正确**

Run: `git merge-base HEAD upstream/main && git log --oneline -1 $(git merge-base HEAD upstream/main)`
Expected: `bd59fa95...`（2026-06-04 upstream RING4-2 提交，与 06-05 同步时间吻合）

## Task 2: fetch 并启动 merge

**Files:** 无（git 操作）

- [ ] **Step 1: 拉取最新 upstream**

```bash
cd /opt/claude/GitNexus
git fetch upstream main
git rev-list HEAD..upstream/main | wc -l
```
Expected: 527

- [ ] **Step 2: 启动 merge（预期有冲突，属正常）**

```bash
git merge upstream/main -m "chore: merge upstream main (planned resync 2026-08-01)"
```
Expected: 以冲突告终（conflict 状态），`git status --short | grep -c "^UU"` 约等于预期冲突文件数（≤61）。**不要 abort，继续后续任务。**

- [ ] **Step 3: 记录冲突全量清单**

```bash
git diff --name-only --diff-filter=U > /tmp/opencode/resync/actual-conflicts.txt
wc -l /tmp/opencode/resync/actual-conflicts.txt
```
Expected: 数量 ≤ 61 且是 `/tmp/opencode/resync/conflicts-61.txt` 的子集（61 是"两方都改"的并集，实际冲突 ≤ 它；其余为自动合并成功或单方修改）。

- [ ] **Step 4: 记录自动合并成功的文件中有多少是"两方都改但 git 自动合并"的**

Run: `comm -23 /tmp/opencode/resync/conflicts-61.txt /tmp/opencode/resync/actual-conflicts.txt`
说明：这些文件已被 git 3-way 自动合并——**必须抽查确认合并结果语义正确**（尤其源码），抽查规则见后续 Task 3/4。

## Task 3: 核心源码（cli 组 11 个文件）冲突解决

**Files:**
- 解决: `gitnexus/src/cli/ai-context.ts`、`analyze.ts`、`detect-changes-format.ts`、`doctor.ts`、`help-i18n.ts`、`index.ts`、`optional-grammars.ts`、`status.ts`、`tool.ts`、`i18n/en.ts`、`i18n/zh-CN.ts`

策略：**按功能合并**——upstream 2 个月新增的 CLI 行为保留，本地 P0/P1/P2 定制（zh-CN i18n、doctor 输出、status 扩展等）重新叠加。本地 `zh-CN.ts` 与 `en.ts` 是深度定制点（审核确认 P2 zh-CN i18n 为本地 feat `4ad039c6` 内容），合并时以本地版本为基底补 upstream 新 key。

- [ ] **Step 1: 逐个打开冲突文件，识别冲突块**

Run: `grep -c "^<<<<<<<" gitnexus/src/cli/*.ts gitnexus/src/cli/i18n/*.ts 2>/dev/null | grep -v ":0" | sort -t: -k2 -rn`
Expected: 列出实际有冲突块的文件及数量（i18n 两个文件预期最多）。

- [ ] **Step 2: 逐文件解决（每文件一个子步骤，循环执行）**

对每个有冲突的文件：
1. `git show :1:<path>` 看 merge-base 版本、`:2:` 本地版本、`:3:` upstream 版本（理解三方差异）
2. 手工编辑：upstream 新功能保留 + 本地定制重新叠加（参考 `/tmp/opencode/resync/` 快照确认本地定制点）
3. 删除所有 `<<<<<<<` / `=======` / `>>>>>>>` 标记

```bash
# 循环体示例（以 analyze.ts 为例）：
git show :2:gitnexus/src/cli/analyze.ts > /tmp/opencode/resync/analyze.ours.ts
git show :3:gitnexus/src/cli/analyze.ts > /tmp/opencode/resync/analyze.theirs.ts
# 编辑 gitnexus/src/cli/analyze.ts 完成三方合并后：
git add gitnexus/src/cli/analyze.ts
```

- [ ] **Step 3: 验证冲突块清零**

Run: `git grep -l "^<<<<<<<\|^=======\|^>>>>>>>" -- gitnexus/src/cli/ | wc -l`
Expected: `0`

- [ ] **Step 4: 验证 i18n 完整性**

Run: `grep -c "zh-CN\|en:" gitnexus/src/cli/i18n/zh-CN.ts`
Expected: 与 `en.ts` 的 key 数一致（`grep -c "^\s*[a-zA-Z]*:" gitnexus/src/cli/i18n/en.ts` 的数）——zh-CN 不能丢 key。

## Task 4: 核心源码（core/storage/mcp 组 10 个文件）冲突解决

**Files:**
- 解决: `gitnexus/src/core/embeddings/config.ts`、`embeddings/http-client.ts`、`ingestion/pipeline-phases/index.ts`、`ingestion/pipeline.ts`、`lbug/schema.ts`、`run-analyze.ts`、`mcp/local/local-backend.ts`、`mcp/tools.ts`、`storage/git.ts`、`storage/repo-manager.ts`

策略：**按功能合并**。重点文件与核对点：
- `git.ts`：**保留 upstream 672 行完整版**（含 `getCoreExcludesFilePath`/`getGitInfoExcludePath`/excludesFile 功能，upstream #2606），本地小修（07-29 前 `4f3e2498` 的 29 行改动：git.worktree 相关容错）重新叠加。**禁止用本地 450 行旧版覆盖。**
- `local-backend.ts` / `tools.ts`：本地 P0/P1/P2 深度定制（MCP 响应增强、stale metadata、分页参数、file-classifier 挂钩），upstream 新功能（#2106 branch 字段、#2119 分页、#2354 pinned branches 等）合入。以快照 `local-backend.ts.snap`/`tools.ts.snap` 核对本地定制点不丢。
- `run-analyze.ts`：本地 incremental analyze 深度定制（快照 `run-analyze.ts.snap`），upstream 新 analyze 流程合入，按功能合并。
- `lbug/schema.ts` + `gitnexus-shared/src/lbug/schema-constants.ts`：**以 upstream 为准**（RING4-2 删除 legacy resolution，schema 演进），本地若有用例引用旧字段则同步更新（见 Task 5）。
- `repo-manager.ts`：以 upstream 为准 + 本地 `BranchSummary` 相关改动核对重放。

- [ ] **Step 1: 识别冲突块**

Run: `grep -c "^<<<<<<<" gitnexus/src/core/embeddings/*.ts gitnexus/src/core/ingestion/pipeline*.ts gitnexus/src/core/ingestion/pipeline-phases/*.ts gitnexus/src/core/lbug/*.ts gitnexus/src/core/run-analyze.ts gitnexus/src/mcp/local/local-backend.ts gitnexus/src/mcp/tools.ts gitnexus/src/storage/*.ts 2>/dev/null | grep -v ":0"`
Expected: 列出冲突文件清单（git.ts、local-backend.ts、tools.ts、run-analyze.ts 预期在其中）。

- [ ] **Step 2: 逐文件解决（同 Task 3 Step 2 循环体）**

对每个文件：三方对比（`:1:` `:2:` `:3:`）→ 按策略手工合并 → 删冲突标记 → `git add`

- [ ] **Step 3: 事故文件完整性核对（防再翻车）**

```bash
grep -c "getCoreExcludesFilePath\|getGitInfoExcludePath" gitnexus/src/storage/git.ts
grep -c "getCoreExcludesFilePath\|getGitInfoExcludePath" gitnexus/src/config/ignore-service.ts
wc -l gitnexus/src/storage/git.ts
wc -l gitnexus/test/unit/incremental-orchestration.test.ts
```
Expected: git.ts 中 ≥2（两个函数都在）；ignore-service.ts ≥2（引用都在）；git.ts 行数 ≥600（接近 upstream 672）；incremental-orchestration.test.ts ≥1000（接近 upstream 1139，本地 285 行旧版已弃）。

- [ ] **Step 4: 本地深度定制点核对（用快照 diff）**

```bash
for f in local-backend tools run-analyze; do
  echo "== $f 本地定制特征核对 =="
  grep -c "P0\|P1\|P2\|stale\|freshness\|fileClassifier\|file-classifier" gitnexus/src/mcp/$f.ts 2>/dev/null || true
done
grep -c "incremental\|shadow\|subgraph" gitnexus/src/core/run-analyze.ts
```
说明：只要快照中存在的本地定制特征（P0/P1/P2 相关逻辑、file-classifier 引用、incremental analyze 钩子）在合并结果中仍然存在即视为通过；具体特征词以上述命令输出与快照对比为准。

## Task 5: 测试文件组（17 个）冲突解决

**Files:** 冲突面中的 17 个 `gitnexus/test/**`（清单见 `/tmp/opencode/resync/conflicts-61.txt` 的 test 段，含 `git.test.ts`、`incremental-orchestration.test.ts`、`tools.test.ts`、`run-analyze.test.ts`、`ai-context.test.ts`、`calltool-dispatch.test.ts`、`local-backend-calltool.test.ts` 等）

策略：**以 upstream 新测试为主**（upstream 的测试随新功能演进），本地新增用例（P0/P1/P2 响应测试、analyze-embeddings-limit 等）合并进对应文件；`incremental-orchestration.test.ts` 直接取 upstream 版（本地 285 行 vs upstream 1139 行，审核确认取 upstream）。

- [ ] **Step 1: 解决各测试冲突**

对每个冲突测试文件：取 upstream 版为基底（`git checkout --theirs <path>` 或手工合并），本地新增用例追加回文件尾部/对应 describe 块，删冲突标记，`git add`。

```bash
# 对"取 upstream"决策的文件：
git checkout --theirs gitnexus/test/unit/incremental-orchestration.test.ts && git add gitnexus/test/unit/incremental-orchestration.test.ts
```
注意：`--theirs` 仅用于决策为"取 upstream"的文件；含本地新增用例的文件必须手工合并，禁止 `--theirs` 覆盖。

- [ ] **Step 2: 验证无冲突标记残留**

Run: `git grep -l "^<<<<<<<" -- gitnexus/test/ | wc -l`
Expected: `0`

## Task 6: 依赖 / web / shared / hooks / workflows 组冲突解决

**Files:**
- 依赖: `gitnexus/package.json`、`gitnexus/package-lock.json`、`gitnexus-web/package.json`、`gitnexus-web/package-lock.json`、`package-lock.json`（根）、`eval/uv.lock`
- web: `gitnexus-web/src/components/CodeReferencesPanel.tsx`、`ProcessesPanel.tsx`、`RightPanel.tsx`
- shared: `gitnexus-shared/src/graph/types.ts`、`gitnexus-shared/src/lbug/schema-constants.ts`
- hooks: `gitnexus/hooks/claude/hook-db-lock-probe.cjs`、`gitnexus-claude-plugin/hooks/hook-db-lock-probe.cjs`
- workflows: `.github/workflows/ci-quality.yml`、`ci-tests.yml`、`docker.yml`、`pr-labeler.yml`

策略：依赖**以 upstream 为准**；web/shared/workflows **以 upstream 结构为准 + 本地改动核对重放**；hooks 两个文件核对两边版本差异取并集。

- [ ] **Step 1: 依赖文件取 upstream**

```bash
for f in gitnexus/package.json gitnexus/package-lock.json gitnexus-web/package.json gitnexus-web/package-lock.json package-lock.json eval/uv.lock; do
  if git ls-files -u "$f" >/dev/null 2>&1 || [ -n "$(git diff --name-only --diff-filter=U -- "$f")" ]; then
    git checkout --theirs "$f" && git add "$f"
  fi
done
```
Expected: 无输出错误；6 个依赖文件冲突状态清除。

- [ ] **Step 2: 本地安全修复核对（c1f89ace 不丢）**

```bash
git show c1f89ace --stat --format="" | head -5
# 核对 upstream lockfile 是否含同等修复：
git show upstream/main:gitnexus/package-lock.json | grep -c "hashes"   # 抽样
```
说明：`c1f89ace chore: remediate dependency security alerts`（+919/-581，改 3 个 lockfile）是**安全修复**非 dependabot。核对 upstream 对应 lockfile 是否已含同等升级（比对 `git show c1f89ace` 中升级的具体依赖版本在 upstream lockfile 中的版本是否 ≥）。若 upstream 版本更低/缺失 → 在合并结果 lockfile 中手动补回该修复（重新 `npm install <pkg>@<safe>`），并记录到决策日志。

- [ ] **Step 3: web/shared/hooks/workflows 解决**

逐文件三方对比后手工合并（web 组件取 upstream 新结构 + 本地改动重放；`schema-constants.ts` 取 upstream——与 Task 4 的 schema 决策一致；workflows 以 upstream 为准，本地改动若被覆盖则核对 .claude 文档同步）；删标记，`git add`。

- [ ] **Step 4: 验证全部冲突标记清零**

Run: `git diff --name-only --diff-filter=U | wc -l`
Expected: `0`（**这是 merge 冲突解决完成的唯一判定**）

## Task 7: 文档 / skills 组（6 个）冲突解决

**Files:** `AGENTS.md`、`CLAUDE.md`、`CHANGELOG.md`、`README.md`、`.claude/skills/gitnexus/gitnexus-guide/SKILL.md`、`.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md`

策略：**逐段合并**——本地定制说明（embedding/Ollama 配置、doctor 输出、i18n、本地工作流章节）保留，upstream 更新（新功能文档）合入。这四个文档两边都做了大量增补，禁止整文件覆盖任何一边。

- [ ] **Step 1: 逐文件手工合并**

三方对比（`:1:` `:2:` `:3:`）→ 逐段合并 → 删标记 → `git add`

- [ ] **Step 2: 验证本地定制章节不丢**

```bash
grep -c "Ollama\|embedding" CLAUDE.md AGENTS.md | head -4
grep -c "i18n\|中文\|zh-CN" README.md
```
Expected: 输出非零（本地定制章节仍在）。具体关键词以合并前 `git show :2:` 版本为准核对。

## Task 8: export 一致性检查 + 构建

**Files:** 无（检查与构建）

- [ ] **Step 1: 复用扫描器检查 import/export 自洽**

```bash
cd /opt/claude/GitNexus/gitnexus
node /tmp/opencode/check-exports.mjs 2>&1 | tail -5
```
Expected: fork 特有缺失 = 0（与 upstream 同口径的假阳性可忽略；07-29 那种"本地引用上游新增导出"的回归必须为 0）

- [ ] **Step 2: 构建**

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build > /tmp/opencode/resync/build.log 2>&1; echo "EXIT=$?"
grep -c "error TS" /tmp/opencode/resync/build.log
```
Expected: `EXIT=0` 且 `0`（**严格 0 类型错误**，这是验收硬门槛；不满足不得进入下一任务，回头修冲突解决引入的问题）

- [ ] **Step 3: 若有错误，修复并回到对应任务**

说明：类型错误通常来自"按功能合并"时遗漏的引用（如 schema 旧字段、i18n key）。用 `grep -B2 "error TS" build.log` 定位 → 修 → 重跑 Step 2。修到 0 为止。

## Task 9: npm ci 可安装验证

**Files:** 无（安装验证）

- [ ] **Step 1: 干净安装**

```bash
cd /opt/claude/GitNexus/gitnexus
rm -rf node_modules && npm ci > /tmp/opencode/resync/npm-ci.log 2>&1; echo "EXIT=$?"
tail -3 /tmp/opencode/resync/npm-ci.log
```
Expected: `EXIT=0`（lockfile 与本地 node v24.7.0 平台、原生绑定 tree-sitter 等兼容；若失败记录报错依赖，回 Task 6 修正依赖合并结果）

- [ ] **Step 2: 重新构建以确认原生绑定正常**

```bash
npm run build > /dev/null 2>&1; echo "EXIT=$?"
```
Expected: `EXIT=0`

## Task 10: 全量测试

**Files:** 无（测试）

- [ ] **Step 1: 运行全量测试**

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run --typecheck.disabled > /tmp/opencode/resync/vitest.log 2>&1; echo "EXIT=$?"
grep -E "Test Files|Tests " /tmp/opencode/resync/vitest.log | tail -3
```
Expected: 282 文件全部执行；统计失败数（`grep "Tests.*failed"`）。

- [ ] **Step 2: 甄别失败**

失败分类：
- **merge 引入**（本地定制与 upstream 语义冲突）→ 修复实现（回到 Task 4/5 对应文件）
- **既有 flaky**（在基线 `b4281859` 上同一用例也失败）→ 记录到决策日志，不阻塞
- 参考：基线对拍用**独立 worktree**（merge 进行中不能 stash）：
  `git worktree add /tmp/opencode/resync/base-worktree b4281859`，在其中 `npm ci && npx vitest run <用例>` 对比

Run: 修复后重跑失败的用例文件直到通过或判定 flaky。
Expected: merge 引入的失败 = 0。

## Task 11: web / shared typecheck 与测试

**Files:** 无（验证）

- [ ] **Step 1: gitnexus-shared 类型检查**

```bash
cd /opt/claude/GitNexus/gitnexus-shared && npx tsc --noEmit 2>&1 | tail -3
```
Expected: 无错误（`grep -c "error TS"` = 0）

- [ ] **Step 2: gitnexus-web 类型检查**

```bash
cd /opt/claude/GitNexus/gitnexus-web && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo 0
```
Expected: `0`（或仅上游自身既有错误——与 upstream 对拍确认）

- [ ] **Step 3: web 测试**

```bash
cd /opt/claude/GitNexus/gitnexus-web && npm test 2>&1 | tail -5
```
Expected: 通过（或仅上游既有失败，记录到决策日志）

## Task 12: 索引重建（.gitnexus/lbug）

**Files:** 无（数据目录操作）

- [ ] **Step 1: 触发重建**

```bash
cd /opt/claude/GitNexus/gitnexus
npx tsx src/cli/index.ts doctor --reindex 2>&1 | tail -5   # 若 CLI 无 --reindex 参数，用实际重建入口（analyze/rebuild 相关命令）
```
说明：RING4-2 删除 legacy resolution + schema 演进后，旧 `.gitnexus/lbug` 数据不可信。重建命令以合并后 `gitnexus doctor --help` 的实际入口为准；若存在文档化重建流程（如 `gitnexus index rebuild`），用它。

- [ ] **Step 2: 验证索引可查询**

Run: 任一 MCP/CLI 查询路径（如 `list_repos` 或 `gitnexus status`）能返回 16 个仓库的完整结果。
Expected: 仓库全量、无 schema 错误。

## Task 13: MCP 冒烟 + 定制抽验 + upstream 新功能核对

**Files:** 无（验证）

- [ ] **Step 1: MCP 冒烟**

```bash
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}\n' | timeout 25 gitnexus mcp 2>/dev/null | head -c 200
printf '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}\n{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}\n' | timeout 25 gitnexus mcp 2>/dev/null | grep -o '"tools":\[[^]]*\]' | grep -o '"name"' | wc -l
```
Expected: initialize 返回 `serverInfo: gitnexus`；tools 数 ≥14（upstream 2 个月可能新增工具，只多不少）

- [ ] **Step 2: 本地定制抽验（清单来自 spec 验收 7）**

```bash
# P0/P1/P2 响应增强：调用带 freshness 的 list_repos（stale metadata 字段存在）
# 文件分类覆盖：触发一次带分类的 analyze 或用 file-classifier 单测路径验证
# incremental analyze：跑一次 incremental analyze（或用其测试验证）
```
Expected: 各定制特征存在且行为符合本地原版本（对照 `/tmp/opencode/resync/*.snap` 中记录的定制行为描述）

- [ ] **Step 3: upstream 新功能未丢失抽验（清单来自 spec 验收 8）**

```bash
grep -c "getCoreExcludesFilePath\|getGitInfoExcludePath" gitnexus/src/storage/git.ts gitnexus/src/config/ignore-service.ts
grep -c "branch\|branches" gitnexus/src/mcp/local/local-backend.ts  # #2106/#2354
grep -c "LIST_REPOS\|PDG_QUERY\|IMPACT_MAX" gitnexus/src/mcp/tools.ts  # 分页常量
```
Expected: 全部非零（upstream 新功能存在）；另按合并前预审的 #1749/#2106/#2192/#2548/#2558/#2566/#2606/#2640 行为变化清单逐项核对（记录核对结果到决策日志）。

## Task 14: 提交 + merge 决策日志

**Files:**
- 创建: `docs/superpowers/plans/2026-08-01-gitnexus-upstream-resync-merge-log.md`

- [ ] **Step 1: 写 merge 决策日志**

对 61 个冲突面文件的每一个，记录：决策（取 upstream / 取本地 / 手动合并）+ 一句话理由。模板：

```markdown
# GitNexus Upstream Resync Merge Decision Log (2026-08-01)

| 文件 | 决策 | 理由 |
|---|---|---|
| gitnexus/src/storage/git.ts | 手动合并（upstream 基底+本地小修） | upstream 672 行含 excludesFile(#2606)；本地 4f3e2498 容错叠加 |
| ... | | |
```

- [ ] **Step 2: 按 AGENTS.md 要求跑 detect_changes**

Run: `cd /opt/claude/GitNexus && gitnexus detect_changes`（或以仓库 AGENTS.md 实际约定的命令为准）
Expected: 输出合并引入的变更清单，供 commit message 引用。

- [ ] **Step 3: 提交 merge 结果（含决策日志）**

```bash
cd /opt/claude/GitNexus
git add -A
git add -f docs/superpowers/plans/2026-08-01-gitnexus-upstream-resync-merge-log.md
git commit -m "chore: merge upstream main (planned resync 2026-08-01, 527 commits)

- 本地 91 提交定制全部保留（P0/P1/P2、file-classifier、incremental analyze、i18n、docs/skills）
- 冲突解决：61 文件，决策见 docs/superpowers/plans/2026-08-01-gitnexus-upstream-resync-merge-log.md
- 验证：build 0 错 / vitest 全量 / npm ci / web+shared typecheck / MCP 冒烟 / 索引重建 / 定制+新功能抽验
- 基线 b4281859，merge-base bd59fa95"
```
Expected: merge commit 创建成功（若 pre-commit hook 拦截，按输出修后再提交）

- [ ] **Step 4: 最终回归确认**

```bash
git log --oneline -3
git status --short
cd /opt/claude/GitNexus/gitnexus && npm run build > /dev/null 2>&1; echo "BUILD=$?"
```
Expected: 提交链 `merge commit → 0711864d → 598f2a45 → b4281859`；工作区干净（除 `.codewhale/`）；`BUILD=0`。

## Self-Review 对照

- spec「方案 merge」→ Task 2（✓）
- spec「防翻车 2 fsck」→ Task 1（✓）
- spec「防翻车 3 清单+快照」→ 前置产物已建，Task 3/4 引用（✓）
- spec「防翻车 4 export 检查」→ Task 8 Step 1（✓）
- spec「防翻车 5 事故文件核对」→ Task 4 Step 3（✓）
- spec「防翻车 6 禁止整文件覆盖」→ Task 3-7 原则（✓）
- spec「防翻车 7 行为变化清单」→ Task 13 Step 3（✓）
- spec「依赖安全修复核对」→ Task 6 Step 2（✓）
- spec「验收 1 build 0 错」→ Task 8（✓）
- spec「验收 2 vitest 全量」→ Task 10（✓）
- spec「验收 3 npm ci」→ Task 9（✓）
- spec「验收 4 web/shared typecheck」→ Task 11（✓）
- spec「验收 5 索引重建」→ Task 12（✓）
- spec「验收 6 MCP 冒烟」→ Task 13 Step 1（✓）
- spec「验收 7 本地定制抽验」→ Task 13 Step 2（✓）
- spec「验收 8 upstream 新功能抽验」→ Task 13 Step 3（✓）
- spec「提交：决策日志 + detect_changes」→ Task 14（✓）
- 审核建议「91 提交清单/补丁快照」→ 前置产物（✓）
