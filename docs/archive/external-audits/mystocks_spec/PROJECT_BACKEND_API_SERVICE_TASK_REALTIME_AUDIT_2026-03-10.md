# MyStocks Spec 后端 API / 服务层 / 任务调度 / 实时链路审计

日期：2026-03-10  
范围：`/opt/claude/mystocks_spec/web/backend`  
目的：把当前后端真实的 FastAPI 装配链、API 注册现实、服务层组织方式、任务执行模型与实时通信链路梳理成一份可执行的审计文档，便于后续重构、收敛和对外服务化。

## 1. 说明

- 本文以当前源码为准，不以历史架构图、旧目录名或理想分层为准。
- 本文关注的是“当前真实生效链路”，尤其是：
  - 主应用如何启动
  - 哪一套 router 注册在生效
  - 服务层真实是怎么被调用的
  - 定时/异步/后台任务到底有几套
  - 实时能力到底是 WebSocket、SSE 还是 Socket.IO
- 当前会话无法回写目标项目目录，因此文档导出到：
  - `/opt/claude/GitNexus/tmp_exports/mystocks_spec/`

## 2. 一句话结论

这个后端不是一个“边界清晰、单一组织方式”的 FastAPI 服务，而是一个已经长成平台型单体的后端能力集合。

当前真实状态更接近：

- 主入口是 `app/main.py`
- 真正生效的 router 注册器是 `app/router_registry.py`
- `VERSION_MAPPING.py` 只覆盖核心业务域，实际注册层还叠了大量额外 router
- API 组织至少并存四种模式：平铺模块、`v1` 聚合、子目录 `routes.py`、兼容/治理 router
- 任务模型并存：`TaskManager`、`APScheduler`、`Celery`
- 实时模型并存：原生 WebSocket、MTM 专用 WebSocket、SSE、Socket.IO

因此，当前后端的主要问题不是“功能不够”，而是：

- 路由入口太多
- 服务边界不统一
- 任务和实时模型分裂
- 兼容层、实验层、真实交付层叠在一起

如果后续要做后端收敛、对外服务化或作为插件能力暴露，必须先统一事实源。

## 3. 后端规模快照

按当前源码粗略统计：

- `app/api` 下 Python 文件：`200`
- `app/services` 下 Python 文件：`120`
- `app/tasks` 下 Python 文件：`6`
- `app/repositories` 下 Python 文件：`11`

这组数字说明两个关键事实：

1. API 和 service 层规模都已经很大  
2. repository 层并没有成为统一的数据访问底座  

从 `app/api` 顶层分布看，当前后端组织并不单一：

- `v1/`：`25`
- `data/`：`13`
- `contract/`：`12`
- `mystocks_api/`：`12`
- `akshare_market/`：`8`
- `risk/`：`6`
- 其余还散落着大量平铺模块，例如：
  - `tasks.py`
  - `strategy.py`
  - `websocket.py`
  - `watchlist.py`
  - `realtime_market.py`
  - `sse_endpoints.py`

从 `app/services` 看，当前服务层也并非单一领域组织，而是“多种时代产物并存”：

- `indicators/`：`10`
- `adapters_split/`：`8`
- `stock_search_service/`：`7`
- `adapters/`：`7`
- `risk_management/`：`6`
- `market_data_service/`：`6`
- `data_adapters/`：`6`
- 以及大量单文件 service

## 4. FastAPI 主入口与应用装配

### 4.1 当前主入口

当前后端主入口是：

- `web/backend/app/main.py`

这是实际的 FastAPI 应用装配中心。

### 4.2 启动生命周期当前做了什么

`lifespan` 中当前可以确认的启动动作包括：

- 验证环境变量配置
- 初始化 PostgreSQL 连接并做连通性校验
- 初始化监控数据库异步连接池
- 缓存淘汰调度器当前被显式禁用
- 初始化实时 MTM 系统
- 加载指标默认配置
- 向 `task_manager` 注册 `batch_calculate_indicators`

这里可以直接看出三个现实：

1. 主运行时以 PostgreSQL 为中心  
2. 某些平台层能力仍通过 `src.*` 模块跨层引入  
3. 任务系统至少已经接入了一套“进程内任务管理”能力  

### 4.3 中间件装配现实

`main.py` 当前中间件装配较多，包含：

- CORS
- GZip
- PerformanceMiddleware
- ResponseFormatMiddleware
- 可选限流
- 全局异常处理器
- CSRF 中间件
- 请求日志中间件

这说明后端并不是“薄 API 壳”，而是已经把：

- 统一响应格式
- 性能指标
- 安全控制
- 请求观测

都往主应用层集中。

### 4.4 Socket.IO 的现实状态

`main.py` 会初始化：

- `socketio_manager = get_socketio_manager()`

并取出：

- `sio = socketio_manager.sio`

但从主入口当前代码快速看，没有看到把 Socket.IO 作为 ASGI 包裹到主应用上的明确挂载动作，例如：

- `app.mount(...)`
- `socketio.ASGIApp(...)`

因此更准确的表述是：

- Socket.IO 基础设施已初始化
- 但主应用集成链路看起来仍是“准备好了”而不是“完全接在主流量链上”

## 5. 当前 API 注册现实

### 5.1 生效的 router 注册器

主入口 `main.py` 调用的是：

- `app/router_registry.py`

而不是：

- `app/api/register_routers.py`

这点非常关键，因为仓库里两套注册器都存在。

### 5.2 `VERSION_MAPPING.py` 的角色

`app/api/VERSION_MAPPING.py` 当前像是“核心业务域的版本前缀映射表”，覆盖的主要业务域包括：

- `auth`
- `market`
- `market_v2`
- `strategy`
- `monitoring`
- `trade`
- `trading_runtime`
- `technical`
- `data`
- `system`
- `indicators`
- `tdx`
- `announcement`

这层更像“核心域前缀表”，不是完整 API 地图。

### 5.3 `router_registry.py` 的现实

当前真正的注册现实是：

1. 先根据 `VERSION_MAPPING` 批量挂核心 router  
2. 再额外挂载大量非映射 router  
3. 再挂 `api_v1_router` 这种聚合 router  
4. 再挂治理、血缘、契约等治理向 router  

按 `router_registry.py` 粗看，除 `VERSION_MAPPING` 循环外，还存在接近三十条显式 `include_router(...)`。

这意味着：

- `VERSION_MAPPING.py` 不是全量 SSOT
- 真正的入口事实在 `router_registry.py`
- 还不是“只有一个清晰分层”，而是“主映射 + 兼容层 + 聚合层 + 治理层”叠加

### 5.4 另一套注册器仍然存在

`app/api/register_routers.py` 仍保留着旧的注册逻辑。

它的问题不只是冗余，而是会继续制造误判：

- 新人会以为它也在生效
- 文档或脚本可能继续引用它
- 某些模块可能只在其中注册，导致“文件存在但主链没走到”

### 5.5 `api/v1/router.py` 的位置

`app/api/v1/router.py` 又构成了一层聚合：

- system
- strategy
- trading
- admin
- analysis

也就是说，当前后端的 API 路由不是单层，而是至少三层：

```text
main.py
  -> router_registry.py
     -> VERSION_MAPPING core routers
     -> extra routers
     -> api_v1_router
        -> v1 domain routers
```

## 6. API 组织方式与服务调用模式

### 6.1 当前 API 组织不是单一风格

当前至少并存四种 API 组织方式：

1. 平铺模块  
   - `app/api/monitoring.py`
   - `app/api/strategy.py`
   - `app/api/tasks.py`

2. 目录式模块  
   - `app/api/contract/routes.py`
   - `app/api/trade/routes.py`

3. `v1` 聚合目录  
   - `app/api/v1/*`

4. 兼容与治理模块  
   - `data_source_registry`
   - `data_lineage`
   - `governance_dashboard`
   - `indicator_registry`

### 6.2 典型 API 模式对照

当前几个代表性模块说明了服务调用风格并不统一：

| 模块 | 当前组织方式 | 服务/数据访问方式 | 结构判断 |
|---|---|---|---|
| `app/api/monitoring.py` | 平铺 API | 直接调用 `monitoring_service` 单例 | 传统 service facade |
| `app/api/strategy.py` | 平铺 API | 通过 `DataSourceFactory` / adapter 获取数据 | 偏适配器风格 |
| `app/api/dashboard.py` | 平铺 API | builder + cache + data source 组合 | 偏组合编排风格 |
| `app/api/contract/routes.py` | 目录式 API | `Depends(get_db)` + service 类 | 更接近规范 DI 风格 |
| `app/api/trade/routes.py` | 目录式 API | 返回大量演示/模拟数据 | 仍有 demo 性质 |

这说明当前 API 层不是一个统一的“controller -> service -> repo”流水线，而是多种模式并存。

### 6.3 服务层并没有形成唯一底座

`app/services` 的体量已经很大，但 `app/repositories` 只有 `11` 个文件，这本身就说明：

- 并不是所有 API 都通过 repository 层访问数据
- 很多 service 直接承担了聚合、适配、查询、模拟或跨层协调职责

更典型的例子是：

- `app/services/data_source_factory.py` 当前只是一个向后兼容入口，直接 `from data_source_factory import *`

这说明服务层里还存在明显的兼容桥接和路径漂移。

### 6.4 当前服务层的现实判断

可以把当前服务层理解成三类混合体：

1. 真正业务 service  
2. 兼容 shim / adapter  
3. 平台向治理/集成 service  

如果不先给这些类别重新分界，service 目录只会继续膨胀。

## 7. 任务执行与调度模型

这是当前后端另一个关键结构点。

### 7.1 `TaskManager`：进程内任务管理器

`app/services/task_manager.py` 当前提供：

- 任务注册
- 任务执行
- 运行中任务跟踪
- 执行历史
- 统计信息
- 导入导出配置

它的技术现实是：

- 任务配置、执行记录、统计全放在内存字典里
- 真正执行通过 `ThreadPoolExecutor`
- 外层用 `asyncio.create_task()` 和 `run_in_executor()`

这说明 `TaskManager` 当前更像：

- 单进程内任务编排器

而不是：

- 可持久化、可多节点共享的后台任务系统

### 7.2 `tasks.py`：任务管理 REST API

`app/api/tasks.py` 提供了围绕 `TaskManager` 的 API，例如：

- 注册任务
- 列任务
- 获取任务详情
- 启动任务
- 停止任务

并且还叠了：

- 鉴权
- 限流
- 操作审计
- 可选 mock 模式

这说明任务 API 已经不只是内部调试接口，而是被设计成面向业务管理台的接口。

### 7.3 `TaskScheduler`：APScheduler 定时调度器

`app/services/task_scheduler.py` 又提供了另一套定时调度能力：

- `AsyncIOScheduler`
- `MemoryJobStore`
- 线程池执行器
- `cron` / `interval` / `once`

但当前快速扫描主应用装配链后，没有看到它在 `main.py` 或其他明显启动路径中被 `start()`。

因此当前更合理的判断是：

- 调度器能力已实现
- 但当前主运行链上未看到明确启用证据

### 7.4 `Celery`：另一套异步任务系统

`app/core/celery_app.py` 又定义了 Celery 应用：

- broker / backend 取自 settings
- 当前显式 include 的任务模块只有 `app.tasks.backtest_tasks`
- 队列路由也主要围绕 backtest

`app/tasks/backtest_tasks.py` 则实现了：

- 回测任务执行
- Celery 进度更新
- 回测结果持久化

### 7.5 当前任务模型的真实状态

当前至少并存三套任务能力：

| 模型 | 位置 | 角色 |
|---|---|---|
| 进程内任务管理 | `TaskManager` | 任务注册、执行、统计 |
| 定时调度 | `TaskScheduler` | APScheduler 调度 |
| 分布式异步任务 | `Celery` | 回测类长任务 |

### 7.6 结构风险判断

这三套模型并存本身不是问题，问题在于当前没有清晰主次：

- 哪类任务必须走 Celery
- 哪类任务允许走 `TaskManager`
- APScheduler 是否只是触发器，还是业务任务主调度器

当前源码里这件事还没有形成一套清晰制度。

### 7.7 一个更隐蔽的风险

`TaskManager` 与 `TaskScheduler` 当前都基于内存存储：

- `TaskManager` 的任务、执行记录、统计在内存
- `TaskScheduler` 的 `MemoryJobStore` 也在内存

这意味着：

- 多 worker 不共享状态
- 进程重启后状态丢失
- 这两套能力天然更适合单实例控制面，而不是分布式后台任务平台

## 8. 实时链路现实

当前后端实时能力不是一套，而是至少四套并存。

### 8.1 通用事件 WebSocket：`/ws/events`

`app/api/websocket.py` 提供：

- `/ws/events`

它依赖：

- `app/services/websocket_manager.py`

这是一个频道化的原生 WebSocket 管理器，支持：

- 连接跟踪
- 心跳
- 按频道订阅
- 频道广播

它更像“通用事件总线”。

### 8.2 市场/持仓 WebSocket：`realtime_market.py`

`app/api/realtime_market.py` 又提供一套独立的实时链路：

- `/ws/market`
- `/ws/portfolio`
- 以及 `/api/realtime/*`、`/api/mtm/*` 风格的 REST 查询

这套链路的定位更接近：

- 行情推送
- 持仓市值推送
- MTM 引擎集成

### 8.3 一个明显的实现风险

`realtime_market.py` 里的连接管理器定义的是：

- `self.symbol_subscriptions`

但 `broadcast_to_subscribers()` 里检查的却是：

- `self.symbol_subscribers`

这看起来是一个非常直接的字段名漂移问题。

更准确地说：

- 这段广播逻辑大概率存在运行时缺陷

### 8.4 回测 WebSocket：`backtest_ws.py`

仓库里还存在：

- `app/api/backtest_ws.py`

它提供：

- `/ws/backtest/{backtest_id}`

并试图通过回调把 Celery 回测进度推到 WebSocket。

但当前主注册链路 `router_registry.py` 中并没有看到它被纳入 `include_router(...)`。

因此当前更准确的判断是：

- 回测 WebSocket 模块存在
- 但当前主应用链上没有看到它被注册为活跃入口

### 8.5 SSE：`/api/v1/sse/*`

`app/api/sse_endpoints.py` 提供了另一套实时模型：

- `/api/v1/sse/training`
- `/api/v1/sse/backtest`
- `/api/v1/sse/alerts`
- `/api/v1/sse/dashboard`

并配套：

- `app/core/sse_manager.py`

这套更适合：

- 单向推送
- 浏览器原生消费
- 低复杂度通知/进度场景

### 8.6 Socket.IO：独立第五层基础设施

虽然从业务暴露角度最核心的是上面四类，但工程上还存在一套完整的 Socket.IO 基础设施：

- `app/core/socketio_manager.py`

它支持：

- namespace
- 房间
- 用户连接映射
- 重连管理
- streaming support

但如前所述，当前主应用只看到初始化，未看到清晰的最终挂载闭环。

### 8.7 当前实时模型的真实判断

当前后端至少同时存在以下几类实时范式：

| 范式 | 入口 | 典型用途 |
|---|---|---|
| 原生 WebSocket 事件总线 | `/ws/events` | 任务、指标、系统事件 |
| 原生 WebSocket 行情/MTM | `/ws/market`、`/ws/portfolio` | 行情与持仓市值 |
| SSE | `/api/v1/sse/*` | dashboard、alerts、training、backtest |
| Socket.IO | 代码已初始化 | 房间、重连、流式扩展 |
| 回测专用 WebSocket | `/ws/backtest/{id}` 模块存在 | 回测进度推送 |

这说明当前后端不是“选定了一条实时标准”，而是多标准并存。

### 8.8 一个需要明确标注的推断风险

这里有一个基于源码的高概率推断：

- `backtest_ws.py` 把回调注册到 `task_progress_callbacks` 这个内存字典
- `run_backtest_task()` 在 Celery worker 进程里调用 `get_progress_callback()`

如果 FastAPI 进程与 Celery worker 是独立进程，那么这两个进程不会共享同一块 Python 内存字典。

因此可以合理推断：

- 即使 `backtest_ws.py` 被注册成功，当前这套“内存回调桥接 Celery 进度到 WebSocket”的方案在多进程现实下也不可靠

这是推断，不是当前会话直接跑出来的运行时证据，但从源码结构上看风险很高。

## 9. API 与前端契约的结构观察

这份文档重点不在前端，但从后端角度仍能看到一个现实：

- 前端主路由里声明的某些接口路径，在后端里并不是一眼就能对应上

例如：

- `pageConfig.ts` 中有 `/api/trade/terminal`
- 但快速扫描后端 API 与 service，未看到明显的 `terminal` 端点

这类现象说明：

- 前端路由元数据
- 页面配置
- 后端真实 API

三者之间还没有完全收敛成一个稳定契约。

## 10. 当前后端的结构风险

当前最关键的结构风险有七类：

1. Router 事实源不唯一  
   - `router_registry.py` 生效  
   - `register_routers.py` 仍存在  
   - `api_v1_router` 又叠一层聚合

2. API 组织方式不统一  
   - 平铺、目录式、`v1` 聚合、治理接口并存

3. Service 边界不统一  
   - 既有单例 service，也有 adapter，也有 builder/cache 编排，也有兼容 shim

4. 任务模型分裂  
   - `TaskManager`
   - `APScheduler`
   - `Celery`

5. 实时模型分裂  
   - WebSocket
   - MTM WebSocket
   - SSE
   - Socket.IO
   - 未纳入主注册链的 backtest WebSocket

6. 内存态能力过多  
   - 任务状态
   - 调度状态
   - 进度回调
   - 这些在多进程或多实例场景下都容易失真

7. 兼容层和平台层跨根目录耦合  
   - `app/*` 与 `src/*` 混用
   - 说明当前后端不仅是 Web API，还背着平台层能力和迁移负担

## 11. 收敛建议

### 11.1 P0：确定唯一 API 注册总表

建议把 API 注册事实源明确成一层，例如：

- `router_registry.py` 成为唯一注册入口

然后：

- `register_routers.py` 迁出主运行目录或标记为 legacy
- `VERSION_MAPPING.py` 升级为真正覆盖对外交付 API 的前缀清单

### 11.2 P0：给 API 打标签

建议把所有 API 至少分成四类：

- `public`
- `internal`
- `compat`
- `mock/demo`

否则当前这种把 mock、治理、兼容、真实业务都混在主注册链的模式，会持续放大维护复杂度。

### 11.3 P0：明确后台任务主模型

建议明确制度：

- 长任务、可重试任务、跨进程任务统一走 Celery
- 控制面临时任务或单机管理任务才走 `TaskManager`
- APScheduler 只做触发，不承担业务状态管理

否则这三套模型会一直互相重叠。

### 11.4 P1：把任务状态和进度从内存迁出

建议把以下状态迁到共享介质：

- 任务注册与执行状态
- 调度状态
- 进度回调桥接

例如通过：

- Redis
- 数据库
- 消息总线

否则当前任务体系天然不适合多 worker。

### 11.5 P1：统一实时主协议

建议先选一条主路径，再决定其余是否保留：

- 如果以浏览器控制台和管理台为主，优先 SSE + 少量 WebSocket
- 如果以双向交互和房间广播为主，优先 WebSocket / Socket.IO

但无论如何，都不应长期维持当前这种多套实时接口平行发展。

### 11.6 P1：统一服务层边界

建议把 service 至少分成三类目录：

- `application`
- `domain`
- `integration/adapters`

同时减少兼容 shim 和平铺 service 的扩散。

### 11.7 P2：补一份前后端契约对照表

建议新增一份真正可执行的接口契约表，至少统一：

- 前端 route/page config 使用的 endpoint
- 后端真实 prefix + path
- 对应实时频道
- 对应 mock/real 状态

这一步可以直接消掉一大批“前端写了路径、后端其实没有”的隐性问题。

## 12. 对外复用视角：如果要把后端能力作为插件、服务或 MCP 后台

如果未来要把这套后端能力对外复用，不建议直接把整个 `web/backend/app` 暴露出去，更合理的做法是先抽出四个清晰边界：

1. 对外 API 网关层  
   - 只保留版本化、稳定的业务域接口

2. 任务执行层  
   - 明确统一到 Celery 或另一套共享任务总线

3. 实时推送层  
   - 只保留一种主协议和一种频道模型

4. 治理与契约层  
   - `contract` / `data_lineage` / `indicator_registry` 作为后台治理能力单独暴露

如果不先做这一步，直接复用当前后端，外部项目会把：

- 兼容 router
- mock API
- 未完全挂载的实时层
- 多套任务模型

一起带走，接入成本会非常高。

## 13. 最终判断

当前后端已经不是一个简单的 FastAPI CRUD 服务，而是一个混合了：

- Web API
- 平台能力
- 治理能力
- 实时能力
- 任务编排能力

的单体后端。

它的优势是能力面很宽，问题是边界还不够硬。

因此，后续收敛顺序建议是：

1. 统一 router 事实源  
2. 统一任务主模型  
3. 统一实时主协议  
4. 统一前后端契约清单  
5. 再考虑对外服务化或插件化  

只有完成这几步，这个后端才真正适合：

- 作为稳定 API 提供给其他项目
- 作为 MCP 背后的服务能力
- 或被拆成更清晰的子系统
