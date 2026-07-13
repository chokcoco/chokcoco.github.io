# 第 3 章　Java 程序结构、编译与运行

> 学习提示：这一章不追求写出复杂功能，而是把一份源代码怎样变成可执行程序看清楚。每做一步，都观察目录里发生了什么变化。
> 一句话总结：Java 源文件先由 `javac` 编译成 class 字节码，JVM 再根据完整类名找到并执行 `main` 方法；源文件、类、包、目录和命令必须互相对应。

## 一、从文本文件认识 Java 源代码

### 1.1 源代码是写给人和编译器看的文本

程序员直接编写的代码称为[[源代码]]。Java 源代码使用普通文本保存，文件扩展名是 `.java`。它可以用 IntelliJ IDEA 打开，也可以用系统自带的文本编辑器查看。

新建一个名为 `HelloJava.java` 的文件，写入：

```java
public class HelloJava {
    public static void main(String[] args) {
        // println 会把括号里的文本输出到控制台，并在末尾换行
        System.out.println("Hello, Java"); // 控制台输出：Hello, Java
    }
}
```

这段程序只做一件事：输出一行文字。现在先认识它的外形：

- `public class HelloJava` 声明一个名为 `HelloJava` 的[[类]]。
- 第一对花括号 `{ }` 包住类的内容。
- `main` 是从命令行启动程序时使用的入口。
- 第二对花括号包住 `main` 要执行的语句。
- `System.out.println(...)` 是一条输出语句。
- 双引号中的 `Hello, Java` 是[[字符串]]，表示一段文本。
- 普通语句末尾写分号 `;`，花括号后面不写分号。

Java 会区分大小写。`HelloJava`、`hellojava` 和 `HELLOJAVA` 是三个不同的名字；`String` 不能写成 `string`，`System` 也不能写成 `system`。

### 1.2 空白、换行和缩进帮助人阅读

多数情况下，Java 编译器把连续空格、制表符和换行看作分隔符。下面的代码虽然很难读，但仍可能通过编译：

```java
public class Compact{public static void main(String[] args){System.out.println("ok");}}
```

课程统一使用四个空格缩进。进入一个花括号后增加一级缩进，离开花括号后减少一级。缩进不会改变这段程序的执行结果，却能让类、方法和语句的归属一眼可见。

### 1.3 注释不会成为执行语句

[[注释]]用于解释代码，编译器不会把注释当作要执行的指令。Java 常用三种注释：

```java
// 单行注释：从双斜杠开始，到这一行结束

/*
 * 多行注释：可以跨越多行
 */

/**
 * 文档注释：以后可由 Javadoc 工具生成 API 文档
 */
```

好注释解释目的、关键步骤、边界或预期结果，不把代码逐字翻译成中文。例如 `// 控制台输出：3` 能帮助初学者核对运行结果，而 `// 定义变量 quantity` 往往只是重复下一行代码。

## 二、类、文件名和 main 入口

### 2.1 public 类与文件名保持一致

`public class HelloJava` 中，`HelloJava` 是类名。初学阶段遵守这条稳定规则：源文件里声明了 `public class HelloJava`，文件就命名为 `HelloJava.java`，大小写完全相同。

下面的组合会编译失败：

```text
文件名：Welcome.java
代码：public class HelloJava { ... }
```

编译器会提示公开类 `HelloJava` 应当声明在 `HelloJava.java` 中。一个文件可以包含多个非 `public` 的顶层类，但目前不要这样组织代码；每个源文件只放一个公开类，目录会更清楚。

### 2.2 main 是约定好的启动入口

命令行运行一个普通 Java 类时，JVM 会寻找下面这个方法：

```java
public static void main(String[] args) {
    // 程序从这里开始按顺序执行
}
```

现阶段把整行看成固定入口，再逐步认识每个部分：

| 部分 | 当前需要理解的含义 |
| --- | --- |
| `public` | JVM 可以从类外找到这个方法 |
| `static` | 启动时不必先创建对象；第 8 章再系统解释 |
| `void` | 方法执行结束后不返回一个结果 |
| `main` | JVM 约定的入口名称 |
| `String[] args` | 接收命令行传入的一组文本；数组在第 7 章讲解 |

拼写或签名改变后，源代码可能仍能编译，但用 `java` 启动时找不到标准入口。例如把 `main` 写成 `Main`，JVM 会报告找不到 main 方法。

### 2.3 main 中的语句从上到下执行

```java
public class OrderDemo {
    public static void main(String[] args) {
        System.out.println("第一步"); // 控制台第 1 行输出：第一步
        System.out.println("第二步"); // 控制台第 2 行输出：第二步
        System.out.println("第三步"); // 控制台第 3 行输出：第三步
    }
}
```

在没有判断、循环或方法调用改变流程时，Java 按书写顺序执行语句。写在 `main` 外面的类声明不会自动逐行执行；写在注释里的内容也不会执行。

## 三、使用 javac 编译源文件

### 3.1 编译器负责语法和类型检查

计算机不会直接执行 `.java` 文本。JDK 提供的 `javac` 是 Java [[编译器]]，它读取源文件，检查词法、语法和类型规则，然后生成扩展名为 `.class` 的文件。

在 `HelloJava.java` 所在目录打开终端或 PowerShell，先查看文件，再编译：

```bash
javac HelloJava.java
```

成功时通常没有提示文字。目录中会新增：

```text
HelloJava.java
HelloJava.class
```

“没有输出”在这里代表命令成功完成，不代表没有发生事情。判断标准是命令退出后没有错误，并且出现了 `HelloJava.class`。

### 3.2 class 文件保存 JVM 字节码

`.class` 文件不是源代码的备份，也不是可以继续编辑的文本。它保存[[字节码]]：一种由 JVM 规范定义的指令形式。Windows、macOS 和 Linux 可以分别提供自己的 JVM 实现，只要实现同一规范，就能执行兼容的 class 文件。

这就是常说的“编译一次，在不同平台的 JVM 上运行”的基础。它不表示所有 Java 程序完全没有平台差异：文件路径、字符编码、系统权限和本地库仍可能不同。第 16 章处理文件时会看到这些边界。

### 3.3 修改源文件后必须重新编译

假设先编译了输出 `A` 的程序，随后把源文件改为输出 `B`，却直接运行旧 class：

```java
System.out.println("B"); // 重新编译并运行后，控制台输出：B
```

如果没有再次执行 `javac HelloJava.java`，`java HelloJava` 仍可能运行上次生成的 class，输出旧结果。命令行学习时使用稳定顺序：保存源文件、编译、确认成功、运行。IDE 和 Maven 会替你判断哪些源文件需要重新编译，但底层关系没有改变。

### 3.4 编译错误要从第一条开始读

删除输出语句末尾的分号：

```java
System.out.println("Hello, Java")
```

编译器通常报告类似信息：

```text
HelloJava.java:3: error: ';' expected
```

信息可以拆成四部分：文件名、行号、错误级别和原因。编译器标出的行是它确认无法继续理解的位置，真正遗漏的符号有时在上一行。一次语法错误可能引出多条后续错误，因此先修第一条，再重新编译，不要同时猜测所有报错。

常见编译错误包括：

| 提示线索 | 常见原因 | 首先检查 |
| --- | --- | --- |
| `';' expected` | 语句末尾漏分号 | 报错行及上一行 |
| `cannot find symbol` | 名字拼错、未声明或不可见 | 变量、类、方法的拼写和大小写 |
| `reached end of file while parsing` | 花括号没有配对 | 从最近的方法或类开始数 `{` 与 `}` |
| `incompatible types` | 值的类型不能放入目标位置 | 等号两边、参数和返回值类型 |
| `class ... is public` | 文件名与公开类名不一致 | 文件名和 `public class` 后的名字 |

## 四、使用 java 启动 class

### 4.1 java 命令接收类名

编译成功后，在 class 文件所在的根目录执行：

```bash
java HelloJava
```

此处写类名 `HelloJava`，不写 `HelloJava.java`，也不写 `HelloJava.class`。`java` 是 JVM 启动器，它找到类，加载 class 文件，验证字节码，然后调用标准 `main` 方法。

完整路径可以写成：

```text
HelloJava.java --javac 编译--> HelloJava.class --java 启动--> 控制台输出
```

源文件是输入，class 文件是编译产物，控制台文字是运行结果。把三者分开，排错时就不会把“没有重新编译”误认为“Java 忽略了修改”。

### 4.2 编译期错误与运行期错误属于不同阶段

| 阶段 | 程序状态 | 典型问题 |
| --- | --- | --- |
| 编译期 | 还没有得到可用 class | 漏分号、名字不存在、类型不匹配 |
| 启动期 | class 存在，但 JVM 未成功进入 main | 类名错误、类路径错误、没有标准 main |
| 运行期 | 已经开始执行 main | 除以零、文件不存在、使用空引用 |

后面会系统讲[[异常]]。目前先根据证据定位阶段：`javac` 报错就是编译期；`java` 提示找不到类或 main，多半是启动期；已经看到部分输出后才报错，说明程序已经进入运行期。

### 4.3 命令行参数会进入 args

虽然数组要到第 7 章才完整学习，但可以先观察入口参数。保存：

```java
public class ArgumentDemo {
    public static void main(String[] args) {
        // args[0] 表示命令行传入的第一个文本参数
        System.out.println(args[0]);
    }
}
```

编译后执行：

```bash
java ArgumentDemo Java17
```

控制台输出 `Java17`。如果没有提供参数，程序会在运行期报错，因为它试图读取不存在的第一个元素。这个例子只用于说明参数去向，数组索引和边界会在第 7 章解释。

## 五、包名、目录和完整类名

### 5.1 包用于组织和区分同名类

真实项目会有很多类。[[包]]为类提供分组和命名空间。例如两个模块都可以有 `User` 类，只要完整名称分别是 `com.example.account.User` 和 `com.example.order.User`。

包声明位于源文件有效代码的最前面：

```java
package com.example.hello;

public class HelloJava {
    public static void main(String[] args) {
        System.out.println("Hello from package"); // 控制台输出：Hello from package
    }
}
```

常见包名全小写，并采用域名反写作为开头，例如组织拥有 `example.com`，可以使用 `com.example`。这是一种减少命名冲突的惯例，不要求真的联网访问该域名。

### 5.2 目录结构要与包结构对应

若包名是 `com.example.hello`，源文件按层级放置：

```text
project-root/
└── com/
    └── example/
        └── hello/
            └── HelloJava.java
```

在 `project-root` 目录执行：

```bash
javac com/example/hello/HelloJava.java
java com.example.hello.HelloJava
```

编译命令使用文件路径，所以目录间是 `/`；运行命令使用完整类名，所以包之间是 `.`。Windows PowerShell 通常也接受命令参数中的 `/`，使用 `\` 路径分隔符也可以。关键不是斜杠形式，而是当前目录必须是包结构的根。

### 5.3 类路径决定 JVM 去哪里找类

[[类路径]]（classpath）是一组供编译器或 JVM 查找 class 的位置。运行上面的程序时，默认类路径通常包含当前目录 `.`，因此 JVM 从当前目录开始寻找 `com/example/hello/HelloJava.class`。

如果你进入 `com/example/hello` 再执行 `java HelloJava`，class 文件虽然就在眼前，仍可能失败：class 内部声明的完整名称是 `com.example.hello.HelloJava`，JVM 需要从包根开始查找。回到 `project-root`，使用完整类名即可。

可以显式指定类路径：

```bash
java -cp . com.example.hello.HelloJava
```

`-cp .` 表示把当前目录作为类路径。后面 Maven 引入第三方依赖时，构建工具会组合更长的类路径；本章只需建立“类路径是查找起点，不是源文件路径”的模型。

## 六、源代码中还可以出现 import

### 6.1 import 缩短其他包中类的写法

代码使用另一个包中的类时，可以写完整类名，也可以先导入。下面只观察 `import` 在文件中的位置，不使用尚未学习的集合 API：

```java
package com.example.hello;

import java.util.ArrayList;

public class ImportDemo {
    public static void main(String[] args) {
        System.out.println("import 位于包声明与类声明之间");
        // 控制台输出：import 位于包声明与类声明之间
    }
}
```

一个源文件通常按“包声明、import、类声明”的顺序排列。示例中的导入暂未使用，编译器允许这种写法，IDE 通常会将它显示为可删除。`import` 不会把另一份源代码复制进当前文件，也不会安装依赖；它主要让编译器知道短类名对应哪个完整类名。第 13 章学习 `ArrayList` 后再实际使用它。

### 6.2 java.lang 中的常用类无需显式导入

`String`、`System` 等类位于 `java.lang` 包。Java 会自动导入这个包，因此最小程序没有写 `import java.lang.String;`。`java.util`、`java.time` 等其他包不会自动导入，需要显式 `import` 或使用完整类名。

若两个包里存在同名类，不能同时用一个短名消除歧义。通常导入其中一个，另一个在使用处写完整类名。IDE 的自动导入很方便，但仍要看清它导入的是哪个类。

## 七、IDE、Maven与命令行属于同一条链路

### 7.1 IDE 的运行按钮没有改变 Java 的基本过程

IntelliJ IDEA 会替你选择 JDK、编译源文件、设置类路径并启动 JVM。运行窗口出现的长命令可能包含很多参数，但核心仍是：源代码被编译为 class，JVM 找到入口类并运行。

当“IDE 能运行、终端不能运行”时，按以下顺序比对：

1. 终端与 IDE 使用的 JDK 是否都是 17。
2. 终端当前目录是否是正确的包根或项目根。
3. 运行配置选择的入口类是否正确。
4. IDE 是否使用了尚未保存到磁盘的修改。
5. Maven 或 IDE 是否额外加入了终端命令缺少的依赖类路径。

### 7.2 Maven采用约定目录并批量完成构建

第 2 章建立的 Maven 项目通常使用：

```text
project-root/
├── pom.xml
└── src/
    ├── main/java/com/example/App.java
    └── test/java/com/example/AppTest.java
```

`src/main/java` 是主程序源代码根目录，不是包名的一部分。若 `App.java` 声明 `package com.example;`，它放在 `src/main/java/com/example/App.java`。Maven 编译后，class 通常进入 `target/classes/com/example/App.class`。

执行：

```bash
mvn compile
```

Maven 会读取 `pom.xml`，选择编译插件和 JDK 配置，寻找标准源代码目录，再调用编译器。它替代的是重复命令，不替代本章的结构规则。

## 八、从错误信息建立固定排查顺序

### 8.1 找不到源文件

若 `javac` 提示 `file not found`，先执行 `pwd`（macOS）或 `Get-Location`（PowerShell）确认当前目录，再列出文件。检查扩展名是否真的为 `.java`；Windows 若隐藏已知扩展名，文件可能实际叫 `HelloJava.java.txt`。

### 8.2 找不到或无法加载主类

`Could not find or load main class` 常见原因有：

- 运行参数写成了文件名而不是类名。
- 当前目录不是 classpath 根。
- 包名写在代码中，运行时却只写了短类名。
- 编译产物不存在或仍是旧版本。
- `-cp` 指向了错误目录。

把完整类名转换成目录路径进行核对：`com.example.App` 应能从类路径根下找到 `com/example/App.class`。

### 8.3 找不到 main 方法

class 已经找到但入口不匹配时，检查方法是否准确写为 `public static void main(String[] args)`。类中可以有其他同名方法，但 JVM 启动器寻找的是这一种签名。

### 8.4 UnsupportedClassVersionError

这个错误通常表示“编译 class 的 JDK 比运行它的 Java 新”。例如用 JDK 21 编译，再用 Java 17 运行。分别执行 `javac -version` 和 `java -version`，让两者都回到课程主线 JDK 17。Maven 项目还要检查 `mvn -version` 显示的 Java home。

## 九、完整练习：从空目录到带包程序

### 9.1 第一轮：运行无包程序

1. 新建目录 `chapter-03`。
2. 创建 `Welcome.java`，声明 `public class Welcome`。
3. 在 `main` 中输出姓名和学习目标，并在输出语句旁写预期结果注释。
4. 执行 `javac Welcome.java`，确认生成 `Welcome.class`。
5. 执行 `java Welcome`，核对实际输出。

参考实现：

```java
public class Welcome {
    public static void main(String[] args) {
        System.out.println("姓名：小林"); // 控制台输出：姓名：小林
        System.out.println("目标：读懂 Java 程序结构"); // 控制台输出：目标：读懂 Java 程序结构
    }
}
```

### 9.2 第二轮：主动制造编译错误

依次尝试并记录第一条错误：

1. 删除第一条输出语句末尾的分号。
2. 把 `String` 改为 `string`。
3. 删除类末尾的右花括号。
4. 把文件改名为 `welcome.java`。

每次只制造一个错误，修复并确认重新编译成功后再做下一项。练习目标不是背错误文本，而是学会从“阶段、文件、行号、原因”四个信息定位。

### 9.3 第三轮：加入包名

建立 `com/example/lesson` 目录，把文件移动进去并添加：

```java
package com.example.lesson;
```

回到 `chapter-03` 根目录，编译并运行完整类名。完成后用自己的话解释：为什么编译命令中是路径，运行命令中是点号分隔的类名。

完成标准：能指出 `.java`、`.class`、`javac`、`java`、JVM、包和类路径各自处于哪一步；遇到错误时先判断发生在编译、启动还是运行阶段。

## 十、常见误区

### 10.1 把 java 与 javac 当成同一个命令

`javac` 是编译器，接收源文件；`java` 是启动器，接收类名。标准两步是 `javac Welcome.java` 和 `java Welcome`。

### 10.2 修改源代码后直接运行旧 class

JVM 执行 class，不会自动读取刚修改的 `.java`。命令行操作要重新编译；IDE 中也要确认文件已经保存并成功构建。

### 10.3 只看到 class 文件就在当前目录

包声明决定类的完整名字，classpath 决定查找根。不能脱离包名只凭“文件就在眼前”判断运行命令。

### 10.4 一次修改多条错误

后续错误可能由第一处语法问题连锁产生。固定做法是修复第一条、重新编译、再看新的第一条。

### 10.5 依赖 IDE 自动导入却不看完整类名

不同包可能有同名类。接受 IDE 建议前查看包名；遇到类型不匹配时也先检查导入是否正确。

## 十一、本章小结

Java 程序从 `.java` 源文件开始。`javac` 检查语法和类型并生成 `.class` 字节码，`java` 启动 JVM、按类路径查找完整类名并调用标准 `main` 方法。公开类名与文件名对应，包名与目录结构对应，运行命令从 classpath 根使用点号形式的完整类名。

IDE 和 Maven把这些步骤自动化，却没有改变源码、编译产物、类路径和入口之间的关系。排错时先判断编译期、启动期还是运行期，再读第一条有效错误和当前目录证据。

## 十二、快速自测

1. `.java` 与 `.class` 分别保存什么？
2. `javac HelloJava.java` 成功时怎样确认结果？
3. 为什么运行时写 `java HelloJava`，而不是 `java HelloJava.class`？
4. `package com.example;` 会怎样影响目录和运行命令？
5. 修改源文件后仍看到旧输出，最先检查什么？
6. `Could not find or load main class` 属于编译期还是启动期？
7. `import` 是安装依赖吗？
8. class 由 JDK 21 编译、由 Java 17 运行时可能出现什么问题？

参考答案：源文件保存人编写的代码，class 保存 JVM 字节码；确认没有编译错误并出现对应 class；启动器接收类名；文件位于 `com/example` 下并用 `com.example.类名` 运行；重新保存和编译；属于启动期；不是，它主要解析短类名；可能出现 `UnsupportedClassVersionError`，应统一编译与运行 JDK。

## 参考文献

- OpenJDK. [Getting Started with Java](https://dev.java/learn/getting-started/).
- Oracle. [The javac Command](https://docs.oracle.com/en/java/javase/17/docs/specs/man/javac.html).
- Oracle. [The java Command](https://docs.oracle.com/en/java/javase/17/docs/specs/man/java.html).
- Oracle. [Java SE 17 Language Specification：Packages and Modules](https://docs.oracle.com/javase/specs/jls/se17/html/jls-7.html).
- Oracle. [Java Virtual Machine Specification：The class File Format](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-4.html).
