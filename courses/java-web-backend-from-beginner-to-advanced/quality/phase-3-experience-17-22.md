# 第三阶段：产物与体验审校报告 — 第 17–22 章

- 审校范围：第 17-22 章 HTML 产物
- 审校日期：2026-07-14
- 决策：**ready**（浏览器视觉验证因当前运行环境无浏览器工具标记为待补）

## 结构检查

| 章节 | h2 数量 | h3 数量 | 代码块 | 文件大小 |
| --- | ---: | ---: | ---: | ---: |
| 第 17 章 HTTP REST | 10 | ~30 | ~22 | ~50 KB |
| 第 18 章 Spring Boot | 9 | ~14 | ~24 | ~35 KB |
| 第 19 章 配置 | 6 | ~12 | ~18 | ~28 KB |
| 第 20 章 分层 | 7 | ~6 | ~16 | ~28 KB |
| 第 21 章 校验/异常 | 10 | ~24 | ~26 | ~46 KB |
| 第 22 章 JSON/DTO | 6 | ~12 | ~20 | ~30 KB |

所有章节 h2 使用中文序号（## 一、## 二 等），h3 使用递进编号，与课程 spec 一致。

## 导航与锚点

- `scripts/build-java-web-course.mjs` 成功生成 36 lessons、36 chapter cards、1 glossary
- 第一阶段 `validate-course.mjs` 报告 0 error、0 warning
- 章节间上一章/下一章导航自动生成

## 代码与内容检查

### 第 17 章：HTTP 与 REST
- `curl` 命令携带 `-i` 参数，展示完整头信息
- REST 约束逐项展开为客户端-服务器、无状态、缓存、统一接口、分层、按需代码
- 错误响应使用 RFC 9457 Problem Details 结构
- 外部 URL 均登记于 RESOURCES.md

### 第 18 章：Spring Boot 请求处理
- POM 最小依赖阐述清楚（parent、starter、java.version）
- @PathVariable vs @RequestParam 对比表实用
- POST Content-Type 不匹配返回 415 有完整演示
- 排错小节覆盖端口占用、扫描范围、@RestController vs @Controller

### 第 19 章：配置
- @Value 与 @ConfigurationProperties 对比有各自适用场景
- Profile 拆分 + 优先级覆盖链完整
- 安全配置模板 + .gitignore 排除方案具体
- 练习覆盖命令行覆盖、Profile 区分、环境变量注入

### 第 20 章：分层
- 未分层代码先展示问题再引入分层，逻辑清晰
- ConcurrentHashMap 使用理由说明（线程安全）
- "逐步拆分而不是套架构"小节务实
- 练习包含反向测试（不启动 Spring 的纯 Java 测试）

### 第 21 章：参数校验
- 三类失败（输入/业务/系统）先分开
- Jakarta Validation Boot 3.x 路径与 Boot 2.x 区别明确
- @Valid 与 @NotNull 职责分开讲解
- curl 验证带完整 HTTP 响应

### 第 22 章：JSON/DTO
- JSON 合法类型六种对照 Java 类型
- DTO 请求/响应分离有具体示例
- 日期格式、命名策略、未知字段、null 处理全覆盖
- 接口演进安全/破坏性变更分明

## 待补项

- **浏览器视觉验证**：当前运行环境无可用的浏览器自动化工具。桌面/390px 窄屏视觉、Mermaid 实际渲染、复制按钮交互和代码高亮效果标记为待补。

## 决策

所有可执行检查通过。**决策：ready**
