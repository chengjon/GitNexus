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
- [ ] Claude Code 在 worktree 场景下是否传入 cwd？
- [ ] Cursor 在 worktree 场景下是否传入 cwd？
- [ ] 其他 MCP 客户端是否传入 cwd？

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

## 🔶 待完成事项

### 1. [中] 添加显式 cwd 优先级测试

**问题**: 现有测试覆盖 scope、matching worktree、different repo 和 fallback，但**缺少专门断言"传入 cwd 时必须覆盖 process.cwd()"的用例**。

**建议增加测试**:
```typescript
it('should use explicit cwd over process.cwd()', async () => {
  // Setup: process.cwd() 指向 /repo/main
  // 但传入 cwd: /repo/.worktrees/feature-branch
  const result = await detectChanges({
    scope: 'all',
    cwd: '/repo/.worktrees/feature-branch'
  });

  expect(result.metadata.process_cwd).toBe('/repo/.worktrees/feature-branch');
  expect(result.metadata.path_resolution).toBe('cwd_worktree');
});
```

**参考**: `calltool-dispatch.test.ts:372`, `local-backend.test.ts:365`

### 2. [中] 修正 Git 命令语义说明

**问题**: Design 文档 Section 4.1 已有命令示例，但对 `--git-common-dir` 和 `--git-dir` 的语义区分不够准确。

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

**已覆盖** (见 `calltool-dispatch.test.ts:406`, `calltool-dispatch.test.ts:478`):
- cwd 在匹配 worktree 中 → 验证 `git_diff_path` / `path_resolution`
- cwd 不在任何匹配 worktree 中 → 验证 fallback 行为
- cwd 在不同仓库中 → 验证 warnings

**⚠️ 未覆盖 - fallback_reason 直接断言**:
- 当前测试断言的是 `git_diff_path`、`path_resolution`、`warnings`
- **没有直接断言 `fallback_reason` 字段**
- fallback_reason 虽然已实现，但**合同层面尚未被测试锁住**

**待补充**:
```markdown
### 边界条件测试 (TODO)

- **显式 cwd 优先级**: `detect_changes({ cwd: <worktree> })` 必须覆盖 process.cwd()
- **fallback_reason 直接断言**: 各场景下 fallback_reason 必须符合预期值
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
| 测试策略 | ⭐⭐⭐⭐ | 覆盖主要场景，待补充 cwd 优先级测试 |
| 文档质量 | ⭐⭐⭐⭐ | 需更新以反映实现状态 |

**总分**: 23/25

---

## 最终建议

**✅ 采纳此方案**（已实现）

**待完成**:
1. 验证 MCP 宿主是否传入 `cwd` 参数
2. 添加显式 `cwd` 优先级测试
3. 更新设计文档以反映实现状态

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

