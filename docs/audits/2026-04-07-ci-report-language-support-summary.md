# CI Report Language Support Summary

日期：2026-04-07
范围：GitHub Actions `language-support` CI job 与 PR sticky report
目标：让 PR 汇总评论不仅显示 `language-support` 门禁状态，也显示该门禁已经生成的语言支持摘要

---

## 1. 背景

截至上一轮收敛，PR sticky report 已经能正确显示：

- `Language Support = success/failure`

但它仍看不到这条门禁背后的摘要内容。与此同时，主 CI 其实早就已经生成了可读摘要：

- `doctor --json` 生成原始诊断
- `language-support-report.mjs` 把结果格式化成 markdown
- GitHub Step Summary 已经收到这段 markdown

也就是说，缺的不是数据或格式化逻辑，而是跨 workflow 的持久化和消费。

---

## 2. 残留问题

修复前的状态是：

- [ci.yml](/opt/claude/GitNexus/.github/workflows/ci.yml)
  - 运行 `node scripts/ci/language-support-report.mjs doctor-output.json`
  - 但没有把格式化后的摘要保存成 artifact
- [ci-report.yml](/opt/claude/GitNexus/.github/workflows/ci-report.yml)
  - 只能读取 `pr-meta` 中的 status
  - 无法读取具体的语言支持摘要

结果是：

- operator 能知道这条 gate 过没过
- 但看不到 Kotlin / Swift 等 optional grammar 的具体状态
- 仍需跳回原始 CI run 或 step summary 才能判断细节

这是 PR report 信息链路不完整，而不是 `doctor` 或 `language-support-report.mjs`
本身的缺陷。

---

## 3. 本轮修复

本轮继续沿用最小复用原则：

- 更新 [ci.yml](/opt/claude/GitNexus/.github/workflows/ci.yml)
  - 将 `language-support-report.mjs` 输出 `tee` 到 `language-support-summary.md`
  - 上传新的 `language-support-report` artifact
  - artifact 包含：
    - `gitnexus/doctor-output.json`
    - `gitnexus/language-support-summary.md`
- 更新 [ci-report.yml](/opt/claude/GitNexus/.github/workflows/ci-report.yml)
  - 下载 `language-support-report`
  - 查找 `language-support-summary.md`
  - 在 PR comment 中以折叠块形式渲染 `Language Support Summary`
- 更新 [repository-governance-integration.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/repository-governance-integration.test.ts)
  - 锁住 artifact 上传、下载和渲染路径

本轮不改：

- `doctor --json` 输出结构
- `language-support-report.mjs` 的解析 / 格式化实现
- 双 CLI 行为边界

---

## 4. 验证

TDD 验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

先验失败：

- 断言 `ci.yml` 必须上传 `language-support-report`
- 断言 `ci-report.yml` 必须下载并渲染 `language-support-summary.md`

修复后复验：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts test/unit/language-support-report.test.ts --config vitest.config.ts
```

结果：

- `30` 个 workflow/governance 测试通过
- `7` 个 language-support report 测试通过
- 总计 `37` 个测试通过

额外治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-ci-report-language-support-summary
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-ci-report-language-support-summary`
  返回 `Change '2026-04-07-ci-report-language-support-summary' is valid`
- `gitnexus_detect_changes(...)`
  返回 `risk_level: low`
  且 `changed_symbols = 0`、`affected_processes = 0`

---

## 5. 结论

PR sticky report 现在对 `language-support` 已经形成完整的 operator 反馈链：

1. 显示门禁状态
2. 显示语言支持摘要
3. 摘要复用 CI 原本已验证的格式化结果

后续如果再为 CI gate 增加“状态之外的细节摘要”，建议复用同一模式：

- producer job 生成稳定 markdown
- artifact 持久化
- PR report consumer 只做下载和渲染

这样能避免 report 侧重新计算或重新解释真实门禁结果。
