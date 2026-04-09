# Language Support Policy Convergence

日期：2026-04-07  
范围：`gitnexus/src/core/tree-sitter/language-registry.ts`、`gitnexus/src/ci/language-support-report.ts`、`.github/workflows/ci.yml`  
目标：消除 `language-support` runtime 与 CI reporter 间的重复事实源，避免 builtin/optional 语言名单再次分叉

---

## 1. 背景

上一轮 PR report 收敛已经解决了：

- `language-support` gate 状态可见
- markdown 摘要可见

但仍保留了一处明显的 P2 残留：

- runtime 侧的语言支持事实源在
  [language-registry.ts](/opt/claude/GitNexus/gitnexus/src/core/tree-sitter/language-registry.ts)
- CI 校验侧的 builtin / optional 语言名单在
  [language-support-report.mjs](/opt/claude/GitNexus/gitnexus/scripts/ci/language-support-report.mjs)

两边虽然当前内容一致，但它们并不是同一个 source of truth。

---

## 2. 残留问题

修复前的状态是：

- `doctor --json` 的 `language-support` 明细由 runtime registry 生成
- CI reporter 再用自己硬编码的 builtin / optional 列表做校验
- `ci.yml` 直接执行仓库脚本 `scripts/ci/language-support-report.mjs`

这会留下两类漂移风险：

1. runtime 新增或调整语言分级时，CI reporter 可能继续沿用旧名单
2. CI 若继续跑 source script 而不是编译后的共享模块，就会偏离当前已收敛的 `dist` 路线

这不是功能缺失，而是确定性治理残留。

---

## 3. 本轮修复

本轮采用最小但实质性的收敛：

- 更新
  [language-registry.ts](/opt/claude/GitNexus/gitnexus/src/core/tree-sitter/language-registry.ts)
  - 抽出 builtin / optional 语言 policy 常量
  - 新增 `getLanguageSupportPolicy()`
- 新增
  [language-support-report.ts](/opt/claude/GitNexus/gitnexus/src/ci/language-support-report.ts)
  - 将 reporter 实现迁入 `src/ci`
  - `validateLanguageSupportPolicy()` 直接复用 runtime policy
- 更新 [ci.yml](/opt/claude/GitNexus/.github/workflows/ci.yml)
  - 改为执行 `node dist/ci/language-support-report.js doctor-output.json`
- 保留
  [language-support-report.mjs](/opt/claude/GitNexus/gitnexus/scripts/ci/language-support-report.mjs)
  - 作为 thin compatibility shim
  - 转发到编译后的 `dist/ci` reporter
- 更新测试：
  - [language-registry.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/language-registry.test.ts)
  - [language-support-report.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/language-support-report.test.ts)
  - [repository-governance-integration.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/repository-governance-integration.test.ts)

本轮不改：

- `doctor --json` 输出协议
- Claude Code / Codex host config 逻辑
- optional grammar 的实际加载策略

---

## 4. 风险边界

按仓库规则，原本应先做 GitNexus impact analysis；但本轮对
`getOptionalLanguageSupportSummary` 与 `runDoctor` 的 `gitnexus_impact`
再次失败，错误仍为：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮保持为低风险收敛：

- 只收敛 language-support policy 与 reporter 路径
- 不扩展到新的 runtime 行为
- 通过定向测试与构建验证收口

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts test/unit/language-registry.test.ts test/unit/language-support-report.test.ts --config vitest.config.ts
```

结果：

- `3` 个测试文件通过
- `50` 个测试通过

构建验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npm run build
```

结果：

- `tsc` 构建通过

额外治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-language-support-policy-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-language-support-policy-convergence`
  返回 `Change '2026-04-07-language-support-policy-convergence' is valid`
- `gitnexus_detect_changes(...)`
  返回 `risk_level: low`
  且 `changed_symbols = 0`、`affected_processes = 0`

---

## 6. 结论

`language-support` 现在完成了两层收敛：

1. PR report 已显示 gate 与摘要
2. 摘要校验与语言分级名单不再维持独立事实源

后续若再新增 builtin / optional 语言，优先只改 runtime registry policy，
让 CI reporter 与 workflow 回归测试自动跟上，而不是再维护一套独立名单。
