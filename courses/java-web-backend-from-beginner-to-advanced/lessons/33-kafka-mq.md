# 第 33 章　Kafka 消息处理与可靠性

> 学习提示：先建立"消息从生产者到 Broker 再到消费者"的一条完整链路，再逐步加入分区、消费组、偏移量和失败重试；不要一开始就复制完整配置类。
> 一句话总结：消息队列解耦生产者和消费者，Kafka 通过分区和消费组实现高吞吐与水平扩展；至少一次送达要求消费者自行处理重复消息，幂等性是消费者的责任而非 Kafka 的内置保证。

前几章的服务中，Controller 接收请求 → Service 处理 → 返回响应，整个过程是同步的——调用方必须等待所有步骤完成。如果一个请求需要发邮件、调整库存、通知其他系统，同步等待全部完成会拖慢响应时间。

## 一、同步调用与异步消息

### 1.1 同步链路的瓶颈

```text
用户下单请求
  → 扣减库存（200ms）
  → 创建订单（100ms）
  → 发送通知邮件（800ms，等 SMTP 服务器响应）
  → 通知物流系统（500ms）
  → 返回到用户（总计 1600ms）
```

用户等待 1.6 秒才能看到"下单成功"。其中的"发送邮件"和"通知物流"不需要在返回用户之前完成——用户只需要订单已经创建。把这些耗时操作从同步链路中分离出来，是消息队列解决的问题。

### 1.2 从同步到异步

```text
同步核心链路：
  用户请求 → 扣库存 → 创建订单 → 返回"成功"（300ms）

异步后续链路：
  创建订单 → 发送"订单已创建"事件 → Kafka
  Kafka → 邮件服务消费事件 → 发邮件
  Kafka → 物流服务消费事件 → 通知物流
```

用户只等 300ms，邮件和物流在后台异步完成。这就是消息队列的核心价值：**解耦生产者和消费者**。

生产者（订单服务）只负责把事件写入消息队列，不关心谁来消费、消费成功还是失败。消费者（邮件服务、物流服务）各自按自己的节奏从队列取消息处理。

### 1.3 消息队列的基本模型

```text
生产者（Producer）
  ↓ 发送消息
消息队列（Broker）
  ↓ 消费者拉取
消费者（Consumer）
```

这条链路中的角色：

- **生产者**：创建并发送消息的服务。生产者需要知道消息发到哪个 Topic。
- **[[Broker]]**：消息队列服务本身。它接收消息、持久化存储、转发给消费者。Kafka 中每个消息被追加到日志文件末尾。
- **消费者**：从 Broker 拉取消息并执行处理逻辑的服务。消费者需要知道从哪个 Topic 的哪个 Partition 拉取。
- **Topic**：消息的"频道"或分类。如 `order_created`、`payment_completed`。Topic 是一个逻辑概念，物理上分成一个或多个 Partition。
- **消息**：传递的数据记录，包含键、值、时间戳和可选 Header。

## 二、Kafka 的基本部件

### 2.1 Topic 与 Partition

Kafka 的 Topic 不是一个单一队列，而是被分成多个[[分区]]（Partition），每个 Partition 是一个有序的不可变日志：

```text
Topic: order_created
├── Partition 0: [msg1, msg2, msg5, msg8]
├── Partition 1: [msg3, msg6, msg9]
└── Partition 2: [msg4, msg7]
```

分区的作用：

- **并行处理**：多个消费者可以同时消费不同分区，提高吞吐量。一个分区同时只能被一个消费者线程消费，但多个分区可被多个消费者并行消费。
- **顺序保证**：同一个分区内的消息按写入顺序读取。不同分区之间没有顺序保证。
- **水平扩展**：增加分区数可以让更多消费者并行工作。

消息如何分配到分区？如果消息有 Key，Kafka 对 Key 做哈希后取模决定分区——相同 Key 的消息进入同一分区，保证同 Key 消息的顺序。如果没有 Key，轮询分配。

### 2.2 Consumer Group

[[消费组]]（Consumer Group）是多消费者协作的机制：

- 同一消费组内的消费者，每个分区只分配给一个消费者。
- 不同消费组之间独立消费——一条消息可以被多个消费组各自消费一次。

```text
Topic: order_created (3 partitions)

Consumer Group "order-processors" (2 consumers)
  Consumer A ← Partition 0, Partition 1
  Consumer B ← Partition 2

Consumer Group "audit-logger" (1 consumer)
  Consumer C ← Partition 0, Partition 1, Partition 2
```

订单处理组内的两个消费者分摊三个分区的消息；审计日志组独立消费所有消息。一条"订单创建"事件被两个组各自消费：一次用于业务处理，一次用于审计记录。

### 2.3 Offset

[[Offset]]是消息在分区内的唯一顺序编号。Kafka 不跟踪"消息是否处理成功"——它只跟踪消费者读到了哪个 Offset。消费者成功处理后，提交 Offset（或称位移），表示"这个位置以前的都处理完了"。

```text
Partition 0: [offset:0, offset:1, offset:2, offset:3, offset:4]
Consumer 已提交 offset:2
→ 重启后从 offset:3 开始消费
```

Offset 提交的时机决定了消息的投递语义。

## 三、投递语义

### 3.1 三种语义

| 语义 | 含义 | 实现方式 |
| --- | --- | --- |
| 至多一次 | 消息可能丢失，但绝不重复 | 先提交 Offset 再处理。处理失败时消息已"标记为完成" |
| [[至少一次]] | 消息绝不丢失，但可能重复 | 先处理再提交 Offset。处理成功但提交失败时，重启后重复处理 |
| [[精确一次]] | 消息不丢不重 | 需要事务支持或幂等生产者（Kafka 0.11+ 支持幂等生产者但不覆盖消费者侧） |

Kafka 默认实现至少一次——这是最安全也最常用的选择。代价是消费者必须能处理重复消息。

### 3.2 至少一次的工作过程

```text
1. 消费者拉取 offset:3 的消息
2. 执行业务逻辑（更新数据库）
3. 提交 offset:3

如果第 2 步成功、第 3 步失败（提交超时或消费者崩溃）：
4. 消费者重启，从上次已提交的 offset:2 重新开始
5. 再次拉取 offset:3 的消息
6. 再次执行业务逻辑 → 重复处理！
```

这就是至少一次：消息不会丢失（Kafka 持久化了），但消费者可能处理两次。

## 四、处理重复消息——幂等性

[[幂等]]（Idempotency）指一个操作执行一次和多次的效果相同。

### 4.1 为什么消费者需要幂等

至少一次是 Kafka 最安全的投递方式，但它必然产生重复。消费者必须自行保证幂等。

```java
public void handleOrderCreated(OrderCreatedEvent event) {
    // 错误的方式：直接 INSERT
    orderRepository.insert(event.getOrderId(), event.getDetails());

    // 正确的方式：先检查是否已处理
    if (orderRepository.exists(event.getOrderId())) {
        log.info("订单 {} 已处理，跳过", event.getOrderId());
        return;
    }
    orderRepository.insert(event.getOrderId(), event.getDetails());
    // 发送后续事件、调用外部服务
}
```

### 4.2 常用幂等策略

- **唯一标识去重**：使用消息中的业务 ID（如订单号），处理前检查是否已存在。已存在→跳过。
- **数据库唯一约束**：利用 `INSERT ... ON CONFLICT DO NOTHING`（PostgreSQL）或 `INSERT IGNORE`（MySQL）。重复插入时数据库拒绝而不是报错。
- **状态检查**：检查业务对象的状态是否允许当前操作。例如"取消订单"前检查订单状态，已取消则直接返回成功。

```java
// 使用数据库唯一约束
// 数据库表设计：order_id 有 UNIQUE 约束
try {
    orderRepository.insert(event.getOrderId(), event.getDetails());
} catch (DuplicateKeyException e) {
    log.info("订单 {} 已存在，忽略", event.getOrderId());
}
```

最佳实践：每条 Kafka 消息包含一个 `eventId`（UUID），用 `eventId` 做幂等去重。即使业务 ID 相同但事件不同（如两次修改了金额），也能通过 `eventId` 正确判断是否重复。

## 五、失败与重试

### 5.1 消费失败时的处理

```java
@KafkaListener(topics = "order_created")
public void handle(OrderCreatedEvent event) {
    try {
        // 处理逻辑
        processOrder(event);
    } catch (TransientException e) {
        // 临时故障（数据库暂时不可用），抛出异常让 Kafka 重试
        throw e;
    } catch (FatalException e) {
        // 永久故障（消息格式错误），记录到死信队列
        deadLetterService.send("order_created.dlq", event, e);
    }
}
```

- 临时错误（数据库超时、网络闪断）：抛出异常，Kafka 按重试策略重新投递。
- 永久错误（消息格式不合法、必填字段缺失）：不能无限重试——写到[[死信队列]]（Dead Letter Queue）后人工处理。

### 5.2 重试的风险

- **乱序**：如果分区内有多条消息，第一条处理失败正在重试，第二条成功提交了 Offset。第一条重试成功时，它实际处理的顺序和原始顺序不同。对于同 Key 消息有严格的顺序要求时，考虑使用同步处理或改变分区策略。
- **重复**：重试意味着消息可能被执行多次。幂等性必须覆盖重试场景。

### 5.3 消费速度与积压

消费者处理速度慢于生产速度时，消息在分区中[[积压]]。监控以下指标：

- `consumer_lag`（消费延迟）：当前最新 Offset 减去已提交 Offset，表示还有多少条消息等待处理。
- 积压过大时，可以考虑增加消费者实例、增加分区或优化处理逻辑。


### 5.4 Spring Kafka 生产者与消费者基础

引入依赖：

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

配置：

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
    consumer:
      group-id: order-processor-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "studio.aicourse.javaweb.event"
```

生产者：

```java
@Service
public class OrderEventProducer {
    private final KafkaTemplate<String, OrderCreatedEvent> kafkaTemplate;

    public OrderEventProducer(KafkaTemplate<String, OrderCreatedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendOrderCreated(OrderCreatedEvent event) {
        // Key 使用 orderId 保证同订单事件进入同一分区
        kafkaTemplate.send("order_created", event.getOrderId(), event);
    }
}
```

消费者：

```java
@Component
public class OrderEventConsumer {

    @KafkaListener(topics = "order_created", groupId = "order-processor-group")
    public void handleOrderCreated(OrderCreatedEvent event) {
        // 幂等性：检查 eventId 是否已处理
        if (processedEventRepo.existsByEventId(event.getEventId())) {
            return;
        }
        // 处理业务逻辑
        orderService.process(event);
        // 记录已处理
        processedEventRepo.save(new ProcessedEvent(event.getEventId()));
    }
}
```

### 5.5 监控与运维要点

生产环境中应监控以下 Kafka 指标：

- **Consumer Lag**：消费者落后生产者的消息数量。持续增大说明消费速度跟不上生产速度。
- **Broker 磁盘使用率**：Kafka 默认按时间或大小清理旧消息（`log.retention.hours`、`log.retention.bytes`），磁盘满会导致 Broker 拒绝写入。
- **ISR（In-Sync Replicas）数量**：每个分区的同步副本数。低于 `min.insync.replicas` 时，生产者写入会被拒绝（可靠性下降）。
- **请求延迟**：生产请求和消费请求的 P99 延迟。延迟突增通常是 Broker 负载过高或网络问题。

这些指标通过 Kafka 的 JMX 端口暴露，可接入 Prometheus + Grafana 等监控系统。

## 六、与 RabbitMQ、RocketMQ 的对照

| 特性 | Kafka | RabbitMQ | RocketMQ |
| --- | --- | --- | --- |
| 核心模型 | 分布式日志 | 消息队列（AMQP） | Topic 队列模型 |
| 消息持久化 | 默认持久化到磁盘 | 需配置持久化 | 默认持久化 |
| 消费模式 | 消费者拉取（pull） | 支持推（push）和拉 | 拉取为主 |
| 顺序保证 | 分区内有序 | 单队列有序 | 分区内有序 |
| 消息优先级 | 不支持 | 支持 | 不支持 |
| 延时消息 | 不直接支持 | 通过插件支持 | 原生支持 |
| 典型吞吐量 | 非常高（百万/秒） | 中等（万/秒） | 高（十万/秒） |
| 消息回溯 | 支持（按 Offset） | 不支持（消费后删除） | 支持（按时间/Offset） |

选择建议：

- **Kafka**：事件流、日志采集、大数据管道、需要消息回溯和极高的吞吐量。
- **RabbitMQ**：业务消息、需要灵活的路由和优先级、消费者推模式、对吞吐量要求中等的场景。
- **RocketMQ**：电商交易、金融场景、需要延时消息和事务消息。

不要因为"Kafka 是主流"而强制所有消息场景都用 Kafka。消息队列的选择取决于吞吐量、可靠性、路由灵活性、运维成本和团队经验。

## 七、练习与验收

### 练习 1：一条消息的旅程

画出一张流程图，展示一条"用户已注册"事件从生产者到消费者的完整路径。标注：

- 生产者写入的 Topic 和 Partition（Key 为 user_id）
- Broker 的持久化位置
- 消费者拉取的 Offset
- 消费者提交 Offset 的时机

### 练习 2：实现幂等消费者

设计订单事件消费者 `OrderEventHandler`，处理 `order_created` 事件：

- 消息包含 `eventId`（UUID）、`orderId`、`amount`。
- 数据库中 `processed_events` 表以 `eventId` 为主键。
- 处理前先查询 `eventId` 是否存在。存在→跳过，不存在→处理订单并插入 `processed_events`。

写出伪代码或 Java 代码，并标注怎么保证数据库插入和处理在同一事务中。

### 练习 3：消息队列选型

一个电商系统的以下场景，分别适合 Kafka、RabbitMQ 还是 RocketMQ？说明理由。

1. 用户下单后 30 分钟未支付，自动取消订单。（延时消息）
2. 所有用户行为日志（点击、浏览、搜索）需要汇总到数据仓库。（高吞吐、日志流）
3. 支付成功后，需要通知物流、积分和通知三个系统，其中通知系统对顺序有要求。（灵活路由、优先级）

## 常见误区

### 把 Consumer Group 当成"减少重复消费"的机制

Consumer Group 解决的是并行消费和负载均衡，不是去重。同一 Group 内的两个消费者不会收到同一条消息，但不同 Group 会各自消费。重复消费的防护靠消费者的幂等设计。

### 用提高分区数解决所有性能问题

分区数增加会增加 Broker 的文件句柄和内存开销，也会增加消费者再均衡的时间。分区数应根据预期吞吐量设定，不是越多越好。

### 要求精确一次却不评估代价

精确一次（exactly-once）涉及事务和幂等生产者，增加了延迟和复杂度。绝大多数场景中，至少一次 + 消费者幂等更务实。

### 把 Topic 和资源的业务边界混淆

一个 Topic 应该代表一个业务事实（`order_created`），而不是一个服务接口（`order_service_create_order`）。Topic 的命名应反映发生了什么，而不是谁处理它。

## 本章小结

消息队列解耦生产者和消费者，把耗时操作从同步链路中分离。Kafka 通过 Topic 和 Partition 实现消息分类和并行处理。Consumer Group 让多个消费者分摊分区消息，不同 Group 独立消费。至少一次是默认投递语义，消费者必须自行保证幂等——用唯一 ID 去重或数据库唯一约束是常用策略。失败消息分临时错误（重试）和永久错误（死信队列）两类处理。Kafka 适合高吞吐和事件流，RabbitMQ 适合灵活路由，RocketMQ 适合电商交易。下一章学习线程安全和线程池——如何在单个 JVM 内部安全地并发执行任务。

## 快速自测

1. Kafka 中 Topic 和 Partition 的关系是什么？
2. Consumer Group 的作用是什么？同一 Group 内的两个消费者会收到同一条消息吗？
3. "至少一次"投递为什么需要消费者实现幂等？
4. 消费者的幂等性通常通过什么方式实现？
5. Kafka、RabbitMQ、RocketMQ 各自适合什么场景？

参考答案：Topic 是逻辑分类，每个 Topic 包含一个或多个 Partition，每个 Partition 是一个有序日志；Consumer Group 让消费者分摊分区消息实现并行消费，同一 Group 内不会收到同一消息；因为消息可能因 Offset 未提交而被重复投递；通过唯一业务 ID 或 eventId 在处理前去重；Kafka 适合高吞吐和事件流，RabbitMQ 适合灵活路由，RocketMQ 适合电商交易。

## 参考文献

- Apache Kafka. [Documentation](https://kafka.apache.org/documentation/).
- Spring for Apache Kafka. [Reference](https://docs.spring.io/spring-kafka/reference/).
- Confluent. [Kafka Design](https://developer.confluent.io/design/kafka/).
