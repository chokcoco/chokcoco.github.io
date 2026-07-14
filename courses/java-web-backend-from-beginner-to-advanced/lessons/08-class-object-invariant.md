# 第 8 章　类、对象与业务规则封装

> 学习提示：本章是自定义类的第一次完整展开。先运行每一小段代码观察结果，再在最后组合成一个带规则的 OrderLine。
> 一句话总结：类把字段和方法组织在一起；对象是类在运行时的具体实例；构造器、`private` 和业务方法共同维护对象的有效状态。

## 一、为什么需要类

### 1.1 散落的变量难以维护规则

第 4 章到第 7 章的变量、数组和方法已经能完成很多计算，但真实程序里数据通常带有规则。假设一个订单行包含商品名和数量，数量不能为负数。如果把这两个值散落在 `main` 方法中：

```java
String productName = "Java 编程书";
int quantity = 2;

// 很多行之后……
quantity = -5; // 数量变成了负数，但没有任何检查
```

当程序变长时，每个读写 `quantity` 的地方都可能绕开这条规则。[[类]]把相关数据和它允许的操作组织在一起，让规则集中维护。

### 1.2 类是创建对象的定义

可以把类理解成一份设计图。设计图不是具体的订单行，但它定义了每一个订单行应该保存哪些数据、允许哪些操作。根据类创建出的每一个具体实例叫[[对象]]。一个类可以创建很多对象，每个对象各自保存自己的数据：

```text
类：OrderLine（定义：商品名、数量、增加操作）
         ↓
对象 1：productName = "书", quantity = 2
对象 2：productName = "笔", quantity = 5
```

## 二、最简单的类和一个对象

### 2.1 定义一个只有字段的类

先看一个最简单的类：

```java
public class Person {
    String name;
    int age;
}
```

这四行的含义逐项拆开：

- `public class Person` 声明一个公开类，类名为 `Person`。Java 文件名必须与 `public` 类名一致（`Person.java`）。
- `String name;` 声明一个[[字段]]。每个 Person 对象会保存自己的 `name` 值。
- `int age;` 是另一个字段。字段的类型就是前面学过的类型——这里是 `String` 和 `int`。

目前 `Person` 只有字段，没有方法。它已经可以创建对象了。

### 2.2 创建对象并访问字段

在 `main` 方法中创建 Person 对象：

```java
public class PersonDemo {
    public static void main(String[] args) {
        Person p = new Person();   // 创建一个 Person 对象

        p.name = "Ada";            // 设置字段值
        p.age = 20;

        System.out.println(p.name); // 控制台输出：Ada
        System.out.println(p.age);  // 控制台输出：20
    }
}
```

`new Person()` 创建了一个 Person 对象。变量 `p` 保存的是这个对象的引用（第 6 章已经讲过引用）。`p.name` 使用点号访问 `p` 所指向对象的 `name` 字段。

如果写 `Person q = p;`，两个变量就指向同一个对象，修改字段会从两边看到——这一点和第 6 章中两个变量指向同一个 StringBuilder 完全一样。

### 2.3 字段默认值

当用 `new Person()` 创建对象但没有给字段赋值时，Java 会给字段一个默认值：

| 字段类型 | 默认值 |
| --- | --- |
| `int`、`long`、`short`、`byte` | `0` |
| `double`、`float` | `0.0` |
| `boolean` | `false` |
| `char` | `'\u0000'`（空字符） |
| 引用类型（String 等） | `null` |

所以刚创建出来的 `Person` 对象中，`name` 是 `null`，`age` 是 `0`。如果直接调用 `p.name.length()` 会抛出 `NullPointerException`。因此构造器通常应该在创建对象时就设置好必要字段。

## 三、实例方法操作对象自己的数据

### 3.1 把操作放进类

类可以包含方法。[[实例方法]]属于对象，能访问这个对象的字段：

```java
public class Person {
    String name;
    int age;

    void sayHello() {
        System.out.println("你好，我是 " + name + "，今年 " + age + " 岁。");
    }
}
```

调用方式与字段一样，用点号：

```java
Person p = new Person();
p.name = "Ada";
p.age = 20;
p.sayHello(); // 控制台输出：你好，我是 Ada，今年 20 岁。
```

方法内部的 `name` 和 `age` 没有前缀，它们指的就是“当前这个对象”的字段。调用 `p.sayHello()` 时，`name` 就是 `p` 的 `name`，也就是 `"Ada"`。

### 3.2 实例方法与 static 方法的区别

前面章节在 `main` 中直接调用的都是 `static` 方法。现在可以总结它们的区别：

```java
public class Calculator {
    // 实例方法：需要先创建 Calculator 对象，访问对象的字段
    public int add(int a, int b) {
        return a + b;
    }

    // static 方法：直接用类名调用，不操作任何具体对象的字段
    public static int subtract(int a, int b) {
        return a - b;
    }
}
```

```java
Calculator calc = new Calculator();
int sum = calc.add(3, 5);            // 实例方法，通过对象调用
int diff = Calculator.subtract(8, 3); // static 方法，通过类名调用
```

判断标准很简单：这个方法是否需要读取或修改某个特定对象的字段？需要就写成实例方法；只是根据参数做通用计算，就可以是 `static` 方法。

## 四、构造器让对象从有效状态开始

### 4.1 没有构造器时的问题

回到 Person 的例子。创建对象后需要手动给字段赋值，中间可能有一段代码拿到了“名字还没设”的半成品对象：

```java
Person p = new Person();
// p.name 此时是 null
// 如果这里调用了 p.sayHello()，输出会是 "你好，我是 null，今年 0 岁。"
p.name = "Ada";
p.age = 20;
```

[[构造器]]在 `new` 的时候被自动调用，可以接收参数并设置初始值，避免出现半成品对象。

### 4.2 编写第一个构造器

```java
public class Person {
    String name;
    int age;

    // 构造器
    Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    void sayHello() {
        System.out.println("你好，我是 " + name + "，今年 " + age + " 岁。");
    }
}
```

构造器的规则：

- 名称必须与类名完全相同。
- 没有返回值类型，连 `void` 都不写。
- `this.name` 表示当前对象的字段；右边的 `name` 是构造器参数。当参数名和字段名相同时，`this` 用来区分两者。

现在创建对象必须传参：

```java
Person p = new Person("Ada", 20); // 创建时直接设定字段
p.sayHello(); // 控制台输出：你好，我是 Ada，今年 20 岁。
```

如果尝试 `new Person()` 不带参数，编译器会报错，因为 Person 已经定义了自己的构造器，Java 不再自动提供无参构造器。

### 4.3 构造器可以检查规则

构造器不只是给字段赋值，它还应该拒绝无法构成有效对象的数据：

```java
public class OrderLine {
    String productName;
    int quantity;

    OrderLine(String productName, int quantity) {
        if (productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("商品名不能为空");
        }
        if (quantity < 0) {
            throw new IllegalArgumentException("数量不能为负数，收到：" + quantity);
        }
        this.productName = productName;
        this.quantity = quantity;
    }
}
```

`throw` 和 `IllegalArgumentException` 会在第 11 章系统讲解。现在只需要知道：构造器检查了数据，如果不满足条件，就不会创建出无效对象。这比创建后再检查可靠得多——因为无效对象根本不会出现。

### 4.4 多个构造器

一个类可以有多个构造器，用不同的参数列表区分：

```java
public class OrderLine {
    String productName;
    int quantity;

    // 完整构造器
    OrderLine(String productName, int quantity) {
        if (productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("商品名不能为空");
        }
        if (quantity < 0) {
            throw new IllegalArgumentException("数量不能为负数");
        }
        this.productName = productName;
        this.quantity = quantity;
    }

    // 数量默认为 1 的便利构造器
    OrderLine(String productName) {
        this(productName, 1); // 调用上面的完整构造器
    }
}
```

`this(productName, 1)` 在一个构造器里调用另一个构造器。`this(…)` 必须是构造器的第一条语句。这样就不需要把检查逻辑复制两份。

## 五、访问控制与封装

### 5.1 `private` 隐藏字段

目前 `OrderLine` 的字段没有修饰符，外部代码可以这样写：

```java
OrderLine line = new OrderLine("书", 2);
line.quantity = -5; // 绕开了构造器的检查！
```

`private` 修饰符让字段只能在类自己的代码里访问：

```java
public class OrderLine {
    private String productName;  // 只有 OrderLine 自己的代码能访问
    private int quantity;
    // ...
}
```

加上 `private` 后，`line.quantity = -5` 会直接编译错误。外部代码不能再直接读写这些字段。

### 5.2 Getter：安全地暴露数据

外部代码仍然需要读取数据时，可以提供[[getter 方法]]：

```java
public String getProductName() {
    return productName;
}

public int getQuantity() {
    return quantity;
}
```

```java
OrderLine line = new OrderLine("书", 2);
System.out.println(line.getQuantity()); // 控制台输出：2
```

getter 是普通实例方法，命名惯例是 `get` + 首字母大写的字段名。对于 `boolean` 字段，惯例是 `is` + 字段名，如 `isActive()`。

### 5.3 不是每个字段都需要 setter

很多人会习惯性地写：

```java
public void setQuantity(int quantity) {
    this.quantity = quantity;
}
```

如果 `setQuantity` 允许传入任何整数，外部代码仍然可以写 `line.setQuantity(-5)`，构造器里的检查形同虚设。更好的做法是只提供有意义的业务方法：

```java
public void increase(int amount) {
    if (amount <= 0) {
        throw new IllegalArgumentException("增加数量必须大于 0");
    }
    this.quantity += amount;
}

public void decrease(int amount) {
    if (amount <= 0) {
        throw new IllegalArgumentException("减少数量必须大于 0");
    }
    if (this.quantity < amount) {
        throw new IllegalArgumentException("数量不足，当前：" + this.quantity);
    }
    this.quantity -= amount;
}
```

外部代码只能通过 `increase` 和 `decrease` 修改数量。每个操作都带着自己的检查，不会出现负数。

### 5.4 不变量

类中始终应成立的条件叫[[不变量]]。OrderLine 的不变量之一是 `quantity >= 0`。构造器和每个修改数量的方法都在维护它。

设计类时的关键问题不是“字段用什么类型”，而是“这个对象有哪些条件必须一直成立”。把这些条件写进构造器和业务方法，比靠注释或约定可靠得多。

## 六、`final` 字段

### 6.1 一旦赋值就不能再改

第 6 章已经见过 `final` 变量。`final` 用在字段上表示该字段在构造器完成后不能再被修改：

```java
public class OrderLine {
    private final String productName; // 构造器完成后不能改
    private int quantity;             // 可以改

    public OrderLine(String productName, int quantity) {
        this.productName = productName;
        this.quantity = quantity;
    }
    // productName 没有 setter——也不需要，因为它是 final
}
```

`final` 字段必须在构造器结束前完成赋值。编译器会检查这一点——如果某个构造器路径没有给 `final` 字段赋值，编译会失败。

### 6.2 `final` 引用不等于对象不可变

`final String productName` 的意思是变量 `productName` 不能改为指向另一个 String 对象，但 String 本身不可变，所以这里没有问题。如果字段是 `final StringBuilder`：

```java
private final StringBuilder log = new StringBuilder();

public void appendLog(String entry) {
    log.append(entry); // 可以：修改的是对象内部
}
```

`log` 不能指向另一个 `StringBuilder`，但 `log` 指向的 `StringBuilder` 对象内部仍然可以变化。`final` 锁住的是引用变量，不锁住对象内容。

## 七、`static` 与实例成员

### 7.1 实例成员每个对象有一份

实例字段和方法属于对象。每 `new` 一个对象，就多一套实例字段：

```java
OrderLine line1 = new OrderLine("书", 2);
OrderLine line2 = new OrderLine("笔", 5);

// line1 与 line2 各自保存自己的 productName 和 quantity
```

### 7.2 `static` 成员属于类本身

`static` 字段只有一份，被这个类的所有对象共享：

```java
public class OrderLine {
    private static int totalLinesCreated = 0; // 类的共享计数器

    public OrderLine(String productName, int quantity) {
        totalLinesCreated++; // 每创建一个对象，计数器加 1
        // ...
    }

    public static int getTotalLinesCreated() {
        return totalLinesCreated;
    }
}
```

```java
OrderLine line1 = new OrderLine("书", 2);
OrderLine line2 = new OrderLine("笔", 5);

System.out.println(OrderLine.getTotalLinesCreated()); // 控制台输出：2
```

`static` 方法用类名调用，不需要先创建对象。在 `static` 方法内部，不能直接使用实例字段（因为没有“当前对象”这个概念）。

### 7.3 什么时候用 static

- 方法不依赖任何具体对象的字段时，可以写成 `static` 工具方法。
- 字段需要被所有对象共享时，写成 `static` 字段，但要小心——多个对象同时修改同一个 `static` 字段可能引发并发问题（第 34 章会讲）。
- 不要把本应属于具体对象的字段写成 `static`。每个订单行的数量应该是实例字段，不是 `static` 字段。

## 八、封装与可变性设计

### 8.1 不可变对象的优势

如果一个对象在创建后，所有字段都不能被修改，它就是[[不可变对象]]。String 是不可变的；第 4-7 章大量使用的 `"Hello"` 字面量指向的就是不可变对象。

不可变对象的优点：

- 创建后状态固定，不需要担心某处修改影响了另一处。
- 可以在多处共享，不用担心被意外改变。
- 天然线程安全（第 34 章会进一步讨论）。

缺点也很明显：每次需要“变化”时只能创建新对象。对于会频繁变化的购物车数据，使用可变对象配合封装方法更合适。

### 8.2 可变对象需要封装来保证安全

当对象允许修改时，封装（`private` 字段 + 业务方法）是保证安全的主要手段。设计可变对象时问三个问题：

1. 哪些字段可以被外部修改？哪些不行？
2. 每次修改需要满足什么条件？
3. 这些条件能不能在编译期或运行期被检查？

## 九、一个完整的 OrderLine

下面把前面讨论的内容合成一个完整的类。它不是真实订单系统，但能展示一个带规则的类应该如何组织：

```java
public class OrderLine {
    private final String productName;     // 创建后不能改
    private int quantity;                 // 可通过 increase/decrease 修改
    private static int totalCreated = 0;  // 所有 OrderLine 对象共享的计数器

    // 完整构造器
    public OrderLine(String productName, int quantity) {
        if (productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("商品名不能为空");
        }
        if (quantity < 0) {
            throw new IllegalArgumentException("数量不能为负数，收到：" + quantity);
        }
        this.productName = productName;
        this.quantity = quantity;
        totalCreated++; // 每创建一个有效对象，计数器加 1
    }

    // 数量默认为 1 的便利构造器
    public OrderLine(String productName) {
        this(productName, 1);
    }

    // getter
    public String getProductName() {
        return productName;
    }

    public int getQuantity() {
        return quantity;
    }

    public static int getTotalCreated() {
        return totalCreated;
    }

    // 业务方法：增加数量
    public void increase(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("增加数量必须大于 0");
        }
        this.quantity += amount;
    }

    // 业务方法：减少数量
    public void decrease(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("减少数量必须大于 0");
        }
        if (this.quantity < amount) {
            throw new IllegalArgumentException(
                "数量不足，当前：" + this.quantity + "，想减少：" + amount);
        }
        this.quantity -= amount;
    }

    // 格式化信息，便于打印
    public String describe() {
        return productName + " × " + quantity;
    }
}
```

测试它：

```java
public class OrderLineDemo {
    public static void main(String[] args) {
        OrderLine line1 = new OrderLine("Java 编程书", 3);
        OrderLine line2 = new OrderLine("马克笔"); // 默认数量 1

        System.out.println(line1.describe()); // 控制台输出：Java 编程书 × 3
        System.out.println(line2.describe()); // 控制台输出：马克笔 × 1

        line1.increase(2);
        System.out.println(line1.describe()); // 控制台输出：Java 编程书 × 5

        line1.decrease(1);
        System.out.println(line1.describe()); // 控制台输出：Java 编程书 × 4

        System.out.println(OrderLine.getTotalCreated()); // 控制台输出：2
    }
}
```

### 9.1 这段代码的设计选择

- `productName` 是 `final`：订单行创建后，商品名不应该改变。
- `quantity` 不是 `final`：数量会变化，但变化只能通过 `increase` 和 `decrease` 完成。
- 没有 `setQuantity`：外部代码不能直接把数量设成任意值。
- `describe` 返回格式化字符串：让打印更方便，而不是让外部直接拼字段。

## 十、本章练习

### 10.1 计数器类

设计 `Counter` 类，满足以下要求：

- 构造器接收初始值，初始值不能为负数。
- 提供 `increment()` 方法，每次调用值加 1。
- 提供 `getValue()` 方法返回当前值。
- 不公开字段。

```java
// 预期的使用方式
Counter c = new Counter(0);
c.increment();
c.increment();
System.out.println(c.getValue()); // 应该输出：2
```

### 10.2 参考答案

```java
public class Counter {
    private int value;

    public Counter(int initialValue) {
        if (initialValue < 0) {
            throw new IllegalArgumentException("初始值不能为负数");
        }
        this.value = initialValue;
    }

    public void increment() {
        this.value++;
    }

    public int getValue() {
        return value;
    }
}
```

### 10.3 判分标准

- 字段是 `private`（2 分）
- 构造器检查了负数（2 分）
- `increment` 没有参数且每次加 1（2 分）
- `getValue` 只返回当前值而不修改状态（2 分）
- 没有提供把值设成任意整数的 setter（2 分）

## 十一、常见误区

### 11.1 把类名当成对象

`OrderLine` 是类型名，是类的定义。`new OrderLine("书", 1)` 才创建了一个具体的对象。变量保存的是对象引用，不是类定义。

### 11.2 为每个字段自动生成 getter 和 setter

IDE 可以一键生成 getter 和 setter，但应该先想清楚这个字段允许怎样变化。setter 让外部可以任意改写，可能绕开构造器里的检查。

### 11.3 用 `static` 保存应该属于对象的数据

如果一个字段的值随对象不同而不同（如每个订单行的数量），它应该是实例字段。`static` 字段被所有对象共享，修改一个会影响所有。

### 11.4 在构造器里调用可被子类覆盖的方法

这属于继承和多态的陷阱，第 10 章会展开。现在只需要知道：构造器里只做字段赋值和基本检查，不要调用复杂的实例方法。

## 十二、本章小结

类把字段和方法放在一起，是 Java 组织代码的基本单元。对象是类在运行时的具体实例，每个对象保存自己的字段值。构造器在 `new` 时初始化对象并检查规则；`private` 字段和业务方法共同维护不变量。

`static` 成员属于类本身，被所有对象共享；实例成员每个对象单独拥有一份。`final` 字段在构造器完成后不能再改变。

第 9 章会比较普通类、record 和 enum，讨论不同场景下应该选择哪种类型声明方式。

## 十三、快速自测

1. 构造器与普通方法有哪两个最明显的区别？
2. 为什么 `quantity` 字段通常应该设为 `private`？
3. `final String productName` 是否表示整个 OrderLine 对象完全不可变？
4. `static` 方法和实例方法在使用上有什么区别？
5. 如果 OrderLine 提供了 `setQuantity(int quantity)` 且没有做检查，会有什么风险？

参考答案：

1. 构造器名称与类名相同且没有返回值类型；构造器在 `new` 时自动调用，不能像普通方法一样通过对象显式调用。
2. `private` 阻止外部代码绕开业务方法直接修改字段，从而保护不变量。
3. 不是，`quantity` 不是 `final`，仍然可以通过 `increase`/`decrease` 改变。
4. `static` 方法通过类名调用，不能直接访问实例字段；实例方法通过对象调用，可以访问该对象的字段。
5. 外部代码可以传入负数，破坏 `quantity >= 0` 的不变量，构造器中的检查形同虚设。

## 参考文献

- Oracle. [The Java Language Specification, Java SE 17: Classes](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html).
- Oracle. [The Java Language Specification, Java SE 17: Fields](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.3).
- Oracle. [The Java Language Specification, Java SE 17: Constructors](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.8).
- OpenJDK. [Learn Java: Classes and Objects](https://dev.java/learn/classes-objects/).
