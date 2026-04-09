# CI Report Language Support Convergence

日期：2026-04-07
范围：GitHub Actions PR sticky report
目标：让 PR 汇总评论真实反映已存在的 `language-support` CI 门禁

---

## 1. 背景

GitNexus 当前 CI 主流程已经显式包含 `language-support` 门禁：

- [ci.yml](/opt/claude/GitNexus/.github/workflows/ci.yml)
  - 运行 `node dist/cli/index.js doctor --json > doctor-output.json`
  - 运行 `node scripts/ci/language-support-report.mjs doctor-output.json`
  - 将 `needs.language-support.result` 写入 `pr-meta/language_support_result`
  - 在 `ci-status` 统一门禁里把 `LANG` 纳入失败条件

因此仓库的真实 CI 状态并不缺失 `language-support`。缺失的是 PR
报告消费者。

---

## 2. 残留问题

本轮修复前，[ci-report.yml](/opt/claude/GitNexus/.github/workflows/ci-report.yml) 存在以下漂移：

- `Read PR metadata` 只读取：
  - `quality_result`
  - `unit_result`
  - `integration_result`
- 没有读取：
  - `language_support_result`
- `Build report` 的 env 没有 `LANG`
- PR 汇总表没有 `Language Support` 行
- overall success 条件也没有把 `LANG` 纳入

结果是：

- branch protection / CI Gate 会因为 `language-support` 失败而阻塞
- 但 PR sticky comment 却可能仍显示“看起来都齐了”，少报一条真实门禁

这是一条典型的工作流残留，而不是 `doctor` 或语言支持实现本身的缺陷。

---

## 3. 本轮修复

本轮主要做 consumer-side 收敛，并顺手修正同一条状态变量的命名风险：

- 更新 [ci-report.yml](/opt/claude/GitNexus/.github/workflows/ci-report.yml)
  - 读取 `language_support_result`
  - 导出 `language` step output
  - 在 report env 中注入 `LANG_SUPPORT`
  - 在 overall 条件中纳入 `LANG_SUPPORT`
  - 在 Pipeline Status 表中增加 `Language Support` 行
- 更新 [ci.yml](/opt/claude/GitNexus/.github/workflows/ci.yml)
  - 把 shell step 中的 `LANG` 状态变量统一改成 `LANG_SUPPORT`
  - 避免与 locale 环境变量 `LANG` 冲突
- 更新 [repository-governance-integration.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/repository-governance-integration.test.ts)
  - 锁住 workflow 必须继续读取并展示 `language-support`
  - 锁住主 CI 与 PR report 都使用非 locale 的状态变量名

本轮不改：

- `doctor` 输出格式
- `language-support-report.mjs`
- `CI` 主流程 artifact 协议（`language_support_result` 文件名保持不变）
- Claude Code / Codex 主路径逻辑

---

## 4. 验证

TDD 验证：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

先验失败：

- 新增断言时失败，原因为 `ci-report.yml` 不包含 `language_support_result`

修复后复验：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

结果：

- `25` 个测试通过

额外治理验证：

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-ci-report-language-support-convergence
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

---

## 5. 结论

当前 CI 与 PR 报告的关系现在重新对齐为：

- `CI` 真正检查什么
- `PR sticky report` 就展示什么

后续如果继续增加新的 required gate，也应同步检查：

1. `CI` 主 workflow 是否已写入 `pr-meta`
2. `ci-report.yml` 是否读取该字段
3. PR 汇总表与 overall 状态是否同步反映

否则就会再次出现“真实门禁已存在，但 PR 汇总少报”的治理残留。
