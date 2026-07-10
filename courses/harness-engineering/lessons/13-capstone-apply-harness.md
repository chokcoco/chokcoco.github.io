# 第 13 章　怎样把 Harness 用到自己的仓库？

> 预计学习时间：90–120 分钟  
> 一句话总结：综合实践要求你用任务契约、仓库知识、边界、验证、状态和复盘证明一项工作可执行、可检查、可恢复，而不只是交出一份代码 diff。

## 选择一条路径

两条路径使用同一套评价标准，编程深度不同。

| 路径 | 适合方式 | 最终交付 |
| --- | --- | --- |
| A：Harness 设计 | 不要求运行完整代码 | 任务契约、仓库地图、工具与权限、反馈回路、状态卡和复盘 |
| B：Harness 工程 | 运行 Node/React，可选 Java | 上述设计包，加验证脚本、测试、构建结果和最小实现 |

你可以改造 `starter/` 的优惠叠加，也可以用 `greenfield/` 建库存预占。不要两项都做。90–120 分钟内把一条闭环做完整，比留下两个半成品更有学习价值。

## 开始前保存基线

存量路径：

```bash
cd courses/harness-engineering/labs/commerce-harness-lab/starter
node scripts/audit-baseline.mjs
node --test packages/promotion-engine/test/*.test.js
```

新仓库路径先确认：

```text
greenfield/AGENTS.md
greenfield/docs/architecture.md
greenfield/specs/inventory-reservation.md
```

保存命令、退出码和失败摘要。Java 环境不可用时，在计划里明确写出，不得把未执行的 Maven 测试记为通过。

## 第一步：写一份能阻止错误的任务契约

契约至少包含：

- 用户结果和非目标。
- 允许、notice、approval 与 blocked 范围。
- 四条业务不变量。
- 五个验收样本，其中两个是失败或重试边界。
- 失败处理与可靠停止。

写完后问自己：如果智能体准备修改范围外共享代码，契约能否让它停下来？如果测试全绿但 Java 未运行，契约会不会允许完成？

## 第二步：建立任务 Context Pack

不要总结整个仓库。列出当前任务的：

| 项目 | 必填内容 |
| --- | --- |
| 任务 | 契约路径和版本 |
| 事实 | 架构、业务规则与来源 |
| 入口 | 两到五个代码或接口入口 |
| 验证 | 从局部到整体的命令 |
| 边界 | 路径级别和人工闸门 |
| 状态 | 进度文件和恢复入口 |

每条事实写明新鲜度。发现冲突时先解决或停止，不把两个说法一起塞给智能体。

## 第三步：先制造可观察失败

优惠路径已有一条失败 Node 测试。工程路径应先确认它确实失败，再修改实现。

库存路径至少先写：

```java
@Test
void repeatedRequestReturnsTheFirstReservation() {
    var first = service.reserve(request("checkout-781", 1));
    var second = service.reserve(request("checkout-781", 1));

    assertThat(second.id()).isEqualTo(first.id());
    assertThat(service.available("SKU-RED-CHAIR")).isEqualTo(1);
}
```

还要补同键不同数量的冲突测试。没有失败基线，后面的绿色结果无法证明功能真的被修复。

## 第四步：做最小实现

存量优惠路径只需要修纯促销规则，再对齐 Java 报价和 React 明细。不要顺手重构两个应用。

库存路径可以先用内存存储：按幂等键保存请求摘要和第一次结果；状态转换检查当前状态；重复终态操作返回原结果。课程不要求生产数据库或分布式锁。

每完成一个小单元就运行最小相关测试。失败信息进入进度文件，不能只留在终端滚动区。

## 第五步：运行分层验证

建议顺序：

```text
1. 结构与策略检查
2. 纯 JavaScript 业务测试
3. React 应用构建
4. Java 单元与接口测试
5. 跨语言验收样本
6. 页面或 API 冒烟检查
7. 完成条件和风险审校
```

工程路径至少完成前三项。选择 Java 实现时必须完成第四项；如果本机环境缺失，任务状态保持 manual review 或 blocked，不得伪造结果。

## 第六步：准备证据包

最终证据包包含：

```text
task-contract.md
context-pack.md
change-plan.md
progress.md
test-results.md
risk-and-approval.md
retrospective.md
```

`test-results.md` 记录命令、运行目录、环境版本、退出码、关键结果和时间。截图可以补充页面证据，但不能替代可重复命令。

## 第七步：做一次独立审校

让 checker 只读取任务契约、diff 和证据包，回答：

1. 是否覆盖全部验收场景？
2. 是否出现范围外修改？
3. 是否有未批准的公共接口或依赖变化？
4. 运行结果能否复现？
5. 未覆盖风险是否准确？

checker 发现 major 问题时，回到实现和验证。不要只改复盘文字。

## 综合评价表

| 维度 | 0 分 | 1 分 | 2 分 |
| --- | --- | --- | --- |
| 意图 | 只有原始需求 | 有目标和范围 | 含不变量、验收和停止 |
| 仓库知识 | 无入口 | 有文件清单 | 有来源、新鲜度和最小 Context Pack |
| 边界 | 无限制 | 有文字提醒 | 有分级、机械检查和人工闸门 |
| 反馈 | 只说测试通过 | 有局部命令 | 有分层结果、失败分类和回归 |
| 状态与恢复 | 只靠聊天 | 有进度摘要 | 可由另一人验证并继续 |
| 风险与审计 | 未说明 | 有泛化风险 | 有未覆盖项、审批和轨迹证据 |

总分 10 分以上，且没有伪造结果、敏感数据或 blocked 行为，说明实践形成了最小闭环。8–9 分适合继续补证据；低于 8 分先回到任务契约和基线。

## 参考实现不是标准答案

实验仓库的 `harness-overlay/` 提供了一套可用结构。它故意没有完成全部业务实现，因为课程要训练的是：从失败证据推导下一项 Harness 改进。

如果你的设计比参考覆盖层更小，但能稳定阻止同样错误，它可能更好。如果多了十份没有任何检查读取的模板，反而增加维护负担。

## 最后的复盘

复盘只回答四个问题：

- 哪个失败最有价值？
- 哪项改动让失败更早暴露？
- 哪条规则仍靠人记忆？
- 下一次只增加哪一项 Harness 能力？

不要用“未来继续优化”收尾。写下一项具体任务、负责人和触发证据。

## 本章小结

完整 Harness 不是文件清单，而是一条可运行的因果链：意图决定行为与边界，仓库知识提供可信入口，工具采取行动，检查生成反馈，状态支持恢复，人工闸门处理风险，复盘再把真实失败写回系统。

到这里，你应该能为一个小型项目做 Harness 设计，也能判断企业仓库下一步该补的是任务契约、知识入口、工具、边界、反馈还是状态，而不是笼统地要求智能体“更聪明一点”。

上一章：[速度提高后，怎样控制漂移和风险？](./12-governance-drift-security-and-cost.md)  
返回：[课程目录](../index.html)  
术语复习：[术语表](../reference/glossary.md)

## 参考文献

- Ryan Lopopolo. [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/). OpenAI, 2026-02-11.
- Anthropic. [Harness design for long-running application development](https://www.anthropic.com/engineering/harness-design-long-running-apps). 2026-03-24.
- OpenAI. [How evals drive the next chapter in AI for businesses](https://openai.com/index/evals-drive-next-chapter-of-ai/). 2025-11-19.
- Shopify Engineering. [We replaced Redis with MySQL for inventory reservations—and it scaled](https://shopify.engineering/scaling-inventory-reservations). 2026-05-12.
