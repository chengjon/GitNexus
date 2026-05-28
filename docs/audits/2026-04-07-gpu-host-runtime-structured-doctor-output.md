# GPU Host Runtime Structured Doctor Output

日期：2026-04-07
范围：`gitnexus/src/cli/doctor.ts`
目标：让 `doctor --json` 对 `gpu-host-runtime` 输出结构化 `data`

---

## 1. 背景

在 `gpu-device-node` 已完成结构化之后，GPU 分支里下一条边界最清楚的残留是
`gpu-host-runtime`。

这条 check 只负责描述宿主机 `nvidia-smi` 探测结果：

- 是否执行成功
- 是否因为命令缺失而降级为 warn
- 若失败/成功，摘要输出是什么

它不依赖 Claude Code / Codex 的 host 差异，但同样会被两个 CLI 入口共享消费。

---

## 2. 残留问题

修复前的状态是：

- `runGpuDoctorChecks()` 已经明确知道：
  - 执行的命令是 `nvidia-smi`
  - 执行是否成功
  - `exitCode`
  - `errorCode`
  - 输出摘要
- 但最终输出 `gpu-host-runtime` 时，仍只保留一条文本 detail

这样一来，自动化消费者若想区分：

- “是 pass / warn / fail 中的哪种命令级结果”
- “是命令缺失还是命令执行失败”
- “命令摘要是什么”

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `gpu-host-runtime` check 现在新增结构化 `data`
  - `data` 包含：
    - `command`
    - `ok`
    - `exitCode`
    - `errorCode`
    - `summary`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 `nvidia-smi` 成功的 pass 路径
  - 锁住 `ENOENT` 缺失命令的 warn 路径

本轮不改：

- 其他 GPU checks
- `nvidia-smi` 调用逻辑
- Docker / Ollama 判定逻辑

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runGpuDoctorChecks`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `gpu-host-runtime` 增加 `data`
- 不移除旧 `detail`
- 不改变 `nvidia-smi` 判定逻辑
- 不触碰其他 GPU checks

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
openspec validate 2026-04-07-gpu-host-runtime-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-gpu-host-runtime-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `gpu-host-runtime` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`gpu-host-runtime` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- 实际执行的命令
- 命令是否成功
- `exitCode` / `errorCode`
- 命令输出摘要

而不必继续拆解 detail 文案。
