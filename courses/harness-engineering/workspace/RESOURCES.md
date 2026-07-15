# Harness Engineering Resources

状态：来源包 v0.3，访问日期 2026-07-10。整课来源、技术版本与电商案例来源已登记。

## Source policy

- A 级：提出概念或记录实际系统的一手资料，可支撑核心定义和事实
- B 级：厂商工程实践与官方文档，可支撑实现模式，但要说明产品上下文
- C 级：社区解释、课程、演讲和个人文章，只用于案例与表达参考，核心事实需要 A/B 级来源校准
- 产品行为、模型能力、用量、价格和发布日期属于易变化信息，正式生成前重新核验
- OpenAI 内部实验数字只用于解释案例，不作为企业收益承诺
- 用户提供和企业内部材料只用于作者侧研究、事实校准与教学抽象；学生可见正文、参考文献和页面元数据不得披露其名称、路径、提供者或蒸馏关系

## Core OpenAI sources

### 1. Harness engineering: leveraging Codex in an agent-first world

- URL: https://openai.com/index/harness-engineering/
- 发布者：OpenAI，Ryan Lopopolo
- 日期：2026-02-11
- 等级：A
- 用途：课程定义、工程师角色变化、应用可读性、仓库知识、架构约束、自治等级、熵与持续清理
- 已核验要点：
  - 原文讨论了一个仓库中没有人工编写代码的内部产品实验
  - 团队把主要工作转向设计环境、明确意图和建立反馈回路
  - 大型单体 AGENTS.md 被认为不利于上下文管理，短地图加结构化文档更有效
  - 文档不足时，把规则提升为 lint、结构测试和其他机械约束
  - 自治提升依赖测试、验证、评审、反馈处理和恢复能力被编码进系统
  - 智能体会复制仓库中的坏模式，因此需要 golden principles 和持续垃圾回收
- 边界：一百万行代码、约 1,500 个 PR、约十分之一开发时间等数字来自单个内部案例

### 2. Unrolling the Codex agent loop

- URL: https://openai.com/index/unrolling-the-codex-agent-loop/
- 发布者：OpenAI，Michael Bolin
- 日期：2026-01-23
- 等级：A
- 用途：解释 agent loop、模型推理、工具调用、观察结果、上下文窗口、线程与停止状态
- 已核验要点：harness 不只是模型；它负责编排用户、模型、工具和状态之间的循环

### 3. Unlocking the Codex harness: how we built the App Server

- URL: https://openai.com/index/unlocking-the-codex-harness/
- 发布者：OpenAI，Celia Chen
- 日期：2026-02-04
- 等级：A
- 用途：说明完整 harness 还包括线程生命周期、持久化、配置、认证、工具执行、扩展和客户端协议
- 边界：App Server 是 Codex 的产品架构案例，不是所有 harness 都必须采用 JSON-RPC

### 4. An open-source spec for Codex orchestration: Symphony

- URL: https://openai.com/index/open-source-codex-orchestration-symphony/
- 发布者：OpenAI，Alex Kotliarskyi、Victor Zhu、Zach Brock
- 日期：2026-04-27
- 等级：A
- 用途：作为 Harness Engineering 后续演进，解释任务看板控制面、状态机、并行执行、恢复和人类注意力瓶颈
- 边界：500% landed PR 增长来自部分团队的早期观察，需要保留场景限定

### 5. How evals drive the next chapter in AI for businesses

- URL: https://openai.com/index/evals-drive-next-chapter-of-ai/
- 发布者：OpenAI
- 日期：2025-11-19
- 等级：A
- 用途：建立 Specify、Measure、Improve 的反馈框架，解释 golden set、错误分类、持续评测和专家复核

### 6. OpenAI Codex open-source repository

- URL: https://github.com/openai/codex
- 发布者：OpenAI
- 等级：A
- 用途：核验 Codex harness、配置、沙箱、工具、AGENTS.md 发现和实际实现
- 使用方式：正式写技术细节前定位到具体文档、版本、issue 或源码，不从仓库首页推导未写明的行为

### 7. Codex use cases

- URL: https://developers.openai.com/codex/use-cases
- 发布者：OpenAI
- 等级：B
- 用途：补充可验证操作、skills、自动化、代码审查、质量循环和企业工作流案例
- 边界：页面持续更新，正式生成前记录访问日期

## Cross-vendor first-party sources

### 8. Building effective agents

- URL: https://www.anthropic.com/engineering/building-effective-agents
- 发布者：Anthropic
- 日期：2024-12-19
- 等级：B
- 用途：区分 workflow 与 agent，解释 prompt chaining、routing、parallelization、orchestrator-workers、evaluator-optimizer，并提醒优先采用足够简单的方案

### 9. Effective harnesses for long-running agents

- URL: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- 发布者：Anthropic
- 日期：2025-11-26
- 等级：B
- 用途：解释跨上下文运行、initializer、增量进展、进度文件、Git 历史和干净交接状态

### 10. Harness design for long-running application development

- URL: https://www.anthropic.com/engineering/harness-design-long-running-apps
- 发布者：Anthropic，Prithvi Rajasekaran
- 日期：2026-03-24
- 等级：B
- 用途：planner、generator、evaluator 分工，任务契约，Playwright 验证，评价标准校准和 harness 简化
- 边界：文中的质量、耗时和成本数据来自特定实验，不直接外推

### 11. Demystifying evals for AI agents

- URL: https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
- 发布者：Anthropic
- 日期：2026-01-09
- 等级：B
- 用途：解释多轮智能体为何更难评测，以及评测如何发现回归与行为变化

### 12. GitHub Copilot hooks

- URL: https://docs.github.com/en/copilot/concepts/agents/hooks
- 发布者：GitHub
- 等级：B
- 用途：展示如何在智能体生命周期中执行验证、审计、安全策略和敏感操作审批
- 边界：配置格式属于 GitHub Copilot，课程提炼的是生命周期闸门与机械执行原则

## Independent research

### 13. Task-Completion Time Horizons of Frontier AI Models

- URL: https://metr.org/time-horizons/
- 发布者：METR
- 最近更新：2026-05-08
- 等级：A
- 用途：解释智能体可靠性随任务难度和时长变化，帮助学习者避免把“能运行很久”误解为“能可靠完成长任务”
- 边界：任务主要来自软件工程、机器学习和网络安全；50% time horizon 是任务难度指标，不是智能体实际连续运行时长

## Sources mentioned by the OpenAI article for later verification

- Architecture documentation: https://matklad.github.io/2021/02/06/ARCHITECTURE.md.html
- Parse, don’t validate: https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/
- AGENTS.md open format: https://agents.md/

这些资料在正式章节中使用前，需要单独阅读并确认适用范围。

## User-provided materials

- 三份 Repo Harness / Repo Guide 内部材料可用于作者侧课程设计，但不得在学生可见内容中披露材料身份、文件路径或来源关系
- 两套社区教程用于结构、练习和表达参考，核心定义仍由 A/B 级来源校准
- 工具与模型不限定厂商；常见示例包括 Codex、Claude Code、GLM 和千问
- 代码实践采用 JavaScript 与 Java，兼容 macOS 与 Windows
- 内部教学平台接收 Markdown

## Research gaps

- “Harness Engineering”在中文语境中的稳定译法与现有中文课程
- 非软件研发场景中的可复核落地案例
- 企业安全、审计、权限和成本治理的系统性资料
- 不同编码智能体在仓库指令、hooks、skills、MCP 和沙箱方面的对照
- 适合零基础学习者的可视化练习与无代码实践
- 企业采用前后的可靠性指标、返工率和人类注意力成本

## Tooling note

本轮重新核验了 Harness Engineering、agent loop、App Server、长时任务、编排、React、Vite、Spring Boot、优惠组合、库存预占和幂等重试的一手资料。后续涉及具体产品配置时，仍优先使用官方文档或官方源码，并记录访问日期。

## Full-course implementation sources verified on 2026-07-10

### Shopify inventory reservations

- URL: https://shopify.engineering/scaling-inventory-reservations
- 发布者：Shopify Engineering
- 日期：2026-05-12
- 等级：A
- 用途：确认电商库存预占需要区分 reserve 与 claim，并处理多仓、并发、超卖、少卖和可观测性
- 使用边界：课程只借鉴问题类型；不复制其 MySQL、`SKIP LOCKED`、容量数字或生产架构

### Shopify discount combinations

- URL: https://shopify.dev/docs/api/admin-graphql/latest/objects/DiscountCombinesWith
- 发布者：Shopify Developers
- 访问日期：2026-07-10
- 等级：A
- 用途：确认商品级、订单级和运费级优惠需要显式组合规则，部分组合要求双向兼容
- 使用边界：星桥商城使用自己的简化策略，不声称实现 Shopify API

### Shopify discount rejection

- URL: https://shopify.dev/changelog/discount-rejection-support-for-discount-functions
- 发布者：Shopify Developers
- 日期：2025-12-17
- 等级：A
- 用途：补充防止重复优惠、细粒度组合和排除商品等现实需求
- 使用边界：只用于问题类型，不复制平台配置

### Stripe idempotency

- URL: https://stripe.com/blog/idempotency
- 发布者：Stripe Engineering
- 日期：2017-02-22
- 等级：A
- 用途：解释网络结果不确定、幂等键、相同请求重放、指数退避和 jitter
- 使用边界：课程实现是内存型教学示例，不声称达到支付平台语义

### Amazon safe retries

- URL: https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
- 发布者：Amazon Builders' Library
- 等级：A
- 用途：说明复杂操作拆分、重试副作用、调用者请求 ID 和同键异义

### React 19.2

- URL: https://react.dev/blog/2025/10/01/react-19-2
- 发布者：React Team
- 日期：2025-10-01
- 等级：A
- 用途：校准课程前端版本

### Vite 8.1

- URL: https://vite.dev/blog/announcing-vite8-1
- 发布者：Vite Team
- 日期：2026-06-23
- 等级：A
- 用途：校准轻量 React 构建工具版本

### Spring Boot 4.1

- URL: https://docs.spring.io/spring-boot/cli/
- 发布者：Spring
- 访问日期：2026-07-10
- 等级：A
- 用途：确认 4.1.0 是当前稳定版本；课程搭配 Java 21 与 Maven
- 边界：版本会变化，正式发布前重新核验

## 补充教程材料

### 互联网上已有的我认为不错的教程

- [Open AI - harness-engineering](https://openai.com/zh-Hans-CN/index/harness-engineering/)
- [Harness Engineering 学习指南](https://github.com/deusyu/harness-engineering/blob/main/README.md)
- [earn-harness-engineering](https://github.com/walkinglabs/learn-harness-engineering/blob/main/README.md)

### 企业内部落地材料

- [Repo Harness 介绍](../../../assets/Repo%20Harness%20介绍.md)
- [Repo Harness 设计与可行性分析](../../../assets/Repo%20Harness%20设计与可行性分析.md)
- [Repo Guide Skill 设计方案](../../../assets/Repo%20Guide%20Skill%20设计方案.md)


### Primary Articles

This list is intentionally narrow. A harness means the execution system around
the model: the agent loop, tool execution, sandboxing, state, context,
verification, termination, orchestration, and observability. General prompt
engineering or broad agent-framework articles do not belong in the primary
list.

The original three articles remain the backbone of the course:

- [OpenAI: Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) (2026-02-11): agent-first repositories, repo-local context, custom linting, and structural guardrails.
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (2025-11-26): initializer agent, coding agent, feature list, progress log, and handoff across context windows.
- [Anthropic: Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps) (2026-03-24): planner / generator / evaluator roles, context resets, harness simplification, and stale assumptions.

Only a few highly relevant 2026 articles are added:

- [OpenAI: Unrolling the Codex agent loop](https://openai.com/index/unrolling-the-codex-agent-loop/) (2026-01-23): the Codex runtime harness, tool calls, context growth, and loop termination.
- [Anthropic: Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) (2026-01-09): evaluating the model and harness together, and distinguishing evaluation harnesses from agent harnesses.
- [LangChain: Improving Deep Agents with harness engineering](https://www.langchain.com/blog/improving-deep-agents-with-harness-engineering) (2026-02-17): holding the model fixed while improving system prompts, tools, middleware, tracing, and self-verification to move a coding agent from Top 30 to Top 5 on Terminal Bench 2.0.
- [Thoughtworks / Martin Fowler: Harness engineering for coding agent users](https://martinfowler.com/articles/harness-engineering.html) (2026-04-02): coding-agent user harnesses as feedforward guides and feedback sensors, with deterministic and inferential controls.
- [Cursor: Continually improving our agent harness](https://cursor.com/blog/continually-improving-agent-harness) (2026-04-30): treating the harness as a continuously improved product system with offline evals, online metrics, tool-error taxonomy, model-specific tuning, and mid-chat model switching.

### 2026 Extended References

These are not core course sources, but they are useful when designing specific
harness modules. This section only keeps sources whose body directly covers the
agent loop, tool execution, context management, verification, sandboxing,
control layers, or regression governance. Pure agent products, platform
announcements, team case studies, and benchmarks are excluded.

- [OpenAI: Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/) (2026-02-04): the harness as a reusable App Server protocol with thread lifecycle, resume, fork, diffs, and client integrations.
- [OpenAI Developers: Run long horizon tasks with Codex](https://developers.openai.com/blog/run-long-horizon-tasks-with-codex) (2026-02-23): durable project memory, milestone validation, and done-when examples for long-running tasks.
- [OpenAI: The next evolution of the Agents SDK](https://openai.com/index/the-next-evolution-of-the-agents-sdk/) (2026-04-15): model-native harnesses, sandbox execution, and file/command execution.
- [OpenAI: An open-source spec for Codex orchestration: Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/) (2026-04-27): turning an issue tracker or Linear board into a multi-agent control plane.
- [Anthropic: Building a C compiler with a team of parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler) (2026-02-05): parallel agent teams, task locks, git synchronization, container isolation, and autonomous loops.
- [Anthropic: Scaling Managed Agents: Decoupling the brain from the hands](https://www.anthropic.com/engineering/managed-agents) (2026-04-08): a meta-harness view that separates session, harness, and sandbox as swappable interfaces.
- [Anthropic: An update on recent Claude Code quality reports](https://www.anthropic.com/engineering/april-23-postmortem) (2026-04-23): reasoning effort, context pruning, and system prompts as harness changes that need regression governance.
- [LangChain: Context Management for Deep Agents](https://www.langchain.com/blog/context-management-for-deepagents) (2026-01-28): filesystem offloading, tool-call truncation, summarization, and targeted evals for context-management harnesses.
- [LangChain: Tuning Deep Agents to Work Well with Different Models](https://www.langchain.com/blog/tuning-deep-agents-different-models) (2026-04-29): model-specific harness profiles for prompts, tool names, middleware, and subagent configuration.
- [LangChain: Continual learning for AI agents](https://www.langchain.com/blog/continual-learning-for-ai-agents) (2026-04-05): splitting agent improvement into model, harness, and context layers, powered by traces.
- [Microsoft: Agent Harness in Agent Framework](https://devblogs.microsoft.com/agent-framework/agent-harness-in-agent-framework/) (2026-03-12): shell/filesystem harnesses, approval flow, hosted shell execution, and context compaction.
- [Google: Announcing ADK for Java 1.0.0](https://developers.googleblog.com/announcing-adk-for-java-100-building-the-future-of-ai-agents-in-java/) (2026-03-30): plugins, event compaction, HITL, session/memory services, and A2A as reusable harness primitives.
- [GitHub: Automate repository tasks with GitHub Agentic Workflows](https://github.blog/ai-and-ml/automate-repository-tasks-with-github-agentic-workflows/) (2026-02-13): GitHub Actions as an agentic workflow runner with safe outputs, sandboxing, permissions, and review.
- [AWS: AI agents in enterprises: Best practices with Amazon Bedrock AgentCore](https://aws.amazon.com/blogs/machine-learning/ai-agents-in-enterprises-best-practices-with-amazon-bedrock-agentcore/) (2026-02-03): enterprise harness layers across Runtime, Memory, Gateway, Identity/Policy, Observability, and Evaluations.
- [Stripe: Minions: Stripe's one-shot, end-to-end coding agents](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents) (2026-02-09) and [Part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2) (2026-02-19): devbox isolation, custom agent harnesses, blueprint state machines, rule files, MCP tool curation, security controls, and pre-push/CI feedback loops.
- [Cognition: What We Learned Building Cloud Agents](https://cognition.ai/blog/what-we-learned-building-cloud-agents) (2026-04-23): VM isolation, session snapshot/resume, orchestration, governance, audit logging, and integrations for cloud-agent runtimes.
- [Cognition: Multi-Agents: What's Actually Working](https://cognition.ai/blog/multi-agents-working) (2026-04-22): generator-verifier loops, clean-context reviewers, smart-friend routing, manager-child coordination, and cross-agent communication boundaries.
- [Addy Osmani: Loop Engineering](https://addyosmani.com/blog/loop-engineering/) (2026-06-07): the complete loop engineering framework from `/goal` to six primitives — automations, worktrees, skills, connectors, sub-agents, external state — plus the four silent costs.
- [Replit: Decision-Time Guidance: Keeping Replit Agent Reliable](https://blog.replit.com/decision-time-guidance) (2026-01-20, updated 2026-01-23): a lightweight classifier injects short situational guidance at the decision point instead of stuffing all rules into the system prompt.
- [Vercel: How we made v0 an effective coding agent](https://vercel.com/blog/how-we-made-v0-an-effective-coding-agent) (2026-01-07): dynamic system prompts, a streaming rewrite layer, and deterministic/model-driven autofixers.
- [Vercel: Introducing deepsec](https://vercel.com/blog/introducing-deepsec-find-and-fix-vulnerabilities-in-your-code-base) (2026-05-04): a security-focused coding-agent harness with scan, investigate, revalidate, enrich, export, plugin, and refusal-checker steps.
- [Sourcegraph: CodeScaleBench](https://sourcegraph.com/blog/codescalebench-testing-coding-agents-on-large-codebases-and-multi-repo-software-engineering-tasks) (2026-03-03): an eval/tooling harness reference covering MCP tool adoption, tool-use transcripts, benchmark QA, verifier/reproducibility gates, and prompt/preamble iteration.

### AI 时代的 Harness Engineering（38 篇）

| # | 文章 | 作者 | 核心贡献 |
|---|------|------|---------|
| 1 | [OpenAI 原文](https://openai.com/zh-Hans-CN/index/harness-engineering/) | Ryan Lopopolo | 原点：六大概念 |
| 2 | [Martin Fowler](https://martinfowler.com/articles/harness-engineering.html) | Birgitta Böckeler | Guides×Sensors 控制论框架 + Harnessability + Ashby 定律 |
| 3 | [LangChain](https://blog.langchain.com/the-anatomy-of-an-agent-harness/) | Vivek Trivedy | 精确定义 + 组件清单 |
| 4 | [Anthropic](https://www.anthropic.com/engineering/harness-design-long-running-apps) | Prithvi Rajasekaran | GAN 三智能体 + Harness 瘦身 |
| 5 | [HumanLayer](https://www.humanlayer.dev/blog/skill-issue-harness-engineering-for-coding-agents) | Kyle | 六个杠杆 + 实战避坑 |
| 6 | [Anthropic/Claude Platform](https://claude.com/blog/harnessing-claudes-intelligence) | Lance Martin | 三大构建模式 + BrowseComp 数据 |
| 7 | [Anthropic/Managed Agents](https://www.anthropic.com/engineering/managed-agents) | Lance Martin 等 | Meta-harness + 基础设施解耦 |
| 8 | [Fowler/Encoding Team Standards](https://martinfowler.com/articles/reduce-friction-ai/encoding-team-standards.html) | Rahul Garg | 团队标准显式化三层路径 |
| 9 | [Fowler/Feedback Flywheel](https://martinfowler.com/articles/reduce-friction-ai/feedback-flywheel.html) | Rahul Garg | 从 AI 失败中持续学习的反馈闭环 |
| 10 | [LangChain/Agent Evaluation Checklist](https://blog.langchain.com/agent-evaluation-readiness-checklist/) | LangChain 团队 | 智能体评估五阶段清单 |
| 11 | [Meta-Harness 论文](https://arxiv.org/abs/2603.28052) | Yoonho Lee 等 (Stanford) | 自动化 Harness 搜索优化 |
| 12 | [GitHub/Agent-driven Development](https://github.blog/ai-and-ml/github-copilot/agent-driven-development-in-copilot-applied-science/) | Tyler McGoffin | 智能体驱动开发实战 |
| 13 | [Inside the Scaffold 论文](https://arxiv.org/html/2604.03515v1) | Benjamin Rombaut (Huawei) | 13 个编码智能体脚手架源代码分类法 |
| 14 | ⭐ [Eight years of wanting](https://lalitm.com/post/building-syntaqlite-ai/) | Lalit Maganti | AI 构建真实项目的坦诚复盘 |
| 15 | [Continual learning for AI agents](https://blog.langchain.com/continual-learning-for-ai-agents/) | Harrison Chase | 三层学习：模型/Harness/上下文 |
| 16 | [OpenAI Symphony](https://openai.com/index/open-source-codex-orchestration-symphony/) | Kotliarskyi 等 | 任务跟踪器作为控制平面 + SPEC/WORKFLOW 即产品 |
| 17 | [Claude Code Architecture](https://vrungta.substack.com/p/claude-code-architecture-reverse) | Vikash Rungta | Claude Code 运行外壳、TAOR 循环、工具原语、权限与上下文管理的外部逆向分析 |
| 18 | [Harness 系列文章之 7：关于 subagent](https://x.com/dongxi_nlp/status/2068922428516892998) | 马东锡 NLP | Subagent = tool call 入口 + child runtime；区分 session/context/subagent 与 evidence 回流 |
| 19 | [Fowler/Maintainability sensors](https://martinfowler.com/articles/sensors-for-coding-agents.html) | Birgitta Böckeler | 计算性 vs 推理性传感器谱系 + 失败案例 + AI 评审作为垃圾回收 |
| 20 | [Fowler/SPDD](https://martinfowler.com/articles/structured-prompt-driven/) | Wei Zhang, Jessie Jie Xia | REASONS Canvas 七维 + prompt 即一等交付物 + 双向闭环 |
| 21 | [LangChain/ADLC](https://www.langchain.com/blog/the-agent-development-lifecycle) | Harrison Chase | 智能体开发生命周期 + framework/runtime/harness 三分类 |
| 22 | [LangChain/Interpreters in Deep Agents](https://www.langchain.com/blog/give-your-agents-an-interpreter) | Hunter Lovell | interpreter 是第三类上下文表面 + 35% token 节省 |
| 23 | [Anthropic/质量回归复盘](https://www.anthropic.com/engineering/april-23-postmortem) | Anthropic 工程团队 | 三起独立变更叠加成质量退化 + 变更治理清单（第一手反例） |
| 24 | [Agentic Harness Engineering 论文](https://arxiv.org/html/2604.25850v4) | Jiahang Lin 等（复旦/北大/奇绩） | 可观测性驱动的 Harness 自动演化 + 每次编辑即可证伪契约 |
| 25 | [Overeager Coding Agents 论文](https://arxiv.org/html/2605.18583v1) | Yubin Qu 等 | 越界动作测量 + 提示声明授权反而降低边界推断 |
| 26 | [How I Use AI to Code](https://chrismdp.com/coding-with-ai/) | Chris Parsons | 四要素 Harness + 从批准者到训练者 + 反馈是新瓶颈 |
| 27 | [How we built LangSmith Engine](https://www.langchain.com/blog/how-we-built-langsmith-engine-our-agent-for-improving-agents) | Palash Shah | 用智能体改进智能体 + trace→轨迹骨架 + screener/investigator 两阶段闭环 |
| 28 | [Ralph 原始文章 + 续篇](https://ghuntley.com/ralph/) | Geoffrey Huntley | Ralph = bash 循环 + 每轮干净上下文 + 背压；单体反多智能体论（还上 practice/ Ralph Demo 的理论债） |
| 29 | [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey) | Mitchell Hashimoto | 六步采纳路线 + "harness engineering" 命名出处（由延伸阅读升格） |
| 30 | [Claude Code 源码泄漏事件](https://github.com/pankaj28843/understanding-claude-code) | Chaofan Shou 发现 / 社区聚合分析 | 512K 行 harness 实锤解剖：QueryEngine/60+ 门控工具/KAIROS/AutoDream，#17 推测的对照组 |
| 31 | [Agent Harness Engineering](https://addyosmani.com/blog/agent-harness-engineering/) | Addy Osmani | 学科汇流综合 + 约束加减法纪律 + hooks 分界论 + HaaS（综述破例进编号正文） |
| 32 | [Exploring AI coding sensors](https://www.thoughtworks.com/en-au/insights/blog/generative-ai/harness-engineering-agent-feedback-exploring-ai-coding-sensors) | Böckeler & Ford | 有/无传感器对照实验 + 态势感知论 + harness 模板展望 |
| 33 | [HarnessAudit 论文](https://arxiv.org/abs/2605.14271) | Chengzhi Liu 等 | harness 安全审计：中途轨迹违规是输出级评估的盲区 + 210 任务基准 |
| 34 | [Harness-Bench 论文](https://arxiv.org/abs/2605.27922) | Yilun Yao 等 | 配置级 harness 效应测量（106 任务/5194 轨迹）+ 执行对齐失败分类 |
| 35 | [How good is your harness? 论文](https://openreview.net/pdf/99eabc2ce65fd2871a253a0a57954c934ea9e6b0.pdf) | Jiwoo Han, Yuekai Sun | Terminal-Bench 2.0 榜单方差统计归因：harness 效应 ≈ 模型效应，且效应异质 |
| 36 | [Dynamic workflows in Claude Code](https://claude.com/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code) | Anthropic / Claude | 模型现场写自己的编排 harness + 对抗验证 + workflow 沉淀为 Skill |
| 37 | [Harness 才是产品](https://sotasync.com/reader/2026-06-09-dongxi-nlp-harness-is-the-product/) | 马东锡 NLP | "Model 在 loop 里，harness 拥有 loop" + 六组件 + 症状→组件 debug 对照表 |
| 38 | [Position: 基准错位论文](https://arxiv.org/abs/2606.17799) | Maria I. Gorinova 等 | 基准把 model/harness/环境折叠进一个分数的三症状诊断 |

### 脉络二：云原生 Harness.io（2 篇）

| # | 文章 | 核心贡献 |
|---|------|---------|
| 39 | [Harness.io 官方](https://www.harness.io/blog/understanding-ci-cd-platforms-the-backbone-of-modern-devops) | CI/CD 平台全局架构 |
| 40 | [Google Cloud Architecture](https://docs.cloud.google.com/architecture/partners/harness-cicd-pipeline-for-rag-app) | Harness + GCP 部署 RAG |

### 脉络三：效率悖论与能力进化（2 篇）

| # | 文章 | 核心贡献 |
|---|------|---------|
| 41 | [YDD / Miss-you](https://yousali.com/posts/20260303-ai-coding-efficiency-to-evolution/) | 效率悖论的系统性拆解：约束理论 + Spec/Rule/Skill + 验证闭环 + 并发 |
| 42 | [METR 实验后续 + 自报调查](https://metr.org/blog/2026-02-24-uplift-update/) | METR | "慢 19%" 的官方后续：弱证据转向加速 + AI 渗透破坏 RCT 可行性本身 |
