# 用户补充材料审查记录

状态：第一轮审查完成。审查日期：2026-07-13。

## 审查方法

本轮拉取了 10 个仓库的入口文件，并继续检查入口中的本地章节、示例目录、构建文件和与四个样章相关的正文。社区材料只用于教学顺序、案例和常见误区；Java、Spring 与 JVM 事实回到官方规范核验。

四个样章选择为：第 2 章 JDK 17 环境、第 6 章引用与相等性、第 21 章参数校验与全局异常、第 35 章 JVM 运行模型。

## 逐项结论

| 材料 | 检查范围 | 可用部分 | 排除或降级原因 | 决定 |
| --- | --- | --- | --- | --- |
| toBeBetterJavaer | README 知识地图；JDK 安装、Hello World、基础类型、String/equals、JVM 工具等子页 | 中文初学者常见卡点、macOS/Windows 环境步骤、循序渐进的例子 | 大量面试、推广和扩展专题；个别结论需回到 JLS/JVMS | B2 教学参考，四章均可择用表达与误区 |
| JavaGuide | README 全目录；值传递、基础问答、JVM 内存、类加载、故障工具、Spring 目录 | 知识点覆盖完整，适合发现遗漏和设计自测 | 面试问答占比高；部分 JVM 链接仍指 Java 8；不能作为 JDK 17 规范来源 | B2 教学参考，重点用于第 6、35 章误区清单 |
| 27天成为Java大神 | README | 仅保留“短周期路线”这一组织信号 | 入口只有标题，最后提交为 2015-11-26，无正文、代码和版本依据 | 排除 |
| spring-boot-examples | README 各示例入口；Web、JPA、MyBatis、Redis、RabbitMQ、Docker 示例及 POM | 可用于观察“小例子只验证一个集成点”的组织方法；部分顶层示例已转向 Java 17 | 同仓库并存 Spring Boot 1.x/2.x/3.x；旧 API 与当前课程冲突 | B3 场景参考，代码不复用，按 Boot 3.x 重写 |
| toBeTopJavaer | README、menu/sidebar；Java 基础、JVM 运行区、类加载、JMM 等章节 | 适合补充进阶问题与反例 | 以“成神/面试”为主要叙事，章节版本不统一，部分文章粒度过细 | C 级选题参考，仅用于第 35 章审查遗漏 |
| advanced-java | README 中 MQ、Redis、高并发、分布式与微服务全部子项 | MQ 失败模式、缓存一致性、幂等和积压问题清单有助于后续第 32–33 章 | 面试问答体例；部分 Hystrix/Dubbo 内容超出课程或已过时；不适合基础样章 | C 级进阶案例库，本轮四章不引用 |
| technology-talk | README 各技术专题；Java 基础、JVM、Spring Boot、MyBatis、Kafka/RocketMQ、Docker 子页 | 真实故障式标题可转化为问题驱动案例；Kafka、JVM、Redis 分类清楚 | 营销与面试语气重，部分文章外链或付费，技术结论需官方核验 | C 级案例线索，第 35 章只取故障提问方式 |
| cs-self-learning | README、CS 学习规划、Docker 工具页与课程索引 | 课程选择与“课程 + 作业”思路可用于学习设计 | 不是 Java Web 教程，范围远超本课，不能支撑具体技术断言 | C 级教学设计参考，不进入样章参考文献 |
| SpringAll | README 的 Spring Boot/Security 子项；异常、Validator、Security/JWT 示例与 POM | 参数校验、全局异常、过滤器链的失败案例适合做迁移对照 | 多数示例使用 Java 7/8、Spring Boot 1.x/2.x、`javax.validation` 和旧 Security API | C 级历史案例；第 21 章用来说明为何不能照搬旧代码 |
| Springboot-Notebook | README 中 100 例、Redis、MQ、事务、JVM 文章与示例 POM | 场景丰富，适合后续选练习题和故障案例 | 主要工程仍是 Java 8/Spring Boot 2.7 或更早；宣传语较多，外链材料可达性不一 | C 级场景池，本轮不作为事实来源 |

## 四章实际采用

### 第 2 章

- toBeBetterJavaer 的 JDK/IDE 安装页：用于收集 macOS 常见环境错配，命令和版本由 dev.java、JDK 17 工具文档校准。
- cs-self-learning 的工具课组织：用于把“安装”改成“验证环境是否一致”的操作课。

### 第 6 章

- JavaGuide 的“Java 只有值传递”与基础问答：用于收集学习者常见错误说法。
- toBeBetterJavaer 的 String、`equals` 与对象章节：用于设计从前端对象比较迁移到 Java 的例子。
- 断言依据使用 JLS 17 和 Java SE 17 API。

### 第 21 章

- SpringAll 的 Validator 和全局异常示例：作为旧代码审查样本。示例仍使用 `javax.validation`、类级 `@Validated` 和字符串错误响应，不能直接用于 Spring Boot 3.x。
- spring-boot-examples：借鉴每个示例只聚焦一个集成点的结构。
- 正文与示例以 Spring Framework 6.2 Validation、Controller Advice 与 Jakarta Validation 为准。

### 第 35 章

- JavaGuide、toBeBetterJavaer、toBeTopJavaer、technology-talk 的 JVM 子项：用于整理“对象都在堆上”“OOM 就是内存泄漏”“调用 `System.gc()` 会立刻回收”等误区。
- JVM 运行时数据区、类加载与 GC 断言使用 JVMS 17、JDK 17 JVM Guide 与 Troubleshooting Guide。

## 后续使用规则

- 社区仓库不直接进入学生参考文献，除非某章确实引用其独特案例并再次核验。
- 旧 Spring 示例不做机械升级；先确认它要说明的机制，再用 Spring Boot 3.x 重写。
- 面试问答只能帮助发现误区，不能代替连续教学路径。
- 与当前章节无关的分布式、微服务、源码和算法材料暂不进入上下文。
