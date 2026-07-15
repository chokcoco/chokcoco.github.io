# Claim–Source Map：AI Code Review 课程

状态：第 1–5 章断言映射 v0.3。用于作者侧事实审校，不进入学生导航。

## 事实分层

- `CODE`：当前代码直接支持。
- `DESIGN`：方案或技术设计支持，但不保证当前默认启用。
- `HISTORICAL`：分享或旧文档中的阶段数据/口径。
- `INFERENCE`：由多项证据形成的教学解释，正文需明确限定。
- `PUBLIC-TODO`：需要公开一手来源补充。

## 关键断言

| ID | 拟用断言 | 层级 | 直接来源 | 使用限制 |
| --- | --- | --- | --- | --- |
| C01 | 审查流程由 `allowed_next_step` 驱动，主链为 0、1、2、2.x、3 | CODE | `processor.ts`、`crShiftLeftSession.ts` | 不用旧方案中的简化三步替代当前状态 |
| C02 | Setup 负责 Session、文件过滤、内容哈希、历史文件级复用和批次创建 | CODE | `setup.ts`、`batchAllocator.ts` | 远端复用受模式和历史状态影响 |
| C03 | 批次分配包含语义分组、工作量拆分/合并、去重与完整性校验 | CODE | `batchAllocator.ts` | 算法不是通用最优分区 |
| C04 | 当前实现主要把批次控制在约 800–1200 diff 行 | CODE/DESIGN | `utils/config.ts`、`batchAllocator.ts` | 方案/PPT 中亦出现 800–1500，需标版本 |
| C05 | 验证包含耗时、问题密度、字段、描述长度和高风险代码建议等检查 | CODE | `verifier.ts` | 是否生效取决于配置 |
| C06 | 默认兜底配置中多个防偷懒阈值被设为 0 或近似关闭值 | CODE | `utils/config.ts`：`minTimeCoefficient=0`、`minDensityCoefficient=0`、`highRiskScoreThreshold=999`、`minContentLength=0` | 数据库热配置可能覆盖，不能说生产环境一定关闭 |
| C07 | 扩展检查按 recheck、memory_neg、yapi、td、memory_pos、filter、fix 编排 | CODE | `extensionChecker.ts` | 实际执行取决于模式、批次、Jira/TD 和开关 |
| C08 | 记忆蒸馏支持 negative、positive 和 missed 三类反馈 | CODE | `memoryDistiller.ts`、`memoryChecker.ts`、`crMemoryRule.ts` | 具体启用条件需随代码说明 |
| C09 | 采纳状态包括人工、自动、Feature Flow、无法判断和部分采纳多个区间 | CODE | `crShiftLeftIssue.ts`、`adoption-status.ts` | 旧 PDF 的 4/5 状态说明已过时 |
| C10 | 当前正式采纳率只纳入人工/Feature Flow 的 1、4、0、5，且只统计有效、4–5 分问题 | CODE | `crAnalytics.ts` | 自动 2/3 与部分采纳 60–69 当前不进入正式分母 |
| C11 | 自动采纳检测对建议与最终文件做去注释/空行后的行级 LCS，100% 才判完全采纳 | CODE | `adoptionChecker.ts` | 不是语义等价检测；短片段有冲撞处理 |
| C12 | 当前召回率分母包含 AI 已采纳、人工 CR 已采纳和应召回 Bug，并另有不含 Bug 的纯 CR 口径 | CODE | `crAnalytics.ts` | 正文必须说清所用口径 |
| C13 | Bug 召回统计只纳入 `should_recall` 且 owner_role 为 FE/BE | CODE | `bugSync.ts`、`crAnalytics.ts` | PM/unknown 被排除，存在归属偏差 |
| C14 | 评估材料中可归属 FE/BE 的应召回 Bug 约占 80.3% | HISTORICAL | `AI CR 评估工程.pdf` | 需确认样本期、可披露性，不推广为长期比例 |
| C15 | 约 200 文件、约 1.6 万行任务暴露了长任务后段输出衰减 | DESIGN/HISTORICAL | 核心方案 PDF、FE PPT | 是内部案例观察，不直接证明所有模型的统一阈值 |
| C16 | 单纯加强 Prompt、让 AI 自管流程和人工多对话拆分都未解决完整工程问题 | HISTORICAL/INFERENCE | 核心方案 PDF、FE PPT 19 页 | 说明实验条件，不写成普适定理 |
| C17 | 外部 Planner/状态机/Harness 把流程控制与审查执行分离 | CODE/DESIGN | 核心方案 PDF、`processor.ts`、MCP 工具 | 课程的主架构结论 |
| C18 | 远端服务采用同步接入、异步执行和环境解耦 | DESIGN/CODE | 远端服务 PDF、Controller、UnifiedExecutor | 当前代码已从旧双定时任务演进到统一执行器 |
| C19 | 远端 Git 工作区使用 Mirror + Worktree 复用对象并隔离分支任务 | CODE | `ibsCrExecutor.ts` | 持久化能力受部署环境影响 |
| C20 | UnifiedExecutor 通过 DB 轮询、p-limit、软认领、同 repo+branch 串行和恢复逻辑执行任务 | CODE | `cr-shift-left-unified-executor.ts` | 默认并发可被环境变量覆盖 |
| C21 | content_hash 和 Session 状态用于重复任务/结果复用 | CODE | Controller、`setup.ts`、`ibsCrExecutor.ts` | MR 与 Repo 模式的 hash 输入不同 |
| C22 | 远端结果通过 processing/completed/failed/no-change 回调外部系统 | CODE | `externalCallback.ts`、Controller、`ibsCrExecutor.ts` | 外部协议字段需脱敏或确认公开 |
| C23 | 内部分享报告采纳率从约 10%/30% 演进到约 60%/80%，并给出召回率和成本改善数据 | HISTORICAL | 两份 PPT | 未确认样本、时间窗和披露前不进入学生正文 |
| C24 | 现代 Code Review 同时服务代码改进、缺陷发现、知识传递与协作，而非只找 Bug | PUBLIC | Bacchelli & Bird 2013；Google Engineering Practices | 论文与工程准则证据类型不同；不把知识传递说成 AI 可完全替代的职责 |
| C25 | 审查覆盖与参与度和软件质量存在经验关联 | PUBLIC | McIntosh et al. 2014 | 使用“关联/经验结果”，不写成单一因果关系 |
| C26 | 公开研究已把自动代码审查拆成质量估计、评论生成与代码修复等不同任务 | PUBLIC | Li et al. 2022 | 说明任务边界，不把专用预训练模型结果直接外推到通用 LLM |
| C27 | 静态/规则分析与 LLM 审查是可组合的互补手段 | PUBLIC | Jaoua et al. 2025；Ericsson 经验报告 2025；BitsAI-CR 2025 | 只说明架构方向和实验观察，不复用论文数字作为本课程生产数据 |
| C28 | 当前官方 AI CR 产品已经覆盖 PR、本地变更、仓库上下文、自定义规则、反馈及 agentic 流程，但仍要求人工验证 | PUBLIC | GitHub Copilot Code Review；GitLab Duo 官方文档 | 产品能力随版本变化；访问日期 2026-07-15 |
| C29 | workflow 通过预定义代码路径编排模型与工具；agent 由模型动态决定过程与工具使用 | PUBLIC | Anthropic, Building effective agents | 用于第 2 章术语校准，不把二分法当唯一行业定义 |
| C30 | MCP 官方架构是 Host–Client–Server；每个 client 与特定 server 保持 1:1 有状态会话，server 暴露 tools/resources/prompts | PUBLIC | MCP Architecture 2025-06-18 | `qms-server` 中的具体工具与状态推进仍以 CODE 为准 |
| C31 | Precision=TP/(TP+FP)，Recall=TP/(TP+FN)，F1 是二者调和平均 | PUBLIC | scikit-learn Model evaluation | 先给通用定义，再明确课程案例对 TP/FP/FN 的业务映射 |
| C32 | 长上下文模型对信息位置的利用可能不稳定 | PUBLIC | Liu et al. 2023, Lost in the Middle | 不用于证明固定 20%–50% 阈值，也不直接证明代码审查后段衰减 |
| C33 | 三份补充工作簿分别包含 34 条已采纳问题与 44 条定向收集的拒绝问题 | PRIVATE-DATA | FE/BE 测试集、Bad Case 工作簿 | 只能构造明确标注的教学样本；拒绝集是定向样本，不能直接计算总体采纳率 |
| C34 | 当前审查提示同时装配角色基础规则、数据库中的 system_prompt 规则与仓库级 Cursor Rules | CODE | `promptBuilder.ts`、`memoryDistiller.ts` | 三层来源缺一时系统仍可能运行；不把规则存在等同于规则已校准 |
| C35 | Recheck 会按 changed/context/out-of-diff/unknown 判断问题与本次变更的关系，并要求读取仓库上下文验证过度防御、场景误判和已有保护 | CODE | `promptBuilder.buildRecheckPrompt`、`extensionChecker.processRecheckResults` | Recheck 仍由模型判断，不是真值；结果写入 `is_valid` 与原因 |
| C36 | 负向记忆从用户拒绝或 Recheck 无效信号中按项目/用户范围提炼规则，只有活跃、已确认且未过期规则会被加载 | CODE | `memoryDistiller.ts`、`memoryChecker.ts`、`crMemoryRule.ts` | 用户拒绝源会自动确认；Recheck 源默认 pending；需防个人偏好外溢 |
| C37 | 兜底扩展检查配置当前启用 recheck/filter/yapi/td/fix，不默认启用 memory_neg；记忆提炼默认源为 user_reject 与 bug | CODE | `utils/config.ts`、`memoryDistiller.ts` | 数据库或调用参数可能覆盖兜底值；不能写成生产环境固定行为 |
| C38 | 远端最终 filter 对同一需求历史问题做重复、冲突、重叠与已修复判断，只在最后一批执行 | CODE | `filterChecker.ts`、`extensionChecker.ts`、`promptBuilder.buildFilterPrompt` | 当前代码限制为 remote session；不是每个本地审查都会执行 |
| C39 | 自动采纳检测先移除空行/注释并压缩空白，再做行级 LCS；100% 才算明确采纳，部分匹配进入 60–69 | CODE | `adoptionChecker.ts`、`adoption-status.ts` | 不是语义等价检测；正式指标暂不纳入自动与部分状态 |
| C40 | 不超过 3 行的建议若和最终文件发生匹配但原代码仍存在，会触发短代码冲撞并按未采纳处理 | CODE | `adoptionChecker.checkIssueAdoptionByLCS` | 这是降低假阳性的启发式，仍可能漏掉等价改写 |
| C41 | 44 条拒绝样本几乎全部属于健壮性建议，常见拒绝证据包括场景不成立、已有处理、类型/注解/组件契约保证、业务语义不同和修复不可用 | PRIVATE-DATA/INFERENCE | Bad Case 工作簿逐条复核 | 定向样本只用于构造根因树，不表示生产总体分布 |

## 已识别的冲突与处理

### 方案阈值与当前默认配置

方案材料展示了耗时、密度、内容长度和高风险问题建议等质量门。当前 `utils/config.ts` 的兜底值却可能让这些门不触发。课程处理方式：先教设计目标，再展示当前默认值，最后说明运行时可能由数据库热配置覆盖；不把三者合成一个结论。

### 采纳状态的历史演进

旧评估文档把 4/5 解释为无法判断/仅注释，当前模型把 4/5 用于 Feature Flow，无法判断迁移到 50–53，部分采纳为 60–69。课程以代码为当前事实，并用时间线解释指标口径为什么必须版本化。

### 采纳率的“自动”口径

设计材料曾把自动采纳纳入采纳率叙事，当前统计代码的正式分母只包含 0/1/4/5。课程会分别展示“检测能力”和“正式统计能力”，不声称自动识别已进入正式指标。

### 远端调度架构演进

远端 PDF 描述“克隆任务 + 审查任务”两个定时器；当前 UnifiedExecutor 注释说明已合并为单一流水线，且审查 CLI 内含 Agent 执行。课程以当前实现为主，将双定时任务作为演进与权衡案例。
