# 第 16 章　文件、编码、日期时间与 JDK 版本差异

> 学习提示：文件操作先明确路径和编码；时间操作先明确它表示日期、当地时间还是全球唯一时间点。
> 一句话总结：Path/Files 提供清楚的文件 API，UTF-8 应显式指定；java.time 区分日期、当地时间和时间点，JDK 17 是主线，后续版本能力需要标注最低版本。

## 用 Path 表示文件位置

[[Path]]表示文件或目录的位置，不等于文件内容：

```java
Path path = Path.of("notes.txt");
```

相对路径以当前工作目录为起点；绝对路径从磁盘根目录开始。课程示例优先使用相对路径，避免把个人电脑路径写进代码。调试文件找不到时，可先输出：

```java
System.out.println(path.toAbsolutePath());
```

这样能看见程序实际在什么目录中查找文件。

## 用 Files 读写小文本

[[Files]]提供常用静态方法。读写 UTF-8 文本时显式指定编码：

```java
Path path = Path.of("notes.txt");
String content = Files.readString(path, StandardCharsets.UTF_8);

Files.writeString(path, "第一行\n", StandardCharsets.UTF_8);
```

`readString` 适合小文件；它会把完整内容读入内存。非常大的文件应逐行或流式处理，避免一次占用大量内存。

写入前可判断文件是否存在：

```java
if (Files.exists(path)) {
    System.out.println("文件已存在");
}
```

文件操作可能抛出 `IOException`。根据第 11 章的规则，当前方法要么捕获并处理，要么在声明中使用 `throws IOException` 交给调用方。

## 编码必须明确

文本文件存的是字节，编码规定字节如何解释为字符。若写入使用一种编码、读取使用另一种编码，中文和特殊字符可能变成乱码。

```java
Files.writeString(path, "你好", StandardCharsets.UTF_8);
String text = Files.readString(path, StandardCharsets.UTF_8);
```

不要依赖“默认编码”。默认值会随操作系统、容器和启动参数改变；接口、文件和数据库边界应写清 UTF-8 或协议规定的编码。

## 资源流何时关闭

需要逐行读取时可用 try-with-resources：

```java
try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
    long count = lines.filter(line -> !line.isBlank()).count();
    System.out.println(count);
}
```

`Files.lines` 返回的 Stream 持有文件资源，必须关闭。try-with-resources 在代码块结束时自动关闭它。第 14 章的 Stream 在此用于过滤行；本例中不能在 try 块外继续使用 `lines`。

## 日期、当地时间与时间点

Java 8 以后推荐 `java.time` API。选择类型前先问数据表达什么：

| 类型 | 表示什么 | 例子 |
| --- | --- | --- |
| [[LocalDate]] | 没有时间和时区的日期 | 生日、账单日期 |
| [[LocalDateTime]] | 某地日历上的日期和时间，但没有时区 | 预约表单输入的“2026-07-13 09:00” |
| [[Instant]] | 时间线上的唯一时刻 | 日志事件、数据库创建时间 |
| [[ZoneId]] | 时区规则 | `Asia/Shanghai` |

创建日期：

```java
LocalDate birthday = LocalDate.of(2000, 1, 1);
LocalDate today = LocalDate.now();
```

将当地时间和时区转换为唯一时间点：

```java
LocalDateTime local = LocalDateTime.of(2026, 7, 13, 9, 0);
Instant instant = local.atZone(ZoneId.of("Asia/Shanghai")).toInstant();
```

`LocalDateTime` 本身不能表示全球唯一时刻：同样的“9 点”在上海和伦敦对应不同 Instant。跨系统存储、日志排序和接口传输通常更适合 Instant 或带 offset 的时间表示。

## 解析与格式化时间

标准 ISO 格式可直接解析：

```java
LocalDate date = LocalDate.parse("2026-07-13");
```

自定义格式使用 `DateTimeFormatter`：

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
LocalDate date = LocalDate.parse("2026/07/13", formatter);
```

格式不匹配会抛出 `DateTimeParseException`。不要在不同接口中随意使用“看起来像日期”的字符串；先确定格式、时区和谁负责转换。

## JDK 17 与后续版本怎样阅读

本课程全部可运行主线使用 JDK 17，不启用 preview feature。JDK 17 已包含 record、sealed class、`instanceof` 模式匹配等稳定能力。

阅读其他项目时可能看到更高版本语法：

| 能力 | JDK 17 主线状态 | 阅读后续项目时的处理 |
| --- | --- | --- |
| record、sealed class | 可用 | 本课程已在第 9、10 章介绍 |
| switch 模式匹配、record pattern | 不作为 JDK 17 主线 | 先确认项目 JDK，不能直接复制到 17 工程 |
| 虚拟线程 | JDK 21 稳定 | 第 34 章作为版本旁路讨论 |

遇到新语法的第一步不是尝试“让它编译”，而是查看项目的 JDK 版本和构建配置。版本边界是 Java 后端协作中的正常信息，不是语法能力高低的判断。

## 练习：读取活动日期

创建 UTF-8 文件 `events.txt`，每行写一个 `yyyy-MM-dd` 日期。读取后跳过空行，解析为 LocalDate，输出距离今天的天数。若某行格式错误，输出行内容并继续处理其他行。

完成标准：显式使用 UTF-8；文件资源能关闭；能说明 LocalDate 与 Instant 为什么不互换；错误行不会终止全部处理。

## 常见误区

### 依赖默认编码

本机没有乱码不代表部署环境也正确。读写文本时明确使用 UTF-8。

### 把 LocalDateTime 当成时间点

没有时区的当地时间无法唯一定位到全球时间线。跨系统数据需要补充时区或转换为 Instant。

### 看到新 Java 语法就复制

代码能否编译取决于项目 JDK 和构建设置。课程主线是 17，后续版本能力必须单独确认。

## 本章小结

Path 描述位置，Files 读写内容，编码应明确为 UTF-8；java.time 用不同类型区分日期、当地时间和时间点。至此，Java 语言及标准库基础模块完成，下一章开始从 HTTP 请求与响应进入 Web 后端。

## 快速自测

1. 为什么 `Files.lines` 要放进 try-with-resources？
2. LocalDateTime 为什么不能独立表示全球唯一时刻？
3. 为什么不能把 JDK 21 的新语法直接复制到 JDK 17 项目？

参考答案：它持有文件资源，需要关闭；缺少时区；编译器和构建配置的语言版本不同。

## 参考文献

- Oracle. [Java SE 17 API: Files](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Files.html).
- Oracle. [Java SE 17 API: java.time](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/package-summary.html).
- OpenJDK. [JEP Index](https://openjdk.org/jeps/0).
