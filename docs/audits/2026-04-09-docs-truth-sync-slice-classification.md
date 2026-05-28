# Docs Truth-Sync Slice Classification Audit

日期：2026-04-09
范围：`79529b5`、`fbf6be9`、`21208a1`、`234c055`、`2f20cf4`、`67caa7f`、`92c6ca1`、`ceca34e`、`ac1afc1`、`1e933da`、`c04c014`、`13276ac`、`4697a4a` 这组相邻 docs/governance 提交的隔离 staged 复核与可推送性分类
目标：把 2026-04-08/09 这批 doc-only truth-sync、status-sync、convergence 记录按“范围风险”和“格式洁净度”分开定类，避免后续把低风险 docs slice 与 mixed-scope 路线图漂移混在一起处理。
治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
顶层总结：[2026-04-09-docs-governance-cleanup-summary.md](/opt/claude/GitNexus/docs/audits/2026-04-09-docs-governance-cleanup-summary.md)

---

## 1. 结论

截至 2026-04-09，这组相邻 docs/governance 提交的原始分类可以分成两类：

- `low + trailing whitespace`
  - `79529b5 docs(fixtures): capture mini-repo ai context convergence`
  - `fbf6be9 docs(ci): capture language support report convergence slices`
  - `21208a1 docs(doctor): capture structured output convergence slices`
  - `234c055 docs(mcp): sync implementation plans and release-design follow-ups`
  - `2f20cf4 docs(detect-changes): sync worktree validation docs and host probes`
  - `67caa7f docs(core): record local-backend and parse-worker truth sync slices`
  - `92c6ca1 docs(ci): record implementation-plan truth sync slices`
  - `ceca34e docs(doctor): record implementation-plan truth sync slices`
  - `ac1afc1 docs(audit): sync technical debt historical status records`
  - `1e933da docs(wiki): sync implementation-plan truth records`
  - `c04c014 docs(wiki): sync review truth records`
  - `13276ac docs(specs): add convergence design records`
- `mixed scope`
  - `4697a4a docs(governance): sync remaining audit and roadmap notes`

截至当前工作树状态，这份分类已经完成一轮落地收敛：

- 上述 `12` 个 `low + trailing whitespace` 切片都已经完成最小 whitespace-only cleanup
- `4697a4a` 作为原始提交仍然是 `mixed scope`，但其当前 live whitespace 残留已经被单独抽成 `3` 文件子集并清理完成
- 本轮仍然没有发现新的“原始提交级别”的 `low + clean` 切片

也就是说，这批相邻 docs 提交在原始提交层面的主要阻塞不是 GitNexus 图谱侧
blast radius，而是两种更基础的问题：

- 一类是 Markdown 行尾双空格和个别 EOF 空白行，导致 `git diff --staged --check` 不干净
- 另一类是提交本身夹带大块路线图漂移，已经超出“可独立推送 docs slice”的边界

---

## 2. 证据分类

### 2.1 Measured

- `scope: isolated staged replay for ac1afc1, time: 2026-04-09`
  通过临时 `GIT_DIR=/tmp/...`、`GIT_INDEX_FILE=/tmp/...` 和真实
  [`.git/objects`](/opt/claude/GitNexus/.git/objects) alternates 重放该提交后：
  - `git diff --staged --check` 命中多处 Markdown trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 17`
    - `changed_count = 15`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 2f20cf4, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 43`
    - `changed_count = 38`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 234c055, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 30`
    - `changed_count = 27`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 21208a1, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中大量 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 120`
    - `changed_count = 105`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for fbf6be9, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 16`
    - `changed_count = 14`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 79529b5, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 8`
    - `changed_count = 7`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 67caa7f, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 19`
    - `changed_count = 17`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 92c6ca1, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 15`
    - `changed_count = 7`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for ceca34e, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 28`
    - `changed_count = 0`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 1e933da, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 60`
    - `changed_count = 54`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for c04c014, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 Markdown trailing whitespace
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 18`
    - `changed_count = 16`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: isolated staged replay for 13276ac, time: 2026-04-09`
  重放后：
  - `git diff --staged --check` 命中多处 trailing whitespace
  - `git diff --staged --check` 还命中至少两处 `new blank line at EOF`
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 23`
    - `changed_count = 13`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: direct diffstat review for 4697a4a, time: 2026-04-09`
  `git show --numstat 4697a4a` 返回：
  - [docs/2026-03-21-gitnexus-embedding-performance-and-ollama-gpu.md](/opt/claude/GitNexus/docs/2026-03-21-gitnexus-embedding-performance-and-ollama-gpu.md) `6  0`
  - [docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md) `25  0`
  - [docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md) `404  18`
  - [docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md) `3  3`

- `scope: current worktree state, time: 2026-04-09 before this audit note`
  `git status --short` 返回空，说明本轮分类是在干净工作树上完成，不受额外本地未提交改动干扰。

### 2.2 Inferred

- `scope: pushability classification, time: 2026-04-09`
  对这批提交而言，`risk_level = low` 只能说明 GitNexus 图谱侧没有波及运行时流程；它不等于该提交已经适合作为“可直接推送的 docs slice”。
  只要 `git diff --staged --check` 仍报 trailing whitespace 或 EOF 空白问题，该 slice 就仍应归为“需要格式清理后才能单独推送”。

- `scope: mixed-scope threshold, time: 2026-04-09`
  `4697a4a` 的主导变化来自
  [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)，
  单文件 `404/+18` 的 diffstat 已足以让它偏离“窄 docs slice”。
  即便其余文件仍是 audit/spec 注记，这个提交也不应直接和前述 truth-sync 小切片归为同类。

- `scope: next-step prioritization, time: 2026-04-09`
  如果后续目标是整理“哪些历史 docs 提交可以被视为干净可复用切片”，优先级应是：
  1. 先清点 `low + trailing whitespace` 清单
  2. 再决定是否单独做 whitespace-only 清理
  3. 最后才处理 `mixed scope` 的路线图拆分

### 2.3 Historical Baseline

- `scope: earlier root-cause audit baseline, time: 2026-04-08`
  关于 `Mmap for size 8796093022208 failed` 的主因与 repo-worker/runtime-drain 修补链，基线见：
  [2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md)。
  本文件不重复判断该运行时根因，只在其后继续做 docs slice 分类。

- `scope: read-only git storage verification baseline, time: 2026-04-09`
  本轮单提交 staged 重放依赖的临时 git storage 方法，基线见：
  [2026-04-09-read-only-git-index-and-alternate-object-store.md](/opt/claude/GitNexus/docs/audits/2026-04-09-read-only-git-index-and-alternate-object-store.md)。
  本文件直接复用那条 `/tmp` index/object store 验证链。

---

## 3. 分类表

| Commit | Subject | Original Classification | Current Status | Why |
|---|---|---|---|---|
| `79529b5` | `docs(fixtures): capture mini-repo ai context convergence` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `fbf6be9` | `docs(ci): capture language support report convergence slices` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `21208a1` | `docs(doctor): capture structured output convergence slices` | `low + trailing whitespace` | cleaned | 原始切片很大，但当前 live whitespace 已收缩到 `30` 文件并完成清理 |
| `234c055` | `docs(mcp): sync implementation plans and release-design follow-ups` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `2f20cf4` | `docs(detect-changes): sync worktree validation docs and host probes` | `low + trailing whitespace` | cleaned | 原始切片较宽，但当前 live whitespace 已收缩到 `11` 文件并完成清理 |
| `67caa7f` | `docs(core): record local-backend and parse-worker truth sync slices` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `92c6ca1` | `docs(ci): record implementation-plan truth sync slices` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `ceca34e` | `docs(doctor): record implementation-plan truth sync slices` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `ac1afc1` | `docs(audit): sync technical debt historical status records` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `1e933da` | `docs(wiki): sync implementation-plan truth records` | `low + trailing whitespace` | cleaned | 原始切片较宽，但当前 live whitespace 已收缩到 `18` 文件并完成清理 |
| `c04c014` | `docs(wiki): sync review truth records` | `low + trailing whitespace` | cleaned | 图谱风险低，当前 live whitespace 已按最小边界清理完成 |
| `13276ac` | `docs(specs): add convergence design records` | `low + trailing whitespace` | cleaned | 图谱风险低，行尾空格与 EOF 空白问题都已按最小边界清理完成 |
| `4697a4a` | `docs(governance): sync remaining audit and roadmap notes` | `mixed scope` | original commit deferred; extracted live whitespace subset cleaned | 原提交仍夹带大块 roadmap 漂移，不是窄 docs slice；但当前 `3` 文件 whitespace 子集已单独清理 |

---

## 4. Whitespace Cleanup Execution Record

以下 `Priority A / B / C / Defer` 保留的是本轮实际执行与归档顺序，不再表示当前仍有待办。

### 4.1 Priority A: small, narrow, and easiest to clean first

执行前被视为最适合先做单独 whitespace-only 清理的提交：

| Commit | Files | `git diff --check` lines | Theme | Why first |
|---|---:|---:|---|---|
| `79529b5` | `8` | `8` | fixture convergence | 文件最少，`check` 输出也最短，没有额外 EOF 异常 |
| `92c6ca1` | `15` | `17` | CI implementation-plan truth-sync | 文件数低，但已出现 EOF 空白行 |
| `fbf6be9` | `16` | `16` | CI convergence | 与上条同域，适合一起处理 |
| `ac1afc1` | `17` | `16` | technical-debt historical status sync | 文件数低，问题模式单一 |

执行前的首个最优候选是 `79529b5`。

原因是：

- `scope: 79529b5 candidate selection, time: 2026-04-09`
  它是当前已分类切片里文件数最少的一档，只有 `8` 个文件。
- `scope: 79529b5 whitespace surface, time: 2026-04-09`
  `git diff --staged --check` 只返回 `8` 行命中，当前看到的异常仅是 trailing whitespace，没有额外 `new blank line at EOF`。
- `scope: 79529b5 thematic boundary, time: 2026-04-09`
  主题只围绕 mini-repo fixture convergence，一条 audit、一条 plan、一条 spec 再加一组 OpenSpec 文件，人工复核边界最窄。

`92c6ca1` 虽然也属于 Priority A，但它已经出现 `new blank line at EOF`，因此更适合作为第二个候选，而不是第一个。

#### 4.1.1 `79529b5` whitespace-only cleanup preflight

`79529b5` 的原始切片包含以下 `8` 个文件：

| Path | Planned action |
|---|---|
| [docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md) | remove trailing whitespace on current lines `3-4` |
| [docs/superpowers/plans/2026-04-07-mini-repo-ai-context-fixture-convergence-implementation-plan.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-04-07-mini-repo-ai-context-fixture-convergence-implementation-plan.md) | expected no-op for whitespace-only cleanup |
| [docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md) | remove trailing whitespace on current lines `3-4` |
| [openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/.openspec.yaml](/opt/claude/GitNexus/openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/.openspec.yaml) | expected no-op for whitespace-only cleanup |
| [openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/design.md](/opt/claude/GitNexus/openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/design.md) | expected no-op for whitespace-only cleanup |
| [openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/proposal.md](/opt/claude/GitNexus/openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/proposal.md) | expected no-op for whitespace-only cleanup |
| [openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/specs/mini-repo-ai-context-fixture-convergence/spec.md](/opt/claude/GitNexus/openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/specs/mini-repo-ai-context-fixture-convergence/spec.md) | expected no-op for whitespace-only cleanup |
| [openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/tasks.md](/opt/claude/GitNexus/openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/tasks.md) | expected no-op for whitespace-only cleanup |

实测上，这个切片当前只暴露出两类尾部空白：

- `scope: 79529b5 live audit header whitespace, time: 2026-04-09`
  [docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md) 的第 `3-4` 行末尾带双空格。
- `scope: 79529b5 live design header whitespace, time: 2026-04-09`
  [docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md) 的第 `3-4` 行末尾带双空格。

因此，如果后续真的执行 `79529b5` 的 whitespace-only cleanup，预期应当只删除这 `4` 处行尾空格，不应顺手改写正文、标题、OpenSpec 内容或其它 `6` 个文件。

- `scope: 79529b5 whitespace-only staged preflight, time: 2026-04-09`
  在 `/tmp` 中只对上述两文件的第 `3-4` 行做 `s/[[:space:]]+$//` 后，再以临时 staged 方式重放，返回：
  - `git diff --cached --name-status`
    - `M docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md`
    - `M docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md`
  - `git diff --cached --check` 返回空
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 2`
    - `changed_count = 2`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `79529b5` 已经具备“真正执行最小 whitespace-only cleanup”所需的边界证据，不需要再先拆更小的子切片。

- `scope: 79529b5 live workspace cleanup result, time: 2026-04-09`
  当前工作树已经实际执行这次最小清理：
  - [docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md)
  - [docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md)
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 只返回上述两文件 `M`
  - `detect_changes(scope='unstaged')` 返回：
    - `changed_files = 2`
    - `changed_count = 2`
    - `affected_count = 0`
    - `risk_level = low`

#### 4.1.2 `92c6ca1` whitespace-only cleanup result

`92c6ca1` 本轮实际清理的目标文件是：

- [docs/audits/2026-04-08-ci-report-language-support-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-ci-report-language-support-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-ci-report-language-support-summary-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-ci-report-language-support-summary-implementation-plan-truth-sync.md)
- [docs/superpowers/specs/2026-04-08-ci-report-language-support-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-ci-report-language-support-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-ci-report-language-support-summary-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-ci-report-language-support-summary-implementation-plan-truth-sync-design.md)

实际动作是：

- 两个 audit 文件去掉第 `3-4` 行尾部空白
- 两个 design 文件去掉第 `3-4` 行尾部空白
- implementation-plan design 再去掉末尾多余空白行

由于当前工作树已经同时包含 `79529b5` 的两处清理，所以通用
`detect_changes(scope='unstaged')` 会把两轮修改一起统计。
为避免口径混合，本轮又单独做了只包含上述四文件的临时 staged 复核。

- `scope: 92c6ca1 live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 对这四个目标文件只返回四条 `M`
  - 只包含这四个文件的临时 staged 复核返回：
    - `changed_files = 4`
    - `changed_count = 2`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `92c6ca1` 也已经按最小边界完成清理，没有把变更扩散到 plan、OpenSpec 或运行时代码。

#### 4.1.3 `fbf6be9` whitespace-only cleanup result

`fbf6be9` 本轮实际清理的目标文件是：

- [docs/audits/2026-04-07-ci-report-language-support-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-07-ci-report-language-support-convergence.md)
- [docs/audits/2026-04-07-ci-report-language-support-summary.md](/opt/claude/GitNexus/docs/audits/2026-04-07-ci-report-language-support-summary.md)
- [docs/superpowers/specs/2026-04-07-ci-report-language-support-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-ci-report-language-support-design.md)
- [docs/superpowers/specs/2026-04-07-ci-report-language-support-summary-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-ci-report-language-support-summary-design.md)

实际动作是：

- 两个 audit 文件去掉第 `3-4` 行尾部空白
- 两个 design 文件去掉第 `3-4` 行尾部空白

- `scope: fbf6be9 live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 对这四个目标文件只返回四条 `M`
  - 只包含这四个文件的临时 staged 复核返回：
    - `changed_files = 4`
    - `changed_count = 4`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `fbf6be9` 也已经按最小边界完成清理，没有把变更扩散到 plan、OpenSpec 或运行时代码。

#### 4.1.4 `ac1afc1` whitespace-only cleanup result

`ac1afc1` 本轮实际清理的目标文件是：

- [docs/audits/2026-04-08-repo-technical-debt-audit-broader-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-repo-technical-debt-audit-broader-status-sync.md)
- [docs/audits/2026-04-08-technical-debt-audit-historical-status-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-technical-debt-audit-historical-status-sync.md)
- [docs/superpowers/specs/2026-04-08-repo-technical-debt-audit-broader-status-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-repo-technical-debt-audit-broader-status-sync-design.md)
- [docs/superpowers/specs/2026-04-08-technical-debt-audit-historical-status-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-technical-debt-audit-historical-status-sync-design.md)

实际动作是：

- 两个 audit 文件去掉第 `3-4` 行尾部空白
- 两个 design 文件去掉第 `3-4` 行尾部空白

- `scope: ac1afc1 live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 对这四个目标文件只返回四条 `M`
  - 只包含这四个文件的临时 staged 复核返回：
    - `changed_files = 4`
    - `changed_count = 4`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `ac1afc1` 也已经按最小边界完成清理，没有把变更扩散到 plan、OpenSpec 或运行时代码。

至此，`Priority A` 的四个小切片都已经完成最小 whitespace-only cleanup。

### 4.2 Priority B: medium-size slices with clear thematic grouping

执行前被视为适合在 Priority A 之后按主题成组清理：

| Commit | Files | Theme | Note |
|---|---:|---|---|
| `c04c014` | `18` | wiki review truth-sync | 可与 wiki 相关切片联动评估 |
| `67caa7f` | `19` | local-backend / parse-worker truth-sync | core docs 但边界仍清楚 |
| `13276ac` | `23` | convergence design records | 除 trailing whitespace 外还有 EOF 空白行 |
| `ceca34e` | `28` | doctor implementation-plan truth-sync | 与 doctor 主题集中 |
| `234c055` | `30` | MCP truth-sync / review | 文件数中等，但 domain 很集中 |

#### 4.2.1 `67caa7f` whitespace-only cleanup result

`67caa7f` 本轮实际清理的目标文件是：

- [docs/audits/2026-04-08-local-backend-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-local-backend-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-parse-worker-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-parse-worker-implementation-plan-truth-sync.md)
- [docs/superpowers/specs/2026-03-26-parse-worker-laravel-route-extraction-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-26-parse-worker-laravel-route-extraction-design.md)
- [docs/superpowers/specs/2026-04-08-local-backend-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-local-backend-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-parse-worker-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-parse-worker-implementation-plan-truth-sync-design.md)

实际动作是：

- 两个 audit 文件去掉第 `3-4` 行尾部空白
- 一个历史 design 记录去掉第 `3-4` 行尾部空白
- 两个 truth-sync design 文件去掉第 `3-4` 行尾部空白

- `scope: 67caa7f live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 对这五个目标文件只返回五条 `M`
  - 只包含这五个文件的临时 staged 复核返回：
    - `changed_files = 5`
    - `changed_count = 5`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `67caa7f` 已经按最小边界完成清理，没有把变更扩散到 plan、OpenSpec 或运行时代码。

#### 4.2.2 `c04c014` whitespace-only cleanup result

`c04c014` 本轮实际清理的目标文件是：

- [docs/audits/2026-04-08-wiki-generator-full-generation-review-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-full-generation-review-truth-sync.md)
- [docs/audits/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-full-generation-review-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-full-generation-review-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync-design.md)

实际动作是：

- 两个 audit 文件去掉第 `3-4` 行尾部空白
- 两个 review truth-sync design 文件去掉第 `3-4` 行尾部空白

- `scope: c04c014 live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 对这四个目标文件只返回四条 `M`
  - 只包含这四个文件的临时 staged 复核返回：
    - `changed_files = 4`
    - `changed_count = 4`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `c04c014` 已经按最小边界完成清理，没有把变更扩散到 plan、OpenSpec 或运行时代码。

#### 4.2.3 `13276ac` whitespace-only cleanup result

`13276ac` 本轮实际清理的目标文件是 `22` 个 spec 设计文档，覆盖：

- `2026-04-07-*convergence-design.md`
- `2026-04-07-*truth-sync-design.md`
- `2026-04-08-*convergence-design.md`
- `2026-04-08-*status-sync-design.md`

本轮没有触及该提交里唯一的 plan 文件：

- [docs/superpowers/plans/2026-04-08-repo-technical-debt-audit-status-sync-implementation-plan.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-04-08-repo-technical-debt-audit-status-sync-implementation-plan.md)

实际动作是：

- 对这 `22` 个 design 文件统一去掉头部第 `3-4` 行尾部空白
- 对其中已确认存在的 design 文件去掉末尾多余空白行

- `scope: 13276ac live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 只返回上述 `22` 个 spec 文件 `M`
  - 只包含这 `22` 个文件的临时 staged 复核返回：
    - `changed_files = 22`
    - `changed_count = 12`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `13276ac` 已经按最小边界完成清理，没有把变更扩散到 plan、OpenSpec 或运行时代码。

#### 4.2.4 `234c055` whitespace-only cleanup result

`234c055` 本轮实际清理的目标文件是：

- [docs/audits/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-mcp-process-management-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-process-management-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-mcp-process-management-review-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-process-management-review-truth-sync.md)
- [docs/superpowers/specs/2026-04-05-mcp-process-management-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-05-mcp-process-management-design.md)
- [docs/superpowers/specs/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-mcp-process-management-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-mcp-process-management-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-mcp-process-management-review-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-mcp-process-management-review-truth-sync-design.md)

实际动作是：

- 三个 audit 文件去掉第 `3-4` 行尾部空白
- 一个历史 design 记录去掉第 `3-4` 行尾部空白
- 三个 truth-sync / review-truth-sync design 文件去掉第 `3-4` 行尾部空白

- `scope: 234c055 live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 对这七个目标文件只返回七条 `M`
  - 只包含这七个文件的临时 staged 复核返回：
    - `changed_files = 7`
    - `changed_count = 7`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `234c055` 已经按最小边界完成清理，没有把变更扩散到 plan、OpenSpec 或运行时代码。

#### 4.2.5 `ceca34e` whitespace-only cleanup result

`ceca34e` 本轮实际清理的目标文件是：

- [docs/audits/2026-04-08-embeddings-config-structured-doctor-output-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-embeddings-config-structured-doctor-output-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-native-runtime-structured-doctor-output-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-native-runtime-structured-doctor-output-implementation-plan-truth-sync.md)
- [docs/superpowers/specs/2026-04-08-embeddings-config-structured-doctor-output-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-embeddings-config-structured-doctor-output-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-native-runtime-structured-doctor-output-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-native-runtime-structured-doctor-output-implementation-plan-truth-sync-design.md)

实际动作是：

- 四个 audit 文件去掉第 `3-4` 行尾部空白
- 四个 truth-sync design 文件去掉第 `3-4` 行尾部空白

- `scope: ceca34e live workspace cleanup result, time: 2026-04-09`
  实测：
  - `git diff --check` 返回空
  - `git diff --name-status` 对这八个目标文件只返回八条 `M`
  - 只包含这八个文件的临时 staged 复核返回：
    - `changed_files = 8`
    - `changed_count = 0`
    - `affected_count = 0`
    - `risk_level = low`

`changed_count = 0` 说明这批文件在当前图谱索引里没有产生可计数的已索引符号变化，但文件级边界与风险结果仍然稳定，且没有把变更扩散到 plan、OpenSpec 或运行时代码。

至此，`Priority B` 的四个切片都已经完成最小 whitespace-only cleanup。

### 4.3 Priority C: large slices, still low-risk but higher cleanup cost

执行前，这些提交不需要先拆主题，但更适合放到后面单独处理：

| Commit | Files | Theme | Why later |
|---|---:|---|---|
| `2f20cf4` | `43` | detect_changes worktree / host probes | 主题集中，但文件数已经偏大 |
| `1e933da` | `60` | wiki implementation-plan truth-sync | wiki 切片很宽，人工复核成本高 |
| `21208a1` | `120` | doctor structured output convergence | 当前最大 slice，清理噪音最多 |

#### 4.3.1 `2f20cf4` whitespace-only cleanup result

`2f20cf4` 的原始切片虽然覆盖 `43` 个 docs/OpenSpec 文件，但当前 live
whitespace 命中只落在下列 `11` 个文件：

- [docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md)
- [docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md)
- [docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md)
- [docs/audits/2026-04-07-detect-changes-worktree-review-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-worktree-review-truth-sync.md)
- [docs/audits/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync.md)
- [docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md)
- [docs/superpowers/specs/2026-04-07-detect-changes-claude-code-cwd-live-probe-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-detect-changes-claude-code-cwd-live-probe-design.md)
- [docs/superpowers/specs/2026-04-07-detect-changes-host-compatibility-matrix-baseline-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-detect-changes-host-compatibility-matrix-baseline-design.md)
- [docs/superpowers/specs/2026-04-07-detect-changes-worktree-design-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-detect-changes-worktree-design-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-07-detect-changes-worktree-review-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-detect-changes-worktree-review-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync-design.md)

原始切片中的其余文件当前没有 live trailing whitespace 命中，因此本轮不动。
例如：

- [docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md)

实际动作是：

- 对其中 `10` 个 audit/design 文件去掉头部第 `3-4` 行尾部空白
- 对 [docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md) 再去掉正文第 `30-31` 行尾部空白

由于当前工作树已经叠加此前多个 docs slice 清理，本轮继续使用只包含上述 `11`
个文件的临时 staged 重放，避免把不同切片的结果混在一起。

- `scope: 2f20cf4 isolated staged whitespace-only replay, time: 2026-04-09`
  实测：
  - `git diff --cached --name-status` 只返回上述 `11` 个文件 `M`
  - `git diff --cached --check` 返回空
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 11`
    - `changed_count = 11`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: 2f20cf4 live workspace cleanup result, time: 2026-04-09`
  实测：
  - 对这 `11` 个目标文件重新执行 `rg -n "[[:blank:]]+$"` 返回空
  - `git diff --name-status -- <target files>` 只返回这 `11` 个文件 `M`

这说明 `2f20cf4` 也已经按最小边界完成 whitespace-only cleanup，没有把变更扩散到
其余 `32` 个原始切片文件、plan/OpenSpec 非命中文件或运行时代码。

#### 4.3.2 `1e933da` whitespace-only cleanup result

`1e933da` 的原始切片覆盖 `30` 个 docs 文件，分布在 audit / plan / spec 三层。
但当前 live trailing whitespace 命中只落在下列 `18` 个 audit/spec 文件：

- [docs/audits/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-wiki-generator-incremental-update-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-incremental-update-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-wiki-generator-overview-page-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-overview-page-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync.md)
- [docs/superpowers/specs/2026-03-26-wiki-generator-module-tree-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-26-wiki-generator-module-tree-design.md)
- [docs/superpowers/specs/2026-03-26-wiki-generator-page-generation-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-26-wiki-generator-page-generation-design.md)
- [docs/superpowers/specs/2026-03-27-wiki-generator-incremental-update-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-incremental-update-design.md)
- [docs/superpowers/specs/2026-03-27-wiki-generator-overview-page-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-overview-page-design.md)
- [docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design.md)
- [docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-incremental-update-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-incremental-update-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-module-tree-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-overview-page-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-overview-page-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync-design.md)

原始切片中的 `12` 个 plan 文件当前没有 live trailing whitespace 命中，因此本轮不动。

实际动作是：

- 对 `6` 个 audit truth-sync 文件去掉头部第 `3-4` 行尾部空白
- 对 `6` 个历史 design 记录去掉头部第 `3-4` 行尾部空白
- 对 `6` 个 implementation-plan truth-sync design 文件去掉头部第 `3-4` 行尾部空白

- `scope: 1e933da isolated staged whitespace-only replay, time: 2026-04-09`
  实测：
  - `git diff --cached --name-status` 只返回上述 `18` 个文件 `M`
  - `git diff --cached --check` 返回空
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 18`
    - `changed_count = 18`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: 1e933da live workspace cleanup result, time: 2026-04-09`
  实测：
  - 对这 `18` 个目标文件重新执行 `rg -n "[[:blank:]]+$"` 返回空
  - `git diff --name-status -- <target files>` 只返回这 `18` 个文件 `M`

这说明 `1e933da` 也已经按最小边界完成 whitespace-only cleanup，没有把变更扩散到
该切片中的 plan 文件、其余非命中文档或运行时代码。

#### 4.3.3 `21208a1` whitespace-only cleanup result

`21208a1` 是这组历史提交里原始范围最大的切片，但就当前 `docs/` 子树而言，实测只覆盖
`45` 个 docs 文件；其中 live trailing whitespace 命中进一步收缩为下列 `30` 个
audit/spec 文件：

- [docs/audits/2026-04-07-embeddings-config-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-embeddings-config-structured-doctor-output.md)
- [docs/audits/2026-04-07-gpu-container-runtime-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-gpu-container-runtime-structured-doctor-output.md)
- [docs/audits/2026-04-07-gpu-device-node-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-gpu-device-node-structured-doctor-output.md)
- [docs/audits/2026-04-07-gpu-docker-config-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-gpu-docker-config-structured-doctor-output.md)
- [docs/audits/2026-04-07-gpu-fix-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-gpu-fix-structured-doctor-output.md)
- [docs/audits/2026-04-07-gpu-host-runtime-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-gpu-host-runtime-structured-doctor-output.md)
- [docs/audits/2026-04-07-gpu-ollama-runtime-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-gpu-ollama-runtime-structured-doctor-output.md)
- [docs/audits/2026-04-07-host-config-edge-structured-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-host-config-edge-structured-output.md)
- [docs/audits/2026-04-07-host-config-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-host-config-structured-doctor-output.md)
- [docs/audits/2026-04-07-host-detect-changes-guidance-structured-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-host-detect-changes-guidance-structured-output.md)
- [docs/audits/2026-04-07-language-support-policy-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-07-language-support-policy-convergence.md)
- [docs/audits/2026-04-07-language-support-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-language-support-structured-doctor-output.md)
- [docs/audits/2026-04-07-native-runtime-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-native-runtime-structured-doctor-output.md)
- [docs/audits/2026-04-07-registry-entry-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-registry-entry-structured-doctor-output.md)
- [docs/audits/2026-04-07-repo-state-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-repo-state-structured-doctor-output.md)
- [docs/superpowers/specs/2026-04-07-embeddings-config-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-embeddings-config-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-gpu-container-runtime-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-gpu-container-runtime-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-gpu-device-node-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-gpu-device-node-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-gpu-docker-config-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-gpu-docker-config-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-gpu-fix-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-gpu-fix-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-gpu-host-runtime-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-gpu-host-runtime-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-gpu-ollama-runtime-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-gpu-ollama-runtime-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-host-config-edge-structured-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-host-config-edge-structured-output-design.md)
- [docs/superpowers/specs/2026-04-07-host-config-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-host-config-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-host-detect-changes-guidance-structured-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-host-detect-changes-guidance-structured-output-design.md)
- [docs/superpowers/specs/2026-04-07-language-support-policy-convergence-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-language-support-policy-convergence-design.md)
- [docs/superpowers/specs/2026-04-07-language-support-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-language-support-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-native-runtime-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-native-runtime-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-registry-entry-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-registry-entry-structured-doctor-output-design.md)
- [docs/superpowers/specs/2026-04-07-repo-state-structured-doctor-output-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-repo-state-structured-doctor-output-design.md)

原始 docs 切片中的其余 `15` 个文件当前没有 live trailing whitespace 命中，因此本轮不动。

实际动作是：

- 对 `15` 个 audit 文件去掉头部第 `3-4` 行尾部空白
- 对 `15` 个 structured-output design 文件去掉头部第 `3-4` 行尾部空白

- `scope: 21208a1 isolated staged whitespace-only replay, time: 2026-04-09`
  实测：
  - `git diff --cached --name-status` 只返回上述 `30` 个文件 `M`
  - `git diff --cached --check` 返回空
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 30`
    - `changed_count = 30`
    - `affected_count = 0`
    - `risk_level = low`

- `scope: 21208a1 live workspace cleanup result, time: 2026-04-09`
  实测：
  - 对这 `30` 个目标文件重新执行 `rg -n "[[:blank:]]+$"` 返回空
  - `git diff --name-status -- <target files>` 只返回这 `30` 个文件 `M`

这说明 `21208a1` 也已经按最小边界完成 whitespace-only cleanup，没有把变更扩散到
该切片中的其余 docs 文件、OpenSpec 非命中文件或运行时代码。

至此，`Priority C` 的三个大切片都已经完成最小 whitespace-only cleanup。

### 4.4 Defer: not a whitespace-only cleanup target

| Commit | Files | Classification | Why defer |
|---|---:|---|---|
| `4697a4a` | `4` | `mixed scope` | 主问题不是格式，而是路线图漂移与 mixed scope |

#### 4.4.1 `4697a4a` extracted live whitespace-only subset

`4697a4a` 作为原始提交仍然应保留 `mixed scope` 分类，不应被重新表述为“纯
whitespace-only cleanup”：

- 该提交同时改动了 audit、design、embedding note，以及
  [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  这类高体量路线图文件
- 原提交里路线图文件本身有 `422 + / 1 -` 级别的大块内容漂移，因此“原提交能否单独推送”的答案仍然是 `defer`

但就当前工作树的 live whitespace 残留而言，实际可抽出的最小子集只有 `3` 个文件：

- [docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md)
- [docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
- [docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md)

原始切片中的这一个文件当前没有 live trailing whitespace 命中，因此本轮不动：

- [docs/2026-03-21-gitnexus-embedding-performance-and-ollama-gpu.md](/opt/claude/GitNexus/docs/2026-03-21-gitnexus-embedding-performance-and-ollama-gpu.md)

实际动作是：

- 对 audit 文件去掉头部第 `3-5` 行尾部空白
- 对 roadmap 文件去掉头部第 `3-5` 行尾部空白
- 对历史 design 记录去掉头部第 `3-4` 行尾部空白

- `scope: 4697a4a extracted staged whitespace-only replay, time: 2026-04-09`
  实测：
  - `git diff --cached --name-status` 只返回上述 `3` 个文件 `M`
  - `git diff --cached --check` 返回空
  - `detect_changes(scope='staged')` 返回：
    - `changed_files = 3`
    - `changed_count = 3`
    - `affected_count = 0`
    - `risk_level = low`

这说明 `4697a4a` 虽然仍是 `mixed scope` 提交，但其当前 live whitespace 残留已经被单独
抽离并完成最小 cleanup；被 defer 的，是原提交的内容边界，不是这次抽出的 `3` 文件
header-level 清理。

---

## 5. 代表性问题文件

### 5.1 `1e933da`

- [docs/audits/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-full-generation-implementation-plan-truth-sync-design.md)
- [docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-wiki-generator-support-run-pipeline-implementation-plan-truth-sync-design.md)

### 5.2 `21208a1`

- [docs/audits/2026-04-07-embeddings-config-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-embeddings-config-structured-doctor-output.md)
- [docs/audits/2026-04-07-language-support-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-language-support-structured-doctor-output.md)
- [docs/audits/2026-04-07-native-runtime-structured-doctor-output.md](/opt/claude/GitNexus/docs/audits/2026-04-07-native-runtime-structured-doctor-output.md)

### 5.3 `234c055`

- [docs/audits/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-mcp-process-management-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-process-management-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-mcp-process-management-review-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-process-management-review-truth-sync.md)

### 5.4 `2f20cf4`

- [docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md)
- [docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md)
- [docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md)

### 5.5 `13276ac`

- [docs/superpowers/specs/2026-04-07-detect-changes-primary-dual-cli-host-convergence-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-07-detect-changes-primary-dual-cli-host-convergence-design.md)
- [docs/superpowers/specs/2026-04-08-repo-technical-debt-audit-status-sync-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-repo-technical-debt-audit-status-sync-design.md)
- [docs/superpowers/specs/2026-04-08-readme-primary-dual-cli-framing-convergence-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-04-08-readme-primary-dual-cli-framing-convergence-design.md)

### 5.6 `ceca34e`

- [docs/audits/2026-04-08-embeddings-config-structured-doctor-output-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-embeddings-config-structured-doctor-output-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync.md)
- [docs/audits/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync.md](/opt/claude/GitNexus/docs/audits/2026-04-08-language-support-structured-doctor-output-implementation-plan-truth-sync.md)

### 5.7 `4697a4a`

- [docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)

---

## 6. 后续复用规则

- 后续如果还要整理“可单独推送的 docs slice”，不要只看 `risk_level`；必须把 `git diff --staged --check` 是否干净作为独立门槛。
- `low + trailing whitespace` 这类提交应继续归档为“内容边界基本干净，但格式不干净”，并与当前工作树的已完成 cleanup 结果分开记录。
- 若未来再出现同类批量 whitespace 清理，执行顺序仍应优先 `Priority A -> Priority B -> Priority C`，不要从最大 slice 开始。
- `mixed scope` 这类提交不要直接重分类为 whitespace-only cleanup；应先决定是否拆出路线图或其它内容漂移，再谈是否可单独推送。
- 在真实 [`.git`](/opt/claude/GitNexus/.git) 仍只读的前提下，继续做类似历史切片核验时，应复用
  [2026-04-09-read-only-git-index-and-alternate-object-store.md](/opt/claude/GitNexus/docs/audits/2026-04-09-read-only-git-index-and-alternate-object-store.md)
  里的临时 git storage 流程。
