# GPU Fix Structured Doctor Output

日期：2026-04-07
范围：`gitnexus/src/cli/doctor.ts`
目标：让 `doctor --json` 对 `gpu-fix` 输出结构化 `data`

---

## 1. 背景

在 `gpu-device-node`、`gpu-host-runtime`、`gpu-docker-config`、`gpu-container-runtime`、
`gpu-ollama-runtime` 都已结构化之后，GPU 分支里最后一个仍停留在 detail-only 的核心项是
`gpu-fix`。

这条 check 负责汇总：

- 本轮自动执行了哪些安全修复
- 仍有哪些人工 follow-up

这条信息对 Claude Code 与 Codex 侧的后续自动化都同样重要。

---

## 2. 残留问题

修复前的状态是：

- `runGpuDoctorChecks()` 已经明确知道：
  - `fixActions`
  - `manualActions`
- 但最终输出 `gpu-fix` 时，仍只保留拼接后的文本 detail

这样一来，自动化消费者若想区分：

- “到底应用了哪些 safe fixes”
- “是否仍有 manual follow-up”

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `gpu-fix` check 现在新增结构化 `data`
  - `data` 包含：
    - `appliedFixes`
    - `manualFollowUps`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住成功应用 safe fix 的 pass 路径

本轮不改：

- safe fix 执行逻辑
- manual follow-up 判定逻辑
- 其他 GPU checks

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runGpuDoctorChecks`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `gpu-fix` 增加 `data`
- 不移除旧 `detail`
- 不改变 fix / follow-up 判定逻辑

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/doctor.test.ts --config vitest.config.ts
```

结果：

- `1` 个测试文件通过
- `20` 个测试通过

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
openspec validate 2026-04-07-gpu-fix-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-gpu-fix-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `gpu-fix` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`gpu-fix` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- 当前已应用的 safe fixes
- 仍需人工处理的 follow-up

而不必继续拆解 detail 文案。
