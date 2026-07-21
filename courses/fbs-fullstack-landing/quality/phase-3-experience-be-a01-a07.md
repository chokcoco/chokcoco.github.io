# 第三阶段产物体验审校：BE-A01 ~ BE-A07

- 审校范围：BE-A01 ~ BE-A07（模块六 Web 后端进阶）
- 第一阶段内容哈希：`610c96df5d0d16feed12924bb63c4b0039b7024abba959f16541bebd81891db8`
- 第二阶段决定：ready（7 章全部达标）

## 浏览器结构检查

| 检查项 | 结果 | 备注 |
| --- | --- | --- |
| 首页 40 章链接 | 通过 | 7 个 BE-A 章节卡片均可在首页模块六区域找到 |
| 模块六区域标题 | 通过 | "模块六：Web 后端进阶 — 任务、消息、缓存与可靠性" |
| 各章 HTML 页面渲染 | 通过 | 全部 7 章 HTML 生成成功 |
| 导航链接（上下章） | 通过 | 首页可导航到各章 |
| 代码块渲染 | 通过 | Go 代码块均标注语言类型 |
| 代码高亮 | 待浏览器验证 | HTML 结构正确，实际高亮依赖 course.js |
| 响应式 | 待浏览器验证 | 已包含 viewport meta tag |

## HTML 结构完整性

| 文件 | 大小 | doctype | lang | viewport | title |
| --- | --- | --- | --- | --- | --- |
| be-a01-apollo-chassis-config.html | 35,675 B | yes | zh-CN | yes | yes |
| be-a02-redis-codis-cache-consistency.html | 31,938 B | yes | zh-CN | yes | yes |
| be-a03-saturn-scheduled-async-tasks.html | 30,638 B | yes | zh-CN | yes | yes |
| be-a04-kafka-message-pipeline.html | 31,438 B | yes | zh-CN | yes | yes |
| be-a05-reliability-*.html | 34,095 B | yes | zh-CN | yes | yes |
| be-a06-logging-metrics-diagnostics.html | 35,334 B | yes | zh-CN | yes | yes |
| be-a07-impact-analysis-testing-handoff.html | 36,120 B | yes | zh-CN | yes | yes |

## 内容结构检查

| 章节 | 标题 | 时间 | 总结 | 自检 | 练习 | 参考文献 |
| --- | --- | --- | --- | --- | --- | --- |
| BE-A01 | ✓ | ✓ | ✓ | 5 问 | 4 题 | ✓ |
| BE-A02 | ✓ | ✓ | ✓ | 5 问 | 4 题 | ✓ |
| BE-A03 | ✓ | ✓ | ✓ | 5 问 | 4 题 | ✓ |
| BE-A04 | ✓ | ✓ | ✓ | 5 问 | 4 题 | ✓ |
| BE-A05 | ✓ | ✓ | ✓ | 5 问 | 6 题 | ✓ |
| BE-A06 | ✓ | ✓ | ✓ | 5 问 | 6 题 | ✓ |
| BE-A07 | ✓ | ✓ | ✓ | 5 问 | 6 题 | ✓ |

## 未验证项

- 浏览器实际渲染效果（沙箱限制，无法启动 HTTP 服务器）
- 代码高亮实际效果
- 移动端响应式实际效果（390px 宽度）
- Mermaid 图表渲染（本章 7 篇均未包含 Mermaid 图表）
- 主题切换与代码复制功能

建议在可访问静态服务器的环境中打开 `index.html` 完成视觉验证。

## 决定

ready — 7 章 HTML 产物结构完整，所有必需元素齐全。浏览器视觉验证建议在本地环境中补充执行。
