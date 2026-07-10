# 0002 Sample confirmation

## Context

用户已补充外部教程和三份企业 Repo Harness / Repo Guide 材料，并完成课程规模、实践环境与发布格式确认。

## Decisions

- 课程采用 13 章，总课时 12–15 小时。
- 正式交付为内部教学平台使用的 Markdown。
- 原“iOS 与 Windows”修正为“macOS 与 Windows”。
- 工具与模型保持厂商中立，常见示例包括 Codex、Claude Code、GLM 和千问。
- 代码实践使用 JavaScript 与 Java 双路径。
- 主案例分两步：改造已有企业仓库，再从零建设新仓库。
- 内部 Repo Harness 材料作为工程加深案例，可直接使用，无需脱敏。
- 先生成第 1–2 章样章，完成 Humanizer、确定性检查、课程评价量规和人工审核后再扩展。

## Consequences

- 现有准备阶段状态、11 章蓝图和 GitHub Pages 目标需要同步更新。
- 第 1–2 章以概念判断和系统图为学习证据，不强行加入代码。
- Markdown-only 课程使用课程级 `.teach-generator-qc.json` 约束质检范围。
- Mermaid 最终渲染效果需要在内部教学平台导入后复核。
