# 第 22 章　JSON、DTO 与接口兼容性

> 学习提示：先把 Java 对象和 JSON 之间的字段对应关系搞清，再思考什么数据应该暴露给客户端、什么数据应该隐藏；不要一开始就为未来所有版本的兼容性做规划。
> 一句话总结：Jackson 自动完成 Java 对象和 JSON 的互转；DTO 是接口专用的数据载体，与内部实体保持独立；日期格式、字段命名和未知字段策略需要显式约定。

第 18 章和第 20 章中，待办项对象在 Controller 的返回值中自动变成了 JSON。Spring 没有魔法——是 Jackson 在背后完成了序列化。本章先讲 Jackson 的基础映射，再讲为什么要为接口单独定义 DTO。

## 一、JSON 的数据结构

[[JSON]]（JavaScript Object Notation）是 Web API 中最通用的数据格式。它的语法只包含几种结构：

```json
{
  "id": "42",
  "title": "学习 JSON",
  "completed": false,
  "tags": ["java", "web"],
  "author": {
    "name": "Ada",
    "email": "ada@example.com"
  }
}
```

JSON 的合法值类型只有六种：

| JSON 类型 | 示例 | 对应的 Java 类型 |
| --- | --- | --- |
| 字符串 | `"hello"` | `String` |
| 数字 | `42`、`3.14` | `int`/`long`/`double`/`BigDecimal` |
| 布尔值 | `true`、`false` | `boolean`/`Boolean` |
| 对象 | `{"key":"value"}` | `Map` 或自定义类 |
| 数组 | `[1,2,3]` | `List` 或数组 |
| null | `null` | `null` 或包装类型 `null` |

JSON 的键必须是双引号包裹的字符串。数字没有引号。

## 二、Jackson 怎样映射字段

Jackson 是 Spring Boot `spring-boot-starter-web` 自动引入的 JSON 库。它默认按字段名做映射，不需要额外配置。

### 2.1 对象到 JSON（序列化）

```java
public record TodoSummary(
    String id,
    String title,
    boolean completed
) {}
```

```java
@GetMapping("/{id}")
public TodoSummary getTodo(@PathVariable String id) {
    return new TodoSummary("42", "学习 JSON", false);
}
```

Jackson 把 record 的组件名作为 JSON 的键名：

```json
{"id":"42","title":"学习 JSON","completed":false}
```

对普通类来说，Jackson 默认使用 getter 方法推断属性名：

```java
public class TodoSummary {
    private String id;
    private String title;
    private boolean completed;

    public String getId() { return id; }
    public String getTitle() { return title; }
    public boolean isCompleted() { return completed; }
}
```

- `getTitle()` → 去掉 `get` 前缀、首字母小写 → 属性名 `title`
- `isCompleted()` → 去掉 `is` 前缀、首字母小写 → 属性名 `completed`

### 2.2 JSON 到对象（反序列化）

`@RequestBody` 触发反序列化，Jackson 把 JSON 键对应到 Java 字段名：

```java
@PostMapping
public TodoSummary create(@RequestBody TodoSummary todo) {
    // todo.id() 的值是 JSON 中 "id" 的值
    return todo;
}
```

JSON 中的 `"id":"42"` 被映射为 Java 对象的 `id` 组件。record 使用规范构造器，普通类需要有默认构造器或 `@JsonCreator` 标记的构造器。

### 2.3 @JsonProperty 自定义映射

当 JSON 键名与 Java 字段名不一致时：

```java
public record UserInfo(
    @JsonProperty("user_name") String userName,
    @JsonProperty("created_at") String createdAt
) {}
```

```json
{"user_name":"Ada","created_at":"2026-07-14"}
```

序列化时，`userName` 字段输出为 `user_name`。反序列化时，`user_name` 映射到 `userName` 字段。

## 三、DTO 为什么单独存在

### 3.1 实体的字段不等于接口需要的字段

第 20 章 Service 层处理业务对象。假设有一个内部使用的 `Todo` record：

```java
public record Todo(
    String id,
    String title,
    String description,
    boolean completed,
    String createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    String internalNote   // 内部备注，不应暴露给客户端
) {}
```

如果 Controller 直接返回这个 `Todo`，八个字段全部暴露给客户端。客户端不需要也不应该看到 `internalNote`、`createdBy` 和数据库时间戳。

[[DTO]]（Data Transfer Object）是专门为接口传输设计的数据载体。它只包含接口需要的字段：

```java
public record TodoResponse(
    String id,
    String title,
    boolean completed
) {}
```

Controller 在返回前把 `Todo` 转换为 `TodoResponse`：

```java
@GetMapping("/{id}")
public TodoResponse getTodo(@PathVariable String id) {
    Todo todo = todoService.findById(id);
    return new TodoResponse(todo.id(), todo.title(), todo.completed());
}
```

DTO 带来的好处：

- 客户端看不到内部字段。
- 修改数据库字段不影响接口契约——只要 DTO 不变，客户端不受影响。
- 一个实体可以有多个 DTO：列表用 `TodoSummary`（少字段），详情用 `TodoDetail`（多字段），创建用 `CreateTodoRequest`（只包含可写字段）。

### 3.2 请求 DTO 与响应 DTO 分开

创建资源的请求和查询资源的响应通常需要不同的 DTO：

```java
// 请求：客户端传入的字段
public record CreateTodoRequest(
    @NotBlank String title,
    String description
) {}

// 响应：服务端返回的字段
public record TodoResponse(
    String id,
    String title,
    String description,
    boolean completed,
    String createdAt
) {}
```

请求 DTO 包含客户端可以写的字段（`title`、`description`），不包含服务端生成的字段（`id` 可能由服务端生成，`createdAt` 是服务端时间）。响应 DTO 包含服务端希望展示的字段。

### 3.3 在 Service 层做转换

DTO 与实体的转换放在哪一层？推荐放在 Service 层：

```java
@Service
public class TodoService {
    private final TodoRepository repository;

    public TodoResponse findById(String id) {
        Todo todo = repository.findById(id);
        return toResponse(todo);
    }

    public TodoResponse create(CreateTodoRequest request) {
        Todo todo = new Todo(
            UUID.randomUUID().toString(),
            request.title(),
            request.description(),
            false,
            "system",
            LocalDateTime.now(),
            null,
            null
        );
        repository.save(todo);
        return toResponse(todo);
    }

    private TodoResponse toResponse(Todo todo) {
        return new TodoResponse(
            todo.id(), todo.title(), todo.completed()
        );
    }
}
```

这样 Controller 只负责 HTTP 绑定和调用 Service，不涉及 DTO 转换。

## 四、日期、命名与未知字段

### 4.1 日期格式

JSON 没有标准的日期类型。日期在 JSON 中通常表示为字符串。Jackson 默认把 `LocalDateTime` 序列化为数组格式 `[2026,7,14,9,30]`，这对客户端不友好。

推荐的配置是使用 ISO 8601 字符串格式。在 `application.yml` 中：

```yaml
spring:
  jackson:
    serialization:
      write-dates-as-timestamps: false
```

或者在字段上用注解：

```java
@JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
private LocalDateTime createdAt;
```

`write-dates-as-timestamps: false` 让所有日期字段以 ISO 8601 字符串输出。跨服务通信时，建议使用 Instant 或带时区的类型，避免 LocalDateTime 的歧义（第 16 章讲过）。

### 4.2 命名策略

不同团队可能使用不同的命名风格。Java 习惯驼峰命名（`userName`），而 JSON 可能要求蛇形命名（`user_name`）。在 `application.yml` 中全局配置：

```yaml
spring:
  jackson:
    property-naming-strategy: SNAKE_CASE
```

`SNAKE_CASE` 让所有字段的驼峰名自动转为蛇形名输出，反序列化时也能自动匹配。其他选项包括 `LOWER_CAMEL_CASE`（默认）、`UPPER_CAMEL_CASE`、`KEBAB_CASE`。

全局命名策略适合统一风格。如果只在少数字段上需要不同名称，优先使用 `@JsonProperty`。

### 4.3 未知字段

客户端可能发送 JSON 中包含 DTO 没有定义的字段：

```json
{"title":"学习","description":"详情","priority":"high"}
```

而 Java record 只有 `title` 和 `description` 两个组件。Jackson 默认行为是忽略未知字段，不报错。这符合"宽容接收"的原则。

如果需要严格模式（拒绝未知字段），在类上标注：

```java
@JsonIgnoreProperties(ignoreUnknown = false)
public record CreateTodoRequest(String title, String description) {}
```

严格模式适合需要精确控制输入的内部接口。对外部调用方开放的 API，宽容模式（默认）更友好。客户端升级后多了新字段，旧版服务端不应因此拒绝请求。

### 4.4 空值的处理

当 Java 字段为 `null` 时，Jackson 默认在 JSON 中包含该字段，值为 `null`：

```json
{"id":"1","title":"任务","description":null}
```

全局排除 null 值：

```yaml
spring:
  jackson:
    default-property-inclusion: non_null
```

排除 null 值的 JSON 更短，但客户端必须能处理可能缺失的字段。选择取决于与客户端的约定。

## 五、接口演进的边界

API 发布后会被客户端使用。修改已有接口需要谨慎：

### 5.1 安全的变更

- 在响应中**新增可选字段**（客户端忽略即可）
- 在请求中**新增可选字段**（旧客户端不传时使用默认值）
- 新增一个独立的 API 端点

### 5.2 破坏性的变更

- **删除或重命名响应字段**（旧客户端可能崩溃）
- **修改字段类型**（例如将 `"true"` 改成 `true`，或将数字改成字符串）
- **修改 URL 路径**
- **让原本可选的请求字段变成必填**

### 5.3 版本化策略

当确实需要破坏性变更时，常见做法是使用 URL 路径中的版本号：

```text
/api/v1/todos
/api/v2/todos
```

`v1` 和 `v2` 可以同时运行，`v1` 在足够长时间后废弃并下线。不是所有变更都需要新版——只在确实需要破坏性变更时才升级版本。

另一个策略是在响应头中标注版本，让客户端选择。本课程不展开多种版本化方案，实际项目中按团队约定执行。

## 六、实体不直接返回

回到第 3 节的要点：实体和 DTO 是不同层次的模型。实体的字段由数据表结构决定，DTO 的字段由接口契约决定。混淆二者会导致：

- 修改表结构影响接口，前后端耦合。
- 敏感字段（如内部备注、创建人）被意外暴露。
- JPA 实体（第 25 章）在序列化时触发延迟加载，产生不必要的数据库查询。

```java
// 错误：直接返回 JPA 实体
@GetMapping("/{id}")
public TodoEntity getTodo(@PathVariable Long id) {
    return todoRepository.findById(id).orElseThrow();
}

// 正确：返回 DTO
@GetMapping("/{id}")
public TodoResponse getTodo(@PathVariable String id) {
    Todo todo = todoService.findById(id);
    return new TodoResponse(todo.id(), todo.title(), todo.completed());
}
```

## 七、练习与验收

### 练习 1：设计请求与响应 DTO

为一个用户注册接口设计两个 DTO：

- `RegisterUserRequest`：字段 `username`（必填）、`email`（必填）、`bio`（可选）
- `UserResponse`：字段 `id`、`username`、`createdAt`

写一个 Controller 方法：

- `POST /users`：接收 `RegisterUserRequest`，生成 UUID 作为 id，返回 `UserResponse`。
- `GET /users/{id}`：返回 `UserResponse`，如果找不到返回 404 错误。

用 curl 测试创建和查询。

### 练习 2：日期格式与命名策略

在 `application.yml` 中配置 `spring.jackson.property-naming-strategy: SNAKE_CASE`。创建包含 `createdAt` 字段的 DTO，验证：

- 输出的 JSON 键名为 `created_at`。
- `LocalDateTime.now()` 的输出格式是 `"2026-07-14T09:30:00"` 格式（需配置 `write-dates-as-timestamps: false`）。

### 练习 3：未知字段测试

创建 `CreateTodoRequest(title)` 只有一个字段。向接口发送包含额外字段 `"priority": "high"` 的 JSON，验证：

- 默认行为下，请求成功（未知字段忽略）。
- 添加 `@JsonIgnoreProperties(ignoreUnknown = false)` 后，相同的请求返回 400 错误。

完成标准：能解释默认宽容模式和严格模式各自的适用场景。

## 常见误区

### 直接返回数据库实体

数据库实体的字段通常多于接口需要的字段。直接返回实体会暴露内部结构，且 JPA 的延迟加载可能引发意外查询。

### 把 DTO 放在 Controller 中创建

```java
@GetMapping("/{id}")
public TodoResponse getTodo(@PathVariable String id) {
    Todo todo = todoRepository.findById(id);
    return new TodoResponse(todo.getId(), todo.getTitle());
}
```

Controller 不应该操作 Repository。保持依赖方向：Controller → Service → Repository。

### 为每个字段组合创建不同的 DTO

一个待办项实体有 8 个字段，不需要为 `{id, title}`、`{id, title, description}`、`{id, title, completed}` 分别创建三个 DTO。通常两个就够：一个列表摘要（少量字段），一个详情（多数字段）。

### 忽略 JSON 解析失败的排查线索

当 `@RequestBody` 反序列化失败时，Spring 返回 `400 Bad Request`。日志中会包含类似 `Unrecognized field "priority"` 或 `Cannot deserialize value of type java.time.LocalDateTime` 的信息。排查 JSON 映射问题时，先从日志找 Jackson 的具体错误信息。

## 本章小结

JSON 是 Web API 的通用数据格式，Jackson 默认按字段名完成 Java 对象和 JSON 的互转。DTO 是接口专用的数据载体，与内部实体保持独立——请求 DTO 只包含可写字段，响应 DTO 只包含需要展示的字段。日期格式（`write-dates-as-timestamps`）、命名策略（`SNAKE_CASE`）和 null 值处理通过配置管理。接口演进优先使用非破坏性变更，破坏性变更通过版本化控制。下一章学习 SQL 和关系数据库基础，为数据持久化做准备。

## 快速自测

1. DTO 和实体有什么区别？为什么不能直接返回实体？
2. `@JsonProperty("user_name")` 在序列化和反序列化时分别起什么作用？
3. 接口演进中，什么样的变更需要升级 API 版本？
4. `spring.jackson.default-property-inclusion: non_null` 的作用是什么？

参考答案：DTO 是接口专用的数据载体，字段由契约决定；实体由数据表结构决定，直接返回会暴露内部字段和耦合表结构；序列化时将 Java 字段名 `userName` 输出为 `user_name`，反序列化时从 JSON 键 `user_name` 读取值赋给 Java 字段；删除或重命名字段、修改字段类型、让可选字段变必填；序列化时排除值为 null 的字段，使输出 JSON 不含 null 值键。

## 参考文献

- FasterXML. [Jackson Documentation](https://github.com/FasterXML/jackson-docs).
- Spring. [Spring Boot Reference：JSON](https://docs.spring.io/spring-boot/reference/features/json.html).
- Google. [JSON Style Guide](https://google.github.io/styleguide/jsoncstyleguide.xml).
