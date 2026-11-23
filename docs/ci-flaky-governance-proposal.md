# CI flaky 治理方案（诊断报告 + 治理提案）

> **状态**：待审核（本文档只做诊断与提案，未改动任何代码/workflow）
> **排查窗口**：2026-11-20 ~ 2026-11-23（upstream `abhigyanpatwari/GitNexus` 最近 100 个已完成 run）
> **排查方法**：systematic-debugging Phase 1-3（逐 run 下载日志归因，未跳过任何失败 run）
> **证据留档**：`/tmp/opencode/log-*.txt`（15 个失败 run 的关键 job 日志）、`/tmp/opencode/failjob-details.json`（全部失败 job 明细）
> **日期**：2026-11-23

---

## 1. 一句话结论

**"连续多日随机红"不是测试 flake，而是三类确定性失败 + 一层镜像放大器叠加出的观感失真。**
4 天内 13 次 CI Gate 红，逐个归因后每一个都有明确、可复现的根因；真正的环境性 flake 只有 2 次（都在 Windows 原生 runner），占比最低。

---

## 2. 数据总览

| 指标 | 数值 |
|---|---|
| 窗口内失败 run | 15 个（13 个 CI Gate 红） |
| 按日分布 | 11-20 ×4，11-21 ×7，11-22 ×1，11-23 ×3 |
| `platform-sensitive N/3` 红（镜像门禁，跑在 ubuntu） | **60 次 / 10 个 run / 4 天** |
| `platform-sensitive N/11` 红（真原生分片） | **仅 2 次**（windows 11-20、11-21） |
| 同-SHA 重跑（attempt ≥2） | **0 次** → 真 flake 率无法从历史统计 |

**放大倍数**：1 个 ubuntu 测试红 → coverage-reports artifact 缺失 → test-completeness 红 → 6 个镜像 job 红 + SonarQube 红 + CI Gate 红 ≈ **9+ 个红 check**。
→ **~96% 的 "platform-sensitive 红" 是 completeness 失败的镜像放大，不是真的 platform 分片失败。**

### 镜像门禁的实证

- `protected-platform-checks` 定义在 `.github/workflows/ci-tests.yml` 772-799 行附近：在 **ubuntu** 上运行，仅复述 `test-completeness` 的结果。
- 命名与真分片完全同格式（`tests / windows-latest (platform-sensitive) N/3` vs 真分片 `N/11`），肉眼不可区分。
- 日志证据（run 45098222120，job 137455163856 / 137455163862）：步骤明确打印
  `NATIVE_RESULT: success, EXECUTION_RESULT: failure → exit 1` —— 原生 windows/macos 全绿，镜像照样红。

---

## 3. 根因分类账（逐日）

| 日期 | 根因 | 证据（run / job） |
|---|---|---|
| 11-23 | ① **源码扫描守卫被 PR 内容触发**：`literal-collectors.test.ts:119`（Mode 4 registry resolution 层，`expect(...some(n => /^[A-Z]/.test(n.literal))).toBe(false)` got true）→ ubuntu coverage 红 → 级联全红。同分支修复后 run 45113134917 转绿（内容相关，非 flake）。② **perf 基线漂移**：`parse cache / speed and memory (real)` 报 `Graph parsedDigest differs for cold`（确定性破坏）+ `indexing / lexical lookup and cache interning` 预算红 | run 45098222120 @2c9c9f15；run 45141560817 @c5fee787 |
| 11-22 | **eval containment sandbox 矛盾报错**：`test_all_pinned_proposal_graders` 报 `SandboxError: offline CLI preflight with GitNexus failed: 2/2 successful tool results` —— 2/2 全成功却判失败，疑似 SandboxError 分类 bug → evidence 被拒 → completeness 红 → 6 镜像红 | run 45024535499 (fix/wiki-regroup @2d42b87c)，job 137243162244 |
| 11-21 | **main 侧共享破坏打满全天**：locked pytest 守卫 `test_workflow_bench.py::test_test_artifact_retries_cannot_hide_missing_evidence` 要求 workflow 步骤 `Upload SonarQube coverage` **不得**带 `continue-on-error: true`，而 main 上的 workflow 出现了该字段 → workflow 与守卫契约失配 → **6 个互不相关的 PR 同日同错全红**（security bump / wiki fix / spill-pdg / bench 等）。11-22 消失 = 有人改了 main。另：bench/go-resolution PR 上 parse-cache perf 红 | 6 个 run（44912113640、44916571983、44916582638、44932914300、44935862744、44937652137） |
| 11-20 | ① 3 个 ubuntu 分片各红 **1 个测试**（都是内容敏感的源码扫描守卫）：`query-determinism-guard.test.ts:404`（#2787，要求 src/ 内每个 Cypher LIMIT 有序声明）、`detect-changes-local-id-stability.test.ts` ×4（1-4ms 内即断言失败，#2699 audit）、`impact-batching-grouping.test.ts:231`（MAX_CHUNKS caps）。② **perf 预算红 ×2**，其中一次打在 `security/bump-django` 上——bump PR 不可能影响性能，证明是基线/环境漂移。③ **1 次真原生 crash**（见 §4） | run 44767635226 @6137ad92；run 44766694227 |

---

## 4. 真正的 flake：仅 2 次，都在 Windows 原生 runner

| # | 测试 | 现象 | 定性 |
|---|---|---|---|
| 1 | `incremental-write-integrity.test.ts:321`（真 LadybugDB，run 44766674583，job 136422908292，shard 1/11） | **120s 超时** + vitest worker 进程崩溃 `exit code 3221225477`（**0xC0000005 ACCESS_VIOLATION 段错误**） | native binding 在 windows runner 上崩溃，低频环境性 |
| 2 | `claude-hook-launcher.test.ts:564`（run 44935862744，job 136946497391，shard 10/11） | **`EBUSY: resource busy or locked, unlink node.exe`**（临时目录清理时句柄未释放/被杀软锁定）；该分片 475 过 / 1 挂 | windows 文件锁定 flake，低频环境性 |

### 原假设检验："容器环境 + file-locking"

- ❌ **ubuntu 容器 file-locking：否定**。全部 ubuntu 日志中 **0 次** file-locking 失败；`group-sync-lock` / `index-lock` 相关测试全部通过（✓ 行可见于 `/tmp/opencode/log-ubuntu4.txt` 等）。
- `AGENTS.md` 的 known issue「LadybugDB file-locking tests may fail in containers」描述的是**本地容器**跑 integration 的现象，与 CI 红无因果关系。
- ✅ 假设"歪打正着"的部分：唯二真 flake 恰好是**文件/进程层**问题——但位置在 **Windows 原生 runner**（EBUSY + 段错误），不是 ubuntu 容器，也不是 LadybugDB 测试间锁竞争。

---

## 5. 门禁失真的四层机制

1. **镜像误标**：`N/3` 镜像与真分片同名同格式，无法从名字区分 → "platform 分片随机红"的观感 96% 来自镜像。
2. **级联不溯源**：completeness 只报 `Artifact not found for name: coverage-reports`（job 137454988150），不指出是哪个生产者 job 红了；SonarQube 同样（`sonar-coverage` 缺失，job 137472958898）。
3. **main 侧共享失败不分锅**：perf 基线漂移、workflow 契约失配打在完全无关的 PR（security bump 等）上，红灯对 PR 毫无信息量 → 团队学会无视红灯。
4. **无人重跑**：所有失败 run 都是 attempt #1，无同-SHA twin → 真 flake 率永远测不出来，"随机"无从证伪。

---

## 6. 治理提案

> 原则：先治"失真"（让红灯恢复信息量），再修"真问题"；每条独立可落地，互不阻塞。

### A. 止血失真（只改 workflow YAML，风险低，收益最大）

| # | 提案 | 改动 | 预期效果 |
|---|---|---|---|
| A1 | **镜像门禁改名** | `protected-platform-checks` 的 job 名由 `tests / {os} (platform-sensitive) {n}/3` 改为 `audit / {os} (platform-sensitive evidence) {n}/3`（示意，具体措辞可议） | 与真分片彻底切割，"platform 随机红"观感立减 96% |
| A2 | **completeness 报错溯源** | artifact 下载失败时，脚本列出期望的生产者 job（"coverage-reports 由 tests / ubuntu (coverage) N/8 产出，该 job 本次状态红：<job name> / 首个失败测试"）；eval 拒绝 evidence 时同理 | 红灯直接指向根因，级联不再像随机 |
| A3 | **CI Gate 聚合根因** | `ci-status` 失败时汇总下游各 job 的 `conclusion` + 失败 job 的首个错误行，输出为 gate 的 step summary，而非 13 个红勾 | 排查成本从"逐个翻日志"降到"读一段摘要" |

### B. 修真问题（各自独立）

| # | 提案 | 改动 | 风险/工作量 |
|---|---|---|---|
| B1 | **修复 11-21 契约失配** | `Upload SonarQube coverage` 步骤移除 `continue-on-error: true`（与 `test_test_artifact_retries_cannot_hide_missing_evidence` 守卫对齐）；或反过来修守卫（需明确语义） | 低。该失配已自愈，但机制仍在，随时复发 |
| B2 | **perf 基线治理** | ① 重新 pin 基线 revision；② 排查 `parsedDigest differs for cold` 的非确定性来源（缓存序列化顺序？）；③ 共享 runner 上 5% 预算改多次采样取中位数；④ PR 无 `src/` 变更时跳过 perf 对比（`paths` 过滤）——security bump 不该跑 perf | 中。需理解 `eval/workflow_bench` / perf job 实现 |
| B3 | **eval containment 矛盾报错排查** | 单独开 bug：`"failed: 2/2 successful tool results"` 逻辑上自相矛盾，查 SandboxError 分类/预检代码 | 中。需要读懂 eval 管线 |
| B4 | **Windows 两个 flake 修复** | ① hook-launcher：unlink 前确保子进程句柄释放，或对 EBUSY 做 retry(3, backoff)；② incremental-write-integrity（LadybugDB windows 段错误）：先给该文件加 windows 专用 `retry(1)` 并留 issue 追 native crash 根因 | 低-中。retry 是止血，段错误需单独排查 |

### C. 可观测性 / 流程

| # | 提案 | 说明 |
|---|---|---|
| C1 | **重跑纪律** | 红了先同-SHA re-run 一次再动手：转绿 = 真 flake（记录），仍红 = 确定性失败（按根因处理）。攒 2-4 周即可得到真 flake 率 |
| C2 | **mirror 结论注记** | 镜像 job 的日志第一行打印"本 job 是 completeness 审计镜像，非原生测试分片"，给翻日志的人省一次误解 |

### 落地顺序建议

```
P0（本周）: A1 镜像改名 + B1 契约对齐     ← 两个小 diff，消除最大失真源
P1（下周）: A2 溯源 + A3 gate 聚合 + C1 重跑纪律
P2（排期）: B2 perf 基线治理 + B3 sandbox bug + B4 windows flake + C2
```

### 实施约束

- 所有改动目标在 **upstream** `abhigyanpatwari/GitNexus` 的 `.github/workflows/*.yml`；本机在 fork `chengjon/GitNexus` 上开发，需走 fork → upstream PR 流程，且 workflow 变更要等 upstream 合并后才对所有 PR 生效。
- 每个提案独立成 PR，便于归因回滚；YAML 改动本地只能做 lint（yamllint/actionlint），效果验证靠合并后观察后续 run。

---

## 7. 待审核决策点

- [ ] A1 镜像改名措辞（建议名 vs 自定义）
- [ ] B1 方向：workflow 移除 `continue-on-error`，还是改守卫语义？
- [ ] B2-④：无 `src/` 变更跳过 perf，是否接受（有"基线也变了"的例外场景）？
- [ ] C1 重跑纪律：团队约定即可，还是要做成自动化（如 failure 时自动 re-run 一次并打标）？
- [ ] P0 范围确认：A1 + B1 是否先落？
- [ ] B3/B4 是否开 issue 追踪（建议：是，分开开，避免一个大 PR）

## 8. 明确不做的事

- 不给 ubuntu coverage 分片加自动 retry（会掩盖源码扫描守卫的真失败，守卫本身就是内容敏感设计）。
- 不动 LadybugDB 锁机制相关测试（CI 日志证明它们没有失败）。
- 不在本提案里改任何业务代码（literal-collectors、query-determinism-guard 等 11-20/23 的测试红是 PR 内容问题，由对应 PR 自行修复）。
