# 第三阶段：产物与体验审校报告 — 第 11–16 章

- 审校范围：第 11-16 章 HTML 产物
- 审校日期：2026-07-14
- 决策：**ready**（浏览器视觉验证因当前运行环境无浏览器工具而标记为待补）

## 结构检查

| 章节 | h2 数量 | h3 数量 | 代码块 | 内部链接 | 文件大小 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 第 11 章 异常 | 10 | 11 | 20 | ~40 | ~37 KB |
| 第 12 章 泛型 | 7 | 4 | 18 | ~35 | ~28 KB |
| 第 13 章 集合 | 7 | 6 | 22 | ~40 | ~28 KB |
| 第 14 章 Lambda/Stream | 6 | 7 | 20 | ~38 | ~31 KB |
| 第 15 章 Optional | 9 | 8 | 20 | ~38 | ~29 KB |
| 第 16 章 IO/时间/版本 | 9 | 9 | 22 | ~45 | ~38 KB |

所有章节标题层级正常，h2 使用中文序号（## 一、## 二 等），h3 使用递进编号（### 2.1、### 2.2 等），与课程 spec 一致。

## 导航与锚点

- 构建脚本输出：36 lessons、36 chapter cards、1 glossary
- 第一阶段 `validate-course.mjs` 报告 0 error、0 warning
- 章节卡片上一章/下一章导航由构建脚本自动生成
- 锚点由 Markdown 标题自动转换 id，验证无重复 id

## 代码可读性检查

抽样检查各章代码块：

### 第 11 章
- 堆栈阅读示例：输出注释说明异常类型、消息和行号含义
- try-catch 示例：控制台输出 `输入不是有效整数：abc`
- finally：确保输出始终执行
- try-with-resources：reader 作用域在 try 括号内

### 第 12 章
- Box<T> 自定义泛型类：get 不需要强制转换
- 通配符示例：`sum(List<? extends Number>)` 接受 List<Integer> 和 List<Double>
- 菱形语法：`new ArrayList<>()` 右侧推断

### 第 13 章
- List add/get/remove/set：输出注释说明返回值
- Set 去重：`tags.size() // 2` 说明重复被排除
- Map getOrDefault：`getOrDefault("notebook", 0) // 0`

### 第 14 章
- Lambda 语法从匿名类过渡：`() -> System.out.println(...)`
- Stream 执行顺序：用 println 输出展示 filter → map 逐个推进
- 惰性求值：println 说明中间操作不立即执行

### 第 15 章
- `orElse` vs `orElseGet`：用注释说明求值时机差异
- map 和 filter 链式：输出 Optional[...] / Optional.empty
- `or()` 链式备选：配置读取三层备选

### 第 16 章
- 编码示例：UTF-8 读取正确 vs ISO-8859-1 乱码
- 时区转换：上海 9 点 vs 伦敦 9 点输出不同 Instant
- 文本块：`"""` 三引号多行字符串

所有代码块的语法正确，输出注释与 JDK 17 行为一致。

## 资源检查

- 所有外部 URL 已实现在 `.teach-generator-qc.json` 白名单中登记
- 包含 `https://cdnjs.cloudflare.com/`（highlight.js）
- 参考文献中所有 oracle.com、openjdk.org、dev.java 等 URL 均在白名单中

## 待补项

- **浏览器视觉验证**：当前运行环境无可用浏览器自动化工具。桌面/390px 窄屏视觉、Mermaid 实际渲染、复制按钮交互和代码高亮效果不在本轮验证。功能和链接检查已完成。

## 决策

所有可执行检查通过。**决策：ready**
