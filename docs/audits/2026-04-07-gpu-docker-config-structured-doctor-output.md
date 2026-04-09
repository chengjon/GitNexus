# GPU Docker Config Structured Doctor Output

日期：2026-04-07  
范围：`gitnexus/src/cli/doctor.ts`  
目标：让 `doctor --json` 对 `gpu-docker-config` 输出结构化 `data`

---

## 1. 背景

在 `gpu-device-node` 与 `gpu-host-runtime` 已结构化之后，GPU 分支里下一条高价值残留是
`gpu-docker-config`。

这条 check 负责表达 Ollama Docker 容器 GPU 配置是否齐全，涉及：

- 容器是否存在
- inspect 是否成功
- 容器是否运行
- 是否声明 GPU device request
- 是否设置关键 NVIDIA / Ollama 环境变量

这条 check 不依赖 Claude Code / Codex 的 host 差异，但仍属于两个 CLI 入口共享的 doctor 诊断面。

---

## 2. 残留问题

修复前的状态是：

- `runGpuDoctorChecks()` 已经明确知道：
  - 是否存在 `ollama` 容器
  - `docker inspect` 是否成功
  - `running`
  - `hasGpuDeviceRequest`
  - `OLLAMA_LLM_LIBRARY`
  - `NVIDIA_VISIBLE_DEVICES`
  - `NVIDIA_DRIVER_CAPABILITIES`
  - `missingConfig`
- 但最终输出 `gpu-docker-config` 时，仍只保留一条文本 detail

这样一来，自动化消费者若想区分：

- “是没容器、inspect 失败，还是配置真的不完整”
- “缺的是哪一项 GPU config”
- “当前容器声明了哪些关键环境变量”

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `gpu-docker-config` check 现在新增结构化 `data`
  - `data` 包含：
    - `dockerPresent`
    - `inspectOk`
    - `running`
    - `hasGpuDeviceRequest`
    - `llmLibrary`
    - `visibleDevices`
    - `driverCapabilities`
    - `missingConfig`
    - `skipped`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住容器存在且配置健康的 pass 路径
  - 锁住不存在 `ollama` 容器时的 skip 路径

本轮不改：

- `docker inspect` 调用逻辑
- 容器修复逻辑
- 其他 GPU checks

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runGpuDoctorChecks`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `gpu-docker-config` 增加 `data`
- 不移除旧 `detail`
- 不改变 Docker config 判定逻辑
- 不触碰容器修复行为

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
openspec validate 2026-04-07-gpu-docker-config-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-gpu-docker-config-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `gpu-docker-config` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`gpu-docker-config` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- Ollama 容器是否存在
- inspect 是否成功
- 当前 GPU 相关 env/config 是什么
- 缺失的是哪些配置项
- 这条结果是否只是 skip

而不必继续拆解 detail 文案。
