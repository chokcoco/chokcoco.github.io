# Java Web 后端入门到进阶：课程前置准备

状态：完整课程草稿已生成，等待内容审核与逐章加深。

## 已确认

- 课程名称：「Java Web 后端入门到进阶」
- 课程结构：36 章，四个模块；不限制单章时长和总学习时长
- 教学起点：Java 零基础。前端经验是辅助背景，不是省略 Java 基础知识的依据
- JDK 17 为可运行主线，补充后续重要版本差异
- 必含：Java 核心语法、集合、面向对象、Stream、Spring Boot、REST API、参数校验、全局异常
- 进阶范围：JVM、线程池、Kafka、Spring Security、JWT、Redis、Docker、MyBatis-Plus 与 JPA
- 不采用大型项目驱动；先用最小示例讲概念，再用短小场景迁移
- 所有章标题使用直叙句

## 教学写法

- 每章先解释基本概念、语法、原理和基本用法，再讲进阶点、易错点与应用场景
- 代码示例必须遵守课程顺序；尚未讲过的语法要先补足最小前置
- 第一段示例只承载一个新概念，完整示例放在概念和语法讲清之后
- 使用多级标题组织长内容，章节长度服从知识点，不服从固定课时
- 参考 `课程风格参考_6.md` 的层级结构，并参考两篇 Java 材料的概念先行节奏；技术事实以课程来源包中的官方资料为准

## 技术路线

- Spring Boot 3.x、Maven、macOS、Markdown 主线
- MyBatis-Plus 与 JPA 都讲；MySQL 与 PostgreSQL 都讲
- Kafka 是 MQ 实作主线；RabbitMQ 与 RocketMQ做选型对照
- JWT 自签发与统一身份/OAuth2 Resource Server 都讲，重点比较责任边界
- Redis、Docker、JVM 和并发只覆盖后端开发者需要的基础机制与常见边界

## 仍需后续补充但不阻塞预览

- 团队是否高频使用 Lombok、MapStruct、Mockito、AssertJ、Testcontainers
- Redis 序列化、key 命名和缓存注解规范
- Spring Boot 3.x 的具体小版本与统一身份平台实现
- 学员能否安装 Docker Desktop

## 人工审核闸门

- [x] 确认 Spring Boot 3.x 主线
- [x] 确认数据访问、数据库、MQ 与身份认证范围
- [x] 登记并审查第一批网络资料
- [x] 确认 Markdown 为主要交付格式
- [x] 取消单章时长限制，明确零基础递进写法
- [x] 审核返工后的第 6 章，确认其写法作为全课程基准
- [x] 将环境模块压缩到第 1–2 章，并把第 3 章移入 Java 语言模块
- [x] 生成完整 36 章 Markdown 与 HTML 草稿
- [ ] 人工复核各章是否需要继续扩充到第 6 章同等深度

## 下一步

完整课程已生成。接下来按用户阅读反馈逐章加深、补充可运行代码和公司规范，不自动发布到平台目录。
