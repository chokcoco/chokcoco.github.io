# 第 8 章　类、对象与业务规则封装

> 学习提示：先分清“类是写法”和“对象是运行时创建出的具体数据”，再阅读字段和方法怎样协作。
> 一句话总结：类定义一类对象的数据与行为；构造器建立初始状态，方法维护规则，访问控制避免外部代码绕过这些规则。

## 为什么变量和方法会聚在一起

第 4 章的方法可以计算结果，第 7 章的数组可以保存数据。但当一份数据有自己的规则时，把相关变量散在 `main` 中会很难维护。例如一个订单项有商品名和数量，数量不能为负数；每个地方都直接修改整数，就无法保证规则一致。

[[类]]把“对象要保存的数据”和“允许怎样操作这些数据”写在一起。类本身不是具体订单项，而是一份创建订单项的定义；根据类创建出的每一个具体值叫[[对象]]。

## 定义第一个类

先看一个只保存名字的类：

```java
public class Person {
    String name;

    void sayHello() {
        System.out.println("你好，" + name);
    }
}
```

`name` 是[[字段]]，每个 Person 对象各自保存一份字段值。`sayHello` 是[[实例方法]]，它操作的是当前对象的字段。

在另一个类的 `main` 中创建对象：

```java
Person person = new Person();
person.name = "Ada";
person.sayHello();
```

`new Person()` 创建一个 Person 对象；变量 `person` 保存该对象的引用。点号用于访问对象的字段或调用对象的方法。第 6 章的引用规则在这里开始有实际用途：两个变量若保存同一个对象引用，修改字段会被两边看到。

## 构造器让对象从有效状态开始

先创建再逐项赋值容易得到半成品对象。[[构造器]]在 `new` 时接收必要数据：

```java
public class Person {
    String name;

    Person(String name) {
        this.name = name;
    }
}
```

构造器名与类名相同，没有返回值类型。`this.name` 表示当前对象的字段；右边的 `name` 是构造器参数。创建方式变为：

```java
Person person = new Person("Ada");
```

构造器可以检查最基础的规则：

```java
public class OrderLine {
    private final String productName;
    private int quantity;

    public OrderLine(String productName, int quantity) {
        if (productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("商品名不能为空");
        }
        if (quantity < 0) {
            throw new IllegalArgumentException("数量不能为负数");
        }
        this.productName = productName;
        this.quantity = quantity;
    }
}
```

这里的 `throw` 和异常类型将在第 11 章系统讲解。现在关注目的：若没有合法商品名或数量，就不创建一个无效 OrderLine。

## private 让规则留在类内部

字段通常不应公开：

```java
private int quantity;
```

`private` 表示只有 OrderLine 类自己的代码能直接访问 `quantity`。外部代码不能写 `line.quantity = -1;`，而要调用类提供的方法。

读取数量可以提供 getter：

```java
public int getQuantity() {
    return quantity;
}
```

修改数量不必提供毫无约束的 setter。更贴近业务规则的写法是：

```java
public void increase(int amount) {
    if (amount <= 0) {
        throw new IllegalArgumentException("增加数量必须大于 0");
    }
    quantity += amount;
}
```

类中始终应成立的条件称为[[不变量]]。OrderLine 的不变量之一是 `quantity >= 0`。构造器与 `increase` 都在保护它；这比“先允许任何值、之后某处再检查”可靠得多。

## static 与对象自身的区别

前几章为了方便，从 `main` 中直接调用了 `static` 方法。`static` 成员属于类本身，而不是某一个对象：

```java
public class PriceRule {
    public static boolean isValidPrice(int cents) {
        return cents >= 0;
    }
}

boolean valid = PriceRule.isValidPrice(100);
```

调用时使用类名 `PriceRule`。相对地，`line.increase(2)` 操作的是某个具体 OrderLine 对象的数量。

判断方法是否应该是 `static` 的一个简单标准：它是否需要读取或修改某个对象的字段？需要时是实例方法；只根据参数计算通用结果时，可以是 `static` 工具方法。

## 一个完整但很小的 OrderLine

```java
public class OrderLine {
    private final String productName;
    private int quantity;

    public OrderLine(String productName, int quantity) {
        if (productName == null || productName.isBlank()) {
            throw new IllegalArgumentException("商品名不能为空");
        }
        if (quantity < 0) {
            throw new IllegalArgumentException("数量不能为负数");
        }
        this.productName = productName;
        this.quantity = quantity;
    }

    public void increase(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("增加数量必须大于 0");
        }
        quantity += amount;
    }

    public int getQuantity() {
        return quantity;
    }
}
```

`final` 表示 `productName` 在构造器赋值后不能再指向另一个字符串。它不等于整个对象不可变，因为 `quantity` 仍能通过 `increase` 改变。

## 练习：为计数器设计边界

创建 `Counter` 类：构造器接收初始值，初始值不能为负数；提供 `increment()` 与 `getValue()`；不要公开字段，也不要提供可把值改成任意整数的 setter。

完成标准：能用 `new Counter(0)` 创建对象；外部代码只能通过方法改变状态；任何公开操作后计数器都不会小于 0。

## 常见误区

### 把类当成已经创建的对象

`OrderLine` 是类型名；`new OrderLine("书", 1)` 才创建对象。变量保存的是对象引用，不是类定义本身。

### 为每个字段自动生成 setter

setter 很方便，但会让外部代码绕开业务规则。先问“这个状态允许怎样改变”，再决定是否需要方法。

### 用 `static` 保存每个对象自己的状态

`static` 字段由所有对象共享。订单项自己的数量应该是实例字段，而不是 static 字段。

## 本章小结

类把数据和规则放在一起；对象是类在运行时的具体实例。构造器建立有效初始状态，private 字段和业务方法共同维护不变量。第 9 章会比较普通类、record 与 enum；第 10 章再让不同对象通过接口协作。

## 快速自测

1. 构造器与普通方法有什么区别？
2. 为什么 `quantity` 通常应为 private？
3. `final String productName` 是否表示整个 OrderLine 都不可变？

参考答案：构造器在 `new` 时初始化对象且没有返回值类型；private 防止外部绕过规则直接修改字段；不是，`quantity` 仍可改变。

## 参考文献

- Oracle. [Java SE 17 Language Specification](https://docs.oracle.com/javase/specs/jls/se17/html/).
- OpenJDK. [Learn Java: Objects](https://dev.java/learn/classes-objects/).
