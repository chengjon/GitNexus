# Swift Patch Postinstall Retirement

日期：2026-04-09
范围：`gitnexus/package.json`、历史 `swift-patch` / `patch-tree-sitter-swift` 路径、相关 tests
目标：把 `tree-sitter-swift` patch 从默认 `postinstall` 路径退役，避免仓库继续把一个静默 best-effort 安装补丁表达成稳定支持能力。

治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
相关基线：[2026-04-09-language-support-deterministic-semantics-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-09-language-support-deterministic-semantics-convergence.md)

---

## 1. 背景

路线图对 P2 的原始要求之一是：

- 移除或收编 Swift patch 脚本

在本轮删除前，仓内默认安装链路仍保留：

- `gitnexus/package.json` 中的 `postinstall`
- `gitnexus/scripts/patch-tree-sitter-swift.cjs`
- `gitnexus/src/cli/swift-patch.ts`

但这条链路并不代表 Swift 已被稳定支持，只代表安装时会做一次静默 best-effort 尝试。

---

## 2. 删除前 reachability 与 feature-tree 判定

### GitNexus Evidence

- `gitnexus_impact({ target: "applySwiftPatch", direction: "upstream" })`
  返回：
  - `risk = LOW`
  - `direct = 0`
  - `processes_affected = 0`
  - `modules_affected = 0`

### Direct Reference Inspection

删除前仓内直接引用只包括：

- `gitnexus/package.json`
  - `scripts.postinstall = "node scripts/patch-tree-sitter-swift.cjs"`
- `gitnexus/test/unit/swift-patch.test.ts`
  - 对 `applySwiftPatch` 的专属单测
- 审计文档中的历史引用

当前没有 runtime entry point、CLI command、API route、配置分支、CI workflow 或 operator workflow 通过产品路径显式调用 `applySwiftPatch`。

### Feature-tree 结论

`swift-patch` 只属于安装期临时补丁路径，不属于当前产品功能树中的稳定入口。

因此它符合删除门槛：

- 不再是当前 feature tree 的正式能力
- 不承担稳定契约
- 删除后 Swift 仍通过 `language-support` 明确暴露为 optional grammar 状态

---

## 3. 本轮修改

- 删除 `gitnexus/package.json` 中的 `postinstall` Swift patch 入口
- 删除历史路径 `gitnexus/src/cli/swift-patch.ts`
- 删除历史路径 `gitnexus/scripts/patch-tree-sitter-swift.cjs`
- 删除对应专属单测
  `gitnexus/test/unit/swift-patch.test.ts`

本轮不改：

- `tree-sitter-swift` optional dependency 的声明方式
- Swift 在 `language-support` 中的 optional grammar 语义
- parser loader 对 “Swift 不可用时 graceful fail” 的运行时契约

---

## 4. Measured

- `scope: current local install artifact state, time: 2026-04-09`
  删除前本地实测：
  - `gitnexus/node_modules/tree-sitter-swift/binding.gyp` 仍包含 `actions`
  - `gitnexus/node_modules/tree-sitter-swift/build/Release` 不存在

- `scope: package-script retirement regression, time: 2026-04-09`
  执行：
  `npx vitest run test/unit/cli-commands.test.ts --config vitest.config.ts`
  删除前新增回归测试先失败，失败点为：
  - `package.json.scripts.postinstall` 仍存在

---

## 5. Inferred

- `scope: patch effectiveness interpretation, time: 2026-04-09`
  当前默认 patch 链路没有把本机 Swift grammar 变成可用能力，因此它更像“安装期 best-effort 尝试”而不是“当前稳定支持面的一部分”。

- `scope: support-boundary clarity, time: 2026-04-09`
  退役默认 patch 后，Swift 的真实状态会更清晰：
  - optional grammar
  - 若当前机器不可用，就由 `doctor --json` 明确报 `disabled-or-unavailable`
  - 不再让安装脚本给出“也许已经被暗中修好”的误导性暗示

---

## 6. Historical Baseline

- `scope: P2 baseline, time: 2026-03-24`
  [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  明确把 `Swift patch` 记为需要移除或收编的残留。

- `scope: language-support semantics baseline, time: 2026-04-09`
  [2026-04-09-language-support-deterministic-semantics-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-09-language-support-deterministic-semantics-convergence.md)
  已把 Swift 当前状态稳定表达为：
  - `supportLevel = disabled-or-unavailable`
  - `reasonCode = native-build-unavailable`

---

## 7. 结论

这轮完成的是：

- 默认安装路径里的 Swift patch 退役

这轮没有声称：

- Swift grammar 已被全面支持
- Swift optional dependency 已不再需要后续治理

当前更准确的仓库状态是：

- Swift 仍属于 optional grammar
- 其可用性由 `language-support` 诊断面显式表达
- 仓库不再通过 `postinstall` 保留一个默认执行、但不构成稳定支持承诺的临时 patch 入口
