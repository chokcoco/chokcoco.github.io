# Course Generation Spec: Harness Engineering

状态：正式生成阶段 v0.3；本轮生成第 3–13 章、实验仓库与整课质量报告。

## Current scope

第 1–2 章已通过方向确认。本轮补齐第 3–13 章 Markdown、术语表、课程专用电商模拟仓库、静态 HTML 预览和整课质量报告。

Harness Engineering 继续使用独立构建脚本，不接入 RAG 课程生成器。课程目录已注册到 `courses/catalog.json`，但是否正式发布仍由人工决定。

## Course shape

- 使用“概念主线 + 工程加深 + 双层实践”
- 概念主线面向零基础和轻编程学习者
- 工程加深面向研发、测试、架构、DevOps、SRE 和技术管理人员
- 每章根据学习目标决定长度，不采用统一字数限制
- 同一章只保留一条清楚的核心问题，多个可独立验收的目标需要拆章
- 前半段建立概念和判断框架，后半段进入工程组件、组织落地和实践

## Learning path

1. 从“写代码”到“设计工作系统”
2. 看懂 agent、agent loop 与 harness
3. 把意图写成可验证的任务契约
4. 建立对智能体可读的环境和知识
5. 为已有企业仓库建立定位、上下文和修改边界
6. 从零为新仓库建设 agent-first 的基础结构
7. 给智能体合适的工具、接口和可观测能力
8. 用架构约束、权限和机械规则控制边界
9. 用测试、eval 和评价量规建立反馈回路
10. 支撑长时运行、状态交接和恢复
11. 设计自治等级、任务编排与多智能体协作
12. 处理漂移、技术债、安全、审计、成本与组织变化
13. 完成已有仓库改造或新仓库建设实践

## Practice design

### Path A: Harness 设计实践

面向零基础学习者。提供一个模拟项目和失败记录，学习者完成：

- 任务意图卡
- Harness 画布
- 仓库知识地图
- 工具与权限表
- 反馈回路图
- 自治等级和人工闸门
- 失败复盘与改进方案

### Path B: Harness 工程实践

面向研发人员。基于同一案例落地：

- 根目录和局部指令文件
- 产品需求、架构和执行计划
- 可组合命令或工具
- schema、lint、结构测试和验收测试
- 日志、指标、轨迹与运行报告
- 失败恢复、状态记录和持续清理任务
- 第一阶段硬检查和第二阶段语义评价

工程实践保持厂商中立，以 Codex 与 Claude Code 作为常见示例，并在适用处说明 GLM、千问等替代路径。前端采用 React 19.2、Vite 8.1 与 Node.js 22；后端采用 Java 21、Spring Boot 4.1 与 Maven。命令兼容 macOS 与 Windows。

## Course lab contract

- 实验仓库位于 `labs/commerce-harness-lab/`，品牌、人员、数据和运行记录均为虚构
- `starter/` 模拟一个已有多年、规则分散且测试不足的电商仓库
- `harness-overlay/` 提供仓库地图、任务契约、验证命令、评测样本和持久状态等参考实现
- `greenfield/` 展示从空仓库开始时的最小 agent-first 结构
- 业务功能一是优惠叠加与结算价解释，业务功能二是库存预占、幂等重试与超时释放
- 案例只借鉴公开工程资料中的问题类型，不复制真实企业源码、架构细节或生产指标
- JavaScript 中不依赖 React 的纯业务规则必须能用 Node.js 自带测试运行
- React 构建必须实际执行；Java 工程若本机缺少 JDK，需要在质量报告中明确验证边界，不得声称已运行

## Confirmed sample chapter contract

### 第 1 章

- 核心问题：Harness Engineering 到底改变了什么？
- 学习证据：学习者能从失败案例中区分模型问题与工作系统问题
- 必须覆盖：OpenAI 案例的事实边界、课程工作定义、工程师角色变化、两步走主案例、适用边界
- 预计学习时间：50–65 分钟

### 第 2 章

- 核心问题：模型为什么不能独自完成真实工程？
- 学习证据：学习者能画出并解释简化 agent loop，指出 harness 各组件的职责
- 必须覆盖：模型、agent、agent loop、agent harness、工具、状态、权限、观察结果和终止
- 预计学习时间：55–70 分钟

## Style

- 中文解释先建立具体问题，再引入术语
- 首次出现术语时保留英文，例如 agent harness、agent loop、feedback loop
- 不机械展示 What、Why、How 标签
- 不把章节写成 OpenAI 产品宣传，也不把厂商功能写成通用原理
- 允许使用反例、失败日志、流程图、约束表、任务契约和运行报告
- 代码、配置和命令只在帮助理解或实践时出现
- 正式课程正文必须经过 humanizer-zh，避免宣传腔、空泛总结和机械排比

## Student-visible publication rules

- 本课程将用于售卖，学生正文与创作 workspace 必须分离。
- 每章开头只保留“预计学习时间”和“一句话总结”。不展示“适合人群”“本章产物”“学习证据”“样章状态”等后台标签。
- 学生可见内容不得披露用户提供的材料、内部资料名称、课程蒸馏或总结来源、生成过程、质检过程、rubric 分数和待确认事项。
- 三份 Repo Harness / Repo Guide 材料只在 workspace 内参与事实整理和案例设计，不出现在正文、参考文献、页面元数据或公开链接中。
- 课程蓝图、MISSION、RESOURCES、生成规范、质量报告与 learning records 不进入学生页面导航。
- 正文不放行内引用链接。公共引用统一放在章末“参考文献”，使用常规书目格式。
- 断言与来源的对应关系维护在 `workspace/CLAIM-SOURCE-MAP.md`，用于内部审校，不发布给学生。
- 学生正文完成后执行披露扫描，检查“你提供”“内部材料”“蒸馏”“样章”“rubric”“质检”等生产信息。

## Source policy

- Harness Engineering 的定义以 OpenAI 2026-02-11 原文为锚点
- Codex 实现细节使用 OpenAI 官方文档或 openai/codex 仓库
- 跨厂商原则用其他厂商一手工程资料交叉校准
- 用户提供的内部材料需要标注公开、内部可用或必须脱敏
- 数字、日期、性能、成本和版本必须在断言附近给出来源
- 不把案例相关性写成因果证明

## Quality gates for formal generation

正式生成后，每章和整课依次执行：

1. 重新构建学生可见产物
2. 对中文内容执行 humanizer-zh
3. 运行 teach-generator 的 validate-course.mjs
4. 第一阶段通过后，读取 course-rubric.md 做语义审校
5. 根据报告定向修改，并重新从第一阶段开始
6. 通过浏览器、代码运行和人工审核检查最终体验

课程根目录使用 `.teach-generator-qc.json` 声明 Markdown-only 结构。每次正文改动后，旧的第二阶段报告立即失效，必须重新运行第一阶段脚本。

第二阶段使用 `course-rubric.md` 1.0 的默认六维权重。`ready` 阈值为 85 分，所有维度至少 3 分，没有 blocker 或 major，Humanizer 不低于 45/50。

## Publishing

- 目标是内部教学平台使用的 Markdown 课程
- 课程目录已经注册到 `courses/catalog.json`
- 默认人工审核，不自动发布
- 静态预览支持目录导航、Mermaid、术语提示和本地代码高亮；平台导入规则最终复核
- Markdown 是章节正文事实源；静态 HTML 由 `scripts/build-harness-course.mjs` 生成，不直接手改
- 学生页面需要支持 Markdown 表格、引用、列表、代码块、Mermaid、术语提示与本地代码高亮
