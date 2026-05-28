# GitNexus vNext 优化路线图设计

日期：2026-03-11  
类型：产品/架构设计文档  
范围：`/opt/claude/GitNexus`  
目标：基于当前 GitNexus 实现与 `mystocks_spec` 的实战使用经验，定义一条更适合“服务其它项目”的优化路线。

---

## 1. 背景

GitNexus 当前最强的部分，已经不是问题：

- 代码索引和知识图谱生成
- MCP 工具暴露
- 多仓库 registry
- AI context 注入
- 基础 wiki 生成

从“能不能工作”看，GitNexus 已经能工作。  
从“能不能稳定服务其它项目”看，当前瓶颈已经转移到更上层：

- 接入层是否清晰
- MCP 配置是否稳定
- 索引新鲜度是否可信
- AI host 是否被一等支持
- 审计/整改工作流是否能复用
- 多项目长期维护是否可控

`mystocks_spec` 的实际使用结果说明了一件事：

> GitNexus 的底层图谱能力已经足够强，短期最该优化的不是“再多解析一点边”，而是“让这些能力更容易被 AI CLI 和实际整改流程稳定消费”。

---

## 2. 问题定义

当前 GitNexus 的主要设计短板，不在核心分析引擎，而在产品化边界。

### 2.1 用户看到的表层问题

- `setup` 给人的预期比实际覆盖面更大
- 不同 host 的 MCP 接入方式不统一
- `Codex` 这类真实使用场景还不是一等集成目标
- 用户很难快速判断“现在到底可不可以用”
- “索引 stale” 提示过于粗糙
- 导出能力偏通用 wiki，不够贴近整改/审计

### 2.2 系统层问题

- `analyze` 同时承担索引、注册、注入上下文、修改 repo 文件等多重职责
- repo registry 的 identity 设计偏弱，跨项目/同名仓库场景容易模糊
- MCP 资源和工具仍偏原子能力，离“整改工作流”还有一层
- AI context 是单一强约束模板，缺少 preset 和 host 差异化

### 2.3 根本问题

当前 GitNexus 更像：

- 强大的图谱引擎
- 带一层 MCP 暴露
- 带少量接入辅助

但它还没有完全变成：

> 一个可稳定复用的 AI 开发基础设施产品

---

## 3. 设计目标

本路线图希望把 GitNexus 从“图谱能力集合”推进到“面向实际开发协作的基础设施”。

具体目标：

1. 降低接入和验证成本
2. 提高多项目复用稳定性
3. 提高索引可信度和可解释性
4. 让 AI CLI 用户更少依赖高水平手工提示词
5. 让 GitNexus 更自然地产出审计、契约、整改类成果物

非目标：

- 这份路线图不追求先做全新的 graph engine
- 不优先追求更多底层 parser 特性
- 不优先追求 Web UI 花样功能

---

## 4. 设计原则

### 4.1 优先提升“能否稳定使用”，再提升“理论最强能力”

如果用户仍然要自己解释：

- 如何配置 MCP
- 如何验证 MCP
- 如何判断索引可信
- 如何把图谱能力转成整改动作

那么底层再强，整体产品价值也会被削弱。

### 4.2 优先把真实 host 变成一等目标

现在最值得正式支持的对象不是抽象“任意 editor”，而是：

- `Claude Code`
- `Codex`
- `Cursor`
- 通用 `stdio MCP host`

### 4.3 优先提升“工作流能力”，而不是只增加“原子工具”

`query/context/impact/detect_changes` 很强，但用户真正需要的是：

- 先做什么
- 再做什么
- 怎么验证
- 怎么导出结果

### 4.4 把“审计/整改输出”视为正式产品能力

`mystocks_spec` 的经验表明，GitNexus 最有价值的产物之一不是单次查询结果，而是：

- 契约矩阵
- 审计索引
- 整改清单
- 收敛路线

这不应该只靠人工 prompt 拼出来。

---

## 5. 三种路线选择

### 方案 A：继续优先强化底层图谱能力

例子：

- 增加更多语言 edge 类型
- 更细粒度 execution flow
- 更复杂社区分析

优点：

- 技术壁垒继续增强
- 长期可能提升所有上层能力

缺点：

- 短期用户体感提升有限
- 不能直接解决接入和复用问题
- 不会明显降低实际整改成本

结论：

不作为下一阶段主路线。

### 方案 B：继续扩 MCP 原子工具集合

例子：

- 更多 symbol 工具
- 更多 graph 浏览工具
- 更多批量查询工具

优点：

- 功能面更全
- 对高级用户更灵活

缺点：

- 学习成本上升
- host 差异依旧存在
- 用户仍要自己拼工作流

结论：

可做，但不该是主导方向。

### 方案 C：把 GitNexus 升级为“图谱引擎 + host adapter + workflow preset + audit generator”

优点：

- 最贴近真实使用痛点
- 能直接服务 AI CLI 开发场景
- 能把已有图谱能力变成可复用基础设施

缺点：

- 需要收敛一些现有 CLI 职责边界
- 需要补产品层抽象，而不只是补算法

结论：

这是推荐路线。

---

## 6. 推荐总体架构

推荐把 GitNexus 未来结构理解成 4 层：

### 6.1 Layer 1: Graph Engine

职责：

- analyze
- parse
- graph build
- clusters
- flows
- embeddings

这是当前已经相对成熟的一层。

### 6.2 Layer 2: Knowledge Access Layer

职责：

- MCP tools
- MCP resources
- CLI direct tools
- local backend / HTTP backend

这一层已有雏形，但还偏底层原子能力。

### 6.3 Layer 3: Workflow Layer

职责：

- impact-first coding workflow
- debugging workflow
- refactor workflow
- audit workflow
- contract review workflow

这一层当前主要靠：

- `AGENTS.md`
- `CLAUDE.md`
- skills
- 人工提示词

但还不是正式的一等产品层。

### 6.4 Layer 4: Host Integration Layer

职责：

- `Claude Code`
- `Codex`
- `Cursor`
- 通用 MCP host 适配
- setup / verify / doctor / health checks

这是下一阶段最该补强的一层。

---

## 7. P0 优化项

这些是最值得最先做的。

### 7.1 Host Adapter 体系

现状问题：

- `setup.ts` 直接写死 host 逻辑
- `Codex` 未被正式纳入
- “支持哪些 host” 与“怎么支持”耦合过紧

建议：

- 抽象 `HostAdapter` 接口
- 每个 host 提供：
  - `detect()`
  - `configureMcp()`
  - `verifyMcp()`
  - `installSkills()`
  - `installHooks()`
  - `doctor()`

优先支持：

1. Claude Code
2. Codex
3. Cursor
4. Generic stdio MCP

收益：

- 接入逻辑可维护
- 文档和实现更一致
- 新 host 扩展成本下降

### 7.2 `gitnexus doctor`

现状问题：

- 用户缺“安装后验证”
- `status` 只看索引，不看 host/MCP 是否真的可用

建议：

新增统一诊断命令：

```bash
gitnexus doctor
gitnexus doctor --host codex
gitnexus doctor --repo /path/to/repo
```

至少检查：

- 当前 repo 是否已索引
- registry 是否有记录
- MCP command 是否存在
- host 配置是否存在
- MCP server 是否能启动
- 能否读取 `gitnexus://repos`
- 能否解析目标 repo context
- 当前索引是否 stale

收益：

- 大幅降低接入排障成本
- 能显著减少“装了但不会用”的场景

### 7.3 拆分 `analyze` 的职责

现状问题：

- `analyze` 同时做索引、registry、`.gitignore`、context 注入
- 用户难理解“它到底会改哪些东西”

建议：

拆分为：

- `gitnexus analyze`
  - 只负责索引与 registry
- `gitnexus init-project`
  - 负责 `AGENTS.md / CLAUDE.md / repo skills / .gitignore`
- `gitnexus refresh-context`
  - 只更新上下文文档和 skills 注入

兼容策略：

- 旧 `analyze` 暂时保留默认行为
- 增加 `--no-context`、`--no-gitignore`、`--no-register`
- 再逐步引导用户转向新命令

收益：

- 提高行为可预期性
- 更适合成熟团队接入
- 降低对用户仓库的“隐式修改感”

### 7.4 索引健康度模型升级

现状问题：

- 当前 stale 主要按 commit 差异判断
- dirty worktree、schema version、embedding 状态都未纳入

建议：

把“staleness”升级为“index health”：

- `fresh`
- `warning`
- `degraded`
- `invalid`

检查项至少包括：

- indexed commit vs current HEAD
- dirty worktree
- current branch vs indexed branch
- schema version mismatch
- parser version mismatch
- embeddings availability
- last successful analyze timestamp

收益：

- AI 对索引可信度判断更准确
- 能减少“事实已变、工具没报警”的风险

---

## 8. P1 优化项

### 8.1 稳定的多仓库 identity

现状问题：

- registry 主要以 basename 命名
- 真正的冲突处理更偏运行时

建议：

registry entry 增加：

- `id`
- `display_name`
- `path`
- `path_hash`
- `git_root`
- `origin_url` 可选
- `default_branch` 可选

收益：

- 多个同名仓库时不混淆
- 导出文档、MCP 选择、审计结果可稳定落盘

### 8.2 AI Context Presets

现状问题：

- 当前 `ai-context.ts` 采用单一强约束模板
- 对不同 host、不同项目形态不够灵活

建议：

提供 preset：

- `strict`
- `lite`
- `web-app`
- `backend-service`
- `audit`

并支持：

```bash
gitnexus refresh-context --preset audit
gitnexus init-project --preset web-app --host codex
```

收益：

- 提示词和上下文更贴合项目类型
- 减少“规则过强”或“规则不够”的失配

### 8.3 Workflow-level MCP 能力

现状问题：

- MCP 工具很强，但仍偏原子能力
- 用户还要自己把工具组合成整改路径

建议新增高阶工具或高阶资源：

- `audit_surface`
- `contract_matrix`
- `remediation_candidates`
- `route_to_api_map`
- `realtime_surface`

这些能力不必一开始就做到全自动写文件，但至少应做到：

- 返回结构化 JSON / YAML
- 可被 AI 直接转成审计文档

收益：

- 更贴近真实整改任务
- 更容易复用到其它项目

### 8.4 Setup 输出改成“声明式结果”

现状问题：

- `setup` 当前主要打印文本摘要
- 对脚本集成和自动验证不够友好

建议：

支持：

```bash
gitnexus setup --json
gitnexus doctor --json
```

输出：

- detected hosts
- configured hosts
- skipped hosts
- failed hosts
- required manual steps

收益：

- 更适合集成到自动化流程
- 更利于 UI/CLI 做二次展示

---

## 9. P2 优化项

### 9.1 Audit / Report Presets

这是从 `mystocks_spec` 经验直接抽象出来的能力。

建议新增：

```bash
gitnexus audit --preset web-app
gitnexus audit --preset backend-service
gitnexus audit --preset frontend-backend-contract
```

理想产物：

- 审计索引
- 契约矩阵
- 风险热点
- 第一批整改对象
- 后续批次建议

这会比单纯 `wiki` 更贴近真实项目收敛工作。

### 9.2 Preset-aware Wiki

当前 wiki 更偏“仓库介绍文档生成”。  
后续可以让 wiki 与 audit 共享 graph summary 能力，但产物风格不同：

- wiki：面向理解
- audit：面向整改

### 9.3 持续保鲜策略

未来可以补：

- git hook integration
- background refresh hint
- post-merge refresh suggestion
- branch switch invalidation

目标不是后台偷偷重建，而是让用户明确知道：

- 什么时候要重建
- 为什么要重建
- 现在的索引还能不能信

---

## 10. 建议实施顺序

### 第一阶段

- Host Adapter
- `gitnexus doctor`
- `analyze` 职责拆分设计
- index health 模型

### 第二阶段

- registry identity 升级
- AI context presets
- setup / doctor JSON 输出
- workflow-level MCP 高阶接口

### 第三阶段

- audit/report presets
- preset-aware wiki
- 持续保鲜策略

---

## 11. 成功判定

如果这条路线有效，应该能看到这些变化：

1. 用户不再需要自己解释 GitNexus 与 host 的关系
2. `Codex` 等 AI CLI 成为正式支持对象
3. “安装成功但不会验证”问题明显减少
4. 多项目切换时 repo 识别更稳定
5. 用户更容易直接产出审计、契约、整改类文档
6. GitNexus 在其它项目中的价值，不再只是“可搜索的代码图”，而是“可执行的整改基础设施”

---

## 12. 最终建议

下一阶段不建议把主要投入继续放在“更多 graph 边”或“更多原子 MCP 工具”上。  
更合理的方向是：

> 把 GitNexus 升级成 `Graph Engine + Host Adapter + Workflow Presets + Audit Generator`

这是最符合当前产品成熟阶段、也最符合跨项目服务能力的一条路线。

如果后续进入实施阶段，下一份文档应继续细化为：

- `P0` 实施计划
- 模块拆分方案
- CLI 兼容策略
- MCP 接口增量设计
- 验证与回归基线
