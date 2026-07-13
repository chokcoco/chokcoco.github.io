# 第 13 章　List、Set 与 Map

> 学习提示：先按“是否需要顺序、是否允许重复、是否按键查找”选择集合接口，再考虑具体实现类。
> 一句话总结：List 表示有顺序的元素序列，Set 表示不重复元素，Map 表示键到值的映射；集合行为依赖泛型、相等性和可变性规则。

## 数组不够用时

数组长度固定，创建后不能方便地增删元素。[[集合]]提供可变长度的数据结构。Java 集合先看接口含义，再选择实现类；初学阶段最常用的是 `ArrayList`、`HashSet` 和 `HashMap`。

集合都应带泛型：

```java
List<String> names = new ArrayList<>();
```

这行表示“一个保存 String 的 List”。不要写原始类型 `List names`，否则会失去第 12 章建立的类型检查。

## List 保留元素顺序

[[List]]表示有顺序、允许重复的元素序列：

```java
List<String> tasks = new ArrayList<>();
tasks.add("学习变量");
tasks.add("学习集合");
tasks.add("学习变量");

System.out.println(tasks.get(0)); // 学习变量
System.out.println(tasks.size()); // 3
```

List 与数组一样按 0 开始的下标读取，但长度会随着 add/remove 改变：

```java
tasks.remove("学习变量"); // 删除第一个匹配项
tasks.set(0, "学习异常"); // 替换指定下标元素
```

遍历优先使用增强 for：

```java
for (String task : tasks) {
    System.out.println(task);
}
```

遍历时不要直接对同一个 List 调用结构性 add/remove，否则可能抛出 `ConcurrentModificationException`。需要按条件删除时，第 14 章会学习更合适的 Stream 方式；也可以使用迭代器，但当前先建立“遍历期间不要随手改结构”的边界。

## Set 表示唯一性

[[Set]]不保留重复元素：

```java
Set<String> tags = new HashSet<>();
tags.add("java");
tags.add("web");
tags.add("java");

System.out.println(tags.size()); // 2
```

`HashSet` 通常不承诺遍历顺序。若业务需要保留插入顺序，后续可选择 `LinkedHashSet`；若需要排序，才考虑 `TreeSet`。先不要为了“看起来更高级”默认选择排序集合。

Set 如何判断重复？对对象使用 `equals` 和 `hashCode`。第 6 章已经说明这两个方法要保持一致：若两个对象 `equals` 为 true，它们的 hashCode 必须相同。作为 Set 元素或 Map key 的对象，其影响相等性的字段不应在放入后修改，否则可能再也找不到它。

## Map 按键查找值

[[Map]]保存 key 到 value 的映射：

```java
Map<String, Integer> stockByProduct = new HashMap<>();
stockByProduct.put("book", 10);
stockByProduct.put("pen", 20);

System.out.println(stockByProduct.get("book")); // 10
```

同一个 key 再次 put 会覆盖旧 value：

```java
stockByProduct.put("book", 8);
```

不存在的 key，`get` 返回 `null`。若需要默认值，可使用：

```java
int stock = stockByProduct.getOrDefault("notebook", 0);
```

遍历 Map 时，通常读取 entry：

```java
for (Map.Entry<String, Integer> entry : stockByProduct.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
```

不要写 `for (String key : map.keySet()) { map.get(key); }` 来处理大量数据后再做复杂查找；entrySet 一次就提供了键和值。

## 常见实现怎样选择

| 接口 | 常用实现 | 主要特征 |
| --- | --- | --- |
| List | ArrayList | 按下标读取快，适合大多数顺序列表 |
| Set | HashSet | 去重，通常不保证顺序 |
| Map | HashMap | 按 key 查找，通常不保证遍历顺序 |

集合变量优先声明为接口类型，例如 `List<String>` 而不是 `ArrayList<String>`。这样调用方依赖的是“列表能做什么”，实现细节可在需要时替换。

Java 也提供 `List.of(...)`、`Set.of(...)`、`Map.of(...)` 创建不可修改集合：

```java
List<String> levels = List.of("LOW", "MEDIUM", "HIGH");
// levels.add("URGENT"); // 运行时 UnsupportedOperationException
```

它适合固定配置或测试数据。若后面需要 add/remove，就创建 `new ArrayList<>(levels)` 得到可变副本。

## 练习：三种数据关系

实现三个小需求：

1. 用 List 保存用户按点击顺序加入的商品。
2. 用 Set 保存标签，重复标签只保留一个。
3. 用 Map 按商品编号查库存，查不到时显示 0。

完成标准：能说明为什么三个需求不能都使用同一种集合；声明都带泛型；不假设 HashSet/HashMap 的遍历顺序。

## 常见误区

### 用 List 做去重

List 允许重复。若业务语义是“只能出现一次”，使用 Set 或先明确去重规则。

### 以为 HashMap 的顺序稳定

HashMap 不承诺迭代顺序。接口响应、日志或测试若需要顺序，应主动选择并说明对应实现。

### 修改 Map key 的相等性字段

若 key 的 equals/hashCode 依赖字段在放入后变化，HashMap 可能无法正确定位它。用不可变值作 key 最安全。

## 本章小结

集合的第一选择来自数据关系：List 关心顺序，Set 关心唯一性，Map 关心按键定位。泛型保证元素类型，equals/hashCode 决定哈希集合中的重复与定位。下一章会在集合基础上使用 Lambda 和 Stream 描述处理流水线。

## 快速自测

1. List、Set、Map 分别解决什么数据关系？
2. HashSet 如何判断两个对象重复？
3. 为什么 `List.of` 创建后不能 add？

参考答案：顺序序列、唯一元素、键值映射；依据 equals/hashCode；它返回不可修改集合。

## 参考文献

- Oracle. [Java SE 17 API: Collections Framework](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/doc-files/coll-overview.html).
- Oracle. [Java SE 17 API: Map](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Map.html).
