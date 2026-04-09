# Language Support Structured Doctor Output

日期：2026-04-07  
范围：`gitnexus/src/cli/doctor.ts`、`gitnexus/src/ci/language-support-report.ts`  
目标：让 `doctor --json` 对 `language-support` 提供结构化数据，避免 CI reporter 继续依赖脆弱的字符串解析

---

## 1. 背景

上一轮 `language-support-policy-convergence` 已经解决了：

- runtime 与 CI reporter 使用同一份 builtin / optional policy
- `ci.yml` 走编译后的 `dist/ci` reporter

但仍剩下一处明显的 P2 残留：

- `doctor --json` 里的 `language-support` 事实仍主要通过 `detail: string` 暴露
- reporter 仍要把该字符串重新 parse 成结构化行

也就是说，policy 已统一，但 transport 仍是文本拼接协议。

---

## 2. 残留问题

修复前的状态是：

- `runDoctor()` 已经拿到 `LanguageSupportSummaryEntry[]`
- 但写入 `DoctorCheck` 时，只保留：
  - `status`
  - `detail`
- reporter 需要再把
  `language:tier=status (detail)` 这样的字符串拆回结构化数据

这会留下两个问题：

1. `detail` 只是人类可读字符串，不适合继续做 machine-readable transport
2. 只要 detail 格式未来调整，CI reporter 就可能被动回归

这属于 `doctor` / CI 一致性残留，而不是 policy 残留。

---

## 3. 本轮修复

本轮采用加法兼容收敛：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `DoctorCheck` 新增可选 `data`
  - `language-support` check 现在把完整 `LanguageSupportSummaryEntry[]` 写入 `data`
- 更新
  [language-support-report.ts](/opt/claude/GitNexus/gitnexus/src/ci/language-support-report.ts)
  - `extractLanguageSupportCheck()` 优先读取结构化 `data`
  - `formatLanguageSupportSummary()` 与 `validateLanguageSupportPolicy()` 优先消费 `data`
  - 若遇到旧格式 JSON，仍回退到 `detail` 字符串解析
- 更新测试：
  - [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - [language-support-report.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/language-support-report.test.ts)

本轮不改：

- `doctor --json` 现有 `detail` 字段
- `language-support` 文本摘要格式
- Claude Code / Codex host config 行为

---

## 4. 风险边界

按仓库规则，原本应先做 GitNexus impact analysis；但本轮对
`DoctorCheck` 与 `runDoctor` 的 `gitnexus_impact` 仍失败，错误保持为：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险收敛：

- 仅对 `language-support` 增加结构化 `data`
- 采用加法字段，不移除旧 `detail`
- reporter 保留旧 JSON 回退路径

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/doctor.test.ts test/unit/language-support-report.test.ts --config vitest.config.ts
```

结果：

- `2` 个测试文件通过
- `27` 个测试通过

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
openspec validate 2026-04-07-language-support-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-language-support-structured-doctor-output`
  返回 `Change '2026-04-07-language-support-structured-doctor-output' is valid`
- `gitnexus_detect_changes(...)`
  返回 `risk_level: low`
  且 `changed_symbols = 0`、`affected_processes = 0`

---

## 6. 结论

`language-support` 现在已经不再只依赖字符串 transport：

1. policy 由 runtime registry 统一维护
2. `doctor --json` 以结构化 `data` 暴露 `language-support`
3. reporter 优先消费结构化数据，并兼容旧字符串格式

后续如果继续扩展 `doctor --json` 的其他 checks，优先沿用这个模式：

- `detail` 继续服务人类阅读
- `data` 承担 machine-readable 契约
