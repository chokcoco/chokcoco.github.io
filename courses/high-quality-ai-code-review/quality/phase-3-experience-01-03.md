# 第三阶段产物与体验报告：01–03

- 检查日期：2026-07-15
- 范围：首页、第 1–3 章、术语表、Markdown 合集
- 第一阶段内容哈希：`1e7cfa710af27c5144fbed3d1726df80510b5de5ee312c0c4724bb5e72a5cc8e`
- 结果：本地结构与 HTTP 体验替代检查通过；应用内浏览器视觉检查受运行时故障阻塞
- 发布决定：`manual_review`

## 浏览器检查状态

按 Browser skill 初始化应用内浏览器时，连接层返回：

```text
Cannot redefine property: process
```

该错误发生在浏览器运行时建立之前，无法获得页面截图、计算样式、真实 Mermaid SVG 或交互点击结果。未改用 standalone Playwright，因为 Browser skill 明确禁止以独立浏览器自动化绕过连接层。

因此，本报告不声明“浏览器视觉验证通过”。以下项目使用本地 HTTP、生成器内置链接检查和静态产物结构检查替代。

## 本地 HTTP 可达性

在仓库根目录启动只读静态服务器，逐页请求：

| 页面 | HTTP | Content-Type |
| --- | ---: | --- |
| 课程首页 | 200 | `text/html` |
| 第 1 章 | 200 | `text/html` |
| 第 2 章 | 200 | `text/html` |
| 第 3 章 | 200 | `text/html` |
| 术语表 | 200 | `text/html` |
| 01–03 Markdown 合集 | 200 | `text/markdown` |

请求完成后已关闭本地服务器。

## HTML 与导航结构

| 检查 | 首页 | 第 1 章 | 第 2 章 | 第 3 章 | 术语表 |
| --- | ---: | ---: | ---: | ---: | ---: |
| doctype / `zh-CN` / viewport | 通过 | 通过 | 通过 | 通过 | 通过 |
| 唯一 H1 | 1 | 1 | 1 | 1 | 1 |
| 目录锚点数 | 0 | 27 | 44 | 37 | 1 |
| 缺失目录锚点 | 0 | 0 | 0 | 0 | 0 |
| Mermaid 容器 | 0 | 2 | 4 | 4 | 0 |
| 表格 | 0 | 1 | 1 | 3 | 1 |
| 代码复制按钮 | 0 | 0 | 1 | 1 | 0 |

生成器的本地链接检查与第一阶段 `LINK_TARGET_MISSING` / `LINK_ANCHOR_MISSING` 检查均通过。上一章、下一章、课程目录、术语表和 Markdown 版本互相可达。

## 响应式与长文阅读替代检查

- CSS 含 900px 与 620px 两个响应式断点。
- 900px 以下课程正文改为单栏，目录取消 sticky 并移动到正文前。
- 宽表使用 `overflow-x: auto`，不会强制撑破窄屏容器。
- 桌面目录使用 sticky、视口最大高度与独立滚动，适合 37–44 项长目录。
- 620px 以下导航改为纵向，章末上一章/下一章链接取消 48% 最大宽度。
- 打印样式隐藏顶部导航、目录、复制按钮和章末导航。

这些检查证明响应式规则存在且目标关系正确，不能替代真实浏览器对字体回退、实际溢出和触控区域的观察。

## Mermaid 与代码

- 10 个 Mermaid 块均声明了允许的图类型：`flowchart`、`sequenceDiagram`、`erDiagram` 或 `stateDiagram-v2`。
- 未使用课程禁止的 `mindmap`。
- Mermaid 使用 CDN v10，脚本在 DOMContentLoaded 后初始化 neutral theme 与 strict security level。
- 第 2 章 TypeScript 简化节选和第 3 章 text 查询管道均标明教学或简化用途，没有声称可独立运行。
- 两个非 Mermaid 代码块生成复制按钮；复制动作读取代码纯文本，不复制高亮 HTML。

未能在真实浏览器中确认 Mermaid 最终 SVG 渲染和 Clipboard 权限行为，这两项保留给人工视觉审核。

## 体验问题分级

### Blocker

无内容或静态产物 blocker。

### Major

无。

### Minor / 未验证

1. 应用内浏览器连接故障导致无法截图并检查实际 Mermaid 布局。
2. 第 2 章有 44 个目录项，真实桌面与移动端的目录密度需要人工观察。
3. 第 3 章宽状态表和样本表需要在 375px 左右视口确认横向滚动手感。
4. Clipboard API 在 `http://127.0.0.1` 与最终托管域名的权限表现需要浏览器点击验证。

## 决定

静态产物、HTTP 可达、链接、锚点、响应式规则和代码/Mermaid 容器检查通过。由于真实浏览器视觉与交互未完成，本批不标记为自动发布；与课程规格一致，决定为 `manual_review`。
