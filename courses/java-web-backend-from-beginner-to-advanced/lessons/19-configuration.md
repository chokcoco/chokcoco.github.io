# 第 19 章　配置、环境与代码分离

> 学习提示：先从代码中识别出会变的数字和地址，再把它们移到配置文件；不要一次把项目的所有配置都改完，每次只处理一个会变的值。
> 一句话总结：配置让同样的代码在不同环境中表现不同：properties/YAML 管理简单值，Profile 区分环境，环境变量和命令行参数保护秘密。

第 18 章的服务启动后，端口、数据库地址、第三方服务的 URL 全都写死在代码里。把应用从开发电脑搬到测试环境或生产服务器时，这些值需要改变。如果每次换环境都要改代码、重新编译，就失去了"代码一样、配置不同"的灵活性。

## 一、识别哪些值会随环境变化

在 Controller 中，如果直接写了数字、地址或开关：

```java
@RestController
public class WelcomeController {
    private String appName = "todo-app";     // 不同环境可能要求不同应用名
    private int maxPageSize = 100;            // 开发环境用 20，生产环境可能用 100

    @GetMapping("/info")
    public String info() {
        return appName + " 最大页大小: " + maxPageSize;
    }
}
```

`"todo-app"` 和 `100` 是[[硬编码]]——值直接写在源码中。硬编码的问题不是当前运行不对，而是换了环境后必须重新编译。

[[配置]]就是把会变化的值从代码移到外部文件或外部来源。代码只声明"我需要一个叫 `app.name` 的值"，不关心它具体是多少。值由配置文件、环境变量或启动参数在运行时提供。

哪些值适合作为配置：

- 端口号（`8080`、`9090`）
- 数据库连接字符串（URL、用户名）
- 第三方服务的地址和密钥
- 日志级别和输出位置
- 业务开关（如"是否开启注册"）

哪些值不适合作为配置：

- 只在单个方法内部使用的计算常量
- 固定不变的业务规则（如税率百分比——如果它确实不变的话）

## 二、properties 与 YAML

Spring Boot 支持两种主要的配置文件格式：`.properties` 和 `.yml`/`.yaml`。它们都放在 `src/main/resources/` 目录下，Spring Boot 启动时会自动读取。

### 2.1 application.properties

```properties
# src/main/resources/application.properties
server.port=8080
app.name=todo-app
app.max-page-size=100
app.welcome-message=欢迎使用待办事项服务
```

`properties` 格式使用 `key=value`，每一行一个配置项。Spring Boot 把 `.` 作为层级分隔符，`server.port` 和 `app.name` 是两个独立的配置项。

### 2.2 application.yml

```yaml
# src/main/resources/application.yml
server:
  port: 8080

app:
  name: todo-app
  max-page-size: 100
  welcome-message: 欢迎使用待办事项服务
```

YAML 使用缩进表达层级。`app` 下面缩进两个空格的是它的子项。YAML 的优势是结构一目了然，适合配置项较多的项目。两种格式可以共存，但通常一个项目只选一种。

### 2.3 配置的优先级

同一个配置项可能在多个地方出现。Spring Boot 按固定顺序读取，后面的覆盖前面的：

1. 默认值（框架内置的 `server.port=8080` 等）
2. `application.properties` / `application.yml`（打包在 jar 内）
3. jar 外部的 `application.properties` / `application.yml`（放在运行目录下）
4. 操作系统环境变量
5. 命令行参数（`--server.port=9090`）

这意味着你可以用 jar 内的配置作为"开发默认值"，然后在生产环境用环境变量或命令行覆盖关键配置，而不需要重新打包。

## 三、在代码中读取配置

### 3.1 @Value 注入单个值

```java
@RestController
public class WelcomeController {

    @Value("${app.name}")
    private String appName;

    @Value("${app.max-page-size}")
    private int maxPageSize;

    @GetMapping("/info")
    public String info() {
        return appName + " 最大页大小: " + maxPageSize;
    }
}
```

- `@Value("${app.name}")` 告诉 Spring："从配置中读取键为 `app.name` 的值，注入这个字段"。
- Spring 在创建 Controller 实例时，从配置源中查找 `app.name` 并完成赋值。
- `${}` 中的键名必须与配置文件中的键名完全匹配。

如果配置项缺失，应用启动时报错：

```text
Could not resolve placeholder 'app.name' in value "${app.name}"
```

这意味着代码声明了需要配置，但配置文件或环境变量没有提供。可以设置默认值避免启动失败：

```java
@Value("${app.max-page-size:50}")
private int maxPageSize;
```

冒号后面是默认值。如果 `app.max-page-size` 在配置中不存在，使用 `50`。

### 3.2 @ConfigurationProperties 绑定一组配置

当一个前缀下配置项较多时，逐字段 `@Value` 会分散在类各处。`@ConfigurationProperties` 把一组配置绑定到一个类：

```java
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String name;
    private int maxPageSize;
    private String welcomeMessage;

    // getters and setters 必须存在
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public int getMaxPageSize() { return maxPageSize; }
    public void setMaxPageSize(int maxPageSize) { this.maxPageSize = maxPageSize; }
    public String getWelcomeMessage() { return welcomeMessage; }
    public void setWelcomeMessage(String welcomeMessage) { this.welcomeMessage = welcomeMessage; }
}
```

```yaml
app:
  name: todo-app
  max-page-size: 100
  welcome-message: 欢迎使用
```

Spring 会自动把 `app.name` 映射到 `AppProperties.name`（通过 `setName`），`app.max-page-size` 映射到 `maxPageSize`（Spring 自动去掉连字符并转为驼峰命名）。

使用时注入这个类即可：

```java
@RestController
public class WelcomeController {
    private final AppProperties appProperties;

    public WelcomeController(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @GetMapping("/info")
    public String info() {
        return appProperties.getName() + " " + appProperties.getWelcomeMessage();
    }
}
```

`@ConfigurationProperties` 比 `@Value` 更适合：

- 配置项超过三个且共享前缀
- 需要在多个类中复用同一组配置
- 需要类型安全的嵌套结构（例如 `app.database.host`、`app.database.port`）

### 3.3 record 绑定

Java 17 的 record 也可以用于配置绑定，前提是使用构造器注入的方式：

```java
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppConfig(String name, int maxPageSize, String welcomeMessage) {
}
```

record 比传统类更简洁，但需要确认 Spring Boot 版本支持（3.0+ 对 record 的支持已经完善）。

## 四、区分开发、测试与生产

### 4.1 Profile 的概念

同一个应用在开发、测试和生产环境中需要的配置不同：

- 开发环境：`server.port=8080`，日志详细，数据库是本机
- 测试环境：`server.port=8080`，数据库是测试实例，连接池较小
- 生产环境：`server.port=80`，日志精简，数据库有密码

[[Profile]]是一组配置的命名集合。Spring Boot 支持多配置文件，文件名中包含 profile 名称：

```text
application.yml              # 公共配置，所有环境共享
application-dev.yml          # 仅 dev profile 激活时加载
application-test.yml         # 仅 test profile 激活时加载
application-prod.yml         # 仅 prod profile 激活时加载
```

### 4.2 激活 Profile

在 `application.yml` 中设置：

```yaml
spring:
  profiles:
    active: dev
```

或者通过命令行参数：

```bash
java -jar app.jar --spring.profiles.active=prod
```

或者通过环境变量：

```bash
export SPRING_PROFILES_ACTIVE=prod
```

多个 profile 可以同时激活：`spring.profiles.active: dev,local`。

### 4.3 按 Profile 拆分配置示例

```yaml
# application.yml（公共）
app:
  name: todo-app
```

```yaml
# application-dev.yml
server:
  port: 8080
app:
  max-page-size: 20
logging:
  level:
    root: DEBUG  # 开发环境打印详细日志
```

```yaml
# application-prod.yml
server:
  port: 80
app:
  max-page-size: 100
logging:
  level:
    root: WARN   # 生产环境只打印警告及以上
```

激活 `dev` profile 时，`server.port` 为 8080，`app.max-page-size` 为 20。激活 `prod` 时，这些值被 `application-prod.yml` 覆盖。

## 五、秘密不进入仓库

### 5.1 为什么秘密不能在 application.yml 中

```yaml
# 错误示例——绝对不要提交到 Git
spring:
  datasource:
    password: MySecret123!
```

任何提交到 Git 仓库的人都能看到密码。即使私有仓库也可能被共享、镜像或备份，密码泄露的后果远高于开发便利性。

### 5.2 通过环境变量注入

Spring Boot 自动把环境变量映射为配置属性。环境变量名中的下划线对应配置属性中的点和连字符：

```bash
export SPRING_DATASOURCE_PASSWORD=MySecret123!
```

启动时，Spring 会检测到 `SPRING_DATASOURCE_PASSWORD` 环境变量，并把它映射为 `spring.datasource.password` 配置值。不需要在配置文件中声明。

### 5.3 命令行参数

```bash
java -jar app.jar --spring.datasource.password=MySecret123!
```

命令行中直接传入的值优先级最高。适合一次性启动，不适合日常使用。

### 5.4 提供安全配置模板

在仓库中保留一个模板文件，不包含真实秘密：

```yaml
# application-secrets.example.yml
# 复制此文件为 application-secrets.yml 并填入真实值
# 不要把 application-secrets.yml 提交到 Git
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/todo
    username: your-username
    password: your-password
```

在 `.gitignore` 中排除 `application-secrets.yml`：

```text
application-secrets.yml
```

### 5.5 外部化配置的总结

| 方式 | 适合场景 | 安全性 | 提交到 Git |
| --- | --- | --- | --- |
| `application.yml` 打包在 jar 中 | 默认值、非敏感值 | 低 | 是 |
| jar 外部 `application.yml` | 环境通用值 | 低 | 否（通常） |
| 环境变量 | 秘密、每环境不同值 | 高 | 否 |
| 命令行参数 | 临时覆盖 | 中 | 否 |

## 六、练习与验收

### 练习 1：端口外部化

在第 18 章的项目中，创建 `application.yml`，将 `server.port` 设为 9090。启动应用后，使用 curl 请求 `http://localhost:9090/welcome` 确认服务运行在新的端口。

然后通过命令行参数 `--server.port=9091` 重新启动，验证命令行参数优先级高于配置文件。

### 练习 2：分组配置

使用 `@ConfigurationProperties(prefix = "app")` 绑定一组配置（app.name、app.max-page-size、app.welcome-message），在 Controller 中注入并返回。

创建 `application-dev.yml`，覆盖 app.name 为 `todo-app-dev`。分别以 `dev` profile 和默认 profile 启动，观察返回的应用名不同。

### 练习 3：秘密处理

创建 `application-secrets.example.yml` 模板，在 `.gitignore` 中排除 `application-secrets.yml`。通过环境变量 `export APP_WELCOME_MESSAGE=HelloSecret` 启动应用，验证环境变量覆盖了配置文件中的 `app.welcome-message`。

## 常见误区

### 把所有值都放到配置文件

配置文件不是变量垃圾桶。只在单个方法内使用的计算常量、不会随环境变化的业务规则不需要外部化。过多的配置项会降低可维护性。

### 硬编码敏感信息然后"以后改"

"先写死，上线前再改"几乎总是变成"忘记改了"。从一开始就使用环境变量存放密码和密钥。

### 把所有 Profile 配置混在一个文件

一个巨大的 `application.yml` 中混着所有 Profile 的配置，难以阅读和排查。优先使用多文件 Profile 拆分（`application-dev.yml`、`application-prod.yml`），公共值放在 `application.yml`。

### 以为 @Value 支持复杂类型

`@Value` 只能注入简单类型（String、int、boolean 等）。需要绑定嵌套对象或 List 时，使用 `@ConfigurationProperties`。

## 本章小结

配置让代码和环境分离。`application.yml` 存放默认值，Profile（`application-dev.yml` 等）管理环境差异。`@Value` 适合注入单个配置项，`@ConfigurationProperties` 适合绑定一组共享前缀的配置。环境变量和命令行参数保护秘密并支持运行时覆盖。第 20 章将学习如何按职责拆分 Controller、Service 和 Repository，让业务代码不再和 HTTP 逻辑混在一起。

## 快速自测

1. 硬编码的问题是什么？配置解决了什么问题？
2. `@Value("${app.name:default}")` 中的冒号表示什么？
3. `application-dev.yml` 什么时候被加载？
4. 为什么数据库密码不应该放在 application.yml 中？
5. 环境变量 `SPRING_PROFILES_ACTIVE` 对应哪个配置属性？

参考答案：硬编码让环境切换需要修改代码再编译，配置把可变值移到运行时加载的外部来源；冒号表示默认值，配置不存在时使用 "default"；当 spring.profiles.active 包含 "dev" 时加载；因为提交到 Git 后密码泄露，任何有仓库访问权限的人都能看到；对应 spring.profiles.active。

## 参考文献

- Spring. [Spring Boot Reference：Externalized Configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html).
- Spring. [Spring Boot Reference：Profiles](https://docs.spring.io/spring-boot/reference/features/profiles.html).
