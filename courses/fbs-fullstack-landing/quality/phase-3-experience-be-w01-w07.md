# 第三阶段体验审校：模块五 BE-W01～BE-W07（结构返工后）

- 范围：课程首页、BE-W01～BE-W07 HTML
- 内容哈希：`6f6027a69b47624396e32ecd9d4a4eec49d4226ebd6ed8058cc5aaf7cc46191d`
- 环境：本地静态 HTTP 服务、Codex 内置浏览器
- 视口：桌面 1280px；窄屏 390×844
- 日期：2026-07-20

## 检查结果

| 项目 | 结果 | 证据 |
| --- | --- | --- |
| 首页目录 | 通过 | 33 个 lesson 链接，模块五 7 个 BE-W 链接，模块五标题存在 |
| 标题顺序 | 通过 | W04 自检前已完成查询、事务、锁、对照、案例与练习；W07 自检前完成台账、8 个里程碑、回归与交接 |
| Mermaid | 通过 | 7 章合计 11/11 个 Mermaid 容器均生成 SVG；各页数量为 1、2、2、2、2、1、1 |
| 桌面布局 | 通过 | 抽查 W01/W04/W07，页面 `scrollWidth = clientWidth = 1280` |
| 窄屏布局 | 通过 | 7 章均 `scrollWidth = clientWidth = 390`；宽表和 Mermaid 保留容器内横向滚动 |
| 行内代码 | 通过 | W04 长路径在 390px 下可断行，页面级宽度由 457px 修复为 390px |
| 主题切换 | 通过 | evergreen → 默认主题 → evergreen，页面无异常 |
| 代码复制 | 通过 | W04 3 个复制按钮；点击后“复制”变为“已复制” |
| 控制台 | 通过 | 首页、重点章、7 章窄屏矩阵及交互检查均无 warning/error |

## 本轮发现与修复

W04 的行内路径 `apps/inbound/asn/infra/db/fbs_asn_repo_impl.go` 在 390px 视口不换行，造成 457px 页面级横向溢出。修复写入 `scripts/build-static-course.mjs` 的课程样式生成逻辑：仅对非 `pre` 中的行内 `code` 启用 `overflow-wrap: anywhere` 与 `word-break: break-word`。重新构建后 W04 为 390px，代码块、表格和 Mermaid 的内部滚动不受影响。

## 未覆盖

- 未测试外部 URL 当前可达性。
- 未执行正文中的公司环境命令、真实数据库或跨服务请求；这些属于第二阶段已记录的授权环境验收项。

## 决策

`ready`。无页面级溢出、Mermaid 或交互阻塞项。
