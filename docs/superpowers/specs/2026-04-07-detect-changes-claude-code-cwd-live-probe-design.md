# Detect Changes Claude Code CWD Live Probe Design

日期：2026-04-07  
类型：docs-only probe record  
范围：Claude Code host behavior

---

## 1. 问题定义

在 matrix baseline 之后，Claude Code 仍处于：

- 文档存在 path/worktree 旁证
- 但未做 live probe

这使得 `detect_changes` 的共享 guidance 仍不得不把 Claude Code 归在“未验证”。

---

## 2. 设计选择

本轮用一个临时 probe server 直接记录 MCP tool call 参数，而不是依赖模型回复。

目标不是实现永久测试基建，而是形成一个足够强的 host-behavior 审计结论。

---

## 3. 风险边界

本轮不触及：

- `detect_changes` 实现
- Claude Code 配置文件
- 仓内任何运行时代码

唯一目标是把 Claude Code 的 `cwd` 行为从“未验证”推进到“当前 CLI 已 probe”。
