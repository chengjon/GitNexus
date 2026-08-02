# GitNexus Upstream Resync — Merge Decision Log

> 合并提交：`a39b2bd1` (Merge upstream/main into main, upstream `84f58444`)
> 日期：2026-08-01
> 基线：`b4281859` | Merge-base：`bd59fa95` | 上游领先：554 commits
> 实际冲突：41 文件（预期 ≤61；20 文件自动合并；4 add/add skills 文件）
> 收尾修复：`1768f954` (post-merge verification fixes) + `20380543` (fast-path guard + tool contracts)

## 决策分类

| 标记 | 含义 |
|------|------|
| upstream | 取 upstream 版本（本地未改或上游更好） |
| local | 取本地版本（上游未改此文件） |
| merge | 手动合并（两方都有重要改动，按功能合并） |
| theirs | 取 upstream 版本（测试决策：以上游新测试为主） |

## 核心源码

| 文件 | 决策 | 理由 |
|------|------|------|
| `gitnexus/src/cli/ai-context.ts` | merge | upstream 新增行为 + 本地 P0/P1/P2 定制（i18n、输出格式）叠加 |
| `gitnexus/src/cli/analyze.ts` | merge | upstream 新增 analyze 选项 + 本地增量 analyze 定制叠加 |
| `gitnexus/src/cli/detect-changes-format.ts` | merge | upstream 新增 diff 格式 + 本地定制保留 |
| `gitnexus/src/cli/doctor.ts` | merge | upstream 新增 doctor 检查 + 本地 i18n 输出定制；注意：upstream 采用了 TS1308/TS1184 语法，本地已适配 |
| `gitnexus/src/cli/help-i18n.ts` | merge | 修复缺陷：upstream 与本地均有重复 key 定义，冲突解决时去重 |
| `gitnexus/src/cli/index.ts` | merge | upstream 新增 CLI 入口 + 本地工具注册保留 |
| `gitnexus/src/cli/optional-grammars.ts` | merge | upstream 新增 grammar 管理 + 本地定制保留 |
| `gitnexus/src/cli/status.ts` | merge | upstream 新增 status 输出 + 本地扩展信息保留 |
| `gitnexus/src/cli/tool.ts` | merge | upstream 新增 tool 子命令 + 本地定制保留 |
| `gitnexus/src/cli/i18n/en.ts` | merge | 本地深度定制 i18n（P2 feat 4ad039c6），以本地为基底补 upstream 新 key |
| `gitnexus/src/cli/i18n/zh-CN.ts` | merge | 同上，本地深度定制，以本地为基底补 upstream 新 key |
| `gitnexus/src/core/embeddings/config.ts` | merge | upstream 新增配置路径 + 本地 Ollama/embedding 配置保留 |
| `gitnexus/src/core/ingestion/pipeline.ts` | merge | upstream 新增 pipeline 阶段 + 本地 style-imports 阶段保留 |
| `gitnexus/src/core/run-analyze.ts` | merge | **本地深度定制**（incremental analyze、graph store 缺失守卫）。upstream 新增 analyze 流程合入，本地守卫保留（run-analyze.ts:1079）。注意：收尾修复 20380543 适配测试模拟空 lbug 文件绕过守卫 |
| `gitnexus/src/mcp/local/local-backend.ts` | merge | **本地深度定制**（P0/P1/P2 MCP 响应增强、stale metadata、file-classifier 挂钩）。upstream 新功能（#2106 branch 字段、#2119 分页、#2354 pinned branches）合入。收尾修复 1768f954：恢复 `repoResolutionOptions` 第三参（cwd 转发）；20380543：恢复 `formatCypherAsMarkdown` pass-through + `shapeCheck` method 字段 |
| `gitnexus/src/mcp/tools.ts` | merge | 本地 P0/P1/P2 深度定制（MCP 工具注册、分页参数）。修复：`REPO_SCOPED_TOOLS` 重命名（#2717） |
| `gitnexus/src/storage/git.ts` | merge | **关键事故文件**。取 upstream 672 行完整版（含 `getCoreExcludesFilePath`/`getGitInfoExcludePath`/excludesFile #2606），本地小修（`execFileSync -C` CodeQL 路径修复 0d142e82）叠加。禁止用本地 450 行旧版覆盖 |
| `gitnexus/src/storage/repo-manager.ts` | merge | upstream 新增 repo 管理功能 + 本地 `BranchSummary` 相关改动保留 |

## 类型/共享

| 文件 | 决策 | 理由 |
|------|------|------|
| `gitnexus-shared/src/graph/types.ts` | merge | upstream 新增关系类型 + 本地 `STYLE_IMPORTS` 补回（收尾修复 1768f954） |
| `gitnexus-shared/src/lbug/schema-constants.ts` | merge | upstream 演进 schema + 本地 `STYLE_IMPORTS` 补回（收尾修复 1768f954） |
| `tsconfig.json` | upstream | 取 upstream 版（`stripInternal` 已添加，Task 6 验证） |

## 测试文件

| 文件 | 决策 | 理由 |
|------|------|------|
| `gitnexus/test/unit/tools.test.ts` | theirs | 以上游为主，本地用例合并。收尾修复 1768f954：overview 排除 branch 参数断言 |
| `gitnexus/test/unit/run-analyze.test.ts` | theirs | 以上游为主。收尾修复 20380543：4 处模拟空 lbug 文件绕过本地 fork guard |
| `gitnexus/test/unit/incremental-orchestration.test.ts` | theirs | 直接取 upstream 版（本地 285 行 vs upstream 1139 行，审核确认取 upstream） |
| `gitnexus/test/unit/calltool-dispatch.test.ts` | theirs | 以上游为主。收尾修复 20380543：`formatCypherAsMarkdown` 空结果断言更新 |
| `gitnexus/test/unit/http-embedder.test.ts` | theirs | 以上游为主。收尾修复 1768f954：`GITNEXUS_HOME` per-test 隔离 |
| `gitnexus/test/unit/cli-index-help.test.ts` | theirs | 以上游为主。收尾修复 1768f954：移除冗余空行 |
| `gitnexus/test/integration/skills-e2e.test.ts` | theirs | 以上游为主 |
| `gitnexus/test/unit/ai-context.test.ts` | theirs | 以上游为主。收尾修复 1768f954：skill 安装路径扁平化适配（#2434） |
| `gitnexus/test/unit/analyze-heap-respawn.test.ts` | theirs | 以上游为主。收尾修复 1768f954：npm install 提示断言更新 |
| `gitnexus/test/unit/config-command.test.ts` | theirs | 以上游为主。收尾修复 1768f954：`getHttpDimensions` 替代 `isHttpMode` |
| `gitnexus/test/unit/detect-changes-worktree.test.ts` | theirs | 以上游为主。收尾修复 1768f954：worktree repo 3-arg resolveRepo |
| `gitnexus/test/unit/embedding-runtime-install.test.ts` | theirs | 以上游为主。收尾修复 1768f954：条件断言更新 |
| `gitnexus/test/unit/pipeline-phase-registry.test.ts` | theirs | 以上游为主。收尾修复 1768f954：styleImports 阶段顺序 |
| `gitnexus/test/unit/run-analyze-adopt-failure.test.ts` | theirs | 以上游为主。收尾修复 20380543：模拟空 lbug 文件 |
| `gitnexus/test/unit/schema.test.ts` | theirs | 以上游为主。收尾修复 1768f954：`EMBEDDING_DIMS` 动态化 |
| `gitnexus/test/unit/skip-git-cli.test.ts` | theirs | 以上游为主。收尾修复 1768f954：npm-install hint 断言更新 |
| `gitnexus/test/unit/cli-index-help.test.ts` | theirs | 以上游为主。收尾修复 1768f954：移除过期 test each 空行 |

## 依赖文件

| 文件 | 决策 | 理由 |
|------|------|------|
| `gitnexus/package.json` | upstream | 以上游为准（dependabot 更新更全） |
| `gitnexus/package-lock.json` | upstream | 以上游为准，后 `npm install` 重新生成（含 `busboy` 等新依赖） |
| `gitnexus-web/package.json` | upstream | 以上游为准 |
| `gitnexus-web/package-lock.json` | upstream | 以上游为准，后 `npm install` 重新生成 |
| `package-lock.json`（根） | upstream | 以上游为准 |
| `eval/uv.lock` | upstream | 以上游为准 |

## 文档 / Skills

| 文件 | 决策 | 理由 |
|------|------|------|
| `AGENTS.md` | merge | 逐段合并：本地定制（embedding/Ollama 配置、doctor 输出、i18n）保留，upstream 更新合入 |
| `CLAUDE.md` | merge | 逐段合并：本地定制保留，upstream 更新合入 |
| `CHANGELOG.md` | merge | 本地变更记录保留，upstream 更新合入 |
| `README.md` | merge | 本地定制（i18n 说明、zh-CN）保留，upstream 更新合入 |
| `.claude/skills/gitnexus-guide/SKILL.md` | merge | upstream 新 skill 内容 + 本地定制保留 |
| `.claude/skills/gitnexus-pr-review/SKILL.md` | merge | upstream 新 skill 内容 + 本地定制保留 |

## Web UI

| 文件 | 决策 | 理由 |
|------|------|------|
| `gitnexus-web/src/components/CodeReferencesPanel.tsx` | upstream | 本地仅 CSS class 排序差异，无功能定制 |
| `gitnexus-web/src/components/ProcessesPanel.tsx` | upstream | 同上 |
| `gitnexus-web/src/components/RightPanel.tsx` | upstream | 同上 |

## 工作流 / Hooks

| 文件 | 决策 | 理由 |
|------|------|------|
| `.github/workflows/ci-quality.yml` | upstream | 以上游结构为准，本地改动核对重放 |
| `.github/workflows/ci-tests.yml` | upstream | 同上 |
| `.github/workflows/docker.yml` | upstream | 同上 |
| `.github/workflows/pr-labeler.yml` | upstream | 同上 |
| `gitnexus/hooks/claude/hook-db-lock-probe.cjs` | merge | 两边版本差异取并集 |
| `gitnexus-claude-plugin/hooks/hook-db-lock-probe.cjs` | merge | 同上 |

## 本地安全修复核对

| 安全修复 | 结果 |
|----------|------|
| `c1f89ace chore: remediate dependency security alerts` | upstream lockfile 版本 ≥ 本地修复版本，无需额外操作 |

## 收尾修复概要

### 1768f954 — post-merge verification fixes (21 files, +177/-105)

类型契约修复：
- `STYLE_IMPORTS` 关系类型补回（merge 保留了 style-imports pipeline 阶段但丢了类型契约）

合并回归恢复（冲突解决采用本地旧版覆盖上游契约）：
- `local-backend.ts` `resolveRepo` 第三参（cwd 转发）
- `git.ts` `execFileSync -C` 形式（CodeQL 路径处理修复）

测试适配：
- mock 缺口补全（`initialiseSearchFTSStemmer`、`getSearchFTSStemmer` 等上游新增导出）
- 环境隔离（`http-embedder` `GITNEXUS_HOME` per-test）
- 过时期望更新（`pipeline-phase-registry`、`schema`、`config-command` 等）

### 20380543 — fast-path guard + tool contracts (4 files, +19/-9)

fast-path 簇根因修复（9 个测试）：
- 本地 fork 守卫 `Existing metadata found, but graph store missing → force rebuild` 拦截了上游测试（saveMeta 不创建实际 lbug 文件）
- 修复：测试在 saveMeta 后创建空 lbug 文件

契约恢复：
- `shapeCheck` 恢复 `method: r.method`
- `formatCypherAsMarkdown` 恢复 upstream raw-array pass-through