# MyStocks Spec 前端页面 / API / 实时频道契约矩阵

日期：2026-03-10  
范围：`/opt/claude/mystocks_spec/web/frontend` + `/opt/claude/mystocks_spec/web/backend`  
目的：把“前端真实生效页面 -> 实际调用 API -> 后端归属模块 -> 实时方式 -> mock/real 状态”梳理成一份可执行契约矩阵，作为后续前后端收敛、页面整改和插件化抽边界的工作底稿。

## 1. 说明

- 本文以 2026-03-10 重新执行后的 GitNexus 索引与当前源码共同为准。
- `npx gitnexus status` 当前为 `up-to-date`，索引提交与当前提交同为 `49cb57d`。
- 截至 `2026-03-11`，首批 3 个整改对象 `strategy/backtest`、`data/concept`、`dashboard` 已完成契约闭环与定向验证，本文已同步导出结论。
- 前端当前生产入口链为：
  - `web/frontend/index.html`
  - `web/frontend/src/main-standard.ts`
  - `web/frontend/src/router/index.ts`
- 前端契约源当前至少有三层：
  - `src/router/index.ts` 的 `meta.api`
  - `src/config/pageConfig.ts` 的 `apiEndpoint` / `wsChannel`
  - 页面组件、view model、composable 中真实发出的请求
- 后端契约源当前至少有两层：
  - `web/backend/app/router_registry.py` + `VERSION_MAPPING.py`
  - 具体 router 模块中的 `APIRouter` 前缀与 endpoint 定义

## 2. 判定口径

### 2.1 状态标签

| 标签 | 含义 |
|---|---|
| `REAL` | 页面真实请求已能映射到当前主后端链路 |
| `HYBRID` | 页面能打真实接口，但同时带本地回退、mock 或多套兼容路径 |
| `MOCK` | 页面主要靠本地静态数据、示例数据或 mock 驱动 |
| `PRESENTATIONAL` | 当前路由直接挂的是展示组件，本身不负责取数 |
| `DECLARED_ONLY` | 路由或 `pageConfig` 声明了 API / WS，但当前页面没有接线 |
| `CONTRACT_GAP` | 前端实际请求与后端活跃路由未对齐，或声明/实现明显漂移 |

### 2.2 重要前提

- `web/frontend/.env` 当前为 `VITE_APP_MODE=real`。
- `web/frontend/src/api/apiClient.ts` 的 `baseURL` 是 `/api`。
- `VITE_USE_MOCK_DATA` 没有在当前 `.env` 显式开启，因此“全局 mock client”默认不生效。
- 但若页面自身使用：
  - `mockWebSocket`
  - `createMock*`
  - `fallback to mock`
  - 本地静态数组
  仍然会进入 `HYBRID` 或 `MOCK`。

### 2.3 实时链路判定

- `pageConfig.ts` 给很多页面声明了 `wsChannel`，但“声明有频道”不等于“运行时真的订阅了频道”。
- 当前布局层虽然挂了 `useLiveDataManager()`，但 `src/layouts/MenuConfig.ts` 里没有给当前菜单项填充 `liveUpdate` / `wsChannel` 值，因此这条全局实时链路当前基本是空转。
- 当前活跃生产页中，能明确看到真实实时接线证据的很少：
  - `dashboard` 在首批闭环后已不再把 mock realtime 当成生产契约
  - 多数其他生产页仍然只有手动刷新，没有实际 `useWebSocket` / `useSSE` 订阅

## 3. 总体结论

把生产路由、`pageConfig`、组件实际调用和后端模块一起看，当前契约现实可以概括为：

1. 路由层已经比较稳定，但页面契约事实源并没有收敛。
2. `meta.api`、`pageConfig.apiEndpoint`、组件真实请求三者经常不一致。
3. 当前真正“路由即页面、页面即取数入口”的页面比例并不高。
4. 相当一部分页面仍然是：
   - 展示组件直接挂路由
   - 或带本地静态数据
   - 或带 mock fallback
5. 实时频道目前主要停留在 `pageConfig` 的声明层，真实运行时接线很弱。
6. 后端虽然已经存在活跃 router 主链，但很多前端页面仍然请求旧路径、兼容路径或未对齐路径。

这意味着下一轮优化最应该先做的是：

1. 建立“路由名 -> 页面组件 -> 实际 API -> 实时协议 -> 后端模块”的唯一契约清单。
2. 把 `pageConfig.ts` 改造成只记录“真实运行路径”，不再保留理想态占位。
3. 对 `PRESENTATIONAL` 和 `MOCK` 页面补齐边界标识，不再假装它们已经服务化。
4. 优先处理剩余 `PRESENTATIONAL` 与 `HYBRID` 页面，继续减少展示壳、fallback 和语义漂移。

### 3.1 当前状态分布

按当前生产路由矩阵统计，已覆盖 `41` 条路由，状态分布如下：

- `REAL`: `25`
- `HYBRID`: `6`
- `PRESENTATIONAL`: `4`
- `MOCK`: `3`
- `DECLARED_ONLY`: `3`
- `CONTRACT_GAP`: `0`

这意味着：

- 截至 `2026-03-11`，首批 `strategy/backtest`、`data/concept`、`dashboard` 三对象闭环已完成
- 当前已有 `25/41` 页面可以视为“真实接口已接通且基本能落到活跃后端”
- 仍有 `16/41` 页面处于非真实、混合、展示壳或 mock 状态
- 当前项目仍然是迁移中的系统，但第一批最明确的契约断点已经被消除

### 3.2 当前最值得优先整改的页面队列

截至 `2026-03-11`，`strategy/backtest`、`data/concept`、`dashboard` 已从首批整改队列移出。下一轮建议按下面顺序推进：

1. `watchlist/manage`、`market/lhb`、`data/fund-flow`、`strategy/pos`
   - 这几页本质是展示组件，却被直接当路由页使用，应该优先补 page wrapper
2. `strategy/repo`、`strategy/opt`、`trade/terminal`
   - 这些页已能接到真实接口，但仍混有 fallback、兼容逻辑或本地兜底，适合放在第二批收敛
3. `risk/overview`、`system/config`
   - 这两页当前最主要的问题是页面语义与真实后端契约仍不一致

## 4. 契约矩阵

### 4.1 根入口 / 认证 / 兼容跳转

| 路由 | 页面/组件 | 路由声明 | 实际前端调用 | 后端归属 | 实时 | 状态 | 备注 |
|---|---|---|---|---|---|---|---|
| `/` | `ArtDecoLayoutEnhanced.vue` + redirect | redirect 到 `/dashboard` | 无独立业务请求 | 前端路由层 | 无 | `REAL` | 根路由只是壳层入口 |
| `/dealing-room` | legacy redirect | `LEGACY_HOME_ROUTE_PATH -> /dashboard` | 无 | 前端路由层 | 无 | `REAL` | 旧首页兼容跳转 |
| `/qm` | compat redirect | redirect 到 `/dashboard` | 无 | 前端路由层 | 无 | `REAL` | 兼容旧 Quant Matrix 前缀 |
| `/qm/:pathMatch(*)` | compat redirect | 去掉 `/qm` 前缀再跳转到 `/dashboard` | 无 | 前端路由层 | 无 | `REAL` | 兼容旧深链 |
| `/login` | `views/Login.vue` | `requiresAuth: false`，无 `pageConfig` | `authStore.login()` -> `authApi.login()` -> `/api/v1/auth/login` | `web/backend/app/api/auth*` + `VERSION_MAPPING.auth` | 无 | `REAL` | 登录页契约比较清晰 |
| `/:pathMatch(.*)*` | `views/NotFound.vue` | `pageConfig` 给了 `/api/not/found` | 实际无 API | 无 | 无 | `DECLARED_ONLY` | `pageConfig` 的 `/api/not/found` 没有契约价值 |

### 4.2 核心驾驶舱 / 市场 / 数据分析

| 路由 | 页面/组件 | 路由/`pageConfig` 声明 | 实际前端调用 | 后端归属 | 实时 | 状态 | 备注 |
|---|---|---|---|---|---|---|---|
| `/dashboard` | `ArtDecoDashboard.vue` | 生产页按多接口聚合建模；不再宣称单一 `meta.api` / `pageConfig.apiEndpoint`；无生产 `wsChannel` | `dashboardService.getMarketOverview()` -> `/api/dashboard/market-overview`；`getFundFlow()` -> `/api/akshare/market/fund-flow/hsgt-summary`；`getIndustryFlow()` -> `/api/v2/market/sector/fund-flow`；`getStockFlowRanking()` -> `/api/akshare/market/fund-flow/big-deal` | `web/backend/app/api/dashboard.py`、`web/backend/app/api/akshare_market/fund_flow.py`、`web/backend/app/api/market_v2.py` | 无 | `REAL` | 当前主页是多端点聚合页；策略和系统区块未接线部分已明确保留为 placeholder，不再伪装成单接口页 |
| `/market/realtime` | `MarketRealtimeTab.vue` | `meta.api=/api/v1/market/quotes`；`pageConfig=/api/market/realtime`；`ws=market:realtime` | `dataApi.getMarketOverview()` -> `/api/v1/data/markets/overview` | `web/backend/app/api/data/market.py` | 无实际 WS 订阅 | `REAL` | 路由声明和页面真实调用不一致，实际取的是 data 域总览，不是 market quotes |
| `/market/technical` | `MarketKLineTab.vue` | `meta.api=/api/v1/market/kline`；`pageConfig=/api/technical/indicators`；`ws=market:technical` | `dataApi.getKline()` -> `/api/v1/market/kline` | `web/backend/app/api/market/market_data_request.py` | 无实际 WS | `REAL` | `pageConfig` 与实际调用不一致，但页面真实接口可落到活跃后端 |
| `/market/lhb` | `DragonTigerAnalysis.vue` | `meta.api=/api/data/lhb`；`pageConfig=/api/market/lhb`；`ws=market:lhb` | 当前页面本身不发请求，只消费传入 `lhbData` | 后端存在相关接口：`/api/v1/market/lhb`、`/api/v2/market/lhb` | 无 | `PRESENTATIONAL` | 当前直接把展示组件挂进路由，页面契约并不自洽 |
| `/data/industry` | `ArtDecoIndustryAnalysis.vue` | `meta.api=/api/akshare_market/boards`；`pageConfig=/api/data/industry`；`ws=data:industry` | `apiClient.get('/v2/market/sector/fund-flow')` | `web/backend/app/api/market_v2.py` | 无 | `REAL` | 真实接口落在 `market_v2`，不是 `meta.api` / `pageConfig` 里那两条路径 |
| `/data/concept` | `MarketConceptTab.vue` | `meta.api` 与 `pageConfig` 已对齐 `/api/v2/market/sector/fund-flow?sector_type=概念` | `marketService.getConceptFundFlow()` -> `/api/v2/market/sector/fund-flow` | `web/backend/app/api/market_v2.py` | 无 | `REAL` | 页面通过统一 market service 取数；空状态显式展示，不再以内联静态数组伪装成功响应 |
| `/data/fund-flow` | `FundFlowAnalysis.vue` | `meta.api=/api/akshare_market/fund_flow`；`pageConfig=/api/data/fund/flow`；`ws=data:fund/flow` | 当前页面本身不发请求，只展示传入 `fundData` / `stockRanking` / `trendData` | 后端相关接口存在：`/api/v1/market/fund-flow`、`/api/v2/market/fund-flow` 等 | 无 | `PRESENTATIONAL` | 页面组件化程度高，但直接挂路由后缺失 own data contract |
| `/data/indicator` | `ArtDecoDataAnalysis.vue` | `pageConfig=/api/data/indicator`；`ws=data:indicator` | `useDataAnalysis()` 内部全是本地静态数据 + `setTimeout` | 无真实依赖 | 无 | `MOCK` | 当前仍是演示态分析工作台，不是服务化页面 |
| `/detail/graphics/:symbol` | `KLineAnalysis.vue` | `pageConfig=/api/stock/graphics`；`ws=stock:graphics` | 页面只 `emit('analyze')`，本身不发请求 | 未定位到匹配 `/api/stock/graphics` 的活跃后端接口 | 无 | `DECLARED_ONLY` | 详情页当前仍是纯展示壳 |
| `/detail/news/:symbol` | `announcement/AnnouncementMonitor.vue` | `pageConfig=/api/stock/news`；`ws=stock:news` | `axios` 直连 `/api/announcement/stats`、`/list`、`/today`、`/important`、`/monitor-rules`、`/triggered-records`、`/monitor/evaluate` | `web/backend/app/api/announcement.py` + 兼容 announcement router | 无 | `HYBRID` | 这是 legacy 详情页，契约是“可工作但不按 pageConfig” |

### 4.3 自选管理 / 策略管理

| 路由 | 页面/组件 | 路由/`pageConfig` 声明 | 实际前端调用 | 后端归属 | 实时 | 状态 | 备注 |
|---|---|---|---|---|---|---|---|
| `/watchlist/manage` | `WatchlistManager.vue` | `meta.api=/api/watchlist`；`pageConfig=/api/watchlist/manage`；`ws=watchlist:manage` | 当前组件不取数，只吃 `watchlists/currentStocks` props | 候选后端有 `web/backend/app/api/watchlist.py` 的 `/api/watchlist/*`，以及 `web/backend/app/api/monitoring_watchlists.py` 的 `/api/v1/monitoring/watchlists/*` | 无 | `PRESENTATIONAL` | 当前路由直接挂了纯展示组件，缺少页面级数据装配层 |
| `/watchlist/signals` | `StrategySignalsTab.vue` | `meta.api=/api/v1/trade/signals`；`pageConfig=/api/watchlist/signals`；`ws=watchlist:signals` | `strategyApi.getSignals()` -> `/api/v1/trade/signals` | `web/backend/app/api/trade/routes.py` | 无 | `REAL` | 页面真实调用可工作，但 `pageConfig` 仍是另一条路径 |
| `/watchlist/screener` | `stocks/Screener.vue` | `meta.api=/api/data/stocks`；`pageConfig=/api/watchlist/screener`；`ws=watchlist:screener` | 全本地静态股票数组筛选，无真实接口 | 后端候选是 `web/backend/app/api/data/stocks.py` 的 `/api/v1/data/stocks/basic`，但页面未使用 | 无 | `MOCK` | 当前页面是独立 demo 工具，不是实际后端选股页 |
| `/strategy/repo` | `ArtDecoStrategyManagement.vue` | `meta.api=/api/v1/strategy/list`；`pageConfig=/api/strategy/repo`；`ws=strategy:repo` | `useStrategy()` -> `StrategyApiService.getStrategyList()` -> `/api/v1/strategy/strategies`；创建/更新/删除也走同前缀；失败时降级 mock 数据 | `web/backend/app/api/strategy_management/get_monitoring_db.py`；`.env` 为 `VITE_APP_MODE=real` | 无 | `HYBRID` | 真实后端已接上，但 composable 明确保留 mock fallback |
| `/strategy/parameters` | `StrategyParametersTab.vue` | `meta.api=/api/v1/strategy/strategies`；`pageConfig=/api/strategy/parameters`；`ws=strategy:parameters` | `strategyApi.getStrategies({})` -> `/api/v1/strategy/strategies` | `web/backend/app/api/strategy_management/get_monitoring_db.py` | 无 | `REAL` | 路由声明接近真实，但 `pageConfig` 仍是另一条占位路径 |
| `/strategy/signals` | `StrategySignalsTab.vue` | `meta.api=/api/v1/trade/signals`；`pageConfig=/api/strategy/signals`；`ws=strategy:signals` | `strategyApi.getSignals()` -> `/api/v1/trade/signals` | `web/backend/app/api/trade/routes.py` | 无 | `REAL` | 生产上就是复用 trade signals |
| `/strategy/backtest` | `ArtDecoBacktestAnalysis.vue` | 路由与 `pageConfig` 根路径已统一到 `/api/v1/strategy/backtest`；无 `wsChannel` | 初始策略列表：`/api/v1/strategy/strategies`；启动回测：`/api/v1/strategy/backtest/run`；轮询状态：`/api/v1/strategy/backtest/status/{backtest_id}`；读取结果：`/api/v1/strategy/backtest/results/{backtest_id}`；列表查询：`/api/v1/strategy/backtest/results?strategy_id=...` | 公共后端契约已统一到 `v1` 命名空间；`web/backend/app/api/strategy_management/get_monitoring_db.py` 与 `get_backtest_result.py` 提供主实现，`web/backend/app/api/strategy_mgmt.py` 仅保留废弃兼容路径 | 无 | `REAL` | 旧 `strategy-mgmt` 状态接口只作兼容保留，前端已不再把它当主契约 |
| `/strategy/gpu` | `strategy/BacktestGPU.vue` | `pageConfig=/api/strategy/gpu`；`ws=strategy:gpu` | 当前页面未看到真实请求，主要是监控面板占位 | 无明确活跃接口 | 无 | `DECLARED_ONLY` | 页面是目标能力展示，不是已接好的 GPU 服务页 |
| `/strategy/opt` | `ArtDecoStrategyOptimization.vue` | `pageConfig=/api/strategy/opt`；`ws=strategy:opt` | `strategyApi.getStrategies()` -> `/api/v1/strategy/strategies`；失败时 `createMockStrategyManagementList()` + `createMockOptimizationRows()` | `web/backend/app/api/strategy_management/get_monitoring_db.py` | 无 | `HYBRID` | 优化页和策略管理页共用同一真实列表，但保留本地 mock 回退 |
| `/strategy/pos` | `PortfolioMonitor.vue` | `pageConfig=/api/strategy/pos`；`ws=strategy:pos` | 当前组件不发请求，静态统计 + props | 后端无直接映射价值 | 无 | `PRESENTATIONAL` | 仍是展示壳，不是独立路由页 |

### 4.4 交易 / 风险 / 系统

| 路由 | 页面/组件 | 路由/`pageConfig` 声明 | 实际前端调用 | 后端归属 | 实时 | 状态 | 备注 |
|---|---|---|---|---|---|---|---|
| `/trade/positions` | `ArtDecoTradingPositions.vue` | `pageConfig=/api/trade/positions`；`ws=trade:positions` | `apiClient.get('/v1/trade/positions')` | `web/backend/app/api/trade/routes.py` | 无 | `REAL` | 页面真实调用健康 |
| `/trade/terminal` | `TradingDashboard.vue` | `pageConfig=/api/trade/terminal`；`ws=trade:terminal` | `axios` 直连 `/api/trading/status`、`/start`、`/stop`、`/strategies/performance`、`/market/snapshot`、`/risk/metrics`、`/strategies/add`、`/strategies/{name}`；不可用时回退空数据 | `web/backend/app/api/trading_runtime.py` | 无 WS，30 秒轮询式刷新 | `HYBRID` | 这是目前少数前后端契约比较成套的页，但它走的是 runtime 轻量接口，不是 trade v1 |
| `/trade/signals` | `ArtDecoSignalsView.vue` | `pageConfig=/api/trade/signals`；`ws=trade:signals` | `strategyApi.getSignals({ limit: 20 })` -> `/api/v1/trade/signals` | `web/backend/app/api/trade/routes.py` | 无 | `REAL` | 页面名是 trade，调用也确实落在 trade v1 |
| `/trade/portfolio` | `PortfolioOverviewTab.vue` | `pageConfig=/api/trade/portfolio`；`ws=trade:portfolio` | `apiClient.get('/v1/trade/positions')` | `web/backend/app/api/trade/routes.py` | 无 | `REAL` | “持仓透视”当前实际上只是 positions 视图，不是独立 portfolio 聚合接口 |
| `/trade/history` | `ArtDecoTradingHistory.vue` | `pageConfig=/api/trade/history`；`ws=trade:history` | `apiClient.get('/v1/trade/trades')` | `web/backend/app/api/trade/routes.py` | 无 | `REAL` | `pageConfig` 写的是 history，真实接口是 trades |
| `/risk/management` | `ArtDecoRiskManagement.vue` | 路由存在，但 `pageConfig` 未纳入生成结果；内部 `riskPageConfig.apiUrl=''` | 当前主要依赖 `riskManagementHelpers` 本地初始数据，`handleDataLoaded` 只合并模板层注入结果 | 无明确活跃接口 | 无 | `MOCK` | 这是“风险管理中心壳层”，并未形成真实页面契约 |
| `/risk/overview` | `RiskOverviewTab.vue` | `pageConfig=/api/risk/overview`；`ws=risk:overview` | `monitoringApi.getAlertRules()` -> `/api/v1/monitoring/alert-rules`；其余 overview 指标为本地数组 | `web/backend/app/api/monitoring.py` | 无 | `HYBRID` | 风险总览只把规则清单接到了真实后端，其余摘要仍是本地值 |
| `/risk/pnl` | `PortfolioOverviewTab.vue` | `pageConfig=/api/risk/pnl`；`ws=risk:pnl` | `apiClient.get('/v1/trade/positions')` | `web/backend/app/api/trade/routes.py` | 无 | `REAL` | 页面语义是风险盈亏，真实数据却复用 trade positions |
| `/risk/stop-loss` | `StopLossMonitorTab.vue` | `pageConfig=/api/risk/stop/loss`；`ws=risk:stop/loss` | `apiClient.get('/v1/monitoring/watchlists')` | `web/backend/app/api/monitoring_watchlists.py` | 无 | `REAL` | 页面实际走的是监控 watchlist，不是 `pageConfig` 写的 stop-loss 路径 |
| `/risk/alerts` | `ArtDecoRiskAlerts.vue` | `pageConfig=/api/risk/alerts`；`ws=risk:alerts` | `monitoringApi.getAlertRules()` -> `/api/v1/monitoring/alert-rules`；`getAlerts()` -> `/api/v1/monitoring/alerts` | `web/backend/app/api/monitoring.py` | 仅声明了 `risk:alerts`，无实际订阅 | `REAL` | API 走通，但实时契约停留在声明层 |
| `/risk/news` | `ArtDecoAnnouncementMonitor.vue` | `pageConfig=/api/risk/news`；`ws=risk:news` | `monitoringApi.getAnnouncements()` -> `/api/announcement/list` | `web/backend/app/api/announcement.py` | 无 | `REAL` | 这是新的公告页，明显比 detail legacy 页更收敛 |
| `/system/config` | `ArtDecoSystemSettings.vue` | `pageConfig=/api/system/config`；`ws=system:config` | `monitoringApi.getDetailedSystemHealth()` -> `/api/health/detailed`；`getSystemHealth()` -> `/health`；其余配置表单写到本地 `localStorage` | `web/backend/app/api/health.py` + `app/main.py` `/health` | 无 | `HYBRID` | 页面名叫“系统配置”，真实后端契约却主要是健康检查，不是配置接口 |
| `/system/health` | `SystemHealthTab.vue` | `pageConfig=/api/system/health`；`ws=system:health` | `apiClient.get('/health')` | `web/backend/app/main.py` / `app_factory.py` 顶层 `/health`，以及 `web/backend/app/api/health.py` 前缀版 | 无 | `REAL` | 当前就是纯 health 探针页 |
| `/system/api` | `ArtDecoMonitoringDashboard.vue` | `pageConfig=/api/system/api`；`ws=system:api` | `monitoringApi.getSystemHealth()` -> `/health`；`getDetailedSystemHealth()` -> `/api/health/detailed`；支持导出报告 | `web/backend/app/api/health.py` | 无 | `REAL` | “API 终端”本质是健康与观测页，不是 API catalog |
| `/system/data` | `ArtDecoDataManagement.vue` | `pageConfig=/api/system/data`；`ws=system:data` | `monitoringApi.getDataSourceConfig()` -> `/api/v1/data-sources/config/`；`updateDataSourceConfig()` -> `/api/v1/data-sources/config` | `web/backend/app/api/data_source_config.py` | 无 | `REAL` | 这是当前契约最清晰的系统管理页之一 |

## 5. 实时频道矩阵

### 5.1 `pageConfig.ts` 的声明现实

`src/config/pageConfig.ts` 为绝大多数主业务路由都生成了 `wsChannel`，例如：

- `market-realtime -> market:realtime`
- `watchlist-manage -> watchlist:manage`
- `strategy-repo -> strategy:repo`
- `trade-positions -> trade:positions`
- `risk-alerts -> risk:alerts`
- `system-data -> system:data`

但这批声明当前主要存在三个问题：

1. 页面组件本身多数没有订阅这些频道。
2. 当前菜单配置 `src/layouts/MenuConfig.ts` 没有把 `liveUpdate/wsChannel` 真正配置到菜单项。
3. 布局层虽然挂了 `useLiveDataManager()`，但它会去订阅 `getLiveUpdateMenus()`，而当前这份菜单配置返回基本为空。

### 5.2 当前真实有效的实时方式

| 页面/链路 | 当前方式 | 证据 | 结论 |
|---|---|---|---|
| `TradingDashboard` | 30 秒轮询 | `useTradingDashboard.ts` 的 `setInterval` + `/api/trading/*` | 这是“准实时轮询”，不是 WebSocket / SSE |
| 其余主生产页 | 手动刷新 | 页面内只见 `fetch*()` / `exec()` | 多数业务页没有真实实时接线 |
| 布局级 live data manager | 形同 no-op | `MenuConfig.ts` 没有有效 `liveUpdate/wsChannel` 值 | 全局实时菜单方案未真正启用 |

### 5.3 与后端实时模型的契约关系

后端当前同时存在：

- `web/backend/app/api/websocket.py`
- `web/backend/app/api/realtime_market.py`
- `web/backend/app/api/sse_endpoints.py`
- `web/backend/app/core/socketio_manager.py`

但前端主生产页当前没有形成“页面 -> 统一实时协议 -> 统一频道命名”的稳定主链。  
这意味着前端页面里的 `wsChannel` 还不是“真实协议契约”，只是“意向性配置”。

## 6. 最关键的契约漂移

### 6.1 API 声明漂移最明显的页面

1. `market-realtime`
   - 路由写 market quotes
   - 页面实际调的是 data markets overview

2. `detail/news/:symbol`
   - `pageConfig` 仍写 stock news
   - 页面实际直连的是一组 announcement 监控接口

3. `system/config`
   - 页面名叫配置
   - 实际主要调的是 health 接口

4. `trade/portfolio`
   - 页面语义是 portfolio
   - 实际直接复用 `/api/v1/trade/positions`

5. `risk/pnl`
   - 页面语义是盈亏总览
   - 实际也仍复用 `/api/v1/trade/positions`

### 6.2 页面边界最不清晰的页面

1. `watchlist/manage`
2. `market/lhb`
3. `data/fund-flow`
4. `strategy/pos`
5. `detail/graphics/:symbol`

这些页都更像“组件”而不是“独立路由页”，但当前被直接当页面挂载。

### 6.3 mock / fallback 最重的页面

1. `strategy/repo`
2. `strategy/opt`
3. `trade/terminal`
4. `data/indicator`
5. `watchlist/screener`
6. `risk/management`
7. `risk/overview`

## 7. 收敛建议

### 7.1 P0 建议

1. 为当前生产路由建立唯一 manifest：
   - 路由名
   - 页面组件
   - 实际 API
   - 实时协议
   - 页面状态

2. 用它反向生成：
   - `pageConfig.ts`
   - 菜单数据中的 `apiEndpoint/wsChannel/liveUpdate`

3. 把 `PRESENTATIONAL` 页面从“直挂路由”改为：
   - 独立 page wrapper
   - wrapper 负责取数、加载态、错误态
   - 当前展示组件保留为纯 UI

### 7.2 P1 建议

1. 先给 `watchlist/manage`、`market/lhb`、`data/fund-flow`、`strategy/pos` 补 page wrapper
2. 再收 `strategy/repo`、`strategy/opt`、`trade/terminal` 的 fallback 与兼容路径
3. 再修 `system/config` 与 `risk/overview` 的页面语义漂移
4. 收掉 `trade/portfolio` 与 `risk/pnl` 对 `positions` 的重复复用

### 7.3 P2 建议

1. 统一主实时协议
2. 让 `pageConfig.wsChannel` 只记录真实可订阅频道
3. 去掉无实际消费方的“名义实时配置”
4. 只为真正需要实时的页面补统一 realtime adapter，而不是继续保留占位式 realtime 声明

## 8. 可直接落地的后续动作

如果下一轮继续推进，这份矩阵建议直接拆成 4 个执行项：

1. `route manifest` 收敛
2. `pageConfig` 只保留真实契约
3. `PRESENTATIONAL` 页面补 wrapper
4. `realtime protocol manifest` 收敛

这 4 个动作完成后，前端页面才真正具备：

- 可审计
- 可替换
- 可插件化
- 可跨项目复用
