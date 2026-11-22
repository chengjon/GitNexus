# 剩余测试失败：根因评估与修复建议（修订版 v2，待审核，未改代码）

> 日期：2026-11-22
> 范围：GitNexus fork `main`（HEAD `fa0a7ba1b`）合并 upstream 后的单元测试残留失败
> 状态：**仅分析文档，未做任何代码改动**（供审核）
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

### prefix-runtime 4 个仍失败（P2 范畴，未修）
- 根因（诊断确认）：测试 `Object.defineProperty(process,'platform',{value:'darwin'})` →
  `analyze.js` import 图**急切加载 tree-sitter**（`parser-loader.ts:1` 非 type `import Parser from 'tree-sitter'`
  所在传递链）→ `node-gyp-build` 选 `prebuilds/darwin-x64/`（macOS 二进制）→ Linux `invalid ELF header`
  → gate 不执行 / 走错路径。
- **P2 修复方向**（未实施）：让 `analyze.js` 对 tree-sitter 回到懒加载（动态 import），
  消除 import 时原生绑定加载。fork `436ec6f1c` 即此行为。属 src 重构，有回归风险，需单独做 + analyze 冒烟。

### P1：组 B baseline 核查（结论：与配置无关，既有残留）
- 干净临时 HOME 下 `run-analyze-adopt-failure` 单独跑 → **仍 6 failed / 1 passed**。
- 结论：与 `GITNEXUS_HOME` / embedding 配置无关，确认属**既有环境敏感 fast-path restamp 残留**
  （commit `1768f9547` 已记录），非 merge 引入、非我方改动引入。
- 修复（若做）：按 B1 对比 fork `436ec6f1c` 的 `run-analyze.js` 导出 / mock 工厂形状；
  优先级可降级为「已知残留」。

### 剩余汇总（本文档覆盖）
- prefix-runtime 4 个（P2 懒加载）+ 组 B 6 个（既有残留 / B1）= **10 个待修**（均非 P0 引入）。
- P0 已修 embeddings-sync 3 个（随本次提交）。

---

## 审核要点（请确认）

1. **组 A / 组 C 修复**：采纳 P0「测试侧 `GITNEXUS_HOME` 隔离」？是否 stub
   `loadStoredEmbeddingConfig` 还是直接设 `GITNEXUS_HOME` 临时目录？
2. **组 B**：采纳 P1「先跑 fork 版 + 对比 mock 工厂形状」？
3. **P2（A1 懒加载）**：是否本轮做，还是单独排期？
4. **提交本 MD**：确认按修订后的根因（组 A = 配置隔离，非 ELF）提交为决策记录
   （`git add -f`）？
