# Review: review.md

**Type**: `.md` / proposal-review | **Perspective**: completeness, consistency, feasibility | **Date**: 2026-06-03

## Summary

该摘要中列出的主要实现文件和关键符号大多存在，`gitnexus-shared` 与 `gitnexus` 当前都能完成 `npm run build`。但“任务已完成”的治理闭环不成立：6 个 OpenSpec 子变更无法通过严格校验，子变更 `tasks.md` 均未勾选，且若干完成声明缺少对应测试证据。

## Verified

- C1 Required sections: 文档包含 Background、Change List、OpenSpec Tracking、Verification、Stats、Review Checklist，结构足以作为 review summary。
- C4 Acceptance criteria: 源文档第 143-152 行列出人工复核清单，但所有条目仍为未勾选状态，不能视为完成验收。
- N4 Cross-references: 绝大多数实现路径存在，包括 `gitnexus/src/mcp/local/local-backend.ts`、`gitnexus/src/core/file-classifier.ts`、`gitnexus/src/core/risk-rationale.ts`、`gitnexus/src/core/ingestion/style-imports.ts`、`gitnexus-shared/src/graph/types.ts`。
- F2 Dependency availability: `npx openspec --version` 可用，返回 `1.2.0`；因此 OpenSpec 校验失败不是因为工具缺失。
- F1 Technical feasibility: 实现层当前可构建；验证命令显示 `gitnexus-shared build: PASS` 与 `gitnexus build: PASS`。

## Issues

- [ ] **[HIGH]** OpenSpec 跟踪声明不可验证，6 个子变更均无法通过严格校验 — Background:line 12, OpenSpec Tracking:lines 109-120, Stats:line 138
      Evidence: 外部检查运行 `npx openspec validate <change-id> --strict` 覆盖 6 个表中列出的 change，全部返回 `FAIL`，核心错误均为 `Change must have at least one delta. No deltas found.`；目录结构检查显示这些 change 只有 `proposal.md`、`tasks.md`、`.openspec.yaml`，并出现字面量 `{specs/...}` 目录，未被 OpenSpec 解析为标准 `specs/<capability>/spec.md` delta。内部检查源文档第 12 行称 “All changes are tracked as OpenSpec change proposals”，第 138 行称 “6 OpenSpec change proposals”，但 Verification 第 126-130 行只覆盖 build/tests/pre-commit，没有说明 OpenSpec validate 失败或将其列为未完成限制。

- [ ] **[HIGH]** 子变更任务清单未关闭，不能支撑“implemented/completed”的完成结论 — Change List:lines 16-105, Review Checklist:lines 143-152
      Evidence: 外部检查读取 6 个子变更 `tasks.md`，结果分别为 `0/17`、`0/16`、`0/11`、`0/20`、`0/10`、`0/25` checked；源文档自己的 Review Checklist 第 145-152 行也全部是 `- [ ]` 未勾选。内部检查未发现 Non-Goals 或 batch exclusion 将任务勾选排除在完成标准之外；相反，第 12 行使用 “implemented”，第 126-130 行给出完成式 Verification，容易让读者误以为任务已关闭。

- [ ] **[MED]** 引用的反馈来源在当前仓库缺失，背景依据不可复核 — Background:line 12
      Evidence: 外部路径检查显示 `mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md` 为 `NO missing`；同批实现文件路径均能解析，说明这是特定引用缺失，不是扫描范围整体错误。内部检查 Background 只给出该路径，没有提供摘录、替代证据、外部仓库说明或 commit/hash，因此当前仓库读者无法复核六项优先级的来源。

- [ ] **[MED]** 测试覆盖声明过宽，新增行为缺少直接测试证据 — Verification:line 129, Review Checklist:lines 145-152
      Evidence: 外部测试资产扫描 400 个测试文件，未找到 `changed_file_classes`、`forbidden_file_classes`、`risk_rationale`、`generateRiskRationale`、`styleImportsPhase`、`STYLE_IMPORTS`、`extractStyleImports`、`staged-only`、`changed-only`、`fresh_for_staged_diff`、`stale_reasons` 的直接测试命中；只找到 `--json` 相关测试 3 处与 `warnMissingOptionalGrammars` 相关命中 1 处。抽样执行结果为 `cli-index-help.test.ts: PASS`、`run-analyze.test.ts: PASS`、`detect-changes-worktree.test.ts: FAIL`。内部检查第 129 行声称 “9,729 pass, 7 fail (all pre-existing)” 并说 “only test our changes could have broken” 是 `cli-index-help.test.ts`，但第 145-152 行列出的待验收点覆盖 MCP freshness、file classifier、detect_changes response、incremental analyze、STYLE_IMPORTS、risk_rationale、grammar warning；这些并未被第 129 行的叙述逐项证明。

- [ ] **[MED]** `Stats` 将“6 OpenSpec change proposals (18 files: proposal, tasks, yaml each)”写成完成统计，但当前 OpenSpec 文件布局实际不可用 — Stats:line 138
      Evidence: 外部检查确认 6 个目录确实各有 `.openspec.yaml`、`proposal.md`、`tasks.md`，但没有可解析 delta spec；`openspec validate --strict` 全部失败。内部检查第 138 行只统计文件数量，没有区分“文件存在”和“OpenSpec 有效”，而该仓库规则将 OpenSpec 作为能力边界和 accepted change intent 的事实源，数量统计会掩盖校验失败。

- [ ] **[LOW]** 验证统计缺少可复现命令、日志位置和范围说明 — Verification:lines 126-130
      Evidence: 外部复跑当前最小验证得到 build 通过；相关单测抽样中 `detect-changes-worktree.test.ts` 当前 41 个测试里 1 个失败，失败点为 `impact relationTypes auto-expansion`。内部检查第 129 行给出 `9,729 pass, 7 fail`，但没有列出运行命令、测试范围、失败测试清单、stash 对照命令或日志路径；读者无法判断该统计是否对应 commit `4ad039c6`、当前 `HEAD`、还是一次临时工作树状态。

## Suggestions

- 将 6 个 OpenSpec 变更的字面量 `{specs/...}` 目录修正为标准 `specs/<capability>/spec.md`，补齐 delta headers 与 `#### Scenario:`，并在报告中记录 `npx openspec validate <id> --strict` 的通过结果。
- 按每个子变更实际完成情况更新 `tasks.md` 勾选状态；若某些任务尚未完成，将 review summary 从“implemented”改成“implemented draft / pending verification”，并列出剩余任务。
- 为第 145-152 行的 Review Checklist 逐项补充证据：命令、输出摘要、日志路径或测试文件路径；不要用总测试数替代行为级验收。
- 对新增行为补充 focused tests 或明确标注未覆盖：`changed_file_classes`、`forbidden_file_classes`、`risk_rationale`、增量 analyze flags、`STYLE_IMPORTS` graph edges、`fresh_for_staged_diff` / `stale_reasons`。
- 修复或解释缺失的反馈来源路径；如果该文件属于外部仓库，应在 Background 写明仓库、commit 或复制本次决策所需的最小摘要。

## Verdict

NEEDS_REVISION — 实现层有可构建证据，但完成任务的 OpenSpec、任务清单和行为级验证证据没有闭环；当前 `review.md` 不能作为“已完成”记录批准。
