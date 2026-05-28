# Embeddings Config Structured Doctor Output

日期：2026-04-07
范围：`gitnexus/src/cli/doctor.ts`
目标：让 `doctor --json` 对 `embeddings-config` 提供结构化 `data`，减少后续对 `detail` 字符串的机器解析依赖

---

## 1. 背景

在 `language-support` 已经完成结构化收敛之后，`doctor` 里仍有明显的
detail-only 残留。最突出的一项就是 `embeddings-config`：

- provider / model / nodeLimit / batchSize / source 都是结构化事实
- Ollama probe 结果本身也是结构化状态

但修复前它们仍全部被压进同一条 `detail` 字符串中。

---

## 2. 残留问题

修复前的状态是：

- `runDoctor()` 已经拿到完整的 `EmbeddingsConfigSnapshot`
- 若 provider 为 `ollama`，也已拿到 `probeOllama()` 的结构化结果
- 但最终写入 `DoctorCheck` 时，仅保留：
  - `status`
  - `detail`

这会造成两类问题：

1. 机器消费者只能从人类可读字符串中重新拆 provider/source/probe
2. 未来若 detail 文案调整，就可能影响任何依赖该字符串的自动化检查

这属于环境确定性信息的 transport 残留。

---

## 3. 本轮修复

本轮保持为最小加法兼容：

- 更新 [doctor.ts](/opt/claude/GitNexus/gitnexus/src/cli/doctor.ts)
  - `embeddings-config` check 现在新增结构化 `data`
  - `data` 包含：
    - `effective`
    - `sources`
    - `precedence`
    - `probe`
- 保留原有 `detail` 文本摘要
- 更新
  [doctor.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/doctor.test.ts)
  - 锁住 Ollama success / warn / unreachable 三种输出都必须带结构化 `data`

本轮不改：

- `embeddings-config` 文本 detail 格式
- `embeddings config show --json` 输出
- GPU checks / host checks 的结构化契约

---

## 4. 风险边界

按仓库规则，原本应先做 GitNexus impact analysis；但本轮若继续改
`runDoctor`，`gitnexus_impact` 仍会被同一个底层异常阻断：

```text
Buffer manager exception: Mmap for size 8796093022208 failed.
```

因此本轮继续采用低风险策略：

- 仅为 `embeddings-config` 增加 `data`
- 不移除旧 `detail`
- 不更改现有 CLI 文本输出

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
openspec validate 2026-04-07-embeddings-config-structured-doctor-output
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

结果：

- `openspec validate 2026-04-07-embeddings-config-structured-doctor-output`
  返回 `Change '2026-04-07-embeddings-config-structured-doctor-output' is valid`
- `gitnexus_detect_changes(...)`
  返回 `risk_level: low`
  且 `changed_symbols = 0`、`affected_processes = 0`

---

## 6. 结论

`embeddings-config` 现在已经从“文本概览”升级为“文本概览 + 结构化契约”：

1. 终端与现有 detail 使用者不受影响
2. 自动化消费者可以直接读 `effective` / `sources` / `probe`
3. 后续若要继续结构化 `doctor` 的其他 checks，可以沿用同一模式
