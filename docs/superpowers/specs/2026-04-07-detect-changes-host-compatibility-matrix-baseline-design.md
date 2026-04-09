# Detect Changes Host Compatibility Matrix Baseline Design

日期：2026-04-07  
类型：docs-only research baseline  
范围：外部宿主兼容性矩阵

---

## 1. 问题定义

`detect_changes` worktree 文档已经收敛到只剩一个开放项：

- 外部宿主兼容性矩阵

但这个开放项此前只是一个未展开 checkbox，没有区分：

- 官方文档已确认的事实
- 只能从相关能力旁证得到的推断
- 必须通过 live probe 才能确认的行为

---

## 2. 设计选择

本轮只建立 matrix baseline，不宣称完成 live probe：

- 用官方文档建立宿主能力边界
- 用仓内既有 Codex 实测补足当前已知事实
- 把 review 的开放项改成“已建矩阵基线，live probe 待补”

---

## 3. 风险边界

本轮不触及：

- host adapter 代码
- `detect_changes` 实现
- 外部宿主实际运行环境

唯一目标是把“矩阵待补”收敛为更精确的研究状态。
