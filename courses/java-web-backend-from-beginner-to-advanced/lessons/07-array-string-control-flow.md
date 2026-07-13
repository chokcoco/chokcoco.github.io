# 第 7 章　数组、字符串与控制流

> 学习提示：数组、字符串和循环都可以单独运行；先确认一个小例子的输出，再把它们组合起来。
> 一句话总结：数组按下标保存固定数量的同类型元素，String 表示不可变文本；结合第 4 章的分支和循环，已经可以完成小型文本处理规则。

## 一、数组保存固定数量的同类型数据

当程序要保存多个相同类型的值时，可以使用[[数组]]。创建三个整数的数组：

```java
int[] scores = {60, 75, 90};
```

`int[]` 表示“整数数组”。数组的每个位置有一个从 0 开始的[[下标]]：

```java
System.out.println(scores[0]); // 60
System.out.println(scores[2]); // 90
System.out.println(scores.length); // 3
```

最后一个元素的下标永远是 `length - 1`。访问 `scores[3]` 会在运行期抛出 `ArrayIndexOutOfBoundsException`，因为长度为 3 的数组只有 0、1、2 三个有效下标。

数组创建后长度不能改变。下面写法创建五个整数位置，初始值都是 0：

```java
int[] quantities = new int[5];
quantities[0] = 2;
```

需要可增可减的数据容器时，第 13 章会介绍 `List`。本章先把“固定位置、固定长度、同一类型”的数组规则讲清楚。

## 二、使用索引与循环访问数组

已知下标时，用普通 `for` 循环：

```java
String[] names = {"Ada", "Lin", "Mo"};

for (int index = 0; index < names.length; index++) {
    System.out.println(names[index]);
}
```

条件必须写 `index < names.length`，不能写 `<=`；后者最后会访问不存在的 `names[names.length]`。

只需要读取每个元素、无需下标时，用增强 `for`：

```java
for (String name : names) {
    System.out.println(name);
}
```

它读作“从 names 中依次取出一个 String，命名为 name”。增强 `for` 简洁，但不适合需要知道位置、跳过指定下标或替换元素的场景。

## 三、String 表示不可变文本

[[String]]表示文本。可以用双引号创建：

```java
String title = " Java Web ";
```

常见操作包括：

```java
System.out.println(title.length());        // 10，包含空格
System.out.println(title.trim());          // "Java Web"
System.out.println(title.contains("Web")); // true
System.out.println(title.startsWith(" ")); // true
```

String 有一个重要性质：[[不可变]]。调用 `trim()`、`toUpperCase()` 等方法不会改动原变量指向的文本，而是返回一个新字符串：

```java
String title = " java ";
title.trim();
System.out.println(title); // 仍然是 " java "

String cleaned = title.trim();
System.out.println(cleaned); // "java"
```

因此，想保留处理结果必须接住返回值。字符串相等性继续使用第 6 章的规则：比较内容使用 `equals`，不要用 `==`。

```java
String status = "OPEN";
if ("OPEN".equals(status)) {
    System.out.println("待处理");
}
```

把常量放在左侧能避免 `status` 为 `null` 时直接抛异常。

## 四、多次拼接时使用 StringBuilder

少量文本可以使用 `+`：

```java
String greeting = "你好，" + "Java";
```

循环中反复使用 `+` 会不断产生新的 String 对象。需要逐步构造文本时，使用[[StringBuilder]]：

```java
StringBuilder report = new StringBuilder();

for (int score : scores) {
    report.append(score).append(" ");
}

System.out.println(report.toString());
```

`append` 把内容追加到 builder；最后 `toString()` 得到普通 String。第 8 章会解释 `new` 创建对象的语义，本章先把 StringBuilder 当成专门用于累积文本的标准库工具。

## 五、使用 switch 映射有限状态

当一个值只有几个固定取值时，`switch` 可以让分支更集中。JDK 17 可使用 switch 表达式：

```java
static String labelOf(String status) {
    return switch (status) {
        case "OPEN" -> "待处理";
        case "DONE" -> "已完成";
        case "CANCELLED" -> "已取消";
        default -> "未知状态";
    };
}
```

`case` 后的 `->` 表示该分支直接产生结果；`default` 处理未列出的值。这里仍然是字符串状态，真正用 `enum` 表达有限状态会在第 9 章讲。

## 六、组合数组、字符串与控制流

下面程序从固定数组中读取状态，去掉首尾空格、统一大写，再映射为显示文本：

```java
public class StatusDemo {
    public static void main(String[] args) {
        String[] rawStatuses = {" open ", "done", "", "unknown"};

        for (String rawStatus : rawStatuses) {
            String status = rawStatus.trim().toUpperCase();

            if (status.isEmpty()) {
                System.out.println("状态为空");
                continue;
            }

            System.out.println(labelOf(status));
        }
    }

    static String labelOf(String status) {
        return switch (status) {
            case "OPEN" -> "待处理";
            case "DONE" -> "已完成";
            default -> "未知状态";
        };
    }
}
```

`continue` 表示结束本轮循环，直接进入下一个元素。这个例子只用了已经学过的数组、String、循环、判断、方法和 switch；没有提前引入集合或 Stream。

## 七、补充理解数组的创建与复制

### 7.1 声明数组变量不等于创建数组

下面只声明了一个数组变量，它目前没有指向数组对象：

```java
int[] scores = null;
// System.out.println(scores.length); // 运行时报 NullPointerException
```

`new int[3]` 才会创建长度为 3 的数组：

```java
int[] scores = new int[3];

System.out.println(scores.length); // 控制台输出：3
System.out.println(scores[0]);     // 控制台输出：0
```

数组创建后长度固定。`int` 元素默认是 0，`boolean` 默认是 `false`，引用类型元素默认是 `null`。这与第 4 章“局部变量必须初始化”并不冲突：变量 `scores` 已经指向真实数组，数组对象内部的槽位由 JVM 初始化。

### 7.2 数组变量保存引用

数组属于引用类型。把一个数组变量赋给另一个变量，会复制引用，而不是复制全部元素：

```java
int[] first = {10, 20};
int[] second = first;

// 两个变量指向同一个数组，因此通过 second 修改后，first 也能看到
second[0] = 99;
System.out.println(first[0]); // 控制台输出：99
```

需要独立副本时，可以使用 `Arrays.copyOf`：

```java
import java.util.Arrays;

int[] first = {10, 20};
int[] copy = Arrays.copyOf(first, first.length);

copy[0] = 99;
System.out.println(first[0]); // 控制台输出：10
System.out.println(copy[0]);  // 控制台输出：99
```

`Arrays` 是标准库中的工具类。这里使用 `copyOf` 即可，不需要理解它的内部实现。

### 7.3 二维数组是数组中保存数组

```java
int[][] table = {
    {1, 2},
    {3, 4}
};

System.out.println(table[0][1]); // 控制台输出：2
```

第一个索引选择外层数组中的一行，第二个索引选择该行中的元素。Java 的二维数组每一行长度可以不同，因此更准确地说它是“数组的数组”，不是必须规则的数学矩阵。

## 八、补充掌握 String 的常用读取操作

### 8.1 长度、字符和子串

```java
String text = "Java17";

System.out.println(text.length());      // 控制台输出：6
System.out.println(text.charAt(0));     // 控制台输出：J
System.out.println(text.substring(0, 4)); // 控制台输出：Java
```

`substring(begin, end)` 包含开始位置，不包含结束位置，即左闭右开 `[begin, end)`。这与数组循环常用的 `index < length` 一致。索引小于 0 或不小于长度时会抛出越界异常。

### 8.2 查找与判断

```java
String text = "java-backend";

System.out.println(text.contains("back")); // 控制台输出：true
System.out.println(text.startsWith("java")); // 控制台输出：true
System.out.println(text.indexOf('-')); // 控制台输出：4
System.out.println(text.indexOf("web")); // 控制台输出：-1
```

`indexOf` 找不到内容时返回 -1。调用 `substring` 前若依赖查找结果，先确认索引不为 -1。

### 8.3 去除空白与大小写转换都会产生新字符串

```java
String raw = "  Paid  ";
String normalized = raw.strip().toUpperCase();

System.out.println(raw);        // 控制台输出：  Paid  （原值不变）
System.out.println(normalized); // 控制台输出：PAID
```

JDK 11 起的 `strip` 按 Unicode 空白判断，旧的 `trim` 主要处理码值不大于空格的字符。处理国际化文本时通常优先 `strip`。

## 九、字符串拆分、连接与比较

### 9.1 split 的参数是正则表达式

```java
String line = "Java,Spring,SQL";
String[] parts = line.split(",");

for (String part : parts) {
    System.out.println(part);
}
// 控制台依次输出：Java、Spring、SQL
```

`split` 的参数不是普通字符，而是[[正则表达式]]。句点 `.` 在正则中表示任意字符，按字面句点拆分要写 `"\\."`。复杂正则不属于本章范围。

### 9.2 join 把多个字符串连接起来

```java
String result = String.join(" | ", "Java", "Spring", "SQL");
System.out.println(result); // 控制台输出：Java | Spring | SQL
```

### 9.3 文本内容使用 equals 比较

```java
String status = new String("PAID");

System.out.println(status.equals("PAID")); // 控制台输出：true
System.out.println(status == "PAID");      // 控制台输出：false
```

第 6 章已经说明：`==` 比较引用值，`equals` 比较 String 内容。常量在前的 `"PAID".equals(status)` 还可以安全处理 `status == null`。

## 十、遍历、拼接和控制流的选择

### 10.1 普通 for 与增强 for 各有用途

需要索引、修改指定位置或同时观察前后元素时，使用普通 `for`：

```java
String[] names = {"小林", "小周"};

for (int index = 0; index < names.length; index++) {
    System.out.println(index + "：" + names[index]);
}
// 控制台依次输出：0：小林、1：小周
```

只需从头到尾读取元素时，增强 `for` 更直接：

```java
for (String name : names) {
    System.out.println(name);
}
// 控制台依次输出：小林、小周
```

增强 `for` 中的变量接收当前元素值。给变量重新赋值不会替换数组槽位：

```java
for (String name : names) {
    name = "已修改";
}

System.out.println(names[0]); // 控制台输出：小林
```

### 10.2 StringBuilder 适合循环中的累积拼接

String 不可变，循环中的 `result = result + value` 每轮都可能创建新对象。`StringBuilder` 在内部维护可扩展字符缓冲区：

```java
String[] names = {"小林", "小周", "小吴"};
StringBuilder builder = new StringBuilder();

for (int index = 0; index < names.length; index++) {
    if (index > 0) {
        builder.append(", ");
    }
    builder.append(names[index]);
}

String result = builder.toString();
System.out.println(result); // 控制台输出：小林, 小周, 小吴
```

关键步骤是先创建 builder、反复 `append`，最后 `toString` 得到 String。少量固定字符串使用 `+` 更易读，不需要所有拼接都改成 builder。

### 10.3 判断、循环和 switch 解决不同问题

- `if` 适合范围、复合条件和不规则判断。
- `switch` 适合同一个值的有限分支。
- `for` 适合长度或次数明确的遍历。
- `while` 适合由状态决定何时结束的重复。

不要为了使用新语法把简单判断改写得更复杂。选择标准是执行意图能否被直接读出。

## 十一、练习与验收

给定：

```java
String[] tags = {" java ", "", "Web", "java"};
```

要求：遍历数组，去掉首尾空格；跳过空文本；每个保留标签转为大写；用 `StringBuilder` 以逗号连接它们。暂时不要求去重，第 13 章会处理唯一性。

完成标准：循环不会越界；能解释为什么要接住 `trim()` 和 `toUpperCase()` 的返回值；最后只调用一次 `toString()`。

## 十二、常见误区

### 12.1 把 `length` 写成方法调用

数组使用字段 `array.length`，String 使用方法 `text.length()`。少一个或多一个括号都会编译失败。

### 12.2 使用 `<= array.length`

数组下标从 0 开始，最后一项是 `length - 1`。普通循环的继续条件通常是 `< length`。

### 12.3 以为 String 方法原地修改文本

String 不可变。调用 `trim()` 后需要赋给变量，原字符串不会自动更新。

### 12.4 把 split 参数当成普通文本

`split` 使用正则表达式。按点号、竖线等特殊字符拆分时要转义，并用具体输入测试空字段和末尾分隔符。

### 12.5 在循环中反复用加号构建长文本

少量拼接可以用 `+`；循环或大量片段使用 `StringBuilder`，最后只调用一次 `toString`。

## 十三、本章小结

数组处理固定数量的同类型数据，String 处理不可变文本，循环与分支决定逐项处理的路径。第 8 章开始把数据和操作组织进自定义类；第 13 章再使用可变长度集合替代一部分数组场景。

## 十四、快速自测

1. 长度为 3 的数组有哪些有效下标？
2. `String.trim()` 为什么要接收返回值？
3. 普通 `for` 与增强 `for` 分别适合什么情况？

参考答案：0、1、2；String 不可变，方法返回新字符串；需要下标时使用普通 `for`，只读取每个元素时增强 `for` 更简洁。

## 参考文献

- Oracle. [Java SE 17 API: String](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/String.html).
- Oracle. [Java SE 17 API: StringBuilder](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/StringBuilder.html).
