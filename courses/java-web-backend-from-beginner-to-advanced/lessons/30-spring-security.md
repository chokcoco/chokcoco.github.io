# 第 30 章　Spring Security 认证与授权

> 学习提示：先建立"认证是证明你是谁，授权是判断你能做什么"的基本概念，再从 Spring Security 的默认行为出发，逐步理解过滤器链如何保护接口。
> 一句话总结：Spring Security 通过过滤器链拦截请求，按认证和授权规则决定放行或拒绝；密码哈希、URL 保护和 CORS/CSRF 是 Web 安全的基本配置。

前面 20 多章搭建的 Web 服务中，任何人访问任何接口都能拿到响应。生产环境中，需要限制谁可以调用什么接口。这涉及两个独立的概念：先知道你是谁，再判断你能做什么。

## 一、身份与权限是两个独立概念

[[认证]]（Authentication）回答"你是谁"。常见的认证方式是用户名和密码登录，或者出示一张有效的令牌。

[[授权]]（Authorization）回答"你能做什么"。认证成功后，系统还要判断当前用户是否有权限执行当前操作。例如：登录成功的普通用户不能删除别人的订单。

两个概念分开的好处：认证方式可以换（从密码换成指纹或 JWT 令牌），授权规则可以独立调整（管理员今天可以删除，明天规则改成只有超管才能删除），两者互不绑定。

在 HTTP 协议层面，认证信息通常通过请求头传递。第 17 章讲过，HTTP 是无状态的——服务器不会自动记得上一个请求是谁发的。所以每个请求都需要携带身份凭证：

```text
GET /orders/42 HTTP/1.1
Authorization: Bearer eyJhbGciOi...
```

`Authorization` 是标准请求头，`Bearer` 表示"持有者出示这张令牌"。第 31 章会详细讲 JWT 令牌的结构和验证。本章先用用户名/密码方式理解认证的基本流程。

## 二、过滤器链在做什么

第 18 章讲过，Spring MVC 的 DispatcherServlet 是所有请求的中央分发器。但实际上请求到达 DispatcherServlet 之前，还要经过一条[[过滤器链]]（Filter Chain）。

```text
HTTP 请求
  → Filter A（例如：记录日志）
  → Filter B（例如：检查认证状态）
  → Filter C（例如：检查权限）
  → DispatcherServlet（匹配 Controller）
  → Controller 方法执行
  → 响应原路返回，经过相同的 Filter
```

Filter 是 Java Servlet 规范中的组件。它可以：

- 在请求到达 Controller 之前执行检查。
- 修改请求或响应。
- 直接拦截请求并返回错误（不经过 Controller）。

Spring Security 的核心就是一组 Filter。它把自己插入到过滤器链中，负责：

1. **SecurityContextPersistenceFilter**：读取或创建安全上下文。
2. **UsernamePasswordAuthenticationFilter**：处理用户名/密码登录请求。
3. **ExceptionTranslationFilter**：把安全相关的异常转换为 HTTP 响应。
4. **FilterSecurityInterceptor**：检查当前请求是否有权限访问目标资源。

学习者不需要手动配置这些 Filter 的顺序。Spring Security 通过 `spring-boot-starter-security` 自动注册它们。

## 三、从默认配置开始

### 3.1 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

只需这一个 starter。它自动引入 Spring Security 的全部组件，并配置好默认的过滤器链。

### 3.2 默认行为

引入 `spring-boot-starter-security` 后，不做任何配置，你的服务立即发生以下变化：

- 所有接口都需要认证才能访问。
- 启动时控制台输出一行随机密码：`Using generated security password: 8a3f...`。
- 默认用户名是 `user`。
- 提供用户名和密码后，浏览器会自动跳转到之前请求的页面。
- `/logout` 路径可以登出。

使用 curl 验证未认证的请求被拒绝：

```bash
curl -i http://localhost:8080/todos
```

响应：

```text
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Realm"
```

`401` 表示请求缺少有效的认证信息。`WWW-Authenticate` 头告诉客户端"你需要提供认证凭据"。带上用户名和密码再请求：

```bash
curl -i -u user:8a3f... http://localhost:8080/todos
```

`-u` 参数让 curl 自动添加 `Authorization: Basic ...` 请求头。`Basic` 后面是将 `user:password` 进行 Base64 编码的结果。

响应正常返回 `200`。`Basic` 认证适合 curl 测试和内部工具调用，浏览器场景中更常用的是表单登录和 JWT（第 31 章）。

## 四、用 SecurityFilterChain 定制规则

### 4.1 第一个安全配置

创建配置类：

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/todos/**").authenticated()
                .anyRequest().permitAll()
            )
            .httpBasic(httpBasic -> {});  // 启用 HTTP Basic 认证

        return http.build();
    }
}
```

逐行解释：

- `@Configuration` 标记这是一个配置类，Spring 会读取其中的 Bean 定义。
- `@EnableWebSecurity` 启用 Spring Security 的 Web 安全支持。
- `securityFilterChain(HttpSecurity http)` 返回一个 `SecurityFilterChain` Bean，Spring Security 用它替换默认的过滤器链。
- `authorizeHttpRequests` 开始定义授权规则。
- `.requestMatchers("/todos/**").authenticated()` 表示匹配 `/todos/` 及其子路径的请求必须经过认证。
- `.anyRequest().permitAll()` 表示其他所有请求不需要认证。
- `.httpBasic(httpBasic -> {})` 启用 HTTP Basic 认证方式。
- `http.build()` 将所有配置打包成一个生效的过滤器链。

现在 `/todos` 需要认证，`/welcome` 等公开路径无需认证。

### 4.2 匹配规则

`requestMatchers` 支持多种匹配方式：

```java
.requestMatchers("/admin/**").hasRole("ADMIN")     // 需要 ADMIN 角色
.requestMatchers("/api/users/**").hasAnyRole("ADMIN", "USER") // ADMIN 或 USER
.requestMatchers(HttpMethod.POST, "/api/orders").authenticated() // POST 需认证
.requestMatchers(HttpMethod.GET, "/api/products/**").permitAll() // GET 公开
```

匹配规则按声明顺序检查，第一条匹配的规则生效。因此更具体的规则放在前面，通用的放在后面：

```java
.requestMatchers("/admin/secret").hasRole("SUPER_ADMIN")  // 先匹配具体路径
.requestMatchers("/admin/**").hasRole("ADMIN")             // 再匹配宽泛路径
```

如果写反了，`/admin/secret` 会被 `/admin/**` 提前匹配，`SUPER_ADMIN` 的限制永远不被检查。

## 五、密码不能明文保存

### 5.1 为什么不能用明文

如果数据库中直接存明文密码，任何有数据库访问权限的人都能看到所有用户的真实密码。密码在传输、存储和日志中都应该被保护。

正确做法是存储密码的[[哈希值]]——通过单向数学函数计算出的固定长度字符串。哈希有三个特征：

1. 同一个输入总是得到同一个输出（确定性）。
2. 从输出无法反推输入（单向性）。
3. 输入微小改变会导致输出完全不同（雪崩效应）。

用户登录时，系统对输入的密码做相同的哈希，比较结果是否与存储的哈希值一致。即使数据库泄露，攻击者得到的也是哈希值而非原始密码。

### 5.2 BCrypt 和 PasswordEncoder

Spring Security 使用 `BCryptPasswordEncoder` 作为默认的密码编码器：

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

`PasswordEncoder` 接口有两个核心方法：

- `encode(rawPassword)` 对明文密码做哈希。
- `matches(rawPassword, encodedPassword)` 检查明文是否匹配已存储的哈希。

BCrypt 的哈希结果包含盐值和计算强度的参数，格式类似：

```text
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

`$2a` 是算法版本，`$10` 是计算强度（10 次迭代），后面是盐值和哈希值的组合。每次调用 `encode` 会产生不同的盐值，因此同样的密码两次 `encode` 的结果不同，但 `matches` 能正确比对。

### 5.3 在内存中定义用户

```java
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Bean
public UserDetailsService userDetailsService(PasswordEncoder encoder) {
    var admin = User.withUsername("admin")
        .password(encoder.encode("admin123"))
        .roles("ADMIN")
        .build();

    var user = User.withUsername("user")
        .password(encoder.encode("user123"))
        .roles("USER")
        .build();

    return new InMemoryUserDetailsManager(admin, user);
}
```

`InMemoryUserDetailsManager` 把用户信息保存在内存中，适合开发和演示。生产环境中应使用数据库或 LDAP 作为用户信息来源。

## 六、SecurityContext：登录后的身份载体

认证成功后，Spring Security 将用户身份保存在[[SecurityContext]]中。它通过 `SecurityContextHolder` 获取：

```java
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

@GetMapping("/whoami")
public String whoami() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !auth.isAuthenticated()) {
        return "未登录";
    }
    return "当前用户：" + auth.getName() + "，角色：" + auth.getAuthorities();
}
```

`SecurityContextHolder` 默认使用 `ThreadLocal` 存储安全上下文——每个线程有自己的副本。这意味着同一个请求内的所有方法调用（Controller→Service→Repository）都能通过 `SecurityContextHolder` 获取当前用户，不需要逐层传递参数。

## 七、方法级授权

对于更细粒度的权限控制，可以使用方法注解：

```java
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteOrder(String orderId) {
        // 只有 ADMIN 角色的用户能调用这个方法
    }

    @PreAuthorize("#username == authentication.name")
    public List<Order> findMyOrders(String username) {
        // 只能查询自己的订单
    }
}
```

要启用方法级授权，需要在配置类上添加 `@EnableMethodSecurity`：

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig { ... }
```

`@PreAuthorize` 使用 SpEL（Spring Expression Language）表达式。`hasRole('ADMIN')` 检查当前用户是否有 ADMIN 角色，`#username == authentication.name` 检查传入的参数是否等于当前登录用户名。

### 7.2 @PostAuthorize 与过滤

`@PreAuthorize` 在方法执行前检查。`@PostAuthorize` 在方法执行后检查——适合需要根据返回结果判断权限的场景：

```java
@PostAuthorize("returnObject.createdBy == authentication.name")
public Order getOrder(String orderId) {
    return orderRepository.findById(orderId);
}
```

方法执行后，SpEL 表达式中的 `returnObject` 是方法的返回值。这里检查订单的创建者是否是当前用户——即使订单存在，如果创建者不匹配，也返回 403。

过滤集合中的元素：

```java
@PostAuthorize("hasRole('ADMIN')")
public List<Order> getAllOrders() {
    // 返回所有订单，但非 ADMIN 用户访问时触发 403
}

// 更好的方式：过滤而不是拒绝
@PreAuthorize("hasRole('USER')")
public List<Order> getMyOrders() {
    // 在 Service 层按当前用户过滤
    String username = SecurityContextHolder.getContext().getAuthentication().getName();
    return orderRepository.findByCreatedBy(username);
}
```

`@PostAuthorize` 适合"能读记录，但要检查记录归属"的场景。`@PreAuthorize` 适合"某些角色才能调用这个方法"的场景。

## 八、CORS 与 CSRF 的基本边界

### 8.1 CORS：跨域请求

当浏览器中的前端页面（`http://localhost:3000`）向另一个域的后端（`http://localhost:8080`）发请求时，浏览器会先发送一个 OPTIONS 预检请求，检查服务器是否允许跨域。Spring Security 默认允许配置 CORS：

```java
http.cors(cors -> {});
```

然后在 `application.yml` 或 `@Bean` 中配置允许的域。CORS 不是安全防护——它只是浏览器的同源策略机制，非浏览器客户端完全不受 CORS 限制。

### 8.2 CSRF：跨站请求伪造

[[CSRF]]（Cross-Site Request Forgery）是一种攻击方式：受害者登录了银行网站后，访问了恶意站点的页面，恶意页面悄悄向银行网站提交转账请求，利用了受害者浏览器中仍然有效的登录 Cookie。

Spring Security 默认开启 CSRF 防护：要求状态改变请求（POST/PUT/DELETE）携带一个 CSRF Token，服务器验证 Token 是否匹配。对于纯 REST API（无 Cookie 认证，只使用 `Authorization: Bearer` 令牌），CSRF 攻击不适用，可以关闭：

```java
http.csrf(csrf -> csrf.disable());
```

**关闭 CSRF 的前提是 API 不使用 Cookie 作为认证机制。** 如果使用 Cookie 或 Session 认证，必须保留 CSRF 防护。

## 九、练习与验收

### 练习 1：默认安全观察

引入 `spring-boot-starter-security`，不做任何配置。观察：

1. 未认证访问 `/todos` 返回什么状态码和头信息？
2. 用生成的随机密码通过 `-u user:password` 访问，返回什么？
3. `/welcome`（假设未在 Controller 中声明路径）返回什么？

完成标准：能解释 401 的含义和 `WWW-Authenticate` 头的用途。

### 练习 2：定制保护规则

实现以下规则：

- `/api/public/**` 所有人可访问
- `/api/orders/**` 需要认证
- `/api/admin/**` 需要 ADMIN 角色
- 创建两个内存用户：admin（ADMIN 角色）和 user（USER 角色）

用 curl 验证：admin 能访问所有接口；user 能访问 `/api/orders` 但被 `/api/admin` 拒绝；无认证用户只能访问 `/api/public`。

### 练习 3：密码安全对比

用 BCryptPasswordEncoder 对同一个密码编码两次，验证：

1. 两次 `encode` 的结果不同（盐值不同）。
2. 两次编码结果都能通过 `matches` 验证。
3. 修改密码中的一个字符，`matches` 返回 false。

## 常见误区

### 把认证和授权混为一谈

"这个人有没有登录"和"这个人能不能做某事"是两个独立判断。登录成功后不代表所有操作都被允许；没有特定权限也不代表需要重新登录。

### 在生产环境使用随机密码

随机密码只在首次启动时生成，重启后变化。生产环境必须使用数据库或外部身份服务管理用户。

### 关闭 CSRF 但不理解前提

"REST API 不需要 CSRF"成立的前提是 API 只使用 `Authorization: Bearer` 令牌，不使用 Cookie 或 Session。如果前端通过 Cookie 携带 JSESSIONID，关闭 CSRF 会暴露风险。

### 在配置中把具体路径写在通配符后面

Spring Security 按顺序匹配规则。`"/admin/**"` 应该放在 `"/admin/secret"` 之后，否则具体路径被通配符提前匹配。

## 本章小结

Spring Security 通过一组 Filter 在请求到达 Controller 之前执行认证和授权检查。引入 starter 后默认所有接口需要认证，提供随机密码。SecurityFilterChain Bean 定制授权规则，按声明顺序匹配路径。BCryptPasswordEncoder 对密码做不可逆哈希，每次编码产生不同盐值但能正确匹配。SecurityContext 在整个请求线程中携带登录用户信息。CSRF 防护在 Cookie 认证场景中必须保留，纯 Bearer Token API 可关闭。下一章将用 JWT 令牌替代 Basic 认证，实现无状态的 API 身份验证。

## 快速自测

1. 认证和授权分别回答什么问题？
2. Spring Security 的过滤器链在请求到达 Controller 之前还是之后执行？
3. BCrypt 的 `encode` 两次对同一个密码编码，结果相同吗？`matches` 能正确验证吗？
4. CSRF 在什么条件下可以安全关闭？
5. `requestMatchers("/admin/**").hasRole("ADMIN")` 和 `requestMatchers("/admin/secret").hasRole("SUPER")` 应该谁写在前？

参考答案：认证回答"你是谁"，授权回答"你能做什么"；在到达 Controller 之前；两次编码结果不同（盐值不同），但 `matches` 都能正确验证；API 只使用 `Authorization: Bearer` 令牌、不使用 Cookie 认证时可以关闭；`/admin/secret` 必须写在前面，否则通配符提前匹配。

## 参考文献

- Spring Security. [Architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html).
- Spring Security. [Security Filter Chain](https://docs.spring.io/spring-security/reference/servlet/configuration/java.html).
- OWASP. [CSRF Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
- OWASP. [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
