# factor-pool「全量检测 OOM」调查（2026-11-23）

> 状态：**调查记录**。用户报告 `gitnexus` 全量检测在 `/opt/claude/factor-pool` 本机 OOM。
> 结论：**未发现任何内核 OOM 或 V8 堆 OOM 记录**；实际抓到的是 `detect-changes --scope all` 的 **CPU 死循环**（不是内存耗尽）。已终止该进程，当前构建下不可复现。
>
> **第二轮（2026-11-23 晚）**：完成 signature-changes.ts 全部 AST 遍历审计 —— **无无界路径**（§8）；同日核实报告的「V8 堆 OOM 定案」与「同源推断」被五项证据**推翻**（§9）；按「无根因」条款转防御，三项防御已全部落地（§10，worker 隔离于同日第三轮补齐）。

## 1. 现象

- 机器：WSL2（`6.18.58.1-microsoft-standard-WSL2`），12 CPU，`.wslconfig` 上限 `memory=52GB`、`swap=8GB`、`autoMemoryReclaim=Gradual`。
- `os.totalmem()` ≈ 51GB；Node v24.22.2，默认堆上限 **4288MB**。
- 仓库 `/opt/claude/factor-pool`：总 1.7G，非 `.git` 文件 5352；`.gitignore` 排除 `data/cache/`、`output/`、`data/signals/`、`data/holdings/`、`archive/signals/`、`__pycache__/`、`*.pyc` 等；**git 跟踪文件仅 1050 个**，最大 132K。图索引很小：`files 799, nodes 5292, edges 11862, communities 174, processes 407, embeddings 0`。
- 工作区 diff（vs HEAD）：**12 files changed, 161+/2936-**（`.claude/tdd-guard/data/test.json`、`AGENTS.md`、`CLAUDE.md`、`registry/index.yaml`、若干二进制 pyc/parquet/db）。

## 2. 抓到失控进程

```
PID 990707   %CPU 99.9   ELAPSED 9h+   RSS ~570MB(稳定)   STAT Rl   NLWP 23
node /root/.nvm/.../bin/gitnexus detect-changes --scope all --repo .
cwd = /opt/claude/factor-pool
```

- `gdb -p 990707 -batch -ex 'bt 5'` 采样 4 次，栈顶反复落在
  **tree-sitter 原生 `node_tree_sitter::node_methods::Type(Napi::CallbackInfo const&)`**
  （`tree-sitter/prebuilds/linux-x64/tree-sitter.node`）+ V8 字符串哈希
  （`String::ComputeAndSetRawHash`、`OrderedHashMap::GetHash`、`Runtime::GetObjectProperty`、`PropertyKey`）。
- `strace -f -c -p 990707`（8 秒）：**仅 36 次 `getpid`、total 36 calls**，几乎零 I/O。
- RSS 5 秒采样 570260 → 570264 kB，**不增长**。
- 线程：仅 `MainThread` 100% CPU，其余 22 个（4×V8Worker、17×libuv-worker、DelayedTaskSche、SignalInspector）≈0%。

→ **纯用户态热循环**（单线程、几乎无系统调用、RSS 稳定）。

## 3. 排除 OOM 的证据

- 完整 `dmesg`、`/var/log/kern.log*`、`/var/log/syslog*`（含轮转 `.gz`）：**无任何 oom-kill / out of memory / oom_reaper**。
- `~/.bash_history` 与 `/tmp/opencode/*.log`：无 “heap out of memory / JavaScript heap / ENOMEM”。
- `.gitnexus/` 无 lock 文件；进程环境无 `GITNEXUS_*` / `NODE_OPTIONS`。

## 4. 代码路径要点

- `detectChangesCommand`（`src/cli/tool.ts:470`）→ `backend.callTool('detect_changes', { scope: options?.scope || 'unstaged', ... })`；`--scope` 可选 `unstaged|staged|all|compare`（`src/cli/index.ts:651`）。
- `scope: 'all'` → `buildDetectChangesDiffArgs` 追加 `HEAD -U0`（`local-backend.ts:1537`），`execFileSync('git', ..., { maxBuffer: 256MB, timeout: 120_000 })`（`local-backend.ts:7295`）。
- 符号匹配是 Cypher（`UNWIND $bounds AS b MATCH (n) ...`，`executeParameterized` + `mapConcurrent`，`LBUG_QUERY_BATCH_SIZE=100` / `LBUG_ID_PROBE_BATCH_SIZE=100`）；`chunk()` 与 `mapConcurrent()` 均为有限循环（`src/lib/utils.ts:136/170`）。
- `detect-changes` **不走 `ensureHeap`**（`src/cli/index.ts:3` 注释；`ensureHeap` 只在 `analyze.ts:1488` / `analyze-watch.ts:530`），用 Node 默认 4288MB 堆。
- `tool.ts:output()` 有一个 1ms 管道写入轮询循环（约 1000 wakeups/s）——**已排除**：若卡在那里，strace 应见 ~1000 次/秒 `write`，实测 8 秒仅 36 次 `getpid`。

## 5. 复现与基线

- `kill 990707` → 进程消失。
- 重跑 `cd /opt/claude/factor-pool && timeout 90 gitnexus detect-changes --scope all --repo .` → **EXIT=0，<90s**，输出 `Documentation sections changed: 14`。**未复现死循环**。
- `node --cpu-prof --cpu-prof-dir=/tmp/opencode/cpu-prof .../dist/cli/index.js detect-changes --scope all --repo .` → EXIT=0；profile（`CPU.20261123.010706.1458720.0.001.cpuprofile`）自身耗时 Top：`(idle)` 1380、`spawnSync @child_process` 254、`compileSourceTextModule` 35、`(garbage collector)` 19、`parseOwnershipMetadata` 19 —— **无 tree-sitter 热循环**。
- 当时 dist sha256 = `189ac1c049d9cf140c3dabea8f67c9c60d523cdf97de2d23430892a3d7a04782`。

## 6. 另一条真会 OOM 的路径（analyze，未在本机复现）

若实际跑的是 `gitnexus analyze`：

- heap autopilot 按 `0.75 × totalmem` 重启进程：`heapCapMbFor(51GB)` = min(max(16384, 39168), 41779) = **39168MB（≈38.25GB）**，子进程带 `--max-old-space-size=39168 --max-semi-space-size=128 --stack-size=4096`。
- worker 池：11 个 worker（`os.cpus().length-1`，上限 16），`resolveWorkerHeapCapMb(11)` = min(4096, max(512, floor(0.75×52224MB / 2 / 11))) = **1780MB/worker**，`poolCommitMb = 19580MB`。
- 合计上限 ≈ **38.25 + 19.5 = 58GB > `.wslconfig` 的 52GB**（+swap 8GB = 60GB，余量很小）。
- 另：factor-pool 的 `~/.gitnexus/config.json` 是 `provider: ollama` + `ollamaBaseUrl`/`ollamaModel` → `isHttpMode()` 为 true，会跳过本地 embedding gate。

## 7. 结论与后续

1. **本机的「OOM」不是内核 OOM，也不是 detect-changes 的内存耗尽**；抓到的是 `detect-changes --scope all` 的单线程 CPU 死循环（tree-sitter `Type()` 热路径），已终止。
2. 当前构建下 `--scope all` 正常，**死循环不可复现**（疑似与进程启动时的仓库/registry 状态相关；`~/.gitnexus/registry.json` mtime 为 2026-11-22 17:31）。
3. 待补：**用户看到的 OOM 原文**，用于确认是 detect-changes 路径还是 analyze 路径。→ *已由第二轮 §9 处理：OOM 原文叙事被否定，见 §9。*
4. 若确为 analyze：建议给 `.wslconfig` 提内存，或用 `GITNEXUS_MEMORY=off` / 显式 `NODE_OPTIONS=--max-old-space-size`、`GITNEXUS_WORKER_POOL_SIZE` 压低总提交量（58GB → 低于 52GB）。

## 8. 第二轮：signature-changes.ts 全量 AST 遍历审计（无界路径排查）

**结论：未发现任何无界路径。** 对 `signature-changes.ts`（1551 行）全文及其调用的全部 helper 逐一审计，每条遍历要么结构上线性、要么带环检测/预算封顶：

| 遍历 / 循环 | 位置 | 界 |
|---|---|---|
| `definitionIndex` → `walkPythonScopes` | type-imports.ts:157 | 显式栈，每节点入栈一次，线性，不回读 `.parent` |
| `defaultMetaclass` | sig-changes:241 | `proven` memo + 深度>32 截断；scope 链构造上无环 |
| `fingerprintOf`（预算块，用户指定豁免） | sig-changes:370-413 | budget+memo+深度≤64 |
| `endpoint` | sig-changes:875 | hops≤4（maxExportHops）、endpointReads≤256、definitionBytes≤64MiB |
| `exportResolver`（含 loadFile→loadExport） | sig-changes:598 | `seen` 环检测（(file,name) 键）；moduleReads≤4096、callerBytes≤64MiB、extractions≤256、remainingNodes≤8×12000 |
| `importDecoder` | sig-changes | ≤4096 次（maxDecodedImports），按语句 memo |
| `scopeOf` / `pythonNameResolver` | type-imports.ts | parent/outer 链爬升 memo 化，链构造上无环 |
| `lookupLexicalName` | gitnexus-shared name-claims.ts:271 | 两个 while 均有 visited-set + skippedIds |
| `literalKeys` / `resolveCall` / `pythonDottedName` 括号剥离 | 各处 | 严格单调下降（dotted name limit 32） |
| `followAlias` / `resolveSpelling` | sig-changes | hops≤4（maxAliasHops） |
| `tooDenseForScopeExtraction` | sig-changes:735 | descendantCount 门（12k/64k）+ walk 带 `'stop'` |
| `mayImportLocalModule` | sig-changes | 单次 descendantsOfType |
| `callerImages` / `definitionImages` | signature-images.ts | 下标严格推进；git execFile 15s 超时 + maxBuffer；`guarded()` 包裹 |
| `splitImportStatement` / interpret.ts / import-file-index.ts 字符串扫描 | 各处 | `while(slash!==-1)` 线性 |
| `pythonFileExportsName` | import-target.ts:198 | nextDefinition 游标单调 |
| ScopeExtractor.extract | scope-extractor.ts | 线性趟；栈弹出台摊还线性；scope 爬升构造上无环（源码注释明示） |

另确认：**解析已有超时保护** —— checker 的 `parse()` 由 `parseSourceSafe` 包裹（sig-changes:827-843），`ParseTimeoutError` → `skip(file, 'Python parse timed out')`。

## 9. 第二轮：对同日核实报告的勘误（五项证据）

核实报告（[verification](./2026-11-23-factor-pool-detect-changes-runaway-verification.md)）§2.1-2.2「V8 堆 OOM 定案」与 §3「PID 990707 与 01:04 会话同源」被以下证据**推翻**：

1. **时间线修正**：PID 990707 启动时间 ≈ **2026-11-22 16:05±**（01:07 观测点 − 9h+ ELAPSED），**不是凌晨 1 点前后**。核实报告 §3 表内「9h+ → 启动 ≈ 凌晨 1 点前后」为算术错误；进程早于 01:04 会话约 9 小时，「同源残留」推断不成立。
2. **512MB 复现成功**：仅给 `--max-old-space-size=512` 复跑 `detect-changes --scope all --repo .` → **EXIT=0 正常完成**。与「默认 4.29GB 首次 OOM、提额 8GB 仍 OOM」（核实报告 §2.1）直接矛盾 —— 若该路径会堆耗尽，512MB 不可能跑通。OOM 叙事否定。
3. **转录考古否定**：在 opencode 会话转录中检索 V8 heap OOM 原文（"heap out of memory"/"JavaScript heap" 等）→ **未找到任何匹配**。核实报告 §2.1「原文留存于会话转录」无证据支撑，§2.3 的解释随之失去依托。
4. **MCP 存活矛盾**：`gitnexus mcp` 常驻进程（PID 228907）自 **2026-11-21 19:59:45** 起运行，贯穿整个事件窗口（11-22 16:05 → 11-23 01:07+）且至今存活。注：V8 堆 OOM 属进程内故障，MCP 存活不单独反驳进程级 OOM，但与「机器内存告急」的整体叙事矛盾，并与第 2、3 项共同否定 OOM 定案。
5. **解析超时覆盖确认**：见 §8 末条 —— 解析路径已有超时保护，不是失控点。

**修正后结论**：回到原调查 §7.1 —— 抓到的是 `detect-changes --scope all` 的单线程 CPU 死循环；根因未复现、未定位；OOM 定案作废。核实报告 §7.3「待补 OOM 原文」就此关闭（答案：不存在该原文）。

## 10. 第二轮：防御落地（本轮提交）

审计走「无根因」条款（systematic-debugging：穷尽排查无果 → 转防御 + 监控），三项措施：

1. **checker 文件大小上限对齐 walker**（已落地）：`signature-images.ts` 的 `sourceLimit` 从硬编码 4MiB 改为 `getMaxFileSizeBytes()`（`GITNEXUS_MAX_FILE_SIZE`（KB），默认 **512KB**，超 tree-sitter 上限自动 clamp）—— 任何 walker 拒绝索引的文件，checker 同样拒绝，解析/分析成本与索引策略同界。两处 skip 消息（sig-changes:828/:1222）改为动态 `unreadableSource()`。测试：更新 3 处 oversized 断言 + 新增 600KB 回归测试（旧代码下该文件被正常解析 → 新代码跳过）。
2. **detect-changes 启动打印**（已落地）：`detectChangesCommand`（src/cli/tool.ts）启动时向 stderr 输出一行 `gitnexus detect-changes pid=N heap=XMB fileCap=YKB`，事后 PID 归因不再依赖 ps 考古。MCP 路径（local-backend 直接 `callTool`）不经过该命令，stderr 卫生不受影响（detect-changes-stderr.test.ts 仍全绿）。
3. **Worker 隔离**（已落地，2026-11-23 第三轮）：`detect_changes` 不再在 handler 进程内直跑 `checkCallCompatibility` → `findBrokenKeywordCalls`。实现：`call-compatibility-worker.ts`（主线程 runner：60s 默认硬超时 → worker.terminate() + 回退 `{complete:false, skipped:[{reason:'signature-check-timed-out'}]}`）+ `call-compatibility-worker-entry.ts`（worker 内重跑 CPU 密集签名检查；LBUG 无法在 worker 内重开 → caller 查询经 MessagePort RPC 留在主线程，`checkCallCompatibility` 增加可注入 `queryCallers` 参数，默认实现 = 原进程内查询，语义零变化）。结果：单线程 CPU 失控最多消耗一个可终止的 worker + 60s，CLI 不再被无限楔死。**落地中发现并修复**：优雅收尾路径调用 `worker.terminate()` 会与 worker 自身退出/原生 tree-sitter 卸载竞态，在 vitest fork 内触发 **SIGABRT**（整 fork 崩溃）——修复为优雅路径不 terminate（entry 返回 → 线程自然退出），terminate 仅保留在 fail/timeout 路径。测试：新增 worker 集成测试 3 例（round-trip / 超时回退 / caller 查询失败降级 'caller-query-failed'）+ 进程内 `call-compatibility.test.ts` 2 例（多 checker 隔离、单 checker 失败不牵连）；hunk-scale 中依赖主线程 vi.spyOn 的用例迁移/改接线（跨线程 spy 不可见），:389 用例删除并留档理由（fixture 本就未到达 retention 路径，契约由 :376 经真实 worker 覆盖）。5 套件 169/169 全绿。
