# Harness Engineering 断言—来源映射

状态：内部创作与审校文件，不进入学生页面。

## 第 1 章

| 学生内容中的断言 | 来源 | 使用边界 |
| --- | --- | --- |
| OpenAI 于 2026 年 2 月公开 agent-first 产品实验 | OpenAI Harness Engineering，2026-02-11 | 保留实验语境，不外推企业普遍收益 |
| 团队工作转向环境、意图和反馈回路 | OpenAI Harness Engineering | 可作为 Harness Engineering 的问题背景 |
| 大型 AGENTS.md 改为短入口与结构化文档 | OpenAI Harness Engineering | 属于 OpenAI 仓库实践，不写成通用强制结构 |
| 架构约束可进入 lint 与结构测试 | OpenAI Harness Engineering | 可提炼为机械约束原则 |
| 存量仓库需要 facts、边界、新鲜度与可靠停止 | Repo Harness 介绍；Repo Harness 设计与可行性分析 | 只用于案例设计，不在学生正文或参考文献披露材料名称 |

## 第 2 章

| 学生内容中的断言 | 来源 | 使用边界 |
| --- | --- | --- |
| agent loop 在模型调用与工具调用之间循环 | OpenAI Unrolling the Codex agent loop，2026-01-23 | 作为 Codex 的公开解释，并抽象为课程工作模型 |
| 对话增长会占用上下文窗口，Codex 支持压缩 | OpenAI Unrolling the Codex agent loop | 产品行为可能变化，发布前复核 |
| Codex harness 包含 thread、配置认证、沙箱工具与扩展 | OpenAI Unlocking the Codex harness，2026-02-04 | 明确是 Codex 产品案例，不写成所有 harness 的固定组件 |
| App Server 用双向协议向客户端暴露 harness | OpenAI Unlocking the Codex harness | 不要求学习者采用同一协议 |

## 第 3–5 章

| 学生内容中的断言 | 来源 | 使用边界 |
| --- | --- | --- |
| 任务需要目标、边界、验收与停止条件 | OpenAI Harness Engineering；OpenAI Evals | 课程综合框架，不宣称为唯一行业 schema |
| 优惠分商品级、订单级和运费级并受组合策略控制 | Shopify DiscountCombinesWith | 星桥商城采用简化策略，不复制 Shopify API |
| 仓库知识宜使用短入口、结构化文档与机械约束 | OpenAI Harness Engineering；ARCHITECTURE.md | 结合课程案例解释，不要求固定文件结构 |
| facts、来源、新鲜度和 reliable stop 支撑存量定位 | 内部企业材料 | 只保留通用抽象，内部材料身份不进入学生内容 |

## 第 6–8 章

| 学生内容中的断言 | 来源 | 使用边界 |
| --- | --- | --- |
| React 19.2、Vite 8.1、Spring Boot 4.1 为当前稳定选择 | React、Vite、Spring 官方发布与文档，2026-07-10 核验 | 版本会变化，发布前复核 |
| 电商库存预占包含 reserve、claim、多仓和一致性问题 | Shopify Engineering 库存预占文章，2026-05-12 | 不复制其数据库方案和规模数字 |
| 幂等键支持不确定网络结果下的安全重试 | Stripe Idempotency；Amazon Builders' Library | 课程为内存教学实现，不外推 exactly-once 保证 |
| hooks 可在智能体生命周期执行验证与策略 | GitHub Copilot hooks | 只提炼闸门原则，不要求使用 GitHub 配置格式 |

## 第 9–11 章

| 学生内容中的断言 | 来源 | 使用边界 |
| --- | --- | --- |
| 多轮智能体评测需要观察过程与回归 | OpenAI Evals；Anthropic Agent Evals | 课程评价表为教学设计，不是厂商基准 |
| 长任务需要进度、干净状态和跨上下文交接 | Anthropic Long-running Agents；OpenAI Long Horizon | 具体文件结构属于课程示例 |
| 高自治需要状态机、隔离、恢复和人类注意力管理 | OpenAI Symphony；Anthropic Managed Agents | 不把早期效率数字写入正文 |
| 并行智能体需要任务锁、隔离和集成验证 | Anthropic C compiler agent teams | 不宣称多智能体普遍优于单智能体 |

## 第 12–13 章

| 学生内容中的断言 | 来源 | 使用边界 |
| --- | --- | --- |
| 智能体会复制仓库坏模式，需要黄金原则和持续清理 | OpenAI Harness Engineering | 课程将其转为四条可检查原则 |
| harness、提示和上下文变化需要回归治理 | Anthropic quality postmortem | 不推断未公开的产品内部细节 |
| 任务可靠性随难度和时长变化 | METR time horizons | 不把 50% time horizon 当实际连续运行时长 |
| 综合实践的任务、知识、边界、反馈、状态与治理 | 全课程已批准来源 | 评价表是课程验收工具，不是行业认证 |
