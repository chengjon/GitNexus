# Read-Only Git Index And Alternate Object Store Audit

日期：2026-04-09
范围：根仓库 `.git` 子挂载、docs-only staged 验证链、`detect_changes` 临时 index 复核
目标：确认当前 `GitNexus` 根仓库真实阻塞为何从 `Mmap for size 8796093022208 failed` 切换为 `.git` 只读，并沉淀一条在不修改真实 `.git/index` 的前提下继续做 docs-only staged 验证的可复用方法。
治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)

---

## 1. 结论

当前根仓库的直接阻塞已经不是 `Mmap for size 8796093022208 failed` 再发。

真实阻塞是：

- 仓库根目录仍可写
- 但 [`.git`](/opt/claude/GitNexus/.git) 被单独做成只读子挂载
- 因此真实 `git add` / `git apply --cached` / `index.lock` 路径都会失败

这不是普通文件权限问题，也不像 ext4 出错后的自动 `remount-ro`。
更符合宿主或沙箱对 `[.git](/opt/claude/GitNexus/.git)` 与
[`.codex`](/opt/claude/GitNexus/.codex) 施加的显式只读子挂载策略。

在这个前提下，若还要继续做 docs-only staged 验证，单独设置
`GIT_INDEX_FILE=/tmp/...` 不够；因为新 staged blob 仍需要写入 object store。

可工作的最小方案是同时提供：

- 替代 index：`GIT_INDEX_FILE=/tmp/...`
- 替代 object store：`GIT_OBJECT_DIRECTORY=/tmp/...`
- 真实对象只读回退：`GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects`

---

## 2. 证据分类

### 2.1 Measured

- `scope: mount layout, time: 2026-04-09`
  `findmnt -R /opt/claude/GitNexus -o TARGET,SOURCE,FSTYPE,OPTIONS,PROPAGATION`
  返回：
  - [GitNexus](/opt/claude/GitNexus) 为 `rw`
  - [`.git`](/opt/claude/GitNexus/.git) 为独立 `ro` 子挂载
  - [`.codex`](/opt/claude/GitNexus/.codex) 也为独立 `ro` 子挂载
  - 三者都来自同一底层设备 `/dev/sdd`
  - propagation 都是 `private`

- `scope: direct mount probe, time: 2026-04-09`
  `findmnt -T /opt/claude/GitNexus/.git -o TARGET,SOURCE,FSTYPE,OPTIONS,PROPAGATION`
  返回：
  - `TARGET=/opt/claude/GitNexus/.git`
  - `OPTIONS=ro,...`
  - `PROPAGATION=private`

- `scope: writeability probe, time: 2026-04-09`
  实测：
  - `touch /opt/claude/GitNexus/.git_rw_probe && rm ...` 成功
  - `touch /opt/claude/GitNexus/.git/.codex_ro_probe` 失败，返回
    `Read-only file system`

- `scope: kernel log cross-check, time: 2026-04-09`
  `dmesg | tail -n 40` 未见 ext4 I/O error、journal abort 或
  `remount-ro` 记录。

- `scope: git alternate index bootstrap, time: 2026-04-09`
  以下命令成功：
  ```bash
  rm -f /tmp/gitnexus-docs-slice.index
  mkdir -p /tmp/gitnexus-docs-slice.objects
  env \
    GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
    GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
    GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
    git read-tree HEAD
  ```
  说明在不写真实 `.git/index` 与 `.git/objects` 的前提下，仍可构造完整临时 index。

- `scope: git alternate index patch apply, time: 2026-04-09`
  对 docs-only 最小 hunk 执行：
  ```bash
  env \
    GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
    GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
    GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
    git apply --cached /tmp/gitnexus-docs-slice.patch
  ```
  随后：
  - `git diff --cached --name-status` 返回单文件修改
  - `git diff --cached --check` 返回空

- `scope: LocalBackend staged detect_changes under alternate git storage, time: 2026-04-09`
  以下命令成功：
  ```bash
  env \
    GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
    GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
    GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
    node --input-type=module -e "import { LocalBackend } from './gitnexus/dist/mcp/local/local-backend.js'; const backend = new LocalBackend(); await backend.init(); const result = await backend.callTool('detect_changes', { scope: 'staged', repo: 'GitNexus', cwd: '/opt/claude/GitNexus' }); console.log(JSON.stringify(result, null, 2));"
  ```
  返回：
  - `changed_count = 1`
  - `changed_files = 1`
  - `affected_count = 0`
  - `risk_level = low`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

### 2.2 Inferred

- `scope: mount root cause classification, time: 2026-04-09`
  由于根仓库仍可写、`.git` 与 `.codex` 被单独列为 `ro` 子挂载、且内核日志无
  ext4 自动只读重挂载迹象，因此更合理的解释是：
  当前只读行为来自宿主 / 容器层的显式子挂载策略，而不是磁盘损坏或普通 chmod。

- `scope: git plumbing behavior, time: 2026-04-09`
  `GIT_INDEX_FILE` 只能迁出 index，本身不能替代 object store。
  一旦 staged 内容引入新 blob，Git 仍需写对象；因此仅设置替代 index 仍会因
  真实 `.git/objects` 不可写而失败。

- `scope: detect_changes behavior under alternate git storage, time: 2026-04-09`
  当前 `LocalBackend` 的 `detect_changes` 会继承父进程中的
  `GIT_INDEX_FILE` / `GIT_OBJECT_DIRECTORY` / `GIT_ALTERNATE_OBJECT_DIRECTORIES`
  环境变量，因此可以直接复用这条临时 staged 验证链，而不必修改
  `detect_changes` 运行时代码。

### 2.3 Historical Baseline

- `scope: earlier assumption baseline, time: 2026-04-08 before mount audit`
  此前只确认了真实 `.git` 不可写，以及 `git apply --cached` 会报
  `index.lock: Read-only file system`。
  当时尚未把问题进一步区分为：
  - 只读子挂载
  - object store 仍需单独迁出
  - `detect_changes` 可以继承替代 git storage 环境

---

## 3. 最小可复用流程

### 3.1 初始化临时 git storage

```bash
rm -f /tmp/gitnexus-docs-slice.index
mkdir -p /tmp/gitnexus-docs-slice.objects
env \
  GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
  GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
  GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
  git read-tree HEAD
```

### 3.2 在临时 storage 中写入最小 staged slice

```bash
env \
  GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
  GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
  GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
  git apply --cached /tmp/gitnexus-docs-slice.patch
```

### 3.3 做 git 层验证

```bash
env \
  GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
  GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
  GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
  git diff --cached --name-status

env \
  GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
  GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
  GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
  git diff --cached --check
```

### 3.4 做 GitNexus 图谱层验证

```bash
env \
  GIT_INDEX_FILE=/tmp/gitnexus-docs-slice.index \
  GIT_OBJECT_DIRECTORY=/tmp/gitnexus-docs-slice.objects \
  GIT_ALTERNATE_OBJECT_DIRECTORIES=/opt/claude/GitNexus/.git/objects \
  node --input-type=module -e "import { LocalBackend } from './gitnexus/dist/mcp/local/local-backend.js'; const backend = new LocalBackend(); await backend.init(); const result = await backend.callTool('detect_changes', { scope: 'staged', repo: 'GitNexus', cwd: '/opt/claude/GitNexus' }); console.log(JSON.stringify(result, null, 2));"
```

---

## 4. 风险边界

本审计只覆盖：

- 当前根仓库的只读 `.git` 子挂载事实
- docs-only staged 验证链如何继续运行
- `detect_changes` 在替代 git storage 下的可复用性

本审计不覆盖：

- 为什么宿主最终决定把 `[.git](/opt/claude/GitNexus/.git)` 与
  `[.codex](/opt/claude/GitNexus/.codex)` 设为只读
- 如何从宿主层解除该只读策略
- 真实 index 重新变为可写后的常规 Git 工作流恢复

---

## 5. 建议

- 只要真实 [`.git`](/opt/claude/GitNexus/.git) 仍是只读子挂载，就不要再把
  “真实 staged 失败”误判成 `detect_changes` 或 Kuzu 故障。
- 后续 docs/governance-only slice 如果仍需 staged 口径验证，应直接复用本文件的
  临时 git storage 流程。
- 若未来宿主层恢复真实 [`.git`](/opt/claude/GitNexus/.git) 可写，应优先回到正常
  staged 工作流，不要长期把 `/tmp` 方案当作默认开发架构。
