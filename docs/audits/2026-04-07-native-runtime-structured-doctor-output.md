# Native Runtime Structured Doctor Output

日期：2026-04-07
范围：`gitnexus/src/cli/doctor.ts`、`gitnexus/src/runtime/native-runtime-manager.ts`
目标：让 `doctor --json` 对 `native-runtime` 输出结构化 `data`，不再只靠 detail 字符串暴露 snapshot

---

## 1. 背景

在 `language-support` 与 `embeddings-config` 都完成结构化之后，`doctor`
里还剩下一条明显的环境确定性残留：

- `native-runtime` 实际上已经有明确的 `NativeRuntimeSnapshot`
- 但 `doctor --json` 仍只把它格式化成一条字符串 detail

这会让自动化消费者继续依赖：

- `kuzuActiveRepos=...`
- `coreEmbedderActive=...`
- `mcpEmbedderActive=...`

这样的文本拆解。

---

## 2. 残留问题

修复前的状态是：

- `nativeRuntimeManager.getSnapshot()` 已经返回：
  - `activeKuzuRepos`
  - `activeRepoIds`
  - `coreEmbedderActive`
  - `mcpEmbedderActive`
- 但默认 `getNativeRuntimeCheck()` 只保留：
  - `status`
  - `detail`

问题不在于信息缺失，而在于 transport 仍然是文本化的。

---

## 3. 本轮修复

本轮继续沿用加法兼容模式：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - 默认 `native-runtime` check 现在新增 `data: snapshot`
  - 继续保留现有 `detail` 文本摘要
- 更新 [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 改为通过真实 `nativeRuntimeManager` snapshot 路径验证
  - 锁住 `native-runtime` check 必须输出结构化 `data`

本轮不改：

- `NativeRuntimeSnapshot` 字段定义
- 终端文本输出
- `gpu` / `host` / `registry` checks

---

## 4. 风险边界

按仓库规则，本轮仍尝试先做 GitNexus impact analysis；但 `runDoctor`
相关查询继续被底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮保持低风险：

- 只做 `native-runtime` 的加法结构化输出
- 不移除旧 `detail`
- 不更改 `native-runtime-manager` 的实际运行行为

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
openspec validate 2026-04-07-native-runtime-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-native-runtime-structured-doctor-output`
  返回 `Change '2026-04-07-native-runtime-structured-doctor-output' is valid`
- `gitnexus_detect_changes(...)`
  返回 `risk_level: low`
  且 `changed_symbols = 0`、`affected_processes = 0`

---

## 6. 结论

`native-runtime` 现在已经具备：

1. 面向人的 `detail` 摘要
2. 面向机器的 `data: NativeRuntimeSnapshot`

后续如果再对 `doctor` 做结构化补齐，剩余优先级更高的目标会转向：

- `registry-entry`
- `host-config`
- GPU 相关 checks
