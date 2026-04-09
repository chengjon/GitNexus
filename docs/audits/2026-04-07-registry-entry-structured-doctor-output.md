# Registry Entry Structured Doctor Output

日期：2026-04-07  
范围：`gitnexus/src/cli/doctor.ts`  
目标：让 `doctor --json` 对 `registry-entry` 输出结构化 `data`，避免自动化继续解析 detail 文案

---

## 1. 背景

在 `language-support`、`embeddings-config`、`native-runtime`、`host-config`
都已补齐结构化 transport 之后，`registry-entry` 仍然停留在 detail-only 状态。

这条 check 虽然不区分 Claude Code / Codex，但属于两条 CLI 主路径共享的 doctor
基础诊断面：不管用户从哪条宿主入口触发 `doctor --json`，都需要可靠知道当前仓库是否已命中全局 registry。

---

## 2. 残留问题

修复前的状态是：

- `runDoctor()` 已经明确知道：
  - 当前 `repoRoot`
  - `readRegistry()` 返回的 registry 列表
  - 是否存在与当前 repo 匹配的 `registryEntry`
  - 若命中时的条目元数据：
    - `name`
    - `path`
    - `storagePath`
    - `indexedAt`
    - `lastCommit`
- 但最终写入 `registry-entry` 时，仍只保留一句文本 detail

这样一来，自动化消费者若想区分：

- “当前 repo 是否命中 registry”
- “命中的是哪条 entry”
- “entry 的路径/索引元数据是什么”

就只能回头重新读取 `registry.json`，或继续解析自然语言文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `registry-entry` check 现在新增结构化 `data`
  - `data` 包含：
    - `repoPath`
    - `matched`
    - `entry`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 registry entry 命中路径
  - 锁住 registry entry 未命中路径

本轮不改：

- registry 解析逻辑
- registry 持久化格式
- Claude Code / Codex 的 host 检测或配置逻辑

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runDoctor`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `registry-entry` 增加 `data`
- 不移除旧 `detail`
- 不改变 registry 命中规则
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
- `18` 个测试通过

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
openspec validate 2026-04-07-registry-entry-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-registry-entry-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `registry-entry` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`registry-entry` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- 当前 doctor 针对的是哪个 `repoPath`
- 当前 repo 是否命中全局 registry
- 若命中，命中的 registry entry 元数据是什么

而不必继续拆解 detail 文案或重复读取 registry 文件。
