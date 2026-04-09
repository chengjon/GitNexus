# GPU Container Runtime Structured Doctor Output

日期：2026-04-07  
范围：`gitnexus/src/cli/doctor.ts`  
目标：让 `doctor --json` 对 `gpu-container-runtime` 输出结构化 `data`

---

## 1. 背景

在 `gpu-device-node`、`gpu-host-runtime`、`gpu-docker-config` 已结构化之后，
GPU 分支里下一条最自然的 transport 残留是 `gpu-container-runtime`。

这条 check 负责表达容器内 `nvidia-smi` 探针结果：

- 是否实际尝试执行
- 执行是否成功
- 失败时是 skip 还是命令级失败
- 容器内 probe 的摘要输出

---

## 2. 残留问题

修复前的状态是：

- `runGpuDoctorChecks()` 已经明确知道：
  - 容器内探针命令
  - 是否真正尝试执行
  - 执行是否成功
  - `exitCode`
  - `errorCode`
  - 输出摘要
  - 是否因为缺少容器 / inspect 失败 / 容器未运行而跳过
- 但最终输出 `gpu-container-runtime` 时，仍只保留一条文本 detail

这样一来，自动化消费者若想区分：

- “容器 probe 是真的执行了还是跳过了”
- “命令本身是否成功”
- “输出摘要是什么”

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `gpu-container-runtime` check 现在新增结构化 `data`
  - `data` 包含：
    - `command`
    - `attempted`
    - `ok`
    - `exitCode`
    - `errorCode`
    - `summary`
    - `skipped`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住容器内 probe 成功的 pass 路径
  - 锁住缺少 `ollama` 容器而跳过的 pass 路径

本轮不改：

- 容器 runtime 探针逻辑
- Docker fix 行为
- 其他 GPU checks

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runGpuDoctorChecks`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `gpu-container-runtime` 增加 `data`
- 不移除旧 `detail`
- 不改变容器 probe 判定逻辑
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
openspec validate 2026-04-07-gpu-container-runtime-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-gpu-container-runtime-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `gpu-container-runtime` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`gpu-container-runtime` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- 实际执行的容器 probe 命令
- 是否真的执行了探针
- 执行是否成功
- `exitCode` / `errorCode`
- 输出摘要

而不必继续拆解 detail 文案。
