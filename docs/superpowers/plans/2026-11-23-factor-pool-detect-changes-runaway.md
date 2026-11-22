# factor-pool「全量检测 OOM」调查（2026-11-23）

> 状态：**调查记录**。用户报告 `gitnexus` 全量检测在 `/opt/claude/factor-pool` 本机 OOM。
> 结论：**未发现任何内核 OOM 或 V8 堆 OOM 记录**；实际抓到的是 `detect-changes --scope all` 的 **CPU 死循环**（不是内存耗尽）。已终止该进程，当前构建下不可复现。

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
3. 待补：**用户看到的 OOM 原文**，用于确认是 detect-changes 路径还是 analyze 路径。
4. 若确为 analyze：建议给 `.wslconfig` 提内存，或用 `GITNEXUS_MEMORY=off` / 显式 `NODE_OPTIONS=--max-old-space-size`、`GITNEXUS_WORKER_POOL_SIZE` 压低总提交量（58GB → 低于 52GB）。
