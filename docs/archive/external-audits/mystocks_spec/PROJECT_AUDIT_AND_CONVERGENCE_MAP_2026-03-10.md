# MyStocks Spec 项目梳理与收敛地图

日期：2026-03-10
范围：`/opt/claude/mystocks_spec`
目的：把最近几轮项目梳理沉淀为一份可复用的分析文档，便于后续优化、收敛、拆分和重构。

## 1. 说明

- 本文以当前源码为准，不以历史文档和架构设想为准。
- GitNexus 已于 2026-03-10 重新索引，当前 `status` 为 `up-to-date`，索引提交与当前提交同为 `49cb57d`；索引统计为 `80,575 nodes / 187,870 edges / 4,587 clusters / 300 flows`，本文仍以源码为最终事实源。
- 本文不是“最终架构定义”，而是“当前真实状态 + 收敛建议”的工作底稿。

## 2. 一句话结论

这个仓库不是单一的 Web 项目，而是一个正在迁移中的平台型单体仓库：

- `src/` 是核心数据/策略/分析平台
- `web/backend` 是 FastAPI 管理后端
- `web/frontend` 是 Vue 前端
- `scripts/`、`config/`、`tests/`、`docs/` 共同构成运维、同步、测试和治理层

当前最重要的现实判断：

- 文档层面强调分层、DDD、三数据库或双数据库能力
- Web 运行时层面更接近“PostgreSQL-only + Redis 辅助”的简化后端
- 兼容层、旧接口、占位实现、目标架构代码同时共存

这决定了后续优化不能直接“按文档想象重构”，而应先做“事实收敛”。

## 3. 项目全景地图

### 3.1 顶层结构

核心目录可先按职责理解为：

- `src/`
  - 平台核心代码，偏数据、策略、分析、监控、数据访问和领域实现
- `web/backend/`
  - FastAPI 后端
  - 包含 API、服务、模型、中间件、实时通信、任务管理
- `web/frontend/`
  - Vue 前端
  - 包含布局、路由、页面、状态管理、组件
- `scripts/`
  - 数据同步、测试驱动、运维脚本
- `config/`
  - PM2、运行环境相关配置
- `tests/`
  - 单元、集成、E2E、契约和多类专项测试
- `architecture/` 与 `docs/architecture/`
  - 架构规则、边界、标准、目标设计
- `openspec/`
  - 规格与流程性文档

### 3.2 项目不是一个单应用

更准确的理解是：

```text
mystocks_spec
├─ Core Platform
│  ├─ 数据接入
│  ├─ 数据访问
│  ├─ 策略执行
│  ├─ 指标计算
│  ├─ 监控/健康度
│  └─ 风险/分析
├─ Web Backend
│  ├─ FastAPI API 层
│  ├─ 服务层
│  ├─ 中间件/安全
│  ├─ WebSocket / Socket.IO
│  └─ 运行态控制接口
├─ Web Frontend
│  ├─ 路由系统
│  ├─ 页面域
│  ├─ 壳层布局
│  └─ 展示与交互
├─ Data Sync / Ops
│  ├─ PM2 管理
│  ├─ 定时同步脚本
│  └─ E2E/环境启动脚本
└─ Governance / Docs
   ├─ 架构规则
   ├─ API 契约
   ├─ 数据源治理
   └─ 各类报告
```

## 4. 当前真实架构 vs 文档目标架构

这是后续收敛最关键的一节。

### 4.1 文档目标

从 `architecture/`、`docs/architecture/` 等文档能看出，项目希望逐步走向：

- 领域边界明确
- 分层架构
- DDD-ish 组织方式
- 数据源/数据库路由能力
- 数据治理、血缘、契约、监控齐备

### 4.2 当前 Web 运行时现实

从 `web/backend/app/main.py`、`web/backend/app/core/config.py`、`web/backend/app/core/database.py` 看，当前 Web 运行时的事实是：

- Web 主库以 PostgreSQL 为中心
- Redis 作为缓存、锁、Session、CSRF 等辅助能力
- Celery 配置已存在，但不是所有业务都通过统一异步任务体系驱动
- MySQL 接口已被兼容重定向到 PostgreSQL
- TDengine 更多保留在平台层和目标架构层，而不是当前 Web 主路径

### 4.3 结论

建议把系统拆成两个层次来理解：

- 目标架构层：平台级多数据源、多数据库、治理能力
- 当前交付层：以 Web 后端和前端为核心的实际运行系统

后续所有优化，都应先回答一个问题：

“这是在收敛当前交付层，还是在继续铺设目标架构层？”

不先区分，项目会持续混乱。

## 5. 前端 / Web / 设计 / 展示 / 路由梳理

### 5.1 前端入口

前端当前可以先围绕这几个入口理解：

- `web/frontend/src/main.js`
- `web/frontend/src/router/index.ts`
- `web/frontend/src/router/guards.ts`
- `web/frontend/src/router/homeRoute.ts`
- `web/frontend/src/layouts/ArtDecoLayoutEnhanced.vue`

### 5.2 前端主结构判断

前端不是“零散页面集合”，而是一个已经有域划分的中后台壳：

- Layout Shell：ArtDeco 风格主壳
- Router：按业务域划分的路由树
- Guard：登录态、权限或导航守卫
- Page Domains：多个业务面板和分析展示页

### 5.3 当前前端路由域

目前可感知的前端主域大致包括：

- `dealing-room`
- `market`
- `data`
- `watchlist`
- `strategy`
- `trade`
- `risk`
- `system`

这说明前端已经不是“展示站点”，而是“交易/监控/分析后台”。

### 5.4 前端优化判断

对前端而言，后续最值得做的不是继续堆页面，而是收敛这四类问题：

- 路由是否和业务域一一对应
- 菜单、布局、页面命名是否统一
- 页面是否只是壳，还是已经绑定真实 API 契约
- 展示层是否存在大量 demo/mock/兼容遗留

### 5.5 给 Claude Code / Codex 的前端聚焦提示词

以下提示词可直接用于继续梳理本项目。

#### 提示词 A：Web 路由收敛

```text
请只关注 web/frontend 的路由、布局、页面装配和导航结构。
目标不是写代码，而是梳理：
1. 当前路由树如何按业务域组织
2. 哪些页面是真实业务页，哪些是壳页、占位页或重复页
3. 哪些菜单项与页面职责不一致
4. 哪些路由应该合并、重命名、拆分或下沉
5. 输出一份“前端路由收敛方案”，按高/中/低优先级排序
```

#### 提示词 B：页面展示与设计收敛

```text
请只关注 web/frontend 的页面展示结构、布局壳、信息层级、视觉一致性和展示逻辑。
重点分析：
1. 哪些页面是数据驾驶舱，哪些页面是操作面板，哪些页面是配置页
2. 页面头部、筛选区、表格区、图表区、操作区是否存在重复模式
3. 哪些页面可以抽成统一页面模板
4. 哪些视觉风格已经偏离主壳层
5. 输出一份“展示层收敛建议”，明确可复用组件和模板化方向
```

#### 提示词 C：前后端页面契约映射

```text
请建立 web/frontend 页面与 web/backend API 的对应关系。
目标：
1. 列出每个核心页面依赖哪些 API
2. 标记哪些 API 是真实可用，哪些是 mock/demo/兼容层
3. 标记哪些页面缺少稳定后端契约
4. 输出“页面 -> 接口 -> 服务 -> 数据源/数据库”的映射表
```

#### 提示词 D：路由与域模型对齐

```text
请从“业务域边界”而不是文件目录的角度，重新审视 web/frontend 的路由。
目标：
1. 判断 market、strategy、trade、risk、system 等域是否边界清晰
2. 找出跨域页面和命名不一致页面
3. 提出一个更稳定的前端域模型和路由命名方案
4. 输出迁移建议，但不要直接改代码
```

## 6. 后端 / API / 数据链路脑图

### 6.1 启动层

后端入口在：

- `web/backend/app/main.py`

启动时主要做这些事：

- 校验环境变量
- 初始化 PostgreSQL
- 初始化监控数据库 async pool
- 初始化实时 MTM
- 初始化指标系统和任务注册
- 挂载中间件
- 注册文档和健康检查端点
- 最后统一注册 API 路由

### 6.2 横切能力

中间件和横切能力包括：

- CORS
- GZip
- Performance middleware
- 统一响应格式中间件
- Rate limit
- CSRF
- 请求日志
- 全局异常处理

这说明后端壳层已经有“平台化 API 网关”雏形，而不是裸路由集合。

### 6.3 API 装配层

统一注册在：

- `web/backend/app/router_registry.py`

版本映射在：

- `web/backend/app/api/VERSION_MAPPING.py`

其中明确挂载了：

- `/api/v1/auth`
- `/api/v1/market`
- `/api/v2/market`
- `/api/v1/strategy`
- `/api/v1/monitoring`
- `/api/v1/trade`
- `/api/trading`
- 以及 watchlist、stock-search、notification、dashboard、websocket、data-lineage、data-sources 等扩展路由

### 6.4 API 脑图

```text
FastAPI app
├─ 基础能力
│  ├─ /health
│  ├─ /metrics
│  ├─ /api/docs
│  ├─ /api/redoc
│  └─ /api/csrf-token
├─ 核心业务 API
│  ├─ auth
│  ├─ market
│  ├─ strategy
│  ├─ monitoring
│  ├─ trade
│  ├─ trading_runtime
│  ├─ technical
│  ├─ indicators
│  ├─ data
│  └─ system
├─ 辅助业务 API
│  ├─ watchlist
│  ├─ stock_search
│  ├─ dashboard
│  ├─ tasks
│  ├─ websocket
│  ├─ notification
│  └─ multi_source
└─ 治理 API
   ├─ data_source_registry
   ├─ data_source_config
   ├─ data_lineage
   ├─ governance_dashboard
   ├─ contract
   └─ indicator_registry
```

### 6.5 典型数据链路

#### 认证链路

```text
Frontend login form
-> POST /api/v1/auth/login
-> rate limit
-> authenticate_user()
-> user lookup / security module
-> JWT token
-> frontend stores token
-> 后续写接口经过 JWT + CSRF 保护
```

特征：

- 有较完整的安全壳
- 兼容路径和 v1 路径并存
- 认证逻辑并不是纯 mock，但也保留 fallback 思路

#### 行情链路

```text
Frontend market page
-> /api/v1/market/*
-> API 层参数校验
-> 缓存 / 熔断器
-> DataSourceFactory
-> market data source adapter
-> 外部源或 mock/real/hybrid 数据
-> API 层做结构转换
-> 返回前端
```

另一条刷新链路：

```text
POST refresh endpoint
-> MarketDataService
-> 外部数据源
-> PostgreSQL 持久化
-> query endpoint 再回读展示
```

这表明行情域内部本身就有两种风格：

- 网关型读取
- 服务型刷新落库

#### 策略链路

```text
Frontend strategy page
-> /api/v1/strategy/run/single
-> API 参数校验
-> strategy data source / strategy service
-> 获取股票历史数据
-> 运行策略逻辑
-> 保存 StrategyResult
-> 返回执行结果
```

策略域已经具备“执行 + 存储 + 查询”的闭环，但数据源入口还不够统一。

#### 监控链路

```text
Frontend monitoring page
-> /api/v1/monitoring/*
-> monitoring_service
-> 直接 SQLAlchemy session
-> Monitoring ORM models
-> 查询/写入监控记录
-> 返回前端
```

监控服务还可能自行抓取 AkShare 实时数据并落库。

#### 交易/运行时链路

```text
Frontend trade or runtime page
-> /api/v1/trade/*
-> 目前多为展示型或 demo 数据

Frontend runtime controls
-> /api/trading/*
-> 内存态 _RUNTIME_STATE
-> JWT 鉴权
-> 返回轻量运行态信息
```

这部分目前更偏展示与占位，不是完整生产级交易引擎。

#### 实时推送链路

```text
Frontend realtime client
-> WebSocket /ws/events
or
-> Socket.IO manager
-> 订阅频道/房间
-> 任务/指标/市场事件推送
-> 前端实时刷新
```

项目里实际上存在两套实时通信机制并存。

## 7. 数据访问层现实

这是项目复杂度最高的一层之一。

### 7.1 Web 当前入口

`web/backend/app/core/database.py` 是 Web 主入口，核心特点：

- SQLAlchemy engine/session
- 主打 PostgreSQL
- MySQL 调用被兼容重定向
- Redis 用于缓存辅助
- 一部分查询逻辑会直接在这里完成

### 7.2 服务层自建数据库连接

但很多服务又不完全通过 `core/database.py`：

- `StrategyService` 自己 `create_engine`
- `MonitoringService` 自己 `create_engine`
- `MarketDataServiceV2` 自己 `create_engine`

这说明数据库接入并未真正统一。

### 7.3 平台级数据访问层

`src/data_access/` 中还有平台级数据访问体系：

- `UnifiedDataAccessManager`
- `QueryRouter`
- `PostgreSQLDataAccess`
- `TDengineDataAccess`

这一层代表“目标态能力”：

- 自动路由
- 查询优化
- 多数据库适配
- 时序数据和关系型数据分流
- failover / load balance / health check

### 7.4 现实结论

当前系统至少同时存在三种数据访问模式：

1. Web 壳层统一入口
2. 业务服务自建连接
3. 平台级智能数据访问层

这是未来最值得收敛的地方之一。

## 8. 关键复杂点与风险点

### 8.1 文档与代码事实不一致

- 文档经常讲目标架构
- 代码则体现简化运行态
- 新人容易拿文档当真，进而误判改造方向

### 8.2 API 面过大

路由域很多，历史层、兼容层、治理层、实验层叠加：

- 业务路由多
- 兼容路径多
- 版本路径多
- 聚合路由仍保留

后果是：

- 定位难
- 去重难
- 契约统一难

### 8.3 数据访问不统一

同一类业务可能：

- 走 `core/database`
- 走 service 自建 engine
- 走平台数据访问层

这会导致：

- 连接池策略不一致
- 事务边界不一致
- 异常处理不一致
- 查询能力重复建设

### 8.4 demo / mock / real / hybrid 并存

系统很明显支持：

- mock
- real
- hybrid
- fallback

这对研发很方便，但如果没有强约束，会模糊“哪些页面是真能力，哪些页面是演示能力”。 

### 8.5 两套实时机制并存

- 原生 WebSocket
- Socket.IO

这意味着实时链路很强，但也意味着后续要选主路线。

### 8.6 交易域成熟度与外观不匹配

从前端域和 API 命名看，项目像完整交易平台；但从实现看，一部分交易/运行时仍是轻量占位或展示态。

如果不明确标注：

- 产品会高估成熟度
- 开发会高估可复用性
- 重构优先级会失真

## 9. 面向“优化与收敛”的建议

以下建议按优先级排序。

### P0：先冻结“当前真实运行架构”

先形成一份团队共识文档，只回答三件事：

- 现在生产或准生产实际跑的是哪条链路
- 哪些模块是主路径
- 哪些模块是目标态、兼容层、实验层或占位层

没有这一步，后续所有优化都容易跑偏。

### P1：统一数据访问入口

目标不是一次性重构全部，而是先统一新增代码必须走哪条入口。

建议：

- Web 交付层统一到一条数据库接入方式
- 平台层数据访问体系单独作为高级能力保留
- 明确哪些服务还允许自建 `create_engine`

### P1：建立“页面 -> API -> 服务 -> 数据源/数据库”映射表

这是前后端收敛的关键中间件文档。

建议至少覆盖：

- market
- strategy
- trade
- risk
- system
- watchlist

这张表会直接暴露：

- 壳页
- 重复接口
- mock 页面
- 契约不稳定页面

### P1：清理路由命名和兼容层

建议做一轮纯梳理，不急着删：

- 哪些是 v1 主路径
- 哪些是 compat 路径
- 哪些是 legacy 聚合
- 哪些接口未来要下线

先做标注，再做删除。

### P2：给交易域和运行时域重新分级

建议明确区分：

- 展示态接口
- 管理态接口
- 真实执行态接口

否则 trade/trading/runtime/risk 会长期混淆。

### P2：统一实时通信主线

建议决定未来主线是：

- Socket.IO
- 或原生 WebSocket

另一套如果保留，应明确它的边界。

### P2：文档去幻觉

需要一轮“文档收敛”：

- 标记目标架构文档
- 标记当前运行文档
- 标记已过期文档
- 标记仅作设计参考的文档

否则 `docs/` 会持续误导。

## 10. 推荐的下一轮深挖顺序

如果继续做系统性收敛，建议按这个顺序推进：

1. 数据库 / 模型 / 表关系梳理
2. 前端页面 -> 后端接口映射表
3. API 去重与兼容层清单
4. 交易域成熟度审计
5. 实时链路统一方案
6. 文档分层治理

## 11. 附：适合继续梳理本项目的追问模板

### 模板 1：数据库收敛

```text
请只梳理 mystocks_spec 的数据库、ORM、表、仓储和数据访问入口。
目标：
1. 列出当前 Web 主路径实际使用哪些表
2. 列出哪些服务绕过了统一数据库入口
3. 标出 PostgreSQL-only 现实路径与 TDengine 目标路径
4. 输出一份“数据库收敛建议”
```

### 模板 2：页面与接口映射

```text
请建立 web/frontend 页面与 web/backend API 的一一映射表。
重点：
1. 哪些页面是壳页
2. 哪些页面依赖 mock/demo 接口
3. 哪些页面已经具备真实业务闭环
4. 输出优先级最高的 10 个收敛点
```

### 模板 3：后端治理化重构

```text
请不要直接改代码，而是从后端治理角度梳理 mystocks_spec：
1. 哪些 API 属于业务面
2. 哪些 API 属于治理面
3. 哪些 API 属于兼容/遗留/实验层
4. 如何按“主路径、兼容层、待下线层”重新组织
```

## 12. 最终判断

这个项目已经具备很强的平台雏形，但当前最大问题不是“功能不够”，而是“事实层没有收敛”：

- 名义架构太多
- 入口太多
- 兼容层太多
- 真实主路径没有被明确标识

因此最优策略不是继续铺功能，而是先做：

- 事实对齐
- 路径收敛
- 契约统一
- 文档分层

做完这四步，后续无论是拆模块、补测试、压技术债，都会快很多。
