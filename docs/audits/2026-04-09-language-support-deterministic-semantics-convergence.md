# Language Support Deterministic Semantics Convergence

日期：2026-04-09
范围：`gitnexus/src/core/tree-sitter/language-registry.ts`、`gitnexus/src/ci/language-support-report.ts`、定向 unit tests
目标：把 `language-support` 从只有 `tier + status + detail` 的弱语义，收敛为带有稳定 `supportLevel + reasonCode` 的结构化诊断，方便 `doctor --json`、CI summary 与后续自动化共用同一口径。

治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
路线图基线：[2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)

---

## 1. 背景

此前仓内已经完成两层 `language-support` 收敛：

- runtime registry 与 CI reporter 使用同一份 policy
- `doctor --json` 已输出结构化 `data`

但 P2 里真正需要的“确定性语义”还缺一层：

- builtin 语言虽然始终 `available`，但没有稳定表达“fully supported”
- optional grammar 虽然会显示 `available/unavailable`，但没有稳定 reason code 区分
  “native build 缺失”和“模块根本不存在”
- CI summary 能看到状态，但不能直接复用 machine-readable 级别语义

这会让后续自动化继续退回到解析 `detail` 文本。

---

## 2. 本轮修改

- 在
  [language-registry.ts](/opt/claude/GitNexus/gitnexus/src/core/tree-sitter/language-registry.ts)
  为 `LanguageSupportSummaryEntry` 增加：
  - `supportLevel`
  - `reasonCode`
- builtin 语言现在稳定输出：
  - `supportLevel = fully-supported`
  - `reasonCode = bundled-grammar`
- optional grammar 现在稳定输出：
  - 加载成功时：
    - `supportLevel = supported-with-optional-native-grammar`
    - `reasonCode = optional-native-grammar-loaded`
  - native build 缺失时：
    - `supportLevel = disabled-or-unavailable`
    - `reasonCode = native-build-unavailable`
  - module 缺失时：
    - `reasonCode = module-not-found`
  - bindings file 缺失时：
    - `reasonCode = bindings-not-found`
- 在
  [language-support-report.ts](/opt/claude/GitNexus/gitnexus/src/ci/language-support-report.ts)
  中：
  - CI summary 现在会把 `supportLevel + reasonCode` 渲染进摘要
  - 当输入来自当前结构化 `doctor --json` 数据时，校验逻辑会强制：
    - builtin 必须是 `fully-supported / bundled-grammar`
    - optional 必须显式带有 `supportLevel` 与 `reasonCode`

---

## 3. Measured

- `scope: targeted language-support regression suite, time: 2026-04-09`
  执行：
  `npx vitest run test/unit/language-registry.test.ts test/unit/language-support-report.test.ts test/unit/doctor.test.ts --config vitest.config.ts`
  结果：
  - `3` 个测试文件通过
  - `36` 个测试通过

- `scope: gitnexus TypeScript build, time: 2026-04-09`
  执行：
  `npm run build`
  结果：
  - `tsc` 构建通过

- `scope: current local doctor runtime, time: 2026-04-09`
  执行：
  `node dist/cli/index.js doctor --json`
  当前机器实测 `language-support.data` 中：
  - Kotlin:
    - `status = available`
    - `supportLevel = supported-with-optional-native-grammar`
    - `reasonCode = optional-native-grammar-loaded`
  - Swift:
    - `status = unavailable`
    - `supportLevel = disabled-or-unavailable`
    - `reasonCode = native-build-unavailable`

---

## 4. Inferred

- `scope: deterministic automation contract, time: 2026-04-09`
  只要下游消费 `language-support.data`，后续自动化就不必再通过字符串匹配去猜
  “Swift 为什么 unavailable” 或 “builtin 是否只是碰巧 available”。

- `scope: P2 backlog reduction, time: 2026-04-09`
  这轮完成的是 P2 中“诊断语义确定性”的一部分，不等于 Kotlin / Swift 整体支持问题已经完全关闭。

- `scope: swift patch follow-up, time: 2026-04-09`
  这份审计写成后，同日后续切片又完成了默认 `postinstall` Swift patch 的退役；见
  [2026-04-09-swift-patch-postinstall-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-09-swift-patch-postinstall-retirement.md)。

---

## 5. Historical Baseline

- `scope: language-support policy convergence baseline, time: 2026-04-07`
  [2026-04-07-language-support-policy-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-07-language-support-policy-convergence.md)
  已经收敛了 policy 单一真相源，但当时尚未补上当前这轮的 `supportLevel + reasonCode` 语义层。

- `scope: remediation roadmap baseline, time: 2026-03-24`
  [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  对 P2 的原始目标仍然包括：
  - Kotlin / Swift grammar 加载状态显式化
  - `doctor` / CI 输出语言能力状态
  - Swift patch 脚本的移除或收编

---

## 6. 仍未完成的边界

- 这轮本身没有处理当时仍存在的 Swift patch 路径；该部分已在后续同日切片中退役，历史记录见
  [2026-04-09-swift-patch-postinstall-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-09-swift-patch-postinstall-retirement.md)
- 这轮没有把路线图里的四类支持级别全部变成当前活跃语言的完整矩阵
- 这轮没有改变 optional grammar 的真实运行时可用性，只让其诊断语义更稳定

因此这条切片应被记为：

- 已完成：`doctor` / CI 的 language-support 结构化语义收口
- 未完成：P2 全量关闭

---

## 7. 结论

本轮把 `language-support` 从“可读但偏弱的状态描述”推进到“可读 + 可机读 + 可稳定比较”的确定性语义层。

对当前仓库最直接的收益是：

- builtin 与 optional grammar 的支持级别不再需要靠上下文推断
- Swift 当前失败原因可稳定标为 `native-build-unavailable`
- CI summary 与 `doctor --json` 继续共用同一套事实源，而不是各自生成不同口径
