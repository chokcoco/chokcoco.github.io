# 第 11 章　Java 异常与异常边界

> 学习提示：先读异常类型、消息和第一处业务代码行号；不要一看到堆栈就从最后一行开始猜。
> 一句话总结：异常表示正常流程无法继续的失败信息；通过抛出、传播、捕获和保留原因链，程序可以在合适的边界处理失败而不吞掉线索。

## 异常不是编译错误

编译错误发生在程序启动前，例如漏分号、类型不匹配。[[异常]]发生在程序已经运行时，例如文本无法解析、文件不存在、对象为 `null`。

```java
int number = Integer.parseInt("abc");
```

这行能编译，但运行时会抛出 `NumberFormatException`。程序输出的[[堆栈]]会包含异常类型、消息、调用路径和文件行号。阅读时优先寻找第一条指向自己代码的 `文件.java:行号`，它通常是实际操作失败的位置。

## 捕获能在当前位置处理的失败

`try` 包住可能失败的语句，`catch` 接收对应异常：

```java
String input = "abc";

try {
    int number = Integer.parseInt(input);
    System.out.println(number);
} catch (NumberFormatException exception) {
    System.out.println("请输入整数：" + input);
}
```

捕获不等于忽略。catch 中应给出当前边界能做的处理，例如提示用户、选择默认值、记录失败或把异常转换为更合适的业务异常。空的 catch 块会让程序看似继续运行，却丢掉失败原因。

`finally` 中的代码无论 try 成功或失败都会执行，常用于旧式资源清理。现代 Java 更常使用后文的 try-with-resources。

## throw 与 throws 表达责任

方法发现调用方传入非法值时，可以主动 `throw`：

```java
static int divide(int left, int right) {
    if (right == 0) {
        throw new IllegalArgumentException("除数不能为 0");
    }
    return left / right;
}
```

`throw` 真正创建并抛出异常对象。`throws` 写在方法声明中，表示方法可能把某种受检异常交给调用方处理：

```java
static String readText(Path path) throws IOException {
    return Files.readString(path);
}
```

[[受检异常]]要求调用方捕获或继续声明；`IllegalArgumentException`、`NullPointerException` 这类运行时异常不要求声明。初学阶段不必把所有异常都背成分类表，关键是区分：调用方是否有合理恢复动作；没有时，让异常保留到更合适的边界。

## 保留原始原因

底层失败有时需要转换成业务能理解的异常，但不能丢掉原始信息：

```java
try {
    return Files.readString(path);
} catch (IOException exception) {
    throw new IllegalStateException("读取配置失败：" + path, exception);
}
```

第二个参数 `exception` 是[[cause]]。之后查看堆栈时，既能知道“读取配置失败”，也能看到最初的 I/O 原因。只抛 `new IllegalStateException("失败")` 会让排查线索消失。

## 资源必须关闭

文件、网络连接等资源用完后需要释放。try-with-resources 会在代码块结束时自动关闭实现 `AutoCloseable` 的资源：

```java
try (BufferedReader reader = Files.newBufferedReader(path)) {
    return reader.readLine();
}
```

即使读取过程中抛异常，reader 也会关闭。第 16 章会完整练习 Files、编码和文件路径；现在先形成“资源创建后要有关闭边界”的意识。

## 在什么地方捕获

不要在每一行都 catch，也不要一层层捕获同一个异常。一个实用原则是：在能决定怎样恢复或怎样呈现失败的边界处理它。

- 纯 Java 输入工具可以捕获并让用户重新输入。
- 底层方法可补充上下文后继续抛出。
- Web API 会在第 21 章由全局异常处理器转换成 HTTP 错误响应。

这叫[[异常边界]]。异常从深层代码向上传播不是错误；没有信息的吞掉才是问题。

## 练习：解析一组数量

给定 `String[] inputs = {"3", "", "abc", "5"};`，逐个解析整数。空文本和非整数都输出清楚提示，其他值累计总和。不要用 catch 捕获 `Exception`；只捕获 `NumberFormatException`。

完成标准：能解释异常在哪一行产生、在哪一层处理；不会因一个非法文本终止整个循环；不丢弃异常类型。

## 常见误区

### 捕获 `Exception` 后什么也不做

这会覆盖大量无关失败并丢掉原因。优先捕获最具体、当前确实能处理的类型。

### 用异常代替普通分支

输入是否为空、状态是否允许等可预测情况通常先用 if 判断。异常适合表示无法按正常规则继续的失败。

### 重新抛出异常却不传 cause

转换异常时传入原始异常，才能保留完整调用链。

## 本章小结

异常携带失败类型和上下文。读堆栈、捕获可恢复失败、用 `throw` 表达非法状态、用 cause 保留根因、用 try-with-resources 关闭资源，是 Java 程序可靠处理失败的基础。

## 快速自测

1. 编译错误和异常分别发生在什么时候？
2. `throw` 与 `throws` 的区别是什么？
3. 为什么不应写空 catch 块？

参考答案：编译错误发生在程序运行前，异常发生在运行中；throw 抛出对象，throws 声明可能传播的受检异常；空 catch 丢掉失败线索。

## 参考文献

- Oracle. [Java SE 17 API: Throwable](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Throwable.html).
- Oracle. [Java SE 17 API: AutoCloseable](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/AutoCloseable.html).
