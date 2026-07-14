# 第 13 章　List、Set 与 Map

> 学习提示：先根据数据关系选择集合接口：是否需要顺序、是否允许重复、是否按键查找。再选择具体实现。
> 一句话总结：List 管理有序序列，Set 保证元素唯一性，Map 建立键到值的映射；集合的实际行为依赖 equals/hashCode、可变性和泛型。

## 一、从数组到集合

第 7 章学习了数组：固定长度、通过下标访问、可以保存基本类型或引用类型。数组的问题是创建后长度不能改变。

```java
// 如果需要在 "Java", "Spring", "Docker" 之后再添加一个 "Redis"
String[] topics = {"Java", "Spring", "Docker"};
// topics[3] = "Redis"; // ArrayIndexOutOfBoundsException
```

[[集合框架]]（Collections Framework）提供可变长度的数据容器。JDK 17 的集合框架包含多个接口和实现类，但初学阶段掌握三个接口和它们最常用的实现就够用：

| 接口 | 核心语义 | 常用实现 | 初始使用场景 |
| --- | --- | --- | --- |
| `List` | 有序、可重复 | `ArrayList` | 需要按添加顺序访问的元素序列 |
| `Set` | 不重复、唯一性 | `HashSet` | 需要确保元素不重复的集合 |
| `Map` | 键到值的映射 | `HashMap` | 需要按键查找对应值 |

集合都应带上泛型：

```java
List<String> names = new ArrayList<>(); // 明确保存 String
Set<Integer> ids = new HashSet<>();     // 明确保存 Integer
Map<String, Integer> scores = new HashMap<>(); // 明确键和值类型
```

不要使用原始类型 `List items = new ArrayList();`，否则会失去第 12 章建立的泛型保护。

## 二、List：有序、可重复的序列

### 2.1 ArrayList 的基本操作

[[List]]表示一个有顺序、允许重复元素的序列。最常用的实现是 [[ArrayList]]，它内部使用数组存储，按下标读取元素非常快。

```java
List<String> tasks = new ArrayList<>();
tasks.add("学习变量");
tasks.add("学习集合");
tasks.add("学习变量");

System.out.println(tasks.get(0));   // 学习变量
System.out.println(tasks.size());   // 3
System.out.println(tasks.isEmpty());// false
```

`add(E element)` 在末尾追加元素。`add(int index, E element)` 在指定位置插入：

```java
tasks.add(1, "学习异常");
System.out.println(tasks); // [学习变量, 学习异常, 学习集合, 学习变量]
```

删除元素：

```java
tasks.remove("学习变量"); // 删除第一个匹配项，返回 boolean
tasks.remove(0);           // 按下标删除，返回被删除的元素

System.out.println(tasks); // [学习异常, 学习集合]
```

修改元素：

```java
tasks.set(0, "学习数组"); // 替换指定下标位置的元素
System.out.println(tasks); // [学习数组, 学习集合]
```

### 2.2 遍历 List

增强 for 循环是最常用的遍历方式：

```java
for (String task : tasks) {
    System.out.println(task);
}
```

使用下标遍历：

```java
for (int i = 0; i < tasks.size(); i++) {
    System.out.println(i + ": " + tasks.get(i));
}
```

两种方式的选择：增强 for 更简洁，适合不需要下标的场景；下标遍历适合需要知道元素位置的场景。

遍历时不要通过 List 本身添加或删除元素，否则可能抛出 `ConcurrentModificationException`：

```java
for (String task : tasks) {
    if (task.equals("学习集合")) {
        // tasks.remove(task); // 可能抛出 ConcurrentModificationException
    }
}
```

需要条件删除时，可以使用 `removeIf`（JDK 8+）或先记录要删除的元素再统一删除：

```java
tasks.removeIf(task -> task.equals("学习集合"));
```

### 2.3 ArrayList vs LinkedList

| 操作 | ArrayList | LinkedList |
| --- | --- | --- |
| 按下标访问 | O(1) | O(n) |
| 末尾插入/删除 | O(1) 均摊 | O(1) |
| 中间插入/删除 | O(n) | O(n) |
| 内存占用 | 连续内存 + 预留空间 | 每个元素存储前后节点引用 |

O(1) 表示操作时间与元素数量无关，O(n) 表示操作时间随元素数量线性增长。大多数场景下 `ArrayList` 是默认选择。除非你在列表前端频繁插入删除，否则优先使用 `ArrayList`。

### 2.4 List 与数组转换

```java
// List 转数组
List<String> list = List.of("A", "B", "C");
String[] array = list.toArray(new String[0]);

// 数组转 List（注意：不可修改）
String[] arr = {"A", "B", "C"};
List<String> listFromArray = Arrays.asList(arr);
// listFromArray.add("D"); // UnsupportedOperationException
```

`Arrays.asList` 返回的 List 不能改变大小，但可以修改元素。如果需要可变的 List，传入 new ArrayList 构造器：

```java
List<String> mutableList = new ArrayList<>(Arrays.asList(arr));
mutableList.add("D"); // 正常
```

## 三、Set：不重复元素集合

### 3.1 HashSet 的基本操作

[[Set]]不保留重复元素。[[HashSet]] 是 Set 最常用的实现，基于哈希表存储：

```java
Set<String> tags = new HashSet<>();
tags.add("java");
tags.add("web");
tags.add("java"); // 重复，不会添加

System.out.println(tags.size()); // 2（"java" 只算一次）

// 检查元素是否存在
System.out.println(tags.contains("web")); // true
System.out.println(tags.contains("spring")); // false

// 遍历
for (String tag : tags) {
    System.out.println(tag);
}
```

`HashSet` 不承诺遍历顺序。多次运行可能看到不同输出顺序。如果需要可预测的顺序：

- [[LinkedHashSet]] 保留插入顺序
- [[TreeSet]] 按自然排序或自定义比较器排序

### 3.2 Set 如何判断重复

Set 判断两个对象是否重复，依据的是两个方法：

```java
public class Person {
    private String name;

    // ... 构造器、getter

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Person other)) return false;
        return Objects.equals(this.name, other.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
```

- `equals` 判断两个对象是否"内容相等"。
- `hashCode` 返回一个整数，相同的对象必须有相同的哈希码。

第 6 章提到过这两个方法的一致契约：**如果两个对象 equals 返回 true，它们的 hashCode 必须相同**。如果不一致，HashSet 会错误地允许重复元素。

```java
Set<Person> people = new HashSet<>();
people.add(new Person("Ada"));
people.add(new Person("Ada"));

// 如果没有正确实现 hashCode，size 可能是 2（错误的重复）
// 如果 hashCode 正确实现，size 为 1（去重成功）
```

### 3.3 可变对象作为 Set 元素的风险

如果 Set 中元素的可变性字段影响 equals/hashCode，元素放入 Set 后修改这些字段会导致数据结构损坏：

```java
Set<List<Integer>> setOfLists = new HashSet<>();
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
setOfLists.add(list);
System.out.println(setOfLists.contains(list)); // true

list.add(4); // 修改了 list
System.out.println(setOfLists.contains(list)); // 可能是 false！
```

放入 Set 后不要修改会影响相等性的字段。如果确实需要基于可变内容的唯一性，使用不可变对象（如 record、`List.of` 创建的不变列表）作为集合元素更安全。

## 四、Map：键到值的映射

### 4.1 HashMap 的基本操作

[[Map]]保存从键到值的映射关系。[[HashMap]] 是最常用的 Map 实现：

```java
Map<String, Integer> stock = new HashMap<>();
stock.put("book", 10);
stock.put("pen", 20);

System.out.println(stock.get("book"));    // 10
System.out.println(stock.get("eraser"));  // null（不存在）
```

同一个 key 再次 put 会覆盖旧值，并返回旧值：

```java
Integer old = stock.put("book", 8);
System.out.println(old);     // 10（旧值）
System.out.println(stock.get("book")); // 8
```

提供默认值：

```java
// getOrDefault：key 不存在时返回默认值
int count = stock.getOrDefault("notebook", 0); // 0
```

检查键或值是否存在：

```java
System.out.println(stock.containsKey("pen"));   // true
System.out.println(stock.containsValue(20));    // true
```

### 4.2 遍历 Map

遍历 Map 有三种方式，最常用的是 entrySet：

```java
for (Map.Entry<String, Integer> entry : stock.entrySet()) {
    String key = entry.getKey();
    Integer value = entry.getValue();
    System.out.println(key + ": " + value);
}
```

如果需要旧版式的遍历，但 entrySet 通常更高效，因为一次迭代同时获取键和值：

```java
// 不推荐：多余的一次 get 查找
for (String key : stock.keySet()) {
    System.out.println(key + ": " + stock.get(key));
}
```

只遍历键或值：

```java
for (String key : stock.keySet()) {
    System.out.println(key);
}

for (Integer value : stock.values()) {
    System.out.println(value);
}
```

JDK 8 引入的 `forEach` 方法让遍历更紧凑：

```java
stock.forEach((key, value) -> System.out.println(key + ": " + value));
```

### 4.3 Map key 的可变性风险

与 Set 类似，Map 中作为 key 的对象不应修改影响 equals/hashCode 的字段：

```java
Map<List<Integer>, String> map = new HashMap<>();
List<Integer> key = new ArrayList<>(List.of(1, 2));
map.put(key, "value");

key.add(3); // 修改了 key
System.out.println(map.get(key)); // 很可能是 null，因为 hashCode 变了
```

推荐使用不可变对象作为 Map key。记录字符串、Integer、record 等都是安全的。

### 4.4 Map 的常用实现对比

| 实现 | 顺序 | key 要求 | 使用场景 |
| --- | --- | --- | --- |
| HashMap | 不保证顺序 | 需要正确的 equals/hashCode | 通用键值存储 |
| LinkedHashMap | 插入顺序或访问顺序 | 同上 | 需要可预测遍历顺序 |
| TreeMap | key 的自然顺序或比较器 | key 必须可比较 | 需要排序的键值集合 |
| EnumMap | enum 声明顺序 | key 必须是 enum | key 是枚举类型 |

初学阶段默认选择 `HashMap`。需要顺序时优先考虑 `LinkedHashMap`。

## 五、不可修改集合

JDK 9 引入了工厂方法，用一行创建不可修改集合：

```java
List<String> levels = List.of("LOW", "MEDIUM", "HIGH");
Set<String> tags = Set.of("java", "web");
Map<String, Integer> config = Map.of("timeout", 30, "retry", 3);
```

```java
// levels.add("URGENT"); // 运行时 UnsupportedOperationException
```

不可修改集合的优势：

- 线程安全
- 内存占用更小
- 明确表达"数据不会变化"

如果需要后续添加或修改，传入可变构造器：

```java
List<String> mutableLevels = new ArrayList<>(List.of("LOW", "MEDIUM"));
mutableLevels.add("HIGH"); // 正常
```

## 六、Collections 工具类

`java.util.Collections` 提供操作集合的静态方法：

```java
List<String> list = new ArrayList<>(List.of("C", "A", "B"));
Collections.sort(list);            // 排序：[A, B, C]
Collections.reverse(list);         // 反转：[C, B, A]
Collections.shuffle(list);         // 随机打乱：[B, A, C]（每次不同）
```

包装为不可修改视图：

```java
List<String> unmodifiable = Collections.unmodifiableList(list);
// unmodifiable.add("D"); // UnsupportedOperationException
```

只是包装视图，原始集合的修改仍然会反映到视图中。创建不可修改集合更推荐使用 `List.of` 工厂方法。

## 七、练习

### 练习 1：List 去重

给定一个 List：

```java
List<String> input = new ArrayList<>(List.of("apple", "banana", "apple", "cherry", "banana"));
```

输出一个不包含重复元素的 List，保持首次出现的顺序。

完成标准：结果应为 `["apple", "banana", "cherry"]`；不使用 `Set` 构造器。

### 练习 2：单词频率统计

给定一段文本：

```java
String text = "java spring java boot spring cloud java docker";
```

统计每个单词出现的次数。使用 `Map<String, Integer>` 实现。

完成标准：输出类似 `{java=3, spring=2, boot=1, cloud=1, docker=1}`；不存在的单词返回 0，不抛出 NPE。

### 练习 3：商品标签管理

设计两个方法：

```java
/** 添加标签，重复标签不添加，返回 true 表示首次添加 */
boolean addTag(String tag);

/** 获取所有标签，按添加顺序 */
List<String> getTags();
```

完成标准：使用合适的集合类型组合；不手动调用 `contains` 做去重检查。

## 常见误区

### 用 List 做去重

List 允许重复。如果语义是"只能出现一次"，优先使用 Set，或使用 Stream 的 `distinct()`。

### 假设 HashMap 的迭代顺序稳定

`HashMap` 不承诺迭代顺序，响应、日志或测试若依赖顺序应该显式选择实现。`HashMap` 内部结构在扩容后可能改变遍历顺序。

### 修改 key 或 Set 元素的影响相等性字段

这会让数据在 Map 和 HashSet 中"丢失"——对象在集合中，但查找不到。使用不可变值（String、Integer、record 等）作为 key 或 Set 元素最安全。

### 用 == 替代 equals 判断集合中的元素相等性

`==` 比较引用是否指向同一个对象。HashSet 使用 `equals` 去重；Map 中 key 的查找也依赖 `equals`，不是 `==`。只有 `EnumSet` 和 `EnumMap` 不受影响，因为 enum 实例天然单例。

## 本章小结

List、Set 和 Map 是 Java 集合框架的三个核心接口，分别处理有序序列、唯一元素和键值映射。ArrayList 是 List 的默认选择，HashSet 和 HashMap 分别是 Set 和 Map 的默认选择。Set 和 Map 的元素唯一性依赖 equals/hashCode 的实现，这两个方法需要保持"相等对象哈希码相同"的契约。可变对象放入 Set 或作为 Map key 后不应修改影响相等性的字段。不可修改集合使用 `List.of`、`Set.of`、`Map.of` 创建，适合固定数据。下一章将使用集合数据学习 Lambda 和 Stream 的操作。

## 快速自测

1. List、Set、Map 分别解决什么数据关系？
2. HashSet 如何判断两个元素是重复的？
3. 为什么放入 HashMap 作为 key 的对象不应该修改 equals/hashCode 相关的字段？
4. `List.of("A", "B")` 创建后能 add 元素吗？

参考答案：List 关心顺序和可重复，Set 关心唯一性，Map 关心按键定位值；依据 equals 和 hashCode 方法的返回值；修改后 hashCode 会变，HashMap 可能找不到该 key；不能，返回的是不可修改集合，add 会抛 UnsupportedOperationException。

## 参考文献

- Oracle. [Java SE 17 API: Collections Framework](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/doc-files/coll-overview.html).
- Oracle. [Java SE 17 API: List](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/List.html).
- Oracle. [Java SE 17 API: Set](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Set.html).
- Oracle. [Java SE 17 API: Map](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Map.html).
- Oracle. [Java SE 17 API: Collections](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Collections.html).
