# 第 32 章　Redis 缓存与一致性

> 学习提示：先理解"缓存命中、未命中和过期"三个最基本的状态，再按 cache-aside 模式设计读写路径；不要一开始就打开 Spring Cache 的完整注解配置。
> 一句话总结：缓存是用少量快速存储减轻慢速数据源的重复查询压力；Redis 是最常用的外部缓存，cache-aside 模式让应用自己控制缓存的读写和失效；穿透、击穿、雪崩是三类需要分别处理的缓存故障。

第 20 章的分层架构中，TodoService 每次都调 `TodoRepository.findById()`。如果 1000 个用户同时查询同一个热门商品，这一行代码要对数据库执行 1000 次查询。缓存可以把"查一次"的结果保存起来，后续请求直接从缓存读取，不碰数据库。

## 一、缓存的基本概念

[[缓存]]是把计算结果或查询结果存放到比原数据源更快的存储中。后续相同请求直接从缓存读取，跳过原本较慢的计算或查询。

三个基本状态决定每次读取的行为：

| 状态 | 含义 | 发生条件 | 后续动作 |
| --- | --- | --- | --- |
| [[缓存命中]] | 缓存中有需要的数据 | 数据已被写入且未过期 | 直接返回缓存数据 |
| [[缓存未命中]] | 缓存中没有需要的数据 | 首次查询或数据已过期 | 查数据库，写入缓存后返回 |
| [[缓存过期]] | 缓存中的数据超过了 TTL | 距离写入时间超过设定的 TTL | 视为未命中 |

[[TTL]]（Time To Live）是数据在缓存中的存活时间。TTL 过短则命中率低，过长则可能返回过时数据。TTL 的选择是业务决策：高频访问、很少变化的数据可以设长一些（分钟级到小时级），实时性要求高的数据设短一些（秒级到分钟级）。

## 二、Redis 是什么

[[Redis]]是一个内存中的键值存储系统。它的所有数据默认存在内存中，因此读写速度比磁盘数据库快几个数量级。Redis 支持多种数据结构：

| 类型 | 用途 | 示例 |
| --- | --- | --- |
| String | 缓存单个值 | `SET product:42 '{"name":"book"}'` |
| Hash | 缓存对象的多个字段 | `HSET product:42 name "book" price 99` |
| List | 队列、最近记录 | `LPUSH events "order_created"` |
| Set | 去重集合 | `SADD tags:article1 java web` |
| Sorted Set | 排行榜、延迟队列 | `ZADD leaderboard 100 "player1"` |

课程以 String 类型为主线，因为缓存 JSON 字符串是最通用的场景。

### 2.1 Redis 基本命令

```bash
# 写入键值，EX 设置过期时间（秒）
SET product:42 '{"name":"book","price":99}' EX 300

# 读取
GET product:42

# 检查是否存在
EXISTS product:42

# 删除
DEL product:42

# 查看剩余 TTL
TTL product:42

# 设置过期时间
EXPIRE product:42 600
```

`EX 300` 表示 5 分钟后自动删除。`TTL` 返回 -1 表示永不过期，-2 表示键不存在。

### 2.2 Key 命名规范

```text
业务名:对象类型:标识符
product:detail:42        // 商品详情
user:session:abc123      // 用户会话
order:status:20260714    // 某天的订单状态
```

使用冒号分隔的好处是 Redis 客户端工具可以按前缀分组展示，便于管理和调试。

## 三、cache-aside 模式

[[cache-aside]]（旁路缓存）是最常用的缓存模式：**应用自己负责缓存的读取和更新，缓存不自动与数据库同步。**

### 3.1 读取路径

```java
public Product getProduct(String productId) {
    // 1. 先查缓存
    String cached = redisTemplate.opsForValue().get("product:" + productId);
    if (cached != null) {
        return parseJson(cached); // 缓存命中，直接返回
    }

    // 2. 缓存未命中，查数据库
    Product product = productRepository.findById(productId);
    if (product == null) {
        return null; // 或抛异常
    }

    // 3. 写入缓存，设置 TTL
    String json = toJson(product);
    redisTemplate.opsForValue().set("product:" + productId, json, 5, TimeUnit.MINUTES);

    return product;
}
```

关键点：

- 缓存命中 → 返回，不查数据库。
- 缓存未命中 → 查数据库 → 写入缓存 → 返回。
- 写入缓存时设置 TTL，防止数据永不更新。

### 3.2 更新路径

数据在数据库中修改后，缓存必须失效或更新，否则返回旧数据：

```java
@Transactional
public Product updateProduct(String productId, UpdateRequest request) {
    // 1. 更新数据库
    Product updated = productRepository.update(productId, request);

    // 2. 删除缓存（而不是更新缓存）
    redisTemplate.delete("product:" + productId);

    return updated;
}
```

**为什么删除缓存而不是更新缓存？** 因为数据库更新和缓存更新不是原子操作。如果两个并发的数据库更新以不同的顺序写入缓存，缓存中的最终值可能与数据库不一致。删除缓存更简单：下次读取时缓存未命中，自动从数据库拉取最新值写入缓存。

这就是 cache-aside 的核心规则：**读时写入缓存，写时删除缓存。**

### 3.3 Spring Data Redis 集成

Spring Boot 通过 `spring-boot-starter-data-redis` 自动配置 `RedisTemplate` 和 `StringRedisTemplate`。在 `application.yml` 中配置连接：

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
```

`StringRedisTemplate` 是 `RedisTemplate<String, String>` 的便捷子类，适合缓存 JSON 字符串的常见场景：

```java
@Repository
public class ProductCacheRepository {
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    public ProductCacheRepository(StringRedisTemplate redis, ObjectMapper objectMapper) {
        this.redis = redis;
        this.objectMapper = objectMapper;
    }

    public Optional<Product> get(String productId) {
        String json = redis.opsForValue().get("product:" + productId);
        if (json == null) return Optional.empty();
        try {
            return Optional.of(objectMapper.readValue(json, Product.class));
        } catch (JsonProcessingException e) {
            // 缓存中的 JSON 无法反序列化，删除这条脏缓存
            redis.delete("product:" + productId);
            return Optional.empty();
        }
    }

    public void set(String productId, Product product, Duration ttl) {
        try {
            String json = objectMapper.writeValueAsString(product);
            redis.opsForValue().set("product:" + productId, json, ttl);
        } catch (JsonProcessingException e) {
            // 序列化失败不写入缓存
            log.warn("商品缓存序列化失败: {}", productId);
        }
    }

    public void delete(String productId) {
        redis.delete("product:" + productId);
    }
}
```

注意 `opsForValue()` 中的序列化异常处理。缓存操作失败不应该阻断主业务流程——缓存是优化手段，数据库是真实数据源。缓存不可用时降级为直接查数据库，缓存写入失败时记录日志并跳过。

### 3.4 缓存预热

服务刚启动时，缓存是空的。如果第一批请求全部未命中，数据库瞬间承受全部查询压力。

[[缓存预热]]在服务启动后批量加载热点数据到缓存中：

```java
@Component
public class CacheWarmer implements ApplicationRunner {
    private final ProductCacheRepository cache;
    private final ProductRepository productRepo;

    @Override
    public void run(ApplicationArguments args) {
        List<Product> hotProducts = productRepo.findHotProducts(100);
        for (Product product : hotProducts) {
            cache.set(product.getId(), product, Duration.ofMinutes(10));
        }
        log.info("预热完成，加载 {} 条热点商品", hotProducts.size());
    }
}
```

`ApplicationRunner` 在 Spring Boot 启动完成后执行。预热的数据范围需要根据业务选择——不是把所有数据都加载到缓存中，而是选择高频访问的"热点"数据。

### 3.5 Spring Cache 抽象与手动缓存的对比

Spring 提供 `@Cacheable`、`@CacheEvict`、`@CachePut` 注解，自动管理缓存的读写和失效：

```java
@Cacheable(value = "products", key = "#productId")
public Product getProduct(String productId) { ... }

@CacheEvict(value = "products", key = "#productId")
public Product updateProduct(String productId, UpdateRequest request) { ... }
```

声明式缓存的优势是代码简洁——只需要注解，不需要手动管理 `RedisTemplate`。劣势是失效策略不够灵活（如批量失效、条件缓存）和排错困难（缓存行为被隐藏）。

课程以手动 `RedisTemplate` 为主线，因为理解 cache-aside 的每一步有助于后续使用 Spring Cache 时知道注解背后实际发生了什么。如果项目对简单缓存的需求明确且不需要精细控制，Spring Cache 是更快的接入方式。

## 四、设计 Key 与过期

### 4.1 TTL 的选择

没有"正确"的 TTL，它的选择取决于业务的容忍度：

- **短 TTL（30 秒 – 5 分钟）**：适合变化较快的数据，如库存数量。数据变更后最多等 5 分钟就会更新。
- **中 TTL（5 分钟 – 1 小时）**：适合商品详情、用户资料等不频繁变化的数据。
- **长 TTL（1 小时 – 24 小时）**：适合字典数据、配置项。数据变化后可以考虑主动删除缓存，不等 TTL 到期。
- **永不过期**：极少使用。一旦数据变化，缓存必须被显式删除，否则永远返回旧数据。

### 4.2 批量和关系 Key

当一次数据库查询涉及多条记录时：

```java
// 按分类查商品列表
String cacheKey = "products:category:" + categoryId;

// 列表缓存通常设较短的 TTL，因为新增或删除商品后列表应尽快更新
redisTemplate.opsForValue().set(cacheKey, json, 2, TimeUnit.MINUTES);
```

当某个商品的详情变更时，除了删除 `product:42` 这个键，还需要删除所有包含该商品的列表缓存 `products:category:*`。通常使用按前缀批量删除或直接让列表缓存的短 TTL 自然过期。

### 4.3 序列化方式

把 Java 对象存入 Redis 需要先[[序列化]]为字节或字符串。两种常见方式：

```java
// JSON 字符串（可读、可调试）
String json = objectMapper.writeValueAsString(product);
redisTemplate.opsForValue().set(key, json, ttl, TimeUnit.SECONDS);

// Java 默认序列化（不可读、效率低、兼容性差）
redisTemplate.opsForValue().set(key, product, ttl, TimeUnit.SECONDS);
```

推荐使用 JSON 字符串。它可读、跨语言兼容，在 Redis CLI 中也能直接查看和调试。Java 默认序列化生成的二进制数据不可读，且修改 Java 类的包名或字段后可能反序列化失败。

## 五、面对三类缓存故障

### 5.1 缓存穿透

**现象**：查询一个不存在的数据，缓存中自然也没有。每次查询都穿透缓存直接打到数据库。

例如：用户查询 `productId = -1` 的商品，数据库中没有。下次另一个请求也查 `productId = -1`，缓存中仍没有（因为上次数据库返回 null 时没有写缓存），又一次穿透到数据库。攻击者可以构造大量不存在的 ID 使数据库压力骤增。

**应对**：

```java
if (product == null) {
    // 缓存空对象，TTL 较短
    redisTemplate.opsForValue().set(key, "NULL", 1, TimeUnit.MINUTES);
    return null;
}
```

缓存一个空值标记，TTL 短一些（1-2 分钟）。后续请求命中缓存（值是 "NULL"），不再查数据库。也可以在请求入口加布隆过滤器，对明显不存在的 ID 直接拒绝。

### 5.2 缓存击穿

**现象**：一个热点 Key 在过期的瞬间，大量请求同时发现缓存未命中，同时去查数据库。

例如：热门商品 `product:42` 的缓存过期了，而此时恰好有 500 个用户同时请求这个商品。500 个请求都发现缓存中没有，500 次数据库查询同时发生。

**应对**：

```java
// 在查数据库之前加互斥锁
String lockKey = "lock:product:" + productId;
Boolean locked = redisTemplate.opsForValue()
    .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);

if (Boolean.TRUE.equals(locked)) {
    try {
        // 只有一个线程能进入这里查询数据库
        Product product = productRepository.findById(productId);
        redisTemplate.opsForValue().set(cacheKey, toJson(product), 5, TimeUnit.MINUTES);
        return product;
    } finally {
        redisTemplate.delete(lockKey); // 释放锁
    }
} else {
    // 其他线程等待锁释放后重试读缓存
    Thread.sleep(100);
    String cached = redisTemplate.opsForValue().get(cacheKey);
    if (cached != null) return parseJson(cached);
}
```

互斥锁让只有一个请求去查数据库并重建缓存，其他请求等待或直接返回降级数据。

### 5.3 缓存雪崩

**现象**：大量缓存在同一时刻过期，或 Redis 服务不可用，导致所有请求直接打到数据库。

**应对**：

- **打散过期时间**：在 TTL 基础上加一个随机值。例如 5 分钟 ± 30 秒，让 Key 不同时过期：

```java
int baseSeconds = 300;
int randomOffset = ThreadLocalRandom.current().nextInt(60);
redisTemplate.opsForValue().set(key, json, baseSeconds + randomOffset, TimeUnit.SECONDS);
```

- **降级**：当 Redis 不可用时，服务可以返回缓存中的旧数据（如果有本地缓存）或返回默认值，而不是直接报错。
- **限流**：对数据库查询做并发限制，即使缓存全部失效，也不让数据库被瞬间冲垮。

### 5.4 缓存一致性的最终权衡

缓存和数据库永远不可能实时完全一致——因为它们是两个独立的存储系统，中间隔着网络和处理时间。你应该做的是：

1. 选择一致性能接受的最长 TTL。
2. 数据库更新时主动删除缓存。
3. 接受"数据可能有几秒到几分钟的延迟"这一事实。

对绝大多数业务（商品详情、用户资料、文章内容），几秒到几分钟的延迟是可以接受的。只有库存扣减、金融账户余额等场景需要更严格的方案，但那涉及分布式事务和不只基于缓存的并发控制。

## 六、练习与验收

### 练习 1：手动操作 Redis

使用 Redis CLI 完成以下操作：

```bash
SET product:1 '{"name":"book"}' EX 120
GET product:1
TTL product:1
DEL product:1
GET product:1
```

验证 DEL 后 GET 返回 `(nil)`。理解 TTL 的含义：DEL 后 TTL 返回什么？（答：-2，键不存在）

### 练习 2：实现 cache-aside 读取

用 Java 实现 `ProductService.getProduct(String id)`：

- 用 `RedisTemplate<String, String>` 操作 Redis。
- 采用 cache-aside 读取模式：先查 Redis，未命中时查数据库（模拟），命中时直接返回。
- 设置 5 分钟 TTL，过期时间加随机偏移（±30 秒）。

完成标准：第二次查询同一 ID 不调数据库（在日志中验证）；TTL 过期后重新查数据库。

### 练习 3：缓存故障防护

在练习 2 的基础上增加：

1. **穿透防护**：对不存在的数据缓存空值（TTL 2 分钟）。
2. **Redis 不可用时的降级**：当 Redis 连接失败时，不抛异常，打印警告日志，直接查数据库并返回。

## 常见误区

### 先查数据库再查缓存

```java
Product product = productRepository.findById(id); // 先查了数据库
String cached = redis.get(key);
if (cached != null) return parseJson(cached);      // 缓存白查了
```

先查数据库再查缓存，缓存完全失去了意义。必须缓存优先。

### 更新数据时只更新缓存不删除缓存

并发更新可能导致缓存中的值是中间状态。主动删除缓存更安全——让下一次读请求重建。

### 无 TTL 的缓存

没有过期时间的缓存最终会和数据库偏离，且占用内存越来越多。所有缓存 Key 都必须设置合理的 TTL。

### 把缓存当作数据库

"缓存中有数据就够了，数据库可以丢掉"——Redis 默认不保证数据持久性。缓存可能因为内存满、重启或配置而丢失数据。数据库才是数据的真实来源。

## 本章小结

缓存用空间（内存）换时间（减少数据库查询）。Redis 是内存键值存储，支持 String、Hash、List、Set 等类型。cache-aside 模式让应用控制缓存的读写：读时先查缓存再查数据库并回写，写时删除缓存让下一次读重建。TTL 根据数据变化频率设定，过期时间应加随机偏移防雪崩。穿透（缓存空值）、击穿（互斥锁）、雪崩（打散过期+降级）是三类需要分别应对的缓存故障。缓存一致性是最终一致而非实时一致，应通过合理 TTL 和主动删除来控制。下一章学习 Kafka 消息队列——如何用异步消息解耦服务和保证可靠性。

## 快速自测

1. cache-aside 模式的读路径和写路径分别做什么？
2. 为什么写路径是删除缓存而不是更新缓存？
3. 缓存的三种故障（穿透、击穿、雪崩）各有什么区别和应对？
4. TTL 设置为"永不过期"有什么风险？
5. 为什么缓存 Key 需要命名规范？

参考答案：读时先查缓存未命中则查数据库再回写缓存，写时先更新数据库再删除缓存；并发更新可能导致缓存写入顺序与数据库不一致，删除更安全；穿透查不存在的数据，击穿热点 Key 同时过期，雪崩大量 Key 同时过期或 Redis 挂掉；数据与数据库永远偏离且内存持续增长；便于按前缀管理、批量失效和调试。

## 参考文献

- Redis. [Documentation](https://redis.io/docs/latest/).
- Spring Data Redis. [Reference](https://docs.spring.io/spring-data/redis/reference/).
- Amazon. [Caching Strategies](https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/Strategies.html).
