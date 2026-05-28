# MyStocks Convergence Execution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 用一轮可执行的收敛工程，把 MyStocks 的前端入口、路由配置、后端路由注册、任务系统和实时协议收敛为可维护、可验证、可复用的稳定基线。

**Architecture:** 先冻结当前真实运行链，再分别收敛前端事实源和后端事实源，最后补齐前后端契约矩阵与验证闭环。不要一开始就做大规模重写；先把“唯一入口、唯一清单、唯一主模型”建立起来，再处理 demo/legacy/compat 清理。

**Tech Stack:** Vue 3, Vite, Pinia, Vue Router, Element Plus, FastAPI, SQLAlchemy, APScheduler, Celery, WebSocket, SSE, Socket.IO, Vitest, Playwright, Pytest.

---

## 0. 执行前提

### 0.1 约束

- 这份计划以当前源码现实为准，不以历史文档目标架构为准。
- 不要并行推进 P0、P1、P2；必须按优先级分段执行。
- P0 结束前，不要继续新增页面、router、service、实时频道。
- 对所有“兼容层保留”动作，都要加显式 `legacy` 标识，不允许继续匿名共存。

### 0.2 建议工作方式

1. 在独立 worktree 或分支执行收敛工作。
2. 每个 Task 单独提交。
3. 每完成一个 Task 就跑对应验证，不要攒到最后。
4. 任何涉及路由、任务、实时协议的改动，都先更新测试，再改实现。

### 0.3 建议阅读前置材料

- `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_AUDIT_AND_CONVERGENCE_MAP_2026-03-10.md`
- `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_DATABASE_MODEL_TABLE_AUDIT_2026-03-10.md`
- `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_WEB_FRONTEND_ROUTE_DISPLAY_AUDIT_2026-03-10.md`
- `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_BACKEND_API_SERVICE_TASK_REALTIME_AUDIT_2026-03-10.md`
- `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md`

### 0.4 当前执行基线

以 2026-03-10 当前审计结果为基线：

- 前端主路由矩阵当前覆盖 `41` 条生产/兼容路由
- 页面状态分布为：
  - `22` 条 `REAL`
  - `7` 条 `HYBRID`
  - `4` 条 `PRESENTATIONAL`
  - `3` 条 `MOCK`
  - `3` 条 `DECLARED_ONLY`
  - `2` 条 `CONTRACT_GAP`
- 当前 P0 优先矛盾不是“继续加页面”，而是先把：
  - 唯一路由清单
  - 唯一后端 router 注册链
  - 页面到接口的契约矩阵
  固定下来

## 1. 分阶段目标

### P0：建立唯一事实源

- 收敛前端唯一生产入口
- 收敛前端路由 / 菜单 / 页面配置主清单
- 收敛后端唯一 router 注册入口
- 补出前后端契约矩阵

### P1：收敛主运行模型

- 修复前端运行时契约漂移
- 收敛后端任务主模型
- 收敛后端实时主协议

### P2：做结构减脂与可复用抽取

- 隔离 demo / archive / legacy 页面面
- 整理 service / adapter / governance 边界
- 为未来 MCP / plugin 抽象准备稳定边界

## 2. 任务总览

| Task | Priority | 目标 |
|---|---|---|
| Task 1 | P0 | 收敛前端唯一生产入口 |
| Task 2 | P0 | 建立前端 route manifest 单一事实源 |
| Task 3 | P1 | 修复前端运行时契约漂移 |
| Task 4 | P2 | 隔离前端 prod / demo / legacy 页面面 |
| Task 5 | P0 | 收敛后端唯一 router 注册入口 |
| Task 6 | P1 | 收敛后端任务执行模型 |
| Task 7 | P1 | 收敛后端实时主协议 |
| Task 8 | P0 | 把审计矩阵落仓并补齐最终验证闭环 |

## 3. 执行任务

### Task 1: 收敛前端唯一生产入口

**Priority:** P0

**Files:**
- Create: `/opt/claude/mystocks_spec/web/frontend/src/bootstrap/appBootstrap.ts`
- Create: `/opt/claude/mystocks_spec/web/frontend/src/bootstrap/initSecurity.ts`
- Create: `/opt/claude/mystocks_spec/web/frontend/src/bootstrap/initSession.ts`
- Create: `/opt/claude/mystocks_spec/web/frontend/src/bootstrap/initRealtime.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/index.html`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/main-standard.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/main.js`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/main-minimal.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/smoke/02-page-loading.spec.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/unit/router/PageMigration.test.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/unit/structure.test.ts`

**Step 1: 写入口收敛的守卫测试**

- 新增一个聚焦入口行为的前端单测，例如：
  - `web/frontend/tests/unit/bootstrap-entry.spec.ts`
- 断言当前生产入口：
  - 只从一个 `main` 入口挂载
  - 必须调用统一 bootstrap
  - 不允许 `main-minimal.ts` 注入测试 token 到生产路径

**Step 2: 运行测试确认当前行为不满足约束**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/bootstrap-entry.spec.ts
```

Expected:

- FAIL，或当前没有统一 bootstrap 抽象。

**Step 3: 实现唯一生产入口**

- 把 `main-standard.ts` 收敛成唯一生产入口。
- 把 `main.js` 里的安全初始化、session restore、版本协商、实时初始化迁入 `src/bootstrap/*`。
- 让 `index.html` 只指向这个唯一入口。
- 把 `main-minimal.ts` 明确标记为调试专用，不允许生产 HTML 使用。

**Step 4: 跑类型检查和聚焦测试**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run type-check
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/bootstrap-entry.spec.ts tests/unit/router/PageMigration.test.ts tests/unit/structure.test.ts
```

Expected:

- 类型检查通过
- 入口守卫测试通过
- 路由迁移和结构测试不回退

**Step 5: 跑页面加载冒烟**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/smoke/02-page-loading.spec.ts
```

Expected:

- 应用可正常挂载
- 首屏不因 bootstrap 异步初始化而卡死

**Step 6: Commit**

```bash
git add web/frontend/index.html web/frontend/src/main-standard.ts web/frontend/src/main.js web/frontend/src/main-minimal.ts web/frontend/src/bootstrap web/frontend/tests/unit/bootstrap-entry.spec.ts
git commit -m "refactor(frontend): converge production bootstrap entry"
```

### Task 2: 建立前端 Route Manifest 单一事实源

**Priority:** P0

**Files:**
- Create: `/opt/claude/mystocks_spec/web/frontend/src/router/routeManifest.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/router/index.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/layouts/MenuConfig.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/config/pageConfig.ts`
- Modify: `/opt/claude/mystocks_spec/scripts/dev/tools/generate-page-config.js`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/config/menu.config.js`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/unit/config/pageConfig.test.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/unit/config/MenuConfig.test.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/unit/config/menu-config-strategy-routes.test.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/unit/router/PageMigration.test.ts`

**Step 1: 先写 manifest 一致性测试**

- 新增测试，例如：
  - `web/frontend/tests/unit/config/route-manifest-parity.spec.ts`
- 断言：
  - 主路由、菜单项、页面配置都从同一 manifest 派生
  - 同一路由的 `path/name/title/api/wsChannel` 不允许出现多份冲突定义

**Step 2: 运行测试确认当前配置分裂**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/config/route-manifest-parity.spec.ts tests/unit/config/pageConfig.test.ts tests/unit/config/MenuConfig.test.ts
```

Expected:

- FAIL，显示当前 `router/index.ts`、`MenuConfig.ts`、`pageConfig.ts` 不一致。

**Step 3: 建立唯一清单**

- 新建 `src/router/routeManifest.ts` 作为主清单。
- `src/router/index.ts` 从清单生成路由。
- `MenuConfig.ts` 只消费 manifest 中的导航字段。
- `generate-page-config.js` 改为从 manifest 生成 `pageConfig.ts`。
- `config/menu.config.js` 标记为 legacy 或迁出主运行链。

**Step 4: 回填接口与实时配置**

- 对主业务页统一补齐：
  - `apiEndpoint`
  - `wsChannel`
  - `layout`
  - `requiresAuth`
  - `pageKind`
- 至少覆盖：
  - `dealing-room`
  - `market-*`
  - `data-*`
  - `watchlist-*`
  - `strategy-*`
  - `trade-*`
  - `risk-*`
  - `system-*`

**Step 5: 运行生成与回归测试**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run generate-page-config
npm --prefix /opt/claude/mystocks_spec/web/frontend run validate-page-config
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/config/route-manifest-parity.spec.ts tests/unit/config/pageConfig.test.ts tests/unit/config/MenuConfig.test.ts tests/unit/config/menu-config-strategy-routes.test.ts tests/unit/router/PageMigration.test.ts
```

Expected:

- `pageConfig.ts` 可被稳定生成
- 菜单和页面配置一致
- 路由迁移测试通过

**Step 6: Commit**

```bash
git add web/frontend/src/router/routeManifest.ts web/frontend/src/router/index.ts web/frontend/src/layouts/MenuConfig.ts web/frontend/src/config/pageConfig.ts scripts/dev/tools/generate-page-config.js web/frontend/src/config/menu.config.js web/frontend/tests/unit/config/route-manifest-parity.spec.ts
git commit -m "refactor(frontend): create single route manifest source"
```

### Task 3: 修复前端运行时契约漂移

**Priority:** P1

**Files:**
- Create: `/opt/claude/mystocks_spec/web/frontend/tests/unit/auth-storage-contract.spec.ts`
- Create: `/opt/claude/mystocks_spec/web/frontend/tests/unit/command-palette-routing.spec.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/stores/auth.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/views/artdeco-pages/_templates/composables/useArtDecoPageTemplate.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/components/menu/CommandPalette.vue`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/components/artdeco/core/ArtDecoHeader.vue`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/components/artdeco/trading/ArtDecoCollapsibleSidebar.vue`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/stores/menuStore.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/stores/preferenceStore.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/unit/layout/DomainLayouts.test.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/quick-route-check.spec.ts`

**Step 1: 写契约回归测试**

- `auth-storage-contract.spec.ts` 断言：
  - 模板权限检查与 auth store 使用同一套存储 key
- `command-palette-routing.spec.ts` 断言：
  - 命令面板跳转到当前真实详情路由，而不是旧路径
- 增加一个 sidebar 状态测试，断言命令面板和侧边栏消费同一状态源

**Step 2: 运行测试确认当前契约漂移**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/auth-storage-contract.spec.ts tests/unit/command-palette-routing.spec.ts
```

Expected:

- FAIL，暴露：
  - `auth-store` vs `auth_token/auth_user`
  - `menuStore` vs `preferenceStore`
  - 命令面板旧路径跳转

**Step 3: 收敛运行时契约**

- 统一 auth 持久化 key。
- 模板权限校验改为使用 auth store 公开接口或统一序列化结构。
- 命令面板路由跳转改到真实详情页路径。
- header / layout props-emits 契约补齐。
- sidebar 折叠状态改成单一 store。

**Step 4: 运行聚焦单测**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/auth-storage-contract.spec.ts tests/unit/command-palette-routing.spec.ts tests/unit/layout/DomainLayouts.test.ts tests/quick-route-check.spec.ts
```

Expected:

- 权限、导航、sidebar 三组契约统一
- 路由快速检查不再引用过期路径

**Step 5: Commit**

```bash
git add web/frontend/src/stores/auth.ts web/frontend/src/views/artdeco-pages/_templates/composables/useArtDecoPageTemplate.ts web/frontend/src/components/menu/CommandPalette.vue web/frontend/src/components/artdeco/core/ArtDecoHeader.vue web/frontend/src/components/artdeco/trading/ArtDecoCollapsibleSidebar.vue web/frontend/src/stores/menuStore.ts web/frontend/src/stores/preferenceStore.ts web/frontend/tests/unit/auth-storage-contract.spec.ts web/frontend/tests/unit/command-palette-routing.spec.ts
git commit -m "fix(frontend): align runtime auth navigation and sidebar contracts"
```

### Task 4: 隔离前端 Prod / Demo / Legacy 页面面

**Priority:** P2

**Files:**
- Create: `/opt/claude/mystocks_spec/web/frontend/src/router/demoRoutes.ts`
- Create: `/opt/claude/mystocks_spec/web/frontend/src/router/legacyRoutes.ts`
- Create: `/opt/claude/mystocks_spec/web/frontend/src/router/routeBuckets.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/router/index.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/router/routeManifest.ts`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/layouts/MenuConfig.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/e2e/critical/menu-navigation-fixed.spec.ts`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/full-page-smoke.spec.ts`

**Step 1: 写页面暴露面测试**

- 新增 `route-surface.spec.ts`，断言主导航只能暴露：
  - `pageKind=prod`
- demo / legacy 路由只能通过显式调试入口访问。

**Step 2: 运行测试确认当前页面暴露过宽**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/router/route-surface.spec.ts
```

Expected:

- FAIL，表明主路由和页面树仍然混有 demo / legacy 页面。

**Step 3: 完成页面分桶**

- `routeManifest.ts` 增加 `pageKind` 字段：
  - `prod`
  - `demo`
  - `legacy`
  - `archive`
- 主路由只注册 `prod`
- demo / legacy 路由拆到独立 route file
- 主菜单只展示 `prod`

**Step 4: 跑冒烟和关键导航测试**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/router/route-surface.spec.ts
npm --prefix /opt/claude/mystocks_spec/web/frontend run test:e2e:stable
```

Expected:

- 主导航不再暴露 demo / legacy
- 关键菜单导航稳定

**Step 5: Commit**

```bash
git add web/frontend/src/router/demoRoutes.ts web/frontend/src/router/legacyRoutes.ts web/frontend/src/router/routeBuckets.ts web/frontend/src/router/index.ts web/frontend/src/router/routeManifest.ts web/frontend/src/layouts/MenuConfig.ts web/frontend/tests/unit/router/route-surface.spec.ts
git commit -m "refactor(frontend): isolate prod demo and legacy route surfaces"
```

### Task 5: 收敛后端唯一 Router 注册入口

**Priority:** P0

**Files:**
- Create: `/opt/claude/mystocks_spec/web/backend/app/router_manifest.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/main.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/router_registry.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/api/VERSION_MAPPING.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/api/register_routers.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/api/v1/router.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_v1_router_security.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_api_documentation_validation.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_api_compliance.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_api_integration.py`

**Step 1: 写 router manifest 回归测试**

- 新增测试，例如：
  - `web/backend/tests/test_router_manifest.py`
- 断言：
  - 主应用只通过一个注册入口加载 router
  - 每个业务域只出现一条主前缀定义
  - compat / mock / governance router 被显式标记

**Step 2: 运行测试确认当前注册层分裂**

Run:

```bash
pytest /opt/claude/mystocks_spec/web/backend/tests/test_router_manifest.py -q
```

Expected:

- FAIL，暴露 `router_registry.py` 与 `api/register_routers.py` 并存问题。

**Step 3: 建立唯一后端 router manifest**

- 新建 `app/router_manifest.py`。
- 把主业务域、compat、governance、mock 分类显式列在 manifest 中。
- `router_registry.py` 只从 manifest 注册。
- `api/register_routers.py` 改为 legacy shim 或彻底移出运行链。

**Step 4: 更新版本映射**

- `VERSION_MAPPING.py` 只负责版本前缀事实，不再承担全量注册现实。
- `v1/router.py` 只保留聚合逻辑，不再和主注册表相互打架。

**Step 5: 运行后端路由测试**

Run:

```bash
pytest /opt/claude/mystocks_spec/web/backend/tests/test_router_manifest.py /opt/claude/mystocks_spec/web/backend/tests/test_v1_router_security.py /opt/claude/mystocks_spec/web/backend/tests/test_api_documentation_validation.py /opt/claude/mystocks_spec/web/backend/tests/test_api_compliance.py /opt/claude/mystocks_spec/web/backend/tests/test_api_integration.py -q
```

Expected:

- 主注册入口唯一
- 文档和安全测试不回退
- API 集成测试通过

**Step 6: Commit**

```bash
git add web/backend/app/router_manifest.py web/backend/app/main.py web/backend/app/router_registry.py web/backend/app/api/VERSION_MAPPING.py web/backend/app/api/register_routers.py web/backend/app/api/v1/router.py web/backend/tests/test_router_manifest.py
git commit -m "refactor(backend): converge router registration manifest"
```

### Task 6: 收敛后端任务执行模型

**Priority:** P1

**Files:**
- Create: `/opt/claude/mystocks_spec/web/backend/app/services/task_state_store.py`
- Create: `/opt/claude/mystocks_spec/web/backend/tests/test_task_execution_model.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/services/task_manager.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/services/task_scheduler.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/core/celery_app.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/api/tasks.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/tasks/backtest_tasks.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_api_integration.py`

**Step 1: 写任务模型测试**

- 新增 `test_task_execution_model.py`，断言：
  - 控制面短任务和分布式长任务有明确分工
  - 任务状态不只存在于进程内内存
  - 调度器只做触发，不再同时承担持久状态

**Step 2: 运行测试确认当前模型分裂**

Run:

```bash
pytest /opt/claude/mystocks_spec/web/backend/tests/test_task_execution_model.py -q
```

Expected:

- FAIL，暴露 `TaskManager`、`TaskScheduler`、`Celery` 的主次不清。

**Step 3: 建立任务主模型**

- 定义规则：
  - 控制面短任务走 `TaskManager`
  - 长时 / 重试 / 分布式任务走 `Celery`
  - `APScheduler` 只触发，不保状态
- 把任务状态迁到共享存储抽象 `task_state_store.py`
- `api/tasks.py` 改为暴露统一任务视图，而不是直接依赖内存状态

**Step 4: 补回测任务进度桥**

- 避免依赖单进程内内存回调字典作为跨进程通信桥
- 至少把状态与进度桥接到共享存储或消息通道

**Step 5: 运行回归**

Run:

```bash
pytest /opt/claude/mystocks_spec/web/backend/tests/test_task_execution_model.py /opt/claude/mystocks_spec/web/backend/tests/test_api_integration.py -q
```

Expected:

- 任务模型分类清晰
- API 任务视图不再只依赖进程内状态

**Step 6: Commit**

```bash
git add web/backend/app/services/task_state_store.py web/backend/app/services/task_manager.py web/backend/app/services/task_scheduler.py web/backend/app/core/celery_app.py web/backend/app/api/tasks.py web/backend/app/tasks/backtest_tasks.py web/backend/tests/test_task_execution_model.py
git commit -m "refactor(backend): unify task execution model"
```

### Task 7: 收敛后端实时主协议

**Priority:** P1

**Files:**
- Create: `/opt/claude/mystocks_spec/web/backend/app/realtime/channel_registry.py`
- Create: `/opt/claude/mystocks_spec/web/backend/tests/test_realtime_protocol_manifest.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/router_registry.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/api/websocket.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/api/realtime_market.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/api/sse_endpoints.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/core/socketio_manager.py`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/services/websocket_manager.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_sse_endpoints.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_socketio_manager.py`
- Test: `/opt/claude/mystocks_spec/web/backend/tests/test_realtime_streaming_service.py`
- Test: `/opt/claude/mystocks_spec/web/frontend/tests/cors-websocket-check.spec.ts`

**Step 1: 写实时协议清单测试**

- 新增 `test_realtime_protocol_manifest.py`，断言：
  - 每类实时能力都有明确协议归属
  - 不允许同一业务事件同时走多条未声明主次的推送链

**Step 2: 运行测试确认当前协议分裂**

Run:

```bash
pytest /opt/claude/mystocks_spec/web/backend/tests/test_realtime_protocol_manifest.py -q
```

Expected:

- FAIL，暴露 WebSocket / SSE / Socket.IO / MTM WebSocket 并存且缺少主协议定义。

**Step 3: 建立实时协议主表**

- 新建 `realtime/channel_registry.py`
- 对每类业务事件明确：
  - `protocol`
  - `channel`
  - `producer`
  - `consumer`
  - `fallback`

建议的主次：

- 控制台事件流：原生 WebSocket
- dashboard / alerts / progress：SSE 或单向推送
- 特殊双向房间场景：Socket.IO

**Step 4: 修复明显实现错误**

- 修复 `realtime_market.py` 中订阅映射命名不一致问题
- 把未注册的实时入口显式标记：
  - 保留并注册
  - 或明确降级为 legacy

**Step 5: 运行前后端回归**

Run:

```bash
pytest /opt/claude/mystocks_spec/web/backend/tests/test_realtime_protocol_manifest.py /opt/claude/mystocks_spec/web/backend/tests/test_sse_endpoints.py /opt/claude/mystocks_spec/web/backend/tests/test_socketio_manager.py /opt/claude/mystocks_spec/web/backend/tests/test_realtime_streaming_service.py -q
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/cors-websocket-check.spec.ts
```

Expected:

- 实时频道清单明确
- 后端协议层测试通过
- 前端 WebSocket 检查不回退

**Step 6: Commit**

```bash
git add web/backend/app/realtime/channel_registry.py web/backend/app/router_registry.py web/backend/app/api/websocket.py web/backend/app/api/realtime_market.py web/backend/app/api/sse_endpoints.py web/backend/app/core/socketio_manager.py web/backend/app/services/websocket_manager.py web/backend/tests/test_realtime_protocol_manifest.py
git commit -m "refactor(backend): converge realtime protocol surface"
```

### Task 8: 把审计矩阵落仓并补齐最终验证闭环

**Priority:** P0

**Files:**
- Create: `/opt/claude/mystocks_spec/docs/contracts/frontend-backend-contract-matrix.md`
- Create: `/opt/claude/mystocks_spec/web/frontend/tests/unit/config/contract-matrix-parity.spec.ts`
- Create: `/opt/claude/mystocks_spec/web/backend/tests/test_frontend_backend_contract_matrix.py`
- Modify: `/opt/claude/mystocks_spec/web/frontend/src/router/routeManifest.ts`
- Modify: `/opt/claude/mystocks_spec/web/backend/app/router_manifest.py`

**Step 1: 用现有审计矩阵做种子**

- 先以现有审计文档：
  - `/opt/claude/GitNexus/tmp_exports/mystocks_spec/PROJECT_FRONTEND_BACKEND_CONTRACT_MATRIX_2026-03-10.md`
  作为初始种子，而不是从零重新盘点。
- 对每个主页面列出：
  - route name
  - path
  - page kind
  - api endpoint
  - auth requirement
  - ws/sse channel
  - backend owner module
  - real/mock status

**Step 2: 写契约一致性测试**

- 前端测试断言 route manifest 与 contract matrix 一致
- 后端测试断言 router manifest 与 contract matrix 一致

**Step 3: 运行测试确认当前契约不闭环**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/config/contract-matrix-parity.spec.ts
pytest /opt/claude/mystocks_spec/web/backend/tests/test_frontend_backend_contract_matrix.py -q
```

Expected:

- FAIL，显示当前页面与后端 API 映射存在缺口。

**Step 4: 补齐主业务页面矩阵**

- 至少覆盖：
  - `dealing-room`
  - `market-*`
  - `data-*`
  - `watchlist-*`
  - `strategy-*`
  - `trade-*`
  - `risk-*`
  - `system-*`
- 第一轮必须覆盖当前 `router/index.ts` 中已经暴露的 `41` 条生产/兼容路由，不允许只做局部样板。

**Step 5: 运行最终闭环验证**

Run:

```bash
npm --prefix /opt/claude/mystocks_spec/web/frontend run type-check
npm --prefix /opt/claude/mystocks_spec/web/frontend run test -- tests/unit/config/contract-matrix-parity.spec.ts tests/unit/config/route-manifest-parity.spec.ts
npm --prefix /opt/claude/mystocks_spec/web/frontend run test:e2e:stable
pytest /opt/claude/mystocks_spec/web/backend/tests/test_router_manifest.py /opt/claude/mystocks_spec/web/backend/tests/test_task_execution_model.py /opt/claude/mystocks_spec/web/backend/tests/test_realtime_protocol_manifest.py /opt/claude/mystocks_spec/web/backend/tests/test_frontend_backend_contract_matrix.py -q
```

Expected:

- 前端主清单、后端主清单、契约矩阵三者一致
- 关键前端导航可用
- 后端主链测试通过

**Step 6: Commit**

```bash
git add docs/contracts/frontend-backend-contract-matrix.md web/frontend/tests/unit/config/contract-matrix-parity.spec.ts web/backend/tests/test_frontend_backend_contract_matrix.py
git commit -m "docs(contracts): add frontend backend contract matrix"
```

## 4. 里程碑验收

### Milestone A: P0 完成

必须满足：

- 前端只有一个生产入口
- 前端 route/menu/page config 只有一个主清单
- 后端 router 注册只有一个主入口
- 已有前后端契约矩阵

### Milestone B: P1 完成

必须满足：

- 前端 auth / sidebar / command palette / header 契约统一
- 后端任务系统主次清楚
- 后端实时协议主次清楚

### Milestone C: P2 完成

必须满足：

- demo / legacy 不再污染主导航和主运行链
- 后续可以开始抽 MCP / plugin / reusable package 边界

## 5. 暂不在本轮做的事

以下工作不要插队到本计划前面：

- 大规模 UI 重设计
- 全量 service 目录重命名
- 全库数据库迁移
- 先做 MCP 抽取而不先收敛事实源
- 新增更多 demo / experimental 页面

## 6. 执行顺序建议

推荐严格按下面顺序推进：

1. Task 1
2. Task 2
3. Task 5
4. Task 8
5. Task 3
6. Task 6
7. Task 7
8. Task 4

原因：

- Task 1、2、5、8 决定全局事实源
- Task 3、6、7 收敛主运行模型
- Task 4 是减脂和清理，不能先于事实源统一

## 7. 完成后的下一步

当这份计划执行完成后，再进入下一阶段：

1. 抽前端壳层包
2. 抽 route/api/realtime manifest 包
3. 抽后端稳定 API 网关层
4. 再考虑 MyStocks MCP / plugin 封装

只有先完成这份收敛计划，后面的 MCP / plugin 复用才不会把当前结构债一起打包出去。
