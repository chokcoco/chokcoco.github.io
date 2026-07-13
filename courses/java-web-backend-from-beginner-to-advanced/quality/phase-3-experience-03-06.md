# 第三阶段产物与体验审校：第 3–6 章批次

- 审校范围：第 3–6 章 Markdown、HTML、导航与可运行完整类示例
- 对应第一阶段内容哈希：`6621bad5515f917a58374642ab1585cb1e8183c78e10d249923f22221bde66c5`
- 审校环境：Codex in-app browser；本地静态服务器；Temurin JDK 17.0.19
- 状态：`ready`

## HTML 生成结果

| 章节 | HTML 文件 | 文件大小 | 二级/三级标题 | 代码块/复制按钮 |
| --- | --- | ---: | ---: | ---: |
| 3 | `lessons/03-maven-build.html` | 37,181 bytes | 13 / 32 | 24 / 24 |
| 4 | `lessons/04-java-program-structure.html` | 42,628 bytes | 15 / 42 | 40 / 40 |
| 5 | `lessons/05-java-type-system.html` | 44,691 bytes | 17 / 44 | 48 / 48 |
| 6 | `lessons/06-reference-value-equality.html` | 35,925 bytes | 14 / 26 | 33 / 33 |

四章由 `scripts/build-java-web-course.mjs` 从 Markdown 事实源重新生成，没有直接修改 HTML。全课程生成命令成功重建 36 张章节卡片和术语表。

## 浏览器检查

### 桌面端

- 四章标题、章号、模块名、学习提示和 JDK 17 标签均正常显示。
- 四章页面均无文档级横向溢出。
- 目录链接数依次为 45、57、61、40；对应锚点缺失数均为 0。
- 前后章导航连续：第 2 章 → 3 → 4 → 5 → 6 → 7。
- 代码块与复制按钮数量完全一致。实际点击第 6 章首个复制按钮后出现“已复制”反馈，页面控制台无 error 或 warning。
- 第 6 章目录“Java 的值传递”锚点实际跳转成功，URL fragment 与目标标题一致。

### 390 × 844 窄屏

- 四章 `documentOverflow` 均为 false，页面没有整体横向滚动。
- 正文宽度约 370 px，章末导航宽度约 334 px，保持在视口内。
- 本章目录通过 CSS `order: -1` 移到正文之前，长章进入时先看到可用目录。
- 长代码在代码块内部横向滚动，不推动整个页面。第 3–6 章可滚动代码块数量依次为 16、38、40、25。
- 第 6 章窄屏与桌面首屏经过截图目视检查：标题、摘要、学习提示和目录没有重叠或裁切。

## Java 示例运行

使用临时 Temurin JDK 17.0.19 执行：

```bash
JAVA_HOME=/tmp/temurin17/Contents/Home node scripts/validate-java-markdown-examples.mjs \
  courses/java-web-backend-from-beginner-to-advanced/lessons/{03-maven-build,04-java-program-structure,05-java-type-system,06-reference-value-equality}.md
```

结果：12 个包含 `public class` 的完整 Java 代码块全部编译并运行通过，包括包名示例、命令行参数、方法调用、控制流、`BigDecimal` 和引用练习。实际输出与正文预期一致。刻意展示编译错误或运行错误的片段不作为可运行完整类处理。

## 确定性回归

- `node scripts/build-java-web-course.mjs`：通过。
- `node .agents/skills/teach-generator/scripts/validate-course.mjs courses/java-web-backend-from-beginner-to-advanced`：0 error，0 warning。
- `git diff --check`：通过。

## 问题与限制

- minor：复制功能以按钮“已复制”状态和无控制台错误作为浏览器证据；浏览器自动化会话的独立剪贴板读取没有返回文本，因此未把剪贴板内容本身作为通过依据。
- minor：本批次只抽取完整 `public class` 代码块进行编译运行；作为语法反例的残缺片段和独立表达式由语义审校覆盖。
- minor：浏览器会默认请求未配置的 `/favicon.ico`，本地服务器返回 404；页面没有引用缺失的课程资源，此项不影响正文、导航或交互。
- 非本批次：第 7 章 HTML 因全量构建同步更新，但第 7 章正文尚未进入本次评价量规和体验结论。

## 决策

第 3–6 章产物与体验审校为 `ready`。HTML、导航、锚点、响应式、复制反馈、确定性检查和完整类示例运行均有实际证据；没有 blocker 或 major。课程仍处于草稿状态，整课发布决定保持人工审核。
