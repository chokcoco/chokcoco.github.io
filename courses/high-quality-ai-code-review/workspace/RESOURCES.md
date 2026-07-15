# Resources：如何实现高质量的 AI Code Review

状态：来源包 v0.3。第 4–5 章采用课程案例材料优先策略，公开来源只作必要补充。

## 来源政策

事实优先级暂定为：

1. 当前 `qms-server` 代码：实现事实源。
2. 数据库模型、配置和运行逻辑：当前口径与状态定义的事实源。
3. 用户提供的方案、指标和远端服务文档：设计动机、实验过程与历史演进的事实源。
4. 两份内部分享：用于教学叙事、关键图示和阶段性数据；数字进入正文前必须确认可披露性与统计口径。
5. 公开论文、官方文档和一手工程博客：用于补充 Code Review 发展、LLM 长上下文、软件工程评估和 AI Code Review 最佳实践。

设计文档与当前代码冲突时，不静默合并。课程要明确标注“设计/实验基线”“历史实现”“当前默认配置”和“可能由数据库热配置覆盖的运行值”。

## 用户提供的核心材料

| 来源 | 类型/规模 | 主要用途 | 限制与核验项 |
| --- | --- | --- | --- |
| `qms-server/DESCERPTION.md` | 仓库说明 | 建立系统边界、模块地图和业务背景 | 仅抽取 CR Shift-Left 相关内容 |
| `qms-server/app/service/cr-shift-left/**` | 当前代码 | Setup、Processor、批次、验证、扩展检查、记忆、指标、远端执行 | 实现事实源；学生是否可见待确认 |
| `qms-server/app/service/cr-shift-left-mcp/**` | 当前代码 | MCP 工具边界、下发任务与提交结果 | 真实工具名是否可公开待确认 |
| `qms-server/app/schedule/cr-shift-left-unified-executor.ts` | 当前代码 | 远端异步执行、并发、CAS 认领、恢复与监控 | 运行参数可能受环境变量覆盖 |
| `qms-server/app/model/sls/crShiftLeft*.ts`、`crMemoryRule.ts` | 当前代码 | Session/Batch/File/Issue/PendingTask/Bug/Memory 数据模型 | 表名是否可公开待确认 |
| `[方案] 当 AI 开始_偷懒_：一次对抗 AI 架构限制的工程实践.pdf` | PDF，43 页 | 核心问题、三次失败尝试、Planner + 状态机 + Harness、质量门 | 路线图部分是历史设计；阈值不等于当前默认值 |
| `AI CR 评估工程.pdf` | PDF，36 页 | 采纳率、召回率、Bug 归因、评估工程和统计偏差 | 指标枚举与当前代码存在版本差异 |
| `IBS AI CR 远端云服务.pdf` | PDF，41 页 | 本地/远端对比、容器、Mirror + Worktree、调度、并发、去重、回调 | 含内部域名、平台限制和压测数据 |
| `IBS_AI_CR_TO_FE.pptx` | PPT，33 页 | 面向研发的完整叙事、规则、偷懒实验、流程卡点、指标闭环 | 包含内部团队与真实指标，需确认披露 |
| `IBS_AI_CR_TO_ALL.pptx` | PPT，12 页 | 管理层/全员版核心概览、采纳率/召回率架构、远端接入 | 包含平台名称、成本和阶段目标 |
| `assets/aicr/new_ibs_ai_cr.md` | Markdown | PPT 文字版，便于检索 | 与 `markitdown/ppts/new_ibs_ai_cr.md` 内容相同 |
| `markitdown/ppts/new_ibs_ai_cr.md` | Markdown | PPT 文字版 | SHA-1 与上项一致，不重复计作独立证据 |

## 补充案例数据

三份工作簿仅用于作者侧归类和构造教学样本。学生正文不复制业务标识、代码路径或原始描述，不把样本量推广为生产总体分布。

| 来源 | 已核验内容 | 第 1–3 章用途 | 使用限制 |
| --- | --- | --- | --- |
| `AICR-业务测试集 - 问题列表（FE）.xlsx` | 18 条已采纳问题；规范 10、健壮性 6、可维护性 2；3/4/5 分分别为 11/5/2 | 第 1 章问题类型分类；第 3 章采纳率教学样本 | 仅代表给定测试集，不代表前端问题总体分布 |
| `AICR - 业务测试集 - 问题列表（BE）.xlsx` | 16 条已采纳问题；健壮性 14、规范 2；4/5 分分别为 5/11 | 第 1 章静态规则、AI 与人工边界；第 3 章高分有效问题样本 | 对 goroutine、错误变量等案例做等价脱敏改写 |
| `AICR 部分 Bad Case 和未采纳 Case.xlsx` | 44 条拒绝问题；健壮性 43、安全 1；常见原因包括场景不存在、已有处理、业务约束、组件推荐写法与修复建议不可用 | 第 3 章用混合状态样本解释分母与误报；第 4 章继续做低采纳归因 | 这是定向收集的拒绝集，不能与前两份直接拼成无偏采样的总体采纳率 |

## 已审阅的关键代码地图

### 本地审查主链

- `setup.ts`：创建 Session、文件过滤、内容哈希、历史文件级复用、批次生成。
- `processor.ts`：以 `allowed_next_step` 驱动 `0 → 1 → 2 → 2.x → 3`。
- `batchAllocator.ts`：语义分组、工作量拆分/合并、去重和完整性校验。
- `promptBuilder.ts`：把状态、批次、规则、上下文和下一步要求组装成链式提示。
- `verifier.ts`：时间、问题密度、字段完整性、内容长度和高风险建议检查。
- `extensionChecker.ts`：recheck、memory_neg、yapi、td、memory_pos、filter、fix 的条件化执行。
- `filterChecker.ts`、`memoryChecker.ts`、`memoryDistiller.ts`：过滤、长期记忆与规则蒸馏。
- `adoptionChecker.ts`、`utils/adoption-status.ts`：自动采纳检测和状态枚举。
- `crAnalytics.ts`、`bugSync.ts`、`mrCoverage.ts`：采纳率、召回率、Bug 与覆盖率统计。

### MCP 与远端服务主链

- `cr-shift-left-mcp/tools/batch-review-tool.ts`：获取当前批次审查任务。
- `cr-shift-left-mcp/tools/post-batch-results-tool.ts`：提交审查或扩展检查结果。
- `cr-shift-left-mcp/index.ts`：MCP 服务入口和工具注册。
- `controller/crShiftLeft.ts`：标准化入口、参数校验、任务去重/复用、外部任务字段和响应。
- `ibsCrExecutor.ts`：Mirror、Worktree、CLI 执行、Session 复用、清理和失败回调。
- `cr-shift-left-unified-executor.ts`：DB 轮询、p-limit、软认领、同仓库分支串行、恢复和完整流水线。
- `externalCallback.ts`：processing/completed/failed/no-change 的外部回传。
- `server-monitor/cr-metrics-collector.ts`、`review-pipeline-monitor.ts`：队列、阶段耗时和失败观测。

## 关键图示来源与重绘计划

内部图只作为信息来源。学生版优先重绘为 Mermaid、SVG 或 HTML/CSS 原生图，并删除内部标识。

| 图示 | 主要来源 | 计划用途 |
| --- | --- | --- |
| Code Review 演进时间线 | 两份 PPT | 第 1 章，人工 CR → 静态规则 → 远端 AI → 本地上下文 → Harness → 数据闭环 |
| Planner–Server–MCP–Agent 分层 | FE PPT 14–15 页、核心方案 PDF | 第 2 章，解释职责边界和请求链 |
| 状态机与验证回路 | 核心方案 PDF、当前 `processor.ts` | 第 2/6/7 章，必须以当前状态值重绘 |
| 采纳率/召回率指标树 | 评估 PDF、FE PPT 31 页 | 第 3 章，展示分子、分母和排除项 |
| 采纳率提升架构 | ALL PPT 4、6 页 | 第 4–5 章，规则、上下文、recheck、黑名单记忆 |
| 大任务衰减与三次失败 | 核心方案 PDF、FE PPT 18–22 页 | 第 6 章，现象—假设—实验—结论 |
| 批次分配与质量门 | `batchAllocator.ts`、`verifier.ts` | 第 7 章，算法与失败路径 |
| 数据回流闭环 | FE PPT 31 页、Memory 代码 | 第 7 章，Good/Bad/Missed Case 到规则与测试集 |
| 本地与远端架构对比 | 远端服务 PDF 4–5 页 | 第 8 章，环境、触发、执行和回调差异 |
| Mirror + Worktree | 远端服务 PDF 13–15 页、`ibsCrExecutor.ts` | 第 8 章，仓库缓存和并发隔离 |
| 远端异步队列与可观测链 | ALL PPT 9 页、UnifiedExecutor 代码 | 第 8 章，触发—入队—准备—审查—回传 |

## 已核验的公开来源

访问日期均为 2026-07-15。论文用 DOI、会议页面或 arXiv 原始条目核验；产品能力只描述访问当日官方文档中的行为，不外推未来版本。

| 标题 | 作者/机构与日期 | URL | 适用章节 | 可支持的断言与限制 |
| --- | --- | --- | --- | --- |
| Expectations, outcomes, and challenges of modern code review | Alberto Bacchelli、Christian Bird；ICSE 2013 | https://doi.org/10.1109/ICSE.2013.6606617 | 1 | 现代代码审查同时服务缺陷发现、代码改进、知识传递与协作；研究对象和年代决定其不能直接证明 LLM 时代的效果 |
| The impact of code review coverage and code review participation on software quality | Shane McIntosh 等；MSR 2014 | https://doi.org/10.1145/2597073.2597076 | 1、3 | 审查覆盖和参与度与软件质量存在经验关联；正文避免写成单一因果定律 |
| The Standard of Code Review / What to look for in a code review | Google Engineering Practices；持续维护 | https://google.github.io/eng-practices/review/reviewer/standard.html；https://google.github.io/eng-practices/review/reviewer/looking-for.html | 1 | 审查目标是让代码库持续改善；设计、功能、复杂度、测试、命名、注释、风格和文档均在审查范围内；这是工程准则而非效果实验 |
| Automating Code Review Activities by Large-Scale Pre-training | Zhiyu Li 等；ESEC/FSE 2022 | https://arxiv.org/abs/2203.09095 | 1 | CodeReviewer 把质量估计、评论生成、代码修复作为三个任务；论文模型与今天的通用 LLM 产品不能等同 |
| Combining Large Language Models with Static Analyzers for Code Review Generation | Imen Jaoua 等；MSR 2025 | https://arxiv.org/abs/2502.06633 | 1、3 | 规则/静态分析与学习系统可以互补；实验结果受数据集、模型和组合策略约束 |
| BitsAI-CR: Automated Code Review via LLM in Practice | Tao Sun 等；2025 | https://arxiv.org/abs/2501.15134 | 1、3、4、5 | 工业系统采用 RuleChecker、ReviewFilter、规则分类、反馈飞轮与指标；论文中的 75% precision、WAU 等数字不移植为本课程案例数据 |
| CodeReviewQA: The Code Review Comprehension Assessment for Large Language Models | Hong Yi Lin 等；Findings of ACL 2025 | https://arxiv.org/abs/2503.16167 | 1、3 | 将评论理解拆成变更类型识别、定位与方案识别，说明只看生成文本匹配不足以定位失败；900 样本、72 模型属于该基准条件 |
| Automated Code Review Using Large Language Models at Ericsson: An Experience Report | Shweta Ramesh 等；ICSME 2025 | https://arxiv.org/abs/2507.19115 | 1 | 工业实践把 LLM 与静态程序分析结合，并由有经验开发者做初步评估；只作经验佐证 |
| About / Using GitHub Copilot code review | GitHub Docs；访问日版本 | https://docs.github.com/en/copilot/concepts/agents/code-review；https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review | 1、2 | 官方产品已支持 PR/本地变更、仓库上下文、自定义指令、MCP 与反馈；官方明确“不保证发现所有问题”，应仔细验证并补充人工审查 |
| GitLab Duo in merge requests | GitLab Docs；访问日版本 | https://docs.gitlab.com/user/project/merge_requests/duo_in_merge_requests/ | 1、2、8 | 官方区分单次、面向 Diff 的非 agentic 审查与可读取仓库/跨文件依赖、执行多步推理的 Code Review Flow；产品状态和套餐会变化 |
| Building effective agents | Anthropic；2024-12-19 | https://www.anthropic.com/engineering/building-effective-agents | 2 | 区分预定义代码路径的 workflow 与模型动态控制过程的 agent；编排者-工作者和评价者-优化者模式为 Harness 讲解提供公共参照，不证明某一实现最优 |
| Architecture — Model Context Protocol | MCP 官方规范 2025-06-18 | https://modelcontextprotocol.io/specification/2025-06-18/architecture | 2、8 | Host–Client–Server、1:1 client/server 会话、tools/resources/prompts 与能力协商；课程案例中的 Server/MCP 仍需以代码事实为准 |
| Model evaluation: precision, recall and F-measures | scikit-learn 官方文档；访问日稳定版 | https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-and-f-measures | 3 | Precision、Recall、Fβ 的数学定义与平均方式边界；业务“采纳率”只是映射到 precision 的工程代理，不能把两者无条件等同 |
| Lost in the Middle: How Language Models Use Long Contexts | Nelson F. Liu 等；TACL 2023 | https://arxiv.org/abs/2307.03172 | 2、6 | 相关信息位置变化会显著影响长上下文任务表现；不能支持固定的上下文占比阈值，也不是代码审查专门实验 |
| git-worktree | Git 官方文档；访问日版本 | https://git-scm.com/docs/git-worktree | 8 | 一个仓库可附加多个工作树，为远端并发隔离提供基础语义；具体 Mirror + Worktree 方案仍以课程案例代码为准 |

### 外链原样登记

以下地址逐行登记，供确定性质检与学生参考文献交叉核对：

- https://doi.org/10.1109/ICSE.2013.6606617
- https://doi.org/10.1145/2597073.2597076
- https://google.github.io/eng-practices/review/reviewer/standard.html
- https://google.github.io/eng-practices/review/reviewer/looking-for.html
- https://arxiv.org/abs/2203.09095
- https://arxiv.org/abs/2502.06633
- https://arxiv.org/abs/2501.15134
- https://arxiv.org/abs/2503.16167
- https://arxiv.org/abs/2507.19115
- https://docs.github.com/en/copilot/concepts/agents/code-review
- https://docs.github.com/en/copilot/how-tos/use-copilot-agents/request-a-code-review/use-code-review
- https://docs.gitlab.com/user/project/merge_requests/duo_in_merge_requests/
- https://www.anthropic.com/engineering/building-effective-agents
- https://modelcontextprotocol.io/specification/2025-06-18/architecture
- https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-and-f-measures
- https://arxiv.org/abs/2307.03172
- https://git-scm.com/docs/git-worktree

## 暂不进入学生正文的材料

- 内部域名、邮箱、人员、团队组织、账号和生产配置。
- 无法复算或缺少样本窗口的业务数字。
- 方案文档中的“待开始”路线图状态。
- 仅由旧文档支持、已被当前代码改变的状态枚举和指标分母。

## 第 4–5 章来源选择

第 4–5 章的主证据按以下顺序使用：

1. 44 条 Bad Case 与未采纳样本，用于建立“场景不存在、已有处理、业务约束、组件契约、建议不可执行、重复建议”等诊断类型。
2. FE/ALL 分享中的采纳率提升结构，用于建立“规则、上下文、复核、反馈回流”的演进路线；分享中的阶段指标不进入正文。
3. 当前代码，用于确认规则装配、Diff 范围校验、Recheck、负向记忆、历史过滤和自动采纳检测的真实行为与开关边界。
4. FE/BE 已采纳测试集，用于和拒绝样本做受控对照；不把三份定向样本拼成总体采纳率。

本批不新增学生可见的外部论文引用。第 4–5 章章末只说明代码观察范围和教学样本边界，不暴露内部材料文件名。
