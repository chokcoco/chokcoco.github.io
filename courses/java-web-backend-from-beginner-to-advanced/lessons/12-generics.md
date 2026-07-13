# 第 12 章　Java 泛型与类型安全

> 学习提示：先观察 Object 容器为什么需要强制转换，再看类型参数怎样把错误提前到编译期。
> 一句话总结：泛型用类型参数描述容器和方法处理的数据类型，让编译器阻止错误混入，并在读取时减少不安全的强制转换。

## Object 容器的问题

`Object` 是许多类的共同父类型，因此可以保存不同对象：

```java
Object value = "Java";
```

但拿回值时需要强制转换，且错误会拖到运行期：

```java
Object value = "Java";
String text = (String) value;

Object another = 3;
// String wrong = (String) another; // 运行时 ClassCastException
```

若一个容器本来只应保存 String，却允许任意 Object 混入，调用方每次读取都要猜类型。[[泛型]]让容器把“保存什么类型”写进声明。

## 类型参数的基本写法

`List<String>` 表示只保存 String 的列表：

```java
List<String> names = new ArrayList<>();
names.add("Ada");
// names.add(3); // 编译错误

String name = names.get(0);
```

尖括号中的 `String` 是类型实参。编译器知道 `get` 返回 String，因此不需要 `(String)`。

自定义泛型类使用类型参数名，通常写 `T`：

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

创建时指定实际类型：

```java
Box<String> titleBox = new Box<>("Java");
String title = titleBox.get();
```

右侧的 `<>` 是菱形语法，编译器从左侧推断 `String`。第 13 章会实际使用泛型集合。

## 泛型方法

不是只有类可以泛型化。方法也可以声明自己的类型参数：

```java
static <T> T first(T left, T right) {
    return left;
}
```

调用时类型由参数推断：

```java
String text = first("A", "B");
Integer number = first(1, 2);
```

`T` 代表“同一次调用中保持一致的某个类型”。它不是 Object，也不是可以同时代表 String 和 Integer 的任意混合。

## 上界让类型拥有必要能力

若方法需要调用数字的能力，任意 `T` 不够。可以设置上界：

```java
static double doubleValue(Number value) {
    return value.doubleValue();
}
```

在泛型声明中：

```java
static <T extends Number> double sumFirst(T value) {
    return value.doubleValue();
}
```

`extends Number` 表示 T 必须是 Number 或其子类，因此可以调用 `doubleValue()`。上界不是为了复杂语法而存在，而是让方法能安全使用某些成员。

## 通配符区分读取与写入

`List<Integer>` 不是 `List<Number>` 的子类型。虽然 Integer 是 Number，但若允许把 `List<Integer>` 当 `List<Number>`，就可能向它加入 Double，破坏列表约束。

当方法只读取数字时，可使用上界通配符：

```java
static double sum(List<? extends Number> values) {
    double total = 0;
    for (Number value : values) {
        total += value.doubleValue();
    }
    return total;
}
```

它可以接收 `List<Integer>`、`List<Double>` 等。因为具体元素类型未知，不能安全地添加普通 Number。

当方法需要向某个容器写入 Integer 时，可使用 `? super Integer`。记忆辅助是 PECS：Producer Extends，Consumer Super。先理解含义即可：只产出给你读的用 extends；主要接收你写入的用 super。

## 原始类型会绕过检查

省略类型参数的 `List` 叫[[原始类型]]：

```java
List values = new ArrayList();
values.add("Java");
values.add(3);
```

它为了兼容旧代码仍存在，但会产生警告并放弃泛型保护。新代码不要使用原始类型，也不要为了消除警告随意加 `@SuppressWarnings`。

泛型在运行期会发生类型擦除，因此不能写 `new T()`，也不能直接创建 `new T[10]`。目前无需深入实现细节，只要知道泛型主要在编译期提供类型检查。

## 练习：把 Object 栈改为泛型栈

定义 `Stack<T>`，至少包含 `push(T value)`、`pop()`、`isEmpty()`。先不要求数组扩容；可以用第 13 章前暂时未讲的 List 吗？不可以。本章练习可只设计方法签名和用法，真正实现可变容器放在第 13 章后完成。

再写一个 `Box<Integer>` 与 `Box<String>` 的使用示例，说明为什么不能把 String 放进前者。

完成标准：类型错误在编译期出现；读取泛型值不需要强制转换；能解释 `List<Integer>` 不是 `List<Number>`。

## 常见误区

### 以为 `<T>` 总是代表 Object

T 在每个实例或调用中会被具体类型替换。`Box<String>` 不是 `Box<Object>`。

### 用原始类型逃避编译错误

这只是把错误推迟到运行期。应修正类型参数或方法设计。

### 把 `extends` 理解为只能用于继承类

泛型上界中的 `extends` 同时适用于类和接口类型，它表示“该类型或其子类型/实现”。

## 本章小结

泛型把数据类型放入 API 契约中。它让错误更早发生、读取代码更安全；类型参数、上界、通配符和原始类型边界会在集合 API 中反复出现。

## 快速自测

1. 泛型解决 Object 容器的什么问题？
2. 为什么 `List<Integer>` 不能赋给 `List<Number>`？
3. `? extends Number` 的列表适合主要做什么？

参考答案：避免运行期强制转换失败；否则可向整数列表写入其他 Number；适合安全读取 Number 及其子类元素。

## 参考文献

- Oracle. [Java SE 17 Language Specification: Generics](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html).
- OpenJDK. [Learn Java: Generics](https://dev.java/learn/generics/).
