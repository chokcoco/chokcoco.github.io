# 第 16 章　文件、编码、日期时间与 JDK 版本差异

> 学习提示：文件操作先明确路径和编码；时间操作先明确它要表示日期、当地时间还是全球唯一时间点；遇到未见过的新语法先检查项目 JDK 版本。
> 一句话总结：Path/Files 提供跨平台文件操作，UTF-8 应显式指定；java.time 用不同类区分日历、本地时间和时间戳；JDK 17 是课程主线，后续版本差异需要版本标注。

## 一、用 Path 表示文件位置

[[Path]] 是 Java 7 引入的文件路径抽象。它表示文件或目录的位置，不代表文件是否存在或可打开：

```java
Path dataPath = Path.of("data.txt");
Path configDir = Path.of("config", "dev");    // config/dev
Path absolutePath = Path.of("/home/user/data.txt");
```

路径的表示与操作系统有关：

- macOS / Linux：`Path.of("config", "dev")` → `config/dev`（正斜杠 `/`）
- Windows：`Path.of("config", "dev")` → `config\dev`（反斜杠 `\`）

`Path.of` 在 Windows 和 Unix 路径风格下都能工作，因为它是操作系统感知的。

相对路径以当前工作目录为起点。调试文件找不到时，先打印绝对路径确认程序实际在哪个目录查找：

```java
Path path = Path.of("data.txt");
System.out.println(path.toAbsolutePath()); // /Users/me/project/data.txt
```

```java
// 常用 Path 方法
Path file = Path.of("docs", "readme.txt");
System.out.println(file.getFileName());   // readme.txt
System.out.println(file.getParent());       // docs
System.out.println(file.getRoot());         // null（相对路径没有根）
System.out.println(Files.exists(file));     // false（文件不一定存在）
System.out.println(Files.isRegularFile(file)); // false
```

`Path` 比字符串拼接路径更安全，因为它自动处理分隔符差异和路径规范化。

## 二、用 Files 读写文件

[[Files]] 类提供常用的静态文件操作。读写小文本文件时最常用两个方法：

```java
Path path = Path.of("notes.txt");

// 写入文件（覆盖模式）
Files.writeString(path, "第一行内容\n第二行内容", StandardCharsets.UTF_8);

// 读取整个文件
String content = Files.readString(path, StandardCharsets.UTF_8);
System.out.println(content);
```

### 2.1 写入说明

`writeString` 默认覆盖文件。若需要追加内容，使用 `StandardOpenOption.APPEND`：

```java
Files.writeString(path, "追加的行\n", StandardCharsets.UTF_8,
    StandardOpenOption.APPEND);
```

### 2.2 文件存在性检查

```java
if (Files.exists(path)) {
    System.out.println("文件已存在，大小：" + Files.size(path) + " 字节");
}
```

除了 `exists`，还有 `Files.isRegularFile()`（判断是否为普通文件，而不是目录或特殊文件）和 `Files.isDirectory()`。

### 2.3 复制、移动与删除

```java
Path source = Path.of("source.txt");
Path target = Path.of("backup/source.txt");

// 复制文件（若目标存在则覆盖）
Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);

// 移动/重命名
Files.move(source, Path.of("renamed.txt"), StandardCopyOption.REPLACE_EXISTING);

// 删除文件
Files.delete(source);                    // 不存在时抛 NoSuchFileException
boolean deleted = Files.deleteIfExists(source); // 返回 boolean
```

`Files.list` 列出目录内容（返回 Stream，需要关闭）：

```java
try (Stream<Path> entries = Files.list(Path.of("config"))) {
    entries.forEach(System.out::println);
}
```

### 2.4 I/O 异常

文件操作的几乎所有方法都可能抛出 `IOException`：

```java
try {
    String content = Files.readString(Path.of("missing.txt"));
} catch (IOException e) {
    System.out.println("读取失败：" + e.getMessage());
}
```

根据第 11 章的异常边界原则，如果当前方法能处理异常则在当前方法 try-catch，不能处理则 `throws IOException` 交给调用方。

## 三、编码必须明确

### 3.1 编码是什么

文本文件存储的是字节序列。[[编码]]（encoding）规定字节如何解释为字符。最简单的编码如 ASCII 用 7 位表示英文和数字，但只能覆盖 128 个字符。[[UTF-8]] 是 Unicode 的一种可变长度编码，兼容 ASCII，且能表示几乎所有语言的字符。

```java
// 写入 UTF-8
Path path = Path.of("message.txt");
Files.writeString(path, "你好，世界", StandardCharsets.UTF_8);

// 用相同编码读取，得到原文
String correct = Files.readString(path, StandardCharsets.UTF_8);
System.out.println(correct); // 你好，世界

// 用不同编码读取，得到乱码
String wrong = Files.readString(path, StandardCharsets.ISO_8859_1);
System.out.println(wrong); // ÄãºÃ£¬ÊÀ½ç（乱码）
```

### 3.2 不依赖"默认编码"

`Files.readString(path)` 不带编码参数时使用系统默认编码。在不同操作系统、不同容器或不同 JVM 配置下，默认编码可能不同。一个在 macOS 上写入的文件在 Linux 容器下读取时，中文字符可能变成乱码。

```java
// 不要依赖默认编码
// String content = Files.readString(path);         // 使用默认编码
String content = Files.readString(path, StandardCharsets.UTF_8); // 明确指定

// 写入时也一样
Files.writeString(path, "内容", StandardCharsets.UTF_8);
```

`StandardCharsets.UTF_8`、`UTF_16`、`ISO_8859_1` 等定义在 `java.nio.charset.StandardCharsets` 类中。使用这些常量而非字符串 `"UTF-8"`，可以避免处理 `UnsupportedCharsetException`。

## 四、资源流管理

### 4.1 Files.lines 逐行读取

需要逐行处理文本（而非一次性读入内存）时，使用 `Files.lines`：

```java
Path path = Path.of("data.txt");
try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
    long count = lines.filter(line -> !line.isBlank()).count();
    System.out.println("非空行数：" + count);
} // try-with-resources 自动关闭文件
```

`Files.lines` 返回的 Stream 持有文件句柄，必须在 try-with-resources 块中使用，确保 Stream 和文件资源在结束时被关闭。try-with-resources（第 11 章）在代码块结束时自动调用 `close()`。

### 4.2 一次性读取 vs 逐行读取

```java
// 小文件：Files.readString 把整个文件读入内存
// 适用于配置文件、小文本等
String content = Files.readString(path, StandardCharsets.UTF_8);

// 大文件：Files.lines 逐行（或按批 buffer）处理
// 适用于日志文件、CSV 等 GB 级文本
try (Stream<String> lines = Files.lines(path, StandardCharsets.UTF_8)) {
    lines.filter(line -> line.contains("ERROR"))
         .limit(100) // 只取前 100 行
         .forEach(System.out::println);
}
```

文件大于几十 MB 时优先使用 `Files.lines`，避免一次性占用过多堆内存。

### 4.3 BufferedReader

如果要更精细地控制读取过程，使用 `Files.newBufferedReader`：

```java
try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
    String line;
    while ((line = reader.readLine()) != null) {
        if (line.isBlank()) continue;
        System.out.println(line);
    }
}
```

`BufferedReader` 的 `readLine()` 不包含换行符，返回 `null` 表示读完。它的优点是可控（随时可以 break），缺点是需要手动管理读取循环。

## 五、java.time 日期时间 API

Java 8 之前，日期时间操作主要依赖 `java.util.Date` 和 `java.util.Calendar`。这两个 API 存在多年但仍然不好用：月份从 0 开始、Date 既表示日期又表示时间、线程不安全等。Java 8 引入了 `java.time` 包，彻底改善了日期时间处理。

### 5.1 类型选择

选择日期时间类型之前，先问数据要表达什么：

| 类型 | 表示内容 | 是否含时区 | 典型使用场景 |
| --- | --- | --- | --- |
| [[LocalDate]] | 年-月-日 | 否 | 生日、账单日期、排班表 |
| [[LocalTime]] | 时-分-秒-纳秒 | 否 | 营业时间、上课时间 |
| [[LocalDateTime]] | 年-月-日 时-分-秒 | 否 | 表单输入的本地日期时间 |
| [[ZonedDateTime]] | 日历日期 + 时间 + 时区规则 | 是 | 跨时区会议时间 |
| [[OffsetDateTime]] | 日历日期 + 时间 + UTC 偏移 | 部分 | API 响应、数据库时间戳 |
| [[Instant]] | 时间线上的唯一时刻 | UTC | 日志时间戳、事件排序 |

### 5.2 创建与操作

```java
// LocalDate：日期
LocalDate today = LocalDate.now();
LocalDate birthday = LocalDate.of(2000, 1, 1);

System.out.println(birthday.getYear());   // 2000
System.out.println(birthday.getMonth());  // JANUARY
System.out.println(birthday.getDayOfMonth()); // 1

// 日期计算，返回新的 LocalDate 实例
LocalDate weekLater = today.plusDays(7);
LocalDate nextMonth = today.plusMonths(1);
LocalDate lastYear = today.minusYears(1);

// LocalTime：时间
LocalTime now = LocalTime.now();
LocalTime classStart = LocalTime.of(9, 0);
System.out.println(classStart.isAfter(now)); // true/false

// LocalDateTime：日期 + 时间
LocalDateTime meeting = LocalDateTime.of(2026, 7, 15, 14, 30);
```

所有 `java.time` 类型都是不可变的。`plusDays`、`minusMonths` 等操作返回新实例，原始对象不变。

### 5.3 时间点与唯一时刻

[[Instant]] 表示时间线上的唯一时刻，以 Unix 纪元（1970-01-01T00:00:00Z）为起点：

```java
Instant now = Instant.now();
System.out.println(now); // 2026-07-14T08:00:00Z（UTC 时间）
```

[[LocalDateTime]] 本身不能表示全球唯一时刻——同样的"9:00"在上海和伦敦对应不同的瞬间。跨系统存储、日志排序、API 传输优先使用 Instant 或带时区的类型。

```java
// LocalDateTime 转 Instant（附加时区）
LocalDateTime localTime = LocalDateTime.of(2026, 7, 14, 9, 0);
ZoneId shanghai = ZoneId.of("Asia/Shanghai");
Instant shanghaiInstant = localTime.atZone(shanghai).toInstant();

ZoneId london = ZoneId.of("Europe/London");
Instant londonInstant = localTime.atZone(london).toInstant();

// 两个 Instant 不相等，因为都是"9点"但上海比伦敦早 7-8 小时
System.out.println(shanghaiInstant.equals(londonInstant)); // false
```

### 5.4 时区与偏移

[[ZoneId]] 表示时区规则（包括夏令时的切换）。常见时区 ID 的格式是 `地区/城市`：

```java
ZoneId zoneId = ZoneId.of("Asia/Shanghai");
System.out.println(zoneId.getRules()); // 包含 UTC 偏移和夏令时规则
```

如果需要知道当前 JVM 的时区：

```java
ZoneId systemZone = ZoneId.systemDefault();
```

### 5.5 Duration 和 Period

[[Duration]] 表示两个时间点之间的"秒-纳秒"差（适用于 Instant、LocalTime）：

```java
Instant start = Instant.now();
// ... 执行某些操作
Instant end = Instant.now();
Duration elapsed = Duration.between(start, end);
System.out.println(elapsed.toMillis() + " ms");
```

[[Period]] 表示两个日期之间的"年-月-日"差（适用于 LocalDate）：

```java
LocalDate birthday = LocalDate.of(2000, 1, 1);
LocalDate today = LocalDate.now();
Period age = Period.between(birthday, today);
System.out.println(age.getYears() + " 年 " + age.getMonths() + " 月 " + age.getDays() + " 天");
```

## 六、解析与格式化

### 6.1 ISO 标准格式解析

`java.time` 类型默认支持 ISO 8601 格式的解析和输出：

```java
LocalDate date = LocalDate.parse("2026-07-14");
System.out.println(date); // 2026-07-14

LocalTime time = LocalTime.parse("14:30:00");
System.out.println(time); // 14:30

Instant instant = Instant.parse("2026-07-14T08:00:00Z");
System.out.println(instant); // 2026-07-14T08:00:00Z
```

### 6.2 自定义格式化

使用 [[DateTimeFormatter]] 表示自定义格式：

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
LocalDate date = LocalDate.parse("2026/07/14", formatter);
System.out.println(date.format(formatter)); // 2026/07/14
```

常用格式模式：

| 模式 | 含义 | 示例 |
| --- | --- | --- |
| `yyyy` | 四位年份 | 2026 |
| `MM` | 两位月份 | 07 |
| `dd` | 两位日期 | 14 |
| `HH` | 24 小时制小时 | 14 |
| `mm` | 分钟 | 30 |
| `ss` | 秒 | 00 |
| `yyyy-MM-dd` | ISO 日期格式 | 2026-07-14 |

格式化不匹配会抛出 [[DateTimeParseException]]：

```java
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy/MM/dd");
// LocalDate.parse("2026-07-14", formatter); // DateTimeParseException
```

### 6.3 推荐的格式策略

跨服务传输时间数据时，使用明确的格式约定：

- **日期**：`yyyy-MM-dd`（如 `2026-07-14`）
- **时间点**：ISO 8601 带时区（如 `2026-07-14T08:00:00Z` 或 `2026-07-14T16:00:00+08:00`）
- **本地时间**：`yyyy-MM-ddTHH:mm:ss`

在同一应用中，不要在多个地方各自定义不同的格式。把格式化/解析逻辑集中在工具方法中。

## 七、JDK 17 与后续版本的差异

### 7.1 版本管理

本课程所有可运行代码使用 JDK 17，不启用 preview feature。JDK 17 是长期支持版本（LTS），企业生产和课程示例都保持此版本。

阅读他人代码或新项目时可能遇到 JDK 21 或更高版本的语法。以下是一些常见差异：

| 能力 | JDK 17 | JDK 21（LTS） | 课程处理方式 |
| --- | --- | --- | --- |
| record、sealed class | 稳定 | 稳定 | 已在第 9、10 章系统讲解 |
| `instanceof` 模式匹配 | 稳定 | 稳定 | 已包含在第 6、10 章 |
| switch 模式匹配 | 无 | 稳定 | 不进入 JDK 17 示例，阅读时了解即可 |
| record pattern | 无 | 稳定 | 不进入 JDK 17 示例 |
| 虚拟线程 | preview | 稳定 | 第 34 章作为版本旁路单独说明 |
| 字符串模板 | 无 | preview (JDK 21) | 不进入课程，关注 String 已有 API |
| 结构化并发 | preview | preview | 超过本课程范围 |

### 7.2 遇到新语法的处理步骤

当你在其他项目或文档中看到不认识的 Java 语法时：

1. 查看项目的 `pom.xml` 或 `build.gradle` 中的 `java.version` / `sourceCompatibility` 配置。
2. 如果项目 JDK 是 21，尝试通过官方 JEP 索引搜索对应语法。
3. 不要直接把高版本独有的语法复制进 JDK 17 项目——编译器会报错。
4. 如果你的开发环境切换到 JDK 21，编译和运行需要更新 IDE 的项目 SDK 配置。

版本差异是 Java 后端协作中的正常信息，每个团队都有各自的项目 JDK 版本共识。知道当前项目用什么版本、什么版本有什么特性即可。

### 7.3 文本块（JDK 15+ 稳定，JDK 17 可用）

文本块用三个双引号 `"""` 包裹多行字符串，JDK 17 已经稳定：

```java
String json = """
    {
        "name": "Java",
        "version": 17
    }
    """;
System.out.println(json);
```

文本块自动去除缩进中的公共前导空白，不需要手动拼接换行符。在配置 JSON、SQL 或模板场景中使用文本块比字符串拼接可读性好很多。

## 八、练习

### 练习 1：安全文件读取

实现 `static Optional<String> readFirstLine(String pathStr)`：

- 使用 `Path.of` 和 `Files.lines`（try-with-resources）
- 文件存在且至少有一行：返回 `Optional.of(firstLine)`
- 文件不存在或为空：返回 `Optional.empty()`
- 其他 I/O 错误：打印堆栈后返回 `Optional.empty()`
- 始终显式指定 UTF-8 编码

完成标准：对不存在的文件不抛异常；对空文件不抛异常；存在时返回第一行。

### 练习 2：活动日期过滤器

创建 `events.txt` 文件，每行一个日期（格式 `yyyy-MM-dd`），例如：

```text
2026-07-10
2026-07-20
not-a-date
```

实现 `static List<LocalDate> readFutureDates(String pathStr, String format)`：

- 读取文件所有行，跳过空行
- 解析为 LocalDate，无法解析的行跳过并输出"无法解析：行内容"
- 筛选出日期在今天之后的行
- 对筛选结果按升序排序
- 返回 List<LocalDate>

完成标准：能处理格式错误的行而不中断全部处理；只返回未来的日期；不重复解析同一行。

### 练习 3：JDK 版本检查

实现一个简单的版本检查方法：

```java
static String describeFeature(String featureName) {
    // 输入 "record" → 返回 "JDK 16 预览，JDK 17 稳定"
    // 输入 "虚拟线程" → 返回 "JDK 21 稳定"
    // 输入 "switch 模式匹配" → 返回 "JDK 21 预览，JDK 21 稳定"
    // 未识别的 feature → 返回 "请在 JEP Index 中搜索"
}
```

完成标准：至少包含第 9 章（record）、第 10 章（sealed class）、第 34 章（虚拟线程）、switch 模式匹配四个条目；使用 Map 存储。

## 常见误区

### 依赖默认编码

```java
// 不推荐
Files.readString(path); // 使用系统默认编码
```

在本机开发时可能永远不会看到乱码，因为默认编码通常是 UTF-8。但部署到使用不同编码的操作系统或容器时，问题会出现。读写文本文件始终使用 `StandardCharsets.UTF_8`。

### 把 LocalDateTime 当成时间点

`LocalDateTime` 没有时区概念。"2026-07-14T09:00:00" 在上海是北京时间上午 9 点，在伦敦是 UTC 时间上午 9 点。这两个是不同时间点，但 `LocalDateTime` 存储的数据相同。跨系统数据传输（特别是日志和 API 中）需要使用 `Instant` 或 `OffsetDateTime` 来无歧义地表示时间点。

### 在循环中频繁调用 Files 方法

```java
// 不推荐：每次循环都访问文件系统
for (String id : ids) {
    if (Files.exists(Path.of(id + ".txt"))) {
        // ...
    }
}
```

文件系统的 I/O 操作比内存操作慢数个数量级。如果需要频繁检查文件存在性，先读取目录列表（`Files.list` 或 `Files.newDirectoryStream`）再在内存中匹配。

### 看到不认识的语法就直接复制

JDK 版本在团队之间不一定一致。一个项目中 JDK 17 编译通过的代码，换到 JDK 21 可能新增一些特性仍然兼容，但反过来不成立。遇到陌生语法首先查看项目 JDK 版本配置。

## 本章小结

Path 描述文件路径并自动处理 OS 分隔符差异；Files 提供读写、复制、移动和删除操作。编码显式指定为 UTF-8 是最安全的做法，避免跨环境乱码。逐行处理大文件使用 `Files.lines` 配合 try-with-resources 确保文件资源自动关闭。java.time 包的 LocalDate、LocalTime、LocalDateTime、Instant、ZonedDateTime 和 Duration/Period 覆盖了日常所有日期时间场景，所有实例不可变。ISO 8601 格式是最好的默认交换格式，自定义格式使用 DateTimeFormatter。JDK 17 是课程主线，record、sealed class、instanceof 模式匹配已稳定可用；JDK 21 的切换模式匹配、虚拟线程等新能力需要最低版本标注。

至此，Java 语言及标准库基础模块（第 3–16 章）全部完成。下一章将从 HTTP 请求与响应开始进入后端开发基础模块。

## 快速自测

1. `Path.of("a", "b")` 在 macOS 和 Windows 上分别产生什么路径字符串？
2. 为什么 `Files.readString(path)` 不带编码参数不推荐？
3. `LocalDateTime` 和 `Instant` 的主要区别是什么？
4. 文本块用几个双引号开头和结尾？

参考答案：macOS 上 `a/b`，Windows 上 `a\b`；它会使用系统默认编码，跨环境可能有编码乱码风险；LocalDateTime 不含时区信息，Instant 是 UTC 时间线上的唯一时刻；三个。

## 参考文献

- Oracle. [Java SE 17 API: Files](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Files.html).
- Oracle. [Java SE 17 API: Path](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/nio/file/Path.html).
- Oracle. [Java SE 17 API: java.time](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/package-summary.html).
- Oracle. [Java SE 17 API: DateTimeFormatter](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/format/DateTimeFormatter.html).
- OpenJDK. [JEP Index](https://openjdk.org/jeps/0).
- Unicode Consortium. [UTF-8 FAQ](https://www.unicode.org/faq/utf_bom.html).
