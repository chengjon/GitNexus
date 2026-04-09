# Host Config Structured Doctor Output

日期：2026-04-07  
范围：`gitnexus/src/cli/doctor.ts`  
目标：让 `doctor --json` 对 `host-config` 输出结构化 `data`，特别是明确 Claude Code / Codex 两条主路径的检测与配置状态

---

## 1. 背景

在 `language-support`、`embeddings-config`、`native-runtime` 已经完成结构化之后，
`host-config` 仍然停留在 detail-only 状态。

这条 check 对本项目尤其重要，因为它直接承接：

- Claude Code
- Codex

两条核心 CLI 主路径的 MCP 配置诊断。

---

## 2. 残留问题

修复前的状态是：

- `runDoctor()` 已经明确知道：
  - `hostId`
  - `displayName`
  - `detected`
  - `configured`
  - `needsManualConfig`
  - `detection.reason`
- 但最终写入 `host-config` 时，仍只保留一句文本 detail

这样一来，自动化消费者若想区分：

- “未检测到 host”
- “已检测到但未配置”
- “已配置”
- “需要 manual setup 还是应该 fail”

就只能继续解析文案。

---

## 3. 本轮修复

本轮依旧采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `host-config` check 现在新增结构化 `data`
  - `data` 包含：
    - `hostId`
    - `displayName`
    - `detected`
    - `configured`
    - `needsManualConfig`
    - `detectionReason`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 Codex manual-path
  - 锁住 Codex configured-path
  - 锁住 Claude Code configured-path

本轮不改：

- `host-detect-changes-guidance`
- host setup/install 行为
- Cursor / OpenCode 的配置逻辑

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runDoctor`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `host-config` 增加 `data`
- 不移除旧 `detail`
- 不更改 Claude Code / Codex 的配置判定逻辑

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
openspec validate 2026-04-07-host-config-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-host-config-structured-doctor-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为已评估 `host-config` check 增加结构化 `data`”的低风险边界

---

## 6. 结论

`host-config` 现在已经从“文案诊断”升级为“文案诊断 + 结构化契约”。

对 Claude Code / Codex 而言，这意味着后续任何自动化检查都可以直接读取：

- host 是否被检测到
- host 是否已配置
- 是否要求 manual setup
- 未检测到时的原因

而不必再拆解自然语言 detail。
