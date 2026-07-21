# context、时间、JSON、HTTP、I/O 与文件

> 预计学习时间：130–170 分钟
> 一句话总结：能沿 `context.Context` 传递取消/超时信息，使用 Go 标准库处理 JSON 序列化、HTTP 客户端调用、时间处理和文件操作——为一个调用链补齐 context 与超时，并用测试验证。

## 这一章解决什么问题

前端同学对 context、JSON、HTTP 和时间处理都有自己的直觉——`fetch()` + `await`、`JSON.parse()`/`JSON.stringify()`、`new Date()`、`URLSearchParams`。Go 的标准库提供了类似的能力，但方式和前端有显著差异：Go 的 HTTP 调用是同步阻塞而非 Promise-based，JSON 处理通过 struct tag 而非运行时检查，时间处理区分秒/毫秒/纳秒且强类型。

本章以 FBS 后端代码中最常见的操作——handler 接收请求、JSON 解析请求体、调用下游服务、处理时间、返回 JSON 响应——为主线，逐一解释 Go 标准库中的对应工具。学完后，你能独立为一个 handler 补齐完整的 context 传递和超时控制。

> 本章基于 `sbs-fbs-server` 的 release 分支（2026-07-20）。

## context：请求的生命周期线

### context 做什么

```go
func Handler(ctx context.Context, req *Request) (*Response, error) {
	// ctx 携带：截止时间、取消信号、请求级键值对
	resp, err := callDownstream(ctx, req)  // 传递 ctx 给下游
	// 如果 ctx 被取消（超时或调用方取消），callDownstream 应尽快返回
}
```

Go 的 `context.Context` 是一根贯穿整个请求生命周期的线——它从 HTTP handler 传入，经过 service、repository、HTTP client，一路传递到最深层的调用。任何一层都可以通过 `ctx.Done()` 检测请求是否已被取消，通过 `ctx.Err()` 获知取消原因。

**前端类比**：Go 的 context ≈ 前端的 AbortController。`ctx.Done()` ≈ `signal.aborted`，`ctx.Err()` ≈ `signal.reason`。`context.WithTimeout(ctx, 5*time.Second)` ≈ `AbortSignal.timeout(5000)`。区别是 Go 的 context 是显式传递的——每个函数签名都有 `ctx context.Context`，而前端的 AbortController 通常作为独立对象传递。

### context 的几种创建方式

```go
ctx := context.Background()                      // 根 context——没有超时、没有取消
ctx, cancel := context.WithTimeout(ctx, 5*time.Second) // 5 秒超时
defer cancel()                                         // 防止泄漏
ctx, cancel := context.WithCancel(ctx)                  // 手动取消
ctx = context.WithValue(ctx, key, value)                // 携带键值对（慎用）
```

FBS 的 HTTP handler 从 Chassis 框架接收一个已设置超时的 context——通常 10-30 秒。handler 不需要自己创建 context，只需要把它传给下游。

### context 取消的传播

```go
func callDownstream(ctx context.Context) error {
	req, _ := http.NewRequestWithContext(ctx, "GET", "http://downstream/api", nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err  // 如果 ctx 已取消，err 会包含 context.Canceled
	}
	defer resp.Body.Close()
	// ...
}
```

如果上游的 context 超时或被取消，`http.DefaultClient.Do(req)` 会立即返回错误——不会继续等待下游响应。这个机制确保一个超时的上游请求不会拖累下游资源。

**前端类比**：Go 的 `http.NewRequestWithContext(ctx, ...)` ≈ `fetch(url, { signal })`。Go 的 context 超时 = 前端的 `AbortSignal.timeout()`。两个生态都在做同样的事——"上游不想要结果了，下游就别做了"。

## JSON 处理

### 序列化与反序列化

```go
import "encoding/json"

// 序列化
resp := Response{IrID: 1001, Status: "PENDING"}
data, err := json.Marshal(resp)    // []byte
str := string(data)                 // {"ir_id":1001,"status":"PENDING"}

// 反序列化
var req CreateRequest
err := json.Unmarshal(body, &req)   // 传入指针——Unmarshal 需要修改 req
```

`json.Marshal` 通过 struct tag 决定字段名。`json.Unmarshal` 将 JSON 填充到 struct 中——注意传入的是指针。

**前端类比**：Go 的 `json.Marshal` ≈ `JSON.stringify()`，`json.Unmarshal` ≈ `JSON.parse()`。区别是 Go 的序列化完全由 struct 定义驱动——tag 决定 JSON 字段名，类型决定值的格式。JavaScript 中你可以随意增删字段，Go 中 struct 定义了什么就是什么。

### 空值与 omitempty

在 BE-L02 中已经讲过，回顾一下：`json:"field,omitempty"` 在字段为零值时跳过序列化。`*string` 的零值是 nil，序列化时完全不出现在 JSON 中；`string` 的零值是 `""`，`omitempty` 时也被跳过。FBS 的 DTO 中常见 `*string json:"xxx,omitempty"` 的组合来表达"可选字段"。

### 时间格式

Go 的 `time.Time` 默认序列化为 RFC 3339 格式（`2006-01-02T15:04:05Z07:00`）。如果需要自定义格式：

```go
type Item struct {
	CreatedAt time.Time `json:"created_at"`
}

// 自定义格式需要实现 json.Marshaler 接口
type CustomTime time.Time
func (ct CustomTime) MarshalJSON() ([]byte, error) {
	return json.Marshal(time.Time(ct).Format("2006-01-02 15:04:05"))
}
```

FBS 的后端通常使用时间戳（秒或毫秒）进行 API 通信——`time.Unix(seconds, 0)` 或 `time.UnixMilli(millis)`。前端接收后负责格式化为用户时区。

## HTTP 客户端

### 发送 GET 和 POST 请求

```go
// GET
resp, err := http.Get("http://example.com/api/data")
if err != nil { return err }
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)

// POST JSON
data, _ := json.Marshal(reqBody)
resp, err := http.Post("http://example.com/api/create", "application/json", bytes.NewReader(data))
```

**前端类比**：Go 的 `http.Get(url)` ≈ `fetch(url)`。`http.Post(url, "application/json", body)` ≈ `fetch(url, { method: 'POST', body: JSON.stringify(data) })`。区别是 Go 的 HTTP 调用是同步阻塞的——在 goroutine 中调用不会阻塞其他请求，但当前 goroutine 会等待响应。

### 带 context 的请求

```go
req, _ := http.NewRequestWithContext(ctx, "POST", url, body)
req.Header.Set("Content-Type", "application/json")
req.Header.Set("Authorization", "Bearer "+token)
resp, err := client.Do(req)
```

FBS 调用下游服务时使用这种方式——通过 context 传递超时和取消信号，通过 Header 设置鉴权和内容类型。

### 超时设置

```go
client := &http.Client{Timeout: 10 * time.Second}
```

FBS 中对下游服务的 HTTP 调用通常设置较短的超时（5-10 秒），加上 context 的超时作为双重保障。

## 时间处理

### 时间的基本操作

```go
now := time.Now()                         // 当前本地时间
nowUTC := time.Now().UTC()                // UTC 时间
t := time.Unix(1720000000, 0)            // 从 Unix 秒时间戳
t2 := time.UnixMilli(1720000000000)       // 从 Unix 毫秒时间戳
t.Format("2006-01-02 15:04:05")          // 格式化——使用 Go 独特的参考时间

t.Add(24 * time.Hour)                     // 加一天
t.Sub(other)                              // 时间差 → time.Duration
t.Before(other)                           // 比较
```

**前端类比**：Go 的 `time.Now()` ≈ `new Date()`，`time.Unix(sec, 0)` ≈ `new Date(sec * 1000)`，`t.Format(...)` ≈ `date.toLocaleString()`。Go 的时间格式化使用固定的参考时间 `2006-01-02 15:04:05`——不是 `YYYY-MM-DD` 这样的占位符。

### FBS 的时间约定

FBS 后端统一使用 UTC 存储和处理时间。API 响应中的时间通常是秒级 Unix 时间戳（int64）或 ISO 8601 字符串。前端负责按用户时区格式化显示。后端不做时区转换——这是前端的事。

### context 超时

```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
```

这个模式在 FBS 的 handler 中反复出现——给下游调用设置明确的超时。如果 5 秒内没有响应，context 自动取消，下游调用返回错误。

## 文件 I/O

### 读写文件

```go
// Go 1.16+（sbs-fbs-server 可用，Tax 仓不可用）
data, err := os.ReadFile("config.yaml")

// Go 1.15 兼容写法（Tax 仓）
import "io/ioutil"
data, err := ioutil.ReadFile("config.yaml")

// 写入
err := os.WriteFile("output.json", jsonData, 0644)
```

Tax 仓库必须使用 `ioutil.ReadFile`，其他两个仓库可以用 `os.ReadFile`。在写跨仓库的工具代码时需要注意这个差异。

### 流式处理大文件

```go
f, err := os.Open("large_file.xlsx")
defer f.Close()
// 逐块读取，不一次加载全部内容
buf := make([]byte, 4096)
for {
	n, err := f.Read(buf)
	if err == io.EOF { break }
	// 处理 buf[:n]
}
```

FBS 的文件导出（Excel、PDF）可能涉及大文件处理。使用流式读取避免内存溢出。

## FBS 中的综合示例

以下是一个完整的 handler 示例，整合 context、JSON、HTTP 和时间处理：

```go
func (h *Handler) GetIrDetail(ctx context.Context, req *GetDetailReq) (*GetDetailResp, error) {
	// 1. 解析请求
	irID := req.IrID

	// 2. 调用 service（传递 ctx）
	detail, err := h.svc.GetDetail(ctx, irID)
	if err != nil {
		return nil, err  // Chassis 中间件处理错误→HTTP 响应
	}

	// 3. 组装响应
	resp := &GetDetailResp{
		IrID:      detail.ID,
		Status:    detail.Status,
		CreatedAt: detail.CreatedAt.Unix(),  // 秒级时间戳
	}
	return resp, nil
}
```

## 常见错误

### 忘记 defer resp.Body.Close()

```go
resp, _ := http.Get(url)
// 忘记关闭——连接泄漏
```

### context 未传递

```go
func handler(ctx context.Context) {
	callDB()  // 没传 ctx——数据库查询不受超时控制
}
```

### 时间戳单位混淆

```go
time.Unix(detail.CreatedAt, 0)   // 假设是秒——如果是毫秒会变成遥远的未来
```

## context 在 FBS 中的实际传递路径

### 从 HTTP handler 到数据库查询的完整链路

在 `sbs-fbs-server` 中，一个请求的 context 传递链路是：

1. Chassis 框架接收 HTTP 请求 → 创建带超时的 context（默认 30 秒）
2. Chassis 中间件处理 → context 传递给 handler
3. Handler → Service → Repository → 数据库驱动

每一层都接收并传递 context。如果任何一层创建了新的 context（如 `context.WithTimeout`），新的 context 继承原 context 的取消信号。当最外层的 HTTP 超时后，所有下游调用——包括正在执行的数据库查询——都会收到取消信号。

### context 超时与数据库连接池

FBS 使用连接池管理数据库连接。context 超时后，正在等待连接或正在执行查询的 goroutine 会返回错误。但需要注意的是：context 取消不会中断数据库服务器端正在执行的 SQL——它只是让客户端不再等待结果。如果 SQL 执行了很长时间（例如锁等待），取消 context 后 SQL 仍然在数据库服务器上运行，直到完成或数据库自身的超时触发。

### context 的 WithValue 使用规则

FBS 代码中偶尔使用 `context.WithValue` 传递请求级元数据——如 request ID、用户 ID 等。但 Go 社区强烈建议：**不要把业务数据放在 context 中**。context 的 value 只应用于跨层传递的元数据（日志追踪 ID、鉴权信息），不应用于替代函数参数。

```go
// 正确：传递追踪信息
ctx = context.WithValue(ctx, "request_id", reqID)

// 错误：传递业务数据
ctx = context.WithValue(ctx, "user", userObj)  // 应用函数参数替代
```

### 前端 fetch 的超时机制对比

前端同学可能注意到：`fetch()` 本身不支持超时参数——需要 `AbortController` 配合 `setTimeout`。Go 的 `context.WithTimeout` 是语言标准库的一等公民——每个 HTTP 请求、数据库查询、gRPC 调用都原生支持 context 超时。这个差异意味着 Go 的"超时控制"是系统级的——从前到后一条线；前端需要手动在每个 fetch 调用上设置。


## JSON 和 HTTP 在 FBS 中的完整示例

### 从请求到响应的完整 JSON 流

```go
func (h *Handler) CreateInbound(ctx context.Context, body []byte) (*Response, error) {
	// 1. 解析 JSON 请求体
	var req CreateInboundReq
	if err := json.Unmarshal(body, &req); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}

	// 2. 校验（Chassis 的 binding tag 自动完成，这里手动示例）
	if req.WarehouseID == "" {
		return nil, errors.New("warehouse_id is required")
	}

	// 3. 调用 service
	id, err := h.svc.Create(ctx, &req)
	if err != nil {
		return nil, err
	}

	// 4. 返回 JSON 响应
	resp := &Response{
		IrID:      id,
		CreatedAt: time.Now().UTC().Unix(),
	}
	return resp, nil
}
```

FBS 的 handler 不需要手动调用 `json.Marshal`——Chassis 中间件自动处理。handler 只需要返回 Go struct，中间件负责序列化为 JSON 并写入 HTTP 响应体。

### 时间字段的格式约定

FBS 后端统一使用 **秒级 Unix 时间戳（int64）** 作为 API 响应的时间格式。前端接收到 `1720000000` 后，`new Date(1720000000 * 1000)` 转为浏览器本地时区显示。后端不做时区转换——这是前后端契约：后端提供 UTC 时间戳，前端负责格式化。

为什么用秒而不是毫秒？Go 的 `time.Now().Unix()` 返回秒，`time.Now().UnixMilli()` 返回毫秒——两个都很简单。FBS 选择秒是为了节省传输字节（10 位数字 vs 13 位），且大多数业务场景秒级精度足够。


## 文件处理与内存管理

### 上传文件的处理

```go
func (h *Handler) UploadFile(ctx context.Context, file multipart.File, header *multipart.FileHeader) error {
	defer file.Close()

	// 校验文件大小
	if header.Size > 10*1024*1024 {  // 10MB 上限
		return errors.New("file too large")
	}

	// 保存到临时文件
	dst, err := os.CreateTemp("", "upload-*")
	if err != nil { return err }
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil { return err }
	return nil
}
```

FBS 的文件上传和导出通常通过临时文件处理——先写入临时文件，验证正确后再移动到最终位置。`io.Copy` 是流式复制，不会将整个文件加载到内存。

### Excel 导出

FBS 的 Excel 导出功能使用 `excelize` 或内部封装的 Excel 库。大文件导出时，使用流式写入（`StreamWriter`）而非一次性构建整个 Excel 对象——避免内存溢出。导出完成后，文件通过 HTTP 响应返回给前端。


## Go 标准库的时间陷阱与最佳实践

### time.Now vs time.Now().UTC

```go
t1 := time.Now()          // 本地时间
t2 := time.Now().UTC()    // UTC 时间
```

在服务器代码中，永远使用 `time.Now().UTC()`。服务器的时区可能是 UTC、可能是宿主机本地时区——不确定。使用 UTC 消除这种不确定性。本地时间只用于展示层（通常在前端）。

### Duration 的运算

```go
d := 5 * time.Second + 300 * time.Millisecond  // 复合 duration
time.Since(start)                                // 从 start 到现在的时间
time.Until(deadline)                             // 从现在到 deadline 的时间
ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
defer cancel()
```

### 时区的正确处理

Go 的 `time.LoadLocation("Asia/Shanghai")` 加载时区。FBS 后端不需要这样做——所有时间都是 UTC。如果需要时区转换（如展示仓库当地时间），在前端做，不在后端做。

### 时间和 JSON 的交互

```go
type Event struct {
	At time.Time `json:"at"`  // RFC 3339 格式：2006-01-02T15:04:05Z
}
```

如果后端以 Unix 时间戳传递时间，DTO 中用 int64 而非 time.Time：

```go
type Response struct {
	CreatedAt int64 `json:"created_at"`  // 秒级时间戳
}
```


## HTTP 客户端在生产环境的最佳实践

### 连接复用

```go
var client = &http.Client{
	Timeout: 10 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        100,
		IdleConnTimeout:     90 * time.Second,
		DisableCompression:  false,
	},
}
```

FBS 中调用外部服务时，复用 HTTP client 实例——不要在每次请求时创建新的 client。`http.DefaultClient` 是一个全局共享的实例，但最好使用自定义的 client 来控制超时和连接池。

### 重试策略

```go
func callWithRetry(ctx context.Context, url string) ([]byte, error) {
	for i := 0; i < 3; i++ {
		resp, err := call(ctx, url)
		if err == nil { return resp, nil }
		if !isRetryable(err) { return nil, err }
		time.Sleep(time.Duration(i) * time.Second)  // 退避
	}
	return nil, fmt.Errorf("max retries exceeded")
}
```

只在可重试的错误（网络超时、临时服务不可用）上重试。不要在业务错误（如参数校验失败）上重试。

### FBS 中调用敏感数据服务的模式

主服务调用敏感数据服务时，使用 gRPC 或 HTTP。HTTP 调用时通过 context 传递超时和鉴权信息。响应中的敏感数据不写日志、不缓存、使用后立即销毁。

## 总结与进阶

本章覆盖了 Go 标准库中与前端开发最相关的六个方面：context、JSON、HTTP、时间、文件和 I/O。它们分别对应前端开发中的 Promise 超时、JSON 序列化、fetch API、Date/Intl、File API。理解了这些对应关系后，你在前后端之间切换时不再需要"重新学习"这些概念——只需要翻译语法。

在后端工程模块中，你将把这些标准库能力与 Chassis 框架结合，构建完整的 HTTP 接口和处理链路。

## 练习

### handler 编写

写一个 handler 函数，要求：
- 接收 POST JSON 请求（包含 `warehouse_id` 和 `sku_list`）
- 校验 `warehouse_id` 不为空
- 调用 service 层处理（返回创建的 id 和时间）
- 返回 JSON 响应（包含 `ir_id` 和 `created_at`）
- context 超时 10 秒
- 如果 warehouse_id 为空或 service 返回错误，返回合适的错误

### 文件下载与数据处理

写一个函数 `DownloadAndProcess(ctx context.Context, url string, outputPath string) error`，要求：
- 从指定 HTTP URL 下载 JSON 数据（内容为 `[]Item`，Item 包含 `Name`、`Status`、`CreatedAt` 字段）
- 筛选出 `Status` 为 `"ACTIVE"` 的条目
- 按 `CreatedAt` 升序排序
- 将结果写入 `outputPath`
- context 超时 10 秒
- HTTP 请求失败或 JSON 解析失败时返回带上下文的错误（使用 `fmt.Errorf("...: %w", err)`）
- 文件操作使用 defer 确保关闭

### 时间处理

编写一个 API handler，接收 `start_date` 和 `end_date`（都是 RFC 3339 格式的字符串，如 `"2026-01-01T00:00:00Z"`），解析后查询该时间范围内的数据。要求：
- 日期范围是 [start, end)（左闭右开）
- 如果 end 早于 start，返回参数错误
- 如果解析失败，返回带上下文的错误

### 参考答案

**handler 编写**：参考「FBS 中的综合示例」一节的结构，整合 `json.Unmarshal`、参数校验、service 调用、响应组装。关键点：handler 接收 `ctx context.Context`，传递给 service；service 返回错误时，handler 直接返回 error（由 Chassis 中间件处理）。

**文件下载与数据处理**：整合 `http.NewRequestWithContext`、`json.Unmarshal`、筛选、`sort.Slice`、`os.WriteFile`。关键点：使用带 context 的 HTTP 请求确保超时生效；筛选和排序在内存中完成（假设数据量不大）；错误包装使用 `%w` 保留原始错误链。

**时间处理**：使用 `time.Parse(time.RFC3339, startDate)` 解析日期字符串。左闭右开区间表示 `t >= start && t < end`。错误返回使用 `fmt.Errorf("invalid date range: start %s is after end %s", start, end)`。

## 参考文献

- [context package](https://pkg.go.dev/context)
- [Go Concurrency Patterns: Context](https://go.dev/blog/context)
- [net/http package](https://pkg.go.dev/net/http)
- [encoding/json package](https://pkg.go.dev/encoding/json)
- [time package](https://pkg.go.dev/time)
- [os package](https://pkg.go.dev/os)
