# Repo Technical Debt Audit Status Sync

日期：2026-04-08
范围：`docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md` 的后续状态同步
目标：保留 2026-04-06 仓库技术债基线审计的历史价值，同时避免它继续把已收敛的 `detect_changes` 宿主兼容性问题表述成当前未关闭债务。

---

## 1. 背景

[2026-04-06-repo-technical-debt-and-residual-audit.md](/opt/claude/GitNexus/docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md)
明确标注自己是：

- repository-hygiene cleanup wave 的 pre-repair audit baseline
- 一份历史时点的审计快照

这条定位本身没有问题。

但它的 Finding 3 仍写着：

- `detect_changes` 宿主行为验证仍不完整
- Claude Code / Cursor / 其他 MCP 客户端关于 `cwd` 透传仍待验证

这在 2026-04-06 的审计时点是正确的，但后续仓内治理已经推进了：

- Claude Code 当前 CLI live probe 已完成
- `Codex + Claude Code` 的主支持面已被文档明确收敛
- Cursor / 其他客户端已被重分类为 external follow-up，而非当前主仓阻塞债务

如果不补 status sync，后来阅读这份基线审计的人仍然容易把它误读成“当前状态”。

---

## 2. 后续事实源

当前与该 Finding 3 直接相关的后续事实源包括以下几类已完成的后续治理记录：

- `detect_changes` host compatibility matrix baseline
- Claude Code `cwd` live probe
- `detect_changes` primary dual-CLI host convergence

这些文档给出的当前可操作结论是：

- Codex：不能默认假设自动注入 `cwd`
- Claude Code：当前 CLI live probe 未见自动注入 `cwd`
- 对当前项目要求的 `Codex + Claude Code` 双 CLI 主支持面，host guidance 已闭环
- Cursor / 其他客户端只在未来要扩展外部宿主支持时再补 probe

---

## 3. 本轮修复

本轮只做 bounded status-sync：

- 不重写 2026-04-06 基线审计的原始判断
- 只在该文档顶部与 Finding 3 附近增加 status sync 注记
- 在技术债路线图
  [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)
  里补一条指向，提醒读者该路线图现在既是 current backlog entrypoint，
  也是 current stale-doc follow-up index

这样可以同时保留两件事：

- 基线审计在当时的历史真实性
- 当前读者对“哪些问题已经被后续治理部分关闭”的正确理解

---

## 4. 风险边界

本轮不改：

- TypeScript
- 测试
- OpenSpec capability 行为
- `detect_changes` 运行时逻辑

唯一目标是修正“历史基线文档被误读成当前未完成项”的治理歧义。

---

## 5. 治理验证

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-08-repo-technical-debt-audit-status-sync
git diff --cached --name-only
git diff --cached --check
rg -n "2026-04-08-repo-technical-debt-audit-status-sync" \
  docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md \
  docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md
rg -n "reader note|current backlog entrypoint|current stale-doc follow-up index|current host-follow-up record|remediation roadmap" \
  docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md \
  docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md
node --input-type=module -e 'import { LocalBackend } from "./gitnexus/dist/mcp/local/local-backend.js"; const backend = new LocalBackend(); await backend.init(); console.log(JSON.stringify(await backend.callTool("detect_changes", { scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus" }), null, 2)); await backend.disconnect();'
node --input-type=module -e 'import { LocalBackend } from "./gitnexus/dist/mcp/local/local-backend.js"; const backend = new LocalBackend(); await backend.init(); const result = await backend.callTool("detect_changes", { scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus" }); console.log(JSON.stringify({ metadata: result.metadata, changed_file_paths: result.changed_symbols.map((s) => s.filePath) }, null, 2)); await backend.disconnect();'
python - <<'PY'
import re, subprocess, json
from pathlib import Path
repo = Path('/opt/claude/GitNexus')
staged = subprocess.check_output(['git','diff','--cached','--name-only'], cwd=repo, text=True).splitlines()
staged_set = set(staged)
pat = re.compile(r"(?:/opt/claude/GitNexus/)?((?:docs|openspec)/[^\s)\]`'\"{}]+)")
ignore = {'docs/**', 'openspec/**'}
missing = []
for f in staged:
    try:
        content = subprocess.check_output(['git','show',f':{f}'], cwd=repo, text=True, stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        continue
    for m in pat.finditer(content):
        p = m.group(1).rstrip('.,:;')
        if p == f or p in ignore:
            continue
        in_head = subprocess.run(['git','cat-file','-e',f'HEAD:{p}'], cwd=repo, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
        in_staged = p in staged_set
        if not in_head and not in_staged:
            missing.append((f, p))
print(json.dumps(missing, ensure_ascii=False))
PY
```

结果：

- `openspec validate 2026-04-08-repo-technical-debt-audit-status-sync`
  返回 `Change '2026-04-08-repo-technical-debt-audit-status-sync' is valid`
- `git diff --cached --name-only`
  提供了当前 staged docs-only 工作集的 8 文件实测清单
- `git diff --cached --check`
  证明当前 staged 文本内容在 git diff 层面没有尾随空格或空白错误
- `rg -n "2026-04-08-repo-technical-debt-audit-status-sync" ...`
  证明：
  - 2026-04-06 基线审计顶部已有 status-sync 指针
  - Finding 3 附近已有 current host-follow-up record 指针
  - 技术债路线图也已有对应入口，可作为 current backlog entrypoint 与
    current stale-doc follow-up index
- `rg -n "reader note|current backlog entrypoint|current stale-doc follow-up index|current host-follow-up record|remediation roadmap" ...`
  证明 2026-04-06 基线审计已把保留下来的 capture-time reasoning 与当前 backlog
  入口拆开表述，并显式把 remediation roadmap 标成当前入口与
  current stale-doc follow-up index
  - 同时证明 Finding 3 已把 host 侧后续记录明确标成 current host-follow-up record
  - 同时证明 stale-doc follow-up 已通过 remediation roadmap 串到仓内已登记的
    truth-sync slices，而不是继续用泛化的 later-records 集合作为入口
- 当前 staged `detect_changes` 复核使用的是当前仓内 `LocalBackend` 直连调用，
  以避免把整棵脏工作树误算进这条 docs-only slice 的验证口径
- 精简版 `LocalBackend` JSON 提取命令可直接产出 `metadata` 与
  `changed_symbols[*].filePath`，用于核对 7 个 indexed entries 清单
- repository-local staged content scan 命令可直接产出引用闭合检查结果；
  空数组表示当前没有悬空仓内路径引用
  - 该扫描会先抽取并净化路径 token，再对照 `HEAD` 与 staged path set，避免把
    命令块里的引号或括号残片误记成路径

证据映射：

- 历史基线记录：来自原始 scoped `detect_changes({scope: "all", ...})` 审计结果
- 当前实测的 staged 文件范围：来自 `git diff --cached --name-only`
- 当前实测的 staged 文本格式：来自 `git diff --cached --check`
- 当前实测的 staged 图谱结果与元数据：来自当前仓内 `LocalBackend` 的 staged
  `detect_changes` JSON
- 当前实测的 indexed-entry 清单：来自 `changed_symbols[*].filePath`
- 由当前实测推出的引用闭合边界：来自 repository-local staged content scan 对
  `HEAD` 与 staged path set 的比对

历史基线记录：

- 该切片最初的 `detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  scoped review 结果是：
  - `risk_level = low`
  - `changed_files = 76`
  - `changed_symbols = 0`
  - `affected_processes = 0`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

当前实测口径：

- 当前工作区已累积大量与本切片无关的未提交改动，因此本次本地复核不再把新的
  whole-worktree `detect_changes` 结果当作这条 docs-only status-sync slice 的
  直接验证口径
- 在当前本地 index 中，这条 status-sync slice 已与对应的基线审计、OpenSpec
  目录以及路线图最小入口一起被隔离成 staged docs-only 工作集；其 staged
  `detect_changes` 复核结果为：
  - `changed_files = 8`
  - `changed_symbols = 7`
  - `affected_processes = 0`
  - `risk_level = low`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`
  - `scope = staged`
  - `git_repo_path = /opt/claude/GitNexus`
  - `git_diff_path = /opt/claude/GitNexus`
  - `process_cwd = /opt/claude/GitNexus`
  - `changed_files = 8` 与 `changed_symbols = 7` 的差异来自口径不同：
    `.openspec.yaml` 计入 git staged 文件数，但不形成 indexed code symbol
  - 工具原始 summary 字段中的 `changed_count = 7`、`affected_count = 0`
    在本文中分别按更可读的 `changed_symbols = 7`、`affected_processes = 0`
    记述，数值并未另行推断
  - 对这条 docs-only slice 而言，`changed_symbols = 7` 指向的是 7 个已索引的
    文件级条目，而不是函数、类或方法级代码符号
  - 当前 `changed_symbols = 7` 对应的 file-level indexed entries 是：
    - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
    - `docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md`
    - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/design.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/proposal.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/specs/repo-technical-debt-audit-status-sync/spec.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/tasks.md`
  - 这 7 个 indexed entries 清单直接来自当前 `LocalBackend` JSON 输出中的
    `changed_symbols[*].filePath`
  - 上述 7 个 indexed entries 已与同一次 `LocalBackend` JSON 输出中的
    `changed_symbols[*].filePath` 逐项核对，不存在额外转写项或遗漏项
  - 当前 staged docs-only 工作集的 8 个文件是：
    - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
    - `docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md`
    - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/.openspec.yaml`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/design.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/proposal.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/specs/repo-technical-debt-audit-status-sync/spec.md`
    - `openspec/changes/2026-04-08-repo-technical-debt-audit-status-sync/tasks.md`
  - 这 8 个 staged 文件清单直接来自 `git diff --cached --name-only`
  - 上述 8 个 staged 文件已与同一次 `git diff --cached --name-only` 输出逐项核对，
    不存在额外转写项或遗漏项
  - 因为这 8 个路径全部位于 `docs/` 或 `openspec/` 下，当前工作集的
    `docs-only` 边界是实测事实，而不是事后命名；本轮未触及 `gitnexus/src/**`、
    `gitnexus-web/src/**`、测试目录或依赖清单
  - 上述 `scope`、`git_repo_path`、`git_diff_path`、`process_cwd` 直接来自同一次
    `LocalBackend` JSON 输出中的 `metadata`

由当前实测推出的边界结论：

- 额外的 staged 引用闭合复核也已通过：当前这 8 个 staged 文件内提到的仓内
  `docs/**` / `openspec/**` 路径，要么已存在于 `HEAD`，要么就在同一批 staged
  工作集中，不再依赖未入仓的悬空治理文档
  - 这条结论来自 repository-local staged content scan：扫描当前 staged 文件中的
    `docs/**` / `openspec/**` 路径引用，先净化 token，再逐条对照 `HEAD` 与当前
    staged path set
- 本地 staging 说明：
  - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md` 目前仍与这条
    status-sync slice 一起保留在 staged 集合中
  - 原因不是主题混杂，而是当前 `HEAD` 里还没有这份基线审计，而后续仓库卫生
    治理线仍把它视为需要保留的耐久审计基线
