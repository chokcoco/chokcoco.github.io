# 0003 Commercial publication boundary

## Context

用户审阅第 1–2 章后确认课程将用于售卖。当前正文暴露了适合人群、本章产物、内部材料名称、创作来源和行内链接，这些信息不应出现在学员版本。

## Decisions

- 章节开头只保留预计学习时间和一句话总结。
- 学生正文不出现内部材料名称、用户提供过程、蒸馏来源、生成状态、质检和 rubric 信息。
- 公共来源链接统一收口到章末“参考文献”。
- 内部材料与断言的对应关系保存在 workspace，不进入学生页面。
- Markdown 是 Harness Engineering 正文事实源，HTML 只作为生成的浏览产物。

## Consequences

- 修改第 1–2 章后，旧质量报告失效，需要从第一阶段重新质检。
- 后续章节沿用相同披露规则。
- 静态站点不导航到 workspace、quality 或内部 assets。
