# MyStocks 单对象 Codex 执行提示词模板

日期：2026-03-10  
项目目录：`/opt/claude/mystocks_spec`  
用途：为首批 3 个整改对象提供“可直接复制到项目目录 Codex 会话”的单对象提示词。

## 1. 使用方式

建议你先：

1. `cd /opt/claude/mystocks_spec`
2. 运行 `codex`
3. 每次只复制下面一个对象的提示词
4. 等该对象完成并验证后，再处理下一个对象

## 2. 通用要求

这 3 份提示词都遵循同一原则：

- 先复核当前源码与 GitNexus，不直接照抄审计文档
- 先补失败测试，再做最小实现修正
- 一次只处理一个对象
- 不顺手扩展到第二个对象
- 必须回报：
  - 当前前端真实调用
  - 当前后端活跃接口
  - 拟修改文件
  - 实施步骤
  - 验证命令
  - 完成判定

## 3. 提示词一：`strategy/backtest`

```text
请在 /opt/claude/mystocks_spec 中处理首批整改对象：strategy/backtest。

执行基线：
- /opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md
- /opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md

本轮目标：
只修复 strategy/backtest 的前后端契约断链，不处理 data/concept 和 dashboard。

已知问题基线：
- 前端路由声明是 /api/v1/strategy/backtest
- pageConfig 声明是 /api/strategy/backtest
- 前端真实启动调用是 /api/v1/strategy/{strategyId}/backtest
- 前端状态轮询是 /api/v1/strategy/backtest/{taskId}
- 后端当前活跃实现更接近：
  - POST /api/v1/strategy/backtest/run
  - GET /api/strategy-mgmt/backtest/status/{backtest_id}
  - GET /api/v1/strategy/backtest/results

执行要求：
1. 先运行 npx gitnexus status，并基于当前源码复核上述判断。
2. 先补失败测试，再改实现。
3. 统一前端启动 / 状态 / 结果路径，不允许继续混用 v1 和 strategy-mgmt 两套前缀。
4. 让 StrategyApiService 成为唯一调用入口。
5. 回写 router meta 与 pageConfig，去掉错误路径。
6. 如果本轮没有真实 WS/SSE 闭环，就移除 strategy:backtest 的假实时声明。
7. 不做回测平台大重构，不新增第二批对象的改动。

优先检查文件：
- web/frontend/src/api/services/strategyService.ts
- web/frontend/src/views/artdeco-pages/strategy-tabs/backtestAnalysisViewModel.ts
- web/frontend/src/views/artdeco-pages/strategy-tabs/backtestQuickRun.ts
- web/frontend/src/router/index.ts
- web/frontend/src/config/pageConfig.ts
- web/backend/app/api/strategy_management/get_monitoring_db.py
- web/backend/app/api/strategy_mgmt.py

优先处理测试：
- web/frontend/tests/unit/backtest-quick-run.spec.ts
- web/frontend/tests/e2e/strategy-backtest.spec.ts
- web/backend/tests/test_week1_strategy_api.py
- 如需要可新增 web/backend/tests/test_strategy_backtest_contract.py

输出要求：
在开始改文件前，先告诉我：
1. 当前前端真实调用
2. 当前后端活跃接口
3. 你准备统一成哪一套契约
4. 将修改哪些文件

完成后必须给出验证命令和结果。
```

## 4. 提示词二：`data/concept`

```text
请在 /opt/claude/mystocks_spec 中处理首批整改对象：data/concept。

执行基线：
- /opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md
- /opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md

本轮目标：
只修复 data/concept 页面与后端活跃接口之间的 CONTRACT_GAP，不处理 strategy/backtest 和 dashboard。

已知问题基线：
- 路由 meta.api 当前是 /api/akshare_market/boards
- pageConfig 当前是 /api/data/concept
- 页面真实请求当前是 /api/v1/market/concept
- 页面失败时会回退到组件内联静态数组
- 后端当前活跃候选更接近：
  - GET /api/analysis/concept/list
  - GET /api/v1/data/stocks/concepts
- 其中 /api/analysis/concept/list 更接近“概念动向”页面语义

执行要求：
1. 先运行 npx gitnexus status，并基于当前源码复核上述判断。
2. 先补失败测试，再改实现。
3. 页面不允许继续直接请求 /api/v1/market/concept，除非你先证明后端主链中已存在稳定同名实现。
4. 页面必须改成通过统一 API wrapper 取数，不要保留组件内直连。
5. 保留 fallback 时，必须显式标记为 fallback，不要伪装成真实数据。
6. 回写 router meta 与 pageConfig，使其与真实请求一致。
7. 不顺手处理其它 market/data 页面。

优先检查文件：
- web/frontend/src/views/artdeco-pages/market-tabs/MarketConceptTab.vue
- web/frontend/src/api/industryConcept.js
- 如有必要可新增 web/frontend/src/api/services/conceptService.ts
- web/frontend/src/router/index.ts
- web/frontend/src/config/pageConfig.ts
- web/backend/app/api/industry_concept_analysis.py
- web/backend/app/api/data/stocks.py
- web/backend/app/router_registry.py

优先处理测试：
- 新增 web/frontend/tests/unit/market-concept-contract.spec.ts
- web/frontend/tests/unit/config/pageConfig.test.ts
- 如需要新增 web/backend/tests/test_industry_concept_api.py

输出要求：
在开始改文件前，先告诉我：
1. 当前页面真实请求
2. 你最终选定的后端真实来源
3. 你是否会补别名路由，还是直接让前端改接活跃接口
4. 将修改哪些文件

完成后必须给出验证命令和结果。
```

## 5. 提示词三：`dashboard`

```text
请在 /opt/claude/mystocks_spec 中处理首批整改对象：dashboard。

执行基线：
- /opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md
- /opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md

本轮目标：
只收敛 dashboard 首页的真实接口契约和实时声明，不做大规模 UI 重构，也不处理 strategy/backtest 和 data/concept。

重要说明：
- 当前真实生产首页路径是 /dashboard
- /dealing-room 只是兼容跳转
- dashboard 当前不是单接口页，而是多接口聚合页

已知问题基线：
- 路由 meta.api 当前是 /api/v1/market/overview
- pageConfig.apiEndpoint 当前是 /api/dashboard/overview
- pageConfig.wsChannel 当前是 dashboard:realtime
- 页面真实调用至少包含：
  - /api/v1/market/quotes
  - /api/akshare/market/fund-flow/hsgt-summary
  - /api/v2/market/sector/fund-flow
  - /api/akshare/market/fund-flow/big-deal
  - /api/strategy-mgmt/strategies
  - /api/v1/risk/position/assessment
  - /api/system/health
  - /api/indicators/calculate/batch
- 当前所谓 realtime 实际上是 mockWebSocket.subscribe('market.trend.000001')

执行要求：
1. 先运行 npx gitnexus status，并基于当前源码复核上述判断。
2. 先补失败测试，再改实现。
3. 不要继续把 dashboard 伪装成“只有一个 apiEndpoint 的页面”。
4. 冻结 dashboard 的真实接口清单，并把 dashboardService 作为唯一聚合入口。
5. 去掉明显错误的 route meta / pageConfig 单接口声明。
6. 如果本轮没有真实 SSE/WS 接线，就移除 dashboard:realtime 的假声明，并明确说明当前为无真实实时。
7. 不做首页大改版，不顺手清理其它页面。

优先检查文件：
- web/frontend/src/api/services/dashboardService.ts
- web/frontend/src/views/artdeco-pages/composables/useArtDecoDashboard.ts
- web/frontend/src/views/artdeco-pages/ArtDecoDashboard.vue
- web/frontend/src/router/index.ts
- web/frontend/src/config/pageConfig.ts
- web/frontend/src/layouts/MenuConfig.ts
- 如需核对后端接口，再看：
  - web/backend/app/router_registry.py
  - web/backend/app/api/market/market_data_request.py
  - web/backend/app/api/market_v2.py
  - web/backend/app/api/strategy_mgmt.py
  - web/backend/app/api/indicators/indicator_cache.py

优先处理测试：
- web/frontend/tests/unit/components/ArtDecoDashboardLogic.spec.ts
- 如需要新增 web/frontend/tests/unit/dashboard-contract.spec.ts
- web/frontend/tests/smoke/02-page-loading.spec.ts
- web/frontend/tests/production-verify.spec.ts

输出要求：
在开始改文件前，先告诉我：
1. dashboard 当前真实接口清单
2. 哪些声明值是假值
3. 你准备如何处理 dashboard 的实时声明
4. 将修改哪些文件

完成后必须给出验证命令和结果。
```

## 6. 推荐执行顺序

建议你在项目目录里按这个顺序使用：

1. 提示词一：`strategy/backtest`
2. 提示词二：`data/concept`
3. 提示词三：`dashboard`

## 7. 结束后的回写要求

每完成一个对象，建议都让 Codex 同步做 3 件事：

1. 回写 `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md`
2. 必要时回写 `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FIRST_BATCH_REMEDIATION_CHECKLIST_2026-03-10.md`
3. 说明剩余风险是否下降，以及下一个对象是否仍保持同一优先级
