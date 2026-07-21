# 微前端与远端组件：Module Federation、qiankun、MMF

> 预计学习时间：120–160 分钟
> 一句话总结：理解前端从巨石单体到微前端的演进逻辑，能区分 FBS 三个前端仓库各自的微前端方案——Portal 的 Module Federation + qiankun、SC Vue 的 MMF 模块机制、SC React 的 MMF + 远端组件双重身份——并评估修改跨仓库公共组件时对各消费者的影响。

## 为什么前端需要微前端

### 从单体巨石到分而治之

前端项目在早期通常是一个单一应用——所有页面、所有功能都在一个代码仓库里，一起构建、一起部署、一起上线。这种模式在小团队和简单业务场景下是高效的。但随着团队规模和业务复杂度增长，三个问题变得不可忽视。

**第一个问题是协作冲突**。多个团队同时在一个仓库中开发不同功能模块，代码合并冲突频繁，每个人的改动都可能意外影响其他人的页面。一个团队修改了公共的 `Button` 组件，所有团队的页面都可能受影响，但只有到集成测试阶段才会暴露。

**第二个问题是构建和部署的耦合**。首页需要紧急上线一个 Banner 修改，但因为仓库里另一个团队正在做一个大型重构，整个构建失败。首页的紧急修复被困在构建系统里，没有任何技术原因——纯粹是组织上的耦合。

**第三个问题是技术栈锁定**。当一个仓库被锁定在某个框架版本（如 React 16），所有团队都必须接受这个约束。想用 React 18 的新特性？不行——整个仓库必须统一升级，而统一升级对大型项目来说是一个数月级别的工程。

这三个问题的核心矛盾在于：**团队的边界和代码的边界不重合**。多个团队共享一个仓库，但一个团队的改动不应该影响另一个团队的页面；一个团队想快速迭代，但被另一个团队的构建失败卡住；一个团队想升级技术栈，但被整个仓库的兼容性约束限制。

微前端（Micro Frontends）就是在解决这个问题。它的核心思想来自后端微服务架构：**将一个复杂的单体应用拆分为多个独立的小型应用，每个小应用由不同的团队独立开发、独立构建、独立部署，同时又能被组合成一个对用户来说统一的界面。**

这个思想在 2016 年左右由 ThoughtWorks 技术雷达首次系统性地提出。之后几年，社区涌现了多种实现方案：single-spa（基于路由加载独立子应用）、qiankun（阿里基于 single-spa 增强的方案）、Webpack Module Federation（构建时声明共享模块）、以及各公司内部的定制框架（如 FBS 使用的 MMF）。

### FBS 为什么需要三种机制而不是一种

FBS 的前端架构是微前端实践的一个真实缩影——三个阶段引入了三种不同的机制，每种机制解决不同的问题。

首先，Portal 是 FBS 前端的总入口。它需要加载来自不同团队、使用不同技术栈的独立子应用——比如履约团队的数据看板、仓储团队的报表页面。这些子应用是完全独立的仓库，有自己的路由、状态管理和构建流程。这时候 qiankun 是最合适的选择——它提供运行时的 JS 沙箱和样式隔离，让一个团队用 React 16、另一个团队用 Vue 3 也能共存。

其次，Portal 同时需要接入一些共享的 UI 能力——比如入库列表组件需要同时在 Portal 的入库管理页面和 Seller Center 的 SC 页面中出现。如果每个消费者都复制一份组件代码，维护成本翻倍。Module Federation 提供了更轻量的方案：将共享组件作为"远端模块"暴露出去，消费者在运行时动态加载，React 等核心依赖在宿主和远端模块之间共享，避免重复打包。

最后，Seller Center 本身是一个多模块宿主平台。在 Seller Center 中提供功能的团队（包括 FBS 团队）不需要各自搭建独立的宿主框架——只需要开发 MMF 模块，专注于业务逻辑。MMF 提供了统一的宿主基础设施：路由管理、Store 注入、全局依赖（`$gt`、`request`、`reporter` 等）。FBS 的两个 SC 仓库正是以 MMF 模块的身份运行在 Seller Center 中。

下面这个表总结了三种机制的出现背景：

| 机制 | 出现背景 | 解决的场景 | 在 FBS 中的位置 |
| --- | --- | --- | --- |
| qiankun | Portal 需要整合多个独立团队的子应用 | 加载完全独立的子应用（HTML/JS/CSS 隔离） | Portal 对外部子应用的加载 |
| Module Federation | Portal 需要共享组件但不想复制代码 | 运行时加载 JS 模块，共享 React 等核心依赖 | Portal 对 SC React 远端组件的消费 |
| MMF | Seller Center 需要统一管理多团队的功能模块 | 同一宿主内的模块化开发，模块共享宿主基础设施 | SC Vue / SC React 的运行容器 |

## Portal：Module Federation 与 qiankun 的分工

Portal 是 FBS 前端体系中角色最复合的仓库——它既承载入库管理、报表、配置等大量自身业务页面，同时又通过 Module Federation 和 qiankun 加载来自其他仓库或团队的远端模块与子应用。也就是说，Portal 的代码库里既有「自己写的功能」，也有「加载别人的功能」的编排逻辑。理解 Portal 自身业务与加载机制之间的关系，是理解整个 FBS 前端架构的起点。

### Module Federation：运行时加载 JS 模块

Webpack 5 的 Module Federation 允许一个应用（宿主，Host）在**运行时**加载另一个应用（远端，Remote）暴露的 JS 模块。传统的 npm 包方案要求远端每次变更后宿主需要重新安装依赖并重新构建；Module Federation 的远端模块更新后，宿主只需要重新加载页面就能获取最新代码——不需要重新构建。

Portal 的 Module Federation 配置在 `webpack.config.js` 中：

```javascript
// webpack.config.js（关键配置）
const { ModuleFederationPlugin } = require('webpack').container

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'fbs_portal',
      remotes: {},          // 远端模块在 remotes.js 中动态配置
      shared: {
        react: { singleton: true, eager: false },
        'react-dom': { singleton: true, eager: false },
        'react-router-dom': { singleton: true }
      }
    })
  ]
}
```

这里的关键是 `shared` 配置。`singleton: true` 表示整个页面中只有一个 React 实例——远端模块不能打包自己的 React，必须使用 Portal 提供的那个。这解决了「页面上有两个 React 导致 hooks 报错」的经典问题。`eager: false` 表示这些依赖不会在宿主启动时立即下载，而是延迟到第一个远端模块被加载时才下载。

远端模块的入口地址通过 `remotes.js` 管理：

```javascript
// remotes.js（简化核心逻辑）
const getRemoteModule = (moduleName, entry) =>
  `promise new Promise((resolve, reject) => {
    // 1. 先检查是否已加载
    if (window[moduleName]) {
      resolve(window[moduleName])
      return
    }

    // 2. 动态创建 script 标签加载远端 JS
    const script = document.createElement('script')
    script.src = getEntryUrl(moduleName, entry)
    script.onload = () => {
      if (window[moduleName]) {
        resolve(window[moduleName])
      } else {
        reject(new Error('Module not found on window'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load remote module'))
    document.head.appendChild(script)
  })`
```

注意 `getEntryUrl()` 函数——它从 `sessionStorage` 或默认地址中取得远端模块的 JS 文件 URL。这意味着本地开发时可以通过 `sessionStorage` 指向本地 dev server 的地址来调试远端模块。

Portal 中消费远端组件的方式：

```tsx
import React, { Suspense } from 'react'

const RemoteInboundComponent = React.lazy(
  () => import('remote_inbound/InboundComponent')
)

// 使用
function InboundPage({ irId }) {
  return (
    <Suspense fallback={<Spin />}>
      <RemoteInboundComponent irId={irId} />
    </Suspense>
  )
}
```

`import('remote_inbound/InboundComponent')` 中的 `remote_inbound` 对应 `remotes.js` 中的 moduleName。`React.lazy` + `Suspense` 处理加载中的状态——远端模块的网络加载通常需要几百毫秒到几秒不等，没有 Suspense 会让页面白屏。

**从零开始理解**：如果你只写过传统的 `import Foo from './Foo'` 静态导入，Module Federation 的概念可能感觉很复杂。但它的本质非常简单——`import('remote_inbound/InboundComponent')` 就是告诉 webpack：「这不是我自己的代码，去那个地址下载它」。就像你在 HTML 里写 `<script src="https://cdn.example.com/lib.js"></script>`，只不过 webpack 帮你处理了依赖共享和模块解析。

### qiankun：加载独立子应用

qiankun 解决的是另一类问题。Module Federation 共享的是 JS 模块——远端模块和宿主共享同一个 DOM、同一个 React 实例、同一套全局变量。但如果要加载的是一个由其他团队维护的完整应用——有自己的路由、状态管理、CSS 文件、甚至用的框架都不一样——Module Federation 就不够了。

qiankun 通过 runtime 沙箱提供了更强的隔离。每个子应用在自己的沙箱中运行，互不干扰：

```typescript
// Portal 中 qiankun 微应用注册（简化）
import { registerMicroApps, start } from 'qiankun'

registerMicroApps([
  {
    name: 'sub-app-data-dashboard',
    entry: '//cdn.example.com/sub-app-data-dashboard/',
    container: '#sub-app-container',
    activeRule: '/data-dashboard',
    props: {
      // Portal 下发给子应用的共享数据
      user: getCurrentUser(),
      permissions: getPermissions()
    }
  }
])

start()
```

`container` 指定子应用挂载到 Portal 的哪个 DOM 节点。`activeRule` 是路由匹配规则——当浏览器 URL 匹配 `/data-dashboard` 时，qiankun 自动激活对应的子应用。`entry` 是子应用的 HTML 入口地址——qiankun 会 fetch 这个 HTML，解析其中的 JS/CSS 资源并加载。

### Portal 中两种机制的边界

同一个 Portal 中同时运行 Module Federation 和 qiankun，它们的边界在哪里？

**Module Federation 用于 FBS 内部的组件级共享**——比如 SC React 的入库列表组件，FBS 团队自己维护，与 Portal 共享同一套 React 16 运行时。qiankun 用于加载外部团队的独立子应用——比如履约团队的数据看板，FBS 团队不维护，可能使用不同的技术栈。

这个边界对日常开发有两个直接影响：

1. 如果你在改 SC React 的远端组件，你只需要考虑 Module Federation 的兼容性——Props 是否向后兼容、依赖版本是否匹配 React 16。
2. 如果你需要接入一个外部团队的新子应用，你只需要在 Portal 的 qiankun 注册配置中添加一条记录——不涉及任何 Module Federation 配置的修改。

## SC Vue：以 MMF 模块的身份运行

SC Vue 仓库中没有 Module Federation 配置，也没有 qiankun 注册代码。但它的页面仍然在一个更大的宿主框架中运行——这个宿主就是 Seller Center，而连接 SC Vue 和 Seller Center 的机制是 MMF。

### MMF 模块到底是什么

MMF（Multi-Module Framework）是 Seller Center 的平台级框架。它的核心概念是：**把 Seller Center 拆成宿主和模块两层**。宿主提供路由系统、全局状态、权限校验、导航框架等基础设施；模块只负责具体的业务页面。宿主和模块之间通过严格的接口契约通信。

对于 SC Vue 的开发者来说，这意味着你写的是"模块"代码，但用户看到的是"在 Seller Center 里打开的 FBS 功能页面"。

### 模块的身份声明

每个 MMF 模块通过 `mmc.config.js` 向宿主声明自己的身份：

```javascript
// mmc.config.js
module.exports = {
  id: 435,              // 模块在 Seller Center 中的唯一 ID
  type: 'module',        // 类型：module（普通模块）
  tech: 'vue3',          // 技术栈
  name: 'FBS Inbound',
  routes: [              // 模块负责的路由声明
    {
      path: '/portal/fbs/inbound',
      component: () => import('./src/views/inbound/IBT/list/index.vue')
    }
  ]
}
```

`id` 是关键字段——它同时在模块侧（`mmc.config.js`）和宿主侧（Seller Center 平台配置）被引用，两边的 id 必须一致。`type: 'module'` 告诉宿主这个模块是一个标准的 MMF 模块（而不是远端组件——后面 SC React 部分会讲到 `type: 'remote-component'` 的区别）。

### 宿主注入：模块从宿主拿到了什么

SC Vue 在 `main.js` 中初始化时，不是从零开始创建 Vue 实例——而是在宿主已经准备好的上下文上注册自己：

```javascript
// main.js（核心流程简化）
import { createApp } from 'vue'
import { createStore } from 'vuex'
import { createRouter } from 'vue-router'

export function init({ hostStore, hostRouter, globalDeps }) {
  // 1. 创建 Vuex Store 实例，挂载到宿主 Store 的命名空间下
  const store = createStore({
    modules: { ... },
    // 注意：Store 实例被宿主管理，不是独立的
  })

  // 2. 创建 Router 实例，注册到宿主路由表
  const router = createRouter({
    routes: [ ... ]
  })

  // 3. 全局依赖挂载
  // host.i18n、host.request、host.$gt 等由宿主注入
  const app = createApp(App)
  app.config.globalProperties.$gt = globalDeps.$gt
  app.config.globalProperties.$request = globalDeps.request

  return { app, store, router }
}
```

这里的关键是 `init()` 函数——它不是模块内部调用的，而是由宿主的模块加载器在加载这个模块时调用的。`hostStore` 和 `hostRouter` 是宿主传入的，模块的 store 和 router 挂载在这些宿主对象上。这就是为什么 SC Vue 不能独立运行——它依赖宿主提供的 Store 和 Router 基础设施。

**从零开始理解**：如果你只写过一个完整的独立 Vue 应用——在一个 `new Vue({...})` 或 `createApp(...).mount('#app')` 中做完所有事情——MMF 模块的概念需要换个思路。你不是在创建一个应用，而是在一个已经存在的应用中「注册」你的功能。就像你在已有的 HTML 页面上用 `appendChild` 在指定 div 里渲染你的组件，而不是创建一个新的 HTML 页面。

### 模块内开发的关键约束

因为模块运行在宿主中，你在 SC Vue 中写代码时需要注意几个约束：

1. **不要修改全局样式**。你的 CSS 通过 scoped style 隔离，但如果写了 `body { margin: 0 }`，你会影响整个 Seller Center 的布局。
2. **不要在模块代码中 `Vue.use()` 宿主已注册的插件**。`vue-i18n`、`vue-router`、`@shopee/eds` 等组件库由宿主统一注册，模块重复注册可能导致冲突。
3. **全局依赖通过 `this.$gt`、`this.$request` 访问，不要自己创建**。这些依赖由宿主管理生命周期和配置（如 `$request` 的 baseURL 来自宿主环境配置），自行创建会导致请求发到错误的环境。
4. **路由 path 必须在 `mmc.config.js` 声明**。路由是在宿主编译时注册的——如果你在模块中动态创建了新路由但没有在 mmc 配置中声明，这个路由不会被宿主识别。

## SC React：MMF 模块 + 远端组件的双重身份

SC React 是三个仓库中架构最复杂的一个——它同时扮演两个角色：像 SC Vue 一样作为 MMF 模块运行在 Seller Center 中，同时作为远端组件提供者被 Portal 通过 Module Federation 加载。理解这个双重身份是本章最关键的部分。

### 角色一：MMF 模块

SC React 在 Seller Center 中是一个 MMF 模块，和 SC Vue 类似。但它的 `mmc.config.js` 和初始化方式与 Vue 有所不同：

```javascript
// mmc.config.js
module.exports = {
  id: 432,
  type: 'module',
  tech: 'react18',      // ← 注意：React 18，比 Portal 的 React 16 高两个大版本
  name: 'FBS SC React Module'
}
```

SC React 使用 React 18，支持 `useId`、`startTransition`、`useSyncExternalStore` 等新特性。但这意味着——它在 Portal 中不能直接用原始组件，因为 Portal 是 React 16。后面远端组件部分会详细讲这个兼容层。

SC React 模块的初始化：

```typescript
// main.tsx
import { registerRouterModule } from '@shopee/mmf-sdk'

const routes = [
  { path: '/portal/fbs/sc/inbound', component: InboundModule }
]

// 向宿主注册路由
app.registerRouterModule(routes)
```

与 SC Vue 的主要区别：SC React 使用 `registerRouterModule()` 而非在 mmc config 中声明 routes；Store 通过 `DepsProvider` 注入而非 Vuex 模块注册。

### 角色二：远端组件提供者

SC React 仓库中的 `projects/fbs-sc-remote-component/` 目录是远端组件的专属领地。这个目录下的组件会被额外构建为独立的 JS 产物，供 Portal 通过 Module Federation 加载。

远端组件的关键在于适配层。Portal 期望模块导出一个包含 `{ mount, update, unmount }` 方法的生命周期对象，而 MMF 宿主期望模块导出一个 React 组件——同一份代码需要同时满足两种格式。`createRemoteComponent` 工厂函数处理这个适配：

```typescript
// createRemoteComponent.tsx（核心逻辑简化）
export function createRemoteComponent(Component) {
  const hostType = getHostType() // 检测当前运行的宿主类型

  // 内部包装组件：为两种宿主统一提供 DepsProvider
  const WrappedComponent = (props) => (
    <DepsProvider>
      <SSCProvider>
        <Component {...props} />
      </SSCProvider>
    </DepsProvider>
  )

  // 根据宿主类型返回不同格式
  if (hostType === 'portal') {
    // Portal 格式：生命周期对象
    return {
      mount: (el, props, context) => {
        ReactDOM.render(
          <WrappedComponent {...props} portalContext={context} />,
          el
        )
      },
      update: (instance, props, context) => {
        // 更新组件，复用已创建的 DOM 容器
        ReactDOM.render(
          <WrappedComponent {...props} portalContext={context} />,
          instance.container
        )
      },
      unmount: (instance) => {
        ReactDOM.unmountComponentAtNode(instance.container)
      }
    }
  }

  // MMF 格式：直接返回 React 组件
  return WrappedComponent
}
```

`getHostType()` 通常在运行时通过检查 `window` 上的特定标识（如 `window.__SELLER_CENTER__`、`window.__PORTAL__` 等）来判断当前宿主。这个检测在模块加载时执行一次。

**从零开始理解**：`createRemoteComponent` 本质上是一个**适配器**。同一个 React 组件（`InboundComponent`），在 MMF 宿主中通过 `React.createElement(InboundComponent)` 直接渲染，在 Portal 中通过 `window[moduleName].mount(el, props, context)` 调用后使用 `ReactDOM.render` 渲染。两种方式的最终渲染结果是一样的，但 Portal 需要额外的生命周期方法（mount/update/unmount）是因为它的 Module Federation 架构需要统一的加载接口——不限于 React 组件，Vue 或其他框架的组件也可以通过相同接口加载。

### React 16 与 React 18 的跨宿主兼容

这是 SC React 远端组件开发中最关键的技术约束。SC React 模块本身使用 React 18 的新特性开发。但当同一个组件作为远端组件被 Portal 加载时，Portal 提供的是 React 16 运行时。

Module Federation 的 `shared: { react: { singleton: true } }` 确保了远端组件使用的是 Portal 提供的 React 16，而不是自己打包的 React 18。这意味着：

- 远端组件**可以使用** React 16 支持的特性：hooks（`useState`、`useEffect`、`useContext` 等——React 16.8+ 就支持）、`React.memo`、`React.lazy`。
- 远端组件**不能使用** React 18 独占的特性：`useId()`、`startTransition()`、`useDeferredValue()`、`useSyncExternalStore()`。这些在 React 16 中不存在，调用会抛 `TypeError: (0, React.useId) is not a function`。
- 如果业务逻辑必须使用 React 18 特性，有两个选项：一是在远端组件中通过 `React.useId !== undefined` 之类的特性检测做降级；二是推动 Portal 升级到 React 18（这是一个数月级别的跨团队工程）。

### 针对 SC React 仓库的开发清单

当你在 SC React 中开发一个需要在 Portal 中消费的远端组件时，使用以下清单：

1. **确认组件导出使用了 `createRemoteComponent` 工厂**。不要直接 `export default YourComponent`——直接导出仅适用于 MMF 侧消费，Portal 侧会报 `Element type is invalid`。
2. **确认组件不依赖 React 18 独占 API**。在本地用 React 16 环境测试一次（见下面调试步骤）。
3. **确认全局依赖在两种宿主中都可用**。`DepsProvider` 在 Portal 侧通过 `mount()` 的 `context` 参数注入依赖，在 MMF 侧通过模块作用域的全局变量注入。如果你在组件中直接引用了 `window.xxx`，确认它在两种宿主中都存在。
4. **新增 Props 时优先设为可选**。`interface Props { region?: string }` 而非 `region: string`——这样 Portal 侧即使没有传入新 Props，组件也不会崩溃。
5. **测试覆盖两种宿主**。至少在 MMF Dev Tools（模拟 Seller Center）和 Portal Module Federation 环境下各验证一次。

本地调试 Portal 侧消费的步骤：

1. 在 SC React 中修改远端组件代码，运行 `pnpm dev:remote` 启动远端组件 dev server。
2. 打开浏览器 DevTools → Application → Session Storage → 设置 `fbs_remote_component_dev` 为远端组件 dev server 地址。
3. 刷新 Portal 页面，Module Federation 将从你的本地 dev server 加载远端组件代码，而非生产 CDN 版本。
4. 在 Console 中检查是否有 `Module not found` 或 `Element type is invalid` 错误。

## 远端组件跨宿主生命周期的完整追踪

本章已经分别讲解了三种机制，现在把它们串联起来，以同一个 `InboundComponent` 为例，看它在 Portal 和 Seller Center 中的完整加载路径。

### Portal 侧的加载路径

1. Portal 页面代码 `React.lazy(() => import('remote_inbound/InboundComponent'))` 触发动态加载。
2. Webpack 查找 Module Federation 配置中 `remote_inbound` 的入口 URL（通过 `remotes.js` 的 `getEntryUrl` 函数）。
3. 创建 `<script>` 标签加载远端组件 JS 文件。
4. JS 执行：`window['remote_inbound'] = { get: ..., init: ... }`。
5. Webpack 调用 `window['remote_inbound'].get('InboundComponent')` → 获得 `createRemoteComponent` 返回的 `{ mount, update, unmount }`。
6. Portal 调用 `.mount(el, props, context)` → `ReactDOM.render` 渲染组件。

### Seller Center（MMF）侧的加载路径

1. Seller Center 宿主编译时读取 `mmc.config.js` 中的 `id: 432`，将模块路由合并到宿主路由表。
2. 用户访问 `/portal/fbs/sc/inbound`，宿舍由匹配到 SC React 模块的路由。
3. 宿主模块加载器加载模块的 `main.tsx` 入口。
4. `main.tsx` 调用 `app.registerRouterModule(routes)` 注册路由 → React Router 渲染对应的组件。
5. 组件在 `DepsProvider` 上下文中运行，通过 `useContext` 获取全局依赖。

### 两条路径的差异为何必然存在

Portal 需要通过 `mount/update/unmount` 生命周期方法控制远端组件，是因为 Portal 的微前端架构中需要支持非 React 组件的加载——如果一个 Vue 组件需要通过 Module Federation 接入，Portal 仍然用 `mount/update/unmount` 接口。MMF 不需要这个抽象层，因为它只运行 React 组件，`React.createElement` 已经足够了。

这也解释了为什么 `createRemoteComponent` 不是一个可选工具——它是 Portal 和 MMF 两种宿主之间的**协议转换器**。

## 三种仓库的开发约束总结

本章从 Portal、SC Vue、SC React 三个仓库的角度分别讲解了各自的微前端方案。在日常开发中，这三个仓库的微前端相关操作可以归纳为下表：

| 操作 | Portal | SC Vue | SC React |
| --- | --- | --- | --- |
| 新增页面 | React Router 注册 | 在 Vue Router 注册 + `mmc.config.js` 声明路由 | `registerRouterModule()` 注册 |
| 修改全局依赖 | Portal 的 Redux Store | 不影响——依赖从 MMF 宿主注入 | 不影响——依赖通过 `DepsProvider` 注入 |
| 新增公共组件 | 放 `src/components/`，仅供 Portal 使用 | 放 `src/views/` 内，仅供 SC Vue 使用 | 放 `projects/fbs-sc-remote-component/`，供 Portal 消费 |
| 修改远端组件 Props | 检查 Portal 消费代码是否传入新 Props | 不消费远端组件 | 确保 Portal 和 MMF 两侧都兼容 |
| 依赖版本升级 | 需评估 qiankun 子应用兼容性 | 需确认宿主支持的版本 | 远端组件需保持 React 16 兼容 |
| 本地启动 | `yarn dev`，独立运行 | MMF Dev Tools 必需 | `yarn dev`（MMF 模式）或 `pnpm dev:remote`（远端组件模式） |

## 常见错误与排查

### 远端组件在 Portal 中不渲染

最可能的原因：`createRemoteComponent` 未正确适配 Portal 格式。Portal 检测到模块返回值没有 `.mount` 方法 → 尝试用 `React.createElement` 渲染但失败。排查：在 Console 中 `console.log(window['remote_inbound'])` 确认模块是否正确加载；检查 `createRemoteComponent` 是否被正确调用。

### 远端组件使用了 React 18 特性在 Portal 中报错

错误信息 `TypeError: (0, React.useId) is not a function`。原因：Portal 提供 React 16，`useId` 不存在。修复：降级到 React 16 兼容写法，或用特性检测 `if (typeof React.useId === 'function') { ... } else { ... }`。

### MMF Dev Tools 不加载模块

确认模块 ID 与 `mmc.config.js` 中的 `id` 一致。确认 dev server 端口正确且在运行。确认 Chrome 扩展已启用。

### 模块部署后 Portal 中远端组件仍是旧版本

可能原因：CDN 缓存未刷新；`remotes.js` 中的入口 URL 仍指向旧版本；浏览器 Service Worker 缓存。最快验证方法：Network 面板检查远端组件 JS 文件的 URL 和响应内容。

## 练习

### 练习一：绘制三个仓库的加载路径图

分别画出 InboundComponent 在 Portal 和 Seller Center（MMF）中的完整加载路径。在路径图的每个节点上标注关键文件（如 `remotes.js`、`mmc.config.js`、`createRemoteComponent.tsx`、`main.tsx`）。这不需要画成精美的流程图——在白纸或编辑器里画出调用关系即可，关键是确认你理解了每一层的职责。

### 练习二：新增远端组件 Props 的兼容评估

假设 InboundComponent 需要新增一个必填 Props `region`（字符串类型）。评估这个改动对以下消费者的影响，写出每个需要修改的文件路径和改动内容：
- Portal 中的消费代码
- SC React MMF 模块中的消费代码
- 远端组件自身的 Props 类型定义

如果你的评估中发现某个消费者不需要修改（比如 Portal 侧可以从 context 中自动获取 region），说明原因。

### 练习三：机制选择题

以下场景应该使用哪种机制？说明原因。
a) FBS 需要在 Portal 中展示一个由仓储团队维护的数据看板页面（该团队使用 Vue 3）。
b) FBS 需要在 Portal 和 Seller Center 中展示同一个「入库状态标签」组件。
c) FBS 需要在 Seller Center 中新增一个「FBS 操作日志」功能页面。

### 练习四：排查 Module Federation 加载失败

Portal 中 `React.lazy(() => import('remote_inbound/InboundComponent'))` 触发了加载失败，页面中对应区域显示 Loading 状态持续不消失（Suspense fallback 没有替换为实际组件）。列出你排查这个问题的完整步骤——从 Network 面板到 Console 到 Source 面板的逐层检查。

### 参考答案

**练习一**：参考「远端组件跨宿主生命周期的完整追踪」一节——Portal 路径 6 步，MMF 路径 5 步。

**练习二**：Portal 消费代码中 `InboundPage` 组件的 `region` Props 需要传入（如果 region 可以从 Portal 的 Redux Store 或当前路由推导，考虑在 Portal 侧封装一层而非要求每个消费者传入）。SC React MMF 模块同理。远端组件 Props 类型定义改为 `region: string`（如果接受「未传入时使用默认值」，可改为 `region?: string` 并在组件内提供默认值）。

**练习三**：a) qiankun——独立子应用，不同团队维护，不同技术栈。b) Module Federation 远端组件——内部共享组件，需要跨宿主复用。c) MMF 模块——在 Seller Center 中的标准新功能开发模式。

**练习四**：1) Network 面板 → 找到远端组件 JS 的请求 → 确认 HTTP 状态码（404 表示 URL 错误，CORS 错误表示跨域策略问题）→ 确认响应内容是 JS 代码而非 HTML 错误页。2) Console → 查找 `Failed to load`、`Module not found`、`Element type is invalid` 错误。3) Application → Session Storage → 确认开发模式下的 URL 覆盖是否正确。

## 自检

1. 微前端解决了前端的哪三个核心问题？FBS 为什么使用了三种不同的微前端机制而不是统一成一种？
2. 在 Portal 中，Module Federation 和 qiankun 各用于什么场景？它们的核心技术差异是什么（模块级共享 vs 应用级隔离）？
3. 在 SC Vue 中开发时，有哪些操作是受限的（不能独立创建 Vue 实例、不能修改全局样式、全局依赖必须通过宿主注入）？为什么？
4. SC React 的 `createRemoteComponent` 为什么必须存在？如果去掉它，把远端组件直接 export，在 Portal 和 MMF 中各会发生什么？
5. 远端组件为什么不能使用 React 18 独占 API？如果业务必须使用 `useId()`，有哪些兼容方案？

## 参考文献

- [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/)
- [qiankun Guide](https://qiankun.umijs.org/guide)
- [ThoughtWorks Technology Radar — Micro Frontends](https://www.thoughtworks.com/radar/techniques/micro-frontends)
- [React 16.14.0 Release](https://github.com/facebook/react/releases/tag/v16.14.0)
- [React 18 Upgrade Guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
- FE-A01 三种应用生命周期与宿主边界
