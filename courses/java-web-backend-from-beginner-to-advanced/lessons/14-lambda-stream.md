# 第 14 章　Lambda 与 Stream 基础

> 学习提示：先把一个普通循环读懂，再只替换其中一个步骤为 Lambda 或 Stream；不要从长链式代码开始。
> 一句话总结：Lambda 把短小行为写成值，Stream 把集合处理拆成过滤、转换和收集等步骤；它们提高表达力，但不替代清楚的业务命名和普通循环。

## 先看“行为”为什么也要传递

第 10 章的接口描述能力。若一个接口只有一个抽象方法，它可以是[[函数式接口]]，调用方可以把一段短小行为作为参数传递。

例如 `Runnable` 代表“不接收参数、不返回值的一段任务”。传统写法需要匿名类：

```java
Runnable task = new Runnable() {
    @Override
    public void run() {
        System.out.println("执行任务");
    }
};
```

Lambda 用更短写法表达同一个行为：

```java
Runnable task = () -> System.out.println("执行任务");
```

`()` 是参数列表，`->` 读作“映射到”，右侧是方法体。Lambda 不是“随便写一段代码”，它必须匹配某个函数式接口的方法签名。

## 带参数和返回值的 Lambda

Java 标准库提供 `Predicate<T>`、`Function<T, R>` 等常见函数式接口：

```java
Predicate<String> notBlank = text -> !text.isBlank();
Function<String, Integer> lengthOf = text -> text.length();

System.out.println(notBlank.test("Java")); // true
System.out.println(lengthOf.apply("Java")); // 4
```

Lambda 参数类型能由目标接口推断时可以省略。参数只有一个时，括号也可省略：`text -> text.length()`。方法体有多句时使用花括号，并显式 `return`：

```java
Function<String, String> normalize = text -> {
    String trimmed = text.trim();
    return trimmed.toUpperCase();
};
```

Lambda 会捕获外部局部变量，但该变量必须是 final 或[[有效 final]]，也就是赋值后不再修改。这样可避免异步或延迟执行时读到难以预测的局部状态。

## Stream 不是集合

[[Stream]]是对一组元素进行处理的流水线，不保存元素本身。它常从集合取得：

```java
List<String> names = List.of("Ada", "", "Lin");
Stream<String> stream = names.stream();
```

Stream 操作分两类：

- [[中间操作]]返回新的 Stream，例如 `filter`、`map`、`sorted`；它们通常是惰性的。
- [[终止操作]]产生结果或副作用，例如 `toList`、`forEach`、`count`；它会触发流水线执行。

先用普通循环完成需求：保留非空名字，转大写，得到新 List。

```java
List<String> result = new ArrayList<>();
for (String name : names) {
    if (!name.isBlank()) {
        result.add(name.toUpperCase());
    }
}
```

再写成 Stream：

```java
List<String> result = names.stream()
    .filter(name -> !name.isBlank())
    .map(String::toUpperCase)
    .toList();
```

`filter` 的 Lambda 要返回 boolean；`map` 把每个元素转换成另一个值；`toList` 收集最终结果。`String::toUpperCase` 是方法引用，等价于 `name -> name.toUpperCase()`。

## 读懂执行顺序

Stream 不会在每个中间操作时立刻遍历全部元素。只有调用终止操作后，它才按元素推进流水线。通常一个元素先经过所有必要步骤，再处理下一个元素，而不是先过滤完整个列表再映射完整个列表。

一个 Stream 使用终止操作后不能复用：

```java
Stream<String> stream = names.stream();
long count = stream.count();
// stream.toList(); // IllegalStateException
```

需要第二次处理时，从集合重新创建 `names.stream()`。

## 什么时候用循环，什么时候用 Stream

Stream 很适合“从集合取元素 → 筛选 → 转换 → 收集”的数据流。普通循环仍适合：

- 需要多层 break/continue 的复杂控制流。
- 需要在每一步维护多个可变状态。
- 需要清楚地处理异常或提前返回。

不要为了“函数式”而把十几个操作链在一行。流水线长到不能用一句话说明目的时，拆出命名方法或回到循环。

`forEach` 适合最后的观察或简单输出，不应在其中修改外部集合：

```java
names.forEach(System.out::println);
```

并行 Stream 不在本课程主线。第 34 章讲线程与并发后，才能讨论为什么 `.parallel()` 不是自动加速按钮。

## 练习：从循环迁移到 Stream

给定：

```java
List<String> titles = List.of(" java ", "", "Spring", "java");
```

先用循环完成：去空白、跳过空文本、转大写、收集成新 List。然后改写为 Stream。两版都打印结果，并解释每个 Stream 操作对应循环中的哪一步。

完成标准：不修改原 List；`filter` 返回 boolean；`map` 返回转换后的值；使用 `toList` 结束流。

## 常见误区

### 把 Stream 当成可重复使用的集合

Stream 是一次处理管道。终止后需要从数据源重新创建。

### 在 `forEach` 中修改外部状态

这会让数据流难读，且在并发场景更危险。优先用 `map`、`filter`、`collect` 表达结果。

### 直接上并行 Stream

并行涉及线程、数据安全和任务拆分，不能只凭一行 `.parallel()` 判断会更快。

## 本章小结

Lambda 是函数式接口的简洁实现方式，Stream 是集合处理的声明式流水线。先能写清楚普通循环，再用 filter、map、toList 表达稳定的数据转换；复杂控制流不必强行改写。

## 快速自测

1. Lambda 必须匹配什么类型的接口？
2. `filter` 与 `map` 的返回结果分别是什么？
3. 为什么同一个 Stream 不能终止两次？

参考答案：函数式接口；filter 保留/丢弃元素的 boolean，map 转换后的元素；终止操作会消费流水线。

## 参考文献

- Oracle. [Java SE 17 API: Stream](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/Stream.html).
- Oracle. [Java SE 17 API: java.util.function](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/function/package-summary.html).
