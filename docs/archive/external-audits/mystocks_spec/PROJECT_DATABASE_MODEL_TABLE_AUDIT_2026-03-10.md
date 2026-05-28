# MyStocks Spec 数据库 / 模型 / 表关系审计

日期：2026-03-10  
范围：`/opt/claude/mystocks_spec`  
目的：把当前项目中“数据库入口、ORM 模型、表清单、真实读写路径、同步落表路径、结构断裂点”系统化整理出来，作为后续数据库收敛和模型治理的工作底稿。

## 1. 说明

- 本文以当前源码为准，不以旧文档、历史架构图或命名约定为准。
- 本文重点回答四个问题：
  - 当前到底有几套数据库访问现实。
  - 哪些表是 Web 侧显式建模的，哪些是脚本/平台层直接操作的。
  - 哪些读写路径已经脱节。
  - 如果要做收敛，先该动哪里。
- 本文是“事实审计文档”，不是最终架构定稿。
- 当前会话无法直接写回 `/opt/claude/mystocks_spec`，因此文档导出到可写目录：
  - `/opt/claude/GitNexus/tmp_exports/mystocks_spec/`

## 2. 一句话结论

这个项目当前不是“一套统一数据库模型”，而是至少三套并存的持久化现实：

1. `web/backend` 运行时现实：已经明显偏向 `PostgreSQL-only`。
2. `src/` 平台层现实：仍然按 `TDengine + PostgreSQL` 双库自动路由设计运行。
3. `scripts/maintenance/data_sync` 与 `config/pm2` 的运行配置现实：仍保留旧路径、旧分类名、旧导入方式。

因此，当前项目最核心的问题不是“缺表”，而是：

- 表定义分散
- `Base` 元数据分散
- 同一业务概念多套命名
- 读写入口不统一
- 同步脚本与配置已经发生路径漂移
- 枚举名和脚本调用已经发生兼容性断裂

如果不先做“数据库事实收敛”，后续无论做 Web 优化、MCP 接入、插件化、前后端协同，都会持续踩到隐性结构债。

## 3. 当前数据库现实地图

### 3.1 Web 运行时数据库现实

Web 主入口文件是：

- `web/backend/app/core/database.py`

从源码可确认：

- 第 89 行定义了 `Base = declarative_base()`。
- 第 96-127 行的主引擎实现只创建 PostgreSQL engine。
- 第 138-148 行把 `get_mysql_engine()` / `get_mysql_session()` 直接重定向到 PostgreSQL。
- 第 185-346 行的 `DatabaseService` 只围绕 PostgreSQL 工作。
- 第 226-346 行里直接封装了对以下表的查询：
  - `symbols_info`
  - `daily_kline`
  - `concepts`
- 第 361-372 行暴露了 FastAPI 依赖注入入口：
  - `get_db()`
  - `SessionLocal`

这意味着：

- Web API 层已经不再按“三库”或“多库抽象”运行。
- Web 主链路是“PostgreSQL + Redis 缓存辅助”的简化实现。
- 但 Web 中并不是所有服务都真正走这个统一入口，后文会看到大量旁路连接。

### 3.2 平台层数据库现实

平台层核心仍然保留双库架构：

- `src/core/data_classification.py`
- `src/core/infrastructure/data_router.py`
- `src/core/data_manager.py`
- `src/core/unified_manager.py`
- `src/storage/database/connection_manager.py`

从源码可确认：

- `src/core/data_classification.py` 第 36-93 行定义了完整的五大类数据分类。
- 其中：
  - `TICK_DATA`、`MINUTE_KLINE` 等高频时序走 TDengine
  - `DAILY_KLINE`、`SYMBOLS_INFO`、`INDUSTRY_CLASS`、`CONCEPT_CLASS` 等走 PostgreSQL
- `src/core/infrastructure/data_router.py` 第 13-53 行明确写死了默认路由表。
- `src/core/unified_manager.py` 第 111-114 行初始化日志仍明确输出：
  - 支持 34 个数据分类的自动路由
  - 2 种数据库连接就绪（TDengine + PostgreSQL）
- `src/storage/database/connection_manager.py` 第 34-47 行要求环境变量中同时存在：
  - TDengine 连接参数
  - PostgreSQL 连接参数

这意味着：

- 平台层没有真正收敛到 PostgreSQL-only。
- Web 层和平台层对“系统数据库现实”的理解并不一致。
- 脚本层如果依赖 `MyStocksUnifiedManager`，就仍然会被双库路由逻辑影响。

### 3.3 当前真实判断

当前项目并不存在单一数据库事实源，而是：

- Web 主链路：更接近 PostgreSQL-only
- 平台数据层：仍是双库抽象
- ETL/同步层：介于旧路径和新架构之间

这会直接造成三类后果：

- 同一张表可能没有明确唯一 owner
- 同一业务概念在 Web/平台/脚本层命名不一致
- 迁移、建表、测试、初始化时无法依赖一套统一的 SQLAlchemy metadata

## 4. Web 主数据库入口梳理

### 4.1 主入口文件

文件：

- `web/backend/app/core/database.py`

关键事实：

- 第 89 行：`Base = declarative_base()`
- 第 110 行：创建 PostgreSQL engine
- 第 134 行：创建 PostgreSQL `sessionmaker`
- 第 138-148 行：MySQL 兼容别名全部重定向到 PostgreSQL
- 第 185-346 行：`DatabaseService`
- 第 350 行：全局 `db_service`
- 第 362 行：`get_db()`
- 第 372 行：`SessionLocal`

### 4.2 这个入口真正覆盖了什么

`DatabaseService` 当前只明确覆盖三类直接查询：

| 方法 | 表 | 用途 |
| --- | --- | --- |
| `query_stocks_basic` | `symbols_info` | 股票基础信息查询 |
| `query_daily_kline` | `daily_kline` | 日线查询 |
| `query_concepts` | `concepts` | 概念列表查询 |

这里有一个很重要的现实：

- `symbols_info`
- `daily_kline`
- `concepts`

这三张表都不是通过 Web 这一套 ORM 模型显式统一管理出来的，而是直接查询。

这说明：

- Web 主数据库入口并不等于“Web 全部表模型入口”
- 一部分核心业务表是“运行时访问存在，但模型治理不统一”

### 4.3 直接暴露出的语义偏差

当前至少存在以下“概念上相似但实现上分离”的情况：

- `symbols_info`：平台/同步/数据库服务广泛使用
- `stock_info`：Web ORM 中另有一张表

这两者从命名上都像“股票主数据表”，但源码里没有看到统一映射关系。  
这类同义概念双表，是后续收敛时必须重点确认的对象。

## 5. Web ORM 模型与表清单

## 5.1 第一层判断：不是一套统一 Base

在 `web/backend/app` 与 `src/` 下搜索 `Base = declarative_base()`，可见至少 `16` 处定义。

这意味着：

- 当前不是“一套 metadata 注册所有 ORM 表”
- 很多模型文件都在私自创建自己的 `Base`
- 单次 `Base.metadata.create_all()` 无法覆盖全量表
- Alembic 或测试建表如果绑定了错误的 `Base`，会天然漏表

### 5.2 共享 `app.core.database.Base` 的模型

这一组最接近“Web 主数据库入口”：

| 文件 | 表 |
| --- | --- |
| `web/backend/app/models/indicator_data.py` | `indicator_data`, `indicator_tasks` |
| `web/backend/app/models/wencai_data.py` | `wencai_queries` |
| `web/backend/app/api/contract/models.py` | `mystocks.contract_versions`, `mystocks.contract_diffs`, `mystocks.contract_validations` |

补充说明：

- `wencai_data.py` 明确写明结果表不是预定义 ORM，而是通过 `pandas.to_sql()` 动态创建。
- `contract/models.py` 是当前少数显式指定 schema 的模型组，schema 为 `mystocks`。

### 5.3 共享 `app.models.monitoring.Base` 的模型

这是一组局部统一、但并不接入 `app.core.database.Base` 的模型：

| 文件 | 表 |
| --- | --- |
| `web/backend/app/models/monitoring.py` | `alert_rule`, `alert_record`, `realtime_monitoring`, `dragon_tiger_list`, `monitoring_statistics` |
| `web/backend/app/models/announcement.py` | `announcement`, `announcement_monitor_rule`, `announcement_monitor_record` |

这里的关键点不是表名，而是：

- `announcement.py` 使用的不是 `app.core.database.Base`
- 它复用了 `app.models.monitoring.Base`

这说明：

- 公告域和监控域在 metadata 上绑定在一起
- 但又整体脱离了 Web 主入口 `Base`

### 5.4 各自自建 `Base` 的模型

以下模型文件都单独定义了自己的 `Base`：

| 文件 | 表 |
| --- | --- |
| `web/backend/app/models/market_data.py` | `stock_fund_flow`, `etf_spot_data`, `cn_stock_chip_race_open`, `cn_stock_chip_race_end`, `stock_lhb_detail`, `sector_fund_flow`, `stock_dividend`, `stock_blocktrade` |
| `web/backend/app/models/user.py` | `users`, `user_tokens` |
| `web/backend/app/models/rbac.py` | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `user_sessions`, `audit_logs`, `security_events` |
| `web/backend/app/models/strategy.py` | `strategy_definition`, `strategy_result`, `strategy_backtest` |
| `web/backend/app/models/stock.py` | `stock_info` |
| `web/backend/app/models/indicator_config.py` | `indicator_configurations` |
| `web/backend/app/models/sync_message.py` | `sync_message`, `sync_statistics` |

### 5.5 模型层最危险的问题：重复 `users` 表定义

`users` 表被至少定义了两次：

- `web/backend/app/models/user.py`
- `web/backend/app/models/rbac.py`

而且两次定义的结构并不一致：

- `user.py` 中 `id` 是整数自增
- `rbac.py` 中 `id` 是 PostgreSQL UUID
- 字段集合也不同：
  - `user.py` 偏轻量账号表
  - `rbac.py` 偏完整认证/授权/安全域用户表

这不是“代码重复”那么简单，而是：

- 同一张物理表可能被两套完全不同的结构假定
- 任何 ORM 写入、迁移、建表、查询都可能出现语义冲突
- 用户域是当前数据库收敛的最高风险点之一

### 5.6 相关但不一致的模型组

还有几组值得特别注意：

- 指标域：
  - `indicator_data.py` 使用 `app.core.database.Base`
  - `indicator_config.py` 却使用独立 `Base`
- 股票主数据域：
  - `stock.py` 定义 `stock_info`
  - 平台/同步/查询却大量使用 `symbols_info`
- 公告域：
  - 绑定在 `monitoring.Base`
  - 不是 Web 主数据库 `Base`

这说明当前模型分组不是按“业务域统一”组织，而是按“文件或迭代历史”组织出来的。

## 6. Repository 层附加表

除 `app/models` 外，`app/repositories` 还直接定义了多组 ORM 表。

### 6.1 回测仓库

文件：

- `web/backend/app/repositories/backtest_repository.py`

表：

- `backtest_results`
- `backtest_equity_curves`
- `backtest_trades`

这组表有自己独立的 `Base`。

### 6.2 策略仓库

文件：

- `web/backend/app/repositories/strategy_repository.py`

表：

- `user_strategies`

这组表也有自己独立的 `Base`。

### 6.3 算法模型仓库

文件：

- `web/backend/app/repositories/algorithm_model_repository/helpers.py`

表：

- `algorithm_models`
- `training_history`
- `prediction_history`

需要特别指出：

- `helpers.py` 定义了一套 `Base`
- `algorithm_model_repository_methods/part1.py`
- `algorithm_model_repository_methods/part2.py`

这两个切分文件里也再次定义了 `Base`

这说明仓库层不仅和 Web 主入口分离，仓库内部自己也出现了 metadata 冗余。

## 7. 平台层 / DDD 持久化表

文件：

- `src/infrastructure/persistence/models.py`

表：

- `ddd_strategies`
- `ddd_portfolios`
- `ddd_positions`
- `ddd_orders`
- `ddd_transactions`

这一层表不是 Web Backend 的那套模型，而是平台层/领域层持久化实现。

这代表当前仓库里至少并存两类“策略 / 交易 / 持仓”数据表思路：

- Web 后台面向业务页面的策略/回测/用户策略表
- DDD/平台层面向领域对象的持久化表

如果不定义 owner，很容易出现：

- 功能重复
- 数据来源重复
- 同一业务动作落到两套表

## 8. 合同 / 治理类表

文件：

- `web/backend/app/api/contract/models.py`

表：

- `mystocks.contract_versions`
- `mystocks.contract_diffs`
- `mystocks.contract_validations`

这组表有两个特点：

- 使用 `app.core.database.Base`
- 显式写入 `mystocks` schema

这说明当前项目并不是所有表都在默认 schema 下。

后续做数据库文档或迁移收敛时，至少要把以下维度加进去：

- 表名
- schema
- owner 模块
- 写入方
- 读取方

否则 schema 级别的差异会被忽略。

## 9. 服务层直连数据库现状

## 9.1 结论先行

虽然 `web/backend/app/core/database.py` 已经提供了统一入口，但大量服务并没有走它。

典型旁路连接包括：

- `web/backend/app/services/strategy_service.py`
- `web/backend/app/services/monitoring_service.py`
- `web/backend/app/services/announcement_service.py`
- `web/backend/app/services/market_data_service_v2.py`
- `web/backend/app/services/market_data_service/market_data_service_methods/part1.py`

这些文件都在类初始化时自己：

- 组装 DB URL
- `create_engine(...)`
- `sessionmaker(...)`

### 9.2 服务到表的大致映射

| 服务 | 主要访问表 |
| --- | --- |
| `StrategyService` | `strategy_definition`, `strategy_result` |
| `MonitoringService` | `alert_rule`, `alert_record`, `dragon_tiger_list`, `realtime_monitoring` |
| `AnnouncementService` | `announcement`, `announcement_monitor_rule`, `announcement_monitor_record` |
| `MarketDataServiceV2` | `stock_fund_flow`, `etf_spot_data`, `stock_lhb_detail`, `sector_fund_flow`, `stock_dividend`, `stock_blocktrade` |
| `MarketDataService` | `stock_fund_flow`, `etf_spot_data`, `cn_stock_chip_race_open`, `cn_stock_chip_race_end`, `stock_lhb_detail` |

### 9.3 为什么这是结构风险

这不是简单的“写法不统一”，而是会带来实际工程问题：

- 会话生命周期不统一
- 连接池参数不统一
- 测试替身注入难
- 事务边界不一致
- 数据库切换成本高
- 框架级中间件无法统一控制 DB 访问

换句话说：

- `get_db()` 存在
- 但不等于“系统真正统一使用 `get_db()`”

## 10. 关键表的当前读写现实

这一节不追求穷尽全表，而是先抓当前项目最核心、最能反映结构问题的表。

### 10.1 `symbols_info`

当前角色：

- 股票主参考数据

当前已确认写入方：

- `scripts/maintenance/data_sync/sync_stock_basic.py`
  - 增量同步时：
    - 先读 `symbols_info`
    - 再执行 `upsert_dataframe("symbols_info", ...)`
  - 全量同步时：
    - `delete("symbols_info", "1=1")`
    - 再 `insert_dataframe("symbols_info", ...)`

当前已确认读取方：

- `web/backend/app/core/database.py` 的 `query_stocks_basic`
- `scripts/maintenance/data_sync/sync_stock_kline.py`
- `scripts/maintenance/data_sync/sync_minute_kline.py`
- `scripts/maintenance/data_sync/sync_stock_industry_concept.py`

当前风险：

- `stock_info` 表与其语义重叠可能性高
- Web 模型层没有围绕 `symbols_info` 做统一 ORM 治理

### 10.2 `daily_kline`

当前角色：

- 股票日线数据

当前已确认写入方：

- `scripts/maintenance/data_sync/sync_stock_kline.py`
  - 使用 `MyStocksUnifiedManager.save_data_by_classification(...)`
  - 分类：`DataClassification.DAILY_KLINE`
  - 目标表：`daily_kline`

当前已确认读取方：

- `web/backend/app/core/database.py` 的 `query_daily_kline`
- `scripts/maintenance/data_sync/sync_stock_kline.py` 中的历史最大日期查询

当前判断：

- 从路由规则看，它应落 PostgreSQL
- 从 Web 查询实现看，它也被当作 PostgreSQL 表使用
- 这是目前少数平台层与 Web 层认知较一致的核心表

### 10.3 `minute_kline_*`

当前角色：

- 分钟级时序数据

当前已确认写入方：

- `scripts/maintenance/data_sync/sync_minute_kline.py`
  - 表名动态生成：
    - `minute_kline_1min`
    - `minute_kline_5min`
    - `minute_kline_15min`
    - `minute_kline_30min`
    - `minute_kline_60min`
  - 保存分类：`DataClassification.TICK_DATA`

当前判断：

- 按 `DataRouter` 规则会路由到 TDengine
- 这部分和 Web ORM 基本没有统一

### 10.4 `industry_classifications`

当前角色：

- 行业分类参考数据

当前已确认写入方：

- `scripts/maintenance/data_sync/sync_industry_classify.py`

当前风险：

- 脚本调用的是 `DataClassification.REFERENCE_DATA`
- 但当前 `src/core/data_classification.py` 中已经没有 `REFERENCE_DATA`

因此这一脚本当前很可能根本无法正常运行到保存阶段。

### 10.5 `concept_classifications`

当前角色：

- 概念分类参考数据

当前已确认写入方：

- `scripts/maintenance/data_sync/sync_concept_classify.py`

当前风险与 `industry_classifications` 相同：

- 依赖已不存在的 `DataClassification.REFERENCE_DATA`

### 10.6 `stock_industry_concept_relations`

当前角色：

- 股票与行业/概念关系表

当前已确认写入方：

- `scripts/maintenance/data_sync/sync_stock_industry_concept.py`

当前读取方：

- 脚本本身先读取 `symbols_info`

当前风险：

- 同样依赖 `DataClassification.REFERENCE_DATA`

### 10.7 `concepts`

当前角色：

- 概念列表

当前已确认读取方：

- `web/backend/app/core/database.py` 的 `query_concepts`

当前疑点：

- 在 Web ORM 模型清单中未看到显式 `concepts` 模型
- 在当前已核对的同步脚本里也没有直接看到其明确落表路径

这类表属于：

- 运行时依赖存在
- 但 ownership 和建模边界不清晰

## 11. 同步脚本与落表路径

这一节是整个审计里最需要马上处理的部分，因为它直接影响“数据是不是还在按预期进库”。

### 11.1 `sync_stock_basic.py`

文件：

- `scripts/maintenance/data_sync/sync_stock_basic.py`

已确认事实：

- 第 15 行导入：`from scripts.data_sync.base_data_source import BaseDataSource`
- 但当前真实文件已位于：
  - `scripts/maintenance/data_sync/base_data_source.py`
- 读表：
  - `symbols_info`
- 写表：
  - `symbols_info`

当前判断：

- 表层逻辑是合理的
- 但导入路径已经失效，脚本入口本身就存在启动失败风险

### 11.2 `sync_stock_kline.py`

文件：

- `scripts/maintenance/data_sync/sync_stock_kline.py`

已确认事实：

- 第 16 行导入旧路径：`scripts.data_sync.base_data_source`
- 第 123-127 行读取股票列表时调用：
  - `classification=DataClassification.REFERENCE_DATA`
  - `table_name="symbols_info"`
- 第 204-210 行保存时调用：
  - `classification=DataClassification.DAILY_KLINE`
  - `table_name="daily_kline"`

当前判断：

- 这份脚本同时存在两个问题：
  - 导入路径失效
  - 分类枚举失效
- 即便 `daily_kline` 目标表逻辑本身合理，脚本也可能在进入主流程前就失败

### 11.3 `sync_minute_kline.py`

文件：

- `scripts/maintenance/data_sync/sync_minute_kline.py`

已确认事实：

- 读取股票列表时使用：
  - `DataClassification.SYMBOLS_INFO`
  - `symbols_info`
- 保存分钟线时使用：
  - `DataClassification.TICK_DATA`
  - 动态表名 `minute_kline_*`

当前判断：

- 这份脚本相对更接近当前 `DataClassification` 现实
- 它是同步脚本里“结构上最接近能工作”的一份

### 11.4 `sync_industry_classify.py`

文件：

- `scripts/maintenance/data_sync/sync_industry_classify.py`

已确认事实：

- 目标表：`industry_classifications`
- 保存分类：`DataClassification.REFERENCE_DATA`

当前判断：

- 按当前枚举定义，这里已经断裂

### 11.5 `sync_concept_classify.py`

文件：

- `scripts/maintenance/data_sync/sync_concept_classify.py`

已确认事实：

- 目标表：`concept_classifications`
- 保存分类：`DataClassification.REFERENCE_DATA`

当前判断：

- 与行业脚本同样断裂

### 11.6 `sync_stock_industry_concept.py`

文件：

- `scripts/maintenance/data_sync/sync_stock_industry_concept.py`

已确认事实：

- 先读取：
  - `DataClassification.SYMBOLS_INFO`
  - `symbols_info`
- 再写入：
  - `DataClassification.REFERENCE_DATA`
  - `stock_industry_concept_relations`

当前判断：

- 读取侧与当前枚举兼容
- 写入侧与当前枚举不兼容

## 12. PM2 / 运行配置路径漂移

### 12.1 当前配置仍指向旧脚本目录

以下配置文件仍在引用旧路径：

- `config/ecosystem.config.js`
- `config/ecosystem.production.config.js`
- `config/pm2/ecosystem.config.js`
- `config/pm2/ecosystem.production.config.js`
- `config/pm2/ecosystem.enhanced.config.js`

典型引用形式：

- `scripts/data_sync/sync_stock_basic.py`
- `scripts/data_sync/sync_stock_kline.py`
- `scripts/data_sync/sync_minute_kline.py`
- `scripts/data_sync/sync_industry_classify.py`
- `scripts/data_sync/sync_concept_classify.py`
- `scripts/data_sync/sync_stock_industry_concept.py`

但当前真实脚本目录已经变成：

- `scripts/maintenance/data_sync/`

### 12.2 这不是文档问题，而是运行问题

这意味着即使脚本代码没坏，PM2 也可能直接找不到文件。

当前同步链路至少存在两层断裂：

1. PM2 配置仍指向旧路径
2. 脚本内部 import 也仍指向旧模块路径

## 13. 旧路径导入错误的可复现实证

在当前项目根目录执行导入检查，结果为：

```text
scripts.data_sync.base_data_source -> ERROR: ModuleNotFoundError No module named 'scripts.data_sync'
scripts.maintenance.data_sync.base_data_source -> /opt/claude/mystocks_spec/scripts/maintenance/data_sync/base_data_source.py
```

这说明：

- 旧 import 路径不是“理论过时”
- 而是已经可以稳定复现失败

## 14. 枚举兼容性断裂：`REFERENCE_DATA` 已不存在

### 14.1 当前枚举现实

`src/core/data_classification.py` 当前定义的参考数据类是细分项：

- `SYMBOLS_INFO`
- `CONTRACT_INFO`
- `CONSTITUENT_INFO`
- `TRADE_CALENDAR`
- `INDUSTRY_CLASS`
- `CONCEPT_CLASS`
- `INDEX_CONSTITUENTS`
- `FUNDAMENTAL_METRICS`
- `DIVIDEND_DATA`
- `SHAREHOLDER_DATA`
- `MARKET_RULES`

当前文件中没有：

- `REFERENCE_DATA`

### 14.2 但脚本和配置仍大量使用旧分类语义

仍能看到 `REFERENCE_DATA` 的位置包括：

- 多个同步脚本
- `config/data_sources_registry.yaml`
- 多份测试
- 若干历史脚本/SQL 注释

当前判断：

- 枚举设计已经收敛到“细粒度分类”
- 但调用方还停留在“粗粒度 REFERENCE_DATA”

这类问题最危险的点在于：

- 它不会造成“代码看起来有问题”
- 但会在运行时直接抛异常或走不到目标路由

## 15. 结构偏差与风险列表

### 15.1 风险 A：`Base` 元数据高度分散

现象：

- 至少 16 处 `declarative_base()`

影响：

- 建表不完整
- 测试表不完整
- 迁移覆盖不完整
- 代码阅读成本高

### 15.2 风险 B：同一业务概念有多套表或多套模型

典型表现：

- `users` 表被定义两次
- `symbols_info` vs `stock_info`
- 指标域模型跨两个 `Base`

影响：

- 表结构假设冲突
- 业务 owner 不明确
- 数据迁移风险高

### 15.3 风险 C：服务层绕开统一数据库入口

现象：

- 多个服务自己建 engine / session

影响：

- 无法形成统一事务和依赖注入边界
- 数据库接入方式收敛难度变大

### 15.4 风险 D：脚本路径和 PM2 配置已经漂移

现象：

- PM2 仍指向 `scripts/data_sync/*`
- 实际文件在 `scripts/maintenance/data_sync/*`

影响：

- 调度链路可能根本未运行

### 15.5 风险 E：同步脚本与数据分类枚举断裂

现象：

- 多脚本仍使用 `DataClassification.REFERENCE_DATA`

影响：

- 同步流程会在运行时失败
- 数据不再更新，但表面上可能只留下日志噪音

### 15.6 风险 F：动态表和显式模型并存

典型表现：

- `wencai_queries` 有 ORM
- 问财结果表动态 `to_sql()`

影响：

- 表治理和文档治理更难
- 难以通过统一元数据做 schema 管理

## 16. 收敛建议

这里不讨论“大改重构理想态”，只给当前仓库最现实、最值得优先执行的收敛顺序。

### 16.1 第一优先级：先修运行断裂

先处理下面三件事，否则数据库梳理再细也会被“同步根本没跑”抵消：

1. 统一 PM2 配置中的脚本路径到 `scripts/maintenance/data_sync/`
2. 修复脚本中的旧 import：
   - `scripts.data_sync.base_data_source`
   - 改为当前真实模块路径
3. 把所有 `REFERENCE_DATA` 调用改为当前真实细分类：
   - `SYMBOLS_INFO`
   - `INDUSTRY_CLASS`
   - `CONCEPT_CLASS`
   - 或按实际目标表进一步细分

### 16.2 第二优先级：输出“表 owner 清单”

建议立刻为核心表补一张 owner 表，字段至少包含：

- 物理表名
- schema
- 数据库类型
- 主写入方
- 主读取方
- ORM 所属 Base
- 是否动态建表
- 是否已在生产同步链路使用

最先覆盖的表建议是：

- `symbols_info`
- `daily_kline`
- `minute_kline_*`
- `industry_classifications`
- `concept_classifications`
- `stock_industry_concept_relations`
- `users`
- `strategy_definition`
- `strategy_result`
- `backtest_results`

### 16.3 第三优先级：统一 `Base` 策略

建议不要一上来“全项目只保留一个 Base”，而是先做分层收敛：

第一步：

- 先规定 Web Backend 的唯一主 `Base`
- 明确哪些模型必须并入它

第二步：

- 对 repository 层“边写边定义 ORM”的文件做拆分
- 把 ORM model 与 repository class 分离

第三步：

- 再评估平台层 DDD 模型是否保持独立 `Base`

现实目标不是“一夜归一”，而是先从“16 处 Base”收敛到“少数受控 Base”。

### 16.4 第四优先级：统一用户域表

`users` 表冲突必须尽早解决。

建议动作：

1. 确认生产真实物理表结构
2. 确认业务到底采用：
   - 轻量用户模型
   - 还是 RBAC 用户模型
3. 废弃另一套定义，或改名拆表
4. 统一登录、认证、权限、token、session、audit 的 owner

这件事不解决，其它治理工作都会不断被用户域打断。

### 16.5 第五优先级：统一 Web 服务层 DB 接入

建议目标：

- 所有 Web 服务先统一通过同一 DB session 工厂获取 session

不一定一步到位改成完整 Repository Pattern，但至少应先做到：

- 不再每个服务自己创建 engine
- 不再每个服务自己组装连接串
- 不再每个服务自己决定连接池参数

### 16.6 第六优先级：明确“平台表”和“后台表”的边界

目前至少存在两类持久化风格：

- 平台 / DDD 表
- Web 后台业务表

建议明确划分：

- 哪些表属于“平台事实数据”
- 哪些表属于“后台管理和展示”
- 哪些表属于“衍生结果和分析”

否则后续继续开发时，很容易重复造表。

## 17. 最值得马上核对的 10 个对象

如果你准备立刻开始数据库收敛，建议先按下面 10 个对象做逐项确认：

1. `users`
2. `symbols_info`
3. `stock_info`
4. `daily_kline`
5. `minute_kline_*`
6. `industry_classifications`
7. `concept_classifications`
8. `stock_industry_concept_relations`
9. `strategy_definition` / `strategy_result`
10. `backtest_results`

这 10 个对象能覆盖：

- 用户域
- 主数据域
- 核心行情域
- 同步落表域
- 策略/回测域

## 18. 最终判断

从当前源码看，项目数据库问题的本质不是“表不够多”或“模型不够全”，而是：

- 数据库访问现实分裂
- 元数据注册分裂
- 脚本和配置漂移
- 旧架构语义和新架构语义混用

所以最合理的数据库优化路径不是先补更多 ORM，而是先做四件事：

1. 修同步链路
2. 定表 owner
3. 收 `Base`
4. 收 DB 入口

这四步完成后，再去谈：

- MCP 化输出数据库上下文
- 作为 plugin 复用项目能力
- 前后端统一契约
- 自动生成 ER / wiki / 数据字典

那时才会真正进入“可复用、可治理、可演进”的阶段。
