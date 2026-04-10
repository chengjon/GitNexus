# BackendRuntime normalizePathForKey Risk Boundary

日期：2026-04-10
范围：`gitnexus/src/mcp/local/runtime/backend-runtime.ts`、`gitnexus/test/unit/backend-runtime.test.ts`、`gitnexus/test/unit/calltool-dispatch.test.ts`
目标：把 `BackendRuntime.normalizePathForKey()` 当前为何仍属于高风险主路径、现有行为证据覆盖到哪里、以及未来什么条件下才适合继续收敛到更深的共享 helper 写清楚，避免后续把 repo 解析主链误当成普通 path helper 清理。

治理入口：[DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)
相关基线：[2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md)

---

## 1. 背景

`gitnexus/src/mcp/local/runtime/backend-runtime.ts` 当前的相关实现很薄：

- `normalizePathForKey(repoPath)` 直接委托给 `normalizePlatformPath(repoPath)`
- `samePath(left, right)` 直接委托给 `samePlatformPath(left, right)`

这两步表面上已经完成“共享 helper 收敛”，但当前风险不在 helper 是否共用，而在这些语义仍然决定：

- `refreshRepos()` 如何归并 duplicate-name repos 的 canonical path key
- `repoId()` 如何生成稳定 repo id 与 hash suffix
- `resolveRepo()` 如何在 exact path / exact name / case-insensitive name / internal id / partial name 之间确定优先级
- `init()` 在初次刷新后拿到的 repo 集合是否稳定

因此，这里不是单纯的“局部 path helper cleanup”，而是 repo identity contract 的主路径。

---

## 2. 当前 Reachability 与风险边界

### Measured

`gitnexus_impact(target="normalizePathForKey", direction="upstream", repo="GitNexus")`
在 `2026-04-10` 的结果为：

- risk: `HIGH`
- d=1 direct callers:
  - `refreshRepos`
  - `repoId`
- d=2 affected entry paths:
  - `init`
  - `resolveRepo`
- affected processes:
  - `Init → NormalizePathForKey`
  - `ResolveRepo → NormalizePathForKey`
  - `ResolveRepo → AmbiguousRepoError`

### Source Boundary

当前代码里的关键关系是：

- `refreshRepos()` 会先对注册仓库路径做 `normalizePathForKey(entry.path)`
- 然后基于 base name + normalized path 构建 `baseNamePaths`
- `repoId()` 再根据该 normalized path 决定：
  - 是否直接复用小写 basename
  - 还是追加基于 normalized path 的 hash suffix
- `resolveRepoFromCache()` 则继续用 `samePath()` 做 exact path match，随后才回退到 exact name、case-insensitive name、internal id、partial name

这说明改变 `normalizePathForKey()` 的语义，不只会影响“内部 key 长什么样”，还会连带影响 repo id、缓存命中、歧义提示与 lookup precedence 的整体行为。

---

## 3. 当前测试边界

当前仓内已经有两层实测证据：

- [backend-runtime.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/backend-runtime.test.ts)
  - 锁定 `normalizePathForKey()` 当前确实委托给共享 `normalizePlatformPath()` helper
  - 锁定 duplicate-name repo ids 在 refresh 顺序变化下仍保持 deterministic
  - 锁定 `BackendRuntime.resolveRepo()` 在 duplicate-name case-collision 场景下：
    - exact case-sensitive name 优先于 case-insensitive match
    - exact repo path 优先于 name / id fallbacks
    - case-insensitive 歧义会抛出带 suggested params 的错误
- [calltool-dispatch.test.ts](/opt/claude/GitNexus/gitnexus/test/unit/calltool-dispatch.test.ts)
  - 经 `LocalBackend` 公共入口再锁一层相同 repo resolution contract
  - 额外锁定 repo miss 时会触发 refresh 重读 registry

### History Check

当前这条路径最近两次相关收敛分别是：

- `a3a2a18` `refactor(runtime): share platform path comparison`
- `933bcaf` `refactor(runtime): share backend path normalization`

这说明“继续共享 helper”这一步已经做过；后续再动，不再是重复搬运代码，而是可能改变 repo identity 主契约。

---

## 4. 当前为什么不适合继续按低风险切片硬切

当前不适合把这条路径继续混入“低 blast radius 的 path helper cleanup”，理由有三类：

1. repo id drift 风险
   - `repoId()` 直接依赖 normalized path
   - 一旦归一化语义改变，同名仓库的 hash suffix、缓存 key 与 Kuzu repo id 都可能发生漂移

2. lookup precedence 风险
   - `resolveRepoFromCache()` 先做 exact path，再做 exact/case-insensitive name 与 internal id fallback
   - 任意一步归一化或相等判断变化，都可能让“路径优先”变成“名字优先”或让歧义行为变化

3. refresh/init 主链风险
   - `init()` 先走 `refreshRepos()`
   - 这意味着 repo 注册表初始化、后续 resolve、以及 ambiguous error message 都会共享同一套 path identity 语义

所以这里的真实问题不是“还剩多少重复代码”，而是“repo identity contract 是否已经被单独建模并锁住”。当前答案仍然是否。

---

## 5. 未来可继续收敛的退出条件

只有在以下条件明确满足后，才适合继续推进这条主路径的实现收敛：

1. 契约先行
   - 明确 repo identity contract 至少包含：
     - normalized path key 语义
     - duplicate-name repo id 生成规则
     - exact path / exact name / case-insensitive name / internal id / partial name 的优先级

2. 测试矩阵补齐
   - 至少持续覆盖以下场景：
     - duplicate-name repos 在 refresh 顺序变化下的 deterministic ids
     - exact repo path 优先于 name / id fallback
     - exact case-sensitive name 优先于 case-insensitive name
     - case-insensitive 歧义时抛出 suggested params
     - repo miss 时 refresh 后可重新命中
   - 若未来涉及 host-specific path behavior，还要补对应 mixed-case / path-format regression

3. 切片隔离
   - 这类修改必须作为 dedicated runtime identity slice 单独评审
   - 不应混在别的 CLI / MCP / path helper opportunistic cleanup 中

4. 变更前复核
   - 真正修改 `backend-runtime.ts` 前，必须重新跑 `gitnexus_impact(target="normalizePathForKey", direction="upstream")`
   - 并把 `refreshRepos`、`repoId`、`init`、`resolveRepo` 视为同一主路径一起核查

---

## 6. 结论

当前更准确的状态是：

- `normalizePathForKey()` 本身已经足够薄，不再是重复实现问题
- 但它仍处于 repo identity 主路径，blast radius 依旧是 `HIGH`
- 当前已有 focused unit coverage，可以证明当前 contract 的关键行为
- 下一步正确动作不是继续“顺手抽 helper”，而是先把 repo identity contract 当成单独高风险治理对象处理

在退出条件满足前，把这条路径继续留在单独观察名单里是合理的；把它误判成普通低风险 path cleanup 则不合理。
