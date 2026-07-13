# 第 5 章　Java 类型系统与类型转换

> 学习提示：类型不只是变量前面的单词。它决定一个值怎样表示、可以参与哪些运算、能否为 `null`，以及编译器允许它流向哪里。
> 一句话总结：Java 用八种基本类型直接表示简单值，用引用类型指向对象；自动转换只接受相对安全的方向，可能丢失范围或精度的转换必须显式写出并承担边界风险。

## 一、类型为值规定可用规则

### 1.1 同样的符号会因类型产生不同含义

第 4 章已经写过变量：

```java
int quantity = 2;
String label = "2";
```

虽然控制台看到的内容都可能是 2，但两个值不同。整数 `2` 可以做数值加法，字符串 `"2"` 是文本：

```java
System.out.println(quantity + 1); // 控制台输出：3
System.out.println(label + 1);    // 控制台输出：21
```

[[类型]]规定了值的表示范围、支持的操作以及能赋给哪些位置。编译器借此在程序运行前发现错误：

```java
int quantity = 2;
// quantity = "two"; // 编译失败：String 不能赋给 int
```

### 1.2 声明类型与运行时的值

变量声明左侧写的是声明类型，右侧表达式产生一个值：

```java
long total = 100;
```

`total` 的声明类型是 `long`。右侧字面量 `100` 默认是 `int`，但它能安全扩展为 `long`，所以赋值成立。引用类型还可能出现“声明类型是父类型，实际对象是子类型”的情况，第 10 章讲多态时再展开。

### 1.3 Java 类型的两大类别

Java 类型先分为：

1. [[基本类型]]：直接表示数值、字符或真假，共八种。
2. [[引用类型]]：变量保存指向对象的引用，例如 `String`、数组和自定义类。

二者在默认值、能否为 `null`、相等性和参数传递中的表现不同。第 6 章会在本章基础上画出值与引用的关系。

## 二、整数类型表示不同范围的整数

### 2.1 byte、short、int 与 long

| 类型 | 位数 | 最小值到最大值 | 常见用途 |
| --- | ---: | --- | --- |
| `byte` | 8 | -128 到 127 | 二进制数据、协议字段 |
| `short` | 16 | -32,768 到 32,767 | 较少直接使用 |
| `int` | 32 | 约 -21 亿到 21 亿 | 普通整数计算、数量、索引 |
| `long` | 64 | 约正负 9.22×10¹⁸ | 大编号、毫秒时间戳、大计数 |

普通整数字面量默认是 `int`：

```java
int quantity = 100;
long population = 1_400_000_000L;

System.out.println(quantity);   // 控制台输出：100
System.out.println(population); // 控制台输出：1400000000
```

下划线只提高大数字可读性，不影响值。`long` 字面量建议使用大写 `L` 后缀，小写 `l` 容易与数字 1 混淆。

### 2.2 字面量能在范围内直接赋给小整数类型

```java
byte level = 100;
short port = 8080;
```

编译器知道常量 100 和 8080 在目标范围内，因此允许赋值。但两个 `byte` 参与普通算术时通常会先提升为 `int`：

```java
byte left = 10;
byte right = 20;
// byte sum = left + right; // 编译失败：表达式结果是 int
int sum = left + right;
System.out.println(sum); // 控制台输出：30
```

这条数值提升规则避免在很小的整数范围内反复运算，但要求目标变量类型匹配表达式结果。

### 2.3 整数溢出不会自动报错

整数超过类型最大值后会按固定位数回绕：

```java
int max = Integer.MAX_VALUE;
int overflow = max + 1;

System.out.println(max);      // 控制台输出：2147483647
System.out.println(overflow); // 控制台输出：-2147483648
```

这不是数学结果，而是二进制补码在 32 位边界上的回绕。默认 `+` 不会抛异常。需要在溢出时失败，可以使用：

```java
// Math.addExact 在发生 int 溢出时抛出 ArithmeticException
int result = Math.addExact(Integer.MAX_VALUE, 1);
```

后端中的金额分、累计数量和时间换算都要评估最大范围，不能只看平常数据。

### 2.4 整数除法与除零

```java
System.out.println(7 / 2); // 控制台输出：3
```

两个整数相除仍是整数，小数部分被截去。整数除以 0 会在运行期抛出 `ArithmeticException`：

```java
int divisor = 0;
// System.out.println(10 / divisor); // 运行时报错：/ by zero
```

第 11 章会讲异常处理；目前应在运算前验证除数。

## 三、浮点类型表示近似小数

### 3.1 float 与 double

| 类型 | 位数 | 大致有效十进制位数 | 常见选择 |
| --- | ---: | ---: | --- |
| `float` | 32 | 约 6–7 位 | 图形、科学数据中明确需要节省空间时 |
| `double` | 64 | 约 15–16 位 | Java 普通小数计算的默认选择 |

小数字面量默认是 `double`。赋给 `float` 时要加 `F`：

```java
double rate = 0.8;
float ratio = 0.8F;

System.out.println(rate);  // 控制台输出：0.8
System.out.println(ratio); // 控制台输出：0.8
```

### 3.2 二进制浮点不能精确表示所有十进制小数

```java
double result = 0.1 + 0.2;
System.out.println(result); // 控制台通常输出：0.30000000000000004
```

计算机使用二进制分数表示 `double`，0.1、0.2 等十进制小数无法在有限二进制位中精确保存。打印的尾差不是随机错误，而是表示方式的边界。

因此不要直接用 `==` 判断经过计算的浮点结果：

```java
double actual = 0.1 + 0.2;
double expected = 0.3;
double tolerance = 0.000_001;

boolean close = Math.abs(actual - expected) < tolerance;
System.out.println(close); // 控制台输出：true
```

容差应根据业务精度决定，不能把示例值机械用于所有场景。

### 3.3 金额通常不用 double

金融金额需要明确的十进制精度与舍入规则，通常使用 `BigDecimal`：

```java
import java.math.BigDecimal;

public class MoneyDemo {
    public static void main(String[] args) {
        // 使用字符串构造，避免先产生 double 的二进制近似值
        BigDecimal price = new BigDecimal("0.1");
        BigDecimal tax = new BigDecimal("0.2");
        BigDecimal total = price.add(tax);

        System.out.println(total); // 控制台输出：0.3
    }
}
```

`BigDecimal` 是引用类型，运算使用 `add`、`subtract`、`multiply` 等方法，而不是 `+`。除法还要指定无法整除时的精度和舍入模式。这里只建立选择意识，后续业务示例再使用具体规则。

### 3.4 NaN 与 Infinity 是浮点特殊值

浮点除以零不会像整数一样抛出同一种异常：

```java
System.out.println(1.0 / 0.0); // 控制台输出：Infinity
System.out.println(0.0 / 0.0); // 控制台输出：NaN
```

`NaN` 表示“不是一个数值结果”。它甚至不等于自身，应使用 `Double.isNaN(value)` 检查。后端输入若允许浮点数，校验时也要考虑这些特殊值。

## 四、boolean 只表示 true 或 false

### 4.1 boolean 不与数字互换

```java
boolean enabled = true;
boolean finished = false;

// boolean wrong = 1; // 编译失败
// int number = true; // 编译失败
```

Java 不把 0 当作 `false`，也不把非 0 当作 `true`。条件表达式必须明确得到布尔值：

```java
int quantity = 1;
boolean available = quantity > 0;

if (available) {
    System.out.println("可用"); // 控制台输出：可用
}
```

### 4.2 布尔变量表达状态或判断结果

好的命名应让条件自然可读：

```java
boolean hasStock = stock > 0;
boolean canSell = hasStock && requested > 0;
```

不要用 `status = true` 表达多个可能状态；有限状态更适合第 9 章的 `enum`。

## 五、char 表示一个 UTF-16 代码单元

### 5.1 char 使用单引号

```java
char grade = 'A';
char newline = '\n';

System.out.println(grade); // 控制台输出：A
```

`char` 占 16 位，取值范围是 0 到 65535。它不是“任意一个人类可见字符”的完整模型，而是一个 UTF-16 [[代码单元]]。

### 5.2 有些 Unicode 字符需要两个 char

部分 emoji 和辅助平面字符在 UTF-16 中由一对代理代码单元表示：

```java
String emoji = "😀";

System.out.println(emoji.length()); // 控制台输出：2
System.out.println(emoji.codePointCount(0, emoji.length())); // 控制台输出：1
```

因此处理用户文本时，不能总把 `String.length()` 当作人眼所见字符数。第 7 章会系统讲字符串 API。

### 5.3 char 可以参与整数运算

```java
char letter = 'A';
int code = letter;

System.out.println(code); // 控制台输出：65
```

这来自字符编码值，不表示应把文本处理都写成数字运算。需要完整文本时优先使用 `String`。

## 六、引用类型保存对象的引用

### 6.1 String、数组和自定义类都是引用类型

```java
String title = "Java";
int[] scores = {80, 90};
```

变量 `title` 和 `scores` 保存的不是把整个对象内容直接塞进变量槽位的基本值，而是指向对象的引用。第 6 章会画出引用复制、别名和相等性；第 7 章讲数组与字符串；第 8 章创建自定义对象。

### 6.2 null 表示当前没有对象引用

```java
String title = null;
System.out.println(title); // 控制台输出：null
```

`null` 不是空字符串。`""` 是存在的 String 对象，长度为 0；`null` 表示没有 String 对象可用。对 `null` 调用方法会在运行期抛出 `NullPointerException`：

```java
String title = null;
// System.out.println(title.length()); // 运行时报 NullPointerException
```

基本类型不能为 `null`：

```java
// int quantity = null; // 编译失败
```

## 七、自动类型转换处理相对安全的方向

### 7.1 小范围整数可以扩展到大范围整数

```java
int quantity = 100;
long total = quantity;

System.out.println(total); // 控制台输出：100
```

`int` 到 `long` 不会丢失整数范围内的值，编译器自动完成[[宽化转换]]。常见数值宽化方向包括：

```text
byte → short → int → long → float → double
char → int → long → float → double
```

箭头表示语言允许自动转换，不表示每一步都能精确保存所有值。例如很大的 `long` 转成 `float` 可能丢失低位精度。

### 7.2 混合数值运算先进行提升

```java
int count = 3;
double unitPrice = 2.5;
double total = count * unitPrice;

System.out.println(total); // 控制台输出：7.5
```

表达式中 `int` 会提升为 `double` 再计算，结果类型是 `double`。目标变量必须能接收提升后的结果。

### 7.3 赋值上下文与方法参数也会转换

```java
static void printLong(long value) {
    System.out.println(value);
}

printLong(10); // 控制台输出：10；int 实参自动扩展为 long
```

自动转换发生在编译器确认方向符合规则时，不是运行期随意改变变量类型。

## 八、强制类型转换显式接受信息损失

### 8.1 大范围到小范围需要 cast

```java
long value = 100L;
int narrowed = (int) value;

System.out.println(narrowed); // 控制台输出：100
```

括号中的 `(int)` 是[[强制类型转换]]。它告诉编译器：“我知道目标范围更小，仍要转换。”强制转换消除的是编译错误，不保证运行结果符合业务预期。

### 8.2 超出范围时高位会被截断

```java
long value = 3_000_000_000L;
int narrowed = (int) value;

System.out.println(narrowed); // 控制台输出：-1294967296
```

结果不是 21 亿上限，也不会自动抛异常。转换保留低 32 位，解释为 `int` 后可能变成负数。转换外部数据前先检查范围：

```java
if (value < Integer.MIN_VALUE || value > Integer.MAX_VALUE) {
    System.out.println("超出 int 范围"); // 本例控制台输出此行
} else {
    int safe = (int) value;
    System.out.println(safe);
}
```

也可以使用 `Math.toIntExact(value)`，越界时抛出异常，让问题不被静默隐藏。

### 8.3 浮点转整数会截去小数部分

```java
double price = 19.99;
int whole = (int) price;

System.out.println(whole); // 控制台输出：19
```

这不是四舍五入。需要舍入时明确使用 `Math.round`、`floor` 或 `ceil`，并理解它们对负数的结果。金额更不应靠强制转换处理分和元。

### 8.4 先运算再转换与先转换再运算不同

```java
int left = 5;
int right = 2;

double after = (double) (left / right);
double before = (double) left / right;

System.out.println(after);  // 控制台输出：2.0
System.out.println(before); // 控制台输出：2.5
```

第一行先完成整数除法得到 2，再转 `double`；第二行先把左操作数转成 `double`，整个除法按浮点规则计算。

## 九、包装类型把基本值放进对象世界

### 9.1 八种基本类型都有包装类

| 基本类型 | 包装类型 |
| --- | --- |
| `byte` | `Byte` |
| `short` | `Short` |
| `int` | `Integer` |
| `long` | `Long` |
| `float` | `Float` |
| `double` | `Double` |
| `char` | `Character` |
| `boolean` | `Boolean` |

包装类型是引用类型，可以用于后面会讲的泛型和集合，也可以表示 `null`。

### 9.2 装箱与拆箱通常自动发生

```java
Integer boxed = 10; // 自动装箱：int 变为 Integer
int value = boxed;  // 自动拆箱：Integer 取出 int

System.out.println(value); // 控制台输出：10
```

这种便利称为自动[[装箱]]与[[拆箱]]。编译器会插入相应转换，但对象与基本值的差异仍存在。

### 9.3 null 拆箱会抛异常

```java
Integer boxed = null;
// int value = boxed; // 运行时报 NullPointerException
```

拆箱必须从真实包装对象中取值，`null` 没有可取的值。数据库可空数字、请求参数和配置值常会使用包装类型，转换为基本类型前必须决定“缺失”如何处理。

### 9.4 包装对象不要用 == 判断数值相等

```java
Integer first = 1000;
Integer second = 1000;

System.out.println(first == second);      // 控制台通常输出：false
System.out.println(first.equals(second)); // 控制台输出：true
```

`==` 比较的是引用，部分较小整数可能因缓存让结果看似为 `true`，不能依赖。第 6 章会完整解释引用相等性。

## 十、var 是局部变量类型推断

### 10.1 编译器从初始化表达式推断静态类型

JDK 10 起，局部变量可以使用 `var`：

```java
var quantity = 10;  // 编译器推断为 int
var title = "Java"; // 编译器推断为 String

// quantity = "ten"; // 编译失败：quantity 仍然是 int
```

`var` 不是动态类型，也不是 `Object`。类型在编译时已经确定，只是省略了左侧重复书写。

### 10.2 var 只能用于有初始化值的局部变量

```java
// var count;       // 编译失败：无法推断类型
// var missing = null; // 编译失败：仅凭 null 无法推断具体类型
```

字段、方法参数和返回类型不能用 `var`。当右侧类型不明显时，显式类型更有助于阅读：

```java
BigDecimal total = calculateTotal();
```

## 十一、文本与数字之间需要解析或格式化

### 11.1 强制转换不能把字符串变成数字

```java
String text = "42";
// int number = (int) text; // 编译失败：String 与 int 不是这种转换关系
```

应调用解析方法：

```java
String text = "42";
int number = Integer.parseInt(text);

System.out.println(number + 1); // 控制台输出：43
```

文本不是合法整数时会抛出 `NumberFormatException`。第 11 章会用它学习异常边界。

### 11.2 数字可以格式化为字符串

```java
int number = 42;
String text = String.valueOf(number);

System.out.println(text + 1); // 控制台输出：421
```

字符串拼接也会把数字转换为文本，但 `String.valueOf` 更明确地表达“我要得到字符串”。

## 十二、后端数据类型的初步选择

### 12.1 数量、编号、金额和时间不是同一类数字

| 数据含义 | Java 常见起点 | 选择理由 |
| --- | --- | --- |
| 数量、页码 | `int` | 范围通常足够，计算方便 |
| 大计数、毫秒时间戳 | `long` | 范围更大 |
| 数据库可空整数 | `Integer` / `Long` | 可以表达缺失，但要防拆箱空值 |
| 金额 | `BigDecimal` 或最小货币单位的 `long` | 明确十进制或整数规则 |
| 普通测量近似值 | `double` | 接受浮点误差 |
| 有限业务状态 | `enum` | 第 9 章讲，避免魔法数字 |
| 日期时间 | `java.time` 类型 | 第 16 章讲，不用裸 long 表达所有时间语义 |

“数据库列是什么类型”不应成为唯一选择依据。还要考虑缺失值、单位、范围、精度、运算方式和接口表达。

### 12.2 类型选择要连同单位写清

变量 `timeout = 30` 无法判断是秒还是毫秒。可以命名为 `timeoutSeconds`，或第 16 章使用 `Duration`。`price = 1999` 也要说明单位是分还是元。类型保证表示规则，名字和领域类型补充业务语义。

## 十三、练习与验收

### 13.1 判断能否编译

逐行判断并说明原因：

```java
byte a = 100;
// byte b = 200;
long c = 100;
float d = 1.5F;
// int e = 1.5;
Integer f = null;
// int g = null;
```

答案：`a`、`c`、`d`、`f` 可编译；200 超出 byte 范围，1.5 是 double 且有小数，基本类型 int 不能为 null。

### 13.2 预测转换结果

```java
int left = 7;
int right = 2;

System.out.println(left / right);            // 预测：？
System.out.println((double) left / right);   // 预测：？
System.out.println((double) (left / right)); // 预测：？
```

答案依次为 3、3.5、3.0。

### 13.3 修复溢出风险

下面计算为什么可能先溢出？怎样修复？

```java
int unitPrice = 1_500_000_000;
int quantity = 2;
long total = unitPrice * quantity;
System.out.println(total);
```

乘法在两个 `int` 之间先完成，溢出后才赋给 `long`。让一个操作数先成为 `long`：

```java
long total = (long) unitPrice * quantity;
System.out.println(total); // 控制台输出：3000000000
```

### 13.4 独立练习

编写 `TypeReport`：

1. 保存商品数量、单价（以分为单位）和折扣比例。
2. 计算折扣前总分值，确保乘法不会先发生 int 溢出。
3. 把结果转换为便于显示的元，但说明浮点显示只用于演示，不用于最终结算。
4. 解析字符串 `"3"` 作为新增数量。
5. 为每条输出写预期结果注释。

完成标准：能解释每个变量为何选择当前类型、转换发生在哪一步、是否可能丢范围或精度、空值是否可出现。

## 十四、常见误区

### 14.1 认为 long 目标会让 int 运算自动安全

表达式先按操作数类型计算，再赋给目标变量。需要大范围时，在运算前让至少一个操作数成为 `long`。

### 14.2 用强制转换修复所有编译错误

cast 只表明接受窄化，不验证范围、单位和业务含义。优先检查类型选择是否正确。

### 14.3 用 double 保存精确金额

二进制浮点存在十进制表示误差。金额选择 `BigDecimal` 或明确单位的整数，并定义舍入规则。

### 14.4 把包装类型当作永不为空的基本类型

`Integer` 可以为 `null`，自动拆箱时可能抛异常。接口、数据库和配置边界要明确缺失策略。

### 14.5 把 var 当成 JavaScript 的动态变量

`var` 只省略局部变量左侧类型，推断后类型固定。右侧不清楚时显式写类型。

## 十五、本章小结

八种基本类型直接表示整数、浮点数、字符和布尔值；引用类型保存指向对象的引用并可为 `null`。整数类型有固定范围和溢出边界，浮点类型是近似表示，`char` 是 UTF-16 代码单元而不是所有可见字符的完整抽象。

宽化转换通常由编译器自动完成，窄化转换必须显式 cast，却仍可能丢失范围或精度。包装类型让基本值进入对象与泛型世界，同时带来空值和拆箱风险。`var` 仍是静态类型。类型选择还要结合单位、范围、精度和缺失语义。

## 十六、快速自测

1. 基本类型与引用类型的核心区别是什么？
2. 普通整数和小数字面量默认分别是什么类型？
3. 为什么两个 byte 相加通常不能直接赋给 byte？
4. int 溢出时会自动抛异常吗？
5. 为什么 `0.1 + 0.2` 可能不等于精确的 0.3？
6. `char` 一定对应一个人眼字符吗？
7. 宽化与窄化转换的区别是什么？
8. `(double) (5 / 2)` 为什么是 2.0？
9. `Integer` 自动拆箱有什么风险？
10. `var` 为什么不是动态类型？
11. 字符串 `"42"` 怎样变成整数？
12. 后端金额常用哪些表示方式？

参考答案：基本类型直接保存简单值，引用类型保存对象引用；int 与 double；算术提升为 int；默认不会；二进制浮点不能有限精确表示所有十进制小数；不一定，部分字符需要两个代码单元；前者向更宽目标自动进行，后者显式且可能丢信息；整数除法先得到 2；null 拆箱抛异常；编译时已推断并固定类型；`Integer.parseInt`；`BigDecimal` 或明确最小货币单位的 long。

## 参考文献

- OpenJDK. [Java Language Basics](https://dev.java/learn/language-basics/).
- Oracle. [Java SE 17 Language Specification：Types, Values, and Variables](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html).
- Oracle. [Java SE 17 Language Specification：Conversions and Contexts](https://docs.oracle.com/javase/specs/jls/se17/html/jls-5.html).
- Oracle. [Java SE 17 API：Number](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Number.html).
- Oracle. [Java SE 17 API：BigDecimal](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/math/BigDecimal.html).
- Unicode Consortium. [UTF-16](https://www.unicode.org/faq/utf_bom.html#UTF16).
