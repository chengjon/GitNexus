# MyStocks Spec Web 前端 / 展示 / 路由 / 页面结构审计

日期：2026-03-10  
范围：`/opt/claude/mystocks_spec/web/frontend`  
目的：把当前前端的真实启动链、路由组织、展示壳层、页面分布、数据接入与实时链路系统化梳理出来，作为后续收敛、拆分和对外复用的底稿。

## 1. 说明

- 本文以当前源码为准，不以历史设计稿、旧文档或命名约定为准。
- 本文关注的是“当前真实运行路径”，不是“理想前端架构”。
- 当前会话无法直接写回目标项目目录，因此文档导出到：
  - `/opt/claude/GitNexus/tmp_exports/mystocks_spec/`
- 这份文档重点回答五个问题：
  - 当前前端到底从哪里启动。
  - 真正生效的路由和壳层是哪一套。
  - 页面、菜单、配置是否来自统一事实源。
  - 展示层、数据层、实时链路是如何接上的。
  - 如果要做优化、插件化或跨项目复用，先该收哪几处。

## 2. 一句话结论

这个前端已经在视觉层和主路由层收敛到一套 `ArtDeco` 风格的 Vue 3 单页应用，但运行时现实并不是“单入口 + 单路由事实源 + 单数据配置源”。

当前真实状态更接近：

- 启动入口有多套并存，`index.html` 当前指向 `src/main-standard.ts`
- 路由主链路收敛到 `src/router/index.ts`
- 菜单配置、页面配置、旧菜单树、旧路由树同时存在
- 页面面积极大，生产页面、演示页、归档页混在同一 `views/` 体系
- 实时能力代码很多，但当前有效接入是碎片化的，部分链路甚至没有真正启用

如果后续要优化这个前端，最优先不是“继续堆页面”，而是先把：

1. 唯一生产入口  
2. 唯一路由/菜单/页面配置事实源  
3. 唯一 HTTP/实时接入模式  
4. 生产页与 demo/archive 的边界  

这四件事收敛清楚。

## 3. 技术栈与前端规模快照

### 3.1 当前技术栈

从 `package.json` 和 `vite.config.mts` 看，当前前端主栈是：

- Vue 3
- Vue Router 4
- Pinia
- Vite 5
- Element Plus
- ECharts
- klinecharts
- Axios
- Vitest
- Playwright

构建和运行特征也比较明显：

- `npm run dev` / `build` 前会先跑类型生成脚本
- `pageConfig.ts` 由外部脚本自动生成
- 开发和预览都通过 Vite 代理 `/api` 到后端
- Vite 做了比较重的手工分包：`vue-core`、`element-plus`、`echarts`、`klinecharts`、`vendor`
- PWA 插件在 Vite 中被显式禁用，但 `index.html` 仍保留 `manifest` 挂载

### 3.2 目录规模快照

按当前源码粗略统计：

- `src/views`：`402` 个文件
- `src/views` 下 `.vue` 文件：`255`
- `src/layouts`：`26`
- `src/stores`：`19`
- `src/api`：`64`
- `src/services`：`23`

`src/views` 一级分组的现实分布说明这个前端页面面积极大，而且“生产页 + demo + 归档”没有彻底隔离：

- `artdeco-pages`：`126`
- 根目录散放页面：`47`
- `demo`：`44`
- `styles`：`27`
- `market`：`18`
- `strategy`：`13`
- `advanced-analysis`：`13`
- `converted.archive`：`12`
- `monitoring`：`11`

这说明当前前端不是一个轻量展示层，而是一个把多个阶段产物叠在一起的“大前端工作区”。

## 4. 当前真实启动链路

### 4.1 真实 HTML 入口

当前 `index.html` 直接指定：

```html
<script type="module" src="/src/main-standard.ts"></script>
```

因此，当前默认运行入口不是 `src/main.js`，而是：

```text
index.html
  -> src/main-standard.ts
     -> App.vue
        -> src/router/index.ts
           -> ArtDecoLayoutEnhanced.vue
              -> router-view
```

### 4.2 当前生效入口：`src/main-standard.ts`

这条入口做的事情比较“克制”：

- 创建 Vue app
- 初始化 Pinia
- 注入当前主路由 `src/router/index.ts`
- 加载 ArtDeco 样式、Element Plus 覆盖样式、ECharts 按需初始化
- 注册 `ArtDecoCardCompact`
- 直接 `mount('#app')`

它的优点是：

- 路径短
- 启动逻辑简单
- 更容易定位首屏问题

它的缺点也很明显：

- 不包含 `main.js` 中那套安全初始化
- 不包含版本协商通知
- 不包含 session 恢复
- 不包含 Service Worker 注册
- 不包含 WebSocket 初始化尝试

也就是说，当前“页面能起来”的那条链，和“仓库里已经写好的配套初始化逻辑”并没有完全在一条线上。

### 4.3 并存的其他入口

仓库里至少还存在两套重要的并行入口：

1. `src/main.js`

- 包含更完整的样式与全局注册
- 包含 `initializeSecurity()`
- 包含 `showVersionNotifications()`
- 包含 session restore
- 包含 Service Worker 注册
- 还保留了实时集成初始化的占位代码
- 但其中已经明确打印：
  - `WebSocket integration暂时禁用 - realtimeIntegration.js 未实现`

2. `src/main-minimal.ts`

- 明显偏调试/测试用途
- 会向 `localStorage` 注入测试 token

### 4.4 启动层面的结构判断

当前前端的真实问题不是“没有入口”，而是“入口太多，且责任切分不清”：

- `main-standard.ts` 更像当前生产挂载入口
- `main.js` 更像历史上功能更完整的启动器
- `main-minimal.ts` 更像调试或 E2E 入口

如果继续维持这种状态，任何新功能都可能被加到“存在但未生效”的入口里，最后变成源码看起来有能力，实际运行却没启用。

## 5. 当前主路由链路

### 5.1 生效路由文件

当前生效路由是：

- `src/router/index.ts`

根路由统一挂到：

- `src/layouts/ArtDecoLayoutEnhanced.vue`

`App.vue` 本身几乎不承载业务逻辑，只做 `<router-view />` 包装，因此主路由文件和主布局文件就是前端运行时最重要的两层事实源。

### 5.2 路由守卫规则

当前全局路由守卫有两个核心行为：

1. 进入路由前设置 `document.title`
2. 调用 `authGuard`

`authGuard` 的当前规则是：

- 默认路由都需要认证
- 只有显式 `meta.requiresAuth === false` 才放开
- 未登录访问受保护页面时跳到 `/login`
- 已登录访问 `/login` 时回到首页

这意味着：认证默认是“封闭式”，不是“开放式”。

### 5.3 当前路由域划分

当前 `index.ts` 已经比较明确地把路由收敛为 7 个主业务域，加 1 组详情页：

| 业务域 | 主路径 | 默认子路由 | 代表页面组件 |
|---|---|---|---|
| 交易室 | `/dealing-room` | 本身即首页 | `ArtDecoDashboard.vue` |
| 市场行情 | `/market` | `/market/realtime` | `MarketRealtimeTab.vue` / `MarketKLineTab.vue` |
| 数据分析 | `/data` | `/data/industry` | `ArtDecoIndustryAnalysis.vue` / `FundFlowAnalysis.vue` |
| 自选管理 | `/watchlist` | `/watchlist/manage` | `WatchlistManager.vue` / `StrategySignalsTab.vue` |
| 策略管理 | `/strategy` | `/strategy/repo` | `ArtDecoStrategyManagement.vue` / `ArtDecoBacktestAnalysis.vue` |
| 交易管理 | `/trade` | `/trade/terminal` | `TradingDashboard.vue` / `ArtDecoSignalsView.vue` |
| 风险管理 | `/risk` | `/risk/overview` | `ArtDecoRiskManagement.vue` / `ArtDecoRiskAlerts.vue` |
| 系统设置 | `/system` | `/system/config` | `ArtDecoSystemSettings.vue` / `ArtDecoDataManagement.vue` |
| 详情页 | `/detail` | 无统一默认子路由 | `KLineAnalysis.vue` / `AnnouncementMonitor.vue` |

另有几条兼容路由：

- `/dashboard` 重定向到首页
- `/qm` 及 `/qm/*` 重定向到当前路径体系
- `/login`
- `/:pathMatch(.*)*`

### 5.4 路由总量现实

按当前源码统计，`src/router/index.ts` 中大约有 `36` 个具名路由节点。

这说明：

- 主业务路由本身并不算特别大
- 真正的复杂度不在路由总数
- 而在于“围绕这些路由同时存在多少并行配置源和历史结构”

## 6. 布局壳层、导航与页面配置的三套事实源

这是当前前端最关键的结构问题。

### 6.1 第一套：`src/router/index.ts`

它决定：

- 路由路径
- 页面组件
- 页面标题
- 部分路由级 API 元信息
- 是否需要认证

它是当前真正生效的运行时路由事实源。

### 6.2 第二套：`src/layouts/MenuConfig.ts`

它声明自己是 7 大业务域的菜单 SSOT，但现实上只真正承担了“侧边栏导航数据源”的职责。

它提供：

- 7 大业务域
- 子菜单路径
- label/icon/businessKey

但当前源码里没有给实际菜单项填入：

- `apiEndpoint`
- `wsChannel`
- `liveUpdate`

也就是说，它在运行时主要只是“静态导航树”，并不是完整的页面行为配置。

### 6.3 第三套：`src/config/pageConfig.ts`

这是自动生成文件，当前头部写得很清楚：

- 生成时间：`2026-03-08`
- `Routes processed: 35`

它包含：

- `apiEndpoint`
- `wsChannel`
- `component`
- `requiresAuth`

这套配置更接近“页面行为元数据表”，但它不是当前侧边栏和主布局的唯一来源。

### 6.4 第四套：`src/config/menu.config.js`

仓库里还保留着一套更旧的菜单配置。

它的问题不只是“旧”，而是里面包含多条当前主路由并没有采用的路径，例如：

- `/market/wencai`
- `/technical/indicators`
- `/stocks/management`
- `/stocks/portfolio`
- `/risk/announcement`

这说明它不是当前活跃导航链路，但仍然留在运行目录中，容易继续被误用。

### 6.5 三套配置之间的典型不一致

当前最典型的问题不是字段不同，而是“同一个页面的接口配置不一致”。

| 页面 | 路由 `meta.api` | `pageConfig.apiEndpoint` | 现状判断 |
|---|---|---|---|
| `dealing-room` | `/api/v1/market/overview` | `/api/dashboard/overview` | 首页数据来源定义不一致 |
| `market-realtime` | `/api/v1/market/quotes` | `/api/market/realtime` | 实时行情接口路径不一致 |
| `data-industry` | `/api/akshare_market/boards` | `/api/data/industry` | 数据分析页面后端指向不一致 |
| `watchlist-manage` | `/api/watchlist` | `/api/watchlist/manage` | 自选管理接口粒度不一致 |
| `strategy-repo` | `/api/v1/strategy/list` | `/api/strategy/repo` | 策略仓库接口路径不一致 |
| `trade-terminal` | 路由未声明 | `/api/trade/terminal` | 快速扫描后端未见明显对应端点 |

### 6.6 结构判断

当前前端不是“单一配置驱动前端”，而是：

- 路由一套
- 侧边栏一套
- 自动生成页面配置一套
- 旧菜单配置又一套

这会直接带来三类后果：

1. 菜单能点开，但页面真正请求哪个接口不明确  
2. 页面配置里写了 `wsChannel`，但布局层未必消费  
3. 任何新页面都不知道应该改哪一层才算“加完整了”  

## 7. 页面结构与展示层现实

### 7.1 当前页面组织方式

当前主页面逐步向 `artdeco-pages/` 集中，这是正确方向。

`artdeco-pages` 内部也有比较清晰的展示域分组：

- `market-tabs`
- `market-data-tabs`
- `stock-management-tabs`
- `strategy-tabs`
- `trading-tabs`
- `risk-tabs`
- `system-tabs`
- `analysis-tabs`
- `_templates`

从页面导入路径看，当前主路由大多数已经指向这些目录，而不是根目录的旧视图。

### 7.2 展示层的积极信号

当前主壳层 `ArtDecoLayoutEnhanced.vue` 已经承担了完整的应用框架职责：

- 侧边栏
- 顶栏
- 面包屑
- 内容过渡
- 命令面板
- 性能监视器

这说明前端已经有比较明确的“应用壳层”概念，而不是零散页面直挂。

### 7.3 展示层的现实问题

尽管主链路已收敛，但展示层仍然存在四个明显杂质源：

1. 旧布局仍在 `src/layouts` 中大量保留  
2. `src/views` 根目录仍散放很多非 ArtDeco 页面  
3. `demo`、`converted.archive`、`examples` 与生产页面混在同一视图树  
4. 部分页面是模板化展示，但后端数据绑定并不完整

这说明当前展示层虽然“看起来统一”，但内部仍处于迁移中。

### 7.4 页面是否都是真实业务页

不是。

当前至少可以把页面粗分成三类：

1. 主业务页  
   - 已进入 `ArtDeco` 壳层主导航  

2. 迁移页/实验页  
   - 保留在 `views/` 根目录或子目录  

3. demo/archive/example 页  
   - 明显不应继续与生产页面混放  

如果不把这三类边界切开，后续做页面收敛、路由治理、对外复用都会越来越难。

## 8. 状态管理、数据访问与实时链路

### 8.1 Store 现实

当前前端不是单一 store 组织方式，至少并存：

- 认证 store：`stores/auth.ts`
- UI 状态 store：例如 `menuStore`、`preferenceStore`
- API 工厂式 store / 示例 store
- 旧模板式 store

这说明当前状态管理并未完全收敛到一种统一模式。

### 8.2 认证与页面模板的契约漂移

认证 store 当前写入本地存储的是：

- `auth_token`
- `auth_user`

但模板化页面的权限判断逻辑读取的却是：

- `auth-store`

这意味着：页面模板层和认证 store 层并不共享同一份存储契约。

这类问题的危险不在于报错，而在于“静默失效”：

- 登录成功了，但模板权限判断未必跟着同步
- 页面可见性和真实权限状态可能脱节

### 8.3 侧边栏与命令面板的 UI 契约漂移

当前命令面板会调用 `menuStore.toggleSidebar()`，而实际侧边栏折叠状态来自 `preferenceStore.sidebarCollapsed`。

这意味着：

- 命令面板和侧边栏并不是通过同一状态源驱动
- 看似都是“切换侧边栏”，实际上改的是两套 store

命令面板还会跳到：

- `/market/stock/:symbol`

但当前主路由并没有这条路径；当前详情页实际走的是：

- `/detail/graphics/:symbol`
- `/detail/news/:symbol`

这说明当前展示层已有一部分交互仍停留在旧路由假设上。

### 8.4 HTTP 访问层并存

前端至少还保留了多套 API 包装：

- `src/api/apiClient.ts`
- `src/api/unifiedApiClient.ts`
- `src/services/httpClient.js`
- 以及其他 service facade

从结构角度看，这不是“封装得多”，而是“事实源不止一套”。

### 8.5 当前实时链路的真实状态

前端实时相关代码至少有三层：

1. `src/services/realtimeMarket.ts`
   - 直接连 `/api/ws/portfolio`
   - 调 `/api/realtime/*` 和 `/api/mtm/*`

2. `src/services/menuService.ts`
   - 通过 `${WS_BASE_URL}/ws` 做频道订阅

3. `src/composables/useLiveDataManager.ts`
   - 基于菜单项配置做统一订阅

但当前真正的问题在于：这三层没有被统一打通。

### 8.6 为什么当前“实时能力存在，但实际效果偏弱”

有三个直接原因：

1. 当前默认入口是 `main-standard.ts`
   - 它没有做任何安全/会话/实时初始化

2. `main.js` 中确实有实时初始化占位
   - 但当前又明确写着暂时禁用

3. `ArtDecoLayoutEnhanced.vue` 虽然调用了 `useLiveDataManager(ARTDECO_MENU_ITEMS)`，但 `MenuConfig.ts` 的实际菜单项里没有填任何：
   - `apiEndpoint`
   - `wsChannel`
   - `liveUpdate`

因此，`useLiveDataManager()` 最终从 `getLiveUpdateMenus()` 拿到的很可能是空集合，运行时等价于“建立了实时管理抽象，但没有真正激活频道”。

### 8.7 结构判断

当前前端实时链路的现实不是“没有”，而是：

- 配置写在 `pageConfig.ts`
- 布局层吃的是 `MenuConfig.ts`
- 默认入口又没有补齐统一初始化

结果就是：

- 代码中能看到实时框架
- 但运行时不一定真的连上预期频道

## 9. 旧结构与迁移残留

### 9.1 旧路由树仍在

`src/router/index.js` 仍然保留着老的嵌套路由和多布局体系：

- `MainLayout`
- `MarketLayout`
- `DataLayout`
- `RiskLayout`
- `StrategyLayout`

但当前默认入口并不走这套文件，而是走 `src/router/index.ts`。

这意味着旧路由并不是当前事实源，但仍然会继续制造理解成本和误改风险。

### 9.2 旧布局仍在

`src/layouts` 中仍保留大量历史布局文件。

这会带来两个问题：

- 新人很难第一时间判断哪套布局才是生效链路
- 老组件、旧路由、旧文档容易继续引用这些布局

### 9.3 迁移还没完成，但运行时已经部分切到新体系

这是当前前端的核心现实：

- 运行时主链路已经切到新 `ArtDeco` 路由与壳层
- 但配置层、展示层、页面目录、交互细节还没完全同步收敛

## 10. 结构风险清单

当前最值得优先处理的结构风险有六类：

1. 多启动入口并存  
   - 生产入口与完整初始化逻辑分离

2. 路由/菜单/页面配置不是单一事实源  
   - 同一页面对应多个接口定义

3. 实时配置与布局配置脱节  
   - `pageConfig` 有频道信息，`MenuConfig` 没有

4. 生产页、demo 页、archive 页混放  
   - 页面树规模越来越难治理

5. UI/权限/交互契约不一致  
   - `auth-store` vs `auth_token` / `auth_user`
   - `menuStore` vs `preferenceStore`
   - 命令面板路径与真实路由不一致

6. HTTP client / service facade 并存  
   - 新需求会继续放大重复层次

## 11. 收敛建议

### 11.1 P0：确定唯一生产入口

建议把入口收敛成：

- 一个真正生效的 `main.ts`

并把以下职责显式拆成插件或 composable：

- 安全初始化
- session restore
- 版本协商
- PWA 注册
- 实时初始化

这样才能避免“功能写在另一个入口文件里”的漂移。

### 11.2 P0：把路由、菜单、页面配置合成单一清单

建议产出一个真正的前端清单层，例如：

```text
route-manifest.ts
  - path
  - name
  - component
  - title
  - menu label/icon
  - apiEndpoint
  - wsChannel
  - auth
  - page kind
```

然后让：

- 路由
- 侧边栏
- 命令面板
- 页面行为配置
- 实时订阅配置

都从这一层派生。

### 11.3 P1：把页面分层

至少应把页面明确标成三类：

- `prod`
- `mock/demo`
- `archive/experimental`

然后把 `demo` 和 `archive` 从主导航、主路由和生产构建认知中剥离出去。

### 11.4 P1：统一数据访问层

建议只保留：

- 一套 `apiClient`
- 一套 service facade 组织方式
- 一套页面数据拉取约定

否则路由 `meta.api`、`pageConfig.apiEndpoint`、service hardcode 会持续互相打架。

### 11.5 P1：统一实时接入模式

建议明确只保留一条前端实时主链路：

```text
route/page manifest
  -> realtime adapter
     -> ws/sse client
        -> store or page state
```

而不是当前这种：

- `menuService`
- `realtimeMarketService`
- `pageConfig wsChannel`
- `main.js` 初始化占位

同时存在，但没有完全打通。

### 11.6 P2：归档旧布局和旧路由

建议把以下内容迁出运行目录或至少标记为 legacy：

- `src/router/index.js`
- 不再被当前主链使用的布局文件
- 明显只服务旧导航结构的组件

## 12. 对外复用视角：如果要把前端作为插件或可嵌入模块

如果后续想把这套前端能力作为其他项目的 plugin 或嵌入式前端模块复用，当前最适合抽的不是“整个 `web/frontend`”，而是以下四层：

1. 壳层组件包  
   - `ArtDecoLayoutEnhanced`
   - Sidebar / Header / Breadcrumb / CommandPalette / PerformanceMonitor

2. 路由与页面清单包  
   - 路径、标题、图标、鉴权、API、实时配置

3. 数据适配器包  
   - REST / WebSocket / SSE 的统一接入适配层

4. 主题与设计令牌包  
   - `artdeco-global` / `artdeco-financial` / `fintech-design-system`

不建议直接复用当前整个前端目录，原因很简单：

- 迁移残留太多
- demo/archive 太多
- 入口、配置、实时链路尚未统一

更合理的做法是先完成一次前端事实收敛，再按“壳层 + manifest + adapter + theme”四层拆出可复用模块。

## 13. 最终判断

当前这个前端已经具备一个比较完整的量化交易可视化平台外形，但内部仍然处于“新主链已成型、旧结构未清理、配置还没统一”的阶段。

因此，后续优化顺序不应是“继续加功能”，而应是：

1. 统一入口  
2. 统一路由/菜单/页面配置  
3. 统一数据/实时接入  
4. 清理 demo/archive/legacy  

做完这四步之后，这个前端才真正适合谈：

- 大规模页面扩展
- 作为插件复用
- 对接其他项目
- 做更严格的设计系统化治理
