# MyStocks 首批整改执行清单

日期：2026-03-10  
项目范围：`/opt/claude/mystocks_spec`  
适用场景：在项目目录中运行 `codex` 时，作为第一批前后端契约整改的直接执行底稿。

> 本文不是新的总览审计，而是把第一批最值得整改的 3 个对象拆成“可执行清单”。
>
> 更新 `2026-03-11`：`strategy/backtest`、`data/concept`、`dashboard` 已完成代码整改与定向验证。本文以下内容保留为归档执行底稿，当前剩余动作仅是外部导出文档同步。

## 1. 本批次覆盖对象

本批次只处理以下 3 个对象，顺序不要打乱：

1. `strategy/backtest`
2. `data/concept`
3. `dashboard`（业务语义上对应旧称 `dealing-room`，当前真实生产路径是 `/dashboard`，`/dealing-room` 是兼容跳转）

## 2. 使用方式

建议在 `/opt/claude/mystocks_spec` 里启动 `codex` 后，按下面节奏执行：

1. 先运行 `npx gitnexus status`
2. 再打开本文和契约矩阵文档
3. 一次只处理一个对象
4. 每个对象单独提交
5. 不要把 3 个对象混在一个提交里

### 2.1 2026-03-11 完成快照

- `strategy/backtest`：已完成。前端已统一到 `v1` 根路径，后端补齐 `/api/v1/strategy/backtest/status/{backtest_id}` 兼容适配，旧 `strategy-mgmt` 状态接口已降级为废弃兼容，页面不再保留伪 WebSocket 声明。
- `data/concept`：已完成。路由声明、`pageConfig` 与前端 service 已统一到 `/api/v2/market/sector/fund-flow?sector_type=概念`，页面改走统一 market service，内联静态假数据回退已移除。
- `dashboard`：已完成。首页按多接口聚合页建模，单一假 `apiEndpoint` / 假 realtime 声明已移除，真实端点清单已冻结在 `dashboardService`。

验证快照：

- Frontend unit: `21 passed`
- Backend targeted: `13 passed`
- E2E combined: `8 passed`
- Type check: `85` errors, `0` syntax errors
- PM2 services online

## 3. 批次优先级

以下优先级表保留的是 `2026-03-10` 启动批次时的原始排序；截至 `2026-03-11`，三项对象均已完成。

| 对象 | 优先级 | 原因 | 建议产出 |
|---|---|---|---|
| `strategy/backtest` | P0 | 前端启动与状态轮询路径和后端活跃实现不一致，属于明确断链 | 一个稳定的回测启动/状态契约 |
| `data/concept` | P0 | 页面直接请求未稳定落到主后端链的路径，并带本地降级 | 一个真实概念列表接口与页面映射 |
| `dashboard` | P1 | 业务价值最高，但牵涉面最大，适合在前两项之后收敛 | 一个明确的多接口主页契约与实时策略 |

## 4. 通用执行规则

- 先补测试，再改实现。
- 优先收敛“真实契约”，不要先做 UI 改版。
- 先消除假声明，再补新能力。
- 如果某页本质是多接口聚合页，不要继续强行伪装成“只有一个 apiEndpoint 的页面”。
- 每完成一个对象，都要同时回写：
  - 路由声明
  - `pageConfig`
  - 页面真实调用
  - 对应测试

## 5. 对象一：`strategy/backtest`

状态：已完成（`2026-03-11`）

### 5.1 当前事实基线

- 路由：
  - `web/frontend/src/router/index.ts`
  - 当前 `meta.api=/api/v1/strategy/backtest`
- 页面配置：
  - `web/frontend/src/config/pageConfig.ts`
  - 当前 `apiEndpoint=/api/strategy/backtest`
  - 当前 `wsChannel=strategy:backtest`
- 页面入口：
  - `web/frontend/src/views/artdeco-pages/strategy-tabs/ArtDecoBacktestAnalysis.vue`
  - `web/frontend/src/views/artdeco-pages/strategy-tabs/backtestAnalysisViewModel.ts`
- 前端真实调用：
  - `strategyApi.getStrategies({}) -> /api/v1/strategy/strategies`
  - `StrategyApiService.startBacktest(id, payload) -> /api/v1/strategy/{id}/backtest`
  - `StrategyApiService.getBacktestStatus(taskId) -> /api/v1/strategy/backtest/{taskId}`
- 后端当前活跃实现：
  - `web/backend/app/api/strategy_management/get_monitoring_db.py`
  - `POST /api/v1/strategy/backtest/run`
  - `GET /api/v1/strategy/backtest/results`
  - `web/backend/app/api/strategy_mgmt.py`
  - `GET /api/strategy-mgmt/backtest/status/{backtest_id}`

### 5.2 核心问题

- 前端启动回测走的是 `/{strategyId}/backtest`，后端当前活跃启动实现是 `/backtest/run`。
- 前端轮询状态走的是 `/api/v1/strategy/backtest/{taskId}`，后端当前状态接口在 `/api/strategy-mgmt/backtest/status/{backtest_id}`。
- `pageConfig`、`router meta`、真实服务调用三者没有对齐。
- 页面声明了 `wsChannel`，但当前回测页没有真实 WS / SSE 接线闭环。

### 5.3 本对象的收敛目标

本批次不要做“大回测平台重构”，只做契约收口：

1. 选定一个唯一前端契约。
2. 让启动接口、状态接口、结果接口命名一致。
3. 让 `StrategyApiService` 成为唯一调用入口。
4. 让 `pageConfig` 和路由声明只反映真实接口。
5. 如果暂时没有真实实时协议，就移除假 `wsChannel`，不要保留伪实时声明。

### 5.4 推荐落地方向

推荐优先保留 `v1 strategy` 作为前端稳定命名空间：

- `GET /api/v1/strategy/strategies`
- `POST /api/v1/strategy/backtest/run`
- `GET /api/v1/strategy/backtest/status/{backtest_id}`
- `GET /api/v1/strategy/backtest/results/{backtest_id}`

实现方式建议优先选下面这条：

- 在后端补 `v1` 兼容状态路由或 shim，把现有 `strategy_mgmt` 状态能力映射到 `v1` 命名空间
- 再让前端 `StrategyApiService` 改成只认这一套路径

不要反过来让前端页面长期依赖 `v1` 与 `strategy-mgmt` 两套前缀混用。

### 5.5 建议修改文件

- 前端：
  - `web/frontend/src/api/services/strategyService.ts`
  - `web/frontend/src/views/artdeco-pages/strategy-tabs/backtestAnalysisViewModel.ts`
  - `web/frontend/src/views/artdeco-pages/strategy-tabs/backtestQuickRun.ts`
  - `web/frontend/src/router/index.ts`
  - `web/frontend/src/config/pageConfig.ts`
- 后端：
  - `web/backend/app/api/strategy_management/get_monitoring_db.py`
  - `web/backend/app/api/strategy_mgmt.py`
  - 如有必要，再补 `web/backend/app/api/v1/router.py` 或统一 router manifest
- 测试：
  - `web/frontend/tests/unit/backtest-quick-run.spec.ts`
  - `web/frontend/tests/e2e/strategy-backtest.spec.ts`
  - `web/backend/tests/test_week1_strategy_api.py`
  - 建议新增：`web/backend/tests/test_strategy_backtest_contract.py`

### 5.6 执行清单

1. 先把“启动 / 状态 / 结果”三条回测路径写成契约测试。
2. 让前端测试明确断言 `StrategyApiService` 不再调用 `/{strategyId}/backtest`。
3. 让后端测试明确断言存在可被前端直接消费的统一状态路径。
4. 补后端 shim 或别名路由，让 `v1` 契约闭环。
5. 修改 `StrategyApiService.startBacktest()` 和 `getBacktestStatus()`。
6. 确认 `extractBacktestTaskId()` 能处理后端真实返回字段，优先统一成 `backtest_id`。
7. 更新 `router meta` 与 `pageConfig`，去掉错误路径。
8. 如果本轮不接 SSE/WS，就去掉 `strategy:backtest` 的页面声明，避免假实时。

### 5.7 验证命令

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/backtest-quick-run.spec.ts
npm --prefix /opt/claude/mystocks_spec/web/frontend run test:e2e -- tests/e2e/strategy-backtest.spec.ts
pytest /opt/claude/mystocks_spec/web/backend/tests/test_week1_strategy_api.py -q
pytest /opt/claude/mystocks_spec/web/backend/tests/test_strategy_backtest_contract.py -q
```

### 5.8 完成判定

- 前端不再请求 `/{strategyId}/backtest`。
- 前端状态轮询不再依赖 `strategy-mgmt` 的独立前缀。
- `pageConfig`、路由声明、前端 service 三者一致。
- 回测页启动后能拿到统一的 `backtest_id` 并稳定轮询。

## 6. 对象二：`data/concept`

状态：已完成（`2026-03-11`）

### 6.1 当前事实基线

- 路由：
  - `web/frontend/src/router/index.ts`
  - 当前 `meta.api=/api/akshare_market/boards`
- 页面配置：
  - `web/frontend/src/config/pageConfig.ts`
  - 当前 `apiEndpoint=/api/data/concept`
  - 当前 `wsChannel=data:concept`
- 页面入口：
  - `web/frontend/src/views/artdeco-pages/market-tabs/MarketConceptTab.vue`
- 前端真实调用：
  - 组件直接 `apiClient.get('/v1/market/concept', { params: { sort, order } })`
  - 请求失败时回退到页面内联静态数组
- 前端现有可复用 API 封装：
  - `web/frontend/src/api/industryConcept.js`
  - `getConceptList() -> /analysis/concept/list`
  - `web/frontend/src/api/index.ts`
  - `dataApi.getStocksConcepts() -> /v1/data/stocks/concepts`
- 后端当前活跃候选：
  - `web/backend/app/api/industry_concept_analysis.py`
  - `GET /api/analysis/concept/list`
  - 返回概念分类及涨跌幅等字段
  - `web/backend/app/api/data/stocks.py`
  - `GET /api/v1/data/stocks/concepts`
  - 更像基础概念字典，而不是概念动向页的排行榜数据

### 6.2 核心问题

- 页面真实请求 `/api/v1/market/concept`，当前主注册链里没有稳定同名活跃实现。
- 当前组件绕过了已有 API 封装，直接内联请求。
- 页面失败时直接回退本地数组，导致页面真假数据边界不清。
- `router meta`、`pageConfig`、真实请求三者完全不一致。

### 6.3 本对象的收敛目标

本批次目标不是“做完整概念分析中心”，而是先让页面接到一个真实、可维护的概念列表接口：

1. 选定一个真实后端源。
2. 页面只通过一个前端 API wrapper 取数。
3. 去掉组件内直连未注册路径。
4. 保留 fallback 时，要显式标注为 fallback，而不是把静态数组混成真实数据。
5. 路由声明和 `pageConfig` 至少要对齐到当前真实来源。

### 6.4 推荐落地方向

第一批建议直接以现有活跃后端接口为准：

- `GET /api/analysis/concept/list`

原因：

- 这条路径已在主注册链中定位到。
- 它比 `/api/v1/data/stocks/concepts` 更接近“概念动向”页面语义。
- 它返回的是概念分类与表现数据，而不是仅概念字典。

如果团队坚持统一到 `v1 data` 命名空间，建议在后端补别名后再迁，不要先让前端继续调用一个当前不存在的 `/api/v1/market/concept`。

### 6.5 建议修改文件

- 前端：
  - `web/frontend/src/views/artdeco-pages/market-tabs/MarketConceptTab.vue`
  - `web/frontend/src/api/industryConcept.js`
  - 或新增 `web/frontend/src/api/services/conceptService.ts`
  - `web/frontend/src/router/index.ts`
  - `web/frontend/src/config/pageConfig.ts`
- 后端：
  - 如果需要补别名，再改 `web/backend/app/api/industry_concept_analysis.py`
  - 如需要主注册层注释或契约说明，再改 `web/backend/app/router_registry.py`
- 测试：
  - 建议新增：`web/frontend/tests/unit/market-concept-contract.spec.ts`
  - 建议新增：`web/backend/tests/test_industry_concept_api.py`
  - 可复用回归：`web/frontend/tests/e2e/comprehensive-all-pages.spec.ts`

### 6.6 执行清单

1. 先写页面契约测试，断言概念页不再请求 `/v1/market/concept`。
2. 新增或复用统一 API wrapper，封装 `/analysis/concept/list`。
3. 在页面层做一次字段映射，把后端返回结构转换为 UI 当前使用的 `name/change_pct/main_inflow/leader` 视图模型。
4. 把组件内联静态数组降级为显式 fallback，并加注释说明只用于接口异常兜底。
5. 更新 `router meta` 与 `pageConfig`，不要继续保留错误路径。
6. 如团队决定补 `v1` 别名，再补后端别名并回写测试。

### 6.7 验证命令

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/market-concept-contract.spec.ts tests/unit/config/pageConfig.test.ts
npm --prefix /opt/claude/mystocks_spec/web/frontend run test:e2e -- tests/e2e/comprehensive-all-pages.spec.ts
pytest /opt/claude/mystocks_spec/web/backend/tests/test_industry_concept_api.py -q
```

### 6.8 完成判定

- 页面不再直接调用 `/api/v1/market/concept`。
- 页面只通过一个 API wrapper 取数。
- 当前概念页可以明确映射到一个真实后端源。
- `router meta`、`pageConfig`、真实请求三者不再漂移。

## 7. 对象三：`dashboard`（旧称 `dealing-room`）

状态：已完成（`2026-03-11`）

### 7.1 当前事实基线

- 当前真实生产首页路径是 `/dashboard`
- 兼容旧路径：
  - `web/frontend/src/router/homeRoute.ts`
  - `LEGACY_HOME_ROUTE_PATH=/dealing-room`
- 路由：
  - `web/frontend/src/router/index.ts`
  - 当前 `meta.api=/api/v1/market/overview`
- 页面配置：
  - `web/frontend/src/config/pageConfig.ts`
  - 当前 `apiEndpoint=/api/dashboard/overview`
  - 当前 `wsChannel=dashboard:realtime`
- 页面入口：
  - `web/frontend/src/views/artdeco-pages/ArtDecoDashboard.vue`
  - `web/frontend/src/views/artdeco-pages/composables/useArtDecoDashboard.ts`
  - `web/frontend/src/api/services/dashboardService.ts`
- 前端真实调用至少包含：
  - `/api/v1/market/quotes`
  - `/api/akshare/market/fund-flow/hsgt-summary`
  - `/api/v2/market/sector/fund-flow`
  - `/api/akshare/market/fund-flow/big-deal`
  - `/api/strategy-mgmt/strategies`
  - `/api/v1/risk/position/assessment`
  - `/api/system/health`
  - `/api/indicators/calculate/batch`
- 当前实时方式：
  - `mockWebSocket.subscribe('market.trend.000001')`
- 当前已有前端测试：
  - `web/frontend/tests/unit/components/ArtDecoDashboardLogic.spec.ts`
  - 它当前明确断言了 `mockWebSocket.subscribe(...)`

### 7.2 核心问题

- 这是一个真实多接口聚合页，但当前还在路由和 `pageConfig` 中伪装成“单接口页面”。
- `meta.api` 是假值，`pageConfig.apiEndpoint` 也是假值。
- 页面真实请求分散在多个域中，但没有一个明确的 dashboard contract 清单。
- 页面当前实时链路是 `mockWebSocket`，和页面声明的 `dashboard:realtime` 没有关系。
- `dashboardService.getSystemHealth()` 与 `monitoringApi.getSystemHealth()` 的路径口径也不一致。

### 7.3 本对象的收敛目标

这一项不要在第一轮里做“大统一重写”。第一轮只做 4 件事：

1. 冻结 dashboard 真实接口清单。
2. 去掉假的单接口声明。
3. 决定首页实时策略是“真实协议”还是“显式无实时”。
4. 把现有 service 调用和契约说明收敛到一个地方。

### 7.4 推荐落地方向

建议把 dashboard 当成“多接口聚合页”处理，而不是单接口页：

- 保留 `dashboardService.ts` 作为唯一聚合入口
- 为它补一份明确的 contract 清单
- 把 `router meta.api` 改成更保守的事实表达，或在 route manifest 中改用 `apiGroup` / `dataContracts`
- `pageConfig.apiEndpoint` 如果框架暂时只能写一个值，建议改成主接口说明值并补备注，不要继续写完全错误的 `/api/dashboard/overview`
- 如果本轮接不上真实 SSE / WS，就先移除 `dashboard:realtime` 声明，并把 `mockWebSocket` 视为开发态模拟，不再假装是生产链路

### 7.5 建议修改文件

- 前端：
  - `web/frontend/src/api/services/dashboardService.ts`
  - `web/frontend/src/views/artdeco-pages/composables/useArtDecoDashboard.ts`
  - `web/frontend/src/views/artdeco-pages/ArtDecoDashboard.vue`
  - `web/frontend/src/router/index.ts`
  - `web/frontend/src/config/pageConfig.ts`
  - `web/frontend/src/layouts/MenuConfig.ts`
- 后端：
  - 如需补系统健康或指标别名，再看：
    - `web/backend/app/api/health.py`
    - `web/backend/app/api/indicators/*`
    - `web/backend/app/router_registry.py`
- 测试：
  - `web/frontend/tests/unit/components/ArtDecoDashboardLogic.spec.ts`
  - `web/frontend/tests/smoke/02-page-loading.spec.ts`
  - `web/frontend/tests/production-verify.spec.ts`
  - 建议新增：`web/frontend/tests/unit/dashboard-contract.spec.ts`

### 7.6 执行清单

1. 先列出 dashboard 当前所有真实接口，并按“保留 / 待替换 / 待移除”分类。
2. 新增 dashboard contract 测试，断言首页不再声明假 `apiEndpoint`。
3. 修改 `dashboardService.ts` 中最明显的错误路径，优先收口：
   - `getTechnicalIndicators()`
   - `getSystemHealth()`
4. 在 `useArtDecoDashboard.ts` 中保留 service 聚合入口，不要让页面继续散落新请求。
5. 如果没有真实实时协议，先移除 `mockWebSocket` 的生产语义和 `dashboard:realtime` 页面声明。
6. 更新与 dashboard 强绑定的单测，避免继续断言错误的 mock realtime 行为。

### 7.7 验证命令

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/components/ArtDecoDashboardLogic.spec.ts tests/unit/dashboard-contract.spec.ts tests/unit/config/pageConfig.test.ts
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/smoke/02-page-loading.spec.ts tests/production-verify.spec.ts
```

### 7.8 完成判定

- 首页的路由声明和 `pageConfig` 不再写明显假值。
- `dashboardService.ts` 成为主页唯一接口聚合入口。
- 首页实时能力要么接到真实协议，要么被明确降级为“当前无实时”。
- 旧称 `dealing-room` 与真实首页 `/dashboard` 的语义在文档和代码里不再混乱。

## 8. 建议提交拆分

建议按 3 个提交推进：

1. `fix(strategy): align backtest run and status contract`
2. `fix(data): align concept page with active backend route`
3. `refactor(dashboard): freeze homepage contract and remove fake realtime`

## 9. 给 Codex 的启动提示词

如果你要在项目目录里直接开干，建议对 Codex 说：

```text
请以 /opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md 为执行基线。
本轮只处理一个对象：strategy/backtest。
先复核当前源码与 GitNexus 索引，再补失败测试，再做最小实现修正。
输出内容必须包含：
1. 当前前端真实调用
2. 当前后端活跃接口
3. 拟修改文件
4. 实施步骤
5. 验证命令
6. 完成判定
不要顺手处理第二个对象。
```
