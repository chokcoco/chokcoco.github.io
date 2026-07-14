# 第 20 章　Controller、Service 与 Repository 分层

> 学习提示：不要把"未分层的代码"看成错误，把它看成需要整理的桌面——每一层有它自己的职责；先从 Controller 中抽出一个 Service，再从 Service 中抽象出数据访问。
> 一句话总结：Controller 处理 HTTP 输入输出，Service 执行业务规则，Repository 负责数据存取；构造器注入让依赖方向清晰，分层是为了可测试、可修改和可读。

第 18 章 Controller 中的方法直接返回了数据。如果把查询数据库、校验业务规则、调用外部 API 都放在 Controller 中，一个方法很快就膨胀成几十行甚至上百行。

## 一、先看未分层的接口

把三个职责都堆在一个方法中是什么样：

```java
@RestController
public class TodoController {

    // 模拟数据库
    private final List<Todo> storage = new ArrayList<>();

    @GetMapping("/todos/{id}")
    public Todo getTodo(@PathVariable String id) {
        // 1. 校验：ID 格式是否正确
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID 不能为空");
        }

        // 2. 查询：从存储中查找
        Todo found = null;
        for (Todo todo : storage) {
            if (todo.id().equals(id)) {
                found = todo;
                break;
            }
        }

        // 3. 未找到时的处理
        if (found == null) {
            throw new NoSuchElementException("待办项不存在：" + id);
        }

        // 4. 业务规则：已完成项不返回详细信息
        if (found.completed()) {
            return new Todo(found.id(), "[已完成]", true);
        }

        return found;
    }

    @PostMapping("/todos")
    public Todo createTodo(@RequestBody Todo todo) {
        // 5. 校验重复
        for (Todo existing : storage) {
            if (existing.id().equals(todo.id())) {
                throw new IllegalStateException("待办项已存在：" + todo.id());
            }
        }

        // 6. 存储
        storage.add(todo);
        return todo;
    }
}
```

这个 Controller 混合了三种职责：

- **HTTP 层职责**：接收请求参数、返回响应。`@PathVariable` 绑定、`@RequestBody` 绑定属于这一层。
- **业务逻辑**：ID 格式校验、"已完成项不显示标题"的规则、重复检查。
- **数据访问**：遍历 `storage` 列表查找、添加元素、未找到时的判断。

当一个类包含三种职责时，以下问题会逐一出现：

- 修改校验规则需要改动 Controller，但它和 HTTP 绑定无关。
- 测试"已完成项不显示标题"这条规则，需要启动整个 HTTP 服务器。
- 未来换存储方式（例如从内存换成数据库）需要改遍每个 Controller 方法。
- 多个 Controller 方法中查询逻辑重复——`getTodo` 中的查找循环和 `createTodo` 中的重复检查，实际上是同一段数据访问逻辑的不同使用方式。

[[分层架构]]把三种职责拆到三个独立的层次中。

## 二、把 HTTP 留在 Controller

Controller 只做三件事：

1. 接收 HTTP 请求，提取参数。
2. 调用 Service 完成操作。
3. 把 Service 返回的结果写入 HTTP 响应。

Controller 不应该做的事情：

- 直接读写数据库或集合。
- 判断业务规则（"用户名不能重复""订单金额不能为负"）。
- 处理事务（"如果 A 失败，回滚 B"）。

重构后的 Controller：

```java
@RestController
@RequestMapping("/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping("/{id}")
    public Todo getTodo(@PathVariable String id) {
        return todoService.findById(id);
    }

    @PostMapping
    public Todo createTodo(@RequestBody Todo todo) {
        return todoService.create(todo);
    }
}
```

Controller 变薄了：它不再关心怎么查数据、怎么判断重复。`TodoService` 从这里开始成为业务逻辑的集中位置。

## 三、把业务规则放入 Service

[[Service]]（有时也叫 Application Service 或 Business Service）负责：

- 协调多个数据源或外部调用。
- 执行不依赖 HTTP 协议的业务规则。
- 判断操作是否合法（权限、状态、重复等）。

它不应该做的事情：

- 解析 HTTP 参数。
- 写 HTTP 响应状态码。
- 直接依赖 `HttpServletRequest` 或 `@PathVariable`。

```java
@Service
public class TodoService {

    private final TodoRepository todoRepository;

    public TodoService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    public Todo findById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID 不能为空");
        }

        Todo found = todoRepository.findById(id);
        if (found == null) {
            throw new NoSuchElementException("待办项不存在：" + id);
        }

        // 业务规则：已完成项只返回简化信息
        if (found.completed()) {
            return new Todo(found.id(), "[已完成]", true);
        }

        return found;
    }

    public Todo create(Todo todo) {
        if (todo.id() == null || todo.id().isBlank()) {
            throw new IllegalArgumentException("待办项 ID 不能为空");
        }

        Todo existing = todoRepository.findById(todo.id());
        if (existing != null) {
            throw new IllegalStateException("待办项已存在：" + todo.id());
        }

        todoRepository.save(todo);
        return todo;
    }
}
```

`@Service` 是 Spring 的组件注解，和 `@RestController` 一样，标记这个类由 Spring 管理。Controller 通过构造器注入获得 `TodoService`，而不是通过 `new TodoService()` 自己创建。

构造器注入方式的优势：

- 依赖关系在对象创建时确定，之后不可变（字段可声明为 `final`）。
- 测试时可以方便地传入替代实现（第 27 章详述）。
- 不需要 `@Autowired` 注解——Spring 对只有一个构造器的类自动识别。

## 四、Repository 负责数据存取

[[Repository]]（或 DAO——Data Access Object）只关心数据的存和取：

- 如何保存一个对象。
- 如何根据 ID 查找。
- 如何按条件查询。
- 如何删除。

Repository 不应该包含：

- 业务规则（如"已完成项不显示标题"）。
- HTTP 知识。
- 事务决策（事务在第 26 章讲解，它在 Service 层声明）。

```java
@Repository
public class TodoRepository {

    private final Map<String, Todo> storage = new ConcurrentHashMap<>();

    public Todo findById(String id) {
        return storage.get(id);
    }

    public void save(Todo todo) {
        storage.put(todo.id(), todo);
    }

    public List<Todo> findAll() {
        return List.copyOf(storage.values());
    }
}
```

`@Repository` 标记数据访问组件。现在用的是内存 `Map` 存储，第 23–25 章替换为真实数据库时，只改这一个类即可。Service 和 Controller 不需要知道数据实际存在哪里。

`ConcurrentHashMap` 替代了 `HashMap`：在多线程环境下，`HashMap` 的 `put` 操作不是线程安全的——多个线程同时写入时可能产生数据错乱甚至死循环（CPU 100%）。`ConcurrentHashMap` 提供了安全的并发访问。现在不需要深入理解线程安全，知道"可能被多个请求同时访问的共享数据使用 `ConcurrentHashMap`"即可。第 34 章会展开讲解。

## 五、完整的请求处理链路

一次 `POST /todos` 的完整请求链路：

```text
1. Tomcat 接收 HTTP 请求
   → POST /todos
   → Content-Type: application/json
   → {"id":"42","title":"学习","completed":false}

2. DispatcherServlet 匹配
   → 找到 TodoController.createTodo()

3. Spring 把请求体转换为 Todo 对象
   → 调用 @RequestBody 的 Jackson 反序列化

4. Controller.createTodo()
   → 仅提取参数 + 调用 todoService.create(todo)

5. TodoService.create()
   → 校验 ID 非空
   → todoRepository.findById() 查重
   → todoRepository.save() 保存

6. TodoRepository.save()
   → storage.put(todo.id(), todo)

7. Controller 收到返回值
   → Spring 把 Todo 对象序列化为 JSON
   → 写入 HTTP 响应体，状态码 200
```

每个箭头都是单向的：Controller → Service → Repository。Service 不依赖 Controller，Repository 不依赖 Service。这种单向依赖让代码更容易测试和修改。

## 六、逐步拆分而不是套架构

在实际项目中，分层不是一次性完成的任务。通常的拆分顺序：

1. 先把所有逻辑写在一个 Controller 方法中，确认能跑通。
2. 当出现第二个需要相同查询逻辑的方法时，提取 Repository。
3. 当需要写几条 if 判断数据合法性时，提取 Service。
4. 当 Controller 超过 15-20 行时，考虑是否有业务逻辑混入。

不应该做的事情：

- 一个 Service 中只有一个 `repository.save(x)` 方法而没有其他逻辑。没有业务逻辑的 Service 只是转发——这种情况下，Controller 直接依赖 Repository 更清晰。
- 在未理解需求前就预设三层。
- 为一个 `if (x > 0)` 创建单独的 Service 方法。
- 在 Controller 中 import `HttpServletRequest` 然后手动解析 JSON——Spring 已经帮你做了。

分层不是架构竞赛。增加一层必然增加一个文件和一个对象，如果这一层没有带来可测试性、可复用性或可读性的提升，就是多余的。

## 七、练习与验收

### 练习 1：拆分层

将第 18 章的 `TodoController` 改造为三层：

- Controller：只处理 `@GetMapping`、`@PostMapping`，注入 TodoService。
- TodoService：包含"标题不能为空"和"重复 ID 检查"两条业务规则。
- TodoRepository：使用 `ConcurrentHashMap` 存储。

完成标准：Controller 中的方法不超过 3 行；Service 不 import Spring Web 包；Repository 不包含业务规则。

### 练习 2：找出未分层的代码

阅读以下代码，指出每行属于哪一层，以及哪些行应该被移走：

```java
@GetMapping("/orders/{id}")
public Order getOrder(@PathVariable String id) {
    if (id == null) throw new RuntimeException();
    String sql = "SELECT * FROM orders WHERE id = ?";
    // execute SQL... (此处用伪代码表示实际查询)
    Order order = executeQuery(sql, id);
    if (order.getStatus().equals("CANCELLED")) {
        return new Order(order.getId(), "[已取消]");
    }
    if (order.getTotal().compareTo(BigDecimal.ZERO) < 0) {
        throw new RuntimeException("金额异常");
    }
    return order;
}
```

### 练习 3：反向测试

写一个 TodoService 的纯 Java 测试（不使用 Spring、不使用 HTTP），验证：

- `findById("missing")` 抛出 `NoSuchElementException`。
- `create(new Todo("1", "Learn Java", false))` 成功。
- `create(new Todo("1", "Duplicate", false))` 抛出 `IllegalStateException`。

完成标准：不启动 Spring Boot（不写 `@SpringBootTest`），直接 `new TodoService(new TodoRepository())` 并调用方法。这是一个**单元测试**，只在内存中运行。

## 常见误区

### Service 没有业务逻辑

```java
@Service
public class TodoService {
    private final TodoRepository repo;
    public Todo findById(String id) { return repo.findById(id); }
    public void save(Todo t) { repo.save(t); }
}
```

这段代码只是 `TodoRepository` 的重命名。如果 Service 没有任何校验、转换或组合逻辑，它不增加价值。

### Controller 做业务判断

```java
@GetMapping("/{id}")
public Todo getTodo(@PathVariable String id) {
    Todo todo = todoService.findById(id);
    if (todo.completed()) {    // 业务规则不应在 Controller 中
        return new Todo(todo.id(), "[已完成]", true);
    }
    return todo;
}
```

### 把 @Service 和 @Repository 混用

`@Service` 和 `@Repository` 从 Spring 的 Bean 管理角度看是等价的——都能被扫描到并创建实例。但它们的语义不同，分别表示业务逻辑和数据访问的职责。测试和 AOP 切面可以按注解类型做不同处理（例如 `@Repository` 的异常会自动转换为 Spring 的数据访问异常）。

### 在多个层中重复校验

ID 是否为空在 Controller 层校验了一次，又在 Service 层校验了一次，又在 Repository 层校验了一次——这不是"更安全"，而是维护噩梦。选择一个层做输入校验，通常是 Service 层（因为 Service 可能被非 HTTP 的入口调用，例如定时任务或消息队列）。

## 本章小结

分层架构把 HTTP 处理、业务规则和数据存取分离。Controller 接收请求参数并返回响应，Service 执行业务逻辑，Repository 负责数据存取。构造器注入让依赖单向流动。分层的目标是可测试、可修改和可读，不是为了看起来"像企业架构"。下一章学习参数校验和全局异常处理——让 Controller 在接收非法输入时，能返回结构一致、含义清楚的错误响应。

## 快速自测

1. Controller、Service、Repository 三层各自的职责是什么？
2. 为什么 Service 不应该依赖 `HttpServletRequest`？
3. 构造器注入相比 `@Autowired` 字段注入的优势是什么？
4. 什么样的 Service 方法是多余的转发？

参考答案：Controller 处理 HTTP 输入输出，Service 执行业务规则，Repository 负责数据存取；Service 应该能被非 HTTP 调用方使用（如定时任务），依赖 HTTP 协议会限制复用；依赖在构造时确定，字段可 final，测试时易于注入替代实现；只调用 repository 的同名方法、无任何校验或转换逻辑的方法。

## 参考文献

- Spring. [Spring MVC Controller](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html).
- Spring. [The IoC Container：Dependency Injection](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html).
