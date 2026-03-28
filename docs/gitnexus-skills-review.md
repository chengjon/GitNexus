# GitNexus 技能文件审核报告

**审核日期**: 2026-03-26
**审核范围**: `.claude/skills/gitnexus/` 下的 7 个技能文件
**目的**: 识别技能文件与当前代码功能的差异，提出修改建议

---

## 审核摘要

| 技能文件 | 状态 | 优先级 |
|----------|------|--------|
| `gitnexus-cli/SKILL.md` | ⚠️ 需更新 | 中 |
| `gitnexus-guide/SKILL.md` | ⚠️ 需更新 | 中 |
| `gitnexus-exploring/SKILL.md` | ✅ 基本正确 | 低 |
| `gitnexus-impact-analysis/SKILL.md` | ⚠️ 需更新 | 高 |
| `gitnexus-debugging/SKILL.md` | ✅ 基本正确 | 低 |
| `gitnexus-refactoring/SKILL.md` | ⚠️ 需更新 | 高 |
| `gitnexus-pr-review/SKILL.md` | ⚠️ 需更新 | 高 |

---

## 详细审核

### 1. gitnexus-cli/SKILL.md

**当前状态**: ⚠️ 需更新

**缺失内容**:

1. **Ollama 嵌入支持** - 文档中提到了 Hugging Face，但 Ollama 已成为推荐的嵌入提供商
2. **嵌入配置 CLI** - 新增的 `gitnexus config embeddings` 命令未记录
3. **自动停止 MCP 进程** - `analyze` 现在会自动停止占用 `.gitnexus/kuzu` 的本地 MCP 进程

**建议修改**:

```markdown
### analyze — Build or refresh the index

# 新增说明：
- 自动停止占用 `.gitnexus/kuzu` 的本地 `gitnexus mcp` 进程
- 推荐使用 Ollama 作为嵌入提供商

# 新增命令：
### config — 嵌入配置管理

gitnexus config embeddings show   # 显示当前嵌入配置
gitnexus config embeddings set    # 设置嵌入配置
gitnexus config embeddings clear  # 清除嵌入配置

示例：
gitnexus config embeddings set --provider ollama --ollama-base-url http://localhost:11434 --ollama-model qwen3-embedding:0.6b --node-limit 90000 --batch-size 64
```

---

### 2. gitnexus-guide/SKILL.md

**当前状态**: ⚠️ 需更新

**缺失内容**:

1. **工具别名** - 新增了 `search` → `query` 和 `explore` → `context` 别名
2. **Graph Schema 更新** - 新增了 `HAS_METHOD`, `OVERRIDES` 边类型

**建议修改**:

```markdown
## Tools Reference

| Tool             | What it gives you                                                        |
| ---------------- | ------------------------------------------------------------------------ |
| `query`          | Process-grouped code intelligence — execution flows related to a concept |
| `context`        | 360-degree symbol view — categorized refs, processes it participates in  |
| `impact`         | Symbol blast radius — what breaks at depth 1/2/3 with confidence         |
| `detect_changes` | Git-diff impact — what do your current changes affect                    |
| `rename`         | Multi-file coordinated rename with confidence-tagged edits               |
| `cypher`         | Raw graph queries (read `gitnexus://repo/{name}/schema` first)           |
| `list_repos`     | Discover indexed repos                                                   |

> **别名**: `search` → `query`, `explore` → `context`

## Graph Schema

**Nodes:** File, Function, Class, Interface, Method, Community, Process
**Edges (via CodeRelation.type):** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS, HAS_METHOD, OVERRIDES
```

---

### 3. gitnexus-exploring/SKILL.md

**当前状态**: ✅ 基本正确

**小改进建议**:

可以添加工具别名说明：

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

**建议修改**:

```markdown
## Tools

**gitnexus_detect_changes** — git-diff based impact analysis:

```
gitnexus_detect_changes({
  scope: "staged",  // unstaged | staged | all | compare
  cwd: "/path/to/worktree"  // 可选：指定 git 操作的工作目录
})

→ Changed: 5 symbols in 3 files
→ Affected: LoginFlow, TokenRefresh, APIMiddlewarePipeline
→ Risk: MEDIUM

# 新增元数据字段：
→ git_repo_path: /path/to/registry/repo
→ git_diff_path: /path/to/actual/worktree
→ process_cwd: /current/working/dir
→ path_resolution: cwd_worktree | registry_repo
```

> **Worktree 场景**: 当在 git worktree 中工作时，传入 `cwd` 参数确保分析正确的目录。如果不传，工具会尝试自动检测。

## Checklist 更新

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

**小改进建议**:

添加 `detect_changes` 在回归调试中的应用：

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
2. **`rename` 工具的置信度分类更新** - 从 `ast_search` 改为更精确的分类

**建议修改**:

```markdown
### Rename Symbol

```
- [ ] gitnexus_rename({symbol_name: "oldName", new_name: "newName", dry_run: true}) — preview all edits
- [ ] Review graph edits (high confidence) and text_search edits (review carefully)
- [ ] 注意：同一文件中的广泛匹配现在会被降级为较低置信度
- [ ] If satisfied: gitnexus_rename({..., dry_run: false}) — apply edits
- [ ] gitnexus_detect_changes({cwd: "/path/to/worktree"}) — verify only expected files changed
- [ ] Run tests for affected processes
```

## Risk Rules 更新

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

**建议修改**:

```markdown
## Workflow 更新

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

## Review Dimensions 更新

| Dimension | How GitNexus Helps |
| --- | --- |
| **Correctness** | `context` shows callers — are they all compatible with the change? |
| **Blast radius** | `impact` shows d=1/d=2/d=3 dependents — anything missed? |
| **Completeness** | `detect_changes` shows all affected flows — are they all handled? |
| **Test coverage** | `impact({includeTests: true})` shows which tests touch changed code |
| **Breaking changes** | d=1 upstream items that aren't updated in the PR = potential breakage |
| **Path verification** | `detect_changes` 输出中的 `git_diff_path` 和 `path_resolution` 确认分析路径正确 |

## Checklist 更新

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

## 新增功能需补充到技能文件

### 1. 工具别名（所有技能文件）

在 `gitnexus-guide/SKILL.md` 中记录，其他文件可引用：

```
search  → query
explore → context
```

### 2. Worktree 支持（impact-analysis, refactoring, pr-review）

```
detect_changes({
  scope: "staged",
  cwd: "/path/to/worktree"  // 可选
})

输出新增字段：
- git_repo_path
- git_diff_path
- process_cwd
- path_resolution (cwd_worktree | registry_repo)
```

### 3. Graph Schema 更新（guide）

新增边类型：
- `HAS_METHOD` - 类与方法的关联
- `OVERRIDES` - 方法重写关系

### 4. CLI 增强（cli）

```bash
# 嵌入配置
gitnexus config embeddings show
gitnexus config embeddings set --provider ollama ...
gitnexus config embeddings clear

# 自动停止 MCP 进程
gitnexus analyze  # 自动停止占用 .gitnexus/kuzu 的进程
```

---

## 实施建议

### 第一阶段（高优先级）

1. 更新 `gitnexus-impact-analysis/SKILL.md` - 添加 `cwd` 参数和输出元数据
2. 更新 `gitnexus-refactoring/SKILL.md` - 添加 worktree 支持说明
3. 更新 `gitnexus-pr-review/SKILL.md` - 添加路径验证步骤

### 第二阶段（中优先级）

4. 更新 `gitnexus-cli/SKILL.md` - 添加 Ollama 和 config 命令
5. 更新 `gitnexus-guide/SKILL.md` - 添加工具别名和 Schema 更新

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

---

*审核完成时间: 2026-03-26*
