# GitNexus Technical Debt P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 GitNexus 当前最危险的技术债从“分散兜底”收敛为“统一原生运行时治理 + 可控测试基建”。

**Architecture:** 并行推进两个面：一条线建立 `NativeRuntimeManager` 作为 Kuzu / ONNX / lock / shutdown 的统一治理入口；另一条线重构测试基建，让原生资源策略从隐式约定变为显式 fixture 和分层约束。

**Tech Stack:** TypeScript, Vitest, Kuzu, ONNX Runtime, Node.js process lifecycle, filesystem locks

---

### Task 1: 设计并落地 `NativeRuntimeManager` 骨架

**Files:**
- Create: `gitnexus/src/runtime/native-runtime-manager.ts`
- Modify: `gitnexus/src/cli/analyze.ts`
- Modify: `gitnexus/src/mcp/core/kuzu-adapter.ts`
- Modify: `gitnexus/src/mcp/local/local-backend.ts`
- Test: `gitnexus/test/unit/native-runtime-manager.test.ts`

- [x] **Step 1: 写失败测试，定义 manager 的最小接口**
- [x] **Step 2: 运行测试，确认当前仓库还没有统一 runtime 层**
- [x] **Step 3: 写最小实现，先覆盖 Kuzu state / shutdown hooks / reindex locks**
- [x] **Step 4: 把 `analyze` 和 MCP 锁处理迁移到 manager**
- [x] **Step 5: 跑定向测试确认通过**

### Task 2: 去掉分散的原生兜底策略

**Files:**
- Modify: `gitnexus/src/cli/analyze.ts`
- Modify: `gitnexus/src/mcp/local/local-backend.ts`
- Modify: `gitnexus/src/mcp/server.ts`
- Modify: `gitnexus/src/cli/mcp.ts`

- [x] **Step 1: 列出所有 `process.exit(...)`、native close 规避、lock cleanup 的散点**
- [x] **Step 2: 逐步迁移到 manager，不改变外部行为**
- [ ] **Step 3: 保留行为兼容，但让策略只在 manager 中定义**
- [x] **Step 4: 跑构建与关键测试**

### Task 3: 重构测试基建，降低原生脆弱性

**Files:**
- Modify: `gitnexus/vitest.config.ts`
- Modify: `gitnexus/test/setup.ts`
- Modify: `gitnexus/test/global-setup.ts`
- Modify: `gitnexus/test/helpers/test-indexed-db.ts`
- Create: `gitnexus/test/helpers/native-runtime-fixture.ts`

- [x] **Step 1: 写失败测试或 fixture 验证，明确 native runtime fixture 的职责**
- [x] **Step 2: 把 no-op cleanup 改成显式 runtime cleanup 协议**
- [x] **Step 3: 把必须串行 / 必须进程隔离的测试条件显式化**
- [x] **Step 4: 评估并减少 `dangerouslyIgnoreUnhandledErrors` 的覆盖范围**
- [x] **Step 5: 跑 unit + integration 关键子集验证**

### Task 4: 输出运行时与语言能力诊断

**Files:**
- Modify: `gitnexus/src/cli/doctor.ts`
- Modify: `gitnexus/src/core/tree-sitter/language-registry.ts`
- Modify: `gitnexus/src/cli/ai-context.ts`
- Test: `gitnexus/test/unit/doctor.test.ts`
- Test: `gitnexus/test/unit/language-registry.test.ts`

- [x] **Step 1: 在 `doctor` 中暴露 native runtime / grammar availability 状态**
- [x] **Step 2: 明确 Kotlin / Swift 等语言的支持等级**
- [x] **Step 3: 让 CI 和本地诊断共享同一套能力定义**
- [x] **Step 4: 跑定向测试**

### Task 5: 验证与收口

**Files:**
- Test: `gitnexus/test/unit`
- Test: `gitnexus/test/integration`

- [x] **Step 1: 跑 `npm run build`**
- [x] **Step 2: 跑 `npm test`**
- [x] **Step 3: 跑关键 integration suites**
- [x] **Step 4: 运行 `gitnexus analyze` 和 MCP 关键场景手工验证**
- [ ] **Step 5: 更新技术债路线图状态**
