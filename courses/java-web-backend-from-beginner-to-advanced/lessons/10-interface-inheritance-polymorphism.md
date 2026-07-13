# 第 10 章　接口、继承、组合与多态

> 学习提示：先看调用方需要什么能力，再决定使用接口、继承还是持有另一个对象。
> 一句话总结：接口约定能力，实现类提供不同规则；多态让调用方依赖抽象类型，继承用于真正的“是一个”关系，组合通常更适合复用行为。

## 接口先描述能力

[[接口]]不先描述“对象里有哪些字段”，而是描述“调用方可以要求它做什么”。例如折扣规则都能根据原价计算应付金额：

```java
public interface DiscountPolicy {
    int apply(int originalPrice);
}
```

接口方法没有方法体。它要求实现类提供 `apply`，却不规定具体计算方式。调用方因此可以只依赖 `DiscountPolicy`，不必写死某一种折扣。

## 两个实现类给出不同规则

```java
public class NoDiscountPolicy implements DiscountPolicy {
    @Override
    public int apply(int originalPrice) {
        return originalPrice;
    }
}
```

```java
public class PercentageDiscountPolicy implements DiscountPolicy {
    @Override
    public int apply(int originalPrice) {
        return originalPrice * 90 / 100;
    }
}
```

`implements` 表示类实现接口；`@Override` 表示这个方法是对接口方法的实现。它能帮助编译器检查方法名、参数和返回值是否写对。

调用时，变量类型可以写成接口：

```java
DiscountPolicy policy = new PercentageDiscountPolicy();
int finalPrice = policy.apply(1000);
```

变量 `policy` 的声明类型是接口，运行时保存的是具体实现对象。调用 `apply` 时，Java 会执行实际对象的实现。这种“同一调用根据对象类型产生不同结果”的能力叫[[多态]]。

## 把变化放在接口后面

订单计算不必知道每种折扣的细节：

```java
public class OrderCalculator {
    private final DiscountPolicy discountPolicy;

    public OrderCalculator(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }

    public int finalPrice(int originalPrice) {
        return discountPolicy.apply(originalPrice);
    }
}
```

创建时选择规则：

```java
OrderCalculator calculator = new OrderCalculator(new NoDiscountPolicy());
System.out.println(calculator.finalPrice(1000));
```

以后新增会员折扣时，只新增实现类，不必修改 OrderCalculator 的计算流程。这不是要求所有类都创建接口；当确实存在可替换规则时，接口才带来价值。

## 继承表示真正的“是一个”关系

[[继承]]使用 `extends`。子类继承父类可访问的字段和方法，并可重写行为：

```java
public class Notification {
    public String channel() {
        return "unknown";
    }
}

public class EmailNotification extends Notification {
    @Override
    public String channel() {
        return "email";
    }
}
```

这里 EmailNotification 是一种 Notification，因此继承有意义。父类型变量也可以指向子类：

```java
Notification notification = new EmailNotification();
System.out.println(notification.channel()); // email
```

继承会让子类和父类紧密耦合。若两个类只是“都需要发送通知”，通常接口更合适；若一个类只是“内部需要使用另一个对象”，组合更合适。

## 组合往往比继承更直接

[[组合]]表示一个对象持有另一个对象，并把工作委托出去：

```java
public class OrderService {
    private final DiscountPolicy discountPolicy;

    public OrderService(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }
}
```

OrderService 不是 DiscountPolicy，因此不应继承它；它只是“有一个”折扣规则。组合能在创建对象时替换依赖，也能避免为了复用一两个方法而建立不自然的继承树。

## 抽象类与默认方法

[[抽象类]]可以同时包含已实现的方法和必须由子类完成的抽象方法。它适合多个类确实共享一部分状态或通用算法时。Java 类只能继承一个父类，但可以实现多个接口。

接口还可提供 `default` 方法：

```java
public interface DiscountPolicy {
    int apply(int originalPrice);

    default boolean supports(int originalPrice) {
        return originalPrice >= 0;
    }
}
```

默认方法适合给接口添加小型通用行为；不要把大量状态和复杂流程塞进接口。初学阶段优先把接口保持为少量、清楚的方法。

JDK 17 的 `sealed` 类和接口可以限制谁能继承或实现它们。它适合确实只有少数可控子类型的模型；当前阶段先知道它存在，不必在普通业务代码中强行使用。

## 练习：可替换的运费规则

定义 `ShippingPolicy` 接口，包含 `int fee(int orderAmount)`。实现两个规则：普通运费固定 10 元；满 100 元免运费。让 `Checkout` 类通过构造器接收 ShippingPolicy，并计算总价加运费。

完成标准：Checkout 的字段和参数类型写接口；新增规则时不修改 Checkout；每个实现类都用 `@Override`。

## 常见误区

### 为每个类提前创建接口

只有一个实现、没有替换需求时，接口可能只是增加文件数量。接口用于表达边界或可替换能力，不是固定格式。

### 为了复用代码就继承

能复用一段方法不等于存在“是一个”关系。优先考虑把被复用的对象作为字段组合进来。

### 向下转型取得子类方法

若频繁把父类型强制转回子类，通常说明接口或父类缺少调用方真正需要的能力。不要用强制转换绕过设计问题。

## 本章小结

接口让调用方依赖能力而不是具体实现；多态在运行时选择对象的实现。继承表达真实的类型关系，组合表达对象协作。第 11 章会把正常结果之外的失败信息纳入方法和边界设计。

## 快速自测

1. `implements` 与 `extends` 分别表示什么？
2. 为什么 OrderCalculator 的字段类型是 DiscountPolicy？
3. 什么情况更适合组合而不是继承？

参考答案：前者实现接口，后者继承父类；这样可替换折扣实现；对象只是使用另一个对象而不是其一种类型时。

## 参考文献

- Oracle. [Java SE 17 Language Specification: Interfaces](https://docs.oracle.com/javase/specs/jls/se17/html/jls-9.html).
- OpenJDK. [Learn Java: Interfaces](https://dev.java/learn/interfaces/).
