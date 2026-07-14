# 第 31 章　JWT 登录与统一身份平台

> 学习提示：先理解 JWT 的"三段结构 + 签名"是什么，再看 Spring Security 怎么解析和验证它；不要在没理解 JWT 本体之前就复制安全配置。
> 一句话总结：JWT 是一种自包含的令牌格式，由头部、负载和签名三部分组成；Spring Security 作为 Resource Server 验证令牌后设置 SecurityContext；自签发和统一身份平台路由各有责任边界。

第 30 章的 HTTP Basic 认证每次都发送用户名和密码，密码在网络中传输的频率太高。而且服务器每次都要查数据库验证。对于 API 场景，更常见的做法是：先登录一次获取一张令牌（[[Token]]），后续请求只携带令牌，不再传密码。

## 一、Token 解决什么传递问题

HTTP 是无状态的。每次请求要告诉服务器"我是谁"，但不能每次都把密码明文传到网络中。Token 方案把认证分成两步：

```text
步骤 1：登录
  客户端 → POST /login {username, password}
  服务器 → 验证成功，返回 Token

步骤 2：后续请求
  客户端 → GET /orders  [Authorization: Bearer <Token>]
  服务器 → 验证 Token，不需要查数据库
```

Token 替代了密码在网络中的反复传输。服务器收到 Token 后，能直接从 Token 中读出用户信息，不需要每次查数据库。前提是 Token 没有被伪造——这靠密码学签名保证。

## 二、JWT 的三段结构

[[JWT]]（JSON Web Token）是 RFC 7519 定义的一种 Token 格式。它由三段 Base64URL 编码的字符串组成，用 `.` 分隔：

```text
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc0MjQwMDAwMH0.5qX...
|_______ 头部 ________|____________ 负载 _____________|____ 签名 ____|
```

### 2.1 头部（Header）

Base64URL 解码后是一个 JSON 对象：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg` 是签名算法。`HS256` 表示 HMAC-SHA256，使用同一个密钥签名和验证。`RS256` 表示 RSA-SHA256，使用私钥签名公钥验证，适合统一身份平台场景。
- `typ` 通常是 `"JWT"`。

头部不包含敏感信息，只是告诉验证方"用什么算法验证签名"。

### 2.2 负载（Payload）

负载包含[[声明]]（Claims），即 Token 中携带的信息：

```json
{
  "sub": "admin",
  "iat": 1710000000,
  "exp": 1710086400,
  "role": "ADMIN"
}
```

常见声明：

| 声明 | 全称 | 含义 |
| --- | --- | --- |
| `sub` | Subject | Token 的主体，通常是用户 ID |
| `iat` | Issued At | Token 签发时间（Unix 秒数） |
| `exp` | Expiration | Token 过期时间（Unix 秒数） |
| `iss` | Issuer | 签发者标识 |
| `aud` | Audience | 接收方标识 |
| `role` | 自定义 | 用户角色（非标准声明） |

`sub`、`iat`、`exp`、`iss`、`aud` 是 RFC 7519 规定的注册声明。`role` 是自定义的私有声明。不要将自定义声明用与标准声明相同的名字，以避免语义混淆。

### 2.3 签名

签名的作用不是加密——负载是 Base64URL 编码的，任何人拿到 Token 都能解码读内容。签名的作用是防止[[篡改]]：

```text
签名 = HMAC-SHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    secretKey
)
```

如果有人修改了负载中的 `sub` 从 `"user"` 改成 `"admin"`，签名就对不上。服务器验证时就会拒绝。

如果把 payload 解码后修改再编码，签名字段必须重新计算——但攻击者没有密钥（HMAC 方案）或私钥（RSA 方案），算不出正确的签名。这就是 JWT 安全性的核心。

## 三、签名与验证

### 3.1 HMAC 对称签名

HS256 使用同一个密钥签名和验证。服务端持有密钥，签发 Token 时用密钥签名，验证时用同一密钥验签。适合单体服务或内部服务之间的通信——只有持有密钥的服务能签发有效 Token。

### 3.2 RSA 非对称签名

RS256 使用私钥签名、公钥验证。身份平台持有私钥签发 Token，所有业务服务持有公钥验证。这样身份平台被攻破才会泄露签发能力，业务服务只能验证不能签发。

非对称签名的优势：

- 多个服务共享同一套验证逻辑，不用分发共享密钥。
- 私钥不离开身份平台，减少泄露面。
- 密钥轮换时只需更新公钥。

### 3.3 验证步骤

收到 JWT 后，验证方按以下顺序检查：

1. 解析三段，提取 Header 和 Payload。
2. 检查 `alg` 是否在允许的算法列表中（不允许 `none` 算法）。
3. 用对应密钥验证签名。
4. 检查 `exp`：当前时间是否已超过过期时间。
5. 检查 `iat`：签发时间是否在合理范围内（可选，防止使用过早签发的 Token）。
6. 检查 `iss` 和 `aud`：签发者和接收方是否匹配预期（可选）。

任何一步失败，整个 Token 视为无效。顺序不能颠倒——签名验证没有通过就检查过期时间没有意义，因为过期时间可能已被篡改。

## 四、JWT 在 Spring Security 中的位置

### 4.1 Resource Server 模式

Spring Security 支持 Resource Server 模式：服务本身不签发 JWT，只验证请求中的 JWT 并从中提取用户信息。这符合"签发和验证分离"的安全设计。

依赖：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

### 4.2 最小验证配置

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com
```

或者直接指定公钥位置：

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          public-key-location: classpath:public-key.pem
```

Spring Security 自动配置验证链路：

1. 从请求的 `Authorization: Bearer ...` 头提取 JWT。
2. 用配置的公钥或从 issuer-uri 获取的公钥验证签名。
3. 验证 `exp`、`iss` 等声明。
4. 从 `sub` 提取用户名，从 `scope` 或自定义声明提取权限。
5. 创建 `Authentication` 对象并设置到 SecurityContext。

### 4.3 自定义 JWT 声明映射

当 Token 中的声明名不符合默认约定时，自定义映射：

```java
@Bean
public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter grantedAuthorities = new JwtGrantedAuthoritiesConverter();
    grantedAuthorities.setAuthorityPrefix("ROLE_");
    grantedAuthorities.setAuthoritiesClaimName("roles"); // Token 中权限声明叫 "roles"

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(grantedAuthorities);
    return converter;
}
```

这样 Spring Security 从 `roles` 声明（而不是默认的 `scope`）中读取角色信息。

## 五、自签发与统一身份平台

### 5.1 自签发方案

服务自己签发 JWT：

```text
POST /login
  → 验证用户名密码
  → 生成 JWT（服务端的密钥签名）
  → 返回 JWT

后续请求
  → 验证 JWT（同一密钥）
  → 提取用户信息
```

自签发适合：

- 单体服务或内部工具。
- 没有独立的身份平台。
- 用户量较小，不需要统一登录。

风险：

- 每个服务都要管理密钥。
- 多个服务之间的单点登录难以实现。
- 密钥泄露后需要更新所有服务的验证逻辑。

### 5.2 统一身份平台方案

公司有独立的身份平台（如 Keycloak、Auth0、自研 SSO）：

```text
POST /auth/realms/myapp/login  (身份平台)
  → 验证用户名密码
  → 返回 JWT（身份平台的私钥签名）

后续请求业务服务
  → 业务服务使用公钥验证 JWT
  → 不接触用户密码
```

统一身份平台的优势：

- 密码只在身份平台处理，业务服务永远不接触密码。
- 多个服务共享同一套登录状态（单点登录）。
- 权限、角色和用户信息由身份平台统一管理。
- 密钥轮换对业务服务透明。

### 5.3 两种方案的选择

| 考虑因素 | 自签发 | 统一身份平台 |
| --- | --- | --- |
| 适用规模 | 1-2 个服务 | 多个服务 |
| 密码管理 | 服务自己存 | 身份平台存 |
| 单点登录 | 需自行实现 | 平台原生支持 |
| 密钥管理 | 每个服务自己管 | 平台集中管理 |
| 接入成本 | 低 | 需要平台搭建或采购 |

课程以自签发为主线建立 JWT 的完整认知。理解自签发的验证链路后，切换到统一身份平台只是把"签名密钥"换成"公钥"和"issuer-uri"的配置变化。

## 六、Token 刷新与吊销

### 6.1 过期与刷新

JWT 一旦签发就无法修改。如果 Token 有效期很长，被盗后攻击者可以长时间冒充用户。如果有效期很短，用户频繁重新登录。

[[刷新令牌]]（Refresh Token）解决这个问题：

- Access Token：有效期短（5-15 分钟），直接携带在 API 请求中。
- Refresh Token：有效期长（数小时或数天），仅用于获取新的 Access Token，不直接用于 API 请求。

```text
1. 登录 → 同时发放 Access Token + Refresh Token
2. API 请求 → 携带 Access Token
3. Access Token 过期 → 使用 Refresh Token 换取新的 Access Token
4. Refresh Token 过期或被盗 → 需要重新登录
```

Refresh Token 的使用频率低、传输路径少，暴露面比 Access Token 小。

### 6.2 实现 Access Token + Refresh Token

```java
// 登录接口返回两个 Token
public record LoginResponse(
    String accessToken,   // 15 分钟有效
    String refreshToken,  // 7 天有效
    long expiresIn        // accessToken 的剩余秒数
) {}

@PostMapping("/auth/refresh")
public LoginResponse refresh(@RequestBody RefreshRequest request) {
    // 1. 验证 Refresh Token 的签名和过期时间
    Claims claims = jwtValidator.validate(request.refreshToken());
    if (claims == null) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token 无效");
    }

    // 2. 检查 Refresh Token 是否已被吊销
    if (tokenBlacklist.isRevoked(request.refreshToken())) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token 已吊销");
    }

    // 3. 签发新的 Access Token
    String newAccessToken = jwtIssuer.issue(
        claims.getSubject(),
        claims.get("role", String.class),
        Duration.ofMinutes(15)
    );

    return new LoginResponse(newAccessToken, request.refreshToken(), 900);
}
```

Refresh Token 的验证流程与 Access Token 相同（验签、查过期），区别在于它不直接用于 API 请求，只在 `/auth/refresh` 接口中使用一次。这意味着即使 Refresh Token 被盗，攻击者也需要在被用户发现之前使用它换取新的 Access Token。

### 6.3 吊销问题

JWT 在签发后无法主动"撤销"——它是自包含的，不依赖服务端状态。如果需要在 Token 过期前使其失效，必须用额外机制：

- **黑名单**：在 Redis 或数据库中维护已吊销的 Token 列表，验证时额外检查。这本质上把无状态 Token 变成了有状态。
- **短有效期**：将 Access Token 有效期设得很短（如 5 分钟），借助过期机制自然吊销。
- **版本号**：在用户表中维护 token_version，JWT 中包含版本号。用户修改密码时递增版本号，旧版本 Token 全部失效。

Token 吊销的本质是在无状态设计中引入有状态的判断点。在建立 JWT 方案时，需要明确哪些场景必须支持吊销、能接受的延迟（黑名单多了需要查 Redis）以及维护成本。

### 6.4 密钥轮换

JWT 的签名密钥需要定期更换。密钥轮换时，旧 Token（用旧密钥签发）在一定时间窗口内仍应被接受：

```java
public class JwtValidator {
    private final Key currentSigningKey;   // 当前使用的签名密钥
    private final Key previousSigningKey;  // 上一轮签名密钥（轮换过渡期使用）

    public Claims validate(String token) {
        // 先用当前密钥验证
        try {
            return parseWithKey(token, currentSigningKey);
        } catch (JwtException e) {
            // 失败则尝试上一轮密钥
            return parseWithKey(token, previousSigningKey);
        }
    }
}
```

轮换窗口通常设为 Token 有效期的 2-3 倍，确保所有旧 Token 在过期前仍然能验证。身份平台（如 Keycloak）通常自动处理密钥轮换，通过 JWKS（JSON Web Key Set）端点暴露公钥，业务服务定期拉取最新的公钥集合。

### 6.5 浏览器中 JWT 的存储选择

单页应用（SPA）需要在前端存储 JWT。三种主要方式各自的权衡：

| 存储方式 | XSS 风险 | CSRF 风险 | 备注 |
| --- | --- | --- | --- |
| `localStorage` | 高（JS 可读） | 无（不自动发送） | 最方便但 XSS 后 Token 直接暴露 |
| `sessionStorage` | 高（同上） | 无 | 关闭标签后清除，无法实现"保持登录" |
| `httpOnly` Cookie | 低（JS 不可读） | 需 CSRF 防护 | 最安全但需后端配合设置 Cookie |

`httpOnly` Cookie 是安全性最高的选择：JavaScript 无法读取（抵御 XSS 窃取），但需要配置 `SameSite=Strict` 或 CSRF Token 应对跨站请求。每项选择各有权衡，团队需根据威胁模型和业务需求决定。

## 七、练习与验收

### 练习 1：解析 JWT

使用在线工具或命令行工具，解析以下 JWT 的 Header 和 Payload（不需要验证签名）：

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiIsImV4cCI6OTk5OTk5OTk5OX0.xxx
```

Base64URL 解码提示：`echo "eyJzdWIiOiJhZG1pbiJ9" | base64 -d`（macOS 需要 `-D`）。记录 sub、role、exp 的值。

### 练习 2：篡改验证

用 HMAC-SHA256 和固定 Secret 签发一个最小 JWT。然后：

- 修改 Payload 中的 `sub`，重新 Base64URL 编码但不改签名 → 验证失败。
- 保留原始 JWT 不变 → 验证成功。

用代码或脚本实现。理解为什么修改内容后验证一定会失败。

### 练习 3：设计 API 认证流程

为一个待办事项 API 设计完整的 JWT 认证流程：

1. 登录接口 `POST /auth/login`：接收 username 和 password，返回 Access Token（15 分钟过期）+ Refresh Token（7 天过期）。
2. 刷新接口 `POST /auth/refresh`：接收 Refresh Token，返回新的 Access Token。
3. 业务接口：验证 Access Token 中的 `sub`，只允许用户访问自己的待办项。

画出请求流程图，标出每个步骤中 Token 携带在什么位置。

## 常见误区

### 把 JWT 当作加密

Base64URL 编码不是加密，只是让二进制数据能安全通过文本协议传输。任何人拿到 JWT 都能解码读 Head 和 Payload。不要在 JWT 中存放密码、信用卡号等敏感信息。需要加密内容时，使用 JWE（JSON Web Encryption），它是对 JWT 的加密扩展。

### 忽略算法验证

如果验证方不检查 `alg` 字段，攻击者可以将算法设为 `none`，然后去掉签名部分。Spring Security 的默认配置不允许 `none` 算法，但自定义验证逻辑时必须显式排除。

### 把 Access Token 有效期设得太长

"反正也是 HTTPS 传输，设 24 小时也无所谓"——但如果 Access Token 被盗（通过日志、浏览器存储或网络抓包），攻击者在 24 小时内都能冒充用户。设短有效期（≤15 分钟），配合 Refresh Token 换取新 Token。

### 混淆自签发和统一身份平台的责任边界

自签发意味着你的服务负责密码验证、Token 签发和密钥管理。统一身份平台意味着这些责任在外部系统中。不能把自签发方案的密钥暴露给多个团队，然后称它为"统一平台"。

## 本章小结

JWT 通过三段结构（头部、负载、签名）实现自包含的身份令牌。签名保证 Token 未被篡改，但不加密内容。Spring Security 的 Resource Server 模式自动验证 JWT 并设置 SecurityContext。自签发方案适合单体服务，统一身份平台适合多服务架构。Token 过期和刷新分离了短期经常使用的 Access Token 和长期偶尔使用的 Refresh Token。Token 吊销需要额外的有状态机制（黑名单、版本号）。下一章学习 Redis 缓存——如何减少数据库的重复查询以及缓存一致性策略。

## 快速自测

1. JWT 的三个部分分别是什么？用什么字符分隔？
2. Base64URL 编码的 Payload 是加密的吗？为什么不能在此存放密码？
3. HS256 和 RS256 的主要区别是什么？
4. Access Token 和 Refresh Token 分别为什么有效期不同？
5. JWT 签发后能在服务端直接"撤销"吗？如果需要立即失效怎么做？

参考答案：头部、负载、签名，用 `.` 分隔；不是加密，只是编码，任何人可解码，不应放密码等敏感信息；HS256 用同一个密钥签名和验证，RS256 用私钥签名公钥验证；Access Token 频繁传输需要短有效期减少泄露风险，Refresh Token 使用频率低可设更长有效期；不能直接撤销，需用黑名单或版本号等有状态机制。

## 参考文献

- IETF. [RFC 7519：JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519).
- IETF. [RFC 7517：JSON Web Key](https://www.rfc-editor.org/rfc/rfc7517).
- Spring Security. [OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html).
- Auth0. [JWT Introduction](https://jwt.io/introduction).
