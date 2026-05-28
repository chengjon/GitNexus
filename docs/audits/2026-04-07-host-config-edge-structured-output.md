# Host Config Edge Structured Output

日期：2026-04-07
范围：`gitnexus/src/cli/doctor.ts`
目标：让 `doctor --json` 对 `host-config` 的边界分支也输出结构化 `data`

---

## 1. 背景

上一轮 `host-config` 结构化已经覆盖了已评估 host 的主路径：

- host 已检测但未配置
- host 已检测且已配置
- host 未检测到

但 `runDoctor()` 里还有两个更早返回的边界分支仍然停留在 prose-only 状态：

- `Unknown host: ...`
- `No host checks requested.`

这意味着调用方只要落到这两条路径，仍然得继续解析 detail 文案。

---

## 2. 残留问题

修复前的状态是：

- `runDoctor()` 已经知道：
  - 用户是否传入了 `--host`
  - 传入值是否匹配已知 host
  - 当前是否属于“跳过 host 检查”的路径
- 但最终写入 `host-config` 时，没有任何结构化字段描述这两条边界状态

这样一来，自动化消费者若想区分：

- 请求了未知 host
- 根本没有请求 host 检查

就只能继续解析自然语言 detail。

---

## 3. 本轮修复

本轮继续采用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - 为 `host-config` 的两个 early-return 分支新增结构化 `data`
  - `data` 包含：
    - `requestedHost`
    - `matchedHosts`
    - `skipped`
    - `reasonCode`
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 `no-host-requested` 边界路径
  - 锁住 `unknown-host` 边界路径

本轮不改：

- Claude Code / Codex 的 host 检测逻辑
- host-config 主路径结构
- `host-detect-changes-guidance`

---

## 4. 风险边界

按仓库规则，本轮仍先尝试 GitNexus impact analysis；但 `runDoctor`
相关查询继续被同一底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮继续保持低风险：

- 只为 `host-config` 的边界分支增加 `data`
- 不移除旧 `detail`
- 不改变 Claude Code / Codex 的支持范围或配置判定语义

---

## 5. 验证

定向测试：

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/doctor.test.ts --config vitest.config.ts
```

结果：

- `1` 个测试文件通过
- `21` 个测试通过

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
openspec validate 2026-04-07-host-config-edge-structured-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- OpenSpec 返回 `Change '2026-04-07-host-config-edge-structured-output' is valid`
- GitNexus change detection 在当前脏工作树下返回：
  - `risk_level: low`
  - `changed_files: 63`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`

说明：

- `changed_files: 63` 反映的是当前仓库整体工作树仍有大量并行改动，不是本 slice 单独新增的文件数
- 从 GitNexus 图谱视角看，这一轮未引入新的已索引符号级 blast radius，符合本次“只为 `host-config` 边界分支增加结构化 `data`”的低风险边界

---

## 6. 结论

`host-config` 现在不再只对主路径提供结构化契约；它的两个边界分支也已经收敛为：

- 文案 detail
- 结构化 edge-state data

这让双 CLI 环境下的自动化调用方可以直接识别：

- 未传 `--host`
- 传入了未知 host

而不必继续拆解 detail 文案。
