# Detect Changes Worktree Design Truth Sync Design

日期：2026-04-07
类型：doc-only truth-sync
范围：`detect_changes` worktree design / review 文档

---

## 1. 问题定义

review 文档已经准确描述了当前实现，但 design 文档仍保留旧的 proposal 语言。

因此当前的真实开放项并不是实现未完成，而是：

- design 文档未同步到 `params.cwd || process.cwd()` 的当前合同
- git 命令语义说明仍不够精确
- review 末尾仍把设计文档同步列为待完成项

---

## 2. 设计选择

本轮不重写设计历史，只做 truth-sync：

- 保留原文档主题与结构
- 把 proposal wording 更新为当前实现说明
- 让 review 与 design 对“剩余开放项”的判断收敛到同一结论

---

## 3. 风险边界

本轮不触及：

- `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- `gitnexus/src/storage/git.ts`
- 任何 host adapter

唯一目标是修正文档事实。
