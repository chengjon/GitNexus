# Host Detect Changes Guidance Structured Output

日期：2026-04-07
范围：`gitnexus/src/cli/doctor.ts`
目标：让 `doctor --json` 对 `host-detect-changes-guidance` 输出结构化 `data`

---

## 1. 背景

在 `host-config` 已结构化之后，host 相关检查里仍然停留在 prose-only 状态的，是
`host-detect-changes-guidance`。

这条 check 直接服务于本项目最关键的双 CLI 入口：

- Claude Code
- Codex

它的价值不在于“是否通过”，而在于把 `gitnexus_detect_changes` 在不同 host 会话里的
参数建议做成稳定契约。

---

## 2. 残留问题

修复前的状态是：

- `getHostDetectChangesGuidance()` 已经明确知道：
  - 当前 `hostId`
  - 指引针对的命令是 `gitnexus_detect_changes`
  - 是否需要在 multi-repo 场景下显式传 `repo`
  - 在哪类上下文漂移场景下需要显式传 `cwd`
- 但最终输出时仍只保留自然语言 detail

这样一来，自动化消费者若想区分：

- 这是 Codex 还是 Claude Code 的 guidance
- `repo` 参数在什么条件下应显式传递
- `cwd` 参数在什么条件下应显式传递
- 这条 guidance 的原因码是什么

就只能继续解析文案。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `host-detect-changes-guidance` check 现在新增结构化 `data`
  - `data` 包含：
    - `hostId`
    - `command`
    - `repoArg`
    - `cwdArg`
    - `reasonCode`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 Codex guidance 的结构化路径
  - 锁住 Claude Code guidance 的结构化路径

本轮不改：

- guidance detail 文案
- host 检测或配置逻辑
- `gitnexus_detect_changes` 本身行为

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `getHostDetectChangesGuidance`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮仍保持低风险：

- 只为 `host-detect-changes-guidance` 增加 `data`
- 不移除旧 `detail`
- 不改变 Claude Code / Codex 的 guidance 语义

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
openspec validate 2026-04-07-host-detect-changes-guidance-structured-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-host-detect-changes-guidance-structured-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `host-detect-changes-guidance` 增加结构化 `data`”的低风险边界

---

## 6. 结论

`host-detect-changes-guidance` 现在已经从“文案提示”升级为“文案提示 + 结构化契约”。

对 Claude Code / Codex 而言，这意味着后续任何自动化都可以直接读取：

- 当前 guidance 属于哪个 host
- 针对的命令是什么
- `repo` 参数的推荐条件
- `cwd` 参数的推荐条件
- guidance 的原因码

而不必继续拆解自然语言 detail。
