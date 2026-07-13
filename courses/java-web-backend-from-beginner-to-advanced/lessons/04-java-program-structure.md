# 第 4 章　Java 变量、表达式与控制流

> 学习提示：这一章建立后续所有 Java 代码都会使用的语法。先预测每个小例子的结果，再编译运行；不要急着把所有语法组合成一个大程序。
> 一句话总结：变量为数据命名，表达式计算新值，分支与循环决定语句的执行路径，方法则把一组步骤封装成可以重复调用的单元。

## 一、语句、代码块和执行顺序

### 1.1 语句表示一个完整动作

Java 程序中的[[语句]]通常表示一次声明、赋值、调用或流程控制。下面三行分别完成三个动作：

```java
int quantity = 2;
quantity = quantity + 1;
System.out.println(quantity); // 控制台输出：3
```

前两行末尾的分号表示语句结束。第三行调用输出方法，也以分号结束。`if`、`for` 和方法声明后面通常跟代码块，右花括号后不额外写分号。

### 1.2 代码块划定一组语句的范围

花括号 `{ }` 包住的内容称为[[代码块]]。类有自己的代码块，方法有自己的代码块，`if` 和循环也可以拥有代码块。

```java
if (true) {
    System.out.println("进入代码块"); // 控制台输出：进入代码块
}
```

即使分支中暂时只有一条语句，也建议保留花括号。以后增加第二条语句时，不容易因遗漏括号而改变程序含义。

### 1.3 默认按从上到下执行

没有分支、循环和方法调用时，方法中的语句按书写顺序执行。程序不能先使用后面才声明的局部变量：

```java
// System.out.println(total); // 编译失败：此处还没有声明 total
int total = 30;
System.out.println(total); // 控制台输出：30
```

## 二、变量为数据提供类型和名字

### 2.1 声明、初始化与赋值是三个相关动作

[[变量]]是程序中一个有类型、有名字的值槽位。基本声明形式为：

```text
数据类型 变量名;
```

给变量第一次提供值称为[[初始化]]：

```java
int quantity = 2;
```

这行同时完成声明和初始化。变量已有值后，再写入新值称为[[赋值]]：

```java
quantity = 3;
System.out.println(quantity); // 控制台输出：3
```

等号 `=` 是赋值运算符：先计算右侧，再把结果交给左侧变量。它不是数学中的“左右永远相等”。因此下面的写法合理：

```java
int count = 1;
count = count + 1;
System.out.println(count); // 控制台输出：2
```

执行第二行时，先读取旧值 1，加 1 得到 2，再把 2 写回 `count`。

### 2.2 局部变量必须先初始化再使用

方法内部声明的变量称为[[局部变量]]。编译器不会为未初始化的局部变量猜一个值：

```java
int score;
// System.out.println(score); // 编译失败：score 可能尚未初始化

score = 80;
System.out.println(score); // 控制台输出：80
```

第 8 章会讲对象字段的默认值。字段和局部变量规则不同，不要据此认为所有变量都自动得到 0。

### 2.3 变量名应表达含义

Java 名字可以包含字母、数字、下划线和美元符号，但不能以数字开头，也不能使用 `class`、`if`、`int` 等关键字。课程采用常见命名约定：

- 变量和方法使用小驼峰：`unitPrice`、`calculateTotal`。
- 类名使用大驼峰：`OrderCalculator`。
- 常量使用大写加下划线：`MAX_RETRY_COUNT`。
- 布尔变量表达条件：`available`、`hasPermission`、`isFinished`。

`a`、`x1` 虽能编译，但离开上下文后很难理解。循环索引常用 `i` 是一个有限例外。

### 2.4 一个变量只能保存兼容类型的值

```java
int quantity = 2;
// quantity = "two"; // 编译失败：String 不能赋给 int
```

Java 是[[静态类型语言]]：变量类型在编译时已经确定，编译器会在运行前阻止明显不兼容的赋值。第 5 章会完整解释基本类型、引用类型和类型转换。

## 三、字面量直接表示一个值

### 3.1 常见字面量

代码中直接写出的值称为[[字面量]]：

```java
int quantity = 2;          // 2 是整数字面量
double rate = 0.8;         // 0.8 是浮点数字面量
boolean enabled = true;    // true 是布尔字面量
char grade = 'A';          // 单引号表示一个 char
String title = "Java";    // 双引号表示 String
Object missing = null;     // null 表示没有引用任何对象
```

单引号与双引号不能互换。`'A'` 是一个字符，`"A"` 是长度为 1 的字符串。`null` 只能用于引用类型，不能赋给 `int`、`boolean` 等基本类型。

### 3.2 字符串中的转义字符

双引号本身用于界定字符串，要在字符串中表示特殊字符，需要反斜杠：

```java
System.out.println("第一行\n第二行");
// 控制台输出两行：第一行、第二行

System.out.println("他说：\"你好\""); // 控制台输出：他说："你好"
System.out.println("C:\\java\\demo"); // 控制台输出：C:\java\demo
```

常见转义包括换行 `\n`、制表符 `\t`、双引号 `\"` 和反斜杠 `\\`。

## 四、运算符组成表达式

### 4.1 表达式会计算出一个值

[[表达式]]是能够计算出结果的代码片段。字面量、变量、运算和方法调用都可以参与表达式：

```java
int unitPrice = 15;
int quantity = 2;
int total = unitPrice * quantity;
boolean freeShipping = total >= 30;

System.out.println(total);        // 控制台输出：30
System.out.println(freeShipping); // 控制台输出：true
```

### 4.2 算术运算

| 运算符 | 含义 | 示例结果 |
| --- | --- | --- |
| `+` | 加法；有字符串时也可拼接 | `2 + 3` 得 5 |
| `-` | 减法 | `5 - 2` 得 3 |
| `*` | 乘法 | `4 * 3` 得 12 |
| `/` | 除法 | `5 / 2` 得 2 |
| `%` | 取余 | `5 % 2` 得 1 |

两个整数相除，结果仍是整数，小数部分直接舍去：

```java
System.out.println(5 / 2);     // 控制台输出：2
System.out.println(5.0 / 2);   // 控制台输出：2.5
System.out.println(5 % 2);     // 控制台输出：1
```

取余常用于判断奇偶：`number % 2 == 0` 表示能被 2 整除。

### 4.3 自增、自减和复合赋值

```java
int count = 1;
count++;
System.out.println(count); // 控制台输出：2

count += 3; // 等价于把 count + 3 的结果写回 count
System.out.println(count); // 控制台输出：5

count--;
System.out.println(count); // 控制台输出：4
```

`++count` 和 `count++` 单独作为一条语句时都会加 1；它们参与更大表达式时取值时机不同。零基础阶段不要写 `int result = count++ + ++count;` 这类难读代码，把更新拆成独立语句。

### 4.4 比较运算得到 boolean

```java
int stock = 5;
int requested = 3;

System.out.println(stock > requested);  // 控制台输出：true
System.out.println(stock == requested); // 控制台输出：false
System.out.println(stock != requested); // 控制台输出：true
```

`==` 表示比较，`=` 表示赋值。第 6 章会解释 `==` 比较基本类型与引用类型时的差异；本章只用它比较整数和布尔值。

### 4.5 逻辑运算组合条件

| 运算符 | 含义 | 结果为 true 的条件 |
| --- | --- | --- |
| `&&` | 并且 | 左右都为 true |
| `||` | 或者 | 至少一边为 true |
| `!` | 取反 | 原值为 false |

```java
int stock = 5;
int requested = 3;
boolean valid = requested > 0 && stock >= requested;
System.out.println(valid); // 控制台输出：true
```

Java 的条件必须是 `boolean`。JavaScript 中的 `if (quantity)` 不能直接搬到 Java：

```java
int quantity = 1;
// if (quantity) { } // 编译失败：int 不能当作 boolean

if (quantity > 0) {
    System.out.println("数量有效"); // 控制台输出：数量有效
}
```

### 4.6 短路求值避免不必要计算

`&&` 左侧为 `false` 时，整个表达式必然为 `false`，右侧不再执行；`||` 左侧为 `true` 时，右侧也不再执行。这称为[[短路求值]]。

```java
int divisor = 0;
boolean safe = divisor != 0 && 10 / divisor > 1;
System.out.println(safe); // 控制台输出：false；右侧除法没有执行
```

条件顺序应先放安全检查，再放依赖该检查的操作。

### 4.7 用括号明确优先级

乘除通常先于加减，比较先于逻辑组合，但不要依赖读者背完优先级表：

```java
int total = (10 + 5) * 2;
boolean allowed = (total >= 20) && (total <= 100);
```

括号能直接表达意图。表达式过长时，拆成有名字的中间变量比增加更多括号更清楚。

## 五、if 根据条件选择分支

### 5.1 单分支只在条件成立时执行

```java
int stock = 5;

if (stock > 0) {
    System.out.println("有库存"); // 控制台输出：有库存
}
```

条件为 `false` 时，代码块被跳过，程序继续执行 `if` 后面的语句。

### 5.2 if-else 表达二选一

```java
int score = 58;

if (score >= 60) {
    System.out.println("通过");
} else {
    System.out.println("未通过"); // 控制台输出：未通过
}
```

两个分支恰好执行一个。不要在两个独立 `if` 本应互斥时重复判断。

### 5.3 else-if 表达多个互斥区间

```java
int score = 85;

if (score >= 90) {
    System.out.println("A");
} else if (score >= 80) {
    System.out.println("B"); // 控制台输出：B
} else if (score >= 60) {
    System.out.println("C");
} else {
    System.out.println("D");
}
```

判断从上到下进行，第一个为 `true` 的分支执行后，后续分支不再检查。范围有包含关系时，通常先写更严格的条件。若先写 `score >= 60`，85 分会过早进入该分支。

### 5.4 嵌套分支不宜过深

`if` 中可以继续写 `if`，但多层嵌套会增加阅读负担。能先排除无效情况时，可以提前返回；第 4 章后半讲方法后会看到这种写法。

## 六、switch 根据一个值选择分支

### 6.1 传统 switch 与 break

当多个分支都在比较同一个离散值时，可以使用 `switch`：

```java
String status = "PAID";

switch (status) {
    case "CREATED":
        System.out.println("待支付");
        break;
    case "PAID":
        System.out.println("已支付"); // 控制台输出：已支付
        break;
    default:
        System.out.println("未知状态");
}
```

传统写法中的 `break` 结束当前 switch。漏写后会继续进入下一个 case，这称为穿透。穿透偶尔有用，但容易造成错误。

### 6.2 JDK 17 的箭头 switch

课程主线可以使用更清楚的箭头形式：

```java
String status = "PAID";

switch (status) {
    case "CREATED" -> System.out.println("待支付");
    case "PAID" -> System.out.println("已支付"); // 控制台输出：已支付
    default -> System.out.println("未知状态");
}
```

箭头分支不会自动穿透。`switch` 还可以产生一个值：

```java
String label = switch (status) {
    case "CREATED" -> "待支付";
    case "PAID" -> "已支付";
    default -> "未知状态";
};

System.out.println(label); // 控制台输出：已支付
```

模式匹配 switch 不是 JDK 17 的稳定主线能力，本课程不会在这里使用。

## 七、循环重复执行一组语句

### 7.1 for 适合次数或索引明确的重复

```java
for (int index = 0; index < 3; index++) {
    System.out.println(index);
}
// 控制台依次输出：0、1、2
```

`for` 圆括号内依次是：

1. 初始化：`int index = 0`，只在进入循环时执行一次。
2. 继续条件：`index < 3`，每轮开始前检查。
3. 更新：`index++`，每轮结束后执行。

当条件变为 `false`，循环结束。索引从 0 开始是 Java 数组和集合中常见的规则。

### 7.2 while 适合次数未知但结束条件清楚的重复

```java
int remaining = 3;

while (remaining > 0) {
    System.out.println("剩余：" + remaining);
    remaining--;
}
// 控制台依次输出：剩余：3、剩余：2、剩余：1
```

进入循环前先检查条件，所以条件一开始就是 `false` 时，一次也不执行。循环体必须推进结束条件；漏掉 `remaining--` 会形成无限循环。

### 7.3 do-while 至少执行一次

```java
int attempts = 0;

do {
    attempts++;
    System.out.println(attempts); // 控制台输出：1
} while (attempts < 1);
```

`do-while` 在循环体后检查条件，因此至少执行一次。它适合“先执行一次，再决定是否重复”的流程，但普通后端代码中使用频率通常低于 `for` 和 `while`。

### 7.4 break 与 continue 改变当前循环

`break` 立即结束最近一层循环；`continue` 跳过本轮剩余语句，进入下一轮。

```java
for (int number = 1; number <= 5; number++) {
    if (number == 2) {
        continue; // 跳过 2
    }
    if (number == 5) {
        break; // 到 5 时结束循环
    }
    System.out.println(number);
}
// 控制台依次输出：1、3、4
```

过多的 `break` 和 `continue` 会让路径难以追踪。优先让循环条件本身表达结束规则。

## 八、作用域决定变量可以在哪里使用

### 8.1 局部变量只在声明它的代码块内可见

```java
if (true) {
    int inside = 10;
    System.out.println(inside); // 控制台输出：10
}

// System.out.println(inside); // 编译失败：已经离开 inside 的作用域
```

变量的[[作用域]]从声明处开始，到所属代码块的右花括号结束。循环初始化中声明的变量也只在循环范围内可用。

### 8.2 内层可以读取外层，外层不能读取内层

```java
int total = 0;

for (int number = 1; number <= 3; number++) {
    total = total + number; // 内层代码可以访问外层 total
}

System.out.println(total); // 控制台输出：6
```

同一作用域不能重复声明同名局部变量。即便语言允许某些遮蔽情形，也应避免让内外层名字相同，以免误读修改的是哪个变量。

## 九、方法把一组步骤命名

### 9.1 方法定义的组成

[[方法]]是一段有名字、可以被调用的代码。先看只做加法的方法：

```java
static int add(int left, int right) {
    return left + right;
}
```

逐项拆解：

- `static`：本章允许 `main` 不创建对象就调用；实例方法在第 8 章讲。
- 第一个 `int`：返回值类型。
- `add`：方法名。
- `int left, int right`：两个[[形参]]，描述调用者必须提供的数据。
- `return`：结束方法，并把结果交回调用位置。

方法写在类的花括号中、其他方法的外面。Java 不能在 `main` 内再定义一个方法。

### 9.2 调用方法并接收返回值

```java
public class MethodDemo {
    public static void main(String[] args) {
        int result = add(10, 20);
        System.out.println(result); // 控制台输出：30
    }

    static int add(int left, int right) {
        return left + right;
    }
}
```

调用处的 `10` 和 `20` 称为[[实参]]。调用发生时，实参的值分别交给形参 `left` 和 `right`。第 6 章会进一步解释 Java 传递的是值。

### 9.3 void 方法只执行动作

不需要交回结果时，返回类型写 `void`：

```java
static void printWelcome(String name) {
    System.out.println("欢迎，" + name);
}
```

调用：

```java
printWelcome("小林"); // 控制台输出：欢迎，小林
```

能计算结果的方法通常优先 `return`，让调用者决定是否打印、保存或继续计算。把计算与输出全部绑在一个方法里，会降低复用性。

### 9.4 return 可以提前结束方法

```java
static boolean canSell(int stock, int requested) {
    if (requested <= 0) {
        return false; // 无效请求直接结束方法
    }

    return stock >= requested;
}
```

这种先处理无效情况的写法称为守卫式返回。它能减少深层嵌套，但方法中有资源需要关闭时还要考虑清理，第 11 章会讲。

### 9.5 方法重载按参数列表区分

同一个类中可以定义同名但参数列表不同的方法，称为[[方法重载]]：

```java
static int add(int left, int right) {
    return left + right;
}

static int add(int first, int second, int third) {
    return first + second + third;
}
```

返回类型不同但参数完全相同不能构成重载，因为调用处无法只凭返回类型选择方法。初学阶段不要创建大量相似重载；参数含义明显不同时，使用不同方法名更清楚。

## 十、组合一个仍然可读的小程序

下面程序只组合本章已经学过的变量、循环、方法和分支：

```java
public class ScoreReport {
    public static void main(String[] args) {
        // 依次生成 50、70、90 三个分数
        for (int score = 50; score <= 90; score += 20) {
            String grade = gradeOf(score);
            System.out.println(score + " 分：" + grade);
        }
        // 控制台依次输出：50 分：待改进、70 分：通过、90 分：优秀
    }

    static String gradeOf(int score) {
        if (score >= 90) {
            return "优秀";
        }
        if (score >= 60) {
            return "通过";
        }
        return "待改进";
    }
}
```

阅读组合程序时，按调用路径拆开：

1. `main` 创建循环变量 `score`。
2. 每轮把当前分数作为实参调用 `gradeOf`。
3. `gradeOf` 从上到下判断并返回一个字符串。
4. 返回值存入 `grade`。
5. `println` 拼接并输出这一轮结果。
6. 更新 `score`，再判断是否继续。

代码仍没有使用数组、集合或自定义对象，因为它们尚未讲解。

## 十一、练习与验收

### 11.1 预测表达式

先写下结果，再运行验证：

```java
int a = 5;
int b = 2;

System.out.println(a / b);          // 预测：？
System.out.println(a % b);          // 预测：？
System.out.println(a > 3 && b < 3); // 预测：？
```

答案依次为 2、1、`true`。

### 11.2 修改分支

把成绩规则改为：90 及以上为优秀，75–89 为良好，60–74 为通过，其余待改进。至少测试边界值 59、60、74、75、89、90。

### 11.3 编写库存判断方法

编写 `canSell(int stock, int requested)`：请求数量小于等于 0 时返回 `false`，否则仅在库存足够时返回 `true`。在 `main` 中打印以下调用的预期结果：

```java
System.out.println(canSell(5, 3)); // 控制台输出：true
System.out.println(canSell(5, 6)); // 控制台输出：false
System.out.println(canSell(5, 0)); // 控制台输出：false
```

### 11.4 独立组合练习

创建 `NumberReport`：

1. 使用 `for` 生成 1 到 10。
2. 编写 `isEven(int number)` 返回数字是否为偶数。
3. 只输出偶数及其平方。
4. 每条输出语句旁写明预期格式。

完成标准：能够解释变量何时声明、条件何时检查、循环如何结束、方法参数从哪里来、返回值回到哪里。

## 十二、常见误区

### 12.1 把赋值写成比较

`=` 改变变量，`==` 比较值。条件里通常需要 `score == 60`。编译器会阻止把整数赋值表达式直接当作布尔条件，但仍要理解符号含义。

### 12.2 忽略整数除法

`5 / 2` 已在两个整数之间完成计算，之后再赋给 `double` 也只是 `2.0`。需要小数时让至少一个操作数先成为浮点数；精度问题留到第 5 章。

### 12.3 条件顺序覆盖后续分支

多个范围有包含关系时，从更严格到更宽泛排列，并用边界值测试。

### 12.4 循环条件永远不变化

写循环时明确初始化值、继续条件和每轮更新。程序持续占用终端时，可用 `Ctrl+C` 中止，再检查更新语句。

### 12.5 方法同时读取、计算、打印和修改多处状态

初学方法尽量只有一个清楚职责。计算方法返回结果，入口方法决定如何展示，可以减少隐藏副作用。

## 十三、本章小结

变量通过“类型、名字和值”保存程序状态；字面量直接表示值；表达式使用算术、比较和逻辑运算得到结果。`if` 与 `switch` 负责选择，`for`、`while` 和 `do-while` 负责重复，作用域限制局部变量可以被使用的位置。

方法用返回类型、方法名和参数列表定义可复用步骤。调用者提供实参，方法通过形参接收值，再用 `return` 交回结果。本章只建立语法和执行顺序，第 5 章深入类型，第 6 章解释参数传递与相等性。

## 十四、快速自测

1. 声明、初始化和重新赋值分别是什么？
2. 为什么 `if (1)` 不能编译？
3. `5 / 2` 与 `5.0 / 2` 的结果分别是什么？
4. `&&` 的短路行为有什么用途？
5. `for` 的三个组成部分按什么顺序执行？
6. `break` 与 `continue` 有什么区别？
7. 代码块如何影响局部变量作用域？
8. 形参与实参分别出现在哪里？
9. `void` 与非 `void` 方法有什么区别？
10. 为什么不建议把更新、自增和多个运算挤在一个表达式里？

参考答案：声明建立有类型的名字，初始化第一次赋值，重新赋值替换已有值；Java 条件必须为 boolean；2 与 2.5；可先检查安全条件并跳过危险计算；初始化一次，然后反复检查条件、执行循环体、更新；前者结束循环，后者跳过本轮；变量只在声明它的块内可见；形参在定义处、实参在调用处；前者不返回值、后者必须返回兼容值；拆分后执行顺序和副作用更清楚。

## 参考文献

- OpenJDK. [Java Language Basics](https://dev.java/learn/language-basics/).
- Oracle. [Java SE 17 Language Specification：Types, Values, and Variables](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html).
- Oracle. [Java SE 17 Language Specification：Expressions](https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html).
- Oracle. [Java SE 17 Language Specification：Statements](https://docs.oracle.com/javase/specs/jls/se17/html/jls-14.html).
- Oracle. [Java SE 17 Language Specification：Methods](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.4).
