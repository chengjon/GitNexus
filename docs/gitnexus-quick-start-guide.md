# GitNexus 快速入门指南

> **面向其他项目的开发者（AI 或人类）** — 3 分钟了解如何在你的项目中使用 GitNexus

---

## GitNexus 是什么？

GitNexus 是一个**图谱驱动的代码智能工具**。它将你的代码库索引为知识图谱，提供：

- **依赖追踪** — 知道谁调用了谁
- **影响分析** — 修改前知道会破坏什么
- **执行流追踪** — 从入口点到调用的完整路径
- **安全重构** — 多文件协同重命名

**核心价值**：AI 编辑代码前，先知道 47 个其他函数依赖它。

---

## 快速开始（3 步）

### 1. 安装与索引

```bash
# 在项目根目录运行（无需全局安装）
npx gitnexus analyze
```

这会：
- 解析所有源文件，构建知识图谱
- 创建 `.gitnexus/` 目录（已加入 .gitignore）
- 生成 `CLAUDE.md` 和 `AGENTS.md` 上下文文件
- 安装项目级技能到 `.claude/skills/gitnexus/`

### 2. 配置 AI 编辑器

**Claude Code（完整支持）**：
```bash
claude mcp add gitnexus -- npx -y gitnexus@latest mcp
```

**Cursor / Windsurf**：
```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

### 3. 验证索引

```bash
# 检查索引状态
npx gitnexus status

# 列出所有已索引的仓库
npx gitnexus list
```

---

## 核心工具速查

| 工具 | 用途 | 示例 |
|------|------|------|
| `query` | 按概念搜索代码 | `query({query: "用户认证"})` |
| `context` | 符号 360° 视图（调用者、被调用者、参与流程） | `context({name: "validateUser"})` |
| `impact` | 修改前的影响半径分析 | `impact({target: "X", direction: "upstream"})` |
| `detect_changes` | 提交前检查变更影响范围 | `detect_changes({scope: "staged"})` |
| `rename` | 安全的多文件重命名 | `rename({symbol_name: "old", new_name: "new"})` |
| `cypher` | 原生图查询 | `cypher({query: "MATCH ..."})` |

---

## 工作流程指南

### 场景 1：理解代码架构

> "这个认证流程是怎么工作的？"

1. 读取 `gitnexus://repo/{name}/context` — 获取代码库概览
2. 使用 `query({query: "认证流程"})` — 查找相关执行流
3. 读取 `gitnexus://repo/{name}/process/{processName}` — 追踪完整流程

📖 **详细指南**：[gitnexus-exploring 技能文档](../.claude/skills/gitnexus/gitnexus-exploring/SKILL.md)

### 场景 2：修改代码前评估风险

> "如果我把这个函数改了，会破坏什么？"

1. **必须先运行** `impact({target: "symbolName", direction: "upstream"})`
2. 查看影响半径：
   - `d=1` — **会破坏**（直接调用者，必须更新）
   - `d=2` — **可能受影响**（间接依赖，应该测试）
   - `d=3` — **可能需要测试**（传递依赖）
3. 如果风险等级是 **HIGH** 或 **CRITICAL**，必须警告用户

📖 **详细指南**：[gitnexus-impact-analysis 技能文档](../.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md)

### 场景 3：调试问题

> "为什么这个错误会发生？"

1. `query({query: "错误症状关键词"})` — 找到相关执行流
2. `context({name: "可疑函数名"})` — 查看所有调用者和被调用者
3. 读取 `gitnexus://repo/{name}/process/{processName}` — 逐步追踪

📖 **详细指南**：[gitnexus-debugging 技能文档](../.claude/skills/gitnexus/gitnexus-debugging/SKILL.md)

### 场景 4：重构代码

> "我想重命名这个函数"

1. **必须使用** `rename({symbol_name: "old", new_name: "new", dry_run: true})`
2. 检查预览 — `graph` 标记的修改是安全的，`text_search` 需要人工确认
3. 确认后运行 `dry_run: false`
4. 提交前运行 `detect_changes({scope: "all"})` 验证

📖 **详细指南**：[gitnexus-refactoring 技能文档](../.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md)

---

## 强制规则（AI Agent 必须遵守）

| 规则 | 原因 |
|------|------|
| **修改任何符号前，必须运行 `impact` 分析** | 防止意外破坏依赖 |
| **提交前必须运行 `detect_changes`** | 确认变更范围符合预期 |
| **重命名必须用 `rename` 工具** | 普通查找替换不理解调用图 |
| **忽略 HIGH/CRITICAL 风险警告必须先通知用户** | 防止灾难性破坏 |

---

## 技能文档索引

根据你的任务，阅读对应的技能文档：

| 任务 | 技能文档 |
|------|----------|
| 理解架构 / "X 是怎么工作的？" | [gitnexus-exploring](../.claude/skills/gitnexus/gitnexus-exploring/SKILL.md) |
| 影响分析 / "改了 X 会破坏什么？" | [gitnexus-impact-analysis](../.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md) |
| 调试问题 / "为什么 X 失败了？" | [gitnexus-debugging](../.claude/skills/gitnexus/gitnexus-debugging/SKILL.md) |
| 重构 / 重命名 / 提取 | [gitnexus-refactoring](../.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md) |
| 工具、资源、Schema 参考 | [gitnexus-guide](../.claude/skills/gitnexus/gitnexus-guide/SKILL.md) |
| CLI 命令（analyze、status、clean、wiki） | [gitnexus-cli](../.claude/skills/gitnexus/gitnexus-cli/SKILL.md) |
| PR 审查 | [gitnexus-pr-review](../.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md) |

---

## CLI 命令速查

```bash
# 索引仓库
npx gitnexus analyze              # 标准索引
npx gitnexus analyze --embeddings # 启用语义搜索（需要嵌入模型）
npx gitnexus analyze --force      # 强制完全重建

# 检查状态
npx gitnexus status               # 当前仓库索引状态
npx gitnexus list                 # 所有已索引仓库

# 清理
npx gitnexus clean                # 删除当前仓库索引
npx gitnexus clean --all --force  # 删除所有索引

# 生成文档
npx gitnexus wiki                 # 从知识图谱生成文档
```

---

## 资源端点

| 资源 | 用途 |
|------|------|
| `gitnexus://repo/{name}/context` | 代码库概览、检查索引新鲜度 |
| `gitnexus://repo/{name}/clusters` | 所有功能区域 |
| `gitnexus://repo/{name}/processes` | 所有执行流程 |
| `gitnexus://repo/{name}/process/{name}` | 逐步执行追踪 |
| `gitnexus://repo/{name}/schema` | 图 Schema（用于 Cypher 查询） |

---

## 保持索引新鲜

代码提交后，索引会过期。重新运行：

```bash
npx gitnexus analyze
```

> **Claude Code 用户**：PostToolUse 钩子会在 `git commit` 和 `git merge` 后自动运行。

---

## 支持的语言

TypeScript, JavaScript, Python, Java, C, C++, C#, Go, Rust, PHP, Kotlin, Swift

---

## 故障排除

| 问题 | 解决方案 |
|------|----------|
| "Not inside a git repository" | 在 git 仓库目录内运行 |
| 索引重建后仍过期 | 重启 AI 编辑器以重新加载 MCP 服务器 |
| 嵌入生成超时 | 配置 `HF_ENDPOINT` 或切换到 Ollama |

---

## 更多信息

- **项目主页**：[gitnexus/README.md](../gitnexus/README.md)
- **Claude Code 集成示例**：[CLAUDE.md](../CLAUDE.md)
- **Agent 协作指南**：[AGENTS.md](../AGENTS.md)

---

*最后更新：2026-03-26*
