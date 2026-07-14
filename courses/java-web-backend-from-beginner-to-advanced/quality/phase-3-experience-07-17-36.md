# 第三阶段产物与体验审校：第 7、17、36 章批次

- 审校范围：第 7、17、36 章 Markdown、HTML、导航、代码块及可运行完整 Java 示例
- 对应第一阶段内容哈希：`a744ea3b376f36bbeb0badcf3159e12802b3012629eb94cefe14a81bfd19fb26`
- 审校环境：本地构建；Temurin JDK 17.0.19；无可调用的浏览器自动化会话
- 状态：`ready`（浏览器视觉项记录为未执行，不外推为已验证）

## HTML 生成与结构结果

三章由 `scripts/build-java-web-course.mjs` 从 Markdown 事实源全量重建；没有直接修改 HTML。构建结果为 36 个课程页面、36 个章节卡片和 1 份术语表。

| 章节 | HTML 文件 | 文件大小 | h2/h3 合计 | 代码块 / 复制按钮 | Mermaid | 目录锚点缺失 |
| --- | --- | ---: | ---: | ---: | ---: |
| 第 7 章 | `lessons/07-array-string-control-flow.html` | 31,945 bytes | 35 | 27 / 27 | 1 | 0 |
| 第 17 章 | `lessons/17-http-rest-contract.html` | 50,508 bytes | 35 | 20 / 20 | 0 | 0 |
| 第 36 章 | `lessons/36-diagnose-backend.html` | 48,300 bytes | 37 | 13 / 13 | 1 | 0 |

结构检查从每页所有 `href="#..."` 收集目录链接，并逐个与 HTML `id` 对照；三页均没有缺失锚点。代码块数量与复制按钮数量相等。第 7 章和第 36 章的 Mermaid 均以可读源文本保留在 Markdown 中，并已通过第一阶段图类型检查。

三个 HTML 于同一次全量构建中覆盖重建。文件修改时间均为 `2026-07-14 11:46:17`。内容反查确认：第 7 章包含“数组变量、引用与复制”，第 17 章包含“REST 是一组共同生效的架构约束”和“可缓存要求响应说明能否被复用”，第 36 章包含“JFR 不是一张自动根因报告”和“CPU 不高时重点检查等待”。这些字符串来自新版 Markdown，不存在仅更新 Markdown 而 HTML 仍保留旧正文的情况。

## 代码与命令体验

使用临时 Temurin JDK 17.0.19 执行：

```bash
JAVA_HOME=/tmp/temurin17/Contents/Home node scripts/validate-java-markdown-examples.mjs \
  courses/java-web-backend-from-beginner-to-advanced/lessons/07-array-string-control-flow.md
```

结果：第 7 章的完整 `StatusReportDemo` 编译并运行通过，控制台实际输出：

```text
待处理，已完成，已取消，未知状态
```

第 17、36 章的代码块是 HTTP 报文、`curl` 或 `jcmd` 的受控示例，不是可脱离服务地址、PID、权限和运行环境直接执行的 Java 程序。正文在相邻位置说明了运行前提、关键参数和预期可观察结果：第 17 章将 `curl` 的执行时点放在第 18 章启动本地服务之后；第 36 章要求先确认 PID、授权环境、敏感信息与采集成本。

## 确定性回归

- `node scripts/build-java-web-course.mjs`：通过。
- `JAVA_HOME=/tmp/temurin17/Contents/Home node scripts/validate-java-markdown-examples.mjs lessons/07-array-string-control-flow.md`：1 个完整 `public class` 通过。
- `node .agents/skills/teach-generator/scripts/validate-course.mjs courses/java-web-backend-from-beginner-to-advanced`：0 error，0 warning。
- `git diff --check`：通过。

## 浏览器与视觉检查边界

本轮环境没有可调用的浏览器自动化工具，因此未执行真实浏览器中的桌面/窄屏截图、复制按钮点击反馈、Mermaid 实际渲染和页面横向溢出检查。根据课程生成规范，这些项目不能伪报为已通过。

替代检查为：成功生成静态 HTML、目录锚点完整性、代码块与复制按钮数量一致、Mermaid 源声明有效、全课程链接与 HTML 结构的确定性检查通过。发布前或出现可用浏览器会话后，应补做三页的桌面与 390px 窄屏检查，重点查看第 7 章长代码块、第 17 章报文表格和第 36 章 Mermaid 依赖链图。

## 问题与限制

- minor：浏览器交互与视觉响应式尚未在本轮环境执行；这不影响 Markdown/HTML 事实源、链接、代码运行和结构结论，但限制了发布级体验结论。
- minor：完整 Java 编译只适用于第 7 章的 `public class` 示例；HTTP 与 JVM 诊断命令的真实运行必须在具备对应服务和授权的环境中单独验证。

## 决策

本批次的可执行质量闸门结果为 `ready`：构建、结构、链接、代码示例、Humanizer 和第二阶段量规均通过，没有 blocker 或 major。浏览器视觉审校为明确待补项，不被误记为完成。
