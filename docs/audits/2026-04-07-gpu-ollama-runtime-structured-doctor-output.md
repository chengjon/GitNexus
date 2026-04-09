# GPU Ollama Runtime Structured Doctor Output

日期：2026-04-07  
范围：`gitnexus/src/cli/doctor.ts`  
目标：让 `doctor --json` 对 `gpu-ollama-runtime` 输出结构化 `data`

---

## 1. 背景

在 `gpu-device-node`、`gpu-host-runtime`、`gpu-docker-config`、`gpu-container-runtime`
都已结构化之后，GPU runtime 里最后一条核心残留是 `gpu-ollama-runtime`。

这条 check 负责表达 Ollama embed probe 之后的 `/api/ps` GPU offload 结果：

- 当前 provider
- embed probe 是否通过
- 是否真正发起 `/api/ps` 查询
- 匹配到的模型名
- `size_vram`
- 是 pass、CPU fallback fail，还是其它 warn 分支

---

## 2. 残留问题

修复前的状态是：

- `runGpuDoctorChecks()` 已经明确知道：
  - 当前 provider
  - embed probe 状态
  - `/api/ps` 是否查询成功
  - 是否找到目标模型
  - 模型名
  - `size_vram`
  - 当前分支为何 pass / warn / fail
- 但最终输出 `gpu-ollama-runtime` 时，仍只保留一条文本 detail

这样一来，自动化消费者若想区分：

- “是 provider 不支持、probe 未通过、模型未列出、查询失败，还是 CPU fallback”
- “当前模型名和 `size_vram` 是什么”

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `gpu-ollama-runtime` check 现在新增结构化 `data`
  - `data` 包含：
    - `provider`
    - `probeStatus`
    - `queryAttempted`
    - `queryOk`
    - `model`
    - `sizeVram`
    - `skipped`
    - `reason`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 GPU offload 成功的 pass 路径
  - 锁住 `size_vram=0` 的 CPU fallback fail 路径

本轮不改：

- Ollama probe / `/api/ps` 探测逻辑
- fix 行为
- 其他 GPU checks

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runGpuDoctorChecks`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `gpu-ollama-runtime` 增加 `data`
- 不移除旧 `detail`
- 不改变 Ollama runtime 判定逻辑
- 不触碰 fix / retry 行为

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
openspec validate 2026-04-07-gpu-ollama-runtime-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-gpu-ollama-runtime-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `gpu-ollama-runtime` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`gpu-ollama-runtime` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- 当前 provider 与 probe 状态
- 是否真正查询了 `/api/ps`
- 当前目标模型名
- `size_vram`
- 当前分支原因

而不必继续拆解 detail 文案。
