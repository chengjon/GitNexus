# MyStocks Spec 审计文档总索引

日期：2026-03-10  
项目范围：`/opt/claude/mystocks_spec`  
导出目录：`/opt/claude/GitNexus/tmp_exports/mystocks_spec`

## 1. 索引说明

本文不是新的审计正文，而是对当前已导出的主题文档做统一索引，方便审核、追踪和后续收敛。

本次已按 2026-03-10 的最新 GitNexus 结果完成复核：

- `npx gitnexus status` 显示 `Status: up-to-date`
- 索引提交：`49cb57d`
- 当前提交：`49cb57d`
- 索引统计：`12,698 files / 80,575 nodes / 187,870 edges / 4,587 clusters / 300 flows`

当前文档总量：

- 主题文档数量：`6`
- 执行拆解文档数量：`2`
- 索引文档数量：`1`
- 文档总数：`9`
- 总行数：`5007`

更新 `2026-03-11`：首批整改聚焦的 `strategy/backtest`、`data/concept`、`dashboard` 已完成闭环。后续优先级应从这 3 个已关闭对象，切换到剩余 `PRESENTATIONAL` 与 `HYBRID` 页面。

## 2. 文档清单

### 2.1 项目总览与收敛地图

- 文件名：`PROJECT_AUDIT_AND_CONVERGENCE_MAP_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_AUDIT_AND_CONVERGENCE_MAP_2026-03-10.md`
- 行数：`687`
- 作用：
  - 提供整个项目的全景梳理
  - 解释当前真实架构和目标架构之间的差异
  - 给出项目级收敛方向
- 适合先读，因为它定义了整体上下文。

### 2.2 数据库 / 模型 / 表关系审计

- 文件名：`PROJECT_DATABASE_MODEL_TABLE_AUDIT_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_DATABASE_MODEL_TABLE_AUDIT_2026-03-10.md`
- 行数：`994`
- 作用：
  - 梳理数据库入口、ORM 模型、表关系和真实读写路径
  - 识别 Web 层、平台层、脚本层的数据库现实差异
  - 作为后续数据库收敛与模型治理底稿
- 适合在项目总览之后阅读，因为它解释了持久化层的真实复杂度。

### 2.3 Web 前端 / 展示 / 路由 / 页面结构审计

- 文件名：`PROJECT_WEB_FRONTEND_ROUTE_DISPLAY_AUDIT_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_WEB_FRONTEND_ROUTE_DISPLAY_AUDIT_2026-03-10.md`
- 行数：`683`
- 作用：
  - 梳理真实生效的前端入口、主路由、布局壳层和页面域
  - 说明菜单配置、页面配置、旧路由树并存的问题
  - 说明展示层、状态管理、HTTP 与实时链路的结构偏差
- 适合在数据库文档之后阅读，因为它能帮助判断页面层与后端契约的脱节点。

### 2.4 后端 API / 服务层 / 任务调度 / 实时链路审计

- 文件名：`PROJECT_BACKEND_API_SERVICE_TASK_REALTIME_AUDIT_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_BACKEND_API_SERVICE_TASK_REALTIME_AUDIT_2026-03-10.md`
- 行数：`729`
- 作用：
  - 梳理 FastAPI 主入口、router 注册现实和 API 组织方式
  - 梳理 service 层、任务系统、调度系统和多套实时协议
- 说明后端当前的主运行链与兼容/治理层并存问题
- 适合和前端文档配合阅读，用于建立前后端真实交互地图。

### 2.5 前后端契约矩阵

- 文件名：`PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md`
- 行数：`301`
- 作用：
  - 逐页映射前端真实生产路由、实际 API、后端归属模块和实时方式
  - 对比 `router meta`、`pageConfig`、组件真实调用三层契约漂移
  - 标记 `REAL / HYBRID / MOCK / PRESENTATIONAL / CONTRACT_GAP` 页面状态
  - 汇总当前 `41` 条路由的状态分布和整改优先级
- 当前已同步 `2026-03-11` 首批三对象闭环结果，后续重点转向剩余 `PRESENTATIONAL / HYBRID` 页面
- 适合在前端与后端结构文档之后阅读，因为它直接把“页面如何接到接口”落成执行矩阵。

### 2.6 收敛执行计划

- 文件名：`PROJECT_CONVERGENCE_EXECUTION_PLAN_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_CONVERGENCE_EXECUTION_PLAN_2026-03-10.md`
- 行数：`751`
- 作用：
  - 把前 5 份主题文档收敛成 `P0 / P1 / P2` 可执行任务
  - 列出每个任务的目标文件、验证命令和建议提交粒度
  - 把当前 `41` 条路由与契约矩阵状态分布沉淀为实施基线
  - 作为后续真正进入整改阶段的执行手册
- 建议在审阅完前 5 份主题文档后阅读。

### 2.7 首批整改执行清单

- 文件名：`PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md`
- 行数：`404`
- 作用：
  - 把 `strategy/backtest`、`data/concept`、`dashboard` 这 3 个首批整改对象拆成可执行清单
  - 为每个对象列出当前真实契约、建议改动文件、验证命令和完成判定
  - 作为你在项目目录中运行 `codex` 时的直接施工底稿
- 当前已追加 `2026-03-11` 完成快照，可作为首批闭环的归档记录阅读
- 建议在读完契约矩阵与收敛执行计划后立即阅读。

### 2.8 单对象 Codex 提示词模板

- 文件名：`PROJECT_CODEX_SINGLE_OBJECT_PROMPTS_2026-03-10.md`
- 路径：`/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_CODEX_SINGLE_OBJECT_PROMPTS_2026-03-10.md`
- 行数：`229`
- 作用：
  - 为 `strategy/backtest`、`data/concept`、`dashboard` 提供可直接复制到 `codex` 的单对象提示词
  - 固定输出要求、边界和验证方式，减少你二次组织上下文的成本
  - 作为“执行清单”的轻量入口，适合直接在项目目录里开工
- 建议在准备进入实际整改前直接使用。

## 3. 建议阅读顺序

推荐按下面顺序审核：

1. `PROJECT_AUDIT_AND_CONVERGENCE_MAP_2026-03-10.md`
2. `PROJECT_DATABASE_MODEL_TABLE_AUDIT_2026-03-10.md`
3. `PROJECT_WEB_FRONTEND_ROUTE_DISPLAY_AUDIT_2026-03-10.md`
4. `PROJECT_BACKEND_API_SERVICE_TASK_REALTIME_AUDIT_2026-03-10.md`
5. `PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md`
6. `PROJECT_CONVERGENCE_EXECUTION_PLAN_2026-03-10.md`
7. `PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md`
8. `PROJECT_CODEX_SINGLE_OBJECT_PROMPTS_2026-03-10.md`

原因：

- 第 1 份先建立全局认知
- 第 2 份先看清数据与模型现实
- 第 3、4 份再分别审核前后端运行链

如果你更关心“页面如何接到接口”，也可以改成：

1. 项目总览
2. 前端结构
3. 后端结构
4. 数据库结构
5. 前后端契约矩阵
6. 收敛执行计划
7. 首批整改执行清单
8. 单对象 Codex 提示词模板

## 4. 八份非索引文档分别回答什么问题

### 4.1 项目总览文档回答

- 这个仓库到底是不是单一 Web 项目
- 当前真实架构和文档目标架构差多少
- 后续应该按什么顺序做收敛

### 4.2 数据库文档回答

- 当前到底有几套数据库现实
- Web、平台、脚本分别依赖哪套持久化路径
- 模型、表、元数据和落表路径为什么会漂移

### 4.3 前端文档回答

- 当前到底从哪个入口启动
- 真正生效的是哪套路由和壳层
- 为什么菜单、页面配置、实时链路没有统一事实源

### 4.4 后端文档回答

- 当前主 FastAPI 是怎么装配的
- 为什么 router、service、任务系统、实时系统会并存多套模型
- 如果要做 API 服务化，先该从哪几层收敛

### 4.5 前后端契约矩阵文档回答

- 当前页面与接口到底怎么接
- 哪些页面是真接口，哪些页面还是 mock / presentational / gap
- 当前主生产页的实时频道到底有没有真正接线

### 4.6 执行计划文档回答

- 当前应该先做哪些收敛动作
- 每个收敛动作对应哪些目标文件
- 应该用哪些测试和验证命令把收敛过程固定下来

### 4.7 首批整改清单文档回答

- 第一批到底先改哪 3 个对象
- 每个对象应该按什么顺序动哪些文件
- 在 Codex 里应该用哪些验证命令和完成标准推进

### 4.8 单对象提示词模板文档回答

- 进入项目目录后，应该给 Codex 贴哪一段提示词
- 如何让 Codex 一次只处理一个对象
- 如何在提示词里固定输出结构和边界

## 5. 当前六份主题文档加两份执行拆解文档的联合结论

把这 6 份主题文档和 2 份执行拆解文档合起来看，可以得到一个比较稳定的判断：

- 这个项目不是一个收敛完成的单体应用，而是一个迁移中的平台型仓库
- 前端已经形成主展示壳，但入口、菜单、页面配置和实时配置还没统一
- 后端已经形成主应用装配链，但 router、任务、实时和服务边界仍然分裂
- 数据库和模型层是最深的结构债来源之一

因此，后续优化顺序不建议从“继续加业务功能”开始，而建议优先做：

1. 事实源收敛
2. 前后端契约清单收敛
3. 数据与任务模型收敛
4. 实时协议收敛

截至 `2026-03-11`，首批最明确的 3 个页面契约断点已经完成闭环，因此下一轮更适合优先处理剩余 `PRESENTATIONAL` 与 `HYBRID` 页面，而不是重复回到 `strategy/backtest`、`data/concept`、`dashboard`。

## 6. 当前文档集合的使用建议

当前文档集合已经具备“总览 -> 分域审计 -> 页面接口矩阵 -> 收敛执行计划 -> 首批执行拆解 -> 单对象执行提示词”的完整链路，因此继续推进时更建议：

1. 先按 `PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md` 识别剩余 `PRESENTATIONAL / HYBRID / MOCK / DECLARED_ONLY` 页面
2. 再按 `PROJECT_CONVERGENCE_EXECUTION_PLAN_2026-03-10.md` 把整改动作拆成批次
3. 结合 `PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md` 的更新状态，把下一批重心转向剩余 `PRESENTATIONAL` 与 `HYBRID` 页面
4. 如果需要回看首批闭环过程，再读 `PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md` 的 `2026-03-11` 完成快照
5. 进入项目目录执行时，可参考 `PROJECT_CODEX_SINGLE_OBJECT_PROMPTS_2026-03-10.md` 的结构，自行扩写下一批对象的提示词模板
6. 每完成一批，就回写矩阵文档，持续减少 `HYBRID / MOCK / PRESENTATIONAL / CONTRACT_GAP`
