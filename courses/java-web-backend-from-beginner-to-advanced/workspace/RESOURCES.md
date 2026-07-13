# Java Web 后端入门到进阶：来源包

状态：样章来源包 v0.3。最近核验：2026-07-13。

## Source policy

- 语言与 JVM 事实以 JDK 17 对应的 JLS、JVMS、Java SE API、JEP 和 dev.java 为准
- 框架、中间件与工具使用项目官方文档；正式生成时锁定版本，不引用浮动的“current”行为作为永久事实
- 安全主题使用 Spring Security 官方文档与 OWASP 交叉核验
- 大学课程和书籍只用于教学节奏、练习与设计原则，版本行为回到官方资料核验
- 用户提供资料先登记公开范围、版本与使用限制

## Java 与工程工具

1. Learn Java，OpenJDK / dev.java：https://dev.java/learn/
   - 用途：语言、OOP、泛型、集合、Stream、I/O、日期时间、GC
2. Java SE 17 Language Specification：https://docs.oracle.com/javase/specs/jls/se17/html/
   - 用途：JDK 17 语言语义与线程内存模型
3. Java SE 17 JVM Specification：https://docs.oracle.com/javase/specs/jvms/se17/html/
   - 用途：class 文件、运行时数据区和类加载
4. Java SE 17 API：https://docs.oracle.com/en/java/javase/17/docs/api/
   - 用途：主线标准库合约
5. JEP Index：https://openjdk.org/jeps/0
   - 用途：17→21+ 的 record pattern、switch 模式匹配、虚拟线程等差异
6. Maven Getting Started：https://maven.apache.org/guides/getting-started/
7. JUnit User Guide：https://docs.junit.org/current/user-guide/
8. Eclipse Adoptium Temurin 17 下载页：https://adoptium.net/temurin/releases/?version=17
   - 用途：第 2 章在 macOS 与 Windows 安装 JDK 17，并按 CPU 架构选择安装包
9. IntelliJ IDEA 下载与安装说明：https://www.jetbrains.com/idea/download/ 、https://www.jetbrains.com/help/idea/installation-guide.html
   - 用途：第 2 章解释 IDE、安装默认 Java IDE，并在两种系统中选择项目 JDK
10. VS Code Java 入门：https://code.visualstudio.com/docs/java/java-tutorial
   - 用途：第 2 章为已有 VS Code 经验的学习者说明 Java Extension Pack 与运行时配置
11. Homebrew：https://brew.sh/；Apache Maven 下载页：https://maven.apache.org/download.cgi
   - 用途：第 2 章安装 Maven 的 macOS 与 Windows 路径
- Homebrew 官网单独登记：https://brew.sh/
- Unicode Consortium UTF-16 FAQ：https://www.unicode.org/faq/utf_bom.html#UTF16
   - 用途：第 5 章校准 `char`、UTF-16 代码单元与辅助字符的边界

## Spring Web 与数据

12. Spring Boot Reference：https://docs.spring.io/spring-boot/reference/
   - 用途：自动配置、Web、配置、测试、Actuator、容器镜像
   - 版本边界：当前文档会变化，课程必须锁定与 Java 17、数据框架和 Security 兼容的版本矩阵
13. Spring Framework Reference：https://docs.spring.io/spring-framework/reference/
   - 用途：IoC、Spring MVC、验证、REST Client 与事务
14. Jakarta Validation Specification：https://jakarta.ee/specifications/bean-validation/
15. Jackson Documentation：https://github.com/FasterXML/jackson-docs
16. MyBatis Documentation：https://mybatis.org/mybatis-3/
17. MyBatis-Plus Documentation：https://baomidou.com/
   - 当前暂定数据访问主线；正式生成前根据公司栈确认
18. Spring Data JPA Reference：https://docs.spring.io/spring-data/jpa/reference/
   - 只用于备选路线评估；若选择 JPA，将替换 MyBatis-Plus 主线
19. PostgreSQL Documentation：https://www.postgresql.org/docs/
   - 暂定教学数据库；可根据公司栈改为 MySQL

## 安全、缓存、消息与部署

20. Spring Security Reference：https://docs.spring.io/spring-security/reference/
   - 用途：过滤器链、认证、授权、攻击防护与 JWT Resource Server
21. OWASP Cheat Sheet Series：https://cheatsheetseries.owasp.org/
   - 用途：密码存储、JWT、输入校验、日志、CORS/CSRF 等安全边界
22. RFC 7519 JSON Web Token：https://www.rfc-editor.org/rfc/rfc7519
23. Redis Documentation：https://redis.io/docs/latest/
24. Spring Data Redis Reference：https://docs.spring.io/spring-data/redis/reference/
25. RabbitMQ Documentation：https://www.rabbitmq.com/docs
   - 无公司产品约束时的暂定 MQ 演示路线
26. Apache Kafka Documentation：https://kafka.apache.org/documentation/
   - 用于选型对照，不与 RabbitMQ 并行实现
27. Spring AMQP Reference：https://docs.spring.io/spring-amqp/reference/
28. Docker Java Guide：https://docs.docker.com/guides/java/
29. Mermaid 10 Browser Bundle：https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js
   - 用途：静态 HTML 预览中的课程图表渲染，不参与课程事实断言

## 教学结构参考

30. University of Helsinki Java Programming MOOC：https://java-programming.mooc.fi/
   - 只借鉴渐进练习和自动反馈；该课程已标记为 legacy，不支撑当前版本事实
31. Effective Java, Third Edition，Joshua Bloch，2018
   - 只做设计原则参考，不复制原文或题目
32. Java Concurrency in Practice，Brian Goetz 等，2006
   - 用于线程安全推理；现代并发能力由当前 JEP/API 校准
33. 本地材料 `assets/课程风格参考_6.md`
   - 用途：多级标题、概念到原理再到应用的章节组织方式
   - 限制：只参考信息结构，不复制具体内容和宣传式判断
34. 本地材料 `assets/Java 变量与数据类型.md`
   - 用途：观察零基础语法课如何先定义变量、数据类型和基本用法，再进入类型转换等扩展内容
   - 限制：其中的位宽、默认值、String、旧包装类构造器等说法须由 JLS/JDK 17 API 重新校准
35. 本地材料 `assets/Java 反射概述.md`
   - 用途：观察“先给概念与 API 分类，再进入组合示例”的节奏
   - 限制：不采用 `Class.newInstance()` 等过时写法，也不把未经限定的优缺点当事实

## Verified decisions and boundaries

- Java 17 是课程主线，所有核心示例不依赖 preview feature
- Spring Boot 当前版本仍支持 Java 17，但正式课程不能直接跟随浮动最新版；需要锁定完整版本矩阵
- MyBatis-Plus 与 JPA 都进入课程，各用一章完成基础路线对照；不受原定 36 小时限制，也不在同一业务工程中混用
- Docker 官方 Java 指南覆盖 Spring Boot、Maven、多阶段构建、Compose 和测试，可作为部署章骨架
- Spring Security 的 Servlet 支持基于 Filter 链；JWT 需要放在认证授权架构之后

## Research gaps

- 公司实际 Spring Boot/Spring Security 版本，是 3.x 存量还是 4.x 新项目
- MyBatis-Plus 与 JPA 的最终选择；MySQL 与 PostgreSQL 的最终选择
- MQ 产品选择：RabbitMQ、Kafka、RocketMQ 或公司平台封装
- JWT 是自签发方案、OAuth2 Resource Server，还是公司统一身份平台
- Redis 客户端、序列化与缓存规范
- Maven/Gradle、Mockito/AssertJ/Testcontainers、Lombok/MapStruct 等团队工具
- 部署是否只需 Docker，还是需要接入公司容器平台

## User-provided materials

用户补充了 10 个公开教程仓库。详细检查路径、维护状态、版本风险和使用决定见 `MATERIAL-REVIEW.md`。这些材料默认是 B2/C 级教学参考，不自动成为学生正文的事实来源。

## 网络优质教程

- [toBeBetterJavaer](https://github.com/itwanger/toBeBetterJavaer)
- [JavaGuide](https://github.com/Snailclimb/JavaGuide)
- [27天成为Java大神](https://github.com/DuGuQiuBai/Java)
- [spring-boot-examples](https://github.com/ityouknow/spring-boot-examples)
- [toBeTopJavaer](https://github.com/hollischuang/toBeTopJavaer)
- [互联网 Java 工程师进阶知识完全扫盲](https://github.com/doocs/advanced-java)
- [technology-talk](https://github.com/aalansehaiyang/technology-talk)
- [cs-self-learning](https://github.com/PKUFlyingPig/cs-self-learning)
- [SpringAll](https://github.com/wuyouzhuguli/SpringAll)
- [Springboot-Notebook](https://github.com/chengxy-nds/Springboot-Notebook)

### 样章采用的子材料

- toBeBetterJavaer：JDK 安装与配置、Hello World、基本类型、String/equals、JVM 工具
- JavaGuide：Java 值传递、基础知识、JVM 内存区域、类加载和故障处理工具
- SpringAll：Spring Boot 参数校验和全局异常旧版示例，仅用于迁移审查
- spring-boot-examples：Java 17 示例的单场景工程组织方式
- toBeTopJavaer、technology-talk：JVM 常见误区和故障问题线索

没有采用：面试背诵、广告与付费入口、过时 Spring Cloud/Hystrix 示例、与课程无关的算法和大规模分布式专题，以及无法通过官方资料核验的结论。
