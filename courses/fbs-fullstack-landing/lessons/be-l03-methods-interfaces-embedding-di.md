# 方法、接口、嵌入与依赖倒置

> 预计学习时间：120–160 分钟
> 一句话总结：能阅读 Go 的方法集、接口满足、struct 嵌入和构造函数——从 FBS 的 handler/service interface 出发，沿接口找到运行时实现，写一个最小 fake，并理解 Wire 在其中的角色。

## 这一章解决什么问题

前端同学对"接口"并不陌生——TypeScript 的 `interface` 用于描述对象形状，组件 Props、API 响应类型都是接口。但 Go 的接口和 TypeScript 的接口有本质差异：Go 的接口不需要显式声明"我实现了你"。只要一个类型的方法集包含接口要求的所有方法，它就自动满足接口——不需要 `implements` 关键字。这种"隐式满足"机制让 Go 的接口成为依赖倒置的天然载体。

在 FBS 后端代码中，几乎每个业务模块都遵循相同的模式：handler 依赖 service 接口 → service 接口有具体实现 → Wire 在编译时把具体实现注入到 handler 中。理解这个模式，你就能读懂 FBS 代码中最核心的架构约定。

> 本章基于 `sbs-fbs-server` 的 release 分支（2026-07-20）。

## 方法：附属于类型的函数

### Go 的方法定义

JavaScript 中，方法是对象上的函数属性。Go 的方法通过"接收者"（receiver）绑定到类型：

```go
type InboundRequest struct {
	ID     int
	Status string
}

// 值接收者——操作的是副本
func (r InboundRequest) IsPending() bool {
	return r.Status == "PENDING"
}

// 指针接收者——操作的是原始对象
func (r *InboundRequest) Approve() {
	r.Status = "APPROVED"
}

req := InboundRequest{ID: 1001, Status: "PENDING"}
fmt.Println(req.IsPending())  // true
req.Approve()
fmt.Println(req.Status)       // "APPROVED"
```

**前端类比**：Go 的 `func (r *InboundRequest) Approve()` ≈ JavaScript 的 `class InboundRequest { approve() { this.status = 'APPROVED' } }`。区别是 Go 没有 class，方法定义在类型外部——这更像给类型"附加"函数。值接收者和指针接收者的区别在 JavaScript 中不存在等价物——JavaScript 的对象方法总是操作原始对象。

### 选择值接收者还是指针接收者

| 判断条件 | 使用值接收者 | 使用指针接收者 |
| --- | :---: | :---: |
| 方法需要修改接收者自身 | ✗ | ✓ |
| 接收者是大型 struct（复制成本高） | ✗ | ✓ |
| 方法只读取数据不修改 | ✓ | ✗ |
| 需要实现接口（见后文） | 视接口要求 | 视接口要求 |
| 并发场景 | ✓——值接收者天然线程安全 | 需要同步机制 |

FBS 代码中的经验法则：**默认使用指针接收者**。即使方法不修改数据，大型 struct 的复制成本也足够高。只有非常小的、不可变的值（如 `InboundStatus` 这样的自定义类型）才用值接收者。

## 接口：Go 的类型约束

### 接口定义

```go
type InboundRepository interface {
	FindByID(ctx context.Context, id int) (*InboundRequest, error)
	Save(ctx context.Context, req *InboundRequest) error
	List(ctx context.Context, filter SearchCriteria) ([]InboundRequest, int, error)
}
```

这个接口定义了三个方法。任何拥有这三个方法的类型都自动满足这个接口——不需要 `implements InboundRepository` 这样的声明。

### 隐式满足

```go
// 类型定义
type mysqlInboundRepo struct {
	db *gorm.DB
}

// 实现三个方法
func (r *mysqlInboundRepo) FindByID(ctx context.Context, id int) (*InboundRequest, error) { ... }
func (r *mysqlInboundRepo) Save(ctx context.Context, req *InboundRequest) error { ... }
func (r *mysqlInboundRepo) List(ctx context.Context, filter SearchCriteria) ([]InboundRequest, int, error) { ... }

// 自动满足 InboundRepository 接口
var _ InboundRepository = (*mysqlInboundRepo)(nil)  // 编译时验证
```

最后一行 `var _ InboundRepository = (*mysqlInboundRepo)(nil)` 不是必需的运行时代码——它纯粹是编译时断言。如果 `*mysqlInboundRepo` 没有完全实现接口，这行代码会导致编译错误。FBS 代码中常见这种模式，用来确保实现类不会意外偏离接口。

**前端类比**：Go 的隐式接口满足 ≈ TypeScript 的结构类型。TypeScript 中 `{ name: string }` 自动满足 `{ name: string }` 类型——不需要声明 `implements`。Go 把这个概念从"结构匹配"扩展到了"方法集匹配"。

### 接口放在哪里

Go 的接口定义通常放在**使用者**所在的包，而不是实现者所在的包。这是 Go 和 Java/C# 的关键差异：

```go
// service/ 包——定义接口（使用者）
type InboundRepository interface { ... }

// infra/ 包——提供实现（实现者）
type mysqlInboundRepo struct { ... }
```

这意味着如果你写了一个 mock 实现来测试，不需要修改 `infra/` 包——直接在测试文件中定义一个实现了相同接口的 mock struct 即可。这就是依赖倒置：上层定义需要什么，下层提供实现。

**前端类比**：Go 的接口放在使用者侧 ≈ React 组件的 Props 由组件自己定义，而不是由数据源定义。组件的 Props 接口说"我需要 name: string"，任何能提供 name 的地方就可以用——无论是 API 响应还是 mock 数据。

## FBS 中的接口与实现

### Handler → Service → Repository 链路

在 FBS 主服务的 inbound 模块中，典型的三层接口关系：

```go
// handler 层：依赖 service 接口
type InboundHandler struct {
	svc InboundService
}

// service 层：定义接口并依赖 repository 接口
type InboundService interface {
	GetIrList(ctx context.Context, req *SearchCriteria) ([]InboundItem, int, error)
}

// repository 层：定义接口，由 infra 层实现
type InboundRepository interface {
	FindByFilter(ctx context.Context, filter map[string]interface{}) ([]InboundRequestDO, error)
}
```

每层只依赖下一层的接口，不依赖具体实现。这带来的好处：

- handler 的单元测试可以用 mock service，不需要真实数据库。
- service 的单元测试可以用 mock repository，不需要启动 MySQL。
- 修改 repository 的实现（如从 GORM 切换到 Scorm）不影响上层代码。

### Wire 的角色

FBS 使用 Google Wire 实现编译期依赖注入。`wire.Bind` 将接口和具体实现绑定：

```go
// 声明接口和实现的绑定关系
var InboundSet = wire.NewSet(
	NewInboundHandler,
	NewInboundService,
	wire.Bind(new(InboundService), new(*inboundServiceImpl)),
	NewInboundRepository,
	wire.Bind(new(InboundRepository), new(*mysqlInboundRepo)),
)
```

Wire 在编译时扫描这些绑定关系，生成 `wire_gen.go`——一个包含了所有对象创建和连接代码的文件。Wire 不是运行时框架——它只是一个代码生成工具。生成完成后，所有的依赖连接都变成了普通的 Go 代码，没有反射、没有运行时开销。

**前端类比**：Go 的 Wire ≈ Angular 的 DI 容器或 NestJS 的 `@Injectable()`。区别是 Wire 在编译时生成所有代码——生产环境运行的代码中没有 DI 容器、没有装饰器、没有反射，只有普通的函数调用和赋值。这相当于前端的"编译时依赖注入"——类似于使用构建工具在编译期解析所有 import 并将其展开为内联代码。

## 接口的测试价值

### 用 mock 实现替代真实依赖

```go
// 测试中的 mock 实现
type mockInboundRepo struct {
	findByIDFunc func(ctx context.Context, id int) (*InboundRequest, error)
}

func (m *mockInboundRepo) FindByID(ctx context.Context, id int) (*InboundRequest, error) {
	return m.findByIDFunc(ctx, id)
}

func TestGetIrDetail(t *testing.T) {
	repo := &mockInboundRepo{
		findByIDFunc: func(ctx context.Context, id int) (*InboundRequest, error) {
			return &InboundRequest{ID: id, Status: "PENDING"}, nil
		},
	}
	svc := NewInboundService(repo)
	detail, err := svc.GetIrDetail(context.Background(), 1001)
	if err != nil || detail.Status != "PENDING" {
		t.Errorf("unexpected result")
	}
}
```

**前端类比**：Go 的 mock 实现 ≈ Jest 的 `jest.fn()` + mock 返回值。`mockInboundRepo.findByIDFunc` ≈ `jest.fn().mockReturnValue(...)`。区别是 Go 需要手动写 mock struct，而 JavaScript 可以直接用 `jest.mock('./module')` 自动生成。FBS 项目中通常使用 `testify/mock` 或手写简单 mock。

### 接口不是越多越好

不是每个 struct 都需要一个对应的 interface。FBS 的接口通常只出现在"有多个可能实现"或"上层需要测试"的地方。如果一个类型只有一个实现、且不参与单元测试 mock，它可能根本没有接口——直接使用具体类型。Go 社区的经验是"接口应该小而精"——大多数接口只有 1-3 个方法。这和 Java/C# 中动辄 10+ 个方法的"大接口"不同。

## 常见错误

### 混淆值接收者和指针接收者的接口满足

```go
type Greeter interface { Greet() string }
type Foo struct {}
func (f Foo) Greet() string { return "hello" }    // 值接收者

var g Greeter = Foo{}   // OK
var g Greeter = &Foo{}  // 也 OK——指针包含值的方法集
```

如果方法是用指针接收者定义的：

```go
func (f *Foo) Greet() string { return "hello" }   // 指针接收者

var g Greeter = &Foo{}  // OK
var g Greeter = Foo{}   // 编译错误！Foo 没有实现 Greet
```

指针类型的方法集包含值接收者和指针接收者的所有方法。值类型的方法集只包含值接收者的方法。这是 Go 接口中最容易出错的地方。

### 接口定义在错误的位置

在 FBS 代码中，如果你需要 mock `InboundRepository`，应该在 `service` 包（使用者）中定义接口，而不是在 `infra` 包（实现者）中。把接口放在实现者旁边违反了依赖倒置原则——使用者被迫依赖实现者的包，测试时仍然需要引入真实实现所在的包。

## Go 的接口与 TypeScript 的接口：本质差异

### 结构型 vs 名义型

TypeScript 的接口是**结构型**——只要形状匹配就兼容。Go 的接口也是**结构型**——只要方法集匹配就满足。但 TypeScript 通常通过 `implements` 关键字显式声明来实现接口（虽然可以用类型断言绕过），Go 完全不需要声明。

这导致了不同的编程风格：

```typescript
// TypeScript：通常显式声明
class MySQLRepo implements InboundRepository {
  findById(id: number): InboundRequest { ... }
}

// Go：不需要声明，方法签名匹配即可
type mysqlInboundRepo struct { db *gorm.DB }
func (r *mysqlInboundRepo) FindByID(...) { ... }
// 自动满足 InboundRepository 接口
```

### 接口的"零值"和空接口

Go 的 `interface{}`（或 Go 1.18+ 的 `any`）可以保存任何类型的值——类似 TypeScript 的 `unknown`（不是 `any`，因为 `any` 会关闭类型检查而 `interface{}` 不会）。空接口在前端类比中是"泛型容器"——`let x: unknown = 42` 可以用 `typeof` 检查后安全使用，`var x interface{} = 42` 需要用类型断言 `x.(int)` 取回原类型。

在 FBS 代码中，你很少看到 `interface{}`——大多数场景都有明确的接口定义。如果出现 `interface{}`，通常是在"确实无法预知类型"的边界（如 JSON 通用解析、中间件通用处理）。

### 接口组合

Go 的接口可以通过嵌入组合成更大的接口：

```go
type Reader interface { Read(p []byte) (n int, err error) }
type Writer interface { Write(p []byte) (n int, err error) }
type ReadWriter interface {
	Reader
	Writer
}
```

FBS 代码中这个模式常见于标准库级别的组合，业务代码中较少——因为 FBS 倾向于小接口（1-3 个方法），不需要组合。


## FBS 中的依赖注入全景

### Wire 的完整工作流

在 FBS 的每个模块中，Wire 的工作流是：

1. 在 `wire.go` 中定义 provider set：
```go
// +build wireinject
//go:generate wire
package inbound

var InboundSet = wire.NewSet(
	NewHandler,
	NewService,
	wire.Bind(new(Service), new(*serviceImpl)),
	NewRepository,
	wire.Bind(new(Repository), new(*mysqlRepo)),
)
```

2. 在 `wire.go` 中定义 injector 函数：
```go
func InitInboundHandler(db *gorm.DB) *Handler {
	wire.Build(InboundSet)
	return nil
}
```

3. 运行 `go generate` → Wire 生成 `wire_gen.go`：
```go
func InitInboundHandler(db *gorm.DB) *Handler {
	repo := NewRepository(db)
	svc := NewService(repo)
	handler := NewHandler(svc)
	return handler
}
```

4. 在 `main.go` 中调用 injector：
```go
handler := inbound.InitInboundHandler(db)
```

生成后的代码就是普通的 Go 代码——没有注解、没有反射、没有运行时开销。Wire 纯粹是编译时代码生成工具。

### Wire 解决了什么问题

Wire 解决的是"手动依赖注入太繁琐"的问题。如果没有 Wire，你需要在 main.go 中手动写十几行依赖创建代码——而且每次依赖关系变化时都要手动更新。Wire 把这个过程自动化了。

**前端类比**：Go 的 Wire ≈ Angular 的 DI 容器，但编译时生成。Angular 在浏览器运行时通过 `@Injectable()` 装饰器和反射来解析依赖；Wire 在编译时就把所有依赖关系展开成普通代码。生成后的代码没有任何魔法——你可以逐行阅读和理解。


## 接口驱动的开发流程

### 在 FBS 中新增一个功能的推荐步骤

1. 在 `domain/` 中定义领域实体（纯 struct，无接口）。
2. 在 `application/`（或 `service/`）中定义 service 接口，声明业务操作的签名。
3. 写 service 的具体实现，依赖 repository 接口。
4. 在 `infra/` 中实现 repository 接口（数据库查询代码）。
5. 在 `wire.go` 中注册 provider set 和绑定关系。
6. 运行 `go generate` 生成 wire_gen.go。
7. 写 handler，依赖 service 接口，处理 HTTP 请求/响应。
8. 写 handler_test.go（mock service）和 service_test.go（mock repository）。

### 接口帮助你推迟决策

接口的核心价值不是"可以换实现"——实际上 FBS 中大多数接口只有一个实现，而且在可预见的未来都不会换。接口的核心价值是"让你可以推迟决策"。写 service 时你不需要知道 repository 用 MySQL 还是 memory——只需要知道"有个东西能查数据"。测试时，你给它一个 mock。

**前端类比**：React 组件通过 Props 接收数据而不是直接调用 API，是为了推迟"数据从哪来"的决策。`<UserProfile user={user} />` 不关心 `user` 是来自 Redux Store 还是 API 响应还是 mock 数据。Go 的接口做的是同样的事——推迟"具体实现是什么"的决策到调用方。


## 从 OOP 到 Go：方法论的转变

如果你之前主要使用 Java 或 TypeScript（带 class）进行面向对象开发，Go 的接口和组合模式需要一些适应：

1. **Go 没有继承**——用 struct 嵌入和接口组合替代。
2. **Go 没有抽象类**——用接口 + 默认实现 struct 替代。
3. **Go 没有构造函数重载**——通常用 `NewXxx()` 函数替代，参数通过 Options pattern 或 Config struct 传递。
4. **Go 的接口遍地都是但非常小**——大多数接口只有 1-3 个方法，不像 Java 的 interface 有 10+ 个方法。
5. **Go 的 DI 在编译时完成**——Wire 生成的代码是可阅读的，不需要理解运行时反射。

FBS 代码忠实地体现了这些 Go 惯用法。如果你在阅读 FBS 代码时觉得"为什么这么写而不是像 Java 那样"，答案通常是"因为 Go 不鼓励那种写法，而且有更好的替代"。




## 接口和结构体在错误处理中的角色

在 Go 中，error 本身就是一个接口——只有一个方法 `Error() string`。这意味着任何实现了 `Error() string` 的类型都是合法的 error。FBS 代码利用这一特性构建了丰富的错误层级：

```go
// 自定义错误类型
type BusinessError struct {
	Code    int
	Message string
}

func (e *BusinessError) Error() string {
	return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// 使用 errors.Is 和 errors.As 检查错误类型
if errors.Is(err, ErrNotFound) { ... }      // 检查是否为特定 sentinel error
var bizErr *BusinessError
if errors.As(err, &bizErr) { ... }           // 提取自定义错误类型
```

在 FBS 的 `errcode/` 包中，你会看到大量使用这一模式的代码。业务错误码通过实现 error 接口与 Go 的标准错误处理机制无缝集成。这部分内容将在 BE-L05 详细展开——但理解 error 是接口这一事实，现在就需要建立。


## 从练习到实战

学完本章后，试试在 `sbs-fbs-server` 中完成以下任务：

1. 找到 `apps/inbound/` 下的 `wire.go` 文件——看它的 provider set 包含哪些组件。
2. 追踪 `InboundService` 接口（或类似命名）——找到它的定义、所有方法签名、以及具体实现。
3. 找到 `InboundRepository` 接口——看它的方法和具体实现。
4. 打开 `wire_gen.go`（生成文件）——观察 Wire 如何将 provider set 展开为普通代码。

如果你能完成这四个步骤，你就掌握了 FBS 代码中最核心的架构范式。接下来的章节中，你会反复看到这个模式——handler → service → repository 的三层结构，由 Wire 编译时连接。


## Go 接口与前端架构的类比

如果你做过 React 或 Vue 的前端开发，Go 的接口和依赖注入有一个非常贴切的类比：

React 组件通过 Props 声明我需要什么，而不是谁提供给我。Go 的接口做的是同样的事——消费者定义需要什么，不关心谁提供。提供者只需满足契约，不需要知道谁在消费。

这个原则在前后端开发中同样有效。当你从前端转到后端时，不要被依赖注入、控制反转这些术语吓到——它们只是把具体实现从消费者中抽离的不同叫法而已。

## 练习

### 接口实现

以下接口 `Validator` 需要哪些类型满足它？

```go
type Validator interface {
	Validate() error
}

type Email string
func (e Email) Validate() error { ... }

type User struct { Name string }
func (u *User) Validate() error { ... }
```

a) `var v Validator = Email("test@test.com")`——能编译吗？  
b) `var v Validator = User{Name: "test"}`——能编译吗？  
c) `var v Validator = &User{Name: "test"}`——能编译吗？

### Mock 编写

为 `InboundService` 接口编写一个 mock，用于测试 handler。假设 handler 调用 `GetIrList` 获取列表数据并检查返回数量。

### 参考答案

**6.1**：a) 能——Email 的方法使用值接收者，值类型满足接口。b) 不能——`*User` 的 `Validate()` 是指针接收者，值类型 `User` 不满足接口。c) 能——指针类型包含指针接收者的方法。

**6.2**：参考模式见第四节代码。

## 参考文献

- [Go Spec: Interface types](https://go.dev/ref/spec#Interface_types)
- [Go Spec: Method sets](https://go.dev/ref/spec#Method_sets)
- [Effective Go: Interfaces](https://go.dev/doc/effective_go#interfaces)
- [Go Blog: Wire](https://go.dev/blog/wire)