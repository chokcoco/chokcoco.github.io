# Course theme system

课程站样式分为三层：

- `../theme.css`：主题加载器。所有主题文件在此通过 `@import` 引入，活跃主题由 `<html>` 上的 `data-theme` 属性决定。
- `guardnet.css`：默认暗色主题（Guardnet 风格），令牌定义在 `:root` 下。
- `evergreen.css`：浅色金融科技主题（Evergreen Finance 风格），令牌定义在 `[data-theme="evergreen"]` 下。
- `../course-shell.css`：课程结构与组件，不包含课程专属颜色。

## 主题切换

`../theme-switcher.js` 提供运行时切换：

- 页面右上角 `.topbar` 中自动注入一个切换按钮。
- 用户选择保存在 `localStorage`（key: `course-theme`），跨页面持久化。
- 切换时重新初始化 Mermaid 图表以匹配当前主题配色。
- 默认主题为 `guardnet`（无 `data-theme` 属性）；切换到 `evergreen` 时设置 `data-theme="evergreen"`。

### 新增主题

1. 在本目录创建新 CSS 文件，使用 `[data-theme="your-name"]` 选择器。
2. 复制 `guardnet.css` 的全部变量，调整为新风格的值。
3. 在 `../theme.css` 中添加 `@import url("./themes/your-name.css");`。
4. 在 `../theme-switcher.js` 的 `THEMES` 数组和 `LABELS` 对象中注册。
5. 在 `mermaidConfig` 函数中为新主题添加 Mermaid 配置。

主题文件至少要提供以下令牌组：

- 字体：`--font-sans`、`--font-display`、`--font-mono`
- 页面与文字：`--page`、`--ink`、`--muted`、`--muted-strong`
- 卡片与边框：`--surface*`、`--line*`、`--shadow`
- 品牌强调：`--accent*`、`--signal*`、`--page-glow`、`--mark`
- 形状：`--radius-xl`、`--radius-lg`、`--radius-md`、`--radius-pill`

`course-shell.css` 和 `app.css` 只能消费这些令牌，不应重新声明主题颜色。课程自己的 `assets/course.css` 只设置 `--course-mark`，用于首页背景字标。
