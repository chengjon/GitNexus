# Language Support Operator Availability Matrix Convergence

日期：2026-04-09
范围：`README.md`、`docs/gitnexus-quick-start-guide.md`、`docs/ai-cli-local-quick-start.md`
目标：把 operator-facing 文档中的语言支持列表从“平铺语言名”收敛为“built-in vs optional”矩阵，避免把 Kotlin / Swift 误写成所有主机默认稳定可用。

治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
相关基线：
- [2026-04-09-language-support-deterministic-semantics-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-09-language-support-deterministic-semantics-convergence.md)
- [2026-04-09-swift-patch-postinstall-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-09-swift-patch-postinstall-retirement.md)

---

## 1. 背景

截至本轮之前，公开入口文档仍保留一类残留：

- `README.md` 把 Kotlin / Swift 与 built-in 语言放在同一“Supported Languages”平铺列表
- `docs/gitnexus-quick-start-guide.md` 也沿用同样写法
- `docs/ai-cli-local-quick-start.md` 虽然已要求运行 `gitnexus doctor`，但没有把语言支持层级明确写成 operator-facing 规则

在 P2 已经完成结构化语义和 Swift patch 退役之后，这种写法会继续制造旧叙事：

- “列在支持语言里”容易被误读成“默认稳定支持”
- operator 容易跳过 `doctor` 检查，直接把 Kotlin / Swift 当成 host-invariant 能力

---

## 2. 本轮修改

- 更新 [README.md](/opt/claude/GitNexus/README.md)
  - 把支持语言改为：
    - built-in grammars
    - optional native grammars
  - 明确要求用 `gitnexus doctor` / `gitnexus doctor --json` 检查当前主机的
    `language-support`
- 更新 [gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md)
  - 用中文同步相同矩阵与 availability 提示
- 更新 [ai-cli-local-quick-start.md](/opt/claude/GitNexus/docs/ai-cli-local-quick-start.md)
  - 新增 `Language Support Availability` 段
  - 明确 `status`、`supportLevel`、`reasonCode` 的 operator-facing 含义

本轮不改：

- parser loader 或 grammar 加载实现
- `doctor --json` 输出结构
- CI `language-support` gate 行为

---

## 3. Measured

- `scope: doc entrypoint inspection, time: 2026-04-09`
  本轮修改前，以下入口仍把 Kotlin / Swift 直接列在统一支持列表中：
  - [README.md](/opt/claude/GitNexus/README.md)
  - [gitnexus-quick-start-guide.md](/opt/claude/GitNexus/docs/gitnexus-quick-start-guide.md)

- `scope: language-support diagnostics baseline, time: 2026-04-09`
  同日已由本地实测确认：
  - Kotlin 当前机器可表示为
    `supported-with-optional-native-grammar / optional-native-grammar-loaded`
  - Swift 当前机器可表示为
    `disabled-or-unavailable / native-build-unavailable`

---

## 4. Inferred

- `scope: operator wording safety, time: 2026-04-09`
  只要公开文档继续平铺 Kotlin / Swift，用户就仍可能把它们视为和
  TypeScript / JavaScript 一样的 built-in 能力。

- `scope: P2 tail closure quality, time: 2026-04-09`
  在代码与诊断已经 truth-sync 后，operator-facing matrix/availability 文档同步是
  P2 剩余尾项的一部分，而不是额外新需求。

---

## 5. Historical Baseline

- `scope: roadmap baseline, time: 2026-03-24`
  [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  现已把 P2 的剩余工作缩窄为：
  - language support matrix
  - availability 说明
  - 历史文档 truth-sync

- `scope: semantics baseline, time: 2026-04-09`
  [2026-04-09-language-support-deterministic-semantics-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-09-language-support-deterministic-semantics-convergence.md)
  已为 `language-support` 建立稳定 `supportLevel + reasonCode` 语义。

- `scope: swift patch baseline, time: 2026-04-09`
  [2026-04-09-swift-patch-postinstall-retirement.md](/opt/claude/GitNexus/docs/audits/2026-04-09-swift-patch-postinstall-retirement.md)
  已确认默认安装链路中的 Swift patch 不再属于稳定支持面。

---

## 6. Outcome

当前 operator-facing 口径已经与本地真实能力对齐：

- built-in 与 optional grammar 不再混写
- Kotlin / Swift 不再被文档默认宣称为 host-invariant 稳定能力
- 读者被明确引导去看 `doctor` 的 `language-support` 诊断面，而不是从静态语言列表推断可用性
