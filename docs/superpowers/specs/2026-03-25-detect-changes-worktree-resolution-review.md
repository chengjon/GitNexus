# Detect Changes Worktree Resolution Design - 审核意见

**审核日期**: 2026-03-25 (Updated)
**审核人**: Claude
**审核文档**: `2026-03-25-detect-changes-worktree-resolution-design.md`
**审核结论**: **已实现，需验证宿主集成**

---

## 实现状态 (Updated 2026-03-25)

以下功能**已实现**（见相关代码）：

| 功能 | 状态 | 代码位置 |
|------|------|----------|
| `cwd` 参数 | ✅ 已实现 | `detect-changes-handler.ts:9`, `tools.ts:155` |
| `fallback_reason` 枚举 | ✅ 已实现 | `detect-changes-handler.ts:12` |
| metadata 返回 `fallback_reason` | ✅ 已实现 | `detect-changes-handler.ts:85` |
| `params.cwd || process.cwd()` | ✅ 已实现 | `detect-changes-handler.ts:78` |
| git common-dir 身份比较 | ✅ 已实现 | `git.ts:42`, `detect-changes-handler.ts:24-25` |

---

## ⚠️ [高] 宿主集成风险 (Host Integration Risk)

**核心问题**: Handler 已支持 `cwd` 参数，但这**不等于** AI 客户端/MCP 宿主已经会传 `cwd`。

**实测案例**:
```
detect_changes 元数据显示:
  process_cwd: /opt/claude/mystocks_spec
用户实际工作目录: /opt/claude/quantix-rust/.worktrees/phase27d-industry-blocklist-v3
```

**根因**: `LocalBackend.callTool()` 不会注入任何请求级 cwd（见 `local-backend.ts:145`）。如果客户端/宿主不显式传 `cwd`，还是会退回到 server 进程自己的 `process.cwd()`。

**设计前提（条件式）**:
> 当 MCP 宿主的 `process.cwd()` 不能可靠代表用户当前工作目录时，宿主必须显式传入 `cwd` 参数。
>
> **无需传 cwd 的场景**:
> - 单仓库、单工作树环境
> - MCP server 进程的 cwd 已绑定到用户工作目录
>
> **必须传 cwd 的场景**:
> - 多 worktree 环境（用户在 worktree 中工作）
> - MCP server 进程的 cwd 固定在其他目录

**验证清单**:
- [x] Codex 当前宿主默认**不会**自动传入 cwd
- [x] GitNexus 侧 handler/worktree 路径解析逻辑已验证正确
- [x] 外部宿主兼容性矩阵 baseline 已登记（官方文档 + 仓内既有 Codex 实测）
- [x] Claude Code 当前 CLI live probe 已完成，未见自动注入 `cwd`
- [x] 本项目要求的 `Codex + Claude Code` 双 CLI 主支持面已闭环

**非阻塞 external follow-up**:
- Cursor / 其他 MCP 客户端的 live probe 仅在未来要扩展外部宿主支持时再补

**状态同步（2026-04-06）**:
- 这组未完成项应视为**宿主兼容性 follow-up research**，而不是当前 GitNexus 主仓的阻塞性缺陷
- 当前主仓需要保留的是结论与边界，而不是继续把它表述成“GitNexus 实现本身仍未完成”

**Codex 实测结论**:
- 默认调用 `detect_changes({scope: "all"})` 时，metadata 返回：
  - `process_cwd = /opt/claude/mystocks_spec`
  - `path_resolution = registry_repo`
  - `fallback_reason = different_repo`
- 显式调用 `detect_changes({scope: "all", cwd: "/opt/claude/quantix-rust/.worktrees/phase27d-industry-blocklist-v3"})` 时，metadata 返回：
  - `git_diff_path = /opt/claude/quantix-rust/.worktrees/phase27d-industry-blocklist-v3`
  - `path_resolution = cwd_worktree`
  - `fallback_reason = null`

这说明：
- Handler/worktree 解析逻辑本身是正确的
- 问题落在宿主是否把 `cwd` 透传给 `detect_changes`

**补充观察**:
- 当前 host adapter 只注册普通 stdio MCP 命令，不负责注入 `cwd`
- 因此 `cwd` 透传应视为宿主调用层责任，而非 GitNexus MCP server 启动配置责任

**宿主兼容性矩阵基线（2026-04-07）**:

| 宿主 | 当前基线判断 |
|------|--------------|
| Codex | 官方 MCP 文档确认 server config 支持 `cwd` 作为启动目录，但未声明自动 tool-arg 注入；仓内既有实测表明当前 host 默认不会自动传 `cwd` |
| Claude Code | 官方文档存在路径 / worktree 信号；2026-04-07 当前 CLI live probe 在仓目录与临时 git worktree 中都只收到 `scope`，未见自动注入 `cwd` |
| Cursor | 官方 MCP 文档确认支持 `Roots` capability，但当前项目未把 Cursor 纳入主支持面；如未来扩展外部宿主再补 live probe |
| 其他客户端 | 当前不在主支持面，保持 unknown |

详见：

- [2026-04-07-detect-changes-host-compatibility-matrix-baseline.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md)
- [2026-04-07-detect-changes-claude-code-cwd-live-probe.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md)
- [2026-04-07-detect-changes-primary-dual-cli-host-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md)

**如果不满足前提**:
- 需要在宿主侧修改（推荐）
- 或者在 GitNexus 侧通过其他机制获取（如环境变量、MCP context）

---

## ✅ 优点

### 1. 问题定义准确

- 准确识别了 worktree 场景下的路径选择问题
- 明确了目标：让 `detect_changes` 在 worktree 中运行时选择正确的 working tree

### 2. 解决方案务实

- **基于 git common dir 比较身份**而非字符串路径，这是正确的技术决策
- 降级策略（fallback to registry）保证了向后兼容
- 不改变 `scope` 语义，降低了回归风险

### 3. 输出元数据设计合理

```markdown
- git_repo_path (registry路径)
- git_diff_path (实际diff路径)
- process_cwd (进程cwd)
- path_resolution (cwd_worktree | registry_repo)
- fallback_reason (different_repo | not_git_repo | repo_identity_unresolved | null)
```

这些字段让调试和审计变得透明，对用户和调用方都友好。

### 4. 风险分析完整

| 风险 | 缓解措施 | 评价 |
|------|----------|------|
| 误检测其他仓库 | 基于 common dir 身份比较 | ✅ 正确 |
| 破坏非 worktree 用法 | Fallback + scope 不变 | ✅ 合理 |
| 噪音警告 | 只在真正歧义时警告 | ✅ 务实 |

---

## 🔶 已关闭与剩余事项

### 1. [已完成] 显式 cwd 优先级测试已补齐

这条评审时的测试缺口后来已经补上：

- `gitnexus/test/unit/calltool-dispatch.test.ts`
  - `detect_changes prefers explicit cwd over process.cwd()`
- `gitnexus/test/integration/local-backend.test.ts`
  - `runDetectChangesTool uses explicit cwd over process.cwd()`

这意味着：

- unit 层已经锁住 `params.cwd` 覆盖 `process.cwd()` 的合同
- integration 层也已经锁住 LocalBackend 到 handler 的真实透传行为

因此这项不再属于未完成测试债，而应视为**已完成、已被测试锁定**的实现部分

### 2. [已完成] Git 命令语义说明已同步

这条 design-doc drift 已在后续 truth-sync 中补齐。

**实测结果**:
```bash
# 主仓 (/opt/claude/quantix-rust)
git rev-parse --git-common-dir  # → .git
git rev-parse --git-dir         # → .git

# Worktree (/opt/claude/quantix-rust/.worktrees/phase27d-industry-blocklist-v3)
git rev-parse --git-common-dir  # → /opt/claude/quantix-rust/.git
git rev-parse --git-dir         # → /opt/claude/quantix-rust/.git/worktrees/phase27d-industry-blocklist-v3
```

**⚠️ 重要区分**:
| 命令 | 主仓 | Worktree | 用途 |
|------|------|----------|------|
| `--git-common-dir` | `.git` | `/opt/claude/quantix-rust/.git` | 判断"是否同一仓库" |
| `--git-dir` | `.git` | `/.../.git/worktrees/xxx` | 判断"哪个 worktree" |
| `--show-toplevel` | `/path/to/main` | `/path/to/worktree` | git diff 路径 |

**关键点**: `--git-common-dir` 用于判断"仓库共享身份"，`--git-dir` 用于判断"具体 worktree 管理目录"，两者不能混淆。

**当前状态**:

- design 文档现在已同步说明：
  - `params.cwd || process.cwd()` 的当前解析顺序
  - `--git-common-dir` / `--git-dir` / `--show-toplevel` 的语义边界
  - 当前 `fallback_reason` / metadata / warning 合同

因此这项不再属于未完成文档债。

### 3. 考虑性能影响

**状态**: ✅ 已接受方案 A

git 命令开销在 10-50ms 内，保持简单实现。如果后续发现性能问题再优化。

### 4. 明确 "worktree 匹配" 的边界条件

**状态**: ✅ 已实现

| 场景 | 预期行为 | fallback_reason | 实现状态 |
|------|----------|-----------------|----------|
| `cwd` == worktree 根目录 | 使用 worktree 路径 | `null` | ✅ |
| `cwd` 在 worktree 深层子目录中 | 使用 worktree 路径 | `null` | ✅ |
| `cwd` 不在任何 git 仓库内 | Fallback to registry | `not_git_repo` | ✅ |
| `cwd` 在不同仓库内 | Fallback to registry | `different_repo` | ✅ |
| **indexed repo** 的 git identity 解析失败 | Fallback to registry | `repo_identity_unresolved` | ✅ |

**⚠️ 语义精确说明** (见 `detect-changes-handler.ts:43-51`):
- `not_git_repo`: **cwd 侧** getGitIdentity 返回 null（cwd 不在 git 仓库内）
- `different_repo`: cwd 和 registry 的 common-dir 不匹配
- `repo_identity_unresolved`: **registry 侧** getGitIdentity 返回 null（索引仓库的 git 解析失败）

**注意**: 如果 cwd 侧 git 命令执行失败，当前实现走 `not_git_repo` 分支，而非 `repo_identity_unresolved`。

### 5. 测试策略补充

**已覆盖**:
- cwd 在匹配 worktree 中 → 验证 `git_diff_path` / `path_resolution`
- cwd 不在任何匹配 worktree 中 → 验证 fallback 行为
- cwd 在不同仓库中 → 验证 warnings
- 显式 `cwd` 优先级 → 直接断言 `process_cwd` / `git_diff_path` / `path_resolution`
- `fallback_reason` 合同 → 已直接断言 `null` / `not_git_repo` / `different_repo`

**当前已有直接断言的参考位置**:

- unit:
  - `calltool-dispatch.test.ts` 中已直接断言：
    - `fallback_reason: 'not_git_repo'`
    - `fallback_reason: null`
    - `fallback_reason: 'different_repo'`
- integration:
  - `local-backend.test.ts` 中已直接断言：
    - `fallback_reason: null`
    - `fallback_reason: 'different_repo'`

**待补充**:
```markdown
- process.cwd() 在 worktree 的深层子目录中
- git 命令执行异常时的 fallback 行为（模拟 git rev-parse 失败）
- 并发调用时的稳定性
- worktree 路径包含特殊字符（空格、中文等）
```

### 5. 用户可见变化

**已实现** (见 `detect-changes-handler.ts`):

```markdown
## 返回元数据字段

- `git_repo_path`: registry 中的仓库路径
- `git_diff_path`: 实际执行 git diff 的路径
- `process_cwd`: 使用的 cwd（可能是 params.cwd 或 process.cwd()）
- `path_resolution`: `cwd_worktree` | `registry_repo`
- `fallback_reason`: `different_repo` | `not_git_repo` | `repo_identity_unresolved` | null
```

---

## 📋 审核评分 (Updated)

| 维度 | 评分 | 说明 |
|------|------|------|
| 问题定义 | ⭐⭐⭐⭐⭐ | 清晰、准确 |
| 解决方案 | ⭐⭐⭐⭐⭐ | 已实现，技术方向正确 |
| 风险分析 | ⭐⭐⭐⭐ | 宿主集成风险需验证 |
| 测试策略 | ⭐⭐⭐⭐⭐ | 已覆盖主要场景，并已锁定显式 cwd 优先级与 fallback_reason 合同 |
| 文档质量 | ⭐⭐⭐⭐⭐ | design / review 已与当前实现和测试现实重新对齐 |

**总分**: 24/25

---

## 最终建议

**✅ 采纳此方案**（已实现）

**待完成**:
1. 如未来扩展外部宿主支持，对 Cursor 等宿主做 live probe，确认 worktree 场景下是否实际传入 `cwd` 参数

---

## 附录：实现参考

**核心代码位置**:
- Handler: `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- Tool schema: `gitnexus/src/mcp/tools.ts:141-158`
- Git identity: `gitnexus/src/storage/git.ts`

**关键实现**:
```typescript
// detect-changes-handler.ts:78
const processCwd = params.cwd || process.cwd();

// detect-changes-handler.ts:85
fallback_reason: pathResolution.fallbackReason,
```
- 只在真正有歧义时才发出警告

这是正确的改进方向。
