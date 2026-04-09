# GPU Device Node Structured Doctor Output

日期：2026-04-07
范围：`gitnexus/src/cli/doctor.ts`
目标：让 `doctor --json` 对 `gpu-device-node` 输出结构化 `data`

---

## 1. 背景

在 `doctor --json` 的 shared repo-state、registry、host-config 等基础诊断逐步结构化之后，
GPU 分支仍基本停留在 detail-only 状态。

其中 `gpu-device-node` 是 GPU 检查里边界最清楚、最适合先收口的一条：

- 它只描述宿主机是否暴露了 Linux GPU device nodes
- 不依赖 Claude Code / Codex 的 host 差异
- 但会被两个 CLI 入口共享消费

---

## 2. 残留问题

修复前的状态是：

- `runGpuDoctorChecks()` 已经明确知道：
  - 当前 `process.platform`
  - Linux 下检查过的 device node 路径
  - 哪些节点当前可见
  - 当前分支是实际检查还是 skipped
- 但最终输出 `gpu-device-node` 时，仍只保留一条文本 detail

这样一来，自动化消费者若想区分：

- “当前平台是不是 Linux”
- “实际检查了哪些路径”
- “可见节点有哪些”
- “这条结果是真检查还是平台跳过”

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `gpu-device-node` check 现在新增结构化 `data`
  - `data` 包含：
    - `platform`
    - `checkedPaths`
    - `visibleNodes`
    - `skipped`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 Linux 下检测到 device node 的 pass 路径
  - 锁住 Linux 下一个 device node 都没检测到的 warn 路径

本轮不改：

- 其他 GPU checks
- WSL / NVIDIA / Docker / Ollama 判定逻辑
- Claude Code / Codex 的 host 行为

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runGpuDoctorChecks`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `gpu-device-node` 增加 `data`
- 不移除旧 `detail`
- 不改变 GPU device node 判定逻辑
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
openspec validate 2026-04-07-gpu-device-node-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-gpu-device-node-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `gpu-device-node` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`gpu-device-node` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

后续无论是 Claude Code 还是 Codex 侧的自动化，都可以直接读取：

- 当前平台
- 实际检查了哪些 Linux GPU device node 路径
- 哪些节点当前可见
- 这条结果是否只是平台跳过

而不必继续拆解 detail 文案。
