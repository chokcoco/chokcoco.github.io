# 第 15 章　Optional 与缺失值

> 学习提示：先区分"查不到数据""输入不合法"和"系统失败"是不同的；Optional 只适合表示第一种。
> 一句话总结：Optional 让"可能没有结果"成为方法签名的显式契约；用 map、filter、orElse、orElseThrow 处理缺失，而不是用 get() 把问题推迟。

## 一、缺失、拒绝与失败是不同的

假设按用户 ID 查询昵称：

```java
String findNickname(String userId) {
    // 查数据库...
}
```

这个方法的返回值可能面临三种不同的情况：

1. **用户不存在**：查询正常完成，但没有找到匹配的结果——"正常缺失"。
2. **用户 ID 格式不对**：调用方传入非法参数——"业务拒绝"。
3. **数据库不可达**：系统环境有问题——"系统失败"。

三种情况不能都用同一个返回值表达。常见的错误做法是返回 `null` 代表"查不到"，而让调用方猜测这是场景 1、2 还是 3。另一种错误是三者都抛异常，连正常查询无结果也需要 try-catch。

[[Optional]] 适合表达第一种场景：一个正常操作可能返回结果，也可能因为没有匹配数据而不返回。对于业务拒绝和系统失败，应该继续使用异常处理（第 11 章）。

```java
Optional<String> findNickname(String userId) {
    if ("u-1".equals(userId)) {
        return Optional.of("Ada");
    }
    return Optional.empty();
}
```

`Optional<String>` 的类型签名直接告诉调用方：这个方法可能返回一个 String，也可能没有。调用方看到这个签名就知道要处理缺失情况，而不是默默接收可能为 null 的 String。

## 二、创建 Optional

三个工厂方法创建 Optional 实例：

```java
// 1. 已知值非 null
Optional<String> known = Optional.of("Java");
// Optional.of(null); // NullPointerException

// 2. 值可能为 null
String maybeNull = getSomeValue(); // 可能 null
Optional<String> safe = Optional.ofNullable(maybeNull);

// 3. 明确没有结果
Optional<String> empty = Optional.empty();
```

- `of` 只接收非 null 值。如果传入 null，会立即抛出 `NullPointerException`，做到快速失败。
- `ofNullable` 接收可能为 null 的值。内部不会抛异常，若传入 null 则等价于 `empty()`。
- `empty` 创建一个空的 Optional，不依赖任何变量。

`Optional.of` 和 `Optional.ofNullable` 怎么选？如果调用方确信值非 null，优先用 `of`，让它尽早暴露空值产生的源头。如果值确实可能为 null，用 `ofNullable`。

## 三、不要直接调用 get

`get()` 是 Optional 中最容易误用的方法之一：

```java
Optional<String> nickname = findNickname("missing");
// String name = nickname.get(); // 运行时抛 NoSuchElementException
```

`get()` 在有值时返回值，在为空时抛出 `NoSuchElementException`。这与直接返回 `null` 并依赖调用方"记得检查"的方案没有本质区别——问题只是从 NPE 变成了 `NoSuchElementException`。

后续的小节会给出更安全的替代方案。

## 四、在缺失时提供备选

### 4.1 orElse：提供默认值

当缺失时可以返回一个安全的默认值：

```java
String displayName = findNickname("missing").orElse("匿名用户");
System.out.println(displayName); // 匿名用户
```

`orElse` 的参数类型必须与 Optional 的泛型类型相同或是其子类型。如果 Optional 有值，返回该值；否则返回参数值。

### 4.2 orElseGet：仅在缺失时计算默认值

当默认值创建成本较高（例如需要调用数据库或远程服务）时，`orElseGet` 只在缺失时计算：

```java
String displayName = findNickname("missing")
    .orElseGet(() -> loadDefaultNameFromDatabase());
```

对比 `orElse`：

```java
String displayName = findNickname("missing")
    .orElse(loadDefaultNameFromDatabase()); // 即使有值也会调用
```

`orElse` 的参数总是先求值，不管 Optional 有没有值。`orElseGet` 的参数是 Supplier，只在 Optional 为空时调用。

### 4.3 orElseThrow：缺失时应阻止继续

当值必须存在才能继续时，不应该返回默认值掩盖错误：

```java
User user = findUserById(userId)
    .orElseThrow(() -> new IllegalArgumentException("用户不存在：" + userId));
```

如果有值则返回；如果为空则抛出指定的异常。这样在缺失时不继续执行后续逻辑，同时携带清晰的错误信息。

## 五、有值时变换

### 5.1 map：有值时转换

不必先 `isPresent()` 再 `get()`。Optional 的 `map` 只在有值时进行转换：

```java
Optional<Integer> length = findNickname("u-1")
    .map(String::length);

System.out.println(length); // Optional[3]
```

如果原始 Optional 为空，`map` 返回 `Optional.empty()`。

### 5.2 filter：有值且满足条件时保留

```java
Optional<String> longName = findNickname("u-1")
    .filter(name -> name.length() >= 3);

System.out.println(longName); // Optional[Ada]

Optional<String> shortName = findNickname("u-1")
    .filter(name -> name.length() >= 5);

System.out.println(shortName); // Optional.empty
```

`filter` 在 Optional 有值且满足 Predicate 时保留，否则返回空。结合 `orElse` 可以写出清晰的"有效的值才用"的链式逻辑。

### 5.3 flatMap：避免嵌套 Optional

当转换函数的返回结果本身是 Optional 时，`flatMap` 防止产生 `Optional<Optional<T>>`：

```java
// 如果 map 的 Lambda 返回 Optional
Optional<Optional<String>> nested = findNickname("u-1")
    .map(name -> findNickname(name)); // 套了两层

// 用 flatMap 展开
Optional<String> flat = findNickname("u-1")
    .flatMap(name -> findNickname(name));
```

### 5.4 实战链式读取配置

假设从配置文件逐层查找一个值：先查环境变量，没有时查本地配置，还没有时返回默认值。

```java
public static String lookupConfig(String key) {
    return Optional.ofNullable(System.getenv(key))      // 环境变量
        .or(() -> readFromLocalFile(key))                // 本地配置
        .orElse("default");                              // 最终默认值
}

private static Optional<String> readFromLocalFile(String key) {
    // 模拟从配置文件中按 key 读取值
    Map<String, String> props = Map.of("timeout", "30", "host", "localhost");
    return Optional.ofNullable(props.get(key));
}
```

`or`（JDK 9+）在 Optional 为空时执行另一个 Supplier<Optional<T>>，实现链式备选方案。相比嵌套 `orElse`，`or` 能将多个备选路径组合成一条声明式流水线。

### 5.5 ifPresent：只在有值时执行操作

```java
findNickname("u-1").ifPresent(name -> {
    System.out.println("找到用户：" + name);
});
```

`ifPresent` 适合只需要在有值时产生副作用的场景，如日志记录、缓存写入等。但如果操作链会演化出多条分支，先用 `orElseThrow` 取出值再用普通 if 更清晰。

## 六、isPresent 与 ifPresentOrElse

`isPresent()` 检查 Optional 是否有值，是 JDK 8 引入的最基本的检查方式：

```java
Optional<String> nickname = findNickname("u-1");
if (nickname.isPresent()) {
    System.out.println("昵称：" + nickname.get()); // 仍需要 get
}
```

`isPresent()` + `get()` 相当于把 Optional 还原成手工 null 检查。更推荐使用 `ifPresent`、`map` 或 `orElse`。

JDK 12 引入的 `ifPresentOrElse` 在有值和空值两种情况下分别执行操作：

```java
findNickname("u-1").ifPresentOrElse(
    name -> System.out.println("找到：" + name),
    () -> System.out.println("未找到用户")
);
```

`ifPresentOrElse` 适合需要同时处理"有值"和"无值"两种情况的完整分支场景。

## 七、Optional 的使用边界

### 7.1 适合作为返回值

```java
// 好的用法：返回值类型
public Optional<Customer> findByEmail(String email) { ... }

// 调用方能看到缺失的可能性
Optional<Customer> result = repo.findByEmail(email);
Customer customer = result.orElseThrow(() -> new NotFoundException(email));
```

### 7.2 不适合作为字段

```java
// 不推荐的用法
public class Order {
    private Optional<String> customerNote; // 不推荐
}
```

字段为 null 时的语义与 Optional 为空对开发者来说本质都是"没有值"，但 Optional 会增加序列化、JSON 转换和框架的复杂度。

### 7.3 不适合作为方法参数

```java
// 不推荐的用法
public void processOrder(Optional<Discount> discount) { ... }
```

方法参数中的 Optional 通常意味着调用方可以传入 null 或不传入。更清晰的表达方式是方法重载：

```java
public void processOrder() { ... }
public void processOrder(Discount discount) { ... }
```

### 7.4 空集合不需要 Optional

```java
// 不推荐：用 Optional 包装集合
public Optional<List<String>> findTags(String articleId) { ... }

// 推荐：直接返回空集合
public List<String> findTags(String articleId) {
    // 没有标签时返回空列表
    return List.of();
}
```

空 List 本身已经表达了"零个结果"的含义，不需要用 Optional 再包装一层。

## 八、Optional 与 Stream 配合

### 8.1 从 Optional 列表提取有效值

Optional 的 `stream()` 方法（JDK 9+）将 Optional 转换为 Stream：有值的 Optional 产生一个元素的 Stream，空的 Optional 产生空 Stream。这在处理批量查询结果时很实用。

```java
List<Optional<String>> nicknames = List.of(
    findNickname("u-1"),
    findNickname("missing"),
    findNickname("u-3")
);

// 过滤出有值的 Optional，并收集值
List<String> validNames = nicknames.stream()
    .flatMap(Optional::stream)
    .toList();
```

### 8.2 批量查找中的链式处理

假设有一个用户 ID 列表，要对每个 ID 查询昵称，只处理找到的用户：

```java
List<String> userIds = List.of("u-1", "missing", "u-3");

List<String> formatted = userIds.stream()
    .map(id -> findNickname(id))               // Stream<Optional<String>>
    .flatMap(Optional::stream)                  // 只保留有值的，展开为 Stream<String>
    .map(name -> "用户：" + name)               // 添加前缀
    .toList();

System.out.println(formatted); // [用户：Ada, 用户：Eve]
```

### 8.3 首次匹配

从多个备选查询中取第一个有结果的：

```java
Optional<String> result = Stream.of(
        findNickname("u-1"),
        findNickname("missing"),
        findNickname("u-3")
    )
    .filter(Optional::isPresent)
    .map(Optional::get)
    .findFirst();
```

这里先用 `filter(Optional::isPresent)` 去掉空值，再用 `map(Optional::get)` 取出值，`findFirst()` 返回第一个有结果的值。如果所有查询都无结果，返回 `Optional.empty()`。

### 8.4 传递给下游系统

当 Optional 的值需要经过多个函数处理时，保持 Optional 包装直到最终边界：

```java
public Optional<String> getDisplayName(String userId) {
    return findNickname(userId)
        .map(String::trim)              // 清洗空格
        .filter(name -> name.length() >= 2) // 至少两个字符
        .map(name -> "@" + name);       // 添加前缀
}
```

调用方根据业务需要决定最终处理方式：`orElse("匿名")`、`orElseThrow(...)` 或 `ifPresent(...)`。

## 九、练习

### 练习 1：安全的配置读取

实现一个方法 `static int readTimeout(String configKey)`，从 `Map<String, String>` 中读取配置值，解析为整数：

- 配置不存在时返回默认值 30
- 配置为空字符串时也返回 30
- 配置不是合法整数时抛 `IllegalArgumentException`，说明原因

使用 `Optional.ofNullable` 开始处理。不要使用 `get()`。

完成标准：三种情况各自被正确处理；不手动调用 `isPresent()` 检查。

### 练习 2：用户昵称安全显示

实现 `displayNameOf(String userId)`：

- 调用 `findNickname(userId)` 返回 `Optional<String>`
- 去掉昵称首尾空格
- 如果结果为空或清洗后为空，返回"匿名用户"
- 不使用 `get()`，不使用 `isPresent()`

完成标准：`findNickname("u-1")` 返回 "Ada"，`displayNameOf("u-1")` 返回 "Ada"；`findNickname("missing")` 返回 Optional.empty()，`displayNameOf("missing")` 返回 "匿名用户"。

### 练习 3：链式校验

实现 `static Optional<String> validatePassword(String input)`：

- 如果 input 为 null 或空串，返回 Optional.empty
- 如果长度小于 6，返回 Optional.empty
- 如果以上都通过，返回 `Optional.of(input)`

然后写一个调用者方法，接收 Optional 的结果，提供默认错误提示"密码不满足要求"。

完成标准：`validatePassword(null)` → empty → "密码不满足要求"；`validatePassword("abc123")` → Optional.of("abc123") → "abc123"。

## 常见误区

### `isPresent()` 后立刻 `get()`

```java
if (opt.isPresent()) {
    String value = opt.get(); // 重新回退到手工 null 检查
}
```

简单场景下这种写法没错，但它把 Optional 的可链式能力浪费了。用 `ifPresent`、`map`、`orElse` 写出声明式逻辑一般更简洁。

### 用 Optional 包装每个字段

Optional 是为返回值边界设计的。字段、参数、JSON DTO 中的 Optional 会让问题更复杂，而不是更安全。

### 用默认值掩盖必须存在的数据

用户必须存在才能继续的业务逻辑中，返回"匿名用户"可能掩盖真正的程序错误。根据场景判断是用默认值兜底，还是用 `orElseThrow` 快速失败。

### 在 Optional 中嵌套 Optional

```java
Optional<Optional<String>> nested = getOuter()
    .map(inner -> getInner()); // 嵌套
```

用 `flatMap` 展开嵌套，保持单一的 Optional 层级。

## 本章小结

Optional 让"可能没有结果"成为 API 的显式约定。创建 Optional 使用 `of`、`ofNullable` 和 `empty`。处理缺失值使用 `orElse`（默认值）、`orElseGet`（惰性默认值）或 `orElseThrow`（缺失即异常）。有值时的变换使用 `map` 和 `filter`。`isPresent()` + `get()` 相当于手工 null 检查链条，应优先使用 `ifPresent`、`map` 和 `orElse` 的链式方案。Optional 适合作为返回值，不适合作为字段、参数或序列化对象。空集合应直接返回空列表，不要用 Optional 包装。下一章学习文件 I/O、日期时间 API，并梳理 JDK 17 到后续版本的重要差异。

## 快速自测

1. `Optional.of(null)` 会怎样？
2. `orElse` 与 `orElseGet` 的行为差别是什么？
3. `Optional<String>` 做字段有哪些问题？
4. 空 List 返回 `Optional.of(List.of())` 是否推荐？为什么？

参考答案：抛 NullPointerException；orElse 的参数总是先求值，orElseGet 只在 Optional 为空时调用 Supplier；增加序列化和框架复杂度，字段的 null 与 Optional.empty 对调用方区别不大；不推荐，空集合本身已经表达了"零个结果"。

## 参考文献

- Oracle. [Java SE 17 API: Optional](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html).
- Oracle. [Optional: A Look at It in JDK 17](https://dev.java/learn/api/optional/).
