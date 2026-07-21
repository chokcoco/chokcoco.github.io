# 值、指针、struct、tag 与数据边界

> 预计学习时间：120–160 分钟
> 一句话总结：能阅读 Go 的零值、指针、struct 定义、组合和 tag，理解 HTTP 请求 DTO 与数据库对象为何不同——从 FBS 主服务的 HTTP define 出发，修复一个字段的 tag 或零值语义问题。

## 这一章解决什么问题

前端同学习惯了 JavaScript 的对象模型：`const obj = { name: 'FBS', count: 0 }`——字段可以随时增删，`undefined` 表示"没有值"，`null` 表示"故意为空"。Go 的世界完全不同：struct 的字段在编译时确定，不能动态添加；变量一定有值（零值）；"没有值"这个概念不存在——你需要通过指针或特定标记来表达"可选"。

这种差异导致两类高频错误。一是将 JavaScript 的对象直觉带入 Go：以为 `== nil` 能判断空字符串、以为结构体字段可以为 `undefined`。二是忽略了指针和值在序列化、比较和方法调用中的行为差异——同样的 struct 传值和传指针可能产生完全不同的结果。

本章从 FBS 主服务的 HTTP DTO（`apps/inbound/inbound/application/fbs_ir_entity.go` 等文件）出发，逐步建立 Go 的值、指针、struct 和 tag 的心智模型。学完后，你能读懂 FBS 代码中任何 struct 定义、理解每个字段后面的 `json:"xxx"` 是什么意思、并修复一个实际的 tag 或零值语义问题。

> 本章基于 `sbs-fbs-server` 的 release 分支（2026-07-20），示例兼容 Go 1.20。Tax 仓的 Go 1.15 限制在本章无影响——本章内容均为 Go 1.0 就已存在的基础语法。

## Go 的值：没有 undefined 的世界

### 每个变量都有值

在 JavaScript 中，声明变量但不赋值会得到 `undefined`：

```javascript
let x;           // undefined
const obj = {};
obj.missing;     // undefined
```

Go 没有 `undefined`。**任何类型的变量在声明后都立即拥有一个明确定义的零值**：

```go
var i int        // 0
var s string     // ""（空字符串）
var b bool       // false
var p *int       // nil（指针的零值）
var m map[string]int  // nil（map 的零值）
```

零值不是"没有值"——它是该类型的默认值，在运行时有明确的语义。`0` 是合法的 int，`""` 是合法的 string。Go 不区分"不存在"和"为空"。

**前端类比**：Go 的零值 ≈ JavaScript 中 TypeScript 强制所有字段必须有初始值的严格模式——但这个"初始值"不是 `undefined`，而是该类型的自然起点。JavaScript 中 `let count = 0` 需要手动赋值，Go 中 `var count int` 自动得到 `0`。

### 零值的实际影响

在 FBS 后端代码中，零值是一个需要谨慎对待的设计选择。以下 struct 展示了一个常见的陷阱：

```go
type InboundFilter struct {
    Status   string
    Region   string
    PageNo   int
    PageSize int
}
```

如果调用方不传 `Status` 和 `Region`，它们会是空字符串 `""`——你可能期望"没传就不筛选"，但空字符串是一种合法的筛选值（在 HTTP query 中 `?status=` 和完全没有 `status` 参数是不同的）。如果调用方不传 `PageNo`，它会是 `0`——你可能期望"默认第 1 页"，但 `0` 页对数据库分页来说是无效值。

这就是为什么 FBS 的 HTTP DTO 中经常使用指针来表示可选字段：

```go
type ScIrListReq struct {
    Status     *string  `json:"status"`     // nil = 不筛选，非 nil = 筛选
    Region     *string  `json:"region"`
    PageNo     int      `json:"page_no"`    // 有默认值逻辑
    PageSize   int      `json:"page_size"`
}
```

`*string`（字符串指针）的零值是 `nil`，可以用 `nil` 明确区分"调用方没传"和"调用方传了空字符串"。`int` 无法用 `nil` 表示"没传"——Go 中 int 没有 nil 值。如果 `PageNo` 需要区分"没传"和"传了 0"，也需要改成 `*int`。

**前端类比**：Go 的指针表达"可选" ≈ TypeScript 的 `?:`（可选属性）。`*string` ≈ `string | undefined`，`string` ≈ 必填的 `string`。区别是 Go 的零值是隐式的——你不需要显式赋值 `= nil`，未赋值的指针自动为 `nil`。

## 指针：值传递的解决方案

### 指针做什么

Go 的指针和 C 语言的指针类似——它存储的是另一个变量的**内存地址**。声明和使用的语法：

```go
var x int = 42
var p *int = &x    // p 指向 x 的地址
fmt.Println(*p)    // 42——通过指针读取 x 的值
*p = 100           // 通过指针修改 x 的值
fmt.Println(x)     // 100——x 被修改了
```

`&` 取地址，`*` 解引用。Go 没有指针运算——你不能 `p++` 来访问相邻内存。这比 C 安全得多。

**前端类比**：Go 的指针 ≈ JavaScript 的对象引用。`const b = a` 不会复制对象，`b.name = 'new'` 会影响 `a`——因为 `a` 和 `b` 指向同一个对象。Go 的 `p := &x` 也是类似：`p` 和 `&x` 指向同一块内存。区别是 Go 的指针可以指向基本类型（如 int、string 的指针），JavaScript 的基本类型总是按值传递。

### 为什么需要指针

Go 的函数参数总是**按值传递**——函数得到的是实参的副本。这意味着：

```go
func addOne(x int) {
    x = x + 1
}

n := 10
addOne(n)
fmt.Println(n)  // 10——n 没有变化！
```

如果要让函数修改外部变量，必须传递指针：

```go
func addOne(x *int) {
    *x = *x + 1
}

n := 10
addOne(&n)
fmt.Println(n)  // 11
```

在 FBS 代码中，HTTP handler 接收到的请求参数经常是指针类型——框架在反序列化 JSON 后需要修改 struct 的字段，用指针才能确保修改反映到原始对象上。

**前端类比**：Go 的值传递 ≈ JavaScript 传递基本类型（`number`、`string`）。Go 的指针传递 ≈ JavaScript 传递对象——函数可以修改对象内部的属性，但 Go 中即使修改"对象"（struct）也需要显式传指针，因为 Go 的 struct 也是值类型。

使用指针前务必判 nil——对 nil 指针解引用会导致 panic（`panic: nil pointer dereference`），类似于前端的 `Cannot read property of undefined`。这是 Go 新手最常见的运行时错误。

### 指针 vs 值的正确使用

| 场景 | 使用值 | 使用指针 |
| --- | --- | --- |
| 字段是否可选 | ✗ | ✓——nil 表示"未设置" |
| 需要修改入参 | ✗ | ✓ |
| struct 非常大 | ✗ | ✓——避免复制开销 |
| 并发安全的数据 | ✓——或使用同步机制 | 需要特别注意数据竞争 |
| 小且不可变的值 | ✓ | ✗——增加不必要的间接访问 |

在 FBS 代码中，HTTP DTO 的可选字段几乎总是指针；领域实体通常使用值类型；数据库模型则混合使用——要看字段在数据库中是否允许 NULL。

## struct：Go 的"对象"

### struct 的定义和创建

Go 没有 class——struct 是唯一的复合类型定义方式：

```go
type InboundItem struct {
    IrID    int    `json:"ir_id"`
    Status  string `json:"status"`
    Creator string `json:"creator"`
}

// 创建实例
item := InboundItem{
    IrID:   1001,
    Status: "PENDING",
}
fmt.Println(item.IrID)  // 1001
```

struct 字段的可见性由**首字母大小写**控制：大写字母开头的字段是公开的（可以被其他包访问），小写字母开头的字段是私有的（仅本包可访问）。Go 没有 `public`/`private`/`protected` 关键字。

### struct 是值类型

在 JavaScript 中，对象总是引用类型。在 Go 中，struct 是值类型——赋值会复制整个 struct：

```go
item1 := InboundItem{IrID: 1001}
item2 := item1          // 完整复制
item2.IrID = 1002
fmt.Println(item1.IrID) // 1001——不受影响
fmt.Println(item2.IrID) // 1002
```

**前端类比**：Go 的 struct 赋值 ≈ JavaScript 的 `{ ...obj }`（展开运算符创建浅拷贝），而不是 `const b = a`（引用赋值）。这个差异非常重要：在 Go 中你不会意外地通过"引用"修改了不该修改的数据——每个 struct 赋值都是隔离的。

### struct 嵌入：Go 的"继承"

Go 没有继承，但可以通过 struct 嵌入实现组合：

```go
type BaseEntity struct {
    CreatedAt time.Time
    UpdatedAt time.Time
}

type InboundItem struct {
    BaseEntity               // 嵌入——InboundItem 自动拥有 CreatedAt 和 UpdatedAt
    IrID   int    `json:"ir_id"`
    Status string `json:"status"`
}

item := InboundItem{}
item.CreatedAt = time.Now()  // 直接访问嵌入字段
```

在 FBS 后端代码中，这种模式大量出现——很多业务实体都嵌入了一个包含 `CreatedAt`、`UpdatedAt`、`Creator` 等公共字段的基础 struct。

**前端类比**：Go 的 struct 嵌入 ≈ JavaScript 的 `...spread` + 接口。`type InboundItem struct { BaseEntity; IrID int }` ≈ 在 TypeScript 中写 `interface InboundItem extends BaseEntity { irId: number }`。区别是 Go 的嵌入是真正的"字段提升"——嵌入的字段可以直接通过外层对象访问，不需要像 `item.BaseEntity.CreatedAt` 这样逐层访问。

## DTO 是什么，为什么 Go 后端需要它

DTO 的全称是 Data Transfer Object（数据传输对象），这个词最早出现在 Martin Fowler 的《Patterns of Enterprise Application Architecture》中。DTO 的核心职责只有一个：**描述数据在跨越进程或服务边界时的形状**。它不是业务规则的一部分，不是数据库表的一对一映射，只是一个"数据包裹"——告诉调用方"你发给我什么格式，我返回给你什么格式"。

在前后端分离架构中，DTO 的作用可以用一句话概括：前端和后端对同一段 JSON 的结构理解必须一致，但这份 JSON 的结构不等于数据库的表结构。DTO 就是那份 JSON 结构的 Go 语言表达。

来说一个具体的例子。假设数据库中 ASN 表有 20 个字段：`id`、`status`、`warehouse_id`、`created_at`、`updated_at`、`internal_note`、`audit_trail` 等等。前端查询 ASN 列表时只需要其中 5 个字段：`ir_id`、`status`、`warehouse_name`、`sku_count`、`created_at`。DTO 的作用就是定义一个只包含这 5 个字段的 struct，让 JSON 序列化时只输出前端需要的数据，而不是把 20 个数据库字段全部暴露出去。

DTO 还解决了另一个问题：字段名映射。数据库列名可能是 `warehouse_id`（snake_case），但前端期望的 JSON 字段名可能是 `warehouseName`（camelCase）或 `warehouse_name`。DTO 通过 `json:"warehouse_name"` tag 完成这个映射——Go 代码里用 `WarehouseID`（Go 命名风格），对外输出时变成 `warehouse_name`（JSON 风格），互不干扰。

社区中 DTO 的使用方式有多种。Java/Spring 生态通常用 DTO + Entity + VO 三层分离，前端传入 DTO、后端返回 VO、数据库操作使用 Entity。Node.js/TypeScript 生态中，Prisma 和 TypeORM 等 ORM 模糊了这层边界——开发者常常直接用数据库模型序列化为 JSON 返回。Go 社区倾向于显式分离：GORM 的模型 struct 和 JSON 的 DTO struct 通常是两套独立的定义，中间的转换代码虽然看起来"不够聪明"，但类型安全、容易追踪、不会因为 ORM 的"魔法序列化"而出问题。

在 FBS 的三个后端仓库中，DTO 通常放在 `application/` 目录下（如 `apps/inbound/inbound/application/fbs_ir_entity.go`），是"面向外部接口的数据结构"。与之对应的数据库模型放在 `infra/` 目录下，领域实体放在 `domain/` 目录下。三者的 tag 体系完全不同：DTO 用 `json`/`form`/`binding`，数据库模型用 `gorm`/`scorm`，领域实体 tag 最少，更接近纯 Go struct。

## tag：struct 字段的元数据标签

### tag 的语法规则

tag 写在 struct 字段类型声明的后面，用反引号包裹。反引号在 Go 中表示原始字符串字面量（raw string literal），内部的所有字符都是字面值，不需要转义。一个字段可以有多个 tag，用空格分隔，格式为 `key:"value"`：

```go
type ScIrListReq struct {
    Status   *string `json:"status" form:"status" binding:"omitempty"`
    PageNo   int     `json:"page_no" form:"page_no"`
    PageSize int     `json:"page_size" form:"page_size" binding:"required"`
}
```

tag 的 key-value 语法有明确的规则：key 和 value 之间用冒号，value 必须用双引号包裹。多个 key-value 对之间用空格分隔。整个 tag 字符串用反引号包裹。tag 内部不允许出现未转义的反引号（反引号本身不能出现在反引号字符串中），但可以用双引号——因为反引号字符串内部的双引号不需要转义。

tag 的 value 可以包含多个选项，用逗号分隔，每个库对选项的定义不同。tag 本身不影响编译——Go 编译器不会"理解"tag 的含义，tag 是给库和框架看的。以最常见的 `json` tag 为例：

- `json:"field_name"`：指定 JSON 序列化/反序列化时的字段名为 `field_name`。
- `json:"field_name,omitempty"`：当字段值为零值时，序列化时跳过该字段，不输出到 JSON 中。
- `json:"-"`：完全忽略该字段，不序列化也不反序列化。
- `json:"field_name,string"`：将数值类型序列化为 JSON 字符串而非数字。

`form` tag 的规则类似但用于 HTTP 请求参数绑定：`form:"field_name"` 指定从 query 参数或 form body 中读取的字段名。`binding` tag 用于参数校验：`binding:"required"` 表示该字段必须存在，`binding:"omitempty"` 表示可选。

**前端类比**：Go 的 tag ≈ TypeScript 的 decorator（装饰器）或多框架注解。`@JsonProperty("ir_id")` 在 Java/TypeScript 中指定 JSON 字段名，`json:"ir_id"` 在 Go 中做同样的事。区别是 Go 的 tag 是语言级特性（虽然编译器不处理），而前端需要通过 Babel/TypeScript 编译器插件来实现类似功能。

### tag 在不同库中的工作机制

tag 本身只是字符串——Go 编译器读取源码时会把它作为 struct 字段的附加信息存储，但不会"执行"它。真正使用 tag 的是标准库和第三方框架，它们通过 Go 的 **reflect（反射）包**在运行时读取 tag 的值，决定如何处理对应字段。

**`encoding/json` 的 tag 处理**：`json.Unmarshal(data, &req)` 执行时，标准库通过反射遍历 `req` 的每个字段，读取 `json` tag 的值作为目标 JSON 键名。如果 JSON 数据中的键名与 tag 不匹配，该字段保持零值。序列化时（`json.Marshal`），如果 tag 包含 `omitempty`，标准库会检查字段的零值决定是否输出——会调用 `reflect.Value.IsZero()` 来判断。

**Chassis 框架的 form/binding tag 处理**：Chassis 在 HTTP 请求到达时，通过反射读取 handler 的 DTO struct 的 `form` tag，从请求的 query string 或 POST body 中提取同名参数，进行类型转换后填入对应字段。如果 `binding:"required"` 存在但参数缺失，Chassis 会自动返回校验错误——这个校验不需要你手动写 if-else。

**GORM/Scorm 的 tag 处理**：GORM 读取 struct 字段的 `gorm` tag 来映射数据库列名、主键、索引等信息。例如 `gorm:"column:warehouse_id"` 告诉 GORM 该字段对应数据库的 `warehouse_id` 列。没有 `gorm` tag 时，GORM 会根据字段名自动生成蛇形命名的列名（如 `WarehouseID` → `warehouse_id`）——但显式写 tag 比依赖自动转换更可靠，避免命名规则变更时的意外。Scorm 是 FBS 内部的 GORM fork，tag 处理机制相同。

tag 不会在编译时报错——拼写错误（如 `jsom:"ir_id"` 中 `json` 写成了 `jsom`）编译完全正常，但在运行时会导致字段不被正确序列化。排查这类问题的方法是在测试中使用 `json.Marshal` 打印实际输出的 JSON 字符串，对比预期结构。

### tag 中 omitempty 与零值的微妙交互

`omitempty` 的行为完全取决于类型的零值。理解这一点对于避免数据丢失至关重要：

- **string**：零值是 `""`。`json:"name,omitempty"` 搭配 `string` 类型时，空字符串字段不会出现在 JSON 输出中。
- **bool**：零值是 `false`。`json:"is_urgent,omitempty"` 搭配 `bool` 类型时，当 `is_urgent` 为 `false`，JSON 中不会出现该字段。接收方看到"没有这个字段"可能误解为"数据丢失"而非"值为 false"。
- **int**：零值是 `0`。`json:"total_qty,omitempty"` 搭配 `int` 类型时，数量为 0 时不会出现在 JSON 中——但如果 0 在业务上是合法值（如"实际入库数量为 0"），省略会导致信息丢失。
- **指针**：零值是 `nil`。`json:"remark,omitempty"` 搭配 `*string` 类型时，指针为 nil 时不会出现在 JSON 中。这是 `omitempty` 最自然的用法——指针的 nil 明确表示"未设置"。

如果在业务上需要区分"false"和"未设置"，有几种策略：

1. 改用 `*bool` 类型 + 去掉 `omitempty`：`*bool` 为 nil 时表示未设置，序列化不输出；非 nil 时总是序列化，无论 true 还是 false。
2. 去掉 `omitempty`，始终输出字段：无论值是什么都出现在 JSON 中，接收方能可靠判断。
3. 使用 `*bool` + `omitempty`：nil 时不输出，非 nil 时输出（包括 false）。

同样的策略适用于 `int`（0 会被 `omitempty` 跳过）和 `string`（空字符串会被跳过）。在 FBS 的入库 DTO 中，`SellerSku *string json:"seller_sku"` 使用指针表达可选——指针为 nil 时序列化不输出（因为 Go 对 nil 指针调用 `IsZero()` 返回 true，配合无显式 `omitempty` 时的默认行为）。这种用法比显式写 `omitempty` 更清晰："nil = 不输出"的语义一目了然。

## FBS 仓库中的 struct 与 DTO

### FBS 代码中常见的 tag

在深入具体 struct 之前，先认识 FBS 代码中你会反复见到的 tag 种类和用途：

| tag | 用途 | FBS 使用场景 |
| --- | --- | --- |
| `json:"field_name"` | JSON 序列化/反序列化的字段名 | 所有 HTTP 请求/响应 DTO |
| `json:"field_name,omitempty"` | 零值时不序列化该字段 | 可选字段 |
| `form:"field_name"` | HTTP form/query 参数名 | Chassis 参数绑定 |
| `binding:"required"` | 参数必填校验 | 请求参数校验 |
| `gorm:"column:xxx"` | 数据库列名 | GORM/Scorm 数据模型 |
| `xlsx:"column_name"` | Excel 导出列名 | 文件导出 DTO |

### HTTP 请求 DTO

打开 `sbs-fbs-server/apps/inbound/inbound/access/http/sc/` 下的文件，你会看到大量类似这样的 DTO：

```go
type ScIrListReq struct {
    PageNo       int    `json:"page_no" form:"page_no"`
    PageSize     int    `json:"page_size" form:"page_size"`
    Status       *int   `json:"status" form:"status"`
}
```

这个 struct 定义了"Seller Center 入库列表请求"的数据结构。`form` tag 用于 Chassis 的请求参数绑定——框架从 HTTP query 或 body 中提取对应字段并填充到 struct 中。`json` tag 在序列化/反序列化时生效。

### 数据库模型 vs 请求 DTO

FBS 严格区分三种 struct：

- **HTTP DTO**（`application/` 目录下）：面向外部接口的数据结构，使用 `json`/`form`/`binding` tag。
- **数据库模型**（`infra/` 目录下）：面向数据库的数据结构，使用 `gorm`/`scorm` tag。
- **领域实体**（`domain/` 目录下）：纯业务逻辑的数据结构，使用值类型居多，tag 较少。

这三种 struct 不能互换使用——它们的职责不同、tag 不同、字段集也不同。HTTP DTO 可能有一些仅供前端使用的计算字段，数据库模型有仅供持久化使用的内部字段。在 handler 和 repository 之间，代码负责 DTO ↔ 实体 ↔ DO（Data Object）的转换。

**前端类比**：Go 的三层 struct ≈ 前端的 API response type（DTO）、domain model（实体）、database entity（DO）。三者的分离不是因为架构教条，而是因为"给前端看的数据"和"存数据库的数据"往往结构不同——字段名、可选性、嵌套层级都可能有差异。

### 为什么需要三层结构

在 FBS 的 `sbs-fbs-server` 中，一个"入库单"至少有三个不同的 struct 定义：

**1. HTTP DTO**（`application/` 层）——给前端看的数据：

```go
type IrDetailResponse struct {
    IrID     int     `json:"ir_id"`
    Status   string  `json:"status"`
    SkuCount *int    `json:"sku_count,omitempty"`  // 可能不存在
}
```

**2. 领域实体**（`domain/` 层）——业务逻辑用的数据：

```go
type InboundRequest struct {
    ID        int
    Status    InboundStatus  // 自定义类型，不是原始 string
    Warehouse string
    CreatedAt time.Time
}
```

**3. 数据库模型**（`infra/` 层）——持久化用的数据：

```go
type InboundRequestDO struct {
    ID             int64     `gorm:"column:id;primaryKey"`
    Status         string    `gorm:"column:status"`
    WarehouseID    string    `gorm:"column:warehouse_id"`
    CreatedAt      time.Time `gorm:"column:created_at"`
    UpdatedAt      time.Time `gorm:"column:updated_at"`
    InternalNote   string    `gorm:"column:internal_note"`  // 不对外暴露的字段
}
```

三者的区别：

- **字段名不同**：HTTP DTO 用 snake_case JSON（`ir_id`），数据库用数据库列名（`warehouse_id`），领域实体用 Go 内部命名（`Warehouse`）。
- **字段集不同**：HTTP DTO 可能有计算字段（如 `SkuCount`），数据库 DO 有内部字段（如 `InternalNote`），领域实体有业务逻辑相关的自定义类型（如 `InboundStatus`）。
- **tag 不同**：各有各的 tag 体系，互不干扰。

**前端类比**：三层 struct ≈ 前端的 API Response Type + Domain Model + Database Entity。TypeScript 项目中用 Prisma 或 TypeORM 也会有类似的分离——`UserResponseDto`（返回给前端）、`User`（业务逻辑）、`UserEntity`（数据库映射）。Go 的区别是这三层不是通过"装饰器"或"配置文件"关联的——你需要手动写转换代码（或者用代码生成工具）。

### FBS 中的转换模式

在 handler 中，代码负责将 HTTP DTO 转换为领域实体，在 repository 中将领域实体转为 DO。例如：

```go
// handler 层：将请求 DTO 转为领域对象
func toDomain(req *ScIrListReq) inbound.SearchCriteria {
    return inbound.SearchCriteria{
        Status:   req.Status,
        PageNo:   req.PageNo,
        PageSize: req.PageSize,
    }
}

// repository 层：将领域对象转为查询条件
func toQuery(criteria inbound.SearchCriteria) map[string]interface{} {
    query := map[string]interface{}{}
    if criteria.Status != nil {
        query["status"] = *criteria.Status
    }
    return query
}
```

这个转换链是"显式样板代码"——不依赖任何框架或反射。它的优点是类型安全（编译时能发现字段不匹配）、容易追踪（顺着调用链就能找到所有字段转换点）。代价是代码量大——当一个 DTO 有 20 个字段时，转换代码也很长。FBS 的部分模块使用了代码生成来减少这种重复。

### tag 在数据流中的完整作用

以一次入库列表请求为例，tag 在各个环节的作用：

1. **前端发送请求**：`{ "page_no": 1, "page_size": 20 }`
2. **Chassis 参数绑定**：读取 `form:"page_no"` → 设置 `ScIrListReq.PageNo = 1`
3. **handler 中使用**：代码直接用 `req.PageNo` 而非 `req.ir_page_no`
4. **数据库查询**：通过 `gorm:"column:page_no"` 映射到数据库列
5. **返回响应**：`json:"page_no"` 将 Go 字段 `PageNo` 序列化为 JSON `"page_no"`

如果任何一个 tag 写错了，数据就会在某一层断裂。最常见的是 JSON tag 拼写错误——前端发送了 `ir_id`，后端 tag 写成了 `json:"irId"`，导致 `ir_id` 字段始终为零值。这类问题不会在编译时发现（tag 只是字符串），需要集成测试或联调时暴露。

tag 在数据流中的三个关键作用归结为：**字段名映射**（Go 风格 → JSON/数据库风格）、**可选性控制**（omitempty 决定字段是否出现在 JSON 中）、**校验声明**（binding tag 声明必填规则，由框架自动执行）。

## 常见错误与修正

### 把指针零值 nil 和空值混淆

```go
var s *string    // s == nil——"没有值"
var t string     // t == ""——"有空字符串值"
```

`nil` 和 `""` 在业务语义上是完全不同的。如果代码中用 `== nil` 判断字符串是否未设置但变量类型是 `string`（不是 `*string`），条件永远不会成立——`string` 类型不可能为 nil。

### 忘记指针解引用

```go
var p *int
*p = 42  // panic: nil pointer dereference
```

在使用指针之前，先判断它是否为 nil：

```go
if p != nil {
    *p = 42
}
```

### tag 拼写错误

```go
type Req struct {
    IrID int `jsom:"ir_id"`  // 拼写错误：json 写成了 jsom
}
```

这个错误不会在编译时报错——tag 只是字符串。运行时序列化会静默使用字段名的默认规则（首字母大写 → `"IrID"` 而非 `"ir_id"`），导致前端解析失败。排查方法：写一个测试，用 `json.Marshal` 打印实际输出的 JSON 字符串，对比预期字段名。

### 混淆值方法和指针方法

```go
func (item InboundItem) SetStatus(s string) {  // 值接收者
    item.Status = s  // 只修改副本
}

func (item *InboundItem) SetStatusPtr(s string) {  // 指针接收者
    item.Status = s  // 修改原始对象
}
```

`SetStatus` 不会影响调用方的变量（因为传值），`SetStatusPtr` 会。如果不注意这个差异，会写出"看起来修改了但实际没有"的代码。

## 从 JavaScript 到 Go 的类型思维转变

本章的核心信息可以浓缩为一句话：**Go 没有 undefined，没有 null（在值类型上），没有隐式类型转换，赋值就是复制。** 这是从 JavaScript/TypeScript 转向 Go 时最大的思维转变。

在 JavaScript 中，你习惯了 `undefined` 和 `null` 的双重空值、对象引用的共享修改、以及 `==` 和 `===` 的隐式转换。在 Go 中，这些概念要么不存在，要么有完全不同的实现方式。适应这个变化不需要变成"类型系统专家"——只需要在每次定义 struct 时问自己三个问题：这个字段可以不设置吗？（用指针）这个字段会被修改吗？（传指针给函数）这个字段在 JSON/数据库中的名字是什么？（写 tag）。

掌握了这三个问题，你就掌握了 Go 的数据建模。接下来，你将学习 Go 的接口和方法——如何定义行为，以及如何通过接口实现依赖倒置。

## 练习

### 零值判断

以下每个变量的零值是什么？

a) `var x int`
b) `var s string`
c) `var p *InboundItem`
d) `var m map[string]int`
e) `var sl []string`

### tag 修复

以下 struct 用于 JSON API 响应。存在什么问题？如何修复？

```go
type InboundResponse struct {
    IrID     int     `json:"ir_id"`
    TotalQty int     `json:"total_qty,omitempty"`
    Remark   *string `json:"remark"`
    IsUrgent bool    `json:"is_urgent,omitempty"`
}
```

### 指针语义

写出以下代码的输出：

```go
type Item struct { Count int }
func setCount(v Item) { v.Count = 10 }
func setCountPtr(v *Item) { v.Count = 20 }

i := Item{Count: 1}
setCount(i)
fmt.Println(i.Count)
setCountPtr(&i)
fmt.Println(i.Count)
```

### 综合练习

在 FBS 的 `apps/inbound/inbound/access/http/sc/` 目录下找到两个不同的请求 DTO struct，记录它们的字段类型、指针使用规则、和 tag 模式。对比这两个 DTO，回答：为什么某些字段用 `*string` 而不用 `string`？为什么某些字段用了 `omitempty` 而其他没有？

### 参考答案

**零值判断**：a) 0，b) `""`（空字符串），c) nil，d) nil，e) nil。

**tag 修复**：`TotalQty` 使用 `omitempty`，当 `TotalQty` 为 0 时不会出现在 JSON 中。如果 0 在业务上是合法值（如"实际入库数量为 0"），应去掉 `omitempty`。`IsUrgent` 同理——`false` 会被省略，接收方看到缺失字段可能误解为"字段缺失"。如果需要在 JSON 中总是包含 `is_urgent`，去掉 `omitempty`；如果需要区分"未设置"和"值为 false"，改用 `*bool`。

**指针语义**：输出 `1` 然后 `20`。`setCount` 修改了副本，不影响原始值；`setCountPtr` 通过指针修改了原始值。

**综合练习**：`*string` 用于区分"调用方没传"（nil）和"调用方传了空字符串"（`""`）；`omitempty` 用于可选字段——当字段为零值时跳过序列化。未使用 `omitempty` 的字段表示"始终出现在 JSON 中"，即便为零值。

## 自检

在继续下一章之前，确认你能回答以下问题：

1. Go 中 `var s string` 和 `var s *string` 的零值分别是什么？在 HTTP DTO 中分别代表什么业务语义？
2. 什么情况下应该用值接收者，什么情况下应该用指针接收者？各给出一个 FBS 代码中的例子。
3. `json:"total_qty,omitempty"` 在 `total_qty` 为 `0` 时会发生什么？为什么这可能是一个 bug？
4. 从 HTTP 请求到达 handler 到数据库查询返回，`page_no` 字段经历了哪些 tag 的转换？画出完整的 tag 数据流。
5. 在 FBS 的三个后端仓库中，`application/`、`domain/`、`infra/` 目录下的 struct 各用什么 tag？它们的职责分别是什么？

## 参考文献

- [Go Spec: Struct types](https://go.dev/ref/spec#Struct_types)
- [Go Spec: Pointer types](https://go.dev/ref/spec#Pointer_types)
- [Go Blog: JSON and Go](https://go.dev/blog/json)
- [Effective Go: Pointers vs Values](https://go.dev/doc/effective_go#pointers_vs_values)
- `sbs-fbs-server/apps/inbound/inbound/access/http/sc/` 的 DTO 定义文件
