# 第 12 章　Java 泛型与类型安全

> 学习提示：先观察 Object 容器为什么需要强制转换且容易出错，再看类型参数怎样把错误提前到编译期。每次只增加一个类型参数概念。
> 一句话总结：泛型通过类型参数约束容器和方法处理的数据类型，让编译器在编译期阻止类型混入，并消除不安全的强制转换。

## 一、Object 容器的问题

第 5 章讲过，`Object` 是所有引用类型的父类。因此一个 `Object` 类型的变量可以保存任何对象：

```java
Object value = "Hello";
value = 42;
value = true;
```

这种灵活性看起来方便，但取回值时需要强制转换。如果记错了实际类型，强制转换在运行时会失败：

```java
Object items = new ArrayList<>();
// 第一处：存入 String
((List<String>) items).add("Java");

// 第二处：误存 Integer
((List<String>) items).add(42); // 编译错误！这里 Integer 不能直接传给 List<String>.add
```

这里 `add(42)` 不是 Integer 不能直接存入 List<String>，而是不能通过编译。更隐蔽的情况是原始的 `Object` 容器：

```java
List rawList = new ArrayList();
rawList.add("Java");
rawList.add(42);

String first = (String) rawList.get(0); // 正确，是 String
String second = (String) rawList.get(1); // 运行时 ClassCastException
```

`rawList.get(1)` 返回的是 `Object` 类型，运行时实际值又是 `Integer`，强行转 `String` 会在运行时报错。

[[泛型]]（Generics）让容器把"里面保存什么类型"写进声明，编译器就能在编译时检查类型匹配。

## 二、泛型的基本语法

### 2.1 使用泛型类

最常接触的是集合类的泛型形式：

```java
List<String> names = new ArrayList<>();
```

尖括号中的 `String` 是[[类型实参]]（type argument），表示这个 List 只包含 String 类型的元素。加上泛型后：

```java
List<String> names = new ArrayList<>();
names.add("Ada");
// names.add(42);    // 编译错误：int 不能转换为 String

String first = names.get(0); // 不需要强制转换
```

编译器知道 `get()` 返回的是 `String`，不再需要 `(String)`。

### 2.2 菱形语法

```java
List<String> names = new ArrayList<>(); // 右侧 <> 可推断为 String
List<String> explicit = new ArrayList<String>(); // 等价，但繁琐
```

右侧的 `<>` 是[[菱形语法]]（diamond operator），编译器会从左侧声明推断出类型实参。除非显式指定，否则总是使用菱形语法。

`Map` 有两个类型参数：

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("Ada", 95);
int score = scores.get("Ada"); // 自动拆箱
```

### 2.3 自定义泛型类

除了使用标准库的泛型类，你也可以定义自己的泛型类。类型参数写在类名后面的尖括号中：

```java
public class Box<T> {
    private final T value;

    public Box(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }
}
```

`T` 是[[类型参数]]（type parameter），在类定义中代表"未来调用时会确定的某个类型"。使用：

```java
Box<String> titleBox = new Box<>("Java");
String title = titleBox.get();       // 不需要强制转换

Box<Integer> countBox = new Box<>(42);
Integer count = countBox.get();      // 类型安全
```

`Box<String>` 和 `Box<Integer>` 是两个不同的类型。不能把 `Box<String>` 赋给 `Box<Object>` 变量，也不能把 `String` 放进 `Box<Integer>`。

### 2.4 类型参数的命名惯例

类型参数通常使用单个大写字母：

- `T` — Type（通用类型）
- `E` — Element（集合元素）
- `K` / `V` — Key / Value（映射键值）
- `N` — Number
- `R` — Return type（返回类型）

多个类型参数时用逗号分隔：

```java
public class Pair<K, V> {
    private final K key;
    private final V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() { return key; }
    public V getValue() { return value; }
}
```

```java
Pair<String, Integer> pair = new Pair<>("age", 30);
String key = pair.getKey();
Integer value = pair.getValue();
```

## 三、泛型方法

不是只有类可以有类型参数。方法可以在自己的签名中声明类型参数，放在返回值之前：

```java
public class Utils {
    public static <T> T first(T left, T right) {
        return left;
    }
}
```

调用时，类型参数由实参推断：

```java
String text = Utils.first("A", "B");     // T 推断为 String
Integer number = Utils.first(1, 2);     // T 推断为 Integer
```

泛型方法与泛型类的类型参数可以无关。方法上的 `T` 只在当前方法调用中有效：

```java
public static <T> T getMiddle(T... args) {
    return args[args.length / 2];
}
```

```java
String mid = getMiddle("A", "B", "C"); // 返回 "B"
```

方法泛型常用于工具类，例如集合工具、比较器工厂等。调用方不必声明类型，编译器从参数推断即可。

自己设计泛型方法时注意：类型参数应表示"同一次调用中保持一致的某个类型"，不表示"可以是任何类型的混合"。如果参数和返回值之间的关系无法用同一类型参数描述，可能需要多个类型参数或重新思考设计。

## 四、上界与约束

### 4.1 为什么需要上界

如果方法需要调用类型的某个方法，任意的类型参数 `T` 不够。例如，计算一组数值的总和：

```java
static double sum(List<Number> values) { ... }
```

这个方法的问题在于，它不接受 `List<Integer>` 或 `List<Double>` — 第 5 章讲过 Integer 继承 Number，但 `List<Integer>` 不是 `List<Number>` 的子类型。这点会在第 13 章集合中进一步说明。

### 4.2 使用 extends 上界

可以使用上界通配符或上界类型参数来解决问题：

```java
static <T extends Number> double sumOf(List<T> values) {
    double total = 0;
    for (T value : values) {
        total += value.doubleValue();
    }
    return total;
}
```

`<T extends Number>` 表示 T 必须是 Number 本身或其子类。因此可以安全调用 `doubleValue()` 方法。

泛型上界中 `extends` 的含义不同于 `class` 继承：它对类和接口都使用 `extends` 关键字，即使接口本应使用 `implements`：

```java
// 要求 T 同时实现两个接口
public static <T extends Comparable<T> & Serializable> void sort(List<T> list) { }
```

多个约束用 `&` 连接。实际场景中很少需要多个上界约束，多数时候一个上界就足够了。不要为了"看起来严谨"对每个泛型方法都加不必要约束。

## 五、通配符与类型关系

### 5.1 不变性（Invariance）

```java
List<Integer> ints = new ArrayList<>();
List<Number> numbers = ints; // 编译错误！
```

虽然 `Integer` 是 `Number` 的子类，但 `List<Integer>` 不是 `List<Number>` 的子类型。如果允许赋值，调用方可以通过 `numbers` 向列表添加 `Double`，破坏了 `ints` 中只保存 Integer 的约束。

### 5.2 上界通配符 ? extends

当方法只从容器中读取数据时，可以使用 `? extends T`：

```java
static double sum(List<? extends Number> values) {
    double total = 0;
    for (Number value : values) {
        total += value.doubleValue();
    }
    return total;
}
```

```java
List<Integer> ints = List.of(1, 2, 3);
List<Double> doubles = List.of(1.5, 2.5);
System.out.println(sum(ints));    // 6.0
System.out.println(sum(doubles)); // 4.0
```

`? extends Number` 表示"某个具体类型，它是 Number 或 Number 的子类"，但不能确切知道是哪一个。因此只能读取（因为读到的都是 Number），不能写入（因为不知道具体类型，写入可能破坏类型安全）：

```java
List<? extends Number> values = new ArrayList<Integer>();
// values.add(3.14); // 编译错误！不能确保元素的类型安全
```

### 5.3 下界通配符 ? super

当方法主要向容器写入数据时，可以使用 `? super T`：

```java
static void addNumbers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
}
```

```java
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();
addNumbers(numbers);  // 可行，Number "super" Integer
addNumbers(objects);  // 可行，Object "super" Integer
// addNumbers(List.of(1)); // 编译错误，无法向不可变集合 add
```

`? super Integer` 表示"某个具体类型，它是 Integer 或 Integer 的父类"。可以安全地写入 Integer 或 Integer 的子类（因为无论实际类型是什么，Integer 都是有效的元素类型）。读取时，只能读到 `Object`。

### 5.4 PECS 法则

记忆辅助：**Producer Extends, Consumer Super**。

- 当容器是你从中读取数据的**生产者**时，用 `? extends T`。
- 当容器是你向其写入数据的**消费者**时，用 `? super T`。

如果既读又写（典型的读写场景），使用精确类型 `T`：

```java
static <T> void copy(List<? extends T> source, List<? super T> target) {
    for (T item : source) {
        target.add(item);
    }
}
```

初学者先理解通配符"为什么存在"即可，不需要死记通配符组合。日常编码中，集合变量声明为精确泛型就足够了。通配符主要出现在库 API 和方法签名中，让方法接受更广泛的参数。

## 六、类型擦除与原始类型

### 6.1 类型擦除

Java 的泛型是编译期特性。在运行期，泛型类型参数被擦除为它们的上界（如果没有上界则擦除为 `Object`），这个过程称为[[类型擦除]]（type erasure）：

```java
// 编译期
Box<String> box = new Box<>("Java");

// 运行期（擦除后等价于）
Box box = new Box("Java");
```

因为类型擦除的存在，运行期无法获得类型实参的信息：

```java
Box<String> strBox = new Box<>("A");
Box<Integer> intBox = new Box<>(1);

// System.out.println(strBox instanceof Box<String>); // 编译错误
System.out.println(strBox.getClass() == intBox.getClass()); // true
```

擦除的影响：

- 不能 `new T()` —— 编译器不知道运行期 T 的类型，无法生成对应构造器。
- 不能 `new T[10]` —— 数组需要知道确切的元素类型。
- 不能使用 `instanceof` 检查泛型类型。

这些限制是设计取舍的结果：Java 在引入泛型时必须保持与旧版本的二进制兼容。

### 6.2 原始类型与兼容性

不使用类型参数的泛型类称为[[原始类型]]（raw type）：

```java
List raw = new ArrayList();      // 原始类型 — 不推荐
List<String> safe = new ArrayList<>(); // 泛型形式
```

原始类型为了与 Java 5 之前的旧代码兼容而保留，但不推荐在新代码中使用：

```java
List raw = new ArrayList();
raw.add("Java");
raw.add(42); // 不会报错，但打破了容器本来的类型意图

List<String> safe = new ArrayList<>();
// safe.add(42); // 编译错误，这是泛型的价值
```

编译器对原始类型的使用发出"unchecked"警告。不要为了消除警告随意加 `@SuppressWarnings("unchecked")`。更好的做法是修复类型参数。

## 七、练习

### 练习 1：泛型栈

定义一个泛型接口 `Stack<T>`，包含三个方法：

```java
public interface Stack<T> {
    void push(T item);
    T pop();
    boolean isEmpty();
}
```

然后实现一个 `ArrayStack<T>`，内部使用 `ArrayList<T>` 存储。不需要处理 null 或扩容（ArrayList 自动扩容）。

完成标准：`Stack<String>` 只能 push String；`Stack<Integer>` 只能 push Integer；pop 不需要强制转换。

### 练习 2：类型安全的对象容器

写一个泛型方法 `static <T> T getOrDefault(List<T> list, int index, T defaultValue)`，在 index 有效时返回对应元素，无效时返回 defaultValue。不允许抛出异常。

完成标准：传入 `List<Integer>` 时返回类型为 Integer；传入 `List<String>` 时返回类型为 String；index 越界时返回提供的默认值。

### 练习 3：通配符理解

解释以下代码中的编译错误：

```java
List<Integer> ints = new ArrayList<>();
List<Number> nums = ints; // 编译错误，为什么？
```

然后写一个方法，接收 `List<? extends Number>`，读取所有元素并求和。

完成标准：能解释不变性的意义；通配符版本能接收 `List<Integer>`、`List<Double>` 和 `List<Number>`。

## 常见误区

### 以为 `<T>` 总是代表任意类型

`T` 在每个实例或调用中会被一个具体类型替换。`Box<String>` 的方法签名相当于"接收 String 参数、返回 String"，但 `Box<Object>` 接收的是 Object。两者不是同一个类型。

### 用原始类型逃避编译错误

```java
List items = new ArrayList(); // 不写 <>
items.add("string");
items.add(42);
```

原始类型只是把类型错误从编译期推迟到运行期。修复类型参数或调整代码设计，不要让原始类型出现在新代码中。

### 混淆泛型数组与数组泛型

Java 不支持创建泛型数组：`new T[10]` 不合法。但可以声明 `List<String>[]` 数组，不过日常编码中并不常见。遇到时知道这是受擦除限制的结果即可。

### 把 `extends` 理解为仅用于类继承

泛型上界中的 `extends` 同时适用于类和接口类型，表示"该类型或其子类型"。例如 `<T extends Comparable<T>>` 中的 `Comparable` 是接口。

## 本章小结

泛型把数据类型纳入 API 契约。它解决了 Object 容器中的类型不安全问题：编译器在编译期检查类型，开发者不需要在每个读取点做强制转换。类型参数可以用于类、接口和方法声明。上界通配符 `? extends T` 用于只读场景，下界通配符 `? super T` 用于只写场景。类型擦除使得运行期无法获得泛型类型实参，因此 `new T()` 和 `instanceof` 检查不可用。原始类型保留旧代码兼容性，但新代码应始终使用泛型形式。下一章会基于泛型学习 List、Set 和 Map 的用法和选择标准。

## 快速自测

1. 泛型主要解决了 Object 容器的什么问题？
2. `List<Integer>` 为什么不能赋值给 `List<Number>`？
3. `? extends Number` 适合做什么操作？`? super Integer` 呢？
4. 为什么不能 `new T()`？

参考答案：避免了运行期强制转换异常和手动类型检查；List<Integer> 不是 List<Number> 的子类型（不变性），否则可以通过 Number 引用向 Integer 列表写入 Double；? extends Number 适合安全读取 Number 及其子类，? super Integer 适合向容器写入 Integer 或 Integer 子类；类型擦除导致运行期不知道 T 的实际类型。

## 参考文献

- Oracle. [Java SE 17 Language Specification: Generics](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html).
- OpenJDK. [Learn Java: Generics](https://dev.java/learn/generics/).
- Bloch, Joshua. Effective Java, 3rd Edition. Items 26-33. 2018.
