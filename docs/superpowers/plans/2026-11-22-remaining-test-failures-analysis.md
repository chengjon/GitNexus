# 剩余测试失败：根因评估与修复建议（v3：P0/P2 已实施，组 B 已定性）

> 日期：2026-11-22
> 范围：GitNexus fork `main` 合并 upstream 后的单元测试残留失败
> 状态：**分析 + 决策记录**（P0/P2 已实施并推送；组 B 已定性）
>
> **修订记录 v3**：P0（测试侧 `GITNEXUS_HOME` 隔离，含第二个 describe）与 P2
> （`parser-loader` 懒加载 tree-sitter）均已实施并推送（`0db7329c7`、`4cabd630c`），
> 组 A 4 + 组 C 3 全绿。组 B 经 B1 baseline 核查**推翻「既有残留」结论**：
> fork `436ec6f1c` 上该测试 7/7 通过，当前代码 6/7 失败 → 属 merge 引入的**代码回归**。
>
> **修订记录 v2**：组 A 的根因经独立复现纠正——主因是**环境配置导致 gate 被跳过**，
> 不是 ELF（ELF 属新进程下的次要现象）。组 A 的修复是**测试侧配置隔离**，不是
> parser-loader 懒加载。感谢审核者的独立复现推翻了 v1 的误判。

## 背景

本次 upstream resync（merge `70ce30d2d`，目标 `351792323`）后全量单测有 31 个失败 / 6 文件。
经排查已**安全修复并推送 18 个**：

- `21bb3cf2f` — schema 测试对齐生成式 DDL 格式（3）+ parse-cache 允许清单键（1）
- `fa0a7ba1b` — calltool-dispatch `canonicalRoot` null 守卫（11）

剩余 **13 个失败**（`analyze-local-embedding-error` 4、`embeddings-sync-command` 3、
`run-analyze-adopt-failure` 6）本文件给出根因评估与修复建议，**不动代码**。

---

## 失败组 A：embedding gate（7 个）— 主因：环境配置导致 gate 被跳过

**文件**
- `test/unit/analyze-local-embedding-error.test.ts`（4：`:224/:247/:262/:278`，prefix-runtime capability gate #2372）
- `test/unit/embeddings-sync-command.test.ts`（3：`:503/:518/:529`，writer safety #3065）

### 根因（已由审核者独立复现确认）

`analyze.ts:1546` 的本地 embedding gate 是：

```js
if (embeddingsEnabled && !isHttpMode()) { ... }
```

而 `isHttpMode()`（`http-client.ts:295`）在 `readConfig() !== null` 时返回 `true`。
本机 `~/.gitnexus/config.json` 含 `provider:'ollama'` + `ollamaBaseUrl` + `ollamaModel`
→ `readConfig()` 非空 → `isHttpMode() === true` → **gate 被整体跳过**：

- 不会发出 `local-embedding-unsupported` / `local-embedding-stack-missing` 记录；
- 不会调用 `installEmbeddingRuntime`。

**决定性证据（审核者提供）**：
- 在 gate 前插 `DIAG-BEFORE-GATE` 打印（已 `git checkout` 还原，工作区干净）：
  全部测试为 `true true linux x64`（`:224` 为 `true true darwin x64`）——
  `embeddingsEnabled=true` 但 `isHttpMode()=true`，**gate 从未进入**。
- **`GITNEXUS_HOME=/tmp/opencode/empty-home` 隔离后**：
  `analyze-local-embedding-error.test.ts` **9/9 通过**，
  `embeddings-sync-command.test.ts` **24/24 通过**。

### 次要现象：ELF（仅新进程，被全量套件掩盖）

审核者确认 v1 描述的 ELF 问题**真实存在但属次要**：
- 新开进程（`-t "prefix-runtime"`）时，4 个测试会以
  `tree-sitter/prebuilds/darwin-x64/tree-sitter.node: invalid ELF header` 失败
  （merge 后 `analyze.js` 急切加载 `tree-sitter` 原生绑定，`platform=darwin` mock 使
  `node-gyp-build` 选 macOS 二进制，Linux 上加载失败）。
- 全量套件里更早的测试已在 `linux` 下缓存了原生绑定，故被掩盖；
  **主失败模式是配置导致的 gate 跳过**，不是 ELF。

### 修复建议（P0，推荐）

**测试侧配置隔离**：在三个测试文件的 `beforeEach` 把 `GITNEXUS_HOME` 指向空/临时目录
（或 stub `loadStoredEmbeddingConfig`），使 `readConfig()` 为空 → `isHttpMode()=false`
→ gate 正常进入。
- 直接修 7 个失败，**风险最低**；
- 与既有做法一致（`embedding-sidecar-client.test.ts` 已用 `GITNEXUS_HOME` 隔离）。

**A1（parser-loader 懒加载 tree-sitter）不是组 A 的修复**——它只消除「新进程 + darwin/x64
mock 的 ELF 崩溃」这个潜在健壮性问题，对这 7 个失败无效（gate 仍会被跳过）。
**A1 应作为独立加固单独排期（P2）。**

---

## 失败组 B：run-analyze-adopt-failure（6 个）— 与配置无关，独立问题

**文件**：`test/unit/run-analyze-adopt-failure.test.ts`（`:144/:170/:187×3/:208`，fast-path restamp #2364 F3）

### 根因（初步，需实施时复核）

审核者已先**排除一个干扰项**：`GITNEXUS_HOME` 隔离后该文件**仍 6 failed / 1 passed**
→ 组 B 与 embedding 配置无关，必须单独查。

失败表现为 mock 配置行本身抛错 / 断言 undefined（`rmCtx.saveMetaMock` / `writableMock`
未就绪等），属 **mock 生命周期/时序**问题。commit `1768f9547` 早已记录为环境敏感 fast-path 簇。

### 修复建议（P1）

按文档 B1：
1. 对比 fork `436ec6f1c` 的 `run-analyze.js` 导出 / mock 工厂形状（merge 可能改了导出/命名）；
2. 先跑 fork 版该测试确认 fork 是否通过；
3. fork 通过 → merge 改了导出，修正测试 mock 工厂；fork 也失败 → 纯环境/既有，降优先级。

---

## 修订后的优先级（采纳审核者建议）

| 优先级 | 项 | 修复数 | 风险 | 备注 |
|---|---|---|---|---|
| **P0** | 三个测试文件 `GITNEXUS_HOME` 隔离 | 7（组 A 4 + 组 C 3） | 最低 | 修 analyze-local-embedding-error + embeddings-sync-command |
| **P1** | 组 B 单独 baseline 核查（fork 436ec6f1c） | 6（待定） | 中 | 独立问题，先确认 fork 表现 |
| **P2**（可选加固） | parser-loader 懒加载 tree-sitter | 0（消除 ELF 崩溃） | 中 | 独立健壮性加固，非组 A 修复 |

---

## 实施与验证要求（采纳审核者建议）

1. **配置隔离修复**：三个测试文件在 **ambient 配置** 和 **隔离 `GITNEXUS_HOME`**
   两种条件下都要绿（不能只让隔离下绿、ambient 下仍红）。
2. **真实 `gitnexus analyze` 冒烟**（pty + 非 TTY，启用 embeddings 的仓库）：
   确认 gate 行为没有被「修没了」——否则测试绿了但用户侧行为可能变了。
3. **若做 A1（P2）**：再加一条新进程冒烟（mock darwin/x64 场景，或至少正常 pty）
   确认不再 ELF 崩溃。

---

## 已知前置（实施时注意）

- 本地 `~/.gitnexus/config.json`：`provider:'ollama'` + `ollamaBaseUrl` + `ollamaModel`
  （这是组 A 的触发源；`GITNEXUS_HOME` 隔离即可绕过）。
- embedding 测试 mock `process.platform`/`process.arch` 有原生加载副作用（ELF 次要现象）。
- 当前工作区 clean、已推送内容（`fa0a7ba1b`）均可安全构建（`tsc` 0 / build 通过）。
- 本文件被 `.gitignore:80` 的 `docs/*` 忽略（白名单仅 `!docs/fork/`），提交需 `git add -f`；
  `docs/superpowers/plans/` 下已有大量被跟踪文件，force-add 是此处既有做法。

---

---

## 实施结果补充（P0 / P1，2026-11-22）

在本文档审核后，按确认的优先级实施了 P0（配置隔离）与 P1（组 B 核查），结论如下：

### P0：embedding 测试 `GITNEXUS_HOME` 隔离（修组 C 3 个，测试侧改动）
- **改动**（纯测试，不动 src）：
  - `test/unit/analyze-local-embedding-error.test.ts`：`beforeEach` 里 `vi.resetModules()` 后
    `mkdtempSync` 建临时 HOME、`process.env.GITNEXUS_HOME = tempHome`；新增 `afterEach`
    `rmSync` 清理 + 还原 `GITNEXUS_HOME`。
  - `test/unit/embeddings-sync-command.test.ts`：`beforeEach` 里 `vi.stubEnv('GITNEXUS_HOME', <临时目录>)`
    （已有 `afterEach` 的 `vi.unstubAllEnvs()` 自动还原）。
- **效果**：隔离后 `readConfig()=null` → `isHttpMode()=false` → analyze 本地 embedding gate 执行。
  - `embeddings-sync-command`：**3 失败 → 0 失败**（修复）。
  - `analyze-local-embedding-error`：ambient 下 5 passed / **4 prefix-runtime 仍失败**（见下）。
- **净改善**：embeddings-sync 3 个修复，analyze-embed 未变差（prefix-runtime 4 个改前改后一致）。

### prefix-runtime 4 个：已修复（P0 补隔离 + P2 懒加载）
- **真正的根因**（v3 纠正）：`0db7329c7` 只给第一个 describe（`:107`）的 `beforeEach` 加了
  `GITNEXUS_HOME` 隔离；第二个 describe（`prefix-runtime capability gate #2372`，`:230`）
  有**自己的 `beforeEach`（`:231-240`）且没有隔离** → 仍读到 `~/.gitnexus/config.json` 的
  ollama 配置 → `isHttpMode()=true` → gate 跳过。这与 ELF 无关（先前 5 条
  `DIAG-GATE {"status":"ready"}` 全部来自第一个 describe，第二个 describe 根本没进 gate）。
- **修复**（`4cabd630c`，纯测试）：给第二个 describe 的 `beforeEach` 补上同样的
  `GITNEXUS_HOME` 隔离 → standalone `analyze-local-embedding-error.test.ts` **9/9 通过**。
- **P2 懒加载**（同提交，src）：`parser-loader.ts` 改 `import type Parser` +
  在 `loadParser`/`createParserForLanguage` 内 `await import('tree-sitter')`，消除新进程 +
  darwin/x64 mock 下的 `invalid ELF header` 崩溃（独立健壮性加固，非这 4 个失败的修复）。
  已验证：standalone 不崩溃、无第二条 `analyze.ts → tree-sitter` 急切边、pty + 非 TTY 冒烟干净。

### P1：组 B baseline 核查（结论：**merge 引入的代码回归**，非既有残留）
- 干净临时 HOME 下该文件仍 6 failed / 1 passed → 与配置无关（此点成立）。
- **但「既有残留」的结论被 B1 推翻**（决定性实验，worktree `/tmp/opencode/fork-base`
  @ `436ec6f1c`，`node_modules` 软链）：
  - fork 代码 + fork 测试 → **7/7 通过**；
  - 当前代码 + **fork 测试**（把 `git show 436ec6f1c:…` 的测试文件换入当前 checkout）→ **6/7 失败**；
  - 当前代码 + 当前测试 → 6/7 失败（同样 6 个）。
  - 反向实验（当前测试跑 fork 代码）受阻：当前测试 import `resolveParseCacheIdentity`
    等 merge 新增 API，fork 代码上不存在。
- 结论：**代码回归**（`src/core/run-analyze.ts` 的 fast-path restamp/adopt 逻辑，merge 改写约
  2627 行），**不是测试问题、不是环境残留**。测试文件 fork→HEAD 仅 23+/8−，且换入 fork 测试仍同样失败。
- 修复方向：定位 merge 后 fast-path 为何不再调用 `saveMeta`/`ensureStoragePathWritable`、
  且 `result.alreadyUpToDate` 为 undefined（fork 调用点 `run-analyze.ts:1394/2346/4845` vs
  当前 `:2176/1616/3329`）。属代码级修复，建议单独会话进行。

### 剩余汇总（本文档覆盖）
- **组 A 4 + 组 C 3：已修复并推送**（`0db7329c7` + `4cabd630c`），standalone 全绿。
- **组 B 6：已定性为 merge 代码回归**，B1 已完成，待单独会话修复。
- 总计 31 → 已修 25，剩 6（组 B）。

---

## 审核要点（已决，2026-11-22）

1. **组 A / 组 C**：采纳 P0「测试侧 `GITNEXUS_HOME` 隔离」——已实施（含第二个 describe），
   直接设临时目录（未 stub `loadStoredEmbeddingConfig`）。
2. **组 B**：B1 已完成 → 定性为 **merge 代码回归**（非既有残留），需代码级修复，单独排期。
3. **P2（A1 懒加载）**：已随 `4cabd630c` 实施（独立加固 + 消除 ELF 崩溃）。
4. **本 MD**：作为决策记录提交（`git add -f`）。
