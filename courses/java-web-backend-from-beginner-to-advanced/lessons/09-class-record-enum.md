# 第 9 章　类、record 与 enum 的选择

> 学习提示：先理解三种类型分别解决什么问题，再运行每种类型的最小示例，最后用选择表练习判断。
> 一句话总结：普通类适合有状态和行为的对象，record 适合以数据为主的透明载体，enum 适合一组有限且固定的选项；语法选择应表达业务意图。

## 一、三个问题帮你选择类型

第 8 章用普通类（`class`）定义了 `OrderLine`。它的字段有 `private` 保护，方法只允许特定操作，`quantity` 的变化受 `increase` 和 `decrease` 控制。这些设计都服务于一个目标：维护对象的不变量。

但并不是所有数据都需要这种程度的封装。Java 17 还提供了两种很常用的类型声明方式：[[record]] 和 [[enum]]。在写代码之前，先问自己三个问题：

1. 这个值是否会变化？是否需要维护复杂的业务规则？
2. 它主要任务是携带几项数据，还是需要定义一系列操作？
3. 它的合法取值是否只能来自一个固定的小集合？

三个问题的答案会指向不同的类型选择。这些类型不是互相替代的关系——它们各有用处，让读到代码的人能迅速判断“这是一个可变对象”“这是一份数据快照”还是“这是一个有限状态”。

## 二、普通类：有状态和行为的对象

### 2.1 何时选择普通类

第 8 章的 `OrderLine` 是普通类的典型用法。当对象需要满足以下条件之一时，应该使用普通类：

- 对象内部有可变状态，且变化必须满足特定规则。
- 对象的行为比较复杂，需要多个方法协作。
- 对象需要隐藏内部实现细节，只暴露有限的公开方法。

概括起来：普通类适合表达“有状态、有行为”的对象。

### 2.2 一个对比案例

考虑一个购物车项。它需要支持增减数量，每次增减都有检查：

```java
public class CartItem {
    private final String sku;
    private int quantity;

    public CartItem(String sku, int quantity) {
        if (sku == null || sku.isBlank()) {
            throw new IllegalArgumentException("SKU 不能为空");
        }
        if (quantity <= 0) {
            throw new IllegalArgumentException("数量必须大于 0");
        }
        this.sku = sku;
        this.quantity = quantity;
    }

    public String getSku() { return sku; }
    public int getQuantity() { return quantity; }

    public void add(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("增加数量必须大于 0");
        }
        this.quantity += amount;
    }
}
```

`quantity` 会随用户操作变化，`add` 方法保证了业务规则。用普通类是正确的选择。

如果只是需要把 `sku` 和 `quantity` 从数据库传到前端，中间不需要任何修改和检查，情况就不同了——这时 record 可能更合适。

## 三、record：透明的数据载体

### 3.1 record 解决什么问题

很多类只做一件事：把几项数据打包在一起，方便传递。例如 API 返回的地址信息、数据库查询的一行结果、方法返回的多个值。这些类的典型写法是：

```java
public class Address {
    private final String city;
    private final String street;
    private final String postalCode;

    public Address(String city, String street, String postalCode) {
        this.city = city;
        this.street = street;
        this.postalCode = postalCode;
    }

    public String getCity() { return city; }
    public String getStreet() { return street; }
    public String getPostalCode() { return postalCode; }

    @Override
    public boolean equals(Object o) { /* 按字段比较 */ }

    @Override
    public int hashCode() { /* 按字段计算 */ }

    @Override
    public String toString() { /* 格式化输出 */ }
}
```

字段、构造器、getter、`equals`、`hashCode`、`toString`——几乎全是模板代码。record 从 JDK 16 开始正式提供，把这些重复工作交给编译器。

### 3.2 record 的最小语法

一行声明就能得到上述所有内容：

```java
public record Address(String city, String street, String postalCode) {
}
```

这条声明自动生成了以下成员：

- 三个 `private final` 字段（称为[[组件]]），分别对应 `city`、`street`、`postalCode`。
- 一个接收全部组件的[[规范构造器]]。
- 与组件同名的访问方法：`city()`、`street()`、`postalCode()`。
- 基于全部组件的 `equals` 方法。
- 基于全部组件的 `hashCode` 方法。
- 包含所有组件名和值的 `toString` 方法。

使用时：

```java
Address addr = new Address("上海", "南京路", "200001");

System.out.println(addr.city());      // 控制台输出：上海
System.out.println(addr.street());    // 控制台输出：南京路
System.out.println(addr.postalCode()); // 控制台输出：200001
```

注意访问方法叫 `city()`，不是 `getCity()`。这是 record 的固定命名规则——访问方法名就是组件名本身。如果前端代码或 JSON 库期望 `getCity()`，需要额外配置（第 22 章会讲）。

### 3.3 record 的 equals 按组件值比较

第 6 章讲过，默认的 `equals` 比较对象身份。record 的 `equals` 按所有组件值比较：

```java
Address a1 = new Address("上海", "南京路", "200001");
Address a2 = new Address("上海", "南京路", "200001");

System.out.println(a1 == a2);       // 控制台输出：false（不同对象）
System.out.println(a1.equals(a2));  // 控制台输出：true（组件值相同）
```

这意味着 record 是“值类型”——两个 record 对象只要组件值完全相同，它们就相等。这很适合用作 DTO、缓存 key 或方法的返回值。

### 3.4 紧凑构造器校验数据

record 也可以写自己的构造器来做校验。写法与普通类不同，使用[[紧凑构造器]]：

```java
public record Email(String value) {
    public Email {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
    }
}
```

紧凑构造器省略了参数列表（参数列表与组件声明相同），省略了给字段赋值的语句（编译器会在校验完成后自动赋值）。它的作用就是做校验或调整参数。

```java
Email email = new Email("user@example.com");
System.out.println(email.value()); // 控制台输出：user@example.com
```

也可以写完整的规范构造器：

```java
public record Email(String value) {
    public Email(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
        this.value = value;
    }
}
```

两种写法效果相同。紧凑构造器更简洁，规范构造器在需要转换参数时更灵活。

### 3.5 record 的不可变性边界

record 的所有组件字段都是 `private final`，因此 record 实例创建后，组件引用不能再指向其他对象。但这不是“深度不可变”：

```java
public record Tags(String[] items) {
}
```

```java
String[] tags = {"java", "spring"};
Tags t = new Tags(tags);

System.out.println(t.items()[0]); // 控制台输出：java

tags[0] = "python"; // 通过外部数组引用修改了内部内容

System.out.println(t.items()[0]); // 控制台输出：python
```

`items` 字段本身不能改为指向另一个数组，但数组的内容可以被修改。第 6 章讲过，`final` 锁住的是引用变量，不是变量指向的对象。如果 record 的组件是可变类型（数组、集合、Date 等），外部仍然可能修改其内容。

需要真正的不可变性时，在构造器中复制可变数据：

```java
public record Tags(String[] items) {
    public Tags {
        items = items.clone(); // 复制一份，切断外部引用
    }

    public String[] items() {
        return items.clone(); // 返回时也复制一份
    }
}
```

集合相关内容在第 13 章会系统展开，届时会看到更自然的做法——用不可变集合替代数组。

### 3.6 record 可以有实例方法

record 不只是数据容器，也可以定义实例方法：

```java
public record Money(long amountInCents, String currency) {
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("货币单位不一致");
        }
        return new Money(this.amountInCents + other.amountInCents, this.currency);
    }

    public String display() {
        return String.format("%.2f %s", amountInCents / 100.0, currency);
    }
}
```

```java
Money price = new Money(2990, "CNY");
Money tax = new Money(500, "CNY");
Money total = price.add(tax);

System.out.println(total.display()); // 控制台输出：34.90 CNY
```

`add` 方法返回了一个新的 Money 对象，而不是修改当前对象。这保持了 record 的不可变性。如果需求是“修改当前对象的金额”，那就不应该用 record，而是用普通类。

### 3.7 record 不能继承类，可以实现接口

record 隐式继承 `java.lang.Record`，不能再显式继承其他类。但可以实现接口：

```java
public interface Displayable {
    String display();
}

public record Money(long amountInCents, String currency) implements Displayable {
    @Override
    public String display() {
        return String.format("%.2f %s", amountInCents / 100.0, currency);
    }
}
```

接口和多态是第 10 章的主题。这里只需要知道 record 可以参与接口体系。

## 四、enum：一组有限且固定的选项

### 4.1 enum 解决什么问题

很多业务概念只有有限的几个合法取值。比如订单状态是“待支付”“已支付”“已取消”中的一种，不可能是其他值。如果用字符串表示：

```java
String status = "paiD"; // 拼写错误，编译器不会报错
```

字符串可以拼错，大小写不一，任何字符串都能编译通过。`"PAID"`、`"paid"`、`"paiD"`、`"Payed"` 在编译器看来都是合法的 String，但业务上只有一种是正确的。

[[enum]] 把合法取值直接写在类型定义里：

```java
public enum OrderStatus {
    CREATED,
    PAID,
    CANCELLED
}
```

### 4.2 enum 的基本用法

```java
OrderStatus status = OrderStatus.CREATED;

if (status == OrderStatus.PAID) {
    System.out.println("订单已支付，可以发货");
}
```

注意这里用了 `==` 而不是 `equals`。enum 的每个常量在 JVM 中只有一个实例，因此同一个 enum 类型的常量可以用 `==` 安全比较。这和 String 不同——String 的内容比较应该用 `equals`。

enum 不能使用 `new` 创建新实例。`OrderStatus` 只有三个值，多一个都不会出现。

### 4.3 enum 在 switch 中的使用

enum 和 `switch` 配合非常自然。JDK 17 的 `switch` 对 enum 提供了完备性检查：

```java
String label = switch (status) {
    case CREATED -> "待支付";
    case PAID -> "已支付";
    case CANCELLED -> "已取消";
};
System.out.println(label); // 根据 status 输出对应中文
```

如果忘记处理某个 enum 常量，编译器会报错。这比字符串的 `if-else` 安全得多。

### 4.4 enum 可以有字段、构造器和方法

enum 不只是常量名。每个常量可以携带自己的数据：

```java
public enum OrderStatus {
    CREATED("待支付", true),
    PAID("已支付", false),
    CANCELLED("已取消", false);

    private final String label;
    private final boolean canModify;

    OrderStatus(String label, boolean canModify) {
        this.label = label;
        this.canModify = canModify;
    }

    public String label() {
        return label;
    }

    public boolean canModify() {
        return canModify;
    }
}
```

```java
OrderStatus status = OrderStatus.CREATED;

System.out.println(status.label());      // 控制台输出：待支付
System.out.println(status.canModify());  // 控制台输出：true
```

enum 构造器默认是 `private`，不需要也不能写 `public`。因为 enum 常量只在类加载时创建一次，不会由外部调用 `new`。

### 4.5 enum 常量的创建顺序

enum 常量的声明必须放在最前面，后面才能写字段、构造器和方法。因为常量在类加载时就会被创建，此时构造器需要用到字段，所以字段必须在常量之后立即定义。

```java
public enum OrderStatus {
    // 常量声明在前，调用构造器
    CREATED("待支付", true),
    PAID("已支付", false),
    CANCELLED("已取消", false);

    // 字段和方法在后面
    private final String label;
    private final boolean canModify;

    OrderStatus(String label, boolean canModify) {
        this.label = label;
        this.canModify = canModify;
    }

    public String label() { return label; }
    public boolean canModify() { return canModify; }
}
```

### 4.6 从字符串安全地转换为 enum

接收外部数据（HTTP 请求、数据库查询结果）时，经常需要把字符串转换为 enum。可以使用 `valueOf`：

```java
String input = "PAID";
OrderStatus status = OrderStatus.valueOf(input); // 正常转换
```

如果输入不匹配任何常量，`valueOf` 会抛出 `IllegalArgumentException`：

```java
String input = "UNKNOWN";
OrderStatus status = OrderStatus.valueOf(input); // 运行时抛出 IllegalArgumentException
```

因此接收外部数据时，需要处理不匹配的情况。第 21 和 22 章会在校验和 JSON 映射的上下文中详细讨论这一点。

## 五、三种类型的选择表

| 场景 | 优先选择 | 原因 |
| --- | --- | --- |
| 购物车项、订单、账户等会变化且需要维护规则的对象 | 普通类 | 用 `private` 字段和业务方法控制变化 |
| API 返回的地址快照、数据库查询结果、方法的多返回值 | record | 组件、访问方法和相等性由编译器自动生成 |
| 订单状态、用户角色、星期、方向等有限且固定的选项 | enum | 取值受限，编译期可检查，`==` 比较安全 |
| 需要可变状态但没有复杂规则的数据 | 普通类 | record 不可变，不适合需要原地修改的场景 |
| 值本身不会变，但需要自定义相等逻辑或隐藏部分字段 | 取决于具体需求 | 普通类可以完全控制 `equals` 和字段可见性；record 按组件值比较且所有组件公开 |

选择类型时，不要以代码行数为标准。一行 record 能做的事不代表它适合所有场景。关键看数据是否需要变化、是否需要隐藏实现、合法取值是否有限。

## 六、一个综合练习

### 6.1 为三个概念选择类型并说明理由

下面三个概念出现在一个课程管理系统中。为每个概念选择合适的类型声明方式，并写出两三句理由：

1. **课程信息**：包含课程名称（String）、讲师姓名（String）和学时数（int）。创建后信息不会改变，需要传给前端展示。
2. **学生报名记录**：包含学生姓名（String）和报名状态。状态只能是“待审核”“已通过”“已拒绝”三种。报名通过后可以升级为“已通过”或降级为“已拒绝”。
3. **积分账户**：包含当前积分余额（int）。积分可以通过消费增加，也可以通过兑换减少，余额不能为负数。

### 6.2 参考答案

1. **record**：课程信息创建后不变，主要是携带数据。`record Course(String name, String instructor, int hours)` 一行即可获得构造器、访问方法和相等性。
2. **普通类 + enum**：报名记录的状态会变化，因此需要普通类保存状态。状态本身用 `enum EnrollmentStatus { PENDING, APPROVED, REJECTED }` 表示，保证只有三种合法值。
3. **普通类**：积分余额会变化，且有“不能为负数”的规则。需要 `private` 字段配合 `add`、`deduct` 方法，用普通类封装。

### 6.3 判分标准

- 每个概念的类型选择正确（每题 3 分，共 9 分）
- 理由涉及“是否需要可变状态”“是否只是数据”“取值是否有限”中的至少一项（每题 3 分，共 9 分）
- 没有用“代码更短”作为选择 record 的唯一理由（2 分）

## 七、常见误区

### 7.1 以为 record 自动深度不可变

record 的组件引用固定，但引用指向的数组、集合或其他可变对象仍可以变化。需要深度不可变时，在构造器和访问方法中复制可变数据。

### 7.2 用字符串表示永远有限的状态

`"CREATED"`、`"created"`、`"Created"`、`"CREATED "`（末尾多了空格）都是不同的字符串，但业务上应该是一样的。enum 让编译器约束合法取值。

### 7.3 把 enum 当作可以随意创建实例的类

不能使用 `new OrderStatus(...)`。enum 常量在类加载时创建，数量固定。如果未来需要动态增加状态，enum 就不合适——但这也意味着业务模型需要重新考虑。

### 7.4 因为 record 短就把所有类改成 record

record 的不可变性意味着每次“变化”都要创建新对象。如果对象需要频繁修改（如购物车项的数量），普通类配合封装方法更合适。类型的长度不是选择标准。

### 7.5 在 enum 常量后面忘记分号

```java
public enum OrderStatus {
    CREATED,
    PAID,
    CANCELLED; // 如果后面有字段或方法，分号必须写
    // ...
}
```

如果 enum 只有常量，分号可写可不写。如果常量后面还有字段、构造器或方法，常量列表末尾必须加分号。

## 八、本章小结

普通类、record 和 enum 是 Java 中三种不同的类型声明方式，它们分别服务不同的设计意图：

- 普通类表达“有状态、有行为”的对象，用封装保护不变量。
- record 表达“以数据为主”的透明载体，编译器自动生成访问方法、相等性和字符串表示。
- enum 表达“有限且固定”的选项集合，编译期保证取值安全。

选择类型时先问：数据是否变化？是否需要隐藏实现？合法取值是否有限？答案会自然指向合适的类型声明。第 10 章将引入接口和继承，让不同类型的对象通过抽象能力协作。

## 九、快速自测

1. record 自动生成哪些成员？它们的命名规则是什么？
2. 为什么 record 的 `equals` 和普通类的默认 `equals` 行为不同？
3. 为什么 enum 状态比 String 更安全？给出两个具体原因。
4. 什么情况下不应该把普通类改成 record？
5. `record Tags(String[] items)` 的 `items` 字段能否被修改？为什么？

参考答案：

1. 组件字段（`private final`）、规范构造器、与组件同名的访问方法、按组件值比较的 `equals`、`hashCode` 和 `toString`。
2. 普通类默认的 `equals` 比较对象身份（`==`），record 重写了 `equals` 使其按所有组件值比较。
3. enum 编译期约束合法取值，拼写错误会被编译器发现；`switch` 可以对 enum 做完备性检查；enum 常量全局唯一，`==` 比较安全。
4. 对象需要可变状态、需要隐藏部分字段、需要自定义 `equals` 逻辑不按全部字段比较、或需要继承其他类（record 不能继承）。
5. `items` 引用本身不能改为指向另一个数组，但数组内容可以通过 `t.items()[0] = "new"` 修改。需要深度不可变时，应在构造器中复制数组。

## 参考文献

- Oracle. [The Java Language Specification, Java SE 17: Record Classes](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.10).
- Oracle. [The Java Language Specification, Java SE 17: Enum Classes](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.9).
- Oracle. [Record API, Java SE 17](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Record.html).
- Oracle. [Enum API, Java SE 17](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Enum.html).
- OpenJDK. [JEP 395: Records](https://openjdk.org/jeps/395).
