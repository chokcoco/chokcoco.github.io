# 第 10 章　接口、继承、组合与多态

> 学习提示：先理解接口如何描述能力，再比较继承和组合两种复用方式，最后用多态让代码依赖抽象而不是具体实现。
> 一句话总结：接口约定能力，实现类提供具体规则；继承表达真实的类型关系，组合表达对象间的协作；多态让调用方只依赖接口，运行时自动选择正确的实现。

## 一、接口：先描述能力，再提供实现

### 1.1 从具体到抽象的思考

第 8 章的 `OrderLine`，第 9 章的 `CartItem`，都是具体类型——它们不仅规定了能做什么，还规定了怎么做。但在很多场景里，调用方只关心“能做某事”，不关心具体怎么做。

比如一个计算订单最终价格的方法，它只需要知道“能根据原价算出折后价”这个能力，至于折扣是全价、打九折还是满减，应该由调用方在创建对象时决定。

[[接口]]就是用来描述这种“能力”的。接口不写字段的实现，不写方法体（JDK 8 之后的 `default` 方法除外），只声明有哪些方法可以调用。

### 1.2 声明第一个接口

```java
public interface DiscountPolicy {
    int apply(int originalPrice);
}
```

- `interface` 关键字声明这是一个接口。
- `int apply(int originalPrice)` 是[[抽象方法]]：只有方法签名，没有方法体和大括号。
- 接口中的方法默认是 `public abstract`，可以不写修饰符。

这条接口在说：任何实现了 `DiscountPolicy` 的类，都必须提供一个 `apply` 方法，接收原价，返回折后价。至于怎么算，由实现类自己决定。

### 1.3 两个实现类给出不同规则

先写一个“不打折”的实现：

```java
public class NoDiscountPolicy implements DiscountPolicy {
    @Override
    public int apply(int originalPrice) {
        return originalPrice;
    }
}
```

再写一个“九折”的实现：

```java
public class PercentageDiscountPolicy implements DiscountPolicy {
    @Override
    public int apply(int originalPrice) {
        return originalPrice * 90 / 100;
    }
}
```

逐项解释：

- `implements DiscountPolicy` 表示这个类实现了该接口。一个类可以实现多个接口，用逗号分隔。
- `@Override` 是注解，告诉编译器“这个方法是覆盖接口（或父类）中的方法”。如果方法名、参数或返回值写错了，编译器会报告错误。
- 两个类的 `apply` 方法体不同，一个直接返回原价，一个打九折。

### 1.4 用接口类型声明变量

创建对象时，变量类型可以写成接口：

```java
DiscountPolicy policy = new PercentageDiscountPolicy();
int finalPrice = policy.apply(1000);

System.out.println(finalPrice); // 控制台输出：900
```

变量 `policy` 的[[声明类型]]是 `DiscountPolicy`，而实际保存的对象是 `PercentageDiscountPolicy`。调用 `policy.apply(1000)` 时，Java 执行的是 `PercentageDiscountPolicy` 的 `apply` 方法——也就是实际对象的实现，不是接口的抽象声明。

## 二、多态：同一调用，不同行为

### 2.1 什么是多态

[[多态]]的字面意思是“多种形态”。在 Java 中，一个接口类型的变量可以指向不同的实现类对象，同一个方法调用会产生不同的行为。

```java
DiscountPolicy policy1 = new NoDiscountPolicy();
DiscountPolicy policy2 = new PercentageDiscountPolicy();

System.out.println(policy1.apply(1000)); // 控制台输出：1000
System.out.println(policy2.apply(1000)); // 控制台输出：900
```

两行都调用了 `apply(1000)`，但结果不同。Java 在运行时根据对象的实际类型来决定执行哪个方法，这个机制叫[[动态绑定]]。

### 2.2 把变化的部分封装在接口后面

多态的最大价值在于：调用方可以完全不关心实现细节。看一个订单计算类：

```java
public class OrderCalculator {
    private final DiscountPolicy discountPolicy;

    public OrderCalculator(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    public int calculateFinalPrice(int originalPrice) {
        return discountPolicy.apply(originalPrice);
    }
}
```

`OrderCalculator` 的字段类型是 `DiscountPolicy`，不是 `NoDiscountPolicy` 或 `PercentageDiscountPolicy`。这意味着创建 `OrderCalculator` 时可以传入任何实现了 `DiscountPolicy` 的对象：

```java
OrderCalculator calc1 = new OrderCalculator(new NoDiscountPolicy());
OrderCalculator calc2 = new OrderCalculator(new PercentageDiscountPolicy());

System.out.println(calc1.calculateFinalPrice(1000)); // 控制台输出：1000
System.out.println(calc2.calculateFinalPrice(1000)); // 控制台输出：900
```

如果以后需要一个新的折扣规则（比如满 500 减 50 的阶梯折扣），只需要新增一个实现类，完全不用改 `OrderCalculator` 的代码。这是多态的核心价值：**对扩展开放，对修改关闭**。

### 2.3 不必为每个类都创建接口

接口适合“确实存在可替代规则”的场景。如果一个类只有一个实现，且未来也不可能出现第二种，提前创建接口只会增加文件的复杂度。第 8 章的 `OrderLine`、`CartItem` 就没有接口——它们表达的是具体的对象，不是可替换的策略。

判断标准：如果调用方代码里的字段类型、方法参数类型或方法返回值类型需要写成抽象的接口，以便替换实现，那接口就有价值。否则，从具体类开始，等真正出现第二种实现时再抽接口也不迟。

## 三、继承：表达真正的“是一个”关系

### 3.1 extends 的基本语法

[[继承]]用 `extends` 关键字。子类继承父类中可访问的字段和方法：

```java
public class Notification {
    private String content;

    public Notification(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public String channel() {
        return "未知";
    }
}
```

```java
public class EmailNotification extends Notification {
    public EmailNotification(String content) {
        super(content); // 调用父类构造器
    }

    @Override
    public String channel() {
        return "Email";
    }
}
```

逐项解释：

- `extends Notification` 表示 `EmailNotification` 继承 `Notification`。Java 只允许单继承——一个类只能有一个直接父类。
- `super(content)` 调用父类的构造器。`super(…)` 必须是子类构造器的第一条语句。
- `@Override` 让编译器检查 `channel()` 是否真的覆盖了父类的方法。
- `Notification` 中 `getContent()` 的代码不用重写，自动被 `EmailNotification` 继承。

### 3.2 父类型变量指向子类对象

和接口一样，父类型变量可以保存子类对象：

```java
Notification notif = new EmailNotification("您有一封新邮件");

System.out.println(notif.channel());    // 控制台输出：Email
System.out.println(notif.getContent()); // 控制台输出：您有一封新邮件
```

这里 `notif` 的声明类型是 `Notification`，实际保存的是 `EmailNotification` 对象。调用 `channel()` 时，Java 执行的是 `EmailNotification` 中覆盖的版本。

### 3.3 何时使用继承

继承表达的是“是一个”关系。`EmailNotification` 是一种 `Notification`，所以继承合理。以下情况继承就不合理：

- 只是为了复用几行代码——组合更合适。
- 两个类没有真正的父子类型关系——强行 `extends` 会误导读代码的人。
- 子类不需要父类的大部分方法——继承会带来不必要的耦合。

Java 标准库中的继承关系值得观察：`ArrayList` 实现 `List` 接口，`HashSet` 实现 `Set` 接口——它们不是通过继承彼此来复用代码，而是各自实现接口。第 13 章会展开集合框架的设计。

### 3.4 向下转型的风险

把父类型变量转回子类型叫[[向下转型]]：

```java
Notification notif = new EmailNotification("消息");
EmailNotification email = (EmailNotification) notif; // 强制转换，可以运行
```

但如果 `notif` 实际保存的不是 `EmailNotification`：

```java
Notification notif = new Notification("消息");
EmailNotification email = (EmailNotification) notif; // 运行时抛出 ClassCastException
```

频繁使用向下转型通常意味着设计有问题——抽象层级不合适，或者接口缺少调用方需要的方法。应优先让接口或父类提供足够的能力，而不是让调用方猜测子类型再强制转换。

## 四、组合：持有并委托给另一个对象

### 4.1 组合的含义

[[组合]]指的是一个类把另一个对象作为自己的字段，并把部分工作委托给它：

```java
public class OrderService {
    private final DiscountPolicy discountPolicy;

    public OrderService(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    public int finalPrice(int originalPrice) {
        return discountPolicy.apply(originalPrice);
    }
}
```

`OrderService` 不是 `DiscountPolicy`，因此不应该继承它。`OrderService` 是“有一个”折扣策略，而不是“是一个”折扣策略。这就是组合。

### 4.2 为什么组合通常比继承更灵活

组合对比继承有三个优势：

**更灵活的替换时机**：组合的依赖通过构造器或 setter（谨慎使用）传入，可以在创建对象时选择不同实现。继承关系在编译时就固定了。

**更清晰的职责**：`OrderService` 负责订单流程，`DiscountPolicy` 负责折扣计算。两者各自变化，互不影响。继承会把父类的所有公开方法都带给子类，即使子类并不需要。

**更容易测试**：测试 `OrderService` 时，可以传入一个只返回固定值的 `DiscountPolicy` 实现，而不需要启动真正的折扣引擎。这比测试一个继承体系中深度耦合的子类容易得多。

### 4.3 继承与组合的选择标准

| 情况 | 选择 | 原因 |
| --- | --- | --- |
| B 确实“是一种”A，且需要复用 A 的大部分行为 | 继承 | 自然表达类型关系 |
| B 只是“使用”A 的功能 | 组合 | 避免不需要的方法被继承 |
| 需要在运行时替换行为 | 组合（通过接口） | 继承关系编译时固定 |
| 需要复用 1-2 个方法 | 组合 | 不值得为少量复用引入继承 |
| A 是为继承而设计的（文档明确说明） | 可以在审慎评估后继承 | 普通的类没有为继承做特殊设计 |

一个实用的判断方法：如果可以把 `B extends A` 用自然语言读成“B 是一种 A”，并且这句话在业务领域中也成立，那么继承可能是合适的。如果读起来别扭（“OrderService 是一种 DiscountPolicy”？），那就是组合的场景。

## 五、抽象类与默认方法

### 5.1 抽象类：部分实现，部分留给子类

[[抽象类]]用 `abstract` 关键字声明。它和接口的共同点是都不能直接实例化。区别在于抽象类可以有字段和已实现的方法：

```java
public abstract class AbstractDiscount implements DiscountPolicy {
    private final String name;

    protected AbstractDiscount(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    // 子类必须实现 apply
    @Override
    public abstract int apply(int originalPrice);
}
```

```java
public class VipDiscount extends AbstractDiscount {
    public VipDiscount() {
        super("VIP 折扣");
    }

    @Override
    public int apply(int originalPrice) {
        return originalPrice * 80 / 100; // 八折
    }
}
```

抽象类适合多个子类确实共享一部分状态或通用算法时使用。但在初学阶段，接口通常更优先——它更轻量，不会把类的单继承名额占掉。

一个类只能继承一个父类（抽象类或普通类），但可以实现多个接口。`class MyService extends BaseService implements PolicyA, PolicyB` 的写法很常见。

### 5.2 接口的默认方法

从 JDK 8 开始，接口可以包含 `default` 方法，提供默认实现：

```java
public interface DiscountPolicy {
    int apply(int originalPrice);

    default boolean supports(int originalPrice) {
        return originalPrice >= 0; // 默认支持所有非负价格
    }
}
```

实现类可以选择覆盖 `supports`，也可以直接使用默认实现：

```java
DiscountPolicy policy = new NoDiscountPolicy();
System.out.println(policy.supports(100)); // 控制台输出：true
```

`default` 方法适合给接口增加那些大多数实现类共享的小型通用行为。不适合把复杂业务逻辑、大量状态或核心流程塞进接口的默认方法。

### 5.3 接口的 static 方法

接口也可以有 `static` 方法，用法和类的 `static` 方法一样：

```java
public interface DiscountPolicy {
    int apply(int originalPrice);

    static DiscountPolicy noDiscount() {
        return new NoDiscountPolicy();
    }

    static DiscountPolicy percentageOff(int percent) {
        return originalPrice -> originalPrice * (100 - percent) / 100;
    }
}
```

```java
DiscountPolicy policy = DiscountPolicy.percentageOff(15);
System.out.println(policy.apply(1000)); // 控制台输出：850
```

接口的 `static` 方法通过接口名直接调用，常用于提供便捷的工厂方法。

### 5.4 sealed 类型

JDK 17 提供的 `sealed` 类/接口可以限制哪些类能继承或实现它：

```java
public sealed interface DiscountPolicy
    permits NoDiscountPolicy, PercentageDiscountPolicy {
    int apply(int originalPrice);
}
```

只有 `permits` 里列出的类才能实现 `DiscountPolicy`。这对于“确实只有有限的几种实现且需要编译期保证”的场景有用。初学阶段不要求使用 `sealed`，但知道它的存在有助于阅读 JDK 21+ 标准库中采用 sealed 的代码。

## 六、一个完整的示例：运费计算

### 6.1 接口定义

```java
public interface ShippingPolicy {
    int fee(int orderAmount);
}
```

### 6.2 两个实现

```java
// 固定运费 10 元
public class FlatShippingPolicy implements ShippingPolicy {
    @Override
    public int fee(int orderAmount) {
        return 10;
    }
}
```

```java
// 满 100 元免运费，否则 10 元
public class FreeOverThresholdPolicy implements ShippingPolicy {
    @Override
    public int fee(int orderAmount) {
        if (orderAmount >= 100) {
            return 0;
        }
        return 10;
    }
}
```

### 6.3 使用多态的 Checkout 类

```java
public class Checkout {
    private final ShippingPolicy shippingPolicy;
    private final DiscountPolicy discountPolicy;

    public Checkout(ShippingPolicy shippingPolicy, DiscountPolicy discountPolicy) {
        this.shippingPolicy = shippingPolicy;
        this.discountPolicy = discountPolicy;
    }

    public int totalPrice(int originalPrice) {
        int discountedPrice = discountPolicy.apply(originalPrice);
        int shippingFee = shippingPolicy.fee(discountedPrice);
        return discountedPrice + shippingFee;
    }
}
```

```java
// 创建不同的 Checkout 组合
Checkout checkout1 = new Checkout(
    new FlatShippingPolicy(),
    new NoDiscountPolicy()
);

Checkout checkout2 = new Checkout(
    new FreeOverThresholdPolicy(),
    new PercentageDiscountPolicy()
);

System.out.println(checkout1.totalPrice(80));  // 控制台输出：90 (80 + 10 运费)
System.out.println(checkout2.totalPrice(120)); // 控制台输出：108 (108 折后价 + 0 运费)
```

`Checkout` 的字段类型都是接口。新增运费规则或折扣规则时，只增加实现类，`Checkout` 不用修改。两个独立的策略可以通过组合同时存在——继承无法做到这一点（Java 单继承）。

## 七、接口与继承在多态中的对比

| 特性 | 接口 | 继承 |
| --- | --- | --- |
| 关键字 | `implements` | `extends` |
| 实现数量 | 一个类可以实现多个接口 | 一个类只能继承一个父类 |
| 是否有状态（字段） | 不能有实例字段（只能有 `static final` 常量） | 可以有任意字段 |
| 方法实现 | 默认是抽象的；可以有 `default` 和 `static` 方法 | 可以有完全实现的方法和抽象方法 |
| 构造器 | 没有构造器 | 有构造器，子类通过 `super(…)` 调用 |
| 语义 | “能做某事” | “是一种” |
| 访问控制 | 方法默认 `public` | 继承的访问控制由父类决定 |

在实际 Java 代码中，接口比继承更常用。不是继承不好，而是组合 + 接口通常提供了更灵活的替代方案。

## 八、本章练习

### 8.1 阅读代码并预测输出

下面这段程序使用了本章学过的接口和多态。先不运行，写出正确输出并说明每一步发生了什么：

```java
interface Task {
    String execute(String input);
}

class PrefixTask implements Task {
    @Override
    public String execute(String input) {
        return ">> " + input;
    }
}

class SuffixTask implements Task {
    @Override
    public String execute(String input) {
        return input + " <<";
    }
}

class TaskRunner {
    private final Task task;

    TaskRunner(Task task) {
        this.task = task;
    }

    String run(String input) {
        return task.execute(input);
    }
}

// 在 main 中：
TaskRunner runner1 = new TaskRunner(new PrefixTask());
TaskRunner runner2 = new TaskRunner(new SuffixTask());

System.out.println(runner1.run("Hello")); // (1)
System.out.println(runner2.run("World")); // (2)

Task t = new PrefixTask();
System.out.println(t.execute("Test"));     // (3)

t = new SuffixTask();
System.out.println(t.execute("Test"));     // (4)
```

### 8.2 练习：设计可替换的日志策略

定义 `Logger` 接口，包含 `void log(String message)` 方法。实现两个类：

- `ConsoleLogger`：把消息打印到控制台，格式为 `[LOG] 消息内容`。
- `FileLogger`：把消息追加写入文件（学习提示：暂时只需把 `log` 方法体写成打印 `"[FILE] 消息内容"` 即可，文件写入在第 16 章才详细讲解）。

然后写一个 `App` 类，通过构造器接收 `Logger`，提供 `doSomething()` 方法（内部调用 `log`）。创建两个 `App` 实例，分别使用不同的 Logger，验证输出。

### 8.3 参考答案

**8.1 的预测输出**：

```
(1) >> Hello
(2) World <<
(3) >> Test
(4) Test <<
```

关键判断：`runner1` 内部保存 `PrefixTask`，`runner2` 内部保存 `SuffixTask`。变量 `t` 先指向 `PrefixTask` 后指向 `SuffixTask`，每次调用执行的是实际对象的方法。

**8.2 参考实现**：

```java
interface Logger {
    void log(String message);
}

class ConsoleLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[LOG] " + message);
    }
}

class FileLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[FILE] " + message);
    }
}

class App {
    private final Logger logger;

    App(Logger logger) {
        this.logger = logger;
    }

    void doSomething() {
        logger.log("应用启动");
    }
}
```

验证：

```java
App app1 = new App(new ConsoleLogger());
app1.doSomething(); // 控制台输出：[LOG] 应用启动

App app2 = new App(new FileLogger());
app2.doSomething(); // 控制台输出：[FILE] 应用启动
```

### 8.4 判分标准

- 接口定义正确：方法签名、无方法体（4 分）
- 两个实现类使用 `implements` 和 `@Override`（4 分）
- `App` 字段类型为接口 `Logger`（4 分）
- 验证代码能正确展示多态行为（4 分）
- 预测输出题全部正确（4 分）

## 九、常见误区

### 9.1 为每个类提前创建接口

只有一个实现且没有替换需求的类，不需要接口。接口的价值在于存在多种可替换实现时体现。提前创建接口只会增加文件数量，不增加设计质量。

### 9.2 为了复用几行代码就使用继承

能复用一段方法不等于存在“是一种”关系。优先把需要复用的对象通过组合引入。`extends` 会带来父类的所有公开行为，不想要的也会一并继承。

### 9.3 在父类构造器中调用可被子类覆盖的方法

这是继承中一个常见的陷阱。父类构造器先执行，此时子类的字段还处于默认值状态。如果父类构造器调用了被子类覆盖的方法，可能读到未初始化的子类字段，导致意外行为。

```java
public class Base {
    public Base() {
        init(); // 调用 init
    }

    public void init() {
        System.out.println("Base init");
    }
}

public class Child extends Base {
    private String name = "child";

    @Override
    public void init() {
        System.out.println("Child init, name = " + name); // name 此时为 null
    }
}
```

在构造器中，尽量只做字段赋值和简单校验，不调用可能被覆盖的方法。

### 9.4 用 `==` 比较不同类型的接口变量

两个不同接口类型的变量不能用 `==` 直接比较，除非一个接口继承自另一个。因为它们之间没有类型关系。在需要比较时，应使用 `equals` 并提供一致的规则。

## 十、本章小结

接口声明了“能做什么”，不规定“怎么做”。多个实现类可以通过 `implements` 实现同一接口，提供不同的行为。多态让调用方只依赖接口类型，运行时自动选择正确的实现。

继承用 `extends` 表达“是一种”关系。子类继承父类的字段和方法，可以覆盖方法改变行为。Java 只允许单继承，一个类只能有一个直接父类。

组合是一个对象持有另一个对象作为字段，并把部分职责委托给它。组合比继承更灵活：依赖可以在运行时替换、两个类解耦、便于测试。

抽象类介于接口和普通类之间：可以有字段和已实现的方法，也可以声明抽象方法留给子类实现。接口的 `default` 方法允许提供默认实现。

选择接口、继承还是组合，关键是看关系语义：“能做某事”用接口，“是一种”用继承，“有一个”用组合。

第 11 章会学习异常——如何读堆栈、如何捕获和处理失败、以及如何设计可靠的错误处理边界。

## 十一、快速自测

1. `implements` 和 `extends` 分别表达什么关系？
2. 为什么 `Checkout` 的 `ShippingPolicy` 字段类型写成接口而不是具体类？
3. 什么情况更适合组合而不是继承？给出两个具体例子。
4. 一个 Java 类可以同时实现多个接口吗？可以同时继承多个类吗？
5. 如果子类覆盖了父类的方法，通过父类型变量调用该方法时，实际执行的是哪个版本？

参考答案：

1. `implements` 表示类实现了接口，表达“能做某事”；`extends` 表示类继承父类，表达“是一种”。
2. 写成接口后，可以在创建 `Checkout` 时传入不同运费规则的实现，`Checkout` 不需要修改代码——符合多态的使用方式。
3. 例如 `OrderService` 使用 `DiscountPolicy`（只需要折扣能力，不是折扣本身），`App` 使用 `Logger`（需要日志能力，不是一种特定的日志）。两种情况都是“有一个”而不是“是一种”。
4. 可以实现多个接口；一个类只能继承一个父类（包括抽象类）。
5. 执行子类覆盖的版本。Java 通过动态绑定在运行时查找对象的实际类型，调用该类型中覆盖的方法。

## 参考文献

- Oracle. [The Java Language Specification, Java SE 17: Interfaces](https://docs.oracle.com/javase/specs/jls/se17/html/jls-9.html).
- Oracle. [The Java Language Specification, Java SE 17: Classes](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html).
- OpenJDK. [Learn Java: Interfaces and Inheritance](https://dev.java/learn/interfaces/).
- Joshua Bloch. Effective Java, Third Edition, Item 18: Favor composition over inheritance, 2018.
- OpenJDK. [JEP 409: Sealed Classes](https://openjdk.org/jeps/409).
