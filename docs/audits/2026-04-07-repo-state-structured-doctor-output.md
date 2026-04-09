# Repo State Structured Doctor Output

日期：2026-04-07  
范围：`gitnexus/src/cli/doctor.ts`  
目标：让 `doctor --json` 对 `git-repo` 与 `repo-indexed` 输出结构化 `data`

---

## 1. 背景

在 `language-support`、`embeddings-config`、`native-runtime`、`host-config`、
`registry-entry` 都已逐步结构化之后，doctor 的 repo 前置诊断仍然停留在 detail-only 状态。

这两条 check 是所有宿主入口共享的最基础前置面：

- `git-repo`
- `repo-indexed`

无论用户从 Claude Code 还是 Codex 触发 `doctor --json`，自动化都需要稳定知道：

- 当前请求的路径是否是 git repo
- 解析出的 repo root 是什么
- 当前 repo 是否已建立 `.gitnexus` index

---

## 2. 残留问题

修复前的状态是：

- `runDoctor()` 已经明确知道：
  - `requestedRepo`
  - 是否是 git repo
  - `repoRoot`
  - 是否已建立 index
- 但最终输出时，仍只保留两句文本：
  - `Git repository detected at ...`
  - `Index found at ...` / `Repository not indexed. Run: gitnexus analyze`

这样一来，自动化消费者若想区分：

- “请求路径是什么”
- “解析后的 repo root 是什么”
- “当前 repo 是否 indexed”
- “index path 是什么”

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `git-repo` check 现在新增结构化 `data`
  - `repo-indexed` check 现在新增结构化 `data`
  - `git-repo.data` 包含：
    - `requestedPath`
    - `repoPath`
    - `isGitRepo`
  - `repo-indexed.data` 包含：
    - `repoPath`
    - `indexed`
    - `indexPath`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 git repo pass 路径
  - 锁住 repo indexed / not indexed 两条路径
  - 锁住 non-git repo fail 路径

本轮不改：

- git repo 判定逻辑
- index 判定逻辑
- Claude Code / Codex 的 host 行为

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runDoctor`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `git-repo` / `repo-indexed` 增加 `data`
- 不移除旧 `detail`
- 不改变 repo / index 判定逻辑
- 不改变 Claude Code / Codex 共享的 doctor 行为

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/doctor.test.ts --config vitest.config.ts
```

结果：

- `1` 个测试文件通过
- `19` 个测试通过

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
openspec validate 2026-04-07-repo-state-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-repo-state-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 repo-state checks 增加结构化 `data`”的低风险边界

---

## 6. 结论

`git-repo` 与 `repo-indexed` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- 请求路径
- 解析后的 repo root
- 当前路径是否是 git repo
- 当前 repo 是否已建立 `.gitnexus` index
- index path 是什么

而不必继续拆解 detail 文案。
