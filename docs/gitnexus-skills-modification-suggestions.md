# GitNexus 技能文件修改建议报告

**生成日期**: 2026-03-26  
**基于审核报告**: `docs/gitnexus-skills-review.md`  
**目的**: 基于代码库最新变更，优化审核报告中的修改建议

---

## 执行摘要

本次修改建议基于对 `docs/gitnexus-skills-review.md` 审核报告的复核，结合项目 README.md 中记录的最新功能更新，对原审核报告中的建议进行补充和修正。

### 主要变更点

| 类别 | 新增内容 | 影响的技能文件 |
|------|----------|----------------|
| CLI 命令 | `init-project`, `refresh-context`, `doctor` | gitnexus-cli |
| 工具参数 | `detect_changes` 新增 `cwd` 参数 | 多个文件 |
| 嵌入配置 | Ollama + config.json 支持 | gitnexus-cli |
| 工具别名 | `search`→`query`, `explore`→`context` | gitnexus-guide |
| Graph Schema | `HAS_METHOD`, `OVERRIDES` 边类型 | gitnexus-guide |

---

## 详细修改建议

### 1. gitnexus-cli/SKILL.md

**当前状态**: ⚠️ 需更新

**缺失内容**:

1. **新 CLI 命令** - 需要记录以下新增命令:
   - `gitnexus init-project` - 仅初始化项目本地文件（.gitignore, AGENTS.md, CLAUDE.md, 技能文件）
   - `gitnexus refresh-context` - 仅重新生成 AGENTS.md 和 CLAUDE.md
   - `gitnexus doctor --host <name>` - 检查主机 MCP 准备状态

2. **Ollama 嵌入支持** - 文档中只提到 Hugging Face，需要补充 Ollama 作为推荐提供商

3. **嵌入配置 CLI** - 需要记录:
   - `gitnexus config embeddings show` - 显示当前嵌入配置
   - `gitnexus config embeddings set` - 设置嵌入配置（可传入参数）
   - `gitnexus config embeddings clear` - 清除嵌入配置

4. **自动停止 MCP 进程** - `gitnexus analyze` 现在会自动停止占用 `.gitnexus/kuzu` 的本地 `gitnexus mcp` 进程

**建议修改内容**:

```markdown
### CLI Commands — 完整列表

# 项目初始化
gitnexus init-project [path]      # 初始化 .gitignore, AGENTS.md/CLAUDE.md, repo skills
gitnexus refresh-context [path]   # 仅重新生成 AGENTS.md/CLAUDE.md 和 repo skills

# 索引和分析
gitnexus analyze [path]           # 索引仓库（默认：注册 + gitignore + context 刷新）
gitnexus analyze --force          # 强制全量重索引
gitnexus analyze --skills         # 从检测到的社区生成 repo-specific 技能文件
gitnexus analyze --no-context    # 仅索引，跳过 AGENTS.md/CLAUDE.md 刷新
gitnexus analyze --no-gitignore  # 仅索引，跳过 .gitignore 更新
gitnexus analyze --no-register   # 仅索引，跳过全局注册更新
gitnexus analyze --embeddings    # 启用嵌入生成（语义搜索需要）
gitnexus analyze --verbose       # 跳过文件时输出日志

# 诊断和健康检查
gitnexus doctor                   # 本地仓库状态检查
gitnexus doctor --host <name>     # 检查指定主机的 MCP 准备状态

# 嵌入配置
gitnexus config embeddings show   # 显示当前嵌入配置（环境变量 + config.json）
gitnexus config embeddings set    # 持久化嵌入配置到 ~/.gitnexus/config.json
gitnexus config embeddings clear  # 清除 ~/.gitnexus/config.json 中的嵌入设置

# MCP 服务
gitnexus mcp                      # 启动 MCP 服务器（stdio）
gitnexus serve                    # 启动本地 HTTP 服务器（端口 4747，用于 Web UI 连接，支持多仓库浏览）

# 其他
gitnexus list                     # 列出所有已索引的仓库
gitnexus status                   # 显示当前仓库的索引状态
gitnexus clean                    # 删除当前仓库的索引
gitnexus clean --all --force      # 删除所有索引
gitnexus wiki [path]              # 从知识图谱生成仓库 wiki
```

```markdown
### Embeddings 配置

# 推荐：使用 Ollama（本地 GPU）
gitnexus config embeddings set \
  --provider ollama \
  --ollama-base-url http://localhost:11434 \
  --ollama-model qwen3-embedding:0.6b \
  --node-limit 90000 \
  --batch-size 64

# 或者使用 Hugging Face
gitnexus analyze --embeddings

# 配置优先级：环境变量 > ~/.gitnexus/config.json > 内置默认值
```

```markdown
### 自动行为

- `gitnexus analyze` 自动停止占用目标仓库 `.gitnexus/kuzu` 文件的本地 `gitnexus mcp` 进程
- 避免多 CLI/编辑器会话导致的 KuzuDB 锁冲突
```

---

### 2. gitnexus-guide/SKILL.md

**当前状态**: ⚠️ 需更新

**缺失内容**:

1. **工具别名** - 需要记录:
   - `search` → `query`
   - `explore` → `context`

2. **Graph Schema 更新** - 新增边类型:
   - `HAS_METHOD` - 类与方法的关联
   - `OVERRIDES` - 方法重写关系（MRO 解析）

3. **新增 CLI 命令** - 需要补充到工具参考

4. **MCP 提示符** - 需要记录两个 MCP 提示符:
   - `detect_impact` - 预提交变更分析
   - `generate_map` - 从知识图谱生成架构文档（含 mermaid 图表）

5. **资源路径格式** - 需要补充资源路径示例

**建议修改内容**:

```markdown
## Tools Reference

| Tool               | What it gives you                                                        | Alias |
| ------------------ | ------------------------------------------------------------------------ | ----- |
| `query`            | Process-grouped code intelligence — execution flows related to a concept | search |
| `context`          | 360-degree symbol view — categorized refs, processes it participates in | explore |
| `impact`           | Symbol blast radius — what breaks at depth 1/2/3 with confidence        | —     |
| `detect_changes`  | Git-diff impact — what do your current changes affect                   | —     |
| `rename`           | Multi-file coordinated rename with confidence-tagged edits              | —     |
| `cypher`           | Raw graph queries (read `gitnexus://repo/{name}/schema` first)          | —     |
| `list_repos`       | Discover indexed repos                                                   | —     |

> **注意**: `search` 是 `query` 的别名，`explore` 是 `context` 的别名。
```

```markdown
## MCP Prompts

| Prompt           | What it Does                                                          |
| ---------------- | --------------------------------------------------------------------- |
| `detect_impact` | 预提交变更分析 — 范围、受影响的进程、风险级别                          |
| `generate_map`  | 从知识图谱生成架构文档 — 包含 mermaid 图表                              |

## Usage in Claude Code

When Claude Code has GitNexus MCP configured, you can invoke these prompts directly:

```
@gitnexus detect_impact
@gitnexus generate_map
```
```

```markdown
## Graph Schema

**Nodes:** File, Folder, Function, Class, Interface, Method, Constructor, Property, CodeElement, Community, Process

**Edges (via CodeRelation.type):**
- CALLS - 函数/方法调用关系
- IMPORTS - 模块导入关系
- EXTENDS - 类/接口继承关系
- IMPLEMENTS - 接口实现关系
- DEFINES - 定义关系
- MEMBER_OF - 社区成员关系
- STEP_IN_PROCESS - 执行流步骤关系
- HAS_METHOD - 类与方法的关联（新增）
- OVERRIDES - 方法重写关系（新增）

> 使用前先读取 `gitnexus://repo/{name}/schema` 获取完整 schema 定义。
```

---

### 3. gitnexus-exploring/SKILL.md

**当前状态**: ✅ 基本正确

**建议改进**: 添加工具别名说明，使文档更完整。

**建议修改内容**:

```markdown
## Tools

> **注意**: `gitnexus_query` 也可以通过别名 `search` 调用，`gitnexus_context` 也可以通过别名 `explore` 调用。
```

---

### 4. gitnexus-impact-analysis/SKILL.md

**当前状态**: ⚠️ 需更新（高优先级）

**缺失内容**:

1. **`detect_changes` 的 `cwd` 参数** - 支持 worktree 场景
2. **`detect_changes` 输出元数据增强** - 新增字段说明
3. **`detect_changes` 的 `base_ref` 参数** - 用于比较分支

**建议修改内容**:

```markdown
## Tools

**gitnexus_detect_changes** — git-diff based impact analysis:

```typescript
gitnexus_detect_changes({
  scope: "staged",       // unstaged | staged | all | compare
  base_ref: "main",     // 可选：比较分支（当 scope="compare" 时必需）
  cwd: "/path/to/worktree"  // 可选：指定 git 操作的工作目录（worktree 场景）
})

→ Changed: 5 symbols in 3 files
→ Affected: LoginFlow, TokenRefresh, APIMiddlewarePipeline
→ Risk: MEDIUM

# 输出元数据：
→ git_repo_path: /path/to/registry/repo
→ git_diff_path: /path/to/actual/worktree
→ process_cwd: /current/working/dir
→ path_resolution: cwd_worktree | registry_repo
```

> **Worktree 场景**: 当在 git worktree 中工作时，传入 `cwd` 参数确保分析正确的目录。如果不传，工具会尝试自动检测。检查输出中的 `path_resolution` 确认使用了正确的路径。
```

```markdown
## Checklist

```
- [ ] gitnexus_impact({target, direction: "upstream"}) to find dependents
- [ ] Review d=1 items first (these WILL BREAK)
- [ ] Check high-confidence (>0.8) dependencies
- [ ] READ processes to check affected execution flows
- [ ] gitnexus_detect_changes() for pre-commit check
- [ ] 如果在 worktree 中工作，显式传入 `cwd` 参数
- [ ] 检查输出中的 `path_resolution` 确认使用了正确的路径
- [ ] Assess risk level and report to user
```
```

---

### 5. gitnexus-debugging/SKILL.md

**当前状态**: ✅ 基本正确

**建议改进**: 添加 `detect_changes` 在回归调试中的应用。

**建议修改内容**:

```markdown
## Debugging Patterns

| Symptom              | GitNexus Approach                                          |
| -------------------- | ---------------------------------------------------------- |
| Error message        | `gitnexus_query` for error text → `context` on throw sites |
| Wrong return value   | `context` on the function → trace callees for data flow    |
| Intermittent failure | `context` → look for external calls, async deps            |
| Performance issue    | `context` → find symbols with many callers (hot paths)     |
| Recent regression    | `detect_changes({scope: "compare", base_ref: "main"})` to see what changed |
```

---

### 6. gitnexus-refactoring/SKILL.md

**当前状态**: ⚠️ 需更新（高优先级）

**缺失内容**:

1. **`detect_changes` 的 `cwd` 参数** - worktree 支持
2. **`rename` 工具的置信度分类更新** - 更精确的分类
3. **新增 `init-project` 和 `refresh-context` 命令** - 项目初始化

**建议修改内容**:

```markdown
### Rename Symbol

```typescript
- [ ] gitnexus_rename({symbol_name: "oldName", new_name: "newName", dry_run: true}) — preview all edits
- [ ] Review graph edits (high confidence) and text_search edits (review carefully)
- [ ] 如果在同一文件中有广泛匹配，注意这些会被标记为较低置信度
- [ ] If satisfied: gitnexus_rename({..., dry_run: false}) — apply edits
- [ ] gitnexus_detect_changes({cwd: "/path/to/worktree"}) — verify only expected files changed
- [ ] Run tests for affected processes
```

> **Worktree 注意**: 如果在 git worktree 中执行重命名，传入 `cwd` 参数到 `detect_changes` 以确保验证正确的目录。

## Risk Rules

| Risk Factor         | Mitigation                                |
| ------------------- | ----------------------------------------- |
| Many callers (>5)   | Use gitnexus_rename for automated updates |
| Cross-area refs     | Use detect_changes after to verify scope  |
| String/dynamic refs | gitnexus_query to find them               |
| External/public API | Version and deprecate properly            |
| Worktree usage      | Pass `cwd` explicitly to detect_changes   |
```

---

### 7. gitnexus-pr-review/SKILL.md

**当前状态**: ⚠️ 需更新（高优先级）

**缺失内容**:

1. **`detect_changes` 的 `cwd` 参数** - worktree 支持
2. **输出元数据字段** - 用于确认分析路径
3. **新增 `init-project` 和 `refresh-context` 命令**

**建议修改内容**:

```markdown
## Workflow

```
1. gh pr diff <number>                                    → Get the raw diff
2. gitnexus_detect_changes({
     scope: "compare",
     base_ref: "main",
     cwd: "/path/to/worktree"  // 如果在 worktree 中
   })                                                      → Map diff to affected flows
3. 检查输出中的 `path_resolution` 确认使用了正确的路径
4. For each changed symbol:
   gitnexus_impact({target: "<symbol>", direction: "upstream"})
5. gitnexus_context({name: "<key symbol>"})
6. READ gitnexus://repo/{name}/processes
7. Summarize findings with risk assessment
```

## Review Dimensions

| Dimension | How GitNexus Helps |
| --- | --- |
| **Correctness** | `context` shows callers — are they all compatible with the change? |
| **Blast radius** | `impact` shows d=1/d=2/d=3 dependents — anything missed? |
| **Completeness** | `detect_changes` shows all affected flows — are they all handled? |
| **Test coverage** | `impact({includeTests: true})` shows which tests touch changed code |
| **Breaking changes** | d=1 upstream items that aren't updated in the PR = potential breakage |
| **Path verification** | `detect_changes` 输出中的 `git_diff_path` 和 `path_resolution` 确认分析路径正确 |

## Checklist

```
- [ ] Fetch PR diff (gh pr diff or git diff base...head)
- [ ] gitnexus_detect_changes to map changes to affected execution flows
- [ ] 如果在 worktree 中，传入 `cwd` 参数并检查 `path_resolution`
- [ ] gitnexus_impact on each non-trivial changed symbol
- [ ] Review d=1 items (WILL BREAK) — are callers updated?
- [ ] gitnexus_context on key changed symbols
- [ ] Check if affected processes have test coverage
- [ ] Assess overall risk level
- [ ] Write review summary with findings
```
```

---

## 新增功能补充说明

### 1. 工具别名（所有技能文件）

在 `gitnexus-guide/SKILL.md` 中记录，其他文件可引用：

```
search  → query
explore → context
```

### 2. Worktree 支持（impact-analysis, refactoring, pr-review）

```typescript
detect_changes({
  scope: "staged",
  cwd: "/path/to/worktree"  // 可选
})

// 输出新增字段：
// - git_repo_path
// - git_diff_path
// - process_cwd
// - path_resolution (cwd_worktree | registry_repo)
```

### 3. Graph Schema 更新（guide）

新增边类型：
- `HAS_METHOD` - 类与方法的关联
- `OVERRIDES` - 方法重写关系

### 4. CLI 增强（cli）

```bash
# 项目初始化
gitnexus init-project [path]      # 初始化项目本地文件
gitnexus refresh-context [path]    # 仅重新生成 context 文件

# 诊断
gitnexus doctor                    # 本地仓库状态
gitnexus doctor --host <name>      # 主机 MCP 状态

# 嵌入配置
gitnexus config embeddings show
gitnexus config embeddings set --provider ollama ...
gitnexus config embeddings clear
```

### 5. MCP 提示符

- `detect_impact` - 预提交变更分析
- `generate_map` - 生成架构文档（含 mermaid 图表）

---

## 实施优先级

### 第一阶段（高优先级）

1. 更新 `gitnexus-impact-analysis/SKILL.md` - 添加 `cwd` 参数和输出元数据
2. 更新 `gitnexus-refactoring/SKILL.md` - 添加 worktree 支持说明
3. 更新 `gitnexus-pr-review/SKILL.md` - 添加路径验证步骤

### 第二阶段（中优先级）

4. 更新 `gitnexus-cli/SKILL.md` - 添加新命令、Ollama 和 config 命令
5. 更新 `gitnexus-guide/SKILL.md` - 添加工具别名、Schema 更新、MCP 提示符

### 第三阶段（低优先级）

6. 更新 `gitnexus-exploring/SKILL.md` - 添加别名说明
7. 更新 `gitnexus-debugging/SKILL.md` - 添加回归调试模式

---

## 验证清单

修改完成后，验证以下内容：

- [ ] 所有技能文件的工具参数与代码实现一致
- [ ] 新增的 `cwd` 参数在相关技能文件中记录
- [ ] 输出元数据字段说明完整
- [ ] CLI 命令与 `gitnexus --help` 输出一致
- [ ] Graph Schema 与 `gitnexus://repo/{name}/schema` 一致
- [ ] MCP 提示符记录准确

---

## 参考资料

- 原审核报告: `docs/gitnexus-skills-review.md`
- 项目 README: `README.md`
- GitNexus CLI 帮助: `gitnexus --help`

---

*报告生成时间: 2026-03-26*