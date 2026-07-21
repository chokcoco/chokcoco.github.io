# error、defer、panic/recover 与资源生命周期

> 预计学习时间：130–170 分钟
> 一句话总结：能区分 Go 的业务错误、包装错误、panic 与恢复——理解 FBS 的 `errcode/*` 错误码体系，正确关闭资源、回滚事务并保留错误上下文，修复一个吞错或 defer 次序问题。

## 这一章解决什么问题

前端同学处理错误的方式通常是 `try/catch`——捕获、打印、有时静默吞掉。Go 的错误处理更严格也更显式：每个可能出错的函数都返回 error，调用方必须检查它、决定怎么处理。不检查 error 是 bug；检查了但处理不当（如吞错、丢失上下文、资源泄漏）也是 bug。

FBS 的 `errcode/` 包定义了完整的业务错误码体系，`errors.Is` 和 `errors.As` 用于错误类型判断，`defer` 确保资源总是被释放——这些机制共同构成了 Go 代码的可靠性基石。

> 本章基于 `sbs-fbs-server` 的 release 分支（2026-07-20）。

## Go 的错误：值不是异常

### 错误是普通值

```go
func FindByID(id int) (*InboundRequest, error) {
	if id <= 0 {
		return nil, fmt.Errorf("invalid id: %d", id)
	}
	// ...查询数据库
	return &result, nil
}

req, err := FindByID(1001)
if err != nil {
	// 处理错误
	return err
}
// 使用 req
```

Go 的 error 只是一个实现了 `Error() string` 方法的普通接口。它不像 JavaScript 的 `throw` 那样会中断调用栈——error 是返回值的一部分，调用方必须主动检查。

**前端类比**：Go 的 `val, err := fn()` ≈ TypeScript 的 `const [val, err] = await maybeFail()` 或 Rust 的 `Result` 类型。区别是 Go 没有 `try/catch` 式的异常处理——所有错误都通过返回值传递，调用方必须处理每一个。

### 错误检查的常见模式

```go
// 立即返回错误
if err != nil { return err }

// 包装错误，添加上下文
if err != nil { return fmt.Errorf("find request %d: %w", id, err) }

// 记录日志后降级
if err != nil {
	log.Printf("cache miss: %v", err)
	return dbQuery()  // 降级到数据库查询
}

// 返回哨兵错误
var ErrNotFound = errors.New("not found")
if err != nil { return ErrNotFound }
```

**前端类比**：Go 的 `fmt.Errorf("...: %w", err)` ≈ JavaScript 的 `throw new Error("...", { cause: err })`。`%w` 包装错误并保留原始错误链。`errors.Is(err, ErrNotFound)` ≈ `err instanceof NotFoundError`。

## FBS 的错误码体系

### errcode 包的结构

FBS 的 `errcode/` 包定义了按模块分类的错误码常量。每个业务错误有一个唯一的数字码、一条面向用户的错误消息、以及对应的翻译 key（用于前端展示）。

```go
// 简化示例
const (
	ErrInboundNotFound = 30001  // 入库单不存在
	ErrInvalidStatus   = 30002  // 状态无效
	ErrDuplicateRequest = 30003 // 重复提交
)

var errMsg = map[int]string{
	ErrInboundNotFound: "inbound request not found",
	ErrInvalidStatus:   "invalid status transition",
	ErrDuplicateRequest: "duplicate request",
}

func New(code int) error {
	return &BusinessError{Code: code, Message: errMsg[code]}
}
```

handler 返回错误时，Chassis 中间件会读取 `BusinessError` 的 Code 并转换为 HTTP 响应中的 `retcode` 字段。前端通过 `retcode` 判断业务成功/失败并展示对应的错误翻译。

### 业务错误 vs 系统错误

| 类型 | 示例 | HTTP 状态码 | 前端处理 |
| --- | --- | --- | --- |
| 业务错误 | "入库单不存在"、 "状态不允许修改" | 200 + 非零 retcode | 展示错误消息 + 可能重试 |
| 参数错误 | "pageNo 必须大于 0" | 400 | 前端表单校验 |
| 鉴权错误 | "无权限" | 401 | 跳转登录 |
| 系统错误 | "数据库连接失败" | 500 | 统一错误页 |

FBS 的 Chassis 中间件负责将不同类型的错误映射到合适的 HTTP 状态码和响应体格式。

## defer：资源管理的保证

### defer 的执行时机

`defer` 注册的函数在包围它的函数返回前执行——无论函数是正常返回还是 panic：

```go
func processFile(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()  // 确保文件总是被关闭

	// 处理文件内容...
	return nil
}
```

**前端类比**：Go 的 `defer` ≈ JavaScript 的 `try { ... } finally { cleanup() }`。`defer f.Close()` ≈ `finally { file.close() }`。区别是 Go 的 defer 在函数开头声明，在函数结尾执行——清理代码和分配代码紧挨着，不会遗漏。

### defer 的执行顺序

多个 defer 按 LIFO（后进先出）顺序执行：

```go
defer fmt.Println("1")
defer fmt.Println("2")
defer fmt.Println("3")
// 输出：3, 2, 1
```

这在实际代码中用于控制资源释放顺序——后获得的资源先释放：

```go
tx, _ := db.Begin()
defer tx.Rollback()  // 先注册

rows, _ := tx.Query("...")
defer rows.Close()    // 后注册——先于 Rollback 执行
```

### defer 与返回值

defer 可以修改命名返回值：

```go
func process() (err error) {
	f, _ := os.Open("file")
	defer func() {
		if closeErr := f.Close(); closeErr != nil && err == nil {
			err = closeErr  // 将关闭错误作为返回值
		}
	}()
	// ...
	return nil
}
```

在 FBS 的事务代码中，defer 常用于捕获 panic、设置返回错误、确保事务回滚。

## panic 与 recover

### panic 是程序崩溃

```go
panic("something went wrong")  // 程序崩溃，打印堆栈
```

Go 的 panic 类似 JavaScript 的 `throw new Error()`——它会立即中断当前函数并沿调用栈向上传播。但 Go 中通常只在不可恢复的错误场景（如数组越界、nil 指针解引用）才触发 panic。业务逻辑错误应该返回 error，不应该 panic。

**前端类比**：Go 的 `panic/recover` ≈ JavaScript 的 `throw/catch`。区别是 Go 社区强烈不推荐用 panic 做正常流程控制——panic 是"真的出大事了"的信号。

### recover 捕获 panic

```go
func safeCall() (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic recovered: %v", r)
		}
	}()
	mayPanic()
	return nil
}
```

FBS 的 Chassis 中间件在最外层注册了 recover，防止单个请求的 panic 导致整个服务崩溃。HTTP handler 中的 panic 会被中间件捕获，转换为 500 响应返回，不会杀死进程。但 goroutine 中的 panic 如果不 recover，会直接导致进程退出——这是 Go 的 fail-fast 设计。

### 什么场景才用 panic

在 FBS 代码中，panic 通常只出现在以下场景：

- 程序初始化阶段（依赖缺失直接退出比带病运行更安全）。
- 编程错误（传入不可能为 nil 的参数但确实为 nil——这是 bug，应该暴露）。
- 不可恢复的运行时错误（如从错误码到消息的映射缺少某个 code——这是代码 bug）。

业务逻辑中的任何错误都应该返回 error，不要用 panic。

## 资源生命周期管理

### 文件、连接和事务

```go
func handler(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil { return err }
	defer tx.Rollback()  // 默认回滚

	// ...业务操作...

	return tx.Commit()     // 成功时提交，defer 的 Rollback 是无操作
}
```

这个模式在 FBS 的事务代码中反复出现：先 defer rollback，最后 commit。如果中间任何步骤出错返回，defer 确保事务被回滚。如果一切正常，commit 之后 rollback 调用安全（事务已结束，rollback 是空操作）。

### 错误包装与上下文

```go
func (s *service) GetIrDetail(ctx context.Context, id int) (*InboundRequest, error) {
	req, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get inbound request %d: %w", id, err)
	}
	return req, nil
}
```

`%w` 包装错误，`errors.Is(err, ErrNotFound)` 可以穿透包装层判断原始错误类型：

```go
if errors.Is(err, ErrNotFound) {
	// 返回 404
} else {
	// 返回 500
}
```

在 FBS 代码中，service 层通常会包装 repository 返回的错误，添加业务上下文；handler 层根据错误类型决定 HTTP 状态码和响应格式。

## 常见错误

### 吞错

```go
req, _ := repo.FindByID(ctx, id)  // 忽略 error
// req 可能是 nil——后续代码会 panic
```

### defer 中修改错误未捕获

```go
func copyFile() error {
	src, _ := os.Open("src")
	defer src.Close()  // 错误被静默丢弃
	// ...
}
```

正确写法：在 defer 中显式捕获关闭错误。

### panic 恢复后未记录日志

```go
defer func() {
	if r := recover(); r != nil {
		// 什么都不做——panic 被静默吞掉了
	}
}()
```

至少应该记录日志或返回错误给调用方。

## error 与 TypeScript/JavaScript 的错误处理对比

### throw/catch vs error 返回值

JavaScript 的错误处理是"异常"模式——函数可以不声明可能抛出的错误，调用方可以选择不 catch。Go 的模式是"错误作为返回值"——每个函数的签名明确定义了可能出错，调用方必须显式处理。

| 场景 | JavaScript/TypeScript | Go |
| --- | --- | --- |
| 函数可能失败 | 没有签名层面的标记 | 返回 `(Result, error)` |
| 必须处理错误 | 可以忽略——错误会向上传播 | 必须检查——不检查是 bug |
| 错误类型判断 | `instanceof` | `errors.Is` / `errors.As` |
| 错误上下文 | `cause` 属性（ES2022+） | `%w` 包装 |
| 资源清理 | `finally` | `defer` |
| 致命错误 | `throw new Error()` | `panic` |

### async/await vs Go 的错误处理

```javascript
// JavaScript
const req = await repo.findById(id);  // 可能 throw
```

```go
// Go
req, err := repo.FindByID(ctx, id)
if err != nil { return nil, err }
```

前端同学可能会觉得 Go 的 `if err != nil` 很啰嗦。但在写了大量异步代码后你会发现：Go 的显式错误处理不是负担——它让你在写每一行代码时都必须考虑"这个操作会失败吗"。而 JavaScript 中 `await fn()` 可能随时 throw，你只能靠 try/catch 笼统地捕获——或者（更常见的）忘记 catch。

### 错误处理哲学差异

Go 社区有一个共识：**错误是常态**。文件找不到、网络超时、数据库连接断开——这些不是"异常"，是分布式系统的日常。Go 的显式 error 返回值让你被迫面对这个现实。JavaScript 的 try/catch 模式倾向于"先假设一切顺利，出问题了再说"——这在原型开发中可能更快，但在生产系统中会导致未被捕获的错误。


## FBS 中的事务和 defer 实战

### FBS 入仓事务的简化示例

```go
func (s *service) CreateInbound(ctx context.Context, req *CreateReq) (id int, err error) {
	tx, err := s.db.Begin()
	if err != nil { return 0, fmt.Errorf("begin tx: %w", err) }
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	id, err = s.repo.InsertHeader(tx, req.Header)
	if err != nil { return 0, fmt.Errorf("insert header: %w", err) }

	err = s.repo.InsertItems(tx, id, req.Items)
	if err != nil { return 0, fmt.Errorf("insert items: %w", err) }

	err = tx.Commit()
	if err != nil { return 0, fmt.Errorf("commit: %w", err) }
	return id, nil
}
```

分析：defer 确保如果函数以 error 返回，事务一定被回滚。如果 commit 成功，函数返回 nil error，defer 不执行 Rollback。三个 insert 步骤中任何一个失败，函数立即返回 error，defer 触发回滚。

### 命名返回值的陷阱

```go
func bad() (err error) {
	tx, _ := db.Begin()
	defer tx.Rollback()  // 总是执行——即使是 commit 后也是空操作
	return tx.Commit()    // err 可能为 nil
}
```

这个写法有问题：`tx.Rollback()` 总在执行——如果 commit 成功，rollback 是无操作（安全但多余）。如果 commit 失败，rollback 也是无操作（因为 commit 已经尝试提交，数据库已经决定了结果）。正确的写法是在 defer 中检查命名返回值 error。


## 从错误处理到可观测性

### 错误日志的结构化

在 FBS 中，错误不只是返回给调用方——还需要记录到日志和监控系统。一个典型的错误处理包含三个动作：

```go
if err != nil {
	logger.Error("create inbound failed", "id", id, "error", err)  // 日志
	metrics.Counter("inbound.create.error").Inc()                   // 监控指标
	return fmt.Errorf("create inbound %d: %w", id, err)             // 返回带上下文的错误
}
```

**前端类比**：Go 的错误处理 + 日志 ≈ 前端的 `console.error()` + Sentry/Bugsnag 上报。区别是 Go 的日志是结构化的（键值对），且错误必须同时返回给调用方——不只是"记录一下"。

### Panic 恢复后必须留下痕迹

Chassis 中间件的 recover 捕获 panic 后，至少会做两件事：记录完整的堆栈到日志、返回 HTTP 500。如果代码自己 recover 了一个 panic，必须记录日志或返回 error——否则这个故障就"消失"了，你永远不知道它发生过。


## defer 进阶：闭包陷阱

```go
func bad() {
	for i := 0; i < 3; i++ {
		defer func() { fmt.Print(i) }()  // 输出 3, 3, 3
	}
}

func good() {
	for i := 0; i < 3; i++ {
		defer func(val int) { fmt.Print(val) }(i)  // 输出 2, 1, 0
	}
}
```

defer 注册的函数捕获了变量 `i` 的引用——不是值。当 defer 执行时，循环已经结束，`i` 已经变成 3。正确的做法是将当前值作为参数传入——参数按值传递，捕获的是那一刻的值。

这个陷阱在 JavaScript 中也存在——`setTimeout(() => console.log(i), 0)` 在 `var` 循环中输出最终值。两个语言的解决方案也是一样的：用函数参数捕获当前值或用 `let`。


## FBS 仓库中的实际错误处理模式

### 主服务的统一错误响应

在 `sbs-fbs-server` 中，handler 返回 error 后，Chassis 中间件 `controller_handle.go` 负责将 error 转换为统一的 HTTP 响应格式。你不需要在每个 handler 中写 JSON 序列化——中间件做了这件事。handler 只需返回 error，中间件处理 HTTP 层面的响应。

### 敏感数据服务的错误边界

`fbs-sensitive-data-server` 处理 PII 数据时，错误处理更加严格——不允许在错误消息中泄露任何敏感信息。即使是"用户不存在"这样的错误，也需要确保返回的信息不会暴露系统中是否存在这个用户（防止枚举攻击）。

### Tax 仓库的 recovery 中间件

Tax 仓库包含 recovery 中间件，在 HTTP 层面捕获 panic 并转换为结构化的错误响应。这个中间件是"最后一道防线"——如果业务代码中抛出了未被捕获的 panic，中间件确保服务不会崩溃、错误被记录。


## context 取消与 defer 的交互

context 取消时，`ctx.Err()` 返回非 nil error。defer 中需要检查这个错误：

```go
func processWithContext(ctx context.Context) error {
	resource, err := acquire(ctx)
	if err != nil { return err }
	defer func() {
		if ctx.Err() != nil {
			// 上下文取消——可能不需要正常清理
			resource.ForceRelease()
		} else {
			resource.Release()
		}
	}()
	// ...
}
```

这个模式在 FBS 的长时间运行任务中很重要——如果请求被取消了（用户关闭浏览器、超时），需要区分"正常结束"和"被迫中断"的清理逻辑。


## 从错误处理到系统可靠性

Go 的错误处理哲学看似繁琐，实则是对分布式系统失效模式的诚实回应。在微服务架构中，网络超时、数据库连接断开、依赖服务不可用——这些不是意外，而是日常。Go 强制你面对每一个可能的失败点，并在代码中明确处理它们。

前端同学适应 Go 的错误处理后，可能会发现一种微妙的心态变化：从前你写 `await fetch(...)` 时，默认相信"这次调用会成功"——只有出问题了才去想怎么处理。现在你写 `resp, err := client.Do(req)` 时，默认知道"这次调用可能失败"——成功只是众多可能结果中的一个。

这个心态变化不是 Go 语言特有的——Rust 的 `Result` 类型、Haskell 的 `Either` 都传达了同样的理念。Go 只是用最朴素的方式（`if err != nil`）把这个理念嵌入到每一行代码中。

## 练习

### defer 顺序

以下代码的输出是什么？

```go
func demo() {
	for i := 0; i < 3; i++ {
		defer fmt.Print(i)
	}
}
```

### 修复吞错

以下函数有两个错误处理问题，找出并修复：

```go
func GetAndCache(key string) string {
	val, _ := cache.Get(key)  // 问题 1
	if val != "" { return val }
	val, err := db.Query("SELECT value FROM cache WHERE key=?", key)
	if err != nil {
		return ""  // 问题 2
	}
	return val
}
```

### 事务保护

写一个函数 `CreateInboundWithItems(ctx context.Context, db *sql.DB, header Header, items []Item) (id int, err error)`，要求：
- 使用事务保护两个操作（插入 header 和插入 items）
- defer 确保失败时回滚（注意检查命名返回值 err）
- context 取消时返回合适的错误
- 所有错误都使用 `fmt.Errorf("...: %w", err)` 包装上下文信息

### 错误码追踪

在 `sbs-fbs-server/errcode/` 目录中，找一个业务错误码。追踪它从定义位置到 handler 使用的完整路径。回答：这个错误码在什么条件下触发？最终前端收到什么样的 JSON 响应？

### 代码阅读练习

打开 `sbs-fbs-server/middleware/controller_handle.go`，找到统一错误处理的逻辑。注意：不同的错误类型如何映射到不同的 HTTP 状态码？业务错误和系统错误如何区分？

### 参考答案

**defer 顺序**：输出 `2 1 0`（LIFO 顺序——后注册的 defer 先执行。循环中每次迭代注册一个 defer，最后注册的 `fmt.Print(2)` 最先执行）。

**修复吞错**：问题 1——忽略了 `cache.Get` 的 error 返回值，应该检查并降级到 db 查询而不是直接使用空字符串。问题 2——db 错误被静默吞掉，调用方不知道数据可能不准确。修复：函数签名改为 `(string, error)`，两个错误都返回给调用方。

**事务保护**：参考答案参考「FBS 中的事务和 defer 实战」一节的代码模式——关键在于 defer 中检查命名返回值 err，只在 err != nil 时执行 Rollback。context 取消检查：在每次数据库操作前检查 `ctx.Err() != nil`，如果已取消则提前返回。

**错误码追踪**：以 `ErrInboundNotFound` 为例，定义在 `errcode/inbound.go`，在 service 层 `FindByID` 查询不到记录时返回，handler 层通过 `errors.Is` 判断 → 设置 HTTP 404 状态码。前端收到的 JSON 类似 `{"retcode": 30001, "retmsg": "inbound request not found"}`。

**代码阅读练习**：Chassis 中间件通过类型断言判断 error 类型：`BusinessError` → 200 + 非零 retcode；`validation error` → 400；`auth error` → 401；其他 → 500。关键代码在 `handleError` 或类似函数中。

## 参考文献

- [Go Spec: Defer statements](https://go.dev/ref/spec#Defer_statements)
- [Go Spec: Handling panics](https://go.dev/ref/spec#Handling_panics)
- [Effective Go: Errors](https://go.dev/doc/effective_go#errors)
- [Go Blog: Error handling](https://go.dev/blog/go1.13-errors)
- [Go Blog: Defer, Panic, and Recover](https://go.dev/blog/defer-panic-and-recover)
