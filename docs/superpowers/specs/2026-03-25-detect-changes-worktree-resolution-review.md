# Detect Changes Worktree Resolution Design - 审核意见

**审核日期**: 2026-03-25
**审核人**: Claude
**审核文档**: `2026-03-25-detect-changes-worktree-resolution-design.md`
**审核结论**: **建议采纳**

---

## 总体评价

这是一份高质量的设计文档，目标明确、范围清晰、风险分析到位。

---

## ✅ 优点

### 1. 问题定义准确

- 准确识别了 worktree 场景下的路径选择问题
- 当前实现（第29-33行）的警告机制只是"缓解"而非"解决"，这个判断正确
- 明确了目标：让 `detect_changes` 在 worktree 中运行时选择正确的 working tree

### 2. 解决方案务实

- **基于 git common dir 比较身份**而非字符串路径，这是正确的技术决策
- 降级策略（fallback to registry）保证了向后兼容
- 不改变 `scope` 语义，降低了回归风险
- 范围控制得当：明确是非目标（不重构 registry、不改 impact/rename）

### 3. 输出元数据设计合理

```markdown
- git_repo_path (registry路径)
- git_diff_path (实际diff路径)
- process_cwd (进程cwd)
- path_resolution (cwd_worktree | registry_repo)
- fallback_reason (different_repo | not_git_repo | repo_identity_unresolved | null)  # 新增
```

这些字段让调试和审计变得透明，对用户和调用方都友好。

**⚠️ 建议增强**: 增加 `fallback_reason` 字段，区分以下情况：
- `different_repo`: cwd 在不同仓库中（common-dir 不匹配）
- `not_git_repo`: cwd 不在任何 git 仓库内
- `repo_identity_unresolved`: git 命令执行失败或其他异常
- `null` (或省略): 未 fallback，正常使用 cwd_worktree

这样可以仅凭元数据就定位问题，无需依赖 warning 字段。参考实现见 `detect-changes-handler.ts:31-43`。

### 4. 风险分析完整

| 风险 | 缓解措施 | 评价 |
|------|----------|------|
| 误检测其他仓库 | 基于 common dir 身份比较 | ✅ 正确 |
| 破坏非 worktree 用法 | Fallback + scope 不变 | ✅ 合理 |
| 噪音警告 | 只在真正歧义时警告 | ✅ 务实 |

### 5. 测试策略覆盖主要场景

- cwd 在匹配 worktree 中
- cwd 不在任何匹配 worktree 中
- cwd 在不同仓库中
- 元数据字段准确性

---

## 🔶 建议改进

### 0. ⚠️ [高] 明确 process.cwd() 的假设前提

**问题**: 当前设计（以及现有实现 `detect-changes-handler.ts:64-66`）假设 `process.cwd()` 能代表"调用方当前工作目录"。但在 Claude/Codex 等 MCP 宿主中，MCP server 进程的 cwd 可能与用户实际工作目录不同。

**实测案例**:
```
detect_changes 元数据显示:
  process_cwd: /opt/claude/mystocks_spec
用户实际工作目录: /opt/claude/quantix-rust/.worktrees/phase27d-industry-blocklist-v3
```

**后果**: 即使 common-dir 判定逻辑正确，如果 server cwd 指向错误仓库，也会 fallback 到 registry 路径，无法命中"用户当前 worktree"。

**建议**:
1. **明确前提**: 在文档中声明此方案成立的条件：
   > "宿主必须将 MCP server 的 cwd 绑定到调用方的当前工作目录"

2. **或提供逃生舱**: 支持请求级 `cwd` / `worktree_hint` 参数：
   ```typescript
   detect_changes({
     scope: "all",
     cwd?: string,  // 可选：显式指定工作目录
   })
   ```

3. **当前实现检查**: 确认 Claude Code 是否满足这个前提。如果不满足，需要修改设计。

**参考代码位置**: `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts:64-66`

### 1. 修正 git 命令语义说明

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

### 2. 考虑性能影响

**问题**: 每次 `detect_changes` 调用都会执行额外的 git 命令来解析路径。

**建议**:
- 方案 A: 接受这个开销（git 命令通常在 10-50ms 内完成）
- 方案 B: 将解析结果缓存在 handler 级别（单次调用内有效）

**推荐**: 方案 A，保持简单。如果后续发现性能问题再优化。

### 3. 明确 "worktree 匹配" 的边界条件

**问题**: "cwd 在匹配的 worktree 中"的定义需要更精确。

**建议明确**:

| 场景 | 预期行为 |
|------|----------|
| `process.cwd()` == worktree 根目录 | 使用 worktree 路径 ✅ |
| `process.cwd()` 在 worktree 深层子目录中 | 使用 worktree 路径 ✅ |
| `process.cwd()` 不在任何 git 仓库内 | Fallback to registry，无警告 |
| `process.cwd()` 在不同仓库内 | Fallback to registry，**发出警告** |
| git 命令执行失败（权限/损坏） | Fallback to registry，发出警告 |

### 4. 测试策略补充

**建议增加**:

```markdown
### 边界条件测试

- process.cwd() 在 worktree 的深层子目录中（如 /path/to/worktree/src/lib/utils）
- git 命令执行异常时的 fallback 行为（模拟 git rev-parse 失败）
- 并发调用时的稳定性（多个 detect_changes 同时执行）
- worktree 路径包含特殊字符（空格、中文等）
```

### 5. 增加"用户可见变化"章节

**建议在 Section 8 后增加**:

```markdown
## 9. User-Visible Changes

### For Worktree Users
- `detect_changes` will now automatically diff the active worktree when run from within it
- No more false "No changes detected" when you have uncommitted work in a worktree

### For Regular Users
- Behavior unchanged; `detect_changes` continues to work as before

### New Metadata Fields
- `git_diff_path`: the actual path used for git diff operations
- `path_resolution`: either `cwd_worktree` or `registry_repo`, explaining the choice
```

---

## 🔍 代码层面确认

查看当前实现（`detect-changes-handler.ts` 第29-33行）：

```typescript
if (path.resolve(gitRepoPath) !== path.resolve(processCwd)) {
  warnings.push(
    `Git operations ran in '${gitRepoPath}' instead of process cwd '${processCwd}'. In git worktrees this can affect which working tree is diffed.`,
  );
}
```

**问题**:
- 这个警告在 worktree 场景下会**始终触发**
- 但没有实际解决问题（仍然使用 `gitRepoPath` 执行 diff）

**设计方案的改进**:
- 通过 common dir 比较判断是否同一仓库
- 如果是同一仓库的 worktree，使用 worktree 路径
- 只在真正有歧义时才发出警告

这是正确的改进方向。

---

## 📋 审核评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 问题定义 | ⭐⭐⭐⭐⭐ | 清晰、准确 |
| 解决方案 | ⭐⭐⭐⭐ | 技术方向正确，可补充实现细节 |
| 风险分析 | ⭐⭐⭐⭐⭐ | 完整、有缓解措施 |
| 测试策略 | ⭐⭐⭐⭐ | 覆盖主要场景，可补充边界条件 |
| 文档质量 | ⭐⭐⭐⭐⭐ | 结构清晰、可执行 |

**总分**: 23/25

---

## 最终建议

**采纳此方案**，并在实现时：

1. 补充 git 命令的具体用法和异常处理
2. 添加边界条件测试用例
3. 增加"用户可见变化"章节
4. 实现时保持简单，不过度优化性能

---

## 附录：建议的实现伪代码

```typescript
async function resolveWorktreePath(registryPath: string): Promise<{
  diffPath: string;
  resolution: 'cwd_worktree' | 'registry_repo';
  warning?: string;
}> {
  const cwd = process.cwd();

  try {
    // 获取 cwd 的 git 信息
    const cwdCommonDir = execSync('git rev-parse --git-common-dir', {
      cwd,
      encoding: 'utf-8'
    }).trim();

    const cwdTopLevel = execSync('git rev-parse --show-toplevel', {
      cwd,
      encoding: 'utf-8'
    }).trim();

    // 获取 registry 路径的 git 信息
    const registryCommonDir = execSync('git rev-parse --git-common-dir', {
      cwd: registryPath,
      encoding: 'utf-8'
    }).trim();

    // 比较 common dir（解析相对路径）
    const resolvedCwdCommon = path.resolve(cwd, cwdCommonDir);
    const resolvedRegistryCommon = path.resolve(registryPath, registryCommonDir);

    if (resolvedCwdCommon === resolvedRegistryCommon) {
      // 同一仓库，使用 cwd 的 worktree
      return {
        diffPath: cwdTopLevel,
        resolution: 'cwd_worktree'
      };
    } else {
      // 不同仓库，fallback 并警告
      return {
        diffPath: registryPath,
        resolution: 'registry_repo',
        warning: `cwd is in a different git repository than the indexed repo`
      };
    }
  } catch (e) {
    // git 命令失败，fallback
    return {
      diffPath: registryPath,
      resolution: 'registry_repo',
      warning: `Could not resolve git worktree: ${e.message}`
    };
  }
}
```

此伪代码仅供参考，实际实现需要处理更多边界情况。
