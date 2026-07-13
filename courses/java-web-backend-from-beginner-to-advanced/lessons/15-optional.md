# 第 15 章　Optional 与缺失值

> 学习提示：先区分“没有查到数据”“输入不合法”和“系统失败”，它们不应由同一种返回值表达。
> 一句话总结：Optional 用于明确表达方法可能没有返回结果；它应主要出现在返回值边界，通过 map、filter 和默认值处理缺失，而不是替代所有 null 或异常。

## 缺失、拒绝与失败不是一回事

假设按编号查询昵称：

- 用户不存在：查询没有结果。
- 编号格式错误：调用方输入不合法。
- 数据库不可用：系统失败。

这三种情况不能都返回空字符串，也不应都抛同一种异常。[[Optional]]适合表示第一种：一个正常查询可能找不到结果。

```java
Optional<String> findNickname(String userId) {
    if ("u-1".equals(userId)) {
        return Optional.of("Ada");
    }
    return Optional.empty();
}
```

`Optional<String>` 表示“可能有一个 String，也可能没有”。它让调用方在类型上看见缺失可能，而不是把 `null` 藏在普通 String 返回值里。

## 创建 Optional

三个常用工厂方法：

```java
Optional<String> known = Optional.of("Java");
Optional<String> maybe = Optional.ofNullable(null);
Optional<String> empty = Optional.empty();
```

`of` 只接收非 null 值；传入 null 会立即抛 `NullPointerException`。已有变量可能为 null 时使用 `ofNullable`。明确没有结果时使用 `empty`。

不要把 Optional 当作“可以随处装 null 的盒子”。它的价值在于方法签名和调用链清楚地表达缺失。

## 不直接调用 get

`get()` 在有值时返回内容，在为空时抛 `NoSuchElementException`：

```java
Optional<String> nickname = findNickname("missing");
// nickname.get(); // 运行时失败
```

`get` 并没有真正处理缺失，只是把问题推迟。根据业务需要选择更明确的方式。

有合理默认值：

```java
String displayName = findNickname("missing").orElse("匿名用户");
```

默认值创建成本较高或需要延迟计算：

```java
String displayName = findNickname("missing")
    .orElseGet(() -> loadDefaultName());
```

`orElse` 的参数会先计算，`orElseGet` 只在 Optional 为空时执行 Lambda。默认值只是展示兜底时适合；若缺失必须阻止后续操作，应使用明确异常：

```java
String nickname = findNickname("missing")
    .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
```

## 在有值时转换或筛选

不必先 `isPresent()` 再 `get()`。Optional 的 `map` 只在有值时转换：

```java
Optional<Integer> length = findNickname("u-1")
    .map(String::length);
```

`filter` 保留满足条件的值：

```java
Optional<String> longName = findNickname("u-1")
    .filter(name -> name.length() >= 3);
```

需要在有值时执行简单动作可使用 `ifPresent`：

```java
findNickname("u-1").ifPresent(System.out::println);
```

但业务流程不能被拆成很多 ifPresent Lambda。若后续分支复杂，先用 `orElseThrow` 取出必需对象，或用普通 if 写清楚路径。

## Optional 的使用边界

Optional 最适合作为“可能查不到单个结果”的返回值。通常不建议作为字段、构造器参数或 JSON DTO 字段：它会增加序列化、框架和调用代码的复杂度，而 `null` 的缺失语义仍需处理。

空集合也不必包装 Optional：

```java
List<String> findTags(String articleId) {
    return List.of(); // 没有标签时返回空列表
}
```

集合本身已经能表达“零个结果”。第 22 章处理 JSON DTO 时，会进一步区分字段缺失、null 和空数组的接口含义。

## 练习：安全显示昵称

实现 `displayNameOf(String userId)`：调用一个返回 `Optional<String>` 的查询方法，去掉昵称首尾空格；若结果为空或清洗后为空，返回“匿名用户”。不要调用 get，不要在方法内部返回 null。

完成标准：能解释为什么使用 `map`；默认值只在需要时产生；查询无结果不与数据库异常混为一谈。

## 常见误区

### `isPresent()` 后立刻 `get()`

这相当于把 Optional 还原成手工 null 检查。简单场景可读，复杂链条优先使用 map、orElse、orElseThrow。

### 用 Optional 包装每个字段

Optional 的设计重点是返回值边界。字段和参数中使用它往往让框架和序列化更复杂。

### 用默认值掩盖必须存在的数据

用户必须存在才能继续时，返回“匿名用户”会掩盖业务错误。根据场景选择默认值还是抛出明确异常。

## 本章小结

Optional 让“可能没有结果”成为显式 API 契约。用 `ofNullable` 创建可能缺失的值，用 map/filter 处理有值分支，用 orElse/orElseGet/orElseThrow 决定缺失后的行为；不要把它变成 null 的通用替身。

## 快速自测

1. `Optional.of(null)` 会怎样？
2. `orElse` 与 `orElseGet` 的区别是什么？
3. 为什么空 List 通常不需要 Optional 包装？

参考答案：抛 NullPointerException；前者立即计算默认值，后者仅在为空时调用供应者；空集合已经表达“没有元素”。

## 参考文献

- Oracle. [Java SE 17 API: Optional](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html).
