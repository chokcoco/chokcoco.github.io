# 第 18 章　Spring Boot 请求处理流程

> 学习提示：本章的目标不是理解 Spring Boot 的全部能力，而是启动一个最小的 Java Web 服务，用一个 Controller 响应 GET 请求，并理解请求是如何找到方法的。
> 一句话总结：Spring Boot 通过自动配置降低启动门槛，Spring MVC 把 HTTP 请求映射到 Controller 方法；`@RestController`、`@GetMapping` 和 `@RequestParam`、`@PathVariable` 是最常用的请求处理注解。

第 17 章用 curl 观察了 HTTP 请求和响应。从本章开始，把 HTTP 契约实现为真正运行的 Java Web 服务。

## 一、框架是什么，Spring Boot 做了什么

第 3 章写过一个 `main` 方法，从那里开始，程序按你写的顺序逐行执行。Web 服务的执行顺序不同：它启动后不停等待请求，请求到达时才调用你写的方法。

这个过程需要处理网络连接、解析 HTTP 协议、把 URL 路径和方法匹配到对应代码、处理请求体、返回响应。如果所有这些都从零手写，需要大量并不直接贡献业务逻辑的代码。[[框架]]就是把这些通用任务封装起来，让你只写业务相关的代码。

[[Spring Boot]] 是 Java 生态中使用最广的 Web 应用框架之一。它帮你完成三件主要事情：

1. 启动一个内嵌 HTTP 服务器（默认 Tomcat），程序启动后持续监听请求。
2. 把请求解析后匹配到你写的 Controller 方法，并传入参数。
3. 把你方法的返回值转换成 HTTP 响应，发回客户端。

Spring Boot 不需要你写 XML 配置或手动管理服务器。它通过[[自动配置]]在类路径上检测到 Web 依赖后，自动准备好 HTTP 服务器和相关组件。

## 二、创建第一个可运行的项目

### 2.1 最小依赖

Spring Boot 项目的入口是 Maven `pom.xml`（第 2 章已经学会用 Maven 编译运行）。这里不要求你理解 POM 的每一行——只保留 Web 启动所需的最小依赖：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>

    <groupId>studio.aicourse</groupId>
    <artifactId>java-web-preview</artifactId>
    <version>0.1.0</version>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>
</project>
```

三个关键信息：

- `spring-boot-starter-parent` 锁定了一整套兼容的依赖版本，你不需要手动指定 Spring MVC、Jackson、Tomcat 各自用什么版本。
- `spring-boot-starter-web` 引入了 Web 开发需要的全部依赖：Spring MVC（处理请求）、嵌入式 Tomcat（HTTP 服务器）、Jackson（JSON 序列化）。
- `java.version` 设为 17，对应本课程的 JDK 版本。

[[Starter]]是 Spring Boot 的组合依赖模块，`spring-boot-starter-web` 这一个 starter 就替你声明了多个常用组件。不用逐个查找和声明。

### 2.2 应用入口类

```java
package studio.aicourse.javaweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PreviewApplication {

    public static void main(String[] args) {
        SpringApplication.run(PreviewApplication.class, args);
    }
}
```

`main` 方法中的 `SpringApplication.run` 做了几件事：

1. 读取类路径上的依赖，根据检测到的组件做出配置决策（比如发现了 `spring-boot-starter-web`，就启动 Tomcat，监听 8080 端口）。
2. 扫描 `PreviewApplication` 包及其子包，找到所有被 Spring 管理的组件。
3. 启动嵌入式服务器，让服务持续运行。

此时运行 `main` 方法，控制台会输出类似 `Tomcat started on port 8080` 的信息。这是验证环境正确的第一步。程序不会打印业务内容——它还没接收请求，也没有返回响应的方法。

### 2.3 Bean 与依赖注入初识

Spring 管理的对象叫[[Bean]]。你不通过 `new ControllerClassName()` 创建 Controller，而是把类交给 Spring 管理，Spring 负责创建实例并在需要时注入。

[[依赖注入]]（Dependency Injection）的意思是：当一个对象需要另一个对象时，不在自己内部 `new`，而是声明依赖，由外部（Spring 容器）传入。这就像一个班上需要粉笔的老师不用自己跑到仓库拿，而是有人按课表把粉笔送到教室。

```java
@RestController
public class StatusController {

    // 不在这里 new；Spring 会注入已经创建的实例
    private final SystemInfo systemInfo;

    public StatusController(SystemInfo systemInfo) {
        this.systemInfo = systemInfo;
    }
}
```

构造器注入是最推荐的依赖注入方式：它不需要额外注解，注入的依赖在对象创建时就确定，且可以声明为 `final`。

## 三、第一个 Controller

[[Controller]]是 Spring MVC 中直接接收 HTTP 请求并返回响应的组件。它不是特殊语法，只是一个被注解标记的普通 Java 类。

### 3.1 返回文本的最小 GET API

```java
package studio.aicourse.javaweb;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WelcomeController {

    @GetMapping("/welcome")
    public String welcome() {
        return "Hello Java Web";
    }
}
```

逐个说明：

- `@RestController` 标记这个类是一个 REST 风格的 Controller。它由 `@Controller` 和 `@ResponseBody` 组合而来，表示每个方法的返回值直接写入 HTTP 响应体。
- `@GetMapping("/welcome")` 声明这个方法响应 `GET /welcome` 请求。路径 `/welcome` 是第 17 章中讲过的资源路径。
- `public String welcome()` 是一个普通的 Java 方法。它的返回值 `"Hello Java Web"` 会成为 HTTP 响应的 body 部分。

启动应用后，在终端运行第 17 章用过的 curl：

```bash
curl -i http://localhost:8080/welcome
```

控制台输出（curl 端）：

```text
HTTP/1.1 200
Content-Type: text/plain;charset=UTF-8
Content-Length: 16

Hello Java Web
```

状态码 `200`、`Content-Type: text/plain` 都是 Spring Boot 根据你的代码自动设置的。`welcome()` 方法中没有一行关于 HTTP 协议的代码，你只写了"接到请求后返回什么字符串"。

### 3.2 请求如何到达方法

一次 `GET /welcome` 请求在 Spring Boot 内部经过的路径：

```text
浏览器/curl
  → Tomcat 接收 TCP 连接并解析原始 HTTP 报文
  → Spring 的 DispatcherServlet 获得请求
  → 根据 URL 和方法，在注册的 Controller 中查找匹配的映射
  → 找到 @GetMapping("/welcome")
  → 调用 welcome() 方法
  → 拿到返回值 "Hello Java Web"
  → 写回 HTTP 响应
```

[[DispatcherServlet]]是 Spring MVC 的中央分发器。它是前端控制器模式的一种实现：所有请求都先到达 DispatcherServlet，由它根据 URL、HTTP 方法和请求参数决定调用哪个 Controller 方法。

你不需要自己创建 DispatcherServlet——`spring-boot-starter-web` 已经自动配置好了。

## 四、路径变量和查询参数

### 4.1 @PathVariable：把 URL 中的变量传入方法

第 17 章的 REST API 中，`/todos/42` 中的 `42` 是待办项的标识。在 Spring Boot 中：

```java
@RestController
public class TodoController {

    @GetMapping("/todos/{id}")
    public String getTodo(@PathVariable("id") String id) {
        return "待办项 " + id;
    }
}
```

- `{id}` 是路径模板中的[[路径变量]]占位符。
- `@PathVariable("id")` 把 URL 中 id 位置的值取出来，传给方法参数 `id`。

请求：`curl http://localhost:8080/todos/42`
响应：`待办项 42`

请求：`curl http://localhost:8080/todos/hello`
响应：`待办项 hello`

路径变量默认是必填的。如果缺少变量值，请求根本匹配不到这个方法。如果路径变量名和方法参数名相同，`@PathVariable` 可以省略括号中的名字：`@PathVariable String id`。

### 4.2 @RequestParam：从查询字符串提取参数

查询参数（也叫 URL 参数）跟在 `?` 后面：

```java
@GetMapping("/todos")
public String listTodos(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size) {
    return "第 " + page + " 页，每页 " + size + " 条";
}
```

- `@RequestParam` 从查询字符串中提取指定名字的参数。
- `defaultValue` 在调用方不传参数时提供默认值，避免把 `String` 转 `int` 失败。
- 参数类型声明为 `int` 时，Spring 会自动把 `"1"` 解析为整数 `1`。

请求：`curl "http://localhost:8080/todos?page=2&size=20"`
响应：`第 2 页，每页 20 条`

请求：`curl http://localhost:8080/todos`
响应：`第 1 页，每页 10 条`（使用默认值）

查询参数在 RFC 9110 中属于请求 URI 的一部分，不改变资源路径本身，常用于过滤、分页和排序等修饰性信息。

### 4.3 路径变量 vs 查询参数

| 对比维度 | `@PathVariable` | `@RequestParam` |
| --- | --- | --- |
| 位置 | URL 路径段 | `?` 后面的查询字符串 |
| 语义 | 标识具体资源 | 修饰、过滤、分页 |
| 必填性 | 路径匹配必须提供 | 可通过 `defaultValue` 或 `required=false` 设为可选 |
| 示例 | `/todos/42` | `/todos?page=2&size=20` |

一个经验法则：如果参数删除后 URL 指向的对象完全变了，它适合做路径变量。如果删除后仍是同一对象的不同视图，它适合做查询参数。

## 五、@PostMapping 与请求体

### 5.1 接收 POST 请求

```java
@PostMapping("/todos")
public String createTodo(@RequestBody String body) {
    return "创建待办项，请求体：" + body;
}
```

- `@PostMapping` 响应 HTTP POST 方法。第 17 章讲过，POST 的语义是创建新资源或提交数据。
- `@RequestBody` 把 HTTP 请求体内容绑定到方法参数。不指定类型时，Spring 把原始请求体作为 String 传入。

使用 curl 测试：

```bash
curl -i \
  -H "Content-Type: text/plain" \
  -d "学习 Spring Boot" \
  http://localhost:8080/todos
```

响应：

```text
HTTP/1.1 200
Content-Type: text/plain;charset=UTF-8

创建待办项，请求体：学习 Spring Boot
```

### 5.2 请求必须带有 Content-Type

如果只使用 `-d` 不指定 Content-Type，`curl` 会假设 `Content-Type: application/x-www-form-urlencoded`。这与 `@RequestBody String` 的期望不匹配，Spring 可能返回 `415 Unsupported Media Type`。

```bash
# 失败示例
curl -d "学习 Spring Boot" http://localhost:8080/todos
# 返回：{"status":415,"error":"Unsupported Media Type"...}
```

理解这条错误：`415` 表示服务器不支持请求中的媒体类型。加上 `-H "Content-Type: text/plain"` 或 `application/json` 就能通过。后续用 JSON 时，`Content-Type` 必须明确为 `application/json`。

## 六、多个请求方法的处理

同一个路径可以用不同的 HTTP 方法映射到不同方法：

```java
@RestController
@RequestMapping("/todos")
public class TodoController {

    @GetMapping
    public String listTodos() {
        return "列出所有待办项";
    }

    @GetMapping("/{id}")
    public String getTodo(@PathVariable String id) {
        return "查看待办项 " + id;
    }

    @PostMapping
    public String createTodo() {
        return "创建待办项";
    }
}
```

- `@RequestMapping("/todos")` 在类级别声明路径前缀。类内所有方法共享此前缀。
- `@GetMapping`（无参数）响应 `GET /todos`；`@GetMapping("/{id}")` 追加路径变量。
- `@PostMapping` 响应 `POST /todos`。

## 七、返回 JSON

### 7.1 返回对象

Spring Boot 的 `spring-boot-starter-web` 自动包含了 Jackson，它能把 Java 对象序列化为 JSON 并写入响应体：

```java
public record TodoSummary(String id, String title, boolean completed) {
}
```

```java
@GetMapping("/{id}")
public TodoSummary getTodo(@PathVariable String id) {
    // 模拟返回数据。真实项目中从数据库查询。
    return new TodoSummary(id, "学习 Spring Boot", false);
}
```

请求：`curl http://localhost:8080/todos/42`

响应：

```json
{"id":"42","title":"学习 Spring Boot","completed":false}
```

`Content-Type` 自动设为 `application/json`。你不需要手动拼接 JSON 字符串。返回值是一个普通 Java 对象即可，Spring 在发送响应前自动经过 Jackson 序列化。这里使用了第 9 章的 record，它是表达数据对象的理想类型。

### 7.2 返回 List

```java
@GetMapping
public List<TodoSummary> listTodos() {
    return List.of(
        new TodoSummary("1", "学习 Java", false),
        new TodoSummary("2", "学习 Spring", false)
    );
}
```

`List.of` 创建不可修改的列表（第 13 章）。Spring 把 `List<TodoSummary>` 序列化为 JSON 数组：

```json
[{"id":"1","title":"学习 Java","completed":false},{"id":"2","title":"学习 Spring","completed":false}]
```

## 八、常见启动失败与排查

### 8.1 端口被占用

```text
Web server failed to start. Port 8080 was already in use.
```

原因：另一个程序已经在使用 8080 端口。解决方式：找到占用端口的程序并关闭，或者在 `application.properties` 中换端口：`server.port=8081`。

```bash
# 查找占用 8080 端口的进程（macOS）
lsof -i :8080

# 查找占用端口的进程（Windows PowerShell）
netstat -ano | findstr :8080
```

### 8.2 `@SpringBootApplication` 类放错位置

如果你的 `@SpringBootApplication` 类放在一个很深的包中，而 Controller 在另一个不相干的包，Spring 扫描不到它。默认情况下，Spring Boot 从 `@SpringBootApplication` 所在包及其子包中扫描组件。保持主类在根包，Controller 在其子包。

### 8.3 Controller 方法返回了页面路径字符串

如果 Controller 上用的是 `@Controller` 而不是 `@RestController`，方法返回的 String 会被解释为视图模板名称而不是响应体内容。对于 REST API，始终使用 `@RestController`。

## 九、练习与验收

### 练习 1：启动验证

创建第 2.1–2.2 节的项目结构，成功启动应用，在控制台中看到 `Started PreviewApplication` 和 `port 8080` 等日志。

### 练习 2：路径变量和查询参数

创建一个接受两种参数的接口：

- `GET /greet/{name}` 返回 `"你好，{name}"`（name 从路径变量取）
- `GET /greet?name=Ada` 返回 `"你好，Ada"`（name 从查询参数取）

使用 curl 分别请求，并验证两条路径都返回正确的文本。

### 练习 3：POST 与 JSON

实现 `POST /messages`，接收如下 JSON：

```json
{"author": "Ada", "content": "Hello"}
```

返回 `"Ada 说：Hello"`。提示：创建一个 record 类，用 `@RequestBody` 绑定后访问 `author()` 和 `content()` 方法。

完成标准：`Content-Type: application/json` 的 POST 得到正确响应；`Content-Type: text/plain` 的 POST 返回 415；GET /messages 返回 405（方法不允许）。

## 常见误区

### 混淆 `@RestController` 和 `@Controller`

`@RestController` = `@Controller` + `@ResponseBody`。REST API 的每个方法都需要把返回值直接写入响应体，所以使用 `@RestController`。如果无意中用了 `@Controller`，方法返回的字符串会被解析为模板路径名。

### 以为 `@PathVariable` 参数必须与方法参数同名

如果路径变量名和参数名一致，`@PathVariable` 可以省略显式名称。但路径变量名在 URL 的 `{}` 中定义，`@PathVariable("id")` 中的参数是字符串 `"id"`，不是变量名。即使路径模板写的是 `{id}`，你仍可以写 `@PathVariable("id") Integer identifier`。

### 用 `@RequestParam` 处理必填参数但不做校验

`@RequestParam(required = true)` 只能检查参数是否在查询字符串中出现。它不能检查参数值的合法性（如是否为正数、是否符合格式）。值域校验应在 Service 层或使用第 21 章的校验注解处理。

### 在 Controller 方法中写业务逻辑

Controller 的职责是接收 HTTP 请求、调用业务逻辑、返回响应。不要把 SQL 查询、业务规则或多层条件判断直接写在 Controller 中。第 20 章会详细讲解分层。

## 本章小结

Spring Boot 通过自动配置和 Starter 降低 Web 应用启动门槛。`@SpringBootApplication` 的 main 方法启动嵌入式 Tomcat 并扫描组件。`@RestController` 和 `@GetMapping`/`@PostMapping` 把 HTTP 请求映射到 Java 方法。`@PathVariable` 从 URL 路径提取参数，`@RequestParam` 从查询字符串提取参数。`@RequestBody` 把请求体绑定到方法参数。Jackson 自动把返回的 Java 对象序列化为 JSON。DispatcherServlet 是请求分发中心，自动配置后不需手动创建。第 19 章将学习如何让应用在不同环境中使用不同的配置，而不是把所有值写死在代码里。

## 快速自测

1. `@SpringBootApplication` 放在类上，它主要做什么？
2. `@GetMapping("/todos")` 与 `@PostMapping("/todos")` 的区别是什么？
3. `@PathVariable` 的值从哪里来？`@RequestParam` 的值从哪里来？
4. `@RestController` 和 `@Controller` 的差别是什么？
5. 为什么返回 TodoSummary 对象就自动变成 JSON 了？

参考答案：扫描组件、启用自动配置、引导启动；分别匹配 GET 和 POST 方法；@PathVariable 从 URL 路径中的 `{}` 占位符提取，@RequestParam 从 `?` 后的查询字符串提取；@RestController 让每个方法的返回值直接写入响应体；spring-boot-starter-web 自动引入 Jackson，Spring 在返回前自动序列化。

## 参考文献

- Spring. [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/reference/).
- Spring. [Spring MVC Web Framework](https://docs.spring.io/spring-framework/reference/web/webmvc.html).
