# 0001 Initial Harness Engineering Framing

## Context

用户准备为系统增加第二门课程 Harness Engineering。目标受众从零基础学习者延伸到企业在职 IT 研发人员。用户要求先检索专业资料并建立课程大纲和前置文件，待其补充教材后再正式生成。

## Decision

课程以 OpenAI 2026-02-11 的 Harness Engineering 原文为概念锚点，同时使用 Codex agent loop、App Server、Symphony、evals 以及其他厂商一手 harness 实践做交叉校准。

课程采用概念主线、工程加深和双层实践。当前章节结构是可调整草案，不生成学生可见课程产物，也不注册到课程 catalog。

## Consequences

- 用户补充资料后必须重新检查课程范围和章节顺序
- OpenAI 案例事实与通用工程原则要分开写
- 零基础路径强调判断、画布和任务契约
- 研发路径加入仓库知识、工具、约束、反馈、状态和编排实现
- 正式生成从样章开始，样章通过 Humanizer、确定性质检和课程评价量规后再扩展
