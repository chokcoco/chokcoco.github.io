# goroutine、channel、sync 与并发边界

> 预计学习时间：140–180 分钟
> 一句话总结：能阅读 Go 的 goroutine、channel、WaitGroup、Mutex 和 worker pool 模式——从 FBS 的异步批处理代码出发，识别数据竞争和 goroutine 泄漏，使用 race detector 和测试修复并发问题。

## 这一章解决什么问题

前端同学对异步编程并不陌生——Promise、async/await、事件循环是日常。但 Go 的并发模型和 JavaScript 完全不同。Go 的 goroutine 是真正并行运行的轻量级线程（Go runtime 调度到多个 OS 线程上），而不是单线程的事件循环。多个 goroutine 可以同时执行、同时访问共享内存——这比 JavaScript 的异步模型强大得多，也危险得多。

FBS 后端代码大量使用 goroutine 进行并发处理：批量入库的并行校验、异步任务的消息消费、worker pool 处理大量数据。这些代码如果不理解并发原语——goroutine、channel、Mutex、WaitGroup——完全看不懂。

> 本章基于 `sbs-fbs-server` 的 release 分支（2026-07-20）。Tax 仓的 Go 1.15 不支持部分并发工具，已标注差异。

## goroutine：轻量级并发执行

### 启动 goroutine

```go
go doWork()           // 新 goroutine 中执行
go func() {
	fmt.Println("concurrent")
}()
```

`go` 关键字启动一个新的 goroutine。goroutine 非常轻量——一个 Go 程序可以轻松创建数万个 goroutine，每个只需要几 KB 栈空间。Go runtime 负责将 goroutine 调度到操作系统线程上执行。

**前端类比**：Go 的 `go fn()` ≈ JavaScript 的 `setTimeout(fn, 0)`（但不是完全相同）。区别是 JavaScript 的 setTimeout 在事件循环的下一个 tick 执行，仍在主线程上；Go 的 goroutine 可能真正并行执行在不同的 OS 线程上。

### goroutine 泄漏

```go
func leak() {
	go func() {
		// 这个 goroutine 永远不会退出——泄漏
		for { /* 无限循环 */ }
	}()
}
```

如果一个 goroutine 被阻塞且永远无法继续（等待一个永远不会关闭的 channel，等待一个永远不会返回的锁），它会一直占用内存。FBS 的长时间运行服务需要监控 goroutine 数量——持续增长通常意味着泄漏。

**前端类比**：Go 的 goroutine 泄漏 ≈ JavaScript 中忘记 clearInterval 或 removeEventListener。两者都导致资源持续占用。

## channel：goroutine 之间的通信

### channel 的创建和使用

```go
ch := make(chan int)        // 无缓冲 channel——同步
ch := make(chan int, 10)    // 有缓冲 channel——缓冲 10 个

ch <- 42                    // 发送
value := <-ch               // 接收
close(ch)                   // 关闭——发送方通知接收方"不会再有数据了"
```

channel 是 Go 的"管道"——goroutine 通过它发送和接收数据。无缓冲 channel 要求发送方和接收方同时就绪（同步），有缓冲 channel 允许发送方在缓冲未满时继续执行（异步）。

**前端类比**：Go 的 channel ≈ 前端的消息队列或 EventEmitter。区别是 Go 的 channel 是类型安全的（`chan int` 只能传 int）、编译时检查、并且内置了关闭语义。

### select：多路复用

```go
select {
case msg := <-ch1:
	handle(msg)
case msg := <-ch2:
	handle(msg)
case <-ctx.Done():
	return ctx.Err()  // 上下文取消
case <-time.After(5 * time.Second):
	return errors.New("timeout")
}
```

`select` 等待多个 channel 操作中的任意一个就绪。如果多个同时就绪，随机选一个。`select` 是 Go 并发编程的核心——超时控制、取消传播、多路复用都通过它实现。

**前端类比**：Go 的 `select` ≈ JavaScript 的 `Promise.race([p1, p2, timeout])`。区别是 Go 的 select 是语言级特性，可以同时等待 channel 接收和超时等操作。

### 单向 channel

```go
func producer(out chan<- int) { out <- 42 }     // 只能发送
func consumer(in <-chan int) { val := <-in }    // 只能接收
```

单向 channel 在函数签名中明确表达意图——producer 只能发送，consumer 只能接收。FBS 代码中常见这个模式，防止误用。

## 同步原语

### sync.WaitGroup

```go
var wg sync.WaitGroup
for _, item := range items {
	wg.Add(1)
	go func(item Item) {
		defer wg.Done()
		process(item)
	}(item)
}
wg.Wait()  // 等待所有 goroutine 完成
```

WaitGroup 用于等待一组 goroutine 完成。`Add(1)` 增加计数，`Done()`减少计数，`Wait()` 阻塞直到计数归零。FBS 的批量处理代码中大量使用这个模式。

**前端类比**：Go 的 WaitGroup ≈ JavaScript 的 `Promise.all(promises)`。`wg.Add(1)` + `wg.Done()` ≈ 创建一个 Promise 并 resolve 它；`wg.Wait()` ≈ `await Promise.all(...)`。

### sync.Mutex

```go
var mu sync.Mutex
var counter int

func increment() {
	mu.Lock()
	defer mu.Unlock()
	counter++
}
```

Mutex 保护共享数据的并发访问。Go 标准库还有 `sync.RWMutex`（读写锁——多个 reader 可以同时持有，writer 独占）。

**前端类比**：Go 的 Mutex ≈ 前端的 Mutex（在 Web Workers 中）。区别是 JavaScript 主线程是单线程的，通常不需要 Mutex——除非使用 SharedArrayBuffer + Atomics。

### sync.Once

```go
var once sync.Once
func getInstance() *Service {
	once.Do(func() {
		instance = initService()
	})
	return instance
}
```

确保函数只执行一次——即使多个 goroutine 同时调用。FBS 中用于单例初始化和懒加载。

## worker pool 模式

### 固定数量的 worker 处理任务

```go
func workerPool(tasks <-chan Task, results chan<- Result, count int) {
	var wg sync.WaitGroup
	for i := 0; i < count; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for task := range tasks {
				results <- process(task)
			}
		}()
	}
	wg.Wait()
	close(results)
}
```

这个模式在 FBS 的异步批处理中常见——固定 N 个 worker 从 channel 中消费任务，处理结果写入另一个 channel。主 goroutine 等待全部完成后汇总结果。

### 有界并发

```go
sem := make(chan struct{}, 10)  // 最多 10 个并发
for _, url := range urls {
	sem <- struct{}{}
	go func(u string) {
		defer func() { <-sem }()
		fetch(u)
	}(url)
}
```

使用有缓冲 channel 作为信号量——限制同时运行的 goroutine 数量。FBS 中调用外部 API 时常用这个模式做限流。

## 数据竞争与 race detector

### 数据竞争示例

```go
var counter int
go func() { counter++ }()  // 写
go func() { counter++ }()  // 同时写——数据竞争
```

Go 的 race detector 可以检测运行时数据竞争：

```bash
go test -race ./...
go build -race
```

FBS 的并发代码必须通过 race detector 检查——任何数据竞争都是 bug。race detector 会报告竞争发生的具体位置。

**前端类比**：Go 的 race detector ≈ 前端的 TypeScript strict mode + ESLint——编译时/测试时发现问题。区别是 Go 的 race detector 在运行时动态检测，需要实际触发并发执行才能发现竞争。

### 竞争修复

```go
var mu sync.Mutex
var counter int

func increment() {
	mu.Lock()
	counter++
	mu.Unlock()
}
```

所有对共享数据的并发访问必须被 Mutex 保护，或使用 channel 通信代替共享内存。

## FBS 中的并发模式

### 主服务的异步任务

`sbs-fbs-server` 的 `workerpool/` 或 `async/` 目录包含异步处理模式。典型场景：批量入库时并行校验 SKU 信息，使用 goroutine + WaitGroup + channel 收集校验结果。

### Saturn 任务的并发

BE-A03 会详细讲 Saturn 定时任务。现在只需要知道：Saturn 任务可能以并发模式执行，多个实例同时处理不同分片。任务内部的 goroutine 安全同样需要 Mutex 保护共享状态。

### Tax 仓库的并发限制

Tax（Go 1.15）不支持 `sync.Map` 的某些方法、部分 channel 优化。并发代码在 Tax 中需要更谨慎——优先使用 Mutex + 普通 map 而非 `sync.Map`。

## 常见错误

### goroutine 泄漏（进阶）

```go
ch := make(chan int)
go func() { ch <- 42 }()  // 没人接收——goroutine 永久阻塞
```

### 关闭已关闭的 channel

```go
close(ch)
close(ch)  // panic: close of closed channel
```

### 忘记 WaitGroup.Done

```go
wg.Add(1)
go func() {
	// 忘记 wg.Done()——WaitGroup 永远不会归零
}()
wg.Wait()  // 永久阻塞
```

## 并发模式对比：JavaScript vs Go

### 单线程事件循环 vs 多线程 goroutine

JavaScript 的异步是"一个厨师快速切换做多道菜"——事件循环在一个线程上调度任务、Promise 的 then 回调在微任务队列中按序执行。Go 的并发是"多个厨师同时做多道菜"——多个 goroutine 在多个 OS 线程上真正并行执行。

| 维度 | JavaScript | Go |
| --- | --- | --- |
| 并发模型 | 单线程 + 事件循环 | 多线程 goroutine |
| 数据共享 | 不需要锁（单线程） | 需要 Mutex/channel |
| 错误隔离 | try/catch + Promise rejection | error 返回值 + panic/recover |
| 取消机制 | AbortController | context.Context |
| 并发数量 | 受事件循环限制 | 可创建数万个 goroutine |
| CPU 密集型 | 阻塞主线程（需要 Web Worker） | 自动多核并行 |

### Promise.all vs WaitGroup + channel

```javascript
// JavaScript
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
```

```go
// Go
var wg sync.WaitGroup
results := make(chan Result, 3)
for _, fn := range []func() Result{fetchA, fetchB, fetchC} {
	wg.Add(1)
	go func(f func() Result) { defer wg.Done(); results <- f() }(fn)
}
wg.Wait()
close(results)
// 从 results channel 收集结果
```

Go 的写法更长，但它让你明确控制"何时等待、何时收集、何时关闭"。JavaScript 的 Promise.all 更简洁但隐藏了这些细节——如果三个 fetch 中有一个 reject 且你没 catch，整个 Promise.all 的 rejection 可能丢失。

### Web Worker vs goroutine

JavaScript 的 Web Worker 是真正的并行——和 goroutine 最接近的前端概念。但 Web Worker 不能访问 DOM、不能共享变量（只能通过消息传递数据）。Go 的 goroutine 可以共享内存——这是 goroutine 更强大也更危险的原因。


## FBS 中的 worker pool 实战

### 批量入库的并发校验

在 FBS 的入库模块中，创建入库单时需要校验每个 SKU 的合法性。如果一次提交 200 个 SKU，串行校验需要 5 秒（每个 25ms），10 个 worker 并发校验只需 0.5 秒：

```go
func ValidateSKUs(ctx context.Context, skus []SKU) ([]SKUResult, error) {
	tasks := make(chan SKU, len(skus))
	results := make(chan SKUResult, len(skus))
	var wg sync.WaitGroup
	workers := 10
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for sku := range tasks {
				result := validateSKU(ctx, sku)
				results <- result
			}
		}()
	}
	for _, sku := range skus { tasks <- sku }
	close(tasks)
	wg.Wait()
	close(results)
	var validated []SKUResult
	for r := range results { validated = append(validated, r) }
	return validated, nil
}
```

关键点：有缓冲 channel 避免 worker 阻塞；先发任务再关 tasks channel；WaitGroup 确保所有 worker 完成后再关 results channel。

### context 取消传播到 worker

在上面的例子中加入 context 支持：

```go
select {
case task, ok := <-tasks:
	if !ok { return }
	result := validateSKU(ctx, task)
	select {
	case results <- result:
	case <-ctx.Done():
		return
	}
case <-ctx.Done():
	return
}
```

如果 context 取消了（超时），worker 退出——不会继续处理剩余任务。results channel 可能不完整，调用方需要处理部分结果。


## 并发安全的缓存模式

### sync.Map vs Mutex + map

```go
// Mutex + map：简单的并发安全缓存
type Cache struct {
	mu    sync.RWMutex
	items map[string]Item
}

func (c *Cache) Get(key string) (Item, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	item, ok := c.items[key]
	return item, ok
}

func (c *Cache) Set(key string, item Item) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.items[key] = item
}
```

`sync.Map` 适合"键值对稳定、读多写少"的场景。FBS 中简单的缓存用 Mutex + map，复杂场景用 Redis。

### 并发安全的单例初始化

```go
var (
	instance *Service
	once     sync.Once
)

func GetService() *Service {
	once.Do(func() { instance = initService() })
	return instance
}
```

这个模式在 FBS 的 Wire 初始化中隐式保证——Wire 生成的代码确保每个依赖只创建一次。


## 死锁识别与避免

### 常见死锁场景

```go
// 死锁：无缓冲 channel 上 send 但没有 receiver
ch := make(chan int)
ch <- 1  // 永久阻塞

// 死锁：两个 goroutine 相互等待
// goroutine A: lock A, wait for B
// goroutine B: lock B, wait for A
```

### 避免死锁的原则

1. 固定锁的获取顺序——如果两个 Mutex 都需要，总是先锁 A 再锁 B。
2. 使用 `defer Unlock()` 确保锁总是被释放。
3. 避免在持有锁时调用外部函数——你不知道外部函数会不会也要锁。
4. 使用带超时的 channel 操作——`select` + `time.After` 代替裸 send/receive。


## 从事件循环到 goroutine：思维转变

### 不再有"主线程"概念

前端开发中，你习惯了"主线程做 UI 渲染，异步任务通过事件循环调度"。Go 中没有"主线程"的概念——所有 goroutine 都是平等的。`main` 函数运行在主 goroutine 中，但主 goroutine 退出后整个程序退出——这和 JavaScript 完全不同（Node.js 等待事件循环清空才退出）。

### 同步代码不阻塞"别人"

在 JavaScript 中，一个 `while(true){}` 会冻结整个页面。在 Go 中，一个 goroutine 里的无限循环只阻塞那个 goroutine——其他 goroutine 继续运行。这个自由意味着你可以在代码中写同步逻辑，只要不阻塞共享资源。

### channel 思维 vs Promise 思维

JavaScript 的 Promise 是"值"——`.then(fn)` 对值做变换。Go 的 channel 是"管道"——数据在 goroutine 之间流动。两者的思维模型不同：Promise 链式处理同一个值的变换，channel 传递不同的值到不同的处理者。


### 并发下载器

写一个程序，并发下载 10 个 URL 的内容。限制最大并发数为 3。记录每个 URL 的下载大小和耗时。按下载时间排序输出结果。

### goroutine 泄漏检测

写一个可能造成 goroutine 泄漏的程序（channel 永远无人接收）。使用 `runtime.NumGoroutine()` 在程序运行前后对比 goroutine 数量。

### 总结

Go 的并发模型比 JavaScript 强大——真正的并行、可管理数万个 goroutine、通过 channel 实现 CSP 模式。但也更危险——数据竞争、死锁、goroutine 泄漏。FBS 的并发代码需要严格的 race detector 检查和充分的测试覆盖。从 JavaScript 转到 Go，适应并发模型不是学语法——是学一种新的思考方式：不再依赖事件循环的调度顺序，而是显式管理 goroutine 的生命周期和数据访问。





## 实际代码走读：sbs-fbs-server 中的并发代码

### 异步任务入口

在 `sbs-fbs-server/cmd/fbs_task/main.go` 中，任务进程启动时创建多个 goroutine 分别消费不同类型的消息。每个 goroutine 独立运行，通过 channel 接收消息、通过 Mutex 保护共享状态、通过 context 接收关闭信号。这是 FBS 中 goroutine 和 channel 最具代表性的使用场景。

### 生产级 goroutine 管理

FBS 的生产代码中，每个 goroutine 都有明确的退出路径——通过 context 取消或 channel 关闭。没有"永远运行"的 goroutine。启动 goroutine 的地方一定有对应的关闭逻辑。这是一个重要的工程习惯：创建 goroutine 时，必须想好它什么时候退出。

### 并发测试

FBS 的并发测试使用 `go test -race` 在 CI 中运行。race detector 会检测所有数据竞争。如果 PR 有未加锁的并发访问，CI 会直接失败。写 FBS 的并发代码时，本地开发和提交 MR 之前至少跑一次 `go test -race`。


## 还有哪些没讲到

Go 的并发工具箱远不止本章的内容。`context` 的完整用法（BE-L06）、`sync.Pool`（对象池）、`atomic` 包（无锁原子操作）、`errgroup`（并发错误收集）——这些在 FBS 代码中也有使用，但本章聚焦于最核心的 goroutine/channel/Mutex/WaitGroup/worker pool。掌握这些基础后，其他并发原语可以通过阅读标准库文档快速上手。


## 从 JavaScript 异步到 Go 并发：方法论的转变

学完本章后，你应该能回答这个问题："什么时候用 goroutine + channel，什么时候用 async/await？" 答案是：**它们解决的是不同层面的问题。** JavaScript 的 async/await 解决的是单线程中的非阻塞 I/O——不让一个慢速请求阻塞 UI。Go 的 goroutine + channel 解决的是多核 CPU 的并行计算和分布式系统的通信模型。当你从前端转到后端时，不要把 Go 的 goroutine 当成"前端的 async/await 的替代品"——它们是不同维度的工具，解决不同维度的问题。

FBS 的代码忠实地反映了这个区别：I/O 密集的 HTTP handler 不需要 goroutine（请求已经在一个 goroutine 中了），CPU 密集的批量计算需要 goroutine + worker pool。理解这个区别，是你从前端开发者转变为全栈工程师的关键一步。

## 总结与展望

模块四的七章构成了 Go 语言和标准库的完整基础。从前端转到后端，最难的不是学新语法——是适应一种不同的思维方式。JavaScript 教你等待——await 等待 Promise、事件循环等待下一个 tick。Go 教你管理——管理 goroutine 的生命周期、管理共享数据的访问、管理错误的传播路径。

接下来的模块五将把这些语言基础应用到 FBS 的实际工程中——Chassis 框架的 HTTP 路由、Wire 依赖注入的完整接线、数据库操作、服务调用和生产级并发。你在模块四中建立的肌肉记忆（每个函数返回 error、defer 确保清理、context 贯穿始终、并发访问必须加锁）将贯穿后续所有章节。


## 并发编程的测试与调试实践

### 使用 race detector

Go 的 race detector 是并发代码的第一道防线。它通过在编译时注入额外的检测代码，在运行时监控所有内存访问。如果有两个 goroutine 同时访问同一块内存且至少一个是写操作，race detector 会报告完整的堆栈信息：

```bash
go test -race -run TestConcurrent ./...
```

FBS 的 CI 流水线中应该始终启用 race detector——任何数据竞争都会导致构建失败。

### 模拟竞争条件

测试并发代码时，不要只跑一次——用 `-count=N` 多次运行增加发现竞争的概率：

```bash
go test -race -count=100 -run TestConcurrent
```

### goroutine 泄漏检测（进阶）

在测试的 cleanup 阶段检查 goroutine 数量是否回归：

```go
func TestNoLeak(t *testing.T) {
	before := runtime.NumGoroutine()
	runFeature()
	time.Sleep(100 * time.Millisecond) // 等待清理
	after := runtime.NumGoroutine()
	if after > before {
		t.Errorf("goroutine leak: %d -> %d", before, after)
	}
}
```

### channel 操作的正确关闭

关闭 channel 是发送方的责任，不是接收方的。接收方只能通过 `val, ok := <-ch` 检测 channel 是否已关闭。试图向已关闭的 channel 发送数据会 panic，关闭已关闭的 channel 也会 panic。在 FBS 代码中，channel 的生命周期通常是：创建 → 发送方发送数据 → 发送方 close → 接收方 for range 读取直到 channel 关闭。

### context 与 goroutine 的一致性原则

每个长期运行的 goroutine 都应该接收一个 context.Context 参数，并在 `ctx.Done()` 时退出。这不是可选的——这是 Go 社区的硬性约定。如果 goroutine 不响应 ctx 取消，超时控制失效、优雅关闭失效、资源泄漏。

FBS 的代码严格遵守这个约定：从 HTTP handler 创建的 goroutine 继承 handler 的 context，Saturn 任务创建的 goroutine 继承任务的 context，worker pool 的 worker 接收 context 并在取消时停止处理。

### 从理论到实践

在进入模块五之前，建议你在 `sbs-fbs-server` 中完成以下练习：

1. 找到 `cmd/fbs_task/main.go`，观察 goroutine 的创建和 context 的使用。
2. 搜索 `sync.WaitGroup`、`sync.Mutex` 的使用——它们在哪些模块中、保护了什么共享数据。
3. 运行 `go test -race ./...` 中的并发相关测试，观察 race detector 的输出格式。
4. 试着修改一个并发代码片段，故意引入数据竞争，看 race detector 如何报告。

这些练习不需要实际运行——仅通过阅读和理解代码，你就能建立 Go 并发编程的直觉。结合本章前半部分的讲解，你应该已经具备读懂 FBS 中任何并发代码的能力。

## 练习

### 并发计数器

写一个程序，启动 100 个 goroutine，每个将计数器增加 1000 次。使用 Mutex 保护计数器。最终计数应为 100000。

### worker pool

实现一个简单的 worker pool：10 个 worker 处理 100 个任务。每个任务随机休眠 10-100ms。记录总处理时间，并与串行处理对比。

### 参考答案

**8.1**：`var mu sync.Mutex; var count int; for i:=0; i<100; i++ { wg.Add(1); go func() { defer wg.Done(); for j:=0; j<1000; j++ { mu.Lock(); count++; mu.Unlock() } } }; wg.Wait()`
## 参考文献

- [Go Spec: Go statements](https://go.dev/ref/spec#Go_statements)
- [Go Spec: Channel types](https://go.dev/ref/spec#Channel_types)
- [Go Spec: Select statements](https://go.dev/ref/spec#Select_statements)
- [Go Blog: Share Memory By Communicating](https://go.dev/blog/codelab-share)
- [sync package](https://pkg.go.dev/sync)
- [Go Blog: Race Detector](https://go.dev/blog/race-detector)