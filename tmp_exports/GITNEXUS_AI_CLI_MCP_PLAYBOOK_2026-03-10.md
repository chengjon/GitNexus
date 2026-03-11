# GitNexus 在 AI CLI / MCP 场景中的实战手册

日期：2026-03-10  
适用对象：`Claude Code`、`Codex`、以及任何支持 `stdio MCP` 的 AI CLI  
目标：把 GitNexus 用成“开发辅助基础设施”，而不只是一次性的代码索引工具。

## 1. GitNexus 在 AI CLI 里的定位

GitNexus 的核心价值，不是替代 `rg`、IDE 搜索或测试，而是给 AI CLI 增加一层“代码事实源”：

- 它先把项目索引成知识图谱
- 再通过 MCP 把图谱暴露给 AI CLI
- 让 AI 在改代码前，先看到真实调用链、影响范围、执行流程和功能簇

如果一句话概括：

> GitNexus 不是帮 AI “读文件更快”，而是帮 AI “少瞎改代码”。

## 2. 适合解决什么问题

在其它项目里，GitNexus 最适合辅助以下开发任务：

- 理解陌生项目结构
- 找页面、接口、服务、任务、实时链路之间的真实连接关系
- 改函数前做 blast radius 分析
- 重构、rename、抽模块时降低漏改风险
- 提交前检查当前改动到底影响了哪些 execution flows
- 在多仓库环境里给 AI 提供统一的 repo-level 事实源

它尤其适合：

- 大仓库
- 迁移中的仓库
- 前后端混合仓库
- 目录结构复杂、历史包袱重的仓库
- 你打算交给 AI CLI 做中等以上复杂改动的仓库

## 3. 在新项目中的最小接入步骤

### 3.1 每个项目都要做的事

在目标项目根目录运行：

```bash
npx gitnexus analyze
```

这一步会做几件事：

- 解析代码并生成 AST
- 构建知识图谱，存到项目里的 `.gitnexus/`
- 生成或更新 `AGENTS.md` / `CLAUDE.md`
- 安装 repo 级 GitNexus skills（主要对 Claude Code 更有用）

完成后建议立刻检查：

```bash
npx gitnexus status
```

理想状态是：

- 当前仓库已被索引
- `Status: up-to-date`

### 3.2 什么时候要重新索引

以下情况建议重新运行：

- 第一次接入项目
- 大量文件拆分后
- 目录结构调整后
- 合并大分支后
- MCP 资源提示索引已 stale
- 你感觉 AI 对当前代码关系判断明显落后时

最稳的规则是：

> 开始重要改动前先跑 `npx gitnexus status`；如果不是 `up-to-date`，就先跑 `npx gitnexus analyze`。

## 4. MCP 接入方式

### 4.1 通用原则

GitNexus 的 MCP server 本质上是一个本地 `stdio` server。  
对任何支持 MCP 的 AI CLI，核心接法都一样：

- `command`: `npx`
- `args`: `["-y", "gitnexus@latest", "mcp"]`

如果你已经全局安装过 `gitnexus`，也可以用：

- `command`: `gitnexus`
- `args`: `["mcp"]`

但从可移植性和版本一致性看，更推荐 `npx -y gitnexus@latest mcp`。

### 4.2 Claude Code

手动添加：

```bash
claude mcp add gitnexus -- npx -y gitnexus@latest mcp
```

Claude Code 是 GitNexus 集成最深的一种：

- MCP tools
- repo 级 skills
- `CLAUDE.md` / `AGENTS.md`
- hooks（如果你使用 `gitnexus setup` 和对应环境）

适合场景：

- 日常开发
- 调试
- 重构
- 大仓库导航

### 4.3 Codex

手动添加：

```bash
codex mcp add gitnexus -- npx -y gitnexus@latest mcp
```

校验命令：

```bash
codex mcp list
codex mcp get gitnexus
```

如果你看到类似：

- `transport: stdio`
- `command: npx`
- `args: -y gitnexus@latest mcp`

说明配置基本正确。

如果 `codex mcp list` 里出现 `Auth: Unsupported`，对本地 `stdio` MCP 来说通常是正常的。  
这不表示 GitNexus 不能用，而是说明它不是一个需要登录鉴权的远程 HTTP MCP 服务。

### 4.4 通用 MCP Host

如果你使用的是别的支持 MCP 的 AI CLI，只要它支持本地 `stdio` server，一般都可以用类似配置：

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp"]
    }
  }
}
```

你只需要根据对应 CLI 的配置文件位置或 `mcp add` 命令稍作调整。

### 4.5 `gitnexus setup` 该怎么理解

`gitnexus setup` 更像是“常见客户端自动配置器”，不是所有 AI CLI 都会被它覆盖。

当前更稳的理解方式是：

- `Claude Code / Cursor / OpenCode`：可以优先看官方 README 和 `setup`
- `Codex`：直接手动 `codex mcp add ...`
- 任何通用 MCP Host：直接配 `stdio` command/args

所以在“其它项目里复用 GitNexus”这个场景下，我更建议把 `setup` 当可选项，而不是唯一入口。

## 5. 接入后如何验证它真的可用

推荐按这 4 步验证：

### 5.1 项目内验证索引

```bash
npx gitnexus status
```

### 5.2 验证 MCP 配置

例如在 Codex：

```bash
codex mcp list
codex mcp get gitnexus
```

### 5.3 验证仓库已进入 GitNexus 全局 registry

```bash
npx gitnexus list
```

### 5.4 在 AI CLI 里验证资源或工具

最小验证顺序：

1. `list_repos`
2. 读 `gitnexus://repos`
3. 读 `gitnexus://repo/{name}/context`
4. 再开始 `query` / `context` / `impact`

## 6. 日常开发中的标准工作流

这是最值得在其它项目里推广的一套流程。

### 6.1 开始工作前

先做两件事：

```bash
npx gitnexus status
```

然后在 AI CLI 里：

- 读 `gitnexus://repo/{name}/context`

目的：

- 确认索引新鲜度
- 确认当前 repo 名
- 确认当前可用 tools/resources

### 6.2 理解陌生模块

先用：

- `query`

适合问题：

- “认证链路怎么走？”
- “这个页面到底调了哪些服务？”
- “回测流程入口在哪？”

然后对关键符号继续用：

- `context`

这样比纯 `rg` 更适合回答“结构关系”问题。

### 6.3 改代码前

先用：

- `impact`

适合问题：

- “我改这个 service 会影响哪些上游调用？”
- “改这个函数会不会打到多个 execution flows？”

这是 GitNexus 在 AI 开发辅助里最实用的一环。  
它能显著减少 AI “改了一个点，漏了一片”的情况。

### 6.4 调试问题时

常见顺序：

1. `query("错误症状或业务概念")`
2. `context("嫌疑符号")`
3. 读 `gitnexus://repo/{name}/process/{processName}`

这比直接让 AI 全仓库乱搜更稳，因为它会先落到 execution flows。

### 6.5 重构或 rename 时

先用：

- `context`
- `impact`

如果是 rename：

- `rename`

重构完成后再用：

- `detect_changes`

### 6.6 提交前

建议把 GitNexus 变成一个固定门禁：

- 先跑测试
- 再跑 `detect_changes`

它回答的是：

- 当前 diff 影响了哪些 symbol
- 波及了哪些 execution flows
- 有没有超出你预期的 blast radius

这一步特别适合 AI CLI 自动完成改动后的人类复核。

## 7. GitNexus 工具该怎么分工使用

| 工具 | 最适合的问题 | 不建议拿来替代什么 |
|---|---|---|
| `list_repos` | 我当前有哪些已索引仓库 | 不是项目结构分析工具 |
| `query` | 某个概念/链路在仓库里怎么实现 | 不替代精确文本搜索 |
| `context` | 某个 symbol 的上下游关系是什么 | 不替代完整源码阅读 |
| `impact` | 改这个 symbol 会波及哪里 | 不替代测试 |
| `detect_changes` | 当前 diff 影响了什么 | 不替代 code review |
| `rename` | 安全 rename | 不替代人工确认低置信度匹配 |
| `cypher` | 复杂图查询 | 不适合日常所有问题都用它 |

推荐心法是：

- 精确字符串查找：`rg`
- 架构/关系问题：GitNexus
- 行为正确性：测试

## 8. MCP Resources 怎么用最值钱

最常用的是这些：

- `gitnexus://repos`
- `gitnexus://repo/{name}/context`
- `gitnexus://repo/{name}/clusters`
- `gitnexus://repo/{name}/processes`
- `gitnexus://repo/{name}/process/{name}`
- `gitnexus://repo/{name}/schema`

推荐使用顺序：

1. `repos`
2. `context`
3. `clusters` 或 `processes`
4. 具体 `process/{name}`

`schema` 主要给 `cypher` 用，不是每次都要读。

## 9. 在其它项目里的推荐接入模式

### 9.1 个人开发者模式

每个项目里：

```bash
npx gitnexus analyze
```

然后在你常用的 AI CLI 里配一个全局 GitNexus MCP。

这样以后你每新接一个仓库，只需要：

1. 进入仓库
2. `npx gitnexus analyze`

不必每个项目都重复加 MCP server。

### 9.2 多项目切换模式

GitNexus 有全局 registry。  
一个 MCP server 可以服务多个已索引 repo。

这意味着：

- 你可以先后索引多个项目
- 再在同一个 AI CLI 会话里通过 `repo` 参数区分

但要注意：

> 当你索引了多个 repo 后，后续 `query/context/impact` 最好显式传 `repo`，不要依赖默认猜测。

### 9.3 团队规范模式

如果你想在团队里推广，建议把这 3 条写进团队规范：

1. 开始重要改动前先 `npx gitnexus status`
2. 改共享函数前先 `impact`
3. 提交前跑 `detect_changes`

这样 GitNexus 才不是“装了但没人用”，而是变成真正的 AI 开发辅助流程。

## 10. 典型提示词模板

### 10.1 理解模块

```text
把 GitNexus 当作当前项目的代码事实源。
先检查 gitnexus 索引是否 up-to-date，再读取 repo context。
随后用 query/context 帮我解释这个模块的真实调用链，不要只靠 grep。
```

### 10.2 改代码前

```text
在动这个函数前，先用 GitNexus impact 分析 blast radius。
告诉我直接调用方、受影响 execution flows、风险级别，再决定修改方案。
```

### 10.3 调试

```text
先用 GitNexus query 找和这个错误症状最相关的 execution flows，
再用 context 锁定关键 symbol，最后告诉我最可能的断点位置。
```

### 10.4 提交前

```text
先跑测试，再用 GitNexus detect_changes 分析当前 diff。
告诉我这次改动实际影响了哪些 symbols 和 flows，是否超出预期。
```

## 11. 常见误区

### 11.1 只装 MCP，不做 analyze

这是最常见错误。  
GitNexus 不是“加了 server 就自动懂你的项目”，它必须先索引。

### 11.2 把 GitNexus 当全文搜索替代品

它不是用来替代 `rg` 的。  
它最强的是关系分析，不是字符串匹配。

### 11.3 索引过期了还继续用

这会让 AI 对当前项目结构的判断滞后。  
尤其在文件拆分、目录迁移、批量重构后，必须重跑索引。

### 11.4 只看 `query`，不做 `impact`

`query` 解决“在哪里、怎么连”，  
`impact` 解决“改了会炸哪里”。

真正做改动时，后者更关键。

### 11.5 多仓库时不传 `repo`

一旦全局 registry 里有多个仓库，不显式指定 `repo` 就容易让 AI 命中错误项目。

## 12. 常见故障与排错

### 12.1 `No indexed repos yet`

说明 MCP server 启动了，但还没有任何项目执行过 `analyze`。

处理：

```bash
cd your-project
npx gitnexus analyze
```

### 12.2 `status` 不是 `up-to-date`

处理：

```bash
npx gitnexus analyze
```

### 12.3 Codex 里显示 `Auth: Unsupported`

对本地 `stdio` MCP 一般可以忽略。  
这不等于 GitNexus 不能工作。

### 12.4 `gitnexus setup` 没帮你配上 Codex

直接手动加：

```bash
codex mcp add gitnexus -- npx -y gitnexus@latest mcp
```

### 12.5 索引存在，但 AI 还是不用

这通常不是 GitNexus 没生效，而是你的提示词没要求 AI 把 GitNexus 当事实源。

解决方式：

- 明确要求先看 `status/context`
- 明确要求用 `query/context/impact/detect_changes`
- 不要只说“帮我看看这段代码”

## 13. 推荐操作准则

如果你准备把 GitNexus 带到其它项目里，最推荐的实践只有 5 条：

1. 每个项目第一次使用先 `npx gitnexus analyze`
2. 每次重要工作开始前先 `npx gitnexus status`
3. 让 AI 先读 `context`，再做 `query/context/impact`
4. 动共享代码前先做 `impact`
5. 提交前用 `detect_changes` 做一轮 scope 校验

## 14. 最简结论

如果你只记住两句话，记这两句就够了：

先在项目根目录运行 `npx gitnexus status`，如果不是 `up-to-date` 就先执行 `npx gitnexus analyze`。  
然后把 GitNexus MCP 当成代码事实源，先用 `query/context/impact` 确认真实调用链和影响范围，再决定改哪些文件。
