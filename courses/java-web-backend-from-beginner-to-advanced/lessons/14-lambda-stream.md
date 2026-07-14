# 第 14 章　Lambda 与 Stream 基础

> 学习提示：先理解"行为也可以作为参数传递"，再从匿名类改写为 Lambda，最后用 Stream 表达集合的数据流水线。
> 一句话总结：Lambda 是函数式接口的简洁实现，Stream 是集合处理的高层流水线；filter、map、toList 三个操作就能覆盖多数日常场景。

## 一、行为可以作为参数传递

### 1.1 从匿名类到 Lambda

第 10 章讲到接口可以声明能力。如果一个接口只有一个抽象方法，它就是[[函数式接口]]（functional interface）。例如 Java 标准库中的 `Runnable`：

```java
@FunctionalInterface
public interface Runnable {
    void run();
}
```

在 Lambda 出现之前，传递一段行为需要创建匿名类：

```java
Runnable task = new Runnable() {
    @Override
    public void run() {
        System.out.println("执行任务");
    }
};

new Thread(task).start(); // 在另一个线程中执行
```

匿名类的写法明确了"实现了什么接口、覆盖了什么方法"，但样板代码偏多——只关心 `run()` 中的那一行代码。

[[Lambda 表达式]]用更短的方式表达同一个行为：

```java
Runnable task = () -> System.out.println("执行任务");
new Thread(task).start();
```

`()` 是方法参数列表，`->` 读作"映射到"，右侧是方法体。Lambda 必须匹配某个函数式接口的方法签名。

### 1.2 Lambda 的语法形式

```java
// 无参数，单条语句
() -> System.out.println("Hello")

// 一个参数，可省略括号
text -> text.length()

// 多个参数，需要括号
(a, b) -> a.compareTo(b)

// 多行方法体，需要花括号和 return
(a, b) -> {
    int result = a.compareTo(b);
    System.out.println("比较结果：" + result);
    return result;
}
```

Lambda 的参数类型可由编译器从目标方法签名推断，通常不需要显式写出：

```java
// 编译器知道 Predicate<String> 的 test 方法接收 String
Predicate<String> notBlank = text -> !text.isBlank();
// 等价于：(String text) -> { return !text.isBlank(); }
```

### 1.3 常见的函数式接口

Java 标准库 `java.util.function` 包提供了多个通用函数式接口：

```java
// Predicate<T>：接收一个参数，返回 boolean
Predicate<String> isEmpty = s -> s.isEmpty();
System.out.println(isEmpty.test("")); // true

// Function<T, R>：接收 T，返回 R
Function<String, Integer> lengthOf = s -> s.length();
System.out.println(lengthOf.apply("Java")); // 4

// Consumer<T>：接收 T，不返回结果
Consumer<String> printer = s -> System.out.println(s);
printer.accept("打印这行"); // 打印这行

// Supplier<T>：不接收参数，返回 T
Supplier<Double> random = () -> Math.random();

// Comparator<T>：接收两个 T，返回 int（比较顺序）
Comparator<Integer> natural = (a, b) -> a.compareTo(b);
```

不是所有单方法接口都需要加上 `@FunctionalInterface` 注解。接口只有一个抽象方法就是函数式接口；标注注解只是让编译器帮助检查。

### 1.4 局部变量捕获

Lambda 可以访问方法内的局部变量，但这些变量必须是 [[有效 final]]（effectively final）——赋值后不再修改：

```java
String prefix = "用户："; // 后面不再修改，有效 final
Function<String, String> wrap = name -> prefix + name;
System.out.println(wrap.apply("Ada")); // 用户：Ada
```

如果尝试修改被捕获的变量，编译会报错：

```java
// String prefix = "用户：";
// prefix = "新前缀："; // 编译错误：被 Lambda 使用的变量必须是 final 或有效 final
```

这条规则的原因是 Lambda 可能在另一个线程或延迟执行的上下文中运行。如果变量允许修改，将引入竞态条件和可见性问题。

### 1.5 方法引用

当 Lambda 体仅仅是调用某个现有方法时，可以简化为[[方法引用]]：

```java
// Lambda 形式
Function<String, Integer> parser = s -> Integer.parseInt(s);

// 方法引用形式
Function<String, Integer> parser = Integer::parseInt;
```

三种常见的方法引用模式：

```java
// 1. 静态方法引用：ClassName::staticMethod
Comparator<Integer> cmp = Integer::compare;

// 2. 实例方法引用（特定实例）：instance::method
String text = "hello";
Supplier<Integer> len = text::length;

// 3. 实例方法引用（任意实例）：ClassName::instanceMethod
Function<String, Integer> len2 = String::length;
```

方法引用让代码更紧凑，但只在方法调用是 Lambda 体的唯一操作时才有用。如果 Lambda 体包含多个操作，保持 Lambda 写法更清晰。

## 二、Stream 基础

### 2.1 从循环到 Stream

[[Stream]]是对一组元素进行操作的流水线，不保存元素。它通常从集合或其他数据源获取：

```java
List<String> names = List.of("Ada", "", "Lin", "Bob", "");
```

先看普通的循环处理方式，保留非空名字，转大写，收集为新列表：

```java
List<String> result = new ArrayList<>();
for (String name : names) {
    if (!name.isBlank()) {
        result.add(name.toUpperCase());
    }
}
System.out.println(result); // [ADA, LIN, BOB]
```

改成 Stream：

```java
List<String> result = names.stream()
    .filter(name -> !name.isBlank())
    .map(String::toUpperCase)
    .toList();

System.out.println(result); // [ADA, LIN, BOB]
```

逐个说明每个操作：

- `stream()`：从集合创建 Stream。`List.stream()` 按集合的迭代顺序创建流水线。
- `filter(...)`：[[中间操作]]，保留满足 Lambda 条件的元素（Lambda 返回 true 的保留）。输入和输出都是 Stream，类型不变。
- `map(...)`：[[中间操作]]，将每个元素转换为另一个值。上例中把 String 映射为大写 String。
- `toList()`：[[终止操作]]，把 Stream 的元素收集到新 List。使用后流水线关闭。

### 2.2 中间操作和终止操作

Stream 的操作分两类：

[[中间操作]]返回一个新的 Stream，可以链式调用。常见的中间操作：

```java
List<Integer> numbers = List.of(1, 2, 2, 3, 4, 5);

// filter：过滤（保留满足条件的）
numbers.stream()
    .filter(n -> n > 2)    // [3, 4, 5]

// map：转换
    .map(n -> n * 2);      // [6, 8, 10]

// distinct：去重
numbers.stream()
    .distinct()            // [1, 2, 3, 4, 5]

// sorted：排序
    .sorted()              // [1, 2, 3, 4, 5]

// limit：只取前几个
    .limit(3)              // [1, 2, 3]

// skip：跳过前几个
    .skip(1)               // [2, 3, 4, 5]
```

[[终止操作]]触发 Stream 处理并产生结果。终止操作后 Stream 不能复用：

```java
List<Integer> numbers = List.of(3, 1, 4, 1, 5, 9);

long count = numbers.stream().count();          // 6
List<Integer> collected = numbers.stream()
    .distinct()
    .sorted()
    .toList();                                   // [1, 3, 4, 5, 9]

Integer min = numbers.stream().min(Integer::compareTo).orElse(0); // 1
Integer max = numbers.stream().max(Integer::compareTo).orElse(0); // 9

boolean anyMatch = numbers.stream().anyMatch(n -> n > 5); // true
boolean allMatch = numbers.stream().allMatch(n -> n > 0); // true
```

### 2.3 Stream 的执行顺序

Stream 不会在每个中间操作时都遍历整个集合。元素沿着流水线逐个推进：第一个元素通过 `filter` → 通过 `map` → 进入 `toList`，然后第二个元素，依此类推。

```java
List<String> words = List.of("apple", "banana", "cherry");

List<String> result = words.stream()
    .filter(w -> {
        System.out.println("filter: " + w);
        return w.length() > 5;
    })
    .map(w -> {
        System.out.println("map: " + w);
        return w.toUpperCase();
    })
    .toList();
```

输出顺序：

```text
filter: apple      // apple 长度 5，不满足 >5，被丢弃
filter: banana     // banana 长度 6，通过 → 进入 map
map: banana        → 映射为大写
filter: cherry     // cherry 长度 6，通过 → 进入 map
map: cherry        → 映射为大写
```

不是先处理完所有 filter 再处理所有 map，而是一个元素走完整个流水线后，下一个才开始。

### 2.4 惰性求值

中间操作是惰性的：在调用终止操作之前，中间操作不会实际执行：

```java
Stream<String> stream = names.stream()
    .filter(name -> {
        System.out.println("filter: " + name);
        return !name.isBlank();
    });

// 此时 filter 还没有执行！没有输出。
System.out.println("Stream 已创建");

long count = stream.count(); // 这里才触发执行
```

这个特性意味着可以构建复杂的流水线而不必担心不必要的计算。只有终止操作真正消耗 Stream。

### 2.5 Stream 的一次性

Stream 被终止操作消耗后不能复用：

```java
Stream<String> stream = names.stream();
long count1 = stream.count();      // 正常
// long count2 = stream.count();   // IllegalStateException: stream has already been operated upon or closed
```

如果需要第二次操作，从集合重新获取：

```java
long count1 = names.stream().count();
long count2 = names.stream().filter(s -> s.length() > 3).count();
```

## 三、flatMap：展开嵌套结构

`flatMap` 用于将嵌套的集合展开成单一 Stream：

```java
List<List<Integer>> nested = List.of(
    List.of(1, 2),
    List.of(3, 4, 5),
    List.of(6)
);

List<Integer> flat = nested.stream()
    .flatMap(list -> list.stream())
    .toList();

System.out.println(flat); // [1, 2, 3, 4, 5, 6]
```

`map` 会产生 Stream 的 Stream（Stream<Stream<Integer>>），`flatMap` 把嵌套扁平成单一 Stream。日常编码中，`flatMap` 主要用于处理一对多的转换。

使用场景：按标签查找所有文章时，每个标签对应多篇文章；多层级分类的扁平化等。

## 四、reduce：归约

`reduce` 将 Stream 的所有元素归约为一个值：

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);

// 初始值 0，累加（identity + 累加函数）
int sum = numbers.stream()
    .reduce(0, (a, b) -> a + b);
System.out.println(sum); // 15

// 归约为最大值
int max = numbers.stream()
    .reduce(Integer.MIN_VALUE, (a, b) -> a > b ? a : b);
System.out.println(max); // 5
```

`reduce` 的泛型版本 `reduce(U identity, BiFunction<U, ? super T, U> accumulator, BinaryOperator<U> combiner)` 并行时用于合并分片结果。初学阶段较少用到 reduce，多数归约需求可以用 `sum`、`count`、`min`、`max` 和 `collect(Collectors.toList())` 等专用终止操作满足。

## 五、什么时候用循环，什么时候用 Stream

Stream 的工具箱（filter、map、distinct、sorted、toList）适合以下场景：

- 从集合中筛选元素（filter）
- 转换每个元素（map）
- 去重（distinct）
- 按条件检查是否存在元素（anyMatch、allMatch）
- 收集到新集合（toList）

普通循环更适合以下场景：

- 多层 `break`/`continue` 的嵌套控制流
- 在循环中向多个位置写入结果
- 需要在同一个循环中维护多个可变状态
- 需要清理资源（Stream 的 try-with-resources 在 `Files.lines` 等 I/O 操作中可用）
- Stream 无法舒适表达的条件提前退出

```java
// Stream 适合的写法
List<String> processed = items.stream()
    .filter(item -> !item.isBlank())
    .map(String::toUpperCase)
    .toList();

// 循环更适合的写法：多个状态同时更新
List<String> valid = new ArrayList<>();
int failed = 0;
for (String item : items) {
    if (item == null) {
        failed++;
        continue; // 包含 continue
    }
    String trimmed = item.trim();
    if (!trimmed.isEmpty()) {
        valid.add(trimmed.toUpperCase());
    }
}
```

不要为了"函数式"把十几个操作链凑在一行。一条 Stream 流水线超过三到四个操作且目的不直观时，拆出命名方法或副变量：

```java
// 不好：一行太长
List<String> result = source.stream().filter(s -> s != null).map(String::trim).filter(s -> !s.isEmpty()).map(String::toUpperCase).sorted().collect(Collectors.toList());

// 更好：换行且保持可读
List<String> result = source.stream()
    .filter(s -> s != null)
    .map(String::trim)
    .filter(s -> !s.isEmpty())
    .map(String::toUpperCase)
    .sorted()
    .toList();
```

## 六、练习

### 练习 1：从循环改写为 Stream

给定：

```java
List<Integer> numbers = List.of(3, -1, 5, -2, 8, 0, -4);
```

先用循环完成以下操作：剔除负数、将剩余数字乘以 2、按自然排序、收集成新 List。然后改写为 Stream 版本。两版都输出结果。

完成标准：两个版本输出相同；Stream 版本不修改原 List。

### 练习 2：方法引用实践

将以下 Lambda 改为方法引用：

```java
List<String> words = List.of("apple", "banana", "cherry");

// 改为方法引用
words.stream()
    .map(s -> s.toUpperCase())
    .filter(s -> !s.isEmpty())
    .forEach(s -> System.out.println(s));
```

### 练习 3：单词长度统计

给定一个句子字符串：

```java
String sentence = "Java Stream Lambda Filter Map Collect";
```

拆分为单词列表，然后：

1. 筛选出长度大于 3 的单词
2. 转换为小写
3. 按字母顺序排序
4. 收集为新 List

完成标准：不使用循环完成上述操作。

## 常见误区

### 把 Stream 当作可重复使用的集合

Stream 是单次消费的流水线。终止操作后需要从头重新创建。如果需要重复遍历或随机访问，使用集合。

### 在 forEach 中修改外部集合

```java
List<String> result = new ArrayList<>();
stream.forEach(item -> result.add(item)); // 不推荐
```

for 循环或 `collect/toList` 更安全。`forEach` 内部修改外部可变状态在单线程下碰巧可行，但在并发或复杂流水线中很难保证正确。

### 用并行 Stream 加速一切

```java
list.parallelStream().forEach(System.out::println);
```

并行 Stream 内部使用 ForkJoinPool，涉及线程拆分、合并和同步。对于小数据量或 I/O 密集操作，它可能比普通 Stream 更慢。第 34 章讲完并发后再讨论并行。

### 过度使用方法引用让代码难以理解

```java
// 当方法签名不直观时，Lambda 比方法引用更容易理解
items.stream().map(SomeClass::obscurelyNamedMethod) // 需要跳转查看
items.stream().map(item -> item.obscurelyNamedMethod()) // 直接看到方法名
```

方法引用在方法名称自解释时好用。当方法名不直观或需要额外上下文时，保持 Lambda 写法。

## 本章小结

Lambda 是函数式接口的简洁实现形式，通过 `->` 把方法参数和方法体连接起来。Stream 是集合处理的高层流水线，分中间操作（filter、map、distinct、sorted）和终止操作（toList、count、forEach）。中间操作惰性且返回新 Stream，终止操作触发计算并关闭流水线。一个元素依次经过全部操作后下一个才进入处理。`flatMap` 展开嵌套结构，`reduce` 归约为单个值。Stream 适合筛选转换类操作，复杂控制流保持普通循环。方法引用让简单的 Lambda 调用更紧凑，但不是必须使用。下一章基于集合和 Lambda 学习 Optional——如何安全表达查询无结果的场景。

## 快速自测

1. Lambda 表达式必须在什么类型的接口中使用？
2. `filter` 和 `map` 各自返回什么？`filter` 的参数应该返回什么？
3. 为什么同一个 Stream 不能执行两次终止操作？
4. 中间操作是惰性的，这有什么实际好处？

参考答案：函数式接口（只有一个抽象方法的接口）；filter 返回的 Stream 元素类型不变，map 可以改变类型，filter 的参数（Predicate）应返回 boolean；Stream 被终止操作消耗后关闭；不必立即计算全部元素，可以按需逐个处理整个流水线，提前终止时避免不必要的处理开销。

## 参考文献

- Oracle. [Java SE 17 API: Stream](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/stream/Stream.html).
- Oracle. [Java SE 17 API: java.util.function](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/function/package-summary.html).
- Oracle. [Java SE 17 API: Lambda Expressions](https://docs.oracle.com/javase/tutorial/java/javaOO/lambda expressions.html).
- Oracle. [Java SE 17 API: Method References](https://docs.oracle.com/javase/tutorial/java/javaOO/methodreferences.html).
