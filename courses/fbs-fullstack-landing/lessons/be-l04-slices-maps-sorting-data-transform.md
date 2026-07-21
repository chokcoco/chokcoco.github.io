---
title: Slices Maps Sorting Data Transform
render_with_liquid: false
---

# slice、map、排序与数据转换

> 预计学习时间：120–160 分钟
> 一句话总结：能安全处理 Go 的 slice 和 map——理解 append、拷贝、去重、排序、nil/empty 差异和共享底层数组风险，编写不修改输入的转换函数和 table-driven test。

## 这一章解决什么问题

前端同学对数组和对象操作非常熟悉——`array.map()`、`array.filter()`、`Object.keys()`、`[...array]`。Go 的 slice 和 map 在概念上类似，但有一个关键差异：Go 的 slice 和 map 默认是**引用底层数据的视图**，而不是独立的副本。修改一个 slice 可能意外地影响另一个——这在 JavaScript 中很少见（展开运算符创建的是浅拷贝，但至少数组本身不共享）。

这个差异导致 FBS 后端代码中经常出现一个模式：在函数返回之前用 copy 或新建 slice 来隔离数据。不这样做，调用方可能会意外修改 handler 层的缓存数据——这在并发场景下尤其危险。

> 本章基于 `sbs-fbs-server` 的 release 分支（2026-07-20）。

## slice：Go 的动态数组

### slice 的创建和基本操作

```go
// 创建
var s []int                  // nil slice——len=0，底层数组为 nil
s2 := []int{1, 2, 3}        // 字面量
s3 := make([]int, 0, 10)     // len=0, cap=10

// 追加
s = append(s, 1)             // [1]
s = append(s, 2, 3, 4)      // [1, 2, 3, 4]

// 截取
sub := s[1:3]                 // [2, 3]——和 s 共享底层数组！
```

**前端类比**：Go 的 slice ≈ JavaScript 的数组，但有三个关键差异：1) `append` 返回新 slice（可能指向新底层数组），不像 `array.push()` 修改原数组；2) `s[1:3]` 创建的是视图而非副本；3) slice 有容量概念——`make([]int, 0, 10)` 预分配了 10 个元素的空间。

### nil slice vs empty slice

```go
var s1 []int             // nil——JSON 序列化为 null
s2 := []int{}            // empty——JSON 序列化为 []
s3 := make([]int, 0)     // empty
```

在 FBS 的 HTTP 响应中，`nil` slice 和 empty slice 的 JSON 表示不同。如果前端期望 `"list": []`，但后端返回了 `"list": null`，前端代码可能会出问题。因此 FBS 的响应中通常使用 `make([]T, 0)` 初始化列表字段，确保即使没有数据也返回空数组。

**前端类比**：Go 的 nil slice ≈ JavaScript 的 `null`，empty slice ≈ JavaScript 的 `[]`。在 TypeScript 中 `const x: string[] = null` 和 `const x: string[] = []` 的区别和 Go 中完全一样。

### 共享底层数组的陷阱

```go
original := []int{1, 2, 3, 4, 5}
subset := original[1:3]   // [2, 3]
subset[0] = 100
fmt.Println(original)     // [1, 100, 3, 4, 5]——原始数据被修改了！
```

如果你需要独立的副本，使用 `copy`：

```go
subset := make([]int, 2)
copy(subset, original[1:3])
subset[0] = 100
fmt.Println(original)     // [1, 2, 3, 4, 5]——原始数据不变
```

在 FBS 代码中，从 handler 返回数据给调用方之前，如果数据来自内部缓存，通常会先 copy 再返回。否则调用方可能会意外修改缓存。

## map：Go 的键值对

### map 的创建和基本操作

```go
// 创建
m := map[string]int{"a": 1, "b": 2}   // 字面量
m2 := make(map[string]int)             // empty map

// 读写
m["c"] = 3                              // 添加
value := m["a"]                         // 读取——key 不存在时返回零值
value, ok := m["d"]                     // ok=false，说明 key 不存在
delete(m, "a")                          // 删除

// 遍历（顺序不固定）
for key, value := range m {
	fmt.Println(key, value)
}
```

**前端类比**：Go 的 map ≈ JavaScript 的 `Map` 对象或普通 `{}`。`value, ok := m["key"]` ≈ JavaScript 的 `m.has("key") ? m.get("key") : undefined`。Go 的 map 遍历顺序不固定——如果需要有序遍历，必须先取 keys → 排序 → 按排序后的顺序取值。

### map 的常见陷阱

**1. nil map 不能写入**：
```go
var m map[string]int    // nil
m["a"] = 1               // panic: assignment to entry in nil map
```

必须用 `make` 或字面量初始化后才能写入。读取 nil map 不会 panic——返回零值。

**2. map 不是并发安全的**：
```go
// 并发读写 map 会导致 panic
// Go 1.6+ 运行时检测到并发 map 读写会直接崩溃
// 使用 sync.Mutex 或 sync.Map
```

在 FBS 的并发代码中（如 goroutine 共享的缓存），必须用锁保护 map 操作。

**3. map 是引用类型**：
```go
m1 := map[string]int{"a": 1}
m2 := m1           // m2 和 m1 指向同一个底层哈希表
m2["a"] = 100
fmt.Println(m1["a"])  // 100
```

## range 遍历

`range` 用于遍历 slice、map、string、channel。对于 slice，`range` 返回索引和值；对于 map，返回 key 和 value：

```go
// slice
for i, item := range items {
	fmt.Printf("%d: %v\n", i, item)
}

// 只要值
for _, item := range items { ... }

// 只要索引
for i := range items { ... }

// map
for key, val := range myMap { ... }
```

**前端类比**：Go 的 `for i, v := range items` ≈ JavaScript 的 `items.forEach((v, i) => ...)`。`_` ≈ 忽略参数。

## 排序与去重

### 排序

Go 标准库提供 `sort` 包：

```go
import "sort"

// 基本类型排序
ints := []int{3, 1, 4, 1, 5}
sort.Ints(ints)                // [1, 1, 3, 4, 5]
sort.Sort(sort.Reverse(sort.IntSlice(ints))) // 降序

// 自定义排序
type InboundByTime []InboundRequest
func (a InboundByTime) Len() int           { return len(a) }
func (a InboundByTime) Less(i, j int) bool { return a[i].CreatedAt.Before(a[j].CreatedAt) }
func (a InboundByTime) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

sort.Sort(InboundByTime(requests))
```

Go 1.8+ 提供了更简洁的 `sort.Slice`：

```go
sort.Slice(requests, func(i, j int) bool {
	return requests[i].CreatedAt.Before(requests[j].CreatedAt)
})
```

### 去重

Go 没有内建的去重函数。常用模式：用 map 记录已见过的值：

```go
func unique(ids []int) []int {
	seen := make(map[int]bool)
	result := make([]int, 0)
	for _, id := range ids {
		if !seen[id] {
			seen[id] = true
			result = append(result, id)
		}
	}
	return result
}
```

**前端类比**：Go 的去重模式 ≈ JavaScript 的 `[...new Set(ids)]`。Go 的 `map[T]bool` ≈ `Set<T>`。

## FBS 代码中的数据转换模式

### 从数据库模型到 API 响应

在 FBS 的 handler 中，典型的转换流程：

```go
func toResponse(items []InboundRequestDO) []InboundItem {
	result := make([]InboundItem, 0, len(items))
	for _, do := range items {
		result = append(result, InboundItem{
			IrID:   int(do.ID),
			Status: do.Status,
		})
	}
	return result
}
```

注意 `make([]InboundItem, 0, len(items))`——预分配了足够的容量，避免 append 过程中多次扩容。

### 筛选和分页

```go
func paginate(items []InboundItem, pageNo, pageSize int) []InboundItem {
	start := (pageNo - 1) * pageSize
	if start >= len(items) {
		return []InboundItem{}
	}
	end := start + pageSize
	if end > len(items) {
		end = len(items)
	}
	return items[start:end]
}
```

## 常见错误

### append 后未使用返回值

```go
s := []int{1, 2}
append(s, 3)      // s 仍然是 [1, 2]！
s = append(s, 3)  // 正确
```

### 循环中修改 slice 长度

```go
// 可能跳过元素
for i := 0; i < len(items); i++ {
	if shouldRemove(items[i]) {
		items = append(items[:i], items[i+1:]...)
		i--   // 需要回退索引
	}
}
```

### 未初始化 map 就写入

```go
var cache map[string]int
cache["key"] = 1  // panic
```

## 从 JavaScript 数组到 Go slice 的思维转变

### 不可变 vs 可变操作

JavaScript 中区分了修改原数组的方法和返回新数组的方法：`map`、`filter` 返回新数组，`push`、`pop`、`sort` 修改原数组。Go 没有这个区分——**所有对 slice 的修改都是对同一个底层数组的操作**（除非 append 触发了扩容）。

```javascript
// JavaScript：返回新数组，不修改原数组
const doubled = numbers.map(x => x * 2);
// Go：需要手动创建新 slice
doubled := make([]int, len(numbers))
for i, n := range numbers { doubled[i] = n * 2 }
```

这个差异意味着在 Go 中，你需要比 JavaScript 更谨慎地管理数据的所有权。如果一个函数接收了一个 slice 参数，你要明确它是"借用"（只读）还是"占有"（可能修改）。FBS 代码中，纯查询函数通常只读，修改函数通常创建新 slice 返回。

### 前端数组 API 到 Go 的对照

| JavaScript | Go |
| --- | --- |
| `array.map(fn)` | `for` 循环 + `append` |
| `array.filter(fn)` | `for` 循环 + `if` + `append` |
| `array.find(fn)` | `for` 循环 + `return` |
| `array.some(fn)` / `array.every(fn)` | `for` 循环 + `bool` |
| `array.reduce(fn, init)` | `for` 循环 + 累加变量 |
| `[...array]` | `make` + `copy` |
| `array.sort(fn)` | `sort.Slice(array, fn)` |
| `new Set(array)` | `map[T]bool` |
| `array.includes(x)` | `for` 循环 / `slices.Contains`（Go 1.21+） |

### map 在前端和后端的差异

JavaScript 的 `Object` 和 `Map` 在 Go 中统一为 `map[K]V`。关键差异：

- JavaScript 的 `obj.key` 在 Go 中是 `m["key"]`——只能用方括号。
- JavaScript 的 `obj.key === undefined` 判断不存在，Go 用 `value, ok := m["key"]`。
- JavaScript 的 `Object.keys(obj)` 在 Go 中没有等价物——需要自己遍历收集。
- Go 的 map 遍历顺序不确定——不能依赖 `for range` 的顺序。

在 FBS 的 HTTP handler 中，从 URL query 参数到数据库查询条件的转换经常使用 map：`map[string]interface{}{"status": "PENDING", "region": "BR"}`。这种动态查询条件的构建在 Go 中很自然——比前端用对象字面量更灵活，但需要注意值的类型安全。


## FBS 仓库中的实际数据转换

### 列表接口的典型转换管道

在 `sbs-fbs-server` 的 inbound 模块中，一次列表查询经过的数据转换：

1. HTTP DTO（请求） → handler 提取筛选条件 → `map[string]interface{}`
2. `map[string]interface{}` → repository 转换为 SQL 查询条件
3. SQL 结果集 → repository 转换为 `[]InboundRequestDO`
4. `[]InboundRequestDO` → service 转换为 `[]InboundRequest`（领域实体）
5. `[]InboundRequest` → handler 转换为 `[]InboundItem`（响应 DTO）
6. `[]InboundItem` → JSON 序列化 → HTTP 响应

每一步都涉及 slice 的创建和转换。如果某一步不小心共享了底层数组，后续步骤的修改可能反向污染上游数据。因此 FBS 的转换代码中几乎总是创建新的 slice。

### Tax 仓库中的 slice 处理

Tax 仓库（Go 1.15）不能使用 `sort.Slice`（Go 1.8+ 可用，1.15 没问题）和一些新的 slice 工具函数。Tax 中排序需要实现完整的 `sort.Interface`：

```go
type byCreatedAt []*Invoice

func (a byCreatedAt) Len() int           { return len(a) }
func (a byCreatedAt) Less(i, j int) bool { return a[i].CreatedAt < a[j].CreatedAt }
func (a byCreatedAt) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

sort.Sort(byCreatedAt(invoices))
```


## 性能考虑

### 预分配容量

```go
// 差：多次扩容
result := []int{}
for i := 0; i < 10000; i++ { result = append(result, i) }

// 好：一次分配
result := make([]int, 0, 10000)
for i := 0; i < 10000; i++ { result = append(result, i) }
```

预分配容量在 FBS 的批量数据处理中非常重要——处理几千条入库记录时，不预分配会导致多次内存分配和复制。FBS 代码中常见的模式是 `make([]T, 0, expectedSize)`。

### 大 slice 的截取和内存泄漏

```go
// 潜在的内存泄漏：bigSlice 的底层数组无法被 GC
smallSlice := bigSlice[0:10]  // 只用了 10 个元素，但整个底层数组被引用
// 解决：复制需要的部分
smallSlice := make([]T, 10)
copy(smallSlice, bigSlice[0:10])
```

FBS 中处理大文件读取和大列表分页时需要注意这个陷阱。如果取了一小段但原始数据很大，底层数组会一直占用内存。


## table-driven test

Go 社区推崇 table-driven test——用表格数据驱动测试用例：

```go
func TestTransform(t *testing.T) {
	tests := []struct {
		name  string
		input []InboundRequestDO
		want  []InboundItem
	}{
		{"empty", []InboundRequestDO{}, []InboundItem{}},
		{"single", []InboundRequestDO{{ID: 1}}, []InboundItem{{IrID: 1}}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := toResponse(tt.input)
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("got %v, want %v", got, tt.want)
			}
		})
	}
}
```

**前端类比**：Go 的 table-driven test ≈ Jest 的 `test.each(table)(name, fn)`。`t.Run(tt.name, ...)` ≈ `it.each(table)`。


## 从 slice 和 map 到并发安全

slice 和 map 的数据共享问题在并发场景下会被放大。BE-L07 会详细讨论 goroutine 和同步机制。现在只需要记住一条原则：**如果多个 goroutine 访问同一个 slice 或 map，至少有一个在写入，就必须加锁。** Go 运行时会检测并发 map 写入，并直接 panic 而不是悄悄地损坏数据——这是 Go 的"fail fast"哲学。


Go 的切片和映射在语义上与前端数组和对象非常接近，但"共享底层数据"这个特性需要特别注意。每当你从函数返回 slice 或 map，问自己：调用方会修改它吗？如果会，先 copy。每当你接收 slice 或 map 作为参数，问自己：这个函数会修改它吗？如果不会，在注释中说明。这些习惯能避免大量难以排查的数据污染问题。





### 需求

FBS 主服务的入库列表接口返回了 `[]InboundRequestDO`（数据库模型），你需要将其转换为 `[]InboundListItem`（前端需要的 DTO）。DTO 需要：1) 过滤掉 status 为 DELETED 的记录；2) 按 created_at 降序排列；3) 分页；4) 转换字段名（ID → irId，warehouse_id → warehouseId）；5) 如果不是 CBSC 环境，过滤掉 cross_border 为 true 的记录。

```go
type InboundRequestDO struct {
	ID          int64
	Status      string
	WarehouseID string
	CrossBorder bool
	CreatedAt   time.Time
}

type InboundListItem struct {
	IrID        int    `json:"ir_id"`
	Status      string `json:"status"`
	WarehouseID string `json:"warehouse_id"`
}

func TransformInboundList(items []InboundRequestDO, isCBSC bool, pageNo, pageSize int) ([]InboundListItem, int, error) {
	// 1. 过滤
	filtered := make([]InboundListItem, 0, len(items))
	for _, item := range items {
		if item.Status == "DELETED" {
			continue
		}
		if !isCBSC && item.CrossBorder {
			continue
		}
		filtered = append(filtered, InboundListItem{
			IrID:        int(item.ID),
			Status:      item.Status,
			WarehouseID: item.WarehouseID,
		})
	}

	// 2. 排序（按 ID 降序，模拟 created_at 排序）
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].IrID > filtered[j].IrID
	})

	// 3. 分页
	total := len(filtered)
	start := (pageNo - 1) * pageSize
	if start >= total {
		return []InboundListItem{}, total, nil
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	return filtered[start:end], total, nil
}
```

### 写出 table-driven test

为上面的函数编写至少三个测试用例：空输入、正常输入、分页边界。

这个练习整合了本章学到的所有知识点：slice 的创建、过滤、排序、分页、nil/empty 处理。


前端开发中，数据处理通常是链式调用：`data.filter(fn).map(fn).sort(fn).slice(start, end)`——每一步返回新数组，链式连接。Go 不支持这种写法——你需要用多个 for 循环和临时变量。

但 Go 的方式有自己的优势：每一步都显式可见，性能特征清晰（每个循环的复杂度一目了然），避免了链式调用中可能产生的中间数组分配。FBS 代码中，数据转换通常合并到一个循环中完成，减少多次遍历。

这个差异不是"谁好谁坏"的问题——只是两种不同的编程范式。适应 Go 的显式循环风格后，你会发现代码虽然更长，但更透明——没有隐藏的副作用，没有魔法般的链式优化。

## 练习

### 安全转换函数

编写 `FilterAndMap(items []int, predicate func(int) bool, mapper func(int) string) []string`，要求不修改输入的 slice。

### 去重排序

给定 `[]string{"c", "a", "b", "a", "c"}`，返回去重并按字母排序的 slice。

### 参考答案

**7.2**：
```go
func uniqueSorted(input []string) []string {
	seen := make(map[string]bool)
	result := make([]string, 0)
	for _, s := range input {
		if !seen[s] {
			seen[s] = true
			result = append(result, s)
		}
	}
	sort.Strings(result)
	return result
}
```

## 参考文献

- [Go Blog: Slices](https://go.dev/blog/slices-intro)
- [Go Spec: Slice types](https://go.dev/ref/spec#Slice_types)
- [Go Spec: Map types](https://go.dev/ref/spec#Map_types)
- [sort package](https://pkg.go.dev/sort)