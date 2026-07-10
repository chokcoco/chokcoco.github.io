# Harness Engineering 课程蓝图

状态：整课生成 v0.4。采用 13 章结构，第 1–2 章已确认，第 3–13 章进入生成与质检。

## Course spine

课程围绕一个问题推进：怎样把“让 AI 帮我做事”变成一个可说明、可验证、可恢复、可持续改进的工程系统？

学习路径分成四段：

1. 重新理解工程师、模型、智能体和 harness
2. 设计意图、环境、工具、约束和反馈
3. 处理长时运行、自治、编排、漂移与治理
4. 为一个具体项目完成 harness 设计或工程实现

## Knowledge map

- 意图层：目标、范围、约束、验收标准、优先级、停止条件
- 环境层：代码、数据、依赖、文档、状态、沙箱、权限
- 能力层：模型、工具、CLI、MCP、skills、浏览器、外部系统
- 控制层：架构边界、schema、lint、tests、hooks、审批
- 反馈层：日志、指标、trace、eval、评价量规、用户反馈
- 运行层：agent loop、上下文、计划、恢复、并发、编排
- 治理层：安全、审计、成本、技术债、所有权、组织角色

## Chapters

| 章 | 核心问题 | 必须覆盖 | 初学路径证据 | 工程加深证据 | 预计时间 | 核心来源 |
| ---: | --- | --- | --- | --- | ---: | --- |
| 1 | Harness Engineering 到底改变了什么？ | OpenAI 案例边界、课程工作定义、角色变化、适用范围 | 从失败案例中找出工作系统缺口 | 盘点团队现有 AI 编码流程 | 50–65 分钟 | OpenAI Harness Engineering |
| 2 | 模型为什么不能独自完成真实工程？ | 模型、agent、agent loop、harness、工具、状态、权限、终止 | 画出简化 agent loop | 拆解一个 agent runtime | 55–70 分钟 | OpenAI Agent Loop、App Server |
| 3 | 怎样把“帮我做完”写成可验证意图？ | 目标、范围、约束、验收标准、停止条件、失败处理 | 改写一条模糊需求 | 形成可执行 spec 与任务图 | 55–70 分钟 | OpenAI Harness Engineering、OpenAI Evals |
| 4 | 智能体怎样读懂项目？ | 事实源、知识地图、渐进式披露、计划、上下文预算 | 设计仓库知识地图 | 建立可验证的 repo knowledge | 60–75 分钟 | OpenAI Harness Engineering、内部 Repo Guide |
| 5 | 怎样改造一个已有企业仓库？ | route/module 定位、Context Pack、allowed/blocked/notice、freshness | 为存量仓库填写改造清单 | 生成最小 Repo Harness 方案 | 65–80 分钟 | 内部 Repo Harness 材料 |
| 6 | 怎样从零建设 agent-first 新仓库？ | 目录、架构边界、命令、文档、测试、初始化与模板 | 画出新仓库启动蓝图 | 创建 JavaScript/Java 双路径骨架 | 65–85 分钟 | OpenAI Harness Engineering、Anthropic Harness Design |
| 7 | 什么工具能让智能体真正行动？ | 工具接口、CLI、协议、可观察输出、错误设计 | 工具与信息清单 | 封装一个可验证工具 | 55–70 分钟 | OpenAI App Server、Codex repo |
| 8 | 怎样让智能体有自由但不越界？ | 不变量、schema、lint、结构测试、sandbox、权限、审批 | 风险与权限矩阵 | 编码约束和安全闸门 | 60–75 分钟 | OpenAI Harness Engineering、GitHub Hooks |
| 9 | 如何知道它真的做对了？ | 单元/验收测试、eval、rubric、日志、trace、maker-checker | 验收表和失败分类 | 自动反馈回路 | 65–80 分钟 | OpenAI Evals、Anthropic Agent Evals、Fowler Sensors |
| 10 | 任务跑几小时，怎样不失忆？ | 上下文耗尽、持久状态、进度、交接、恢复、clean state | 状态交接卡 | 进度记录与恢复策略 | 55–70 分钟 | Anthropic Long-running Agents、OpenAI Agent Loop |
| 11 | 何时提高自治，何时交给人？ | 自治等级、状态机、并发、隔离、任务依赖、多智能体 | 设计人工闸门 | 简化编排器方案 | 55–75 分钟 | OpenAI Symphony、Anthropic Managed Agents |
| 12 | 速度提高后，怎样控制漂移和风险？ | AI slop、golden principles、持续清理、安全、审计、成本、度量 | 治理清单 | 采用路线和度量方案 | 60–75 分钟 | OpenAI Harness Engineering、METR、企业资料 |
| 13 | 怎样把 Harness 用到自己的仓库？ | 双路径综合实践、运行证据、复盘、人工审核 | Harness 设计包 | 可运行最小实现 | 90–120 分钟 | 全部已批准来源 |

## Audience and prerequisite routing

- 第 1–4 章是共同主线，不要求编程基础。练习以判断、标注、画图和改写为主。
- 第 5 章进入已有企业仓库，初学者使用提供好的仓库快照，研发人员读取真实目录和验证命令。
- 第 6 章进入新仓库。工程路径分别使用 JavaScript 与 Java，概念路径只完成架构与规则设计。
- 第 7–12 章保留共同解释，将命令、代码与组织治理放入“工程加深”。
- 第 13 章不要求提交或评分。学习者可以完成设计包，也可以实现可运行版本。

前置工具按学习路径分层：概念路径只需 Markdown 阅读器；工程路径需要 Git、终端、Node.js 或 JDK。macOS 与 Windows 命令差异在实践章并列说明。

## Chapter-level learning evidence

每章至少包含一种可观察证据：

- 概念分类或错误诊断
- 图、表、任务契约或运行状态设计
- 对失败轨迹的分析
- 可执行配置、测试或工具
- 运行日志、截图、测试报告或质量报告

不为每章强制加入代码。代码仅用于工程加深或实践。

## Two-step case spine

课程使用同一类业务任务，分别观察两种仓库起点。

### 第一步：改造已有企业仓库

- 输入：一个包含多个应用、共享包、历史规则和测试缺口的模拟企业仓库
- 任务：修改一项已有功能，并给出影响范围和验证证据
- 重点：识别真实边界、减少盲读、建立 Context Pack、控制 diff、补反馈
- 企业加深：使用 Repo Harness 与 Repo Guide 材料说明 facts、source refs、freshness 和 reliable stop
- 业务任务：修复会员折扣、订单券与运费优惠的叠加规则，并让结算页显示可解释的价格明细

### 第二步：从零建设新仓库

- 输入：同类业务需求，但仓库为空
- 任务：先建立目录、架构边界、事实源、命令、测试和运行规则，再交给智能体实现功能
- 重点：从第一天减少歧义，让知识、约束和反馈可以被机器读取与验证
- 工程路径：分别给出 JavaScript 前端/Node.js 与 Java 后端示例
- 业务任务：建立库存预占、幂等重试、支付成功占用和超时释放的最小闭环

最终比较两种方案的共同点和差异，不把新仓库经验生搬到存量仓库。

## Dependency notes

- 第 1–4 章是共同前置。
- 第 5 章和第 6 章分别展开两种仓库起点，互相对照但都依赖第 3–4 章。
- 第 7–9 章构成工具、控制和反馈主体。
- 第 10 章依赖工具与反馈概念；第 11 章在单智能体闭环清楚后引入编排。
- 第 12 章回收前面各章的风险问题，第 13 章完成综合迁移。
