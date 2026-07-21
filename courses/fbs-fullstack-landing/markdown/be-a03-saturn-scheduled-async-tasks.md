# Saturn 定时任务与异步任务

> 预计学习时间：150–210 分钟
> 一句话总结：从“服务为什么需要后台任务”开始，讲清定时任务和异步任务在后端架构中的角色、社区同类方案、FBS 所用的 Saturn 模式，再沿三个仓库真实的任务注册、执行和幂等代码，学会设计和诊断 Saturn 任务。

## 后台任务解决什么问题

HTTP API 有一个隐含假设：客户端发送请求，服务端在短时间内返回响应。这种“同步调用”模式在绝大多数 CRUD 场景下运行得很好。但有两个场景就不合适了。

第一类场景是定时执行。每天晚上跑一轮账单对账、每小时同步一次渠道配置、每隔 5 分钟刷新一次仓库状态。这些操作不需要客户端主动触发，而是由服务自己按时间计划执行。如果把定时逻辑写在某个 HTTP handler 里，靠外部 cron 去 curl，就会把业务逻辑和调用方式绑死，而且缺少任务级别的监控和失败重试。

第二类场景是解耦异步执行。一个入库 ASN 创建后需要通知多个下游系统、触发数据同步和索引重建。这些操作可能耗时较长，如果全在 HTTP handler 里串行执行，接口响应时间会远远超过客户端的超时时间。把它们交给后台异步处理，接口快速返回成功，后台慢慢完成后续步骤——上下游的可用性也相互解耦了。

**定时任务（scheduled task / cron job）** 是在预设的时间点自动触发的任务，由调度器按 cron 表达式决定何时启动。**异步任务（async task / message job）** 是由上游业务逻辑在任意时刻提交的“稍后处理”的工作单元，调度器收到后立即或排队执行。这两类任务在后端架构中统称为“后台任务”。

社区里实现后台任务的方案很多。Linux cron 是最原始的定时工具，但它不感知业务逻辑、不提供失败重试和监控。Java 的 Quartz 支持集群调度和持久化，但需要额外的数据库表。Celery（Python）、Sidekiq（Ruby）、Bull（Node.js）等语言专属框架提供了任务队列、重试和监控，适合独立部署的 worker 进程。云厂商的定时触发（如 AWS EventBridge）适合无服务器架构。

FBS 后端使用的 Saturn 是公司内部的任务调度平台。它在本课程中表现为三个角色：调度平台负责任务的分发、分片和故障转移；Chassis Saturn server 负责接收平台下发的任务并调用注册的 handler；业务代码负责编写 handler 并注册到 Saturn schema。你不能假设 Saturn 一定能把任务投递到目标实例——本章的关键一课是学会在 handler 内部确保幂等和可重试。

**为什么不用 Kafka 代替 Saturn**？Kafka 在一次业务动作发生后通知“某件事发生了”（事件），Saturn 在特定时间或提交时执行“做某件事”（任务）。两者的边界会在下一章进一步展开，现在只需要记住：Saturn 的触发源是时间或主动提交，Kafka 的触发源是业务的领域事件。同一个业务流程可能先通过 Kafka 消费事件，再由事件 handler 提交一个 Saturn 异步任务——这不是重复，是职责分层。

> 本章基于三个后端仓库的 release 分支（2026-07-20）。Saturn 框架的版本、接口和 handler 注册方式以 `sbs-fbs-server/sbs_agent/saturn/`、`cmd/fbs_task/`、`fbs-sensitive-data-server/cmd/task/` 和 `fbs-tax-server/cmd/tax_task/` 的当前代码为准。`Saturn平台使用指南（CN）.pptx` 中的概念用于辅助理解，实际接口以代码为准。

## Saturn 任务是如何注册和执行的

### 任务入口：fbs_task 进程

主服务的后台任务跑在 `cmd/fbs_task/main.go` 这个独立进程中。它不使用 API 进程的 `ListenAndServe`，而是初始化 Chassis 之后调用 `initNewTask()` 注册所有任务 handler，再调用 `chassis.Run()` 启动 Saturn 消息监听：

```go
// cmd/fbs_task/main.go（简化）
func main() {
    // ... Chassis 初始化、config、基础组件 ...
    initNewTask()   // 注册所有定时任务和异步任务
    chassis.Run()   // 开始监听 Saturn 消息
}
```

`chassis.Run()` 不会自动发现 handler。必须先通过 `initNewTask()` 把所有 handler 按照 Saturn 框架的注册方式提交给框架，启动后框架才能把平台下发的任务消息路由到正确的 handler。

### 任务注册的两种模式

FBS 仓库中存在两种 Saturn 注册方式。

**模式一：新架构的分模块注册**。`initNewTask()` 按模块分别调用各模块的注册函数。例如 inbound 模块的定时任务注册函数会把“扫描即将过期的入库单”注册为一个 crontask handler，把“异步处理入库通知”注册为一个 asynctask handler。每个 handler 都在注册时声明自己的 job 名称、执行函数和重试策略。

**模式二：旧 SaturnHandler 的 taskType 注册**。`sbs_agent/saturn/saturn_handler.go` 中的 `SaturnHandler` 使用了基于 `taskType` 的路由方式：

```go
// sbs_agent/saturn/saturn_handler.go（简化，该实现已标记为 Deprecated）
type SaturnHandler struct {
    HandlerMap map[int]AsyncMsgHandler
}

func (s *SaturnHandler) HandleJob(ctx context.Context, message *entity.SaturnMessage) *entity.SaturnReply {
    // 解析消息中的 taskType，查找对应 handler
    handler, ok := s.HandlerMap[msg.TaskType]
    if !ok {
        return &entity.SaturnReply{Retcode: -1, Message: "taskType undefined"}
    }
    // 执行 handler，捕获 panic
    defer func() {
        if painMsg := recover(); painMsg != nil { /* ... */ }
    }()
    return handler.Handle(ctx, msg)
}
```

这段代码做了三件值得学习的事。一是通过 `taskType` 映射 handler，类似 HTTP 路由的 path 匹配。二是处理了 `ctx.Done()`，即上游平台取消了任务时能够及时退出。三是通过 `defer + recover` 捕获 handler 内的 panic，避免单个 handler 崩溃影响整个 Saturn server。但同时代码注释明确说明该模式已废弃，推荐使用模式一的独立 msg job 或模块维护方式。两者并存是仓库演进中的正常现象。

### 定时任务 vs 异步任务的实现差异

定时任务（crontask）的 handler 签名通常是一个不接受业务消息体的函数，因为它的触发源是时间而不是上游数据。执行逻辑是“全量扫描 + 条件过滤”：比如“查询所有状态为 pending 且超过 24 小时的 ASN，逐条处理”。

异步任务（asynctask）的 handler 接收一个包含业务 payload 的消息体。消息体由上游代码（可能是 HTTP handler、其他任务或 Kafka consumer）在提交任务时构造，包含处理所需的全部数据或数据 ID。执行逻辑是“接收 payload → 按 ID 加载最新数据 → 执行处理”。

```go
// 定时任务示例（简化）
func HandleExpiredASNScan(ctx context.Context) error {
    asns, err := repo.FindExpiredASNs(ctx, 24*time.Hour)
    // ... 逐条处理 ...
}

// 异步任务示例（简化）
func HandleASNSync(ctx context.Context, msg *ASNSyncPayload) error {
    asn, err := repo.FindByID(ctx, msg.ASNID)
    // ... 执行业务处理 ...
}
```

### Saturn runner 的拦截器

`sbs_agent/saturn/saturn_runner.go` 中注册了两个拦截器（interceptor），分别在消息任务和定时任务执行前对 context 进行预处理：

```go
func InitSaturnOptions() {
    chassisSaturn.InstallServerPlugin(
        chassisSaturn.WithInitFunc(func() error { return nil }),
        chassisSaturn.WithRunnerOpts(
            lib.WithCronJobInterceptor(saturnCronJobInterceptor),
            lib.WithMsgJobInterceptor(saturnMsgJobInterceptor),
        ),
    )
}
```

`saturnMsgJobInterceptor` 从 Saturn 消息头中提取重试标记（`X-Retry-Flag`），写入 context，下游 handler 可以通过 `ctxhelper.WithRetryTimes` 读取当前是第几次重试。这个设计让 handler 可以根据重试次数调整行为（比如第三次重试时不再调外部接口，直接告警）。

**Situation**：运营同事需要每天凌晨自动统计前一天的入库完成率并生成报表。

**Task**：在 `fbs_task` 进程中实现一个 Saturn 定时任务，并确保任务的幂等性和失败处理。

**Action**：
1. 定义定时任务 handler，在 Saturn 中注册并设置 cron 表达式（如 `0 2 * * *` 每天凌晨 2 点执行）。
2. handler 中查询前一天的 ASN 数据、计算完成率、生成报表记录写入 MySQL。
3. 基于“报表日期”字段实现幂等：如果当天报表已存在，跳过重新计算。
4. 为数据查询异常、报表写入冲突、部分 ASN 状态不完整等情况编写兜底逻辑。
5. 通过重试标记 `X-Retry-Flag` 区分首次执行和重试执行的不同行为。

**Result**：你能在一个真实仓库中注册并实现 Saturn 定时任务，处理幂等、失败和重试，并能在监控系统中验证任务执行结果。

## Saturn 任务的三项铁律

### 铁律一：幂等

同一个任务可能被执行多次。Saturn 平台在任务超时后可能重试，手动重放也可能触发重复执行。handler 不能假设“每次提交只执行一次”。

实现幂等的常见方式：基于业务唯一键（如订单号、ASN ID + timestamp、报表日期）在数据库中使用 `INSERT ... ON DUPLICATE KEY UPDATE` 或先 `SELECT` 检查状态再决定是否执行。主服务的 `fbs_task` 和 Tax 的定时任务中都能找到这类模式。

幂等不只是“防止重复插入”，也包括“重复执行不会产生副作用”。如果一个 handler 做了“发送邮件 + 更新状态 + 推送通知”，而幂等只保护了“更新状态”，邮件和通知可能在重试时再次发出。

### 铁律二：超时控制

Saturn handler 有执行超时限制，超时后平台会认为任务失败并可能重试。handler 内部必须传递 context：数据库查询、外部调用、缓存操作都应绑定同一个 context，以便超时信号可以传导到所有子操作。

如果 handler 内有一些不可取消的操作（如已经发出去了一个 HTTP 请求），超时后只能靠幂等保证重试不会产生错误结果。这是“防御层叠加”的思路，不是单靠超时就能保证正确性。

### 铁律三：返回语义

Handler 的返回值决定 Saturn 平台如何对待本次执行：

- 返回 `nil` 表示成功，平台通知任务完成。
- 返回 `error` 表示失败，平台根据任务配置决定是否重试和重试间隔。
- panic 被 recover 捕获后应当转换成 error 返回，而不是让进程直接崩溃。

关键细节：任务成功后平台不会再重试。如果你在 handler 里捕获了业务异常但返回了 `nil`，平台会认为任务完成。反过来，网络超时这种可能自愈的错误应该返回 error 让平台重试，而不是吞掉。

## 分片、批量与任务生命周期管理

### 分片执行

大量数据需要定时处理时，单实例串行处理可能耗时过长。Saturn 支持分片（sharding）：同一份任务按分片键（如 shop_id % N）分发到多个实例并行处理。每个实例只处理自己分片内的数据，避免多个实例重复处理同一份数据。

分片的难点不在框架配置，而在业务数据的分片键选择。选了 `shop_id`，同一个 shop 的数据一定落在同一个分片，适合需要事务性处理同一个卖家数据的场景。选了随机的分片键，数据会均匀分布，但不保证同一个业务实体的数据在同一分片内。

### 批量处理

定时任务常见模式是分页批量处理：

```go
for offset := 0; ; offset += batchSize {
    records, err := repo.FindPendingRecords(ctx, offset, batchSize)
    if len(records) == 0 { break }
    for _, record := range records {
        // 处理单条记录，使用 record.ID 保证幂等
    }
}
```

批量大小要在“单次执行时间”和“数据库查询频率”之间权衡。batchSize 太小，查询次数多；batchSize 太大，单批处理时间可能接近超时阈值。通常 100-500 是一个合理的起步值，根据实际数据量和执行时间调整。

### 任务的生命周期管理

一个 Saturn 任务从创建到下线通常经历的阶段：

1. 开发阶段：本地编译通过、单元测试覆盖正常路径和失败路径。
2. 测试环境部署：观察任务是否能被 Saturn 平台调度、handler 是否正常收到消息、执行日志是否完整。
3. 灰度上线：先在部分实例启用、小流量验证、监控执行耗时和错误率。
4. 全量上线：扩大分片或全量启用。
5. 监控运维：持续关注执行成功率、执行耗时 P99、告警触发情况。
6. 下线清理：业务变更后删除 handler 注册、清理对应的 Saturn job 配置和相关测试。

FBS 仓库中 `cmd/fbs_task/main.go` 的 `initNewTask()` 函数集中了大部分任务的初始化调用。增加或删除一个任务时，这里是要检查的入口点。不要以为删掉了 handler 源文件就等于下线了任务——注册入口还在，平台还在调度，只是 handler 找不到会报错。

## 三个仓库的 Task 进程差异

前端转后端的同学常常默认“一个仓库一个 task 进程”。实际上三个仓库的 task 进程结构差异很大，意味着你接手不同仓库的 Saturn 任务开发时，不能用一个模式套所有仓库。

### 主服务：fbs_task 的新旧架构并存

`cmd/fbs_task/main.go` 是三个仓库中最复杂的 task 入口。它同时承载了：

1. 通过 `initNewTask()` 注册的新架构定时任务和异步任务，按模块拆分的 `apps/*/access/{crontask,asynctask}` 目录
2. 旧 `SaturnHandler` 注册的基于 `taskType` 路由的 handler（已标记 Deprecated）
3. Kafka consumer 的注册（下一章会展开）
4. gRPC 服务端注册

新旧架构在同一个进程中并行运行，各自有独立的注册方式和 handler 签名。阅读代码时如果看到两套不同的 handler 风格，不要以为是项目不一致——它只是两个阶段的产物共存在同一个进程中。做改动时优先往新架构（`apps/*/access/` 下的独立 handler）添加，不要往 `SaturnHandler.HandlerMap` 里追加新的 taskType。

### 敏感数据服务：轻量 task 进程

敏感数据服务的 `cmd/task/main.go` 相对简洁。它的任务主要围绕 PII 数据的清理、审计日志归档和会话过期处理。由于敏感数据的特性，它的 handler 中对日志输出有更严格的控制，PII 字段不应出现在任务日志中。

### Tax 服务：tax_task 的独立进程

`fbs-tax-server/cmd/tax_task/main.go` 是一个独立的 task 进程。Tax 服务的定时任务和异步任务聚焦于发票生成、税务计算、对账和结算。它的任务数量不如主服务多，但每个任务涉及的数据量和执行时间通常更大。

跟主服务不同的是，Tax 的 task 进程有自己独立的 `conf/chassis.yaml` block（`tax_task:`），namespace 组合与 `tax_api` 不同。这可能导致同一个配置 key 在 API 进程和 task 进程中读出不同的值——排查配置问题时别忘了先确认当前进程订阅的 namespace。


## Saturn 与 Kafka 的边界：何时提交任务，何时发消息

这里提前建一个认知桥梁（下一章会详细展开 Kafka，但设计 Saturn 任务时必须知道这个边界）：

- Saturn 异步任务的语义是“我要你帮我做一件事”。上游提交任务后不关心任务何时完成，只要最终成功。
- Kafka 消息的语义是“某件事发生了，关心这件事的人自己处理”。上游发布事件后不知道有哪些消费者、也不期待消费者的处理结果反馈给上游。

如果把“订单创建”作为一个 Kafka 事件，对账模块消费后自行处理；如果把“为这个订单开发票”作为一个 Saturn 任务，订单创建后提交任务，任务 handler 专门处理发票生成。同一笔业务可能流动为“发一条 Kafka 消息 → consumer 消费 → 提交 Saturn 异步任务 → handler 执行”——这是 FBS 仓库中的真实链路，不是因为混乱，而是因为不同步骤有不同的可靠性要求。


## Saturn 任务的测试策略

任务 handler 的测试和 HTTP handler 的测试有几个关键差异。

**外部依赖的隔离**。任务 handler 通常依赖数据库、缓存和外部服务。测试时不能假设这些依赖真实可用，应通过 fake/mock 注入隔离。主服务的测试中使用了 table-driven test 模式，用 fake repository 和 fake client 替代真实依赖。

**幂等性的测试**。对同一个输入调用 handler 两次，验证第二次调用的结果和副作用与第一次一致。这需要 fake repository 能记录写入操作，在第二次调用时模拟“记录已存在”的情况。

**超时的测试**。使用 `context.WithTimeout` 创建一个短超时的 context 传给 handler，验证 handler 在超时后是否正确返回错误而不是挂起。注意：`go test` 本身有超时（默认 10 分钟），但 handler 级别的超时应该在测试代码中用 `context` 控制。

**重试的测试**。通过 `ctxhelper.WithRetryTimes` 在 context 中设置重试次数，验证 handler 在第 N 次重试时的行为是否与首次不同（比如跳过外部调用）。

主服务 `apps/inbound/asn/application/` 和 `cmd/fbs_task/` 下的 `*_test.go` 文件中可以找到真实的任务测试范例。注意不是所有仓库的 task handler 都有对应测试，现有的测试覆盖也不均匀。


## 练习

### 练习一：追踪一个真实 Saturn 任务

在 `sbs-fbs-server/apps/seller/shop_mgmt/access/crontask/` 中选一个定时任务，完成以下追踪：

1. 从 `initNewTask()` 找到该任务的注册位置。
2. 阅读 handler 代码，画出执行流程图。
3. 识别其中是否实现了幂等、超时和重试处理。如果没有，标记风险点。
4. 如果该任务执行失败，会影响哪些业务功能？

### 练习二：为 ASN 过期扫描设计 Saturn 任务

ASN 创建后如果 72 小时未完成入库，需要标记为“已过期”并通知卖家。

1. 设计定时任务的执行频率（cron 表达式）和分片策略。
2. 写出 handler 的伪代码，包含分页查询、逐条处理、幂等控制。
3. 设计任务的返回语义：哪些情况返回 nil（成功），哪些返回 error（需重试）？
4. 写出三条监控指标：任务执行成功率、单次执行耗时、过期 ASN 数量趋势。

### 练习三：Task 进程与 API 进程的协作

API 进程中的 HTTP handler 创建了一条新的 ASN，需要触发异步处理（如通知仓库管理系统）。

1. 设计异步任务的 payload 结构（至少包含 ASN ID 和操作时间戳）。
2. 写出 API 进程中提交异步任务的代码（使用 `saturn.Sender`）。
3. 写出 task 进程中接收和处理异步任务的 handler 代码。
4. 如果提交任务成功但 handler 执行失败（重试 3 次后仍然失败），设计补偿方案。


### 练习四：Saturn 任务故障诊断

以下是一个来自团队的故障报告：

> 事件：凌晨 3 点的“同步渠道配置”定时任务连续 3 天没有执行。
> 现象：3 天前任务改为每天凌晨 3 点执行后，只在改配置当天执行成功了一次，之后就再也没有执行记录。

1. 列出可能导致定时任务“只执行了一次”的原因（至少 4 种），包括代码层面、配置层面和平台层面。
2. 为每种原因设计验证方法（需要看什么日志、查什么配置、运行什么命令）。
3. 如果确认是 cron 表达式配置错误（写成了 `0 3 * * 1` 而不是 `0 3 * * *`），写出正确的 cron 表达式并解释两个表达式的区别。
4. 设计一个“任务执行监控”方案：什么指标能帮助你在任务漏执行的第一时间发现异常？


三个仓库的 Saturn 任务有一个共同特征值得注意：handler 的业务逻辑直接调用了 service 和 repository 层，而不是通过 HTTP 路由再次进入 API。这意味着 Saturn handler 和 HTTP handler 共享同一套 application 和 domain 层——对 service 逻辑的任何修改，可能同时影响同步接口和异步任务的行为。

这是 DDD 分层架构的一个好处：核心业务规则集中在 domain 和 application 层中，无论入口是 HTTP 还是 Saturn 消息，业务行为保持一致。但反过来说，如果你在 application 层加了一个“只有 HTTP handler 才会传这个参数”的假设，Saturn handler 可能因为这个参数为零值而进入异常分支。设计 application 层的接口时，需要确认它在 HTTP 和 Saturn 两种调用上下文中都能正常工作。


## 自检

1. 定时任务、异步任务和消息消费分别解决什么问题？三者在触发方式上的本质区别是什么？
2. Saturn 的 handler 注册有哪两种模式？新旧模式共存时应该优先使用哪种？
3. 幂等、超时和返回语义是 Saturn 任务的三项铁律。用你自己的话解释每条铁律的含义和违反后的后果。
4. 分片执行的业务意义是什么？分片键的选择依据是什么？
5. 一个 Saturn 任务从开发到下线的完整生命周期包含哪些阶段？

## 参考文献

- `sbs-fbs-server/cmd/fbs_task/main.go`：主服务 task 进程入口和任务初始化
- `sbs-fbs-server/sbs_agent/saturn/saturn_handler.go`：旧架构 Saturn handler（Deprecated）及幂等/重试/panic 处理
- `sbs-fbs-server/sbs_agent/saturn/saturn_runner.go`：Saturn 拦截器注册和消息头解析
- `fbs-sensitive-data-server/cmd/task/main.go`：敏感数据服务任务进程入口
- `fbs-tax-server/cmd/tax_task/main.go`：Tax 服务任务进程入口
- `Saturn平台使用指南（CN）.pptx`：Saturn 的 RPC/script/msg job 概念辅助，实际接口以代码为准