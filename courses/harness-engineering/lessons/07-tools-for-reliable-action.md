# 第 7 章　什么工具能让智能体真正行动？

> 预计学习时间：55–70 分钟  
> 一句话总结：好工具把一个明确动作封装成可校验输入、可观察输出和可恢复失败；工具数量并不重要，反馈质量才重要。

## “可以运行 shell”还不够

给智能体终端权限，它几乎可以做任何事：搜索、安装依赖、改文件、调用接口、删除目录。行动空间很大，语义却很弱。

相比之下，一个 `quote-cart` 工具只做一件事：读取购物车和促销策略，返回分项金额、策略版本和错误码。它限制了自由，却让输入、输出和失败更容易检查。

Harness 需要的不是工具越多越好，而是当前任务有足够的行动能力，又能看见结果。

## 工具契约的七个字段

| 字段 | 问题 | 库存预占示例 |
| --- | --- | --- |
| purpose | 什么时候调用？ | 支付前创建短期库存预占 |
| input | 参数和约束是什么？ | idempotencyKey、SKU、数量 |
| output | 成功时返回什么证据？ | reservationId、状态、过期时间 |
| errors | 失败如何分类？ | 库存不足、同键异义、权限不足 |
| side effects | 会改变什么？ | 可售库存和预占记录 |
| permission | 谁可以调用，何时审批？ | 测试环境自动，生产人工或策略授权 |
| retry semantics | 失败后能否重试？ | 相同键相同请求安全重放 |

工具说明如果只写“预占库存”，模型很难知道失败后是否可以重试，也不知道返回一条 ID 是否足以证明库存只扣了一次。

## 输出要能驱动下一步

下面是一种可观察结果：

```json
{
  "ok": false,
  "error": "IDEMPOTENCY_CONFLICT",
  "idempotencyKey": "checkout-781",
  "firstIntent": { "sku": "SKU-RED-CHAIR", "quantity": 1 },
  "currentIntent": { "sku": "SKU-RED-CHAIR", "quantity": 2 },
  "inventoryChanged": false,
  "nextAction": "request-human-decision"
}
```

它比 HTTP 409 更有行动价值：智能体知道不是临时网络问题，不能换个参数继续重试；库存没有变化；下一步需要澄清调用者意图。

## 幂等不是“重复请求都返回成功”

[[idempotency key]]（幂等键）标识一次业务意图。客户端因网络中断重试时，应使用同一个键。

系统至少区分三种情况：

1. 第一次收到键：正常执行并保存请求摘要与结果。
2. 同一键、同一请求：返回第一次结果，不重复副作用。
3. 同一键、不同请求：拒绝并报告语义冲突。

如果客户端每次重试都生成新键，服务端无法知道它们属于同一意图。失败轨迹 B 正是因此预占了两次。

## 通用 shell 和领域工具怎样配合

领域工具不是要取代终端。两者适合不同层次：

| 工具 | 优点 | 风险 | 合适场景 |
| --- | --- | --- | --- |
| 文件读取与搜索 | 灵活，适合探索 | 容易读到旧入口或无关文件 | 仓库定位 |
| shell | 能组合现有命令 | 权限大，输出不稳定 | 构建、测试、局部脚本 |
| 领域 CLI | 输入输出稳定 | 需要维护 | 高频业务查询和验证 |
| API / MCP | 可连接外部系统 | 认证、网络和数据边界复杂 | 工单、日志、数据库、浏览器 |

默认先复用已有 CLI 和测试命令。只有高频失败反复出现时，再封装领域工具。

## 给价格检查做一个小工具

一个无依赖 Node.js 工具可以读取 JSON 并返回稳定结果：

```javascript
import { readFile } from "node:fs/promises";
import { calculateCart } from "../packages/promotion-engine/src/index.js";

const [cartPath, policyPath] = process.argv.slice(2);
if (!cartPath || !policyPath) {
  console.error(JSON.stringify({ ok: false, error: "MISSING_INPUT" }));
  process.exit(2);
}

const cart = JSON.parse(await readFile(cartPath, "utf8"));
const policy = JSON.parse(await readFile(policyPath, "utf8"));
console.log(JSON.stringify({ ok: true, quote: calculateCart(cart, policy) }, null, 2));
```

工具不要打印一段混合说明、颜色码和表格，再让模型猜字段。人类可读说明可以写到 stderr 或额外格式，机器结果保持 schema 稳定。

## 错误分类决定恢复策略

| 错误类别 | 示例 | 下一步 |
| --- | --- | --- |
| 输入错误 | 缺少 SKU、数量为 0 | 修正输入，不重试原请求 |
| 业务拒绝 | 库存不足、优惠不兼容 | 返回可解释原因 |
| 权限拒绝 | 生产写入未批准 | 请求批准或切换只读 |
| 暂时故障 | 网络超时、限流 | 同键重试，退避并加 jitter |
| 语义冲突 | 同一幂等键代表不同意图 | 停止并转人工 |
| 未知故障 | 未分类异常 | 保存证据，限制重试次数 |

把所有失败都包装成 `TOOL_ERROR`，会让智能体重复采取错误动作。错误分类本身就是 harness 的一部分。

## 工具最小化

每增加一个工具，都要增加选择、权限、文档、测试和审计成本。可以用四个问题筛选：

- 当前任务是否真的需要它？
- 与已有工具是否重叠？
- 输出能否稳定地进入下一次判断？
- 副作用和重试语义是否清楚？

如果一个工具只在一次任务里使用，用脚本或现有命令可能更合适。高频、危险或容易误用的动作，才值得有专门接口。

## 常见误区

### 把自然语言返回当结构化结果

“操作成功，大概处理了两条记录”无法用于验收。数量、状态、ID 和证据位置应有稳定字段。

### 自动重试所有错误

参数错误和权限拒绝不会因重试消失。无界重试还会放大故障。

### 把工具认证交给模型

凭证应由运行环境注入并受策略控制，不应出现在提示词、日志或模型生成的命令中。

### 用万能工具绕过边界

如果领域 API 被限制，智能体却能用 shell 直接改数据库，权限设计就失效了。

## 本章练习：写库存工具契约

为 `reserve-inventory` 写一页工具契约，必须包含：参数校验、成功输出、五类错误、权限、幂等语义、审计字段和最大重试策略。

### 通过标准

相同键同请求能重放；同键不同请求会冲突；库存不足不重试；网络超时使用原键并退避；生产调用有审批；输出能证明库存是否变化。六项齐全即可通过。

## 本章小结

工具把模型判断连接到真实环境。可靠工具的价值在语义清楚：输入可校验，输出能驱动下一步，错误能决定恢复策略，副作用与权限可审计，重试不会重复业务结果。

下一章会继续收紧行动空间：哪些规则放在文档里，哪些应该升级为 schema、结构测试、沙箱和审批。

上一章：[怎样从零建设 agent-first 新仓库？](./06-build-agent-first-repository.md)  
下一章：[怎样让智能体有自由但不越界？](./08-guardrails-permissions-and-approval.md)  
术语复习：[术语表](../reference/glossary.md)

## 参考文献

- Celia Chen. [Unlocking the Codex harness: how we built the App Server](https://openai.com/index/unlocking-the-codex-harness/). OpenAI, 2026-02-04.
- Brandur Leach. [Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency). Stripe, 2017-02-22.
- Malcolm Featonby. [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/). Amazon Builders' Library.
