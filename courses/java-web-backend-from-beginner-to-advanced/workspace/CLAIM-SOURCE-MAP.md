# 四章预览断言来源映射

状态：v0.2，2026-07-13。第 6、21 章按零基础结构返工。

| 章节 | 关键断言 | 一手来源 | 边界 |
| --- | --- | --- | --- |
| 2 | JDK 提供编译与运行工具；源码经编译形成 class 文件后由 JVM 执行 | dev.java Getting Started；JDK 17 `java`/`javac` 文档 | 单文件源码启动是补充路径，企业工程仍由构建工具组织 |
| 2 | `--release 17` 约束语言目标和可见的标准库 API | JDK 17 `javac` 文档；Maven 官方版本指南 | 不把交叉编译写成完整运行兼容保证 |
| 6 | 变量保存值；引用类型变量保存可指向对象或数组的引用值 | JLS 17 §4.3.1、§4.12.2 | 不把引用描述成对象本体或规范要求的裸内存地址 |
| 6 | Java 参数传递是值传递，引用类型传递的是引用值副本 | JLS 17 §8.4.1、§15.12.4.5 | 先解释方法、形参和实参的最小语法，再讨论传递过程 |
| 6 | 基本类型的 `==` 比较值；引用类型的 `==` 判断是否为同一对象或同时为 null | JLS 17 §15.21 | String 内容比较使用 `equals`，不依赖字符串池造成的偶然结果 |
| 6 | `equals` 与 `hashCode` 有明确契约并影响哈希集合行为 | Java SE 17 Object/String API | 第 6 章只建立规则，第 13 章结合 HashSet/HashMap 展开 |
| 21 | 约束注解声明验证规则，`@Valid` 负责触发级联验证但不等同于非空约束 | Jakarta Validation 3.1；Spring Framework 6.2 MVC Validation | 先讲输入、约束和验证结果，再引入框架异常类型 |
| 21 | `@Valid` 触发对象级验证，方法级约束可能走另一套异常路径 | Spring Framework 6.2 MVC Validation | 具体异常随方法签名变化，作为进阶边界放在基础用法之后 |
| 21 | `@RestControllerAdvice` 可跨 Controller 提供异常处理 | Spring Framework Controller Advice | 不把所有异常映射为同一状态码 |
| 21 | Spring Boot 3 使用 Jakarta 包名 | Spring Boot 3/Spring Framework 6 与 Jakarta Validation 文档 | 旧 `javax.validation` 示例仅作迁移反例 |
| 35 | JVM 定义堆、方法区、栈、pc 和本地方法栈等运行时区域 | JVMS 17 §2.5 | 方法区是规范逻辑区域；HotSpot 元空间是实现细节 |
| 35 | 类经历加载、链接和初始化；加载器参与运行时类型身份 | JVMS 17 §5；Java 17 Class API | 不假定解析必须在固定时点一次完成 |
| 35 | GC 基于对象可达性；`System.gc()` 只是建议 | JVMS 17；Java 17 Runtime API | 不承诺回收数量和完成时机 |
| 35 | OOM 不自动等于泄漏，需要依据具体消息和保留链判断 | JDK 17 Troubleshooting Guide | 不在本章给出 GC 参数处方 |
