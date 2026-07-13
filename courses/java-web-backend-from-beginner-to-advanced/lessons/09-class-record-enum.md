# 第 9 章　类、record 与 enum 的选择

> 学习提示：先看数据是否需要变化、是否有独立身份、取值是否有限，再选择类型写法。
> 一句话总结：普通类适合有状态和行为的对象，record 适合透明传递的数据，enum 适合有限且明确的选项；语法选择应表达业务意图。

## 先问对象在表达什么

第 8 章的普通类可以保存字段、在构造器中校验，并通过方法改变状态。Java 17 还提供 `record` 与 `enum` 两种很常用的类型声明。选择它们之前，不必先背语法，先问三个问题：

1. 这个值是否有自己的生命周期或可变状态？
2. 它主要是携带几项数据，还是需要维护复杂行为？
3. 它的取值是否只能来自一组有限选项？

普通类、record、enum 不互相替代。它们让读代码的人更快知道“这是一份可变对象”“这是一份数据快照”还是“这是一个有限状态”。

## 普通类适合有规则的对象

当对象需要维护可变状态或不变量时，使用第 8 章的普通类：

```java
public class ShoppingCartItem {
    private final String productId;
    private int quantity;

    public ShoppingCartItem(String productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("数量必须大于 0");
        }
        this.productId = productId;
        this.quantity = quantity;
    }

    public void add(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("增加数量必须大于 0");
        }
        quantity += amount;
    }
}
```

购物车项会因用户操作改变数量，类通过方法限制变化方式。若简单改成公开字段或 record，就需要额外设计规则位置，反而失去封装。

## record 表示一份数据

[[record]]在 JDK 16 正式加入，JDK 17 可直接使用。它适合主要任务是保存和传递数据的类型：

```java
public record Address(String city, String street, String postalCode) {
}
```

这句声明已经生成了：

- 三个 private final 组件字段。
- 同名访问方法 `city()`、`street()`、`postalCode()`。
- 接收全部组件的构造器。
- 基于组件的 `equals`、`hashCode` 和 `toString`。

使用时：

```java
Address address = new Address("上海", "南京路", "200001");
System.out.println(address.city());
```

record 的访问方法不是 `getCity()`，而是 `city()`。它的组件引用不能重新赋值，但 record 不保证深度不可变。若组件是可变数组或集合，外部仍可能修改其中内容：

```java
public record Tags(String[] values) {
}
```

`values` 字段本身不能指向另一数组，但数组元素能被修改。需要真正保护时，要在构造器和访问方法中复制可变数据；这会在集合章节后更容易理解。

record 也可以写自己的构造器验证：

```java
public record Email(String value) {
    public Email {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("邮箱不能为空");
        }
    }
}
```

这是紧凑构造器写法，编译器会在验证后把参数赋给组件。第 11 章会进一步讨论异常设计。

## enum 表示有限选项

[[enum]]适合值域固定的情况，例如订单状态：

```java
public enum OrderStatus {
    CREATED,
    PAID,
    CANCELLED
}
```

使用 enum 比任意字符串更安全：

```java
OrderStatus status = OrderStatus.CREATED;

if (status == OrderStatus.PAID) {
    System.out.println("已付款");
}
```

enum 常量是固定对象，因此比较同一枚举类型时可以使用 `==`。它还能有字段、构造器和方法：

```java
public enum OrderStatus {
    CREATED("待支付"),
    PAID("已支付"),
    CANCELLED("已取消");

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
```

不要把数据库或接口传来的任意字符串直接当成 enum 常量。第 22 章会讨论 JSON 映射和兼容性；此处只需知道未知值需要明确处理。

## 用选择表代替习惯用法

| 情况 | 优先选择 | 原因 |
| --- | --- | --- |
| 地址、坐标、查询结果等数据快照 | record | 组件、访问方法和内容相等性由语言生成 |
| 购物车项、账户、订单等会变化并维护规则的对象 | 普通类 | 可用方法和访问控制保护状态 |
| 订单状态、角色、星期等有限集合 | enum | 取值受限，分支和比较更安全 |

不要因为 record 代码短就把所有类改成 record，也不要因为习惯字符串就放弃 enum。类型的长度不是选择标准，数据的行为和变化方式才是。

## 练习：为三个概念选择类型

为下列概念选择类型并写出两三句理由：

1. API 返回给前端的一次地址快照。
2. 可增加、减少数量的购物车项。
3. 只能为“草稿、已发布、已归档”的文章状态。

完成标准：理由涉及“是否需要可变状态”“是否只是数据”“取值是否有限”中的至少一项；不要只回答“record 写得更少”。

## 常见误区

### 以为 record 自动深度不可变

record 的组件引用固定，但引用指向的数组、集合或其他可变对象仍可变化。

### 用字符串表示永远有限的状态

字符串可以拼错，`"PAID"`、`"paid"`、`"Payed"` 都能编译。enum 让非法状态更早暴露。

### 把 enum 当作普通可创建类

不能使用 `new OrderStatus(...)`。enum 常量由类型声明时固定创建。

## 本章小结

普通类、record 与 enum 都是类型，但它们表达的意图不同。普通类维护状态和行为；record 表达以数据为中心的值；enum 限制一组固定选项。下一章会让不同类通过接口和多态协作。

## 快速自测

1. record 默认生成哪些常用成员？
2. 为什么 enum 状态通常比 String 更安全？
3. 什么情况下不应把普通类改成 record？

参考答案：组件访问方法、构造器、`equals`、`hashCode`、`toString`；enum 限制合法取值且可安全比较；对象需要可变状态、身份或封装规则时。

## 参考文献

- Oracle. [Java SE 17 API: Record](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Record.html).
- Oracle. [Java SE 17 API: Enum](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Enum.html).
