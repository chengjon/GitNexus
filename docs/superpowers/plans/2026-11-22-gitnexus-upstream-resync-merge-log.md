# GitNexus Upstream Resync — Merge Decision Log

> 合并提交：`70ce30d2d`（Merge upstream/main into main）
> 日期：2026-11-22
> 上游：`351792323`（docs(wiki): document every gitnexus wiki option (#4025)）
> Merge-base：`4d262dd7d`
> 合并前本地 main：`436ec6f1c`（备份分支 `backup/pre-merge-upstream-2026-11-21`）
> 文本冲突：24 文件；合并结果与双方父提交均不同的文件：61 个
> 规模：5032 文件，+2,537,306 / −1,975,251

## 合并原则

保留本地 fork 的 MCP enrichment / embeddings 定制，采纳 upstream 新架构、新功能与新测试。
冲突一律手工解决，未使用 `git merge --abort`。

## 决策分类

| 标记 | 含义 |
|------|------|
| upstream | 取 upstream 版本（本地未改或上游更完整） |
| local | 取本地版本（上游未改此文件） |
| merge | 手动合并（双方都有重要改动，按功能叠加） |
| theirs | 测试/技能文件以上游为主，本地用例合并或适配 |

## 文档与仓库元数据

| 文件 | 决策 | 理由 |
|------|------|------|
| `README.md` | merge | 保留 fork 的 README 结构，吸收 upstream 版本号、Node 版本要求与 changelog 条目 |
| `AGENTS.md` | merge | 保留 fork 治理结构；吸收 upstream 版本/日期/changelog；`gitnexus:start` 保持 lean `keep` stub，规范正文集中到 `docs/law/gitnexus-agent-rules.md` |
| `CLAUDE.md` | merge | 同上；Claude Code 专属 delta 保留，规范指针与 upstream 对齐 |
| `docs/law/gitnexus-agent-rules.md` | merge | 以 upstream 最新规则块重写，保留本地补充的 MCP/索引说明 |
| `.claude/skills/gitnexus-guide/SKILL.md` | theirs | 取 upstream 超集，本地无额外定制 |
| `.claude/skills/gitnexus-debugging/SKILL.md` | merge | upstream 内容 + 本地调试流程保留 |
| `.gitignore` | merge | 合并双方忽略项，保留本地 `.codewhale/`、`.work/`、`.superpowers/` |
| `package.json`（根 / `gitnexus/` / `gitnexus-web/`） | merge | 以 upstream 依赖为准，保留本地 `brace-expansion` 安全 override；随后 `npm install` 重新生成 lockfile |

## 核心源码

| 文件 | 决策 | 理由 |
|------|------|------|
| `gitnexus/src/mcp/local/local-backend.ts` | merge | **本地深度定制文件**。`renameSymbol`/`plan_token` 取 upstream 完整实现；恢复 `resolveRepo(repo?, branch?, { cwd })` 第三参 cwd 转发；`pickRepoHandleForCwd` 用 `getCanonicalRepoRoot` 归一化 linked worktree；`formatCypherAsMarkdown` 取 upstream 空结果 `{ markdown: '', row_count: 0 }`；`routeMap` 补 `runtimeEvidence`；impact not_found 返回 `impactedCount: null` |
| `gitnexus/src/core/run-analyze.ts` | merge | 采用 upstream 分析流水线与 `alreadyUpToDate` fast-path；保留本地增量分析与 graph store 缺失守卫 |
| `gitnexus/src/core/lbug/schema.ts` | merge | 采用 upstream 生成式关系 schema；直接补齐 `Const`/`Variable`/`Property`/`Static` 相关 FROM/TO 对，绕过 `parseRelationSchemaPairs` 对幻影 structural 对的误判 |
| `gitnexus/src/mcp/tools.ts` | merge | 保留 fork 20 工具目录与 enrichment 参数；工具 schema 预算从 70KB 提升到 80KB |
| `gitnexus/src/cli/doctor.ts` / `doctor-run.ts` | merge | 保留 upstream 控制台 `doctorCommand`；本地结构化 `runDoctor` 移入新文件 `doctor-run.ts` 并由 `doctor.ts` 重导出 |
| `gitnexus/src/core/embeddings/config.ts` | merge | 采用 upstream 配置路径解析；保留本地 Ollama / embedding provider 定制 |
| `gitnexus/src/core/embeddings/http-client.ts` | merge | 采用 upstream HTTP 客户端；存储配置优先读取 provider/dims，避免用户级配置被忽略 |
| `gitnexus/src/core/embeddings/stored-config.ts` | merge | 新 leaf 模块，切断 `schema.ts → config.ts` 的重依赖链，修复 parse-cache classifier |
| `gitnexus/src/storage/git.ts` | merge | 采用 upstream 新实现；保留 fork 严格的 `findGitRootByDotGit` / `isValidDotGitEntry`（要求 `.git/HEAD`） |
| `gitnexus/src/storage/repo-manager.ts` | merge | upstream 仓库管理新功能 + 本地 `hasIndex` 异步契约与 branch 摘要保留 |
| `gitnexus/src/storage/parse-cache.ts` | merge | upstream 解析缓存演进 + 本地增量缓存输入处理 |
| `gitnexus/src/core/ingestion/pipeline.ts` | merge | upstream pipeline 阶段注册 + 本地 `styleImports` 阶段保留 |
| `gitnexus/src/core/ingestion/pipeline-phases/parse-impl.ts` | merge | upstream 解析实现 + 本地 chunk 上限/增量约束 |
| `gitnexus/src/core/ingestion/pipeline-phases/scan.ts` | merge | upstream 扫描逻辑 + 本地忽略规则保留 |
| `gitnexus/src/core/ingestion/scope-resolution/pipeline/run.ts` | merge | 采用 upstream scope-resolution pipeline（RFC #909 Ring 3），本地 hook 适配 |
| `gitnexus/src/cli/ai-context.ts` | merge | upstream 新行为 + 本地 i18n / 输出格式定制 |
| `gitnexus/src/cli/analyze.ts` / `analyze-options.ts` | merge | upstream analyze 选项 + 本地增量 analyze 定制 |
| `gitnexus/src/cli/detect-changes-format.ts` | merge | upstream diff 格式 + 本地输出定制 |
| `gitnexus/src/cli/help-i18n.ts` / `i18n/en.ts` / `i18n/zh-CN.ts` | merge | 本地深度 i18n 为基底，补 upstream 新 key 并去重 |
| `gitnexus/src/cli/index.ts` / `status.ts` / `tool.ts` / `cli-message.ts` | merge | upstream CLI 入口与子命令 + 本地扩展信息保留 |
| `gitnexus/src/core/logger.ts` | merge | upstream 日志接口 + 本地输出适配 |
| `gitnexus-shared/src/graph/types.ts` | merge | upstream 新类型 + 本地 `STYLE_IMPORTS` 等关系类型保留 |

## 测试文件（关键决策）

| 文件 | 决策 | 说明 |
|------|------|------|
| `gitnexus/test/unit/detect-changes-worktree.test.ts` | merge | 合并 fork 与 upstream 两套 worktree 用例，统一 3 参 `resolveRepo` 断言 |
| `gitnexus/test/unit/tools.test.ts` | merge | upstream 基底 + 本地 20 工具 / enrichment 用例 |
| `gitnexus/test/unit/calltool-dispatch.test.ts` | merge | upstream 基底 + 本地 enrichment 用例；`formatCypherAsMarkdown` 空结果 envelope 断言 |
| `gitnexus/test/unit/embedding-sidecar-client.test.ts` | merge | 增加 `GITNEXUS_HOME` 临时目录隔离，避免用户级 ollama/1024d 配置泄漏 |
| `gitnexus/test/unit/parse-cache-input-coverage.test.ts` | merge | 新增 `supported-languages` 基础设施边界、`lru-cache` 包输入与 `requireOptional(moduleName)` 动态边界 allowlist |
| `gitnexus/test/unit/asyncapi-document.test.ts` | merge | `directory-unreadable` 用例在 root（euid 0）下跳过，root 可绕过目录权限 |
| `gitnexus/test/unit/schema.test.ts` | merge | 断言补齐 Const/Variable/Property/Static 关系对 |
| `gitnexus/test/unit/mcp-read-only.test.ts` | merge | 工具数 19 → 20（fork catalog） |
| `gitnexus/test/unit/mcp-tool-arguments.test.ts` | merge | `__unadvertised_tool__` 用例适配 |
| `gitnexus/test/unit/auto-sync.test.ts` | merge | 临时目录基址安全化（避开危险根路径） |
| `gitnexus/test/unit/shipped-skills-sync.test.ts` | merge | skill 副本同步校验适配 |
| `gitnexus/test/integration/local-backend-calltool.test.ts` | merge | calltool 端到端契约 + 本地 enrichment |
| `gitnexus/test/unit/run-analyze-adopt-failure.test.ts` | theirs | 以上游为主；fast-path restamp 用例为已知环境敏感残留 |

## 合并期代码修复

1. `stored-config.ts` leaf 抽取，修复 `schema.ts → config.ts` 依赖分类违规。
2. impact `not_found` 响应补 `impactedCount: null`。
3. `routeMap` 补 `runtimeEvidence` 字段。
4. `resolveRepo` 恢复 cwd 转发；`pickRepoHandleForCwd` 使用 canonical repo root（linked worktree）。
5. `mcp-read-only` 工具计数 19 → 20。
6. `mcp-tool-arguments` 适配 `__unadvertised_tool__`。
7. auto-sync 临时目录基址安全化（`DANGEROUS_ROOTS` 含 `/opt`、`/tmp`、`/root`）。
8. 测试环境隔离：`GITNEXUS_HOME` 临时目录；asyncapi root 跳过；parse-cache allowlist 更新。

## 验证

| 检查 | 结果 |
|------|------|
| `npx tsc --noEmit` | ✅ 0 错误 |
| `npm run test:unit`（全量） | ✅ 28,597 passed；仅 `test/unit/run-analyze-adopt-failure.test.ts` 6 个 fast-path restamp 用例失败 |
| pre-commit（lint-staged + typecheck） | ✅ 通过（`gitnexus` 与 `gitnexus-web`） |
| 冲突标记检查 | ✅ 无残留 `<<<<<<<` / `=======` / `>>>>>>>` |

## 已知残留

- `test/unit/run-analyze-adopt-failure.test.ts` 6 个 fast-path 用例依赖 `alreadyUpToDate` restamp 行为，在本地环境下不稳定；此前的 `1768f9547` 已将其记录为 “run-analyze fast-path cluster”，属既有环境敏感项，非本次合并引入。
- 本次合并后尚未重建 `gitnexus-shared` / `gitnexus` 的 `dist`；使用全局 `gitnexus` CLI 前需先 `npm run build`。

## 后续

- 合并提交 `70ce30d2d` 与本文档提交后推送 `origin/main`。
