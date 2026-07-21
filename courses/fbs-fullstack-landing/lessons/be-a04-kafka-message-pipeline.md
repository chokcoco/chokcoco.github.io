# Kafka 消息链路与事件边界

> 预计学习时间：140–200 分钟
> 一句话总结：从“消息队列在后端架构中解决什么问题”开始，讲清 Kafka 的核心概念、社区同类方案、FBS 仓库中的真实 producer/consumer 链路，以及消息兼容、重复、失败处理的设计方法。

## 消息队列解决什么问题

HTTP API 是请求-响应模式：A 发请求给 B，B 处理完返回结果。这种模式要求 A 和 B 同时在线，A 知道 B 的存在，A 关心 B 的处理结果。在 FBS 系统中，还有很多场景不需要这一整套约束。

店铺渠道信息变更了，对账模块需要知道，但不要求变更操作者在页面上等着对账完成。入库 ASN 创建后，仓库管理系统和 BI 报表系统各自需要消费这份信息，但创建 ASN 的接口不应该直接耦合仓库系统和 BI。发票生成完成后，账单系统需要据此更新——但账单系统可能在发票生成时恰好维护中，不能强制要求它实时在线。

**消息队列**（message queue）在这些场景中充当了异步解耦层。上游（producer，生产者）把消息写入队列后继续自己的工作，不等待下游（consumer，消费者）处理完毕。下游按自己的节奏从队列中消费消息。RabbitMQ、Amazon SQS、Google Pub/Sub、NSQ 都是社区常用的消息队列，各有侧重。

**Kafka** 的定位不是传统消息队列，而是一个分布式流平台（distributed streaming platform）。它由 LinkedIn 在 2011 年开源，后来捐给 Apache 基金会。和 RabbitMQ 的主要区别在于：Kafka 把消息持久化在磁盘并按时间顺序保留（默认数天甚至数周），支持多个 consumer group 独立消费同一份数据，天然适合大数据量、高吞吐、多消费者、需要回放（replay）的场景。在 FBS 架构中，Kafka 既承担了服务间的异步通信，也部分承担了数据同步和事件溯源的角色。

对比 Saturn 的差异值得在这个阶段再强调一次：Kafka 的出发点是“某件事发生了，关心这件事的人自己消费”，它的核心是事件通知和领域事件分发。Saturn 的出发点是“我要做一件事”，它的核心是任务调度和可靠执行。在 FBS 仓库中，同一个业务流程可能先通过 Kafka 发布事件，消费方收到事件后根据需要提交 Saturn 异步任务——两者配合使用，不是因为功能重叠，而是因为它们服务于不同层次的可靠性需求。

> 本章基于三个后端仓库的 release 分支（2026-07-20）。Kafka 的版本、producer/consumer 注册方式和消息序列化格式以 `sbs-fbs-server` 和 `fbs-tax-server` 的当前代码为准。具体平台（集群、topic、分区数、保留策略）不在课程范围。

## Kafka 的核心概念

在开始读 FBS 仓库的 consumer 代码之前，先建立起 Kafka 的几个基础模型。这些概念在前端开发中几乎没有对应的概念，建议逐条消化而不是一次读完。

**消息（message）**：一段键值对数据，包含 key（用于分区路由）、value（业务数据，通常是 JSON 或 protobuf 序列化后的字节串）、headers（键值对元数据，如 trace_id、retry_count）和 timestamp。

**Topic（主题）**：消息的分类名，比如 `fbs.shop.channel.change`。producer 往 topic 写，consumer 从 topic 读。一个 topic 可以有多个 consumer group 独立消费，不会互相影响。

**Partition（分区）**：一个 topic 被分成多个 partition，分布在不同 broker 上。partition 内部消息严格有序，但 partition 之间的消息无序。拥有相同 key 的消息一定路由到同一个 partition，这是“同一个实体的消息保证有序”的唯一方式。

**Consumer Group（消费者组）**：同一组内的 consumer 共同消费一个 topic，每个 partition 只被组内一个 consumer 消费。这保证了同一消息不会在组内重复处理，同时允许通过增加 consumer 实例水平扩展消费能力。

**Offset（偏移量）**：每条消息在 partition 内的唯一序号。consumer 处理完消息后提交（commit）当前 offset，下次启动时从这个 offset 继续消费。提交时机决定了“at-most-once”、“at-least-once”还是“exactly-once”语义。

**序列化与 Schema 演进**：producer 把 Go struct 序列化成字节串写入 Kafka，consumer 按相同 schema 反序列化。如果 producer 增加了字段但 consumer 还没更新，consumer 应当能跳过不认识的新字段而不报错。这就是消息的向后兼容（backward compatibility）和向前兼容（forward compatibility），通常由 protobuf 或 Apache Avro 等序列化方案的 schema 检查来保证。

## FBS 仓库中的 Kafka 链路

### 主服务的 consumer 注册

主服务 `fbs_task` 进程中注册了多个 Kafka consumer。典型的注册路径是：`initNewTask()` → 各模块的 consumer 注册函数 → Chassis Kafka consumer handler。consumer 的实现文件分布在 `apps/*/access/consumer/` 目录下：

```
apps/seller/shop/access/consumer/sync_shop_channel_consumer.go
apps/seller/shop/access/consumer/sync_shop_channel_for_whs_consumer.go
apps/seller/client/port/input/consumer/mass_update_client_handler.go
apps/seller/client/port/input/consumer/account_user_handler.go
apps/seller/client/port/input/consumer/client_request_event_handler.go
...
```

每个 consumer handler 通常包含三个部分：定义消息结构体（payload）、实现消费处理函数、错误和重试逻辑。以 `sync_shop_channel_consumer` 这个典型的 consumer 为例：

```go
// apps/seller/shop/access/consumer/define.go（简化）
type ShopChannelChangeEvent struct {
    ShopID    int64  `json:"shop_id"`
    ChannelID int64  `json:"channel_id"`
    Action    string `json:"action"`   // "add", "remove", "update"
    Timestamp int64  `json:"timestamp"`
}

// sync_shop_channel_consumer.go（简化）
func HandleShopChannelChange(ctx context.Context, msg []byte) error {
    var event ShopChannelChangeEvent
    if err := json.Unmarshal(msg, &event); err != nil {
        return fmt.Errorf("unmarshal event: %w", err)
    }
    // 根据 Action 执行对应的业务逻辑
    switch event.Action {
    case "add":
        return service.AddShopChannel(ctx, event.ShopID, event.ChannelID)
    case "remove":
        return service.RemoveShopChannel(ctx, event.ShopID, event.ChannelID)
    case "update":
        return service.UpdateShopChannel(ctx, event.ShopID, event.ChannelID)
    default:
        return fmt.Errorf("unknown action: %s", event.Action)
    }
}
```

从这段真实代码中能归纳出几个知识点：

1. consumer 接收的是 `[]byte`，自己负责反序列化。序列化格式（JSON 还是 protobuf）由消息的契约决定，不是由 consumer 框架决定的。
2. handler 不直接操作数据库，而是委托给 service 层。这意味着 consumer、HTTP handler 和 Saturn handler 可以共享同一套 application/domain 层。
3. 错误返回后，框架会根据配置决定是否重试、重试几次、是否需要写入 DLQ（Dead Letter Queue，死信队列）。

### Tax 服务的 producer 模式

Tax 仓库在 `internal/common/kafka/` 下组织 Kafka 相关代码，其中 produder 的职责是“在业务事件发生时发送消息”：

```
internal/common/kafka/producer/biling.go      // 账单相关消息
internal/common/kafka/brazil_invoice.go         // 巴西发票消息
internal/common/kafka/brazil_cancel_invoice.go  // 发票取消消息
internal/common/kafka/order_status.go           // 订单状态消息
internal/common/kafka/consumer/billing.go       // 账单消费
```

这些文件说明 Tax 服务在 Kafka 中同时扮演 producer 和 consumer：它既向外发送发票生成完成的事件（让账单系统消费），也消费外部发来的订单状态变更事件（触发自身税务计算）。

一个关键设计点：`initialize/base/init_kafka.go` 是 Tax 服务中 Kafka 初始化的集中入口。producer 的配置（topic、broker 地址、序列化方式）在启动时初始化一次，业务代码通过注入的 Kafka client 发送消息。

**Situation**：当店铺绑定的渠道发生变化时，对账系统和库存系统需要感知到这个变化并做出相应调整，但店铺管理接口不应该直接耦合这两个系统。

**Task**：追踪主服务中 `sync_shop_channel_consumer` 从消息消费到业务处理的完整链路，理解消息的生产者、消费者和消息生命周期。

**Action**：
1. 找到产生 `ShopChannelChangeEvent` 的 producer 代码（可能在店铺管理的 service 或 repository 层）。
2. 找到消费该事件的 consumer handler 代码，画出从消息到达 → 反序列化 → 业务处理的完整流程图。
3. 识别 consumer 如何处理重复消息：有没有基于 shop_id + channel_id + timestamp 的幂等机制？
4. 在测试环境复现一次消息消费失败 → 重试 → 最终成功的完整流程，记录日志和监控输出。

**Result**：你能从 producer 代码追到 consumer handler，理解一条 Kafka 消息从发到收的完整链路，并能判断当前代码对消息重复、失败和兼容性的保护能力。

## 消息设计的常见决策

### 消息体是具体数据还是数据 ID

两种模式在 FBS 仓库中都有出现。

**携带完整数据**：消息体中包含处理所需的全部字段。优点是 consumer 不需要额外查询，处理更快；缺点是一旦上游数据模型变更，消息结构也必须跟着变。适合实时性要求高、consumer 并发大、上游数据变化不频繁的场景。

**只携带数据 ID**：消息体中只包含实体 ID 和时间戳。consumer 收到消息后根据 ID 重新查询最新数据。优点是消息 payload 稳定、consumer 始终拿到最新数据；缺点是多一次查询、数据在“发出消息”和“消费消息”之间可能已经再次变化。适合数据频繁更新、consumer 需要最准确状态的场景。

主服务的 `sync_shop_channel_consumer` 走的是“携带完整数据”的模式：消息中包含了 `ShopID`、`ChannelID`、`Action` 和 `Timestamp`。Consumer 收到后直接用这些字段执行操作，不需要查库。

### 消息兼容性

消息的字段会随着需求变化而增加或修改。一个 producer 多了一个 `Region` 字段，旧的 consumer 能否正确处理这个消息？

**向后兼容（backward compatibility）**：新 consumer 能消费旧 producer 的消息。新增字段在反序列化时赋零值即可。

**向前兼容（forward compatibility）**：旧 consumer 能消费新 producer 的消息。用 JSON 做序列化时，旧 consumer 的 `json.Unmarshal` 会自动忽略不认识的新字段，天然支持向前兼容。但 protobuf 等 schemaful 格式需要显式声明向后兼容（字段号只能增加不能修改）。

FBS 仓库中大部分 consumer 使用 JSON 序列化，向前兼容性是内置的。但这不是永久免费的午餐：当新字段承载业务语义且 consumer 需要感知（比如 `Action` 从三种变成四种）时，consumer 必须同步更新。

### 消息重复与乱序

Kafka 保证 partition 内部消息有序，但不保证跨 partition 有序，也不保证消息不重复。consumer 的处理逻辑必须能应对以下情况：

**消息重复**：网络波动时 producer 可能重发，consumer 重启时可能从已处理过的 offset 重新消费。应对方式是幂等处理（与 Saturn 相同的原则）：基于业务唯一键判断是否已处理。

**消息乱序**：同一个实体的不同状态变更可能落入不同 partition，导致 consumer 读到“先更新，后创建”的乱序消息。应对方式是 consumer 按实体 ID 缓存最后处理的 timestamp，丢弃早于该 timestamp 的消息；或者按实体 ID 路由到同一个 partition（Kafka message key 决定 partition）。

## 消息的可靠性层次

Kafka 不提供“exactly-once”（恰好一次）的消息投递保证，只提供“at-least-once”（至少一次）。这意味着 consumer 在最理想的情况下也能收到重复消息。真正实现业务级别的 exactly-once 需要 consumer 端配合：幂等处理 + 事务性提交 offset。

在 FBS 仓库中，consumer 的常见做法是“处理成功则提交 offset，失败则不提交并依赖重试”。这种方式保证 at-least-once（消息不会被漏掉），但不保证 exactly-once（同一消息可能被处理多次）。每个 consumer handler 的设计者都必须意识到这个语义，并在 handler 内部实现业务幂等。

**DLQ（Dead Letter Queue，死信队列）** 是消息重试全部失败后的最后去处。主服务中的 consumer 在达到最大重试次数后会走 DLQ 路径。进入 DLQ 的消息不会自动重新处理，需要人工或定时任务检查 DLQ 中的消息，判断是数据问题（修数据后重新入队）、代码问题（修 bug 后重新部署）还是配置问题（纠正 topic 路由）。

**消息丢失的可能环节**：

1. producer 端：`producer.Send()` 返回成功不代表消息已持久化到所有 replica。Kafka broker 在 acks=1（只等 leader 确认）时，leader 挂了且新 leader 没有这条消息，就丢了。
2. broker 端：Kafka broker 根据 retention policy（保留策略）自动删除过期消息。如果 consumer 因为故障停在某个 offset 超过保留时间，恢复后那段数据已经不存在了。
3. consumer 端：consumer 处理消息成功后、提交 offset 之前进程崩溃。重启后从旧 offset 重新消费，产生重复处理——这不是丢失，是重复。

对于 FBS 课程而言，你不需要配置 Kafka broker 的参数。你需要知道：你的 consumer handler 随时可能收到重复消息，所以必须幂等；你的 producer 代码 `Send()` 成功后消息不保证一定能被消费（broker 故障、retention 清理都可能影响），所以关键业务应该在 producer 侧保存一份消息发送记录用于对账。


## 事务后发消息的风险

一个常见的写路径：

1. 数据库事务中更新 ASN 状态为“已入库”
2. 事务提交成功后，producer 向 Kafka 发送 `ASN_STATUS_CHANGED` 消息

第二步失败（producer 超时、网络不可达）会导致：数据库已经更新了 ASN 状态，但下游 consumer 不知道这件事。下游系统将永远缺少这条状态变更通知。

这是一个分布式系统中经典的“dual-write”问题：数据库和消息是两个独立的存储，无法在一个本地事务中同时写入。处理方式有以下几种：

**方案一：outbox 模式**。不直接发 Kafka，而是在同一个数据库事务中往一张 `outbox` 表插入消息记录。然后由一个独立的 scan 线程轮询 outbox 表，把未发送的消息投递到 Kafka，投递成功后才删除或标记为已发送。核心思想是把“发消息”这个操作变成数据库事务的一部分，用数据库事务保证不丢。

**方案二：CDC（Change Data Capture，变更数据捕获）**。不让业务代码直接写 Kafka，而是通过 Debezium 等工具捕捉 MySQL binlog，把 INSERT/UPDATE 自动转换成 Kafka 消息。彻底避免了 dual-write，但要求运维有 CDC 基础设施。

**方案三：妥协方案——发消息失败时记录异常并告警**。在 FBS 仓库中，部分代码在事务提交后直接发 Kafka，失败时写错误日志并记录到监控系统。运营或开发定期检查积压的失败消息，手工补偿。这个方案的可靠性远不如 outbox，但对非核心、允许短暂不一致的场景够用。

FBS 仓库当前没有统一的 outbox 或 CDC 实现。你在自己的代码中选择哪条路径，取决于业务对一致性的要求。课程的建议是：涉及资金、库存、订单状态等不可逆操作的，优先与团队讨论 outbox 或 CDC；对于纯通知类的事件，抓好失败监控和告警就够。


## 消息可观测性

一个 Kafka consumer 如果静默地停止消费了，你可能在几小时后才发现下游数据全部过期。所以在开发和运维 consumer 时，至少要确保三件事：

**消费延迟（consumer lag）监控**。consumer lag 是当前最新消息 offset 和 consumer 已提交 offset 之间的差值。lag 持续增长说明 consumer 处理速度跟不上生产速度或者 consumer 停了。主服务的 task 进程通过 Prometheus 暴露了 consumer lag 指标，你在 Grafana 上能看到。

**错误率监控**。consumer handler 的 error 返回次数、反序列化失败次数、重试次数。假设你突然看到某个 topic 的 consumer error 率从 0.1% 飙升到 50%，大概率是 producer 的消息格式变了但 consumer 没升级。

**消费记录日志**。每个 consumer handler 处理消息时应在日志中输出消息的唯一标识（如 trace_id、message_id）和处理结果。当需要排查“为什么这条数据下游没更新”时，消费者日志是比猜测更可靠的证据。

FBS 主服务的 `middleware/` 和 `libs/monitor/` 中已有 consumer 延迟上报的实现，但具体指标名称和上报方式以当前环境配置为准。课程不虚构具体的 Grafana 看板截图，只说明你要找什么、怎么看。


## 测试 Kafka consumer

consumer 的单元测试与 HTTP handler 不同：HTTP handler 可以用 `net/http/httptest` 模拟请求，consumer 没有这种标准库。

FBS 仓库中 consumer 测试的常见方法：

**直接测试 handler 函数**。consumer handler 最终是一个接收 `[]byte` 返回 `error` 的函数。把你的 handler 提取成纯函数后，可以传入合法 JSON、非法 JSON、空字节、超大 payload 等输入，验证返回结果。这样测试不依赖 Kafka 运行环境。

**Mock 依赖的 service 和 repository**。consumer 调用了 service 层和 repository 层，测试时将这些依赖注入 fake/mock，验证 consumer 在不同 service 返回结果时的行为——service 返回 error 时应重试还是放弃，service panic 时 consumer 如何处理。

**集成测试（如需验证整个链路）**。在 test 环境中启动一个真实的 Kafka consumer，往 topic 写入测试消息，等待 consumer 处理完成后检查数据库状态、下游调用记录和日志输出。这门课不要求你在课程环境中运行这一步。

主服务 `apps/seller/shop/access/consumer/sync_shop_channel_consumer_test.go` 提供了真实的 consumer 测试范例。这些测试没有启动 Kafka broker，而是直接调用 handler 函数并 mock 依赖。


## 消息契约的设计评审清单

在发布一条新的 Kafka 消息之前，用以下问题检查消息设计：

- topic 命名是否遵循团队约定的命名规范（如 `{domain}.{entity}.{event}`）？
- 消息体的字段是否足够让 consumer 独立处理？还是 consumer 必须额外查询其他数据源？
- 消息的 key 是否保证了需要有序消费的实体落到同一个 partition？
- 序列化格式（JSON / protobuf）是否与现有 consumer 兼容？
- 消息中有没有不应扩散的敏感信息（PII、token、内部路径）？
- 消息的新增字段是否可选的，旧 consumer 忽略后是否有默认行为？
- 有没有设计消息的 schema version 字段，便于未来 consumer 按版本区分处理？
- 如果一条消息被 DLQ 了，是否需要人工处理流程？谁负责？


## 练习

### 练习一：为 ASN 状态变更设计消息

ASN 状态从“待收货”变为“已入库”时，需要通知对账系统和 BI 报表系统。

1. 设计消息 topic 名称和消息体结构（至少包含 ASN ID、状态变更前后值、操作时间）。
2. 选择消息体模式：携带完整数据还是只携带 ID？写出选择理由。
3. 如果下游消费了对账但还没来得及消费，ASN 状态又被回退到“待收货”，写出消息消费的时序和可能出现的问题。
4. 设计消息的向后兼容策略：后续增加 `final_location` 字段时，旧 consumer 如何不受影响？

### 练习二：追踪一个真实的 FBS consumer

选择主服务 `apps/seller/client/port/input/consumer/` 下的任意一个 consumer handler：

1. 找出它对应的 Kafka topic。
2. 画出从 Kafka 消息到达 → 反序列化 → handler 入口 → application/domain 层 → response 的流程图。
3. 判断该 consumer 如何处理消息解析失败、业务处理失败和重试。
4. 找出该 consumer 是否可能处理重复消息，以及重复消息的业务影响。

### 练习三：Kafka 与 Saturn 的协作

ASN 创建后，需要触发生成发票的 Saturn 异步任务。但发票生成依赖订单状态，订单状态通过 Kafka 消息传递。

1. 画出完整数据流：ASN 创建 → Kafka 消息 → consumer 消费 → 提交 Saturn 异步任务 → handler 执行 → 结果写入。
2. 在每一步标注“如果这一步失败，下一步会怎样”。
3. 如果 Saturn 异步任务提交成功但 3 次重试全部失败，这算“已处理的 Kafka 消息”还是“未处理的”？offset 已经提交了吗？写出你的理解和处理方案。


### 练习四：Kafka consumer 故障诊断

以下是来自团队的故障报告：

> 事件：店铺渠道同步延迟了 40 分钟。
> 现象：`sync_shop_channel_consumer` 的 lag 从上午 10:00 开始持续增长，10:40 恢复正常。
> 当时没有服务发布、没有配置变更、没有流量尖峰。

1. 列出可能导致 consumer lag 突增的原因（至少 5 种）。
2. 为每种原因设计验证方法（查什么日志、看什么指标、用什么命令）。
3. 如果确认原因是“消费者在 10:00-10:40 期间每次反序列化一个特殊 shop_id 的消息时 panic 并被 recover 捕获，每次 panic 导致 consumer 暂停处理 30 秒后重试”，说明 consumer 的重试策略设计有什么问题，并写出改进方案。
4. 如果确认原因是“上游在 10:00 发布了一次大批量同步任务，短时间内向 Kafka 写入了 50 万条消息”，说明 consumer 水平扩展有什么限制（partition 数量固定时最多能扩展多少个 consumer 实例？）。


Kafka 在 FBS 架构中承担了一个不容易被替代的角色：它既是异步通信通道，又是数据管道。你可以从 topic 中回溯几天前的消息，这对问题排查和数据修复来说是巨大的优势。但这也意味着 consumer 代码要不断地处理“过去”的消息——schema 兼容、数据修复、状态补偿在 Kafka 系统中是持续的工作，不是一次性搞定的。

另一个值得注意的细节：主服务的 `fbs_task` 进程同时运行 Saturn 任务和 Kafka consumer。它在同一个进程中承载了消息消费和任务执行两套调度，但它们共享了同一个 Chassis 初始化、同一个 config、同一个数据库连接池和同一个监控体系。这意味着 fbs_task 进程是主服务中逻辑最复杂的进程入口，排查 task 进程故障时要分清是 Saturn 任务的问题还是 Kafka consumer 的问题，以及两者之间是否存在资源竞争。


## 自检

1. Kafka 和 HTTP API 在通信模式上的本质区别是什么？什么场景适合 Kafka，什么场景适合同步 HTTP 调用？
2. Kafka 的 topic、partition、consumer group、offset 分别解决什么问题？消息在 partition 内有序和跨 partition 无序意味着什么？
3. “消息携带完整数据”和“消息只携带数据 ID”两种模式分别适合什么场景？FBS 仓库中哪个 consumer 用的是哪一种？
4. 消息重复和乱序是 Kafka 消费中必须应对的两个问题。分别写出它们的成因和应对方式。
5. Kafka 和 Saturn 什么时候配合使用？什么时候只用一个就够了？

## 参考文献

- `sbs-fbs-server/apps/seller/shop/access/consumer/`：店铺渠道同步的 consumer 实现
- `sbs-fbs-server/apps/seller/client/port/input/consumer/`：客户相关事件 consumer 实现
- `fbs-tax-server/internal/common/kafka/`：Tax 服务的 producer 和 consumer 模块
- `fbs-tax-server/initialize/base/init_kafka.go`：Tax 服务 Kafka 初始化入口