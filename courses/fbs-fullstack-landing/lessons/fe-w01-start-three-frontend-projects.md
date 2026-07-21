# 启动三类 FBS 前端工程并建立仓库地图

> 预计学习时间：130–180 分钟
> 一句话总结：掌握 FBS 三个前端仓库的 Node 版本、包管理器、MMC/Webpack 构建工具和 dev server 的启动方式，能选择一仓完成完整启动并获得可核验的页面结果，另两仓能解释命令与运行边界。

## 这一章解决什么问题

后端研发最初接触 FBS 前端时，遇到的不是"看不懂 JSX"或"不会写组件"，而是更基础的问题：我应该用 Node 14 还是 Node 20？这三个仓库分别用 Yarn、pnpm 还是 npm？为什么 Portal 跑在 `localhost:8099`，Seller Center Vue 跑在 `localhost:4200`，而 React 模块又是另一个端口？`yarn install` 执行到一半报 registry 错误应该怎么排查？

本章从"能跑起来"这个最基本的目标出发，逐一核验三个仓库的环境要求，给出最小启动命令，然后帮你建立一张仓库职责地图。完成本章后，你至少能让一个前端仓库在本地成功启动并看到页面，另外两个仓库能说出它们的 Node 版本和启动命令。

学完本章不代表你能开始写前端代码——那是后续工程章节的事。但你会获得一个最重要的起点：知道在开始改代码之前，需要确认哪些工具版本，以及每个仓库的 `package.json` 里的 scripts 分别做什么。

> 本章基于三个前端仓库的 release 分支（2026-07-20）。环境要求、端口和命令可能随仓库演进变化，操作前以当前工作树的 `package.json` 和 `AGENTS.md`/fullstack Skill 为准。本章只支持 macOS + 公司开发环境。

## 先看完成后的结果

完成本章后，你应该能够：

1. 按顺序列出三个仓库使用的 Node 版本、包管理器和主要构建工具。
2. 在至少一个仓库中完成 `install → dev server → 浏览器打开页面` 的完整流程。
3. 在另外两个仓库中，能说出为什么它们的启动方式不同（而不是"因为没有试过"）。
4. 保存一张"仓库版本身份证"表格，包含 Node 版本、包管理器、构建工具、dev server 端口和启动命令。

## 工具与关系

FBS 三个前端仓库的技术栈不是一套统一配置。在开始安装之前，先建立它们的分工：

| 仓库 | 代号 | 框架 | Node | 包管理器 | 构建工具 | 定位 |
| --- | --- | --- | --- | --- | --- | --- |
| `fbs-frontend` | Portal | React 16 | `>=16 <17` | Yarn Classic | Webpack 5 | FBS Portal 管理后台、OPS 平台 |
| `fbs-sc-vue` | SC Vue | Vue 3 | 20.x（已验证） | Yarn Classic | MMC v3 / Rsbuild | Seller Center FBS 模块（Vue 版） |
| `fbs-sc-react` | SC React | React 18 | 20.x | pnpm 8 | MMC / Rsbuild | Seller Center FBS 模块（React 版）+ 远端组件 |

三者的角色分工：

- **Portal** 是独立运行的 SPA（Single Page Application）。它有自己的 Webpack dev server，直接访问 `http://localhost:8099`。不需要 MMC，不需要 Seller Center 宿主。
- **SC Vue** 是一个 MMF（Multi Module Framework）模块。它不能独立运行——本地 dev server 需要代理到 Seller Center 测试环境，通过 MMF Dev Tools（一个 Chrome 扩展）注入本地模块覆盖线上版本。
- **SC React** 也是一个 MMF 模块，但它是 pnpm monorepo 结构，包含 `projects/react-frontend`（主模块）和 `projects/fbs-sc-remote-component`（远端组件）。

对后端研发学习前端来说，推荐优先级：**SC Vue > Portal > SC React**。SC Vue 的 start 流程最简洁（`yarn dev`），且 Vue 3 + TypeScript 的模板语法比 React JSX 更接近后端同学习惯的声明式编码。Portal 则是最接近传统 Web 应用的开发体验，不需要 MMF 和宿主概念。

## 安装前核验

在尝试启动任何仓库之前，先确认你本机的 Node.js 环境。

### 检查和切换 Node 版本

```bash
# 查看当前 Node 版本
node -v
# 查看已安装的 Node 版本（如果使用 nvm）
nvm ls
```

FBS 仓库需要两个 Node 版本并存：Portal 需要 Node 16，两个 SC 仓库需要 Node 20。如果你使用 nvm，可以在不同终端窗口中分别设置：

```bash
# 终端 A（Portal）
nvm use 16
node -v  # 应该显示 v16.x.x

# 终端 B（SC Vue / SC React）
nvm use 20
node -v  # 应该显示 v20.x.x
```

如果未安装对应版本：

```bash
nvm install 16
nvm install 20
```

### 确认包管理器

```bash
# Yarn Classic（Portal 和 SC Vue）
yarn --version  # 应该显示 1.x.x，推荐 1.22.x

# pnpm（SC React）
pnpm --version  # 应该显示 8.x.x
```

如果缺少对应工具：

```bash
npm install -g yarn   # Yarn Classic
npm install -g pnpm@8 # pnpm 8
```

### 确认网络与 npm registry

FBS 仓库依赖公司内部 npm registry。启动前确认：

```bash
# 查看当前 registry
npm config get registry
# 应该返回公司内部 registry 地址

# 如果没有配置，按团队文档设置
# npm config set registry <内部地址>
```

如果你能看到 `package.json` 中的 `@scfe-common`、`@shopee` 等 scope 包成功下载，说明 registry 配置正确。如果 `yarn install` 或 `pnpm install` 在下载阶段卡住或报 404/401，通常是因为 registry 不通或未登录。

## 分仓库启动

### SC Vue：最简洁的启动路径

SC Vue 是目前三个仓库中最容易完整的启动体验。进入仓库目录后，三步就能看到页面：

```bash
cd Work/FBS/fbs-sc-vue

# 1. 确保 Node 20
node -v  # v20.x.x

# 2. 初始化（安装依赖 + MMC + 拉取 i18n + 获取模块信息）
yarn run init
# 这一步会依次执行：
#   - yarn install（安装 npm 依赖）
#   - 安装 MMC v3 全局工具
#   - 拉取远程 i18n 翻译文件
#   - 获取模块在 Seller Portal 中的配置信息

# 3. 启动 dev server
yarn dev
# 默认在 http://localhost:4200 启动
```

`yarn run init` 是一个聚合命令。排查失败时，逐条执行子步骤：

```bash
yarn install          # 依赖安装失败 → 检查 registry 和网络
yarn run getKey       # 获取模块 key
yarn run getModule    # 获取模块远程配置
yarn run i18n:pull    # 拉取翻译文件
```

本地 dev server 启动后，`localhost:4200` 本身不会显示 FBS 页面。你需要在 Chrome 中安装 **MMF Dev Tools** 扩展，然后：

1. 访问 Seller Center 测试环境的任意页面。
2. 点击 MMF Dev Tools 图标，在弹出面板中填入模块 key 和 `localhost:4200`。
3. 刷新 Seller Center 页面，导航到 FBS 模块——此时页面渲染将由本地 dev server 提供。

完整 MMF 本地调试流程超出了语言基础的范围，但你现在需要知道的关键点是：SC Vue 和 SC React 都不能脱离宿主独立访问，它们依赖 MMF Dev Tools 注入本地构建产物。如果浏览器打开 `localhost:4200` 只看到空白页或默认页面，这是正常的——模块需要宿主环境。

### Portal：独立 SPA 的启动路径

Portal 是最接近传统 Web 开发的体验，不依赖任何宿主或浏览器扩展：

```bash
cd Work/FBS/fbs-frontend

# 1. 确保 Node 16
node -v  # v16.x.x

# 2. 安装依赖
yarn install

# 3. 拉取 i18n 翻译文件
yarn i18n:pull

# 4. 启动 dev server
yarn start
# 默认在 http://localhost:8099 启动
```

启动成功后，直接在浏览器打开 `http://localhost:8099`，你应该能看到 FBS Portal 的登录页或首页。Portal 是独立 SPA，不依赖 Seller Center 宿主——这是它和两个 SC 仓库最根本的区别。

Portal 默认代理 API 请求到测试环境后端。如果你发现页面加载但数据为空，检查 Network 面板中的 API 请求是否返回了数据。如果 API 返回 401 或 CORS 错误，可能是因为 cookie/鉴权问题——Portal 需要你先在浏览器中登录过 test 环境的 Seller Center 或 Portal。

### SC React：pnpm monorepo 的启动路径

SC React 使用 pnpm workspace 管理多个子项目，启动流程比 SC Vue 稍多一步：

```bash
cd Work/FBS/fbs-sc-react

# 1. 确保 Node 20 + pnpm 8
node -v  # v20.x.x
pnpm --version  # 8.x.x

# 2. 安装所有 workspace 的依赖
pnpm install

# 3. 初始化宿主（拉取模块信息、i18n 等）
pnpm run init:host

# 4. 启动主模块 dev server
pnpm run dev:host
# 项目入口为 projects/react-frontend
```

SC React 的 `pnpm-workspace.yaml` 定义了 workspaces：`projects/*`、`domains`、`basic`。`pnpm install` 会安装所有这些目录下的依赖。

如果你需要同时开发远端组件，另开一个终端窗口：

```bash
cd Work/FBS/fbs-sc-react
pnpm run init:remote   # 初始化远端组件
pnpm run dev:remote    # 启动远端组件 dev server
```

和 SC Vue 一样，本地 dev server 启动后也需要通过 MMF Dev Tools 注入。差异在于 SC React 的模块 ID 和端口配置可能不同——具体以 `mmc.config.js` 中的 `id` 字段和启动时的终端输出为准。

## 三种工程形态的差异地图

现在三仓的启动命令已在手边，更重要的是理解它们为什么不同。以下是横向对比：

| 维度 | Portal | SC Vue | SC React |
| --- | --- | --- | --- |
| **运行形态** | 独立 SPA | MMF 模块 | MMF 模块 + 远端组件 |
| **宿主** | 无 | Seller Center | Seller Center |
| **dev server 端口** | 8099 | 4200 | MMC 动态分配 |
| **本地调试方式** | 浏览器直连 | MMF Dev Tools 注入 | MMF Dev Tools 注入 |
| **路由注册** | React Router 5 文件定义 | MMF route config 数组 | `registerRouterModule` |
| **状态管理** | Redux + Recoil | Vuex（宿主注入） | Redux Toolkit + 宿主 Vuex |
| **请求库** | Axios 0.18 + Portal proxy | Axios（宿主 clone） | Axios 1.12（宿主 clone） |
| **样式方案** | Less + CSS Modules | Less + Vue scoped style | Less + CSS Modules |
| **i18n** | i18next + Transify | Transify（宿主提供） | Transify（宿主提供） |
| **权限** | 路由 + 操作权限码 | 路由 authCodes + 操作权限 | 路由 authCodes + 操作权限 |

这张表不是用来背的。它的作用是在你以后遇到问题时提供排查方向。如果 Portal 页面可以独立访问，两个 SC 仓库不能，因为它们缺少 Seller Center 宿主提供的基础设施（会话、Store、i18n、请求实例）。

### MMC 的角色

MMC（Multi Module CLI）是 Seller Center 多模块框架的命令行工具。在两个 SC 仓库中，它承担了 Webpack/Rspack 配置、模块注册、产物打包和 dev server 管理。你不必深入理解 MMC 的内部实现，但需要知道：

- `mmc.config.js` 声明模块 ID、类型（module/portal/remote-component）、技术栈（vue3/react18）。
- dev server 启动时，MMC 读取 `mmc.config.js`，生成合适的 Webpack/Rsbuild 配置。
- 构建产物会包含模块元信息，Seller Center 宿主通过它加载模块。

### 为什么三个仓库的 Node 版本不一致

Portal 使用 Node 16 是因为它的依赖链中存在对 Node 17+ 不兼容的包（且 Portal 的 React 16 和 Webpack 5 组合在当前阶段不需要升级 Node）。两个 SC 仓库使用 Node 20 是因为 MMC v3 和 Rsbuild 对 Node 18+ 有要求。这不是"历史遗留问题"——这是正常的多项目并存状况，每个项目在自己的依赖兼容范围内选择最合适的 Node 版本。

你在不同仓库之间切换时，记得先切 Node 版本。最常见的问题是：在 SC Vue 目录下执行 `yarn dev`，但用的是 Node 16，导致 MMC 或某些依赖失败。

## 常见失败与排错路径

### `yarn install` 卡在某个 scope 包

```text
error An unexpected error occurred: "...@scfe-common/xxx: Not found"
```

**排查顺序**：确认 registry 配置 → 检查内网连接 → 确认是否需要登录 → 检查是否在 VPN 环境中。如果你在公司内网但也有部分包报 401，尝试 `npm login --registry=<内部地址>`。

### `mmc: command not found`

MMC 由 `yarn run init` 全局安装。如果 `init` 步骤执行了但 MMC 仍不可用，检查：

```bash
which mmc
# 如果找不到：
npm list -g @scfe/mmc
# 或全局重装
npm install -g @scfe/mmc
```

### dev server 启动但浏览器访问空白

- **Portal (`localhost:8099`)**：确认 `yarn i18n:pull` 已执行。i18n 翻译文件缺失是 Portal 空白最常见的原因。检查浏览器 Console 是否有 `Cannot read properties of undefined (reading 'xxx')` 类似的错误。
- **SC Vue / SC React**：确认 MMF Dev Tools 已配置并启用。本地 dev server 的页面本身就是空白（或只有框架基础壳）——页面内容由宿主注入。

### `yarn dev` 报端口占用

```bash
# 查看占用端口的进程
lsof -i :4200
# SC Vue 默认端口 4200
# Portal 默认端口 8099
```

如果需要修改端口， SC Vue 可以在 `mmc.config.js` 或启动命令中指定（取决于 MMC 版本），Portal 通过环境变量或 webpack devServer 配置修改。

### 切换仓库后忘记切 Node 版本

这是最简单也最高频的错误。养成习惯：进入任何 FBS 前端仓库后，第一个命令永远是 `node -v`，确认当前版本与仓库要求的范围一致。

## 验收记录

保存以下表格作为你完成本章的证据：

| 仓库 | Node 版本（实际） | 包管理器（版本） | `install` 成功 | dev server 成功 | 页面可访问 |
| --- | --- | --- | :---: | :---: | :---: |
| Portal (`fbs-frontend`) | | | | | |
| SC Vue (`fbs-sc-vue`) | | | | | |
| SC React (`fbs-sc-react`) | | | | | |

至少完成一行的全部勾选。另外两行至少完成前两列（版本信息）。这样做不是为了收集数据，而是为了建立一个习惯：在改代码之前，先确认自己站对了环境。

如果你在某一仓卡住了 20 分钟以上，不要继续硬排——先在剩下的仓库中完成一次完整启动，获得正向反馈和经验，再回头处理问题仓库。



### 启动顺序与依赖关系

三个仓库的启动有隐含的依赖顺序。如果你要完整验证一条从前端到后端的请求链路，启动顺序是：

1. **后端先启动**：`sbs-fbs-server` 的 API server 在测试环境已运行，本地通常不需要启动（除非你在做后端开发）。
2. **前端后启动**：任一前端仓库的 dev server。
3. **对于 SC 仓库**：还需要 MMF Dev Tools 注入 → 访问 Seller Center 测试环境。

如果你在本地同时启动了前端和后端，注意端口不要冲突。Portal 的 Webpack dev server 默认会代理 `/api` 请求到后端——检查 `webpack.config.js` 中的 devServer proxy 配置，确认代理目标指向正确的后端地址。

### i18n 文件缺失导致的一系列问题

三个仓库在 `yarn install` 之后、`yarn dev` 之前都可能需要 i18n 文件。Portal 的 i18n 文件在 `yarn i18n:pull` 后生成到 `src/lang/`；SC Vue 的 i18n 由 `yarn run init` 步骤中的 `yarn i18n:pull` 生成。如果 i18n 文件缺失，常见症状是：

- 页面所有文字显示为 key 名（如 `inboundProblemId` 而非"入库问题 ID"）。
- Console 报 `Cannot read properties of undefined`——因为 `$t` 函数依赖的 i18n 实例未正确初始化。
- 某些组件（依赖翻译文件的）完全不渲染。

修复方式：确认 `src/lang/` 目录下有对应语言的 JSON 文件（如 `zh-CN.json`、`en.json`），如果没有，重新执行 `yarn i18n:pull`。

### 理解 dev server 的热更新机制

三个仓库的 dev server 都支持热更新（HMR——Hot Module Replacement）：你修改源码并保存后，浏览器中的页面自动刷新或局部更新，不需要手动重启 dev server。但 HMR 有边界：

- 修改 `.vue` 或 `.tsx` 组件文件：通常自动热更新。
- 修改 `mmc.config.js` 或 `webpack.config.js`：需要重启 dev server。
- 修改 `package.json` 或新增依赖：需要重新 `yarn install` 后重启。
- 修改路由配置：Vue Router 和 React Router 的配置变更通常需要手动刷新浏览器（不一定要重启 dev server）。

如果你改了代码但页面没变化，先确认文件是否正确保存，再确认 dev server 的终端输出是否有编译错误。HMR 失败时终端通常有明确的错误信息。

## 练习

### 三选一完整启动

选择 SC Vue 或 Portal 完成完整启动流程。保存以下证据：

- 终端中执行 `node -v` 和 `yarn --version` 的输出截图。
- `yarn dev`（或 `yarn start`）的启动日志中显示 "Compiled successfully" 或类似成功信息的截图。
- 浏览器中打开对应页面（Portal 直接打开，SC Vue 通过 MMF Dev Tools 注入）的截图。

### 建立仓库地图

在不查看上面表格的情况下，默写三个仓库的 Node 版本、包管理器和 dev server 默认端口。

### 解释差异

用一两句话解释：为什么 Portal 可以独立访问 `localhost:8099` 看到页面，而 SC Vue 访问 `localhost:4200` 不能直接看到 FBS 页面？

### 参考答案

**8.3**：Portal 是独立 SPA，它的 Webpack dev server 会渲染完整的 React 应用，因此浏览器直连即可看到页面。SC Vue 是 MMF 模块，它的 dev server 只提供模块的 JavaScript/CSS 产物，页面结构（HTML、宿主框架、导航栏、全局状态）由 Seller Center 宿主提供，模块只在宿主请求时才被加载。

## 参考文献

- [Node.js 16 API](https://nodejs.org/docs/latest-v16.x/api/) — Portal 运行线
- [Node.js 20 API](https://nodejs.org/docs/latest-v20.x/api/) — SC 两仓运行线
- [Yarn Classic Documentation](https://classic.yarnpkg.com/lang/en/docs/) — Portal 和 SC Vue 的包管理器
- [pnpm Documentation](https://pnpm.io/) — SC React 的包管理器
- [Webpack Concepts](https://webpack.js.org/concepts/) — Portal 构建工具
- [Rspack Introduction](https://rspack.rs/guide/start/introduction) — SC Vue 构建工具底层
- [Rsbuild Guide](https://rsbuild.rs/guide/start/) — SC Vue 构建工具配置层
