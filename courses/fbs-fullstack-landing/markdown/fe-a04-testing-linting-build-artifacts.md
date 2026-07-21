# 测试、静态检查、构建与产物边界

> 预计学习时间：120–160 分钟
> 一句话总结：能按 FBS 仓库选择正确的 lint、type-check、test 与 build 命令，理解三个仓库的构建配置、产物目录和 Portal/MMF 的消费边界——为一个 diff 输出可复核的开发准出清单。

## 这一章解决什么问题

写代码只是开发的一半。在 FBS 前端仓库中，从写完代码到"可以提交 MR"，中间还有四道工序：lint（代码风格和潜在错误检查）、type-check（TypeScript 类型检查）、test（单元测试和集成测试）、build（构建可部署的产物）。每道工序在不同仓库中的命令、配置、耗时都不同。

更重要的是，三个仓库的构建产物形式完全不同。Portal 构建出一个完整的 SPA bundle，部署后独立运行；SC Vue 和 SC React 构建出 MMF 模块产物，由 Seller Center 宿主加载。理解这些差异，你才能判断一个改动是否应该触发构建验证，以及出问题时应该从哪里排查。

本章不罗列每个仓库的全部配置项——那是文档做的事情。本章帮你建立一套判断流程：根据 diff 范围判断需要跑哪些检查，知道每个仓库的检查命令是什么，理解构建产物的消费者是谁，以及如何为自己的改动整理一份 reviewer 可复核的开发准出清单。

> 本章基于三个前端仓库的 release 分支（2026-07-20）。

## 四道检查的职责与触发时机

### lint：代码风格和潜在错误

| 仓库 | 命令 | 工具 | 典型耗时 |
| --- | --- | --- | --- |
| Portal | `yarn lint` | ESLint + Stylelint | 1-2 分钟 |
| SC Vue | `yarn lint` | ESLint | 30-60 秒 |
| SC React | `pnpm lint`（如配置） | ESLint | 30-60 秒 |

lint 检查的是代码**怎么写**的问题：缩进、引号风格、未使用变量、禁止的 API 等。ESLint 规则由仓库根目录的 `.eslintrc` 定义——三个仓库的规则略有差异，但核心原则一致。

lint 应该在每次提交前运行。如果 lint 失败，优先按规则建议修改，不要试图绕过规则（`// eslint-disable` 只在极其特殊的情况下使用，且需要注释说明原因）。

### type-check：TypeScript 类型检查

| 仓库 | 命令 | 工具 | 典型耗时 |
| --- | --- | --- | --- |
| Portal | `npx tsc --noEmit` | TypeScript 4.4 | 1-3 分钟 |
| SC Vue | `npx tsc --noEmit` | TypeScript 4.7 | 30-60 秒 |
| SC React | `npx tsc --noEmit`（按 project） | TypeScript 4.7 | 30-60 秒 |

type-check 检查的是代码**类型是否正确**：Props 类型是否匹配、函数参数和返回值、null/undefined 处理等。`--noEmit` 只检查不输出编译产物。

type-check 的常见失败模式：

- `Property 'xxx' does not exist on type 'Y'`：对象类型不匹配，检查 API 响应的类型定义。
- `Type 'string | undefined' is not assignable to type 'string'`：可选属性未处理 undefined 情况。
- `Cannot find module 'xxx'`：导入路径错误或依赖未安装。

Portal 的 `tsconfig.json` 中 `"noImplicitAny": false`——这意味着 Portal 不强制要求所有变量都有显式类型。这是历史原因，新代码应尽量提供类型。

### test：单元测试和集成测试

| 仓库 | 命令 | 工具 | 配置位置 |
| --- | --- | --- | --- |
| Portal | `yarn test` | Jest 24 | `configs/jest.config.js` |
| SC Vue | 按需配置 | Vitest / Jest | 仓库 scripts |
| SC React | `pnpm test`（按 workspace） | Vitest / Jest | 各 project 配置 |

Portal 的 Jest 配置要点：

```javascript
// configs/jest.config.js（简化）
module.exports = {
  rootDir: '../',
  modulePaths: ['<rootDir>/src/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',          // 路径别名
    '\\.(css|less|scss)$': 'identity-obj-proxy', // 样式 mock
  },
};
```

`moduleNameMapper` 中的 `'^@/(.*)$'` 让你在测试中也能使用 `@/` 路径别名。`identity-obj-proxy` 让 CSS/Less 导入在测试中返回空对象（不关心样式，只测试逻辑）。

### build：构建可部署产物

| 仓库 | 命令 | 构建工具 | 产物位置 | 消费者 |
| --- | --- | --- | --- | --- |
| Portal | `yarn build` | Webpack 5 | `dist/` 目录 | 独立部署 |
| SC Vue | `yarn build` | MMC / Rsbuild | MMC 产物目录 | Seller Center 宿主 |
| SC React | `pnpm build:host` / `pnpm build:remote` | MMC / Rsbuild | MMC 产物目录 | Seller Center 宿主 / Portal |

build 是四道检查中最耗时的一步（2-10 分钟不等），不应该在每次代码修改后都运行。触发 build 的场景：
- 修改了构建配置（`webpack.config.js`、`mmc.config.js`）。
- 新增了路由、依赖或入口文件（可能影响产物结构）。
- 准备提交 MR 前做最终验证。
- 日常开发中通常只需要 lint + type-check。

## 按 diff 范围选择检查

### 最小检查组合

| 改动范围 | 必须运行 | 建议运行 |
| --- | --- | --- |
| 只改了一个组件的样式或文案 | lint | — |
| 改了组件逻辑或新增组件 | lint + type-check | test |
| 改了 API 函数或 Store | lint + type-check + test | — |
| 改了路由配置 | lint + type-check | build（确认产物结构） |
| 改了构建配置或入口文件 | lint + type-check + build | test |

### 跨仓库改动的检查顺序

如果你的改动涉及多个仓库（如 SC React 远端组件 + Portal 消费），检查顺序：

1. 先在被修改的仓库中完成 lint + type-check + test。
2. 在消费仓库中确认改动的影响（不需要重新构建被修改仓库，只需要在消费仓库中运行自己的 lint + type-check）。
3. 如果涉及远端组件，在 Portal 和 MMF 两种宿主中各验证一次页面行为。

## Portal 构建与产物

### Webpack 构建的关键配置

Portal 使用 Webpack 5 + Module Federation。`webpack.config.js` 的核心配置项：

- `entry`：入口文件，通常是 `src/entry.ts`。
- `output`：产物输出目录 `dist/` 和 publicPath。
- `resolve.alias`：`@` → `src/` 路径别名。
- `ModuleFederationPlugin`：远端模块声明。
- `devServer.proxy`：本地开发时的 API 代理。

### 产物结构

构建后的 `dist/` 目录包含：
- `index.html`：SPA 入口。
- `static/js/`：按路由拆分的 JS chunk（通过 React.lazy 实现）。
- `static/css/`：CSS 文件。
- `remoteEntry.js`：Module Federation 的远端入口（供其他应用消费）。

### 构建失败的常见原因

| 错误 | 原因 | 解决 |
| --- | --- | --- |
| `Module not found` | 导入路径错误或依赖未安装 | 检查路径，重新 `yarn install` |
| `TypeScript errors` | 类型不匹配 | 先跑 `npx tsc --noEmit` 定位 |
| `Can't resolve 'xxx'` | webpack alias 或 resolve 配置问题 | 检查 `webpack.config.js` 的 resolve 配置 |
| `Memory limit exceeded` | 构建内存不足 | 增加 Node 内存限制 `NODE_OPTIONS=--max-old-space-size=4096` |

## MMC 构建与 MMF 产物

### MMC 构建的工作流程

两个 SC 仓库使用 MMC 作为构建工具。MMC 内部包装了 Webpack 或 Rsbuild，提供一系列与 Seller Center 模块相关的专有能力：

1. 读取 `mmc.config.js` 获取模块 ID、类型和技术栈。
2. 从 Seller Portal 平台拉取模块的远程配置（`yarn run getModule`）。
3. 从 Transify 平台拉取翻译文件（`yarn run i18n:pull`）。
4. 根据 `tech` 字段（`vue3` / `react18`）选择合适的构建器配置。
5. 生成包含模块元信息的构建产物。

### MMF 产物的消费者

MMF 构建产物有两个消费者：

- **Seller Center 宿主**：在用户访问对应路径时，宿主从 CDN 加载模块的 JS/CSS，注入路由、Store 等宿主能力后渲染。
- **Module Federation（仅远端组件）**：SC React 的远端组件产物同时被 Portal 通过 Module Federation 消费。

### 本地开发 vs 生产构建

本地开发时，MMC 启动 dev server，产物在内存中（不输出到磁盘）。生产构建时，产物输出到 `dist/` 或 MMC 配置的 output 目录。两者的关键区别：

- 本地 dev server 的产物未压缩、包含 source map，方便调试。
- 生产构建的产物经过压缩、tree-shaking、code splitting 优化。
- MMF Dev Tools 在本地开发时注入的是 dev server 的产物。

## 开发准出清单

每次准备提交 MR 时，整理以下核查项并附上证据：

### 代码质量核查

```markdown
- [ ] lint 通过：`yarn lint`（或对应命令）无新增错误
- [ ] type-check 通过：`npx tsc --noEmit` 无新增类型错误
- [ ] 无硬编码文案：所有用户可见文字使用 `$t()` 包裹
- [ ] 无 PII 泄露：敏感数据不出现在日志、URL 或 Store 持久化中
- [ ] 无 console.log 残留：生产代码中的调试日志已清理
```

### 功能验证核查

```markdown
- [ ] 正常路径：至少一种输入下功能正常
- [ ] 空态：无数据时页面不白屏、不报错
- [ ] 加载态：数据加载中有 loading 指示
- [ ] 错误态：API 失败时有错误提示（如果由 wrapper 统一处理则标注）
- [ ] 权限控制：无权限用户不能看到受限功能和数据
- [ ] i18n：至少中英文下文案正确（如果你有权限切换语言）
```

### 跨仓影响核查

```markdown
- [ ] 本仓影响：列出所有修改的文件和原因
- [ ] 跨仓影响：判断是否影响 Portal / SC Vue / SC React 的另一仓
- [ ] 远端组件影响：如果修改了远端组件，确认 Portal 和 MMF 两个消费者的兼容性
- [ ] API 契约变化：如果请求参数或响应字段有变化，与后端对齐
```

### 构建验证核查

```markdown
- [ ] 本地 dev server 正常启动：能访问对应页面
- [ ] build 通过（如适用）：`yarn build` 或对应命令无错误
- [ ] 产物结构正常：关键 chunk 文件存在
```

## 常见错误

### 忽略 lint 直接提交

lint 错误不阻断构建，所以很容易被忽略。但 lint 规则通常对应着团队约定的编码规范——绕过 lint 等于绕过 Code Review 的第一道防线。

### type-check 只跑了 IDE 的实时检查

IDE 的 TypeScript 检查可能只检查当前打开的文件。`npx tsc --noEmit` 检查整个项目，可能发现 IDE 中未显示的跨文件类型问题。

### build 只在本地跑，没验证产物正确性

构建成功后，浏览器的 `yarn start` / `yarn dev` 可能正常运行，但这不代表生产构建产物也正常。如果改了构建配置，至少验证一次生产构建的产物。

### 跳过测试因为"没写新增测试"

如果改动的代码已有测试，修改后应确保已有测试仍通过。如果没有已有测试，至少手动验证改动功能。

## Jest 单元测试实战

### Portal 的测试目录结构

Portal 的测试文件分布有两种模式：

- `__test__/` 目录：与源码同级或模块级，存放该模块的测试文件。
- `.test.ts` / `.spec.ts` 文件：与被测文件同级，命名约定明确。

查找已有测试的方法：

```bash
# 找 Portal 中与 inbound 相关的测试
find src/ -path "*inbound*" -name "*.test.*" -o -path "*inbound*" -path "*__test__*"
```

### 一个典型的 Portal 单元测试

以权限检查函数为例：

```javascript
// __test__/permission.test.js
import { hasPermission } from '@/business/utils/permission';
import { store } from '@/store';

jest.mock('@/store', () => ({
  store: {
    getState: jest.fn(),
  },
}));

describe('hasPermission', () => {
  it('returns true when user has the permission', () => {
    store.getState.mockReturnValue({
      context: { currentUser: { permission_code_list: ['VIEW_INBOUND'] } },
    });
    expect(hasPermission('VIEW_INBOUND')).toBe(true);
  });

  it('returns false when user does not have the permission', () => {
    store.getState.mockReturnValue({
      context: { currentUser: { permission_code_list: [] } },
    });
    expect(hasPermission('VIEW_INBOUND')).toBe(false);
  });

  it('handles array input', () => {
    store.getState.mockReturnValue({
      context: { currentUser: { permission_code_list: ['VIEW_INBOUND', 'EDIT_INBOUND'] } },
    });
    expect(hasPermission(['VIEW_INBOUND', 'ADMIN'])).toBe(true);
  });
});
```

关键测试模式：

- **mock 外部依赖**：`jest.mock('@/store')` 替换真实的 Redux Store。
- **控制测试数据**：`store.getState.mockReturnValue(...)` 设置 Store 的返回值。
- **多场景覆盖**：正常有权限、无权限、数组输入等。

### 测试 React 组件的模式

测试 React 组件通常需要渲染库（如 `@testing-library/react`）：

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import FilterBar from './FilterBar';

const renderWithStore = (component, initialState) => {
  const store = createStore(rootReducer, initialState);
  return render(<Provider store={store}>{component}</Provider>);
};

it('calls onSearch when search button is clicked', () => {
  const onSearch = jest.fn();
  renderWithStore(<FilterBar onSearch={onSearch} />);
  fireEvent.click(screen.getByText('搜索'));
  expect(onSearch).toHaveBeenCalled();
});
```

### 测试命令的效率技巧

```bash
# 只运行改动的测试文件
yarn test:onlyChanged

# 只运行特定文件的测试
yarn test -- path/to/component.test.js

# 监听模式——文件改动后自动运行
yarn test:watch

# 运行测试并生成覆盖率报告
yarn test --coverage
```


## 构建产物的消费边界详解

### Portal 产物的独立部署路径

Portal 是独立 SPA，它的产物部署到 CDN 后，用户直接通过 URL 访问。构建产物中的 `index.html` 通过 `<script>` 标签加载 JS bundle。Portal 不需要任何宿主环境——这是它和两个 SC 仓库最根本的产物差异。

Portal 构建后需要验证的关键点：
- `index.html` 中的 `<script>` 标签路径是否正确（publicPath 配置）。
- 懒加载的 chunk 文件是否正确分拆（Network 面板中按路由导航时是否加载了额外的 JS）。
- Module Federation 的 `remoteEntry.js` 是否正确生成（如果 Portal 提供了远端入口）。

### MMF 产物的宿主加载流程

SC 仓库的构建产物包含模块元信息（模块 ID、版本、路由映射等），由 MMC 打包为特定格式。宿主加载流程：

1. Seller Center 宿主从配置中心获取模块列表和版本信息。
2. 用户访问某路径时，宿主匹配到负责该路径的模块。
3. 宿主从 CDN 加载模块的 JS 和 CSS。
4. 执行模块的注册代码（Store、Router）。
5. 宿主触发路由守卫，初始化模块状态。
6. 渲染对应页面组件。

### 构建产物的缓存策略

前端资源的缓存策略对用户体验影响很大。FBS 构建产物通常使用以下缓存策略：

- **HTML 文件**：不缓存或短期缓存（因为 HTML 中引用的 JS/CSS 文件名带有 content hash，更新时文件名会变）。
- **JS/CSS 文件**：长期缓存（文件名中的 content hash 确保内容变化时文件名变化）。
- **MMC module metadata**：短期缓存或按版本号缓存。

如果在本地测试时发现"改了代码但浏览器显示旧版本"，首先尝试硬刷新（Cmd+Shift+R），如果仍无效，检查 dev server 是否正确触发了 HMR 或重新编译。


## CI/CD 中的质量闸门

### 典型的 CI 流程

FBS 前端仓库在 MR 合并前通常会经过以下 CI 检查：

1. **依赖安装**：`yarn install` / `pnpm install`
2. **lint**：ESLint 检查
3. **type-check**：TypeScript 编译检查
4. **test**：单元测试
5. **build**：构建验证（确认产物可生成）

任何一步失败都会阻止 MR 合并。这就是为什么"本地 lint 通过了但 CI 上失败了"需要重视——CI 环境和本地环境可能有差异（Node 版本、缓存状态等）。

### 本地环境与 CI 环境的差异排查

常见差异和解决方案：

| 差异 | 现象 | 解决 |
| --- | --- | --- |
| Node 版本不同 | CI 上某些包安装失败 | 用 nvm 切换到 CI 使用的 Node 版本重试 |
| 缓存差异 | 本地 OK 但 CI 报错 | `rm -rf node_modules && yarn install` 清理重装 |
| 操作系统差异 | 路径分隔符或换行符问题 | 使用 `path.join()` 而非字符串拼接；统一 LF 换行 |
| 环境变量 | 本地有 `.env.local` 但 CI 没有 | 确认 CI 配置中环境变量是否设置 |


## 为不同仓库选择合适的开发工具链

### 推荐的 IDE 和插件

| 需求 | 推荐工具 |
| --- | --- |
| Vue 3 开发 | VS Code + Volar（Vue 官方插件）+ TypeScript |
| React 开发 | VS Code + ESLint + Prettier |
| 跨仓库工作 | VS Code workspace 配置多个仓库路径 |
| 调试 Node 脚本 | VS Code 内置 debugger + `--inspect-brk` |

### 提高开发效率的命令别名

```bash
# 在 ~/.zshrc 中设置别名
alias fbsp="cd ~/Work/FBS/fbs-frontend && yarn start"
alias fbscv="cd ~/Work/FBS/fbs-sc-vue && yarn dev"
alias fbscr="cd ~/Work/FBS/fbs-sc-react && pnpm dev:host"

# 快速 lint
alias fblint="cd ~/Work/FBS/fbs-frontend && yarn lint"
```

这些别名不是必需品，但它们能减少你在三个仓库之间切换时的重复输入，让你更快进入开发状态。

## 练习

### 检查选择

以下改动分别需要运行哪些检查？（只需回答 lint / type-check / test / build 四个选项的组合）

a) 修改了一个 Vue 组件的 `v-if` 条件
b) 在 Portal 的 `webpack.config.js` 中新增了一个 alias
c) 修改了 SC React 远端组件的 Props 接口
d) 新增了一个 API 函数并在页面中调用了它

### 准出清单填写

选择一个你最近在 FBS 前端仓库中做过的改动（或假设一个），填写完整的开发准出清单。

### 构建排查

SC Vue 的 `yarn build` 失败，错误信息为 `Module not found: Error: Can't resolve '@/components/InboundRow'`。列出三个排查步骤。

### 参考答案

**7.1**：a) lint + type-check（v-if 的条件涉及类型判断）。b) lint + type-check + build（修改构建配置必须验证产物）。c) lint + type-check + test（Props 接口变化可能影响消费者）。d) lint + type-check + test。

**7.3**：1) 确认 `@/components/InboundRow` 文件是否存在——路径拼写是否正确、文件扩展名是否正确。2) 检查 `tsconfig.json` 或 webpack alias 中 `@` 的映射是否正确指向 `src/`。3) 确认 `InboundRow` 的导出方式（`export default` vs `export const`）与导入方式匹配。

## 自检

1. FBS 三个前端仓库各自使用了哪些构建工具？它们的产物格式和消费方式有什么不同？

2. lint、type-check、test、build 四道检查的职责分别是什么？什么情况下只需要跑部分检查？

3. Portal 的 Webpack 产物和 MMF 的 MMC 产物各自的消费边界是什么？为什么不能混淆？

4. 开发准出清单应该包含哪些项目？为什么"lint 通过"和"build 成功"不能互相替代？

5. CI 流水线中的质量闸门通常包括哪些检查？本地开发和 CI 环境的结果不一致时，优先排查什么？

## 参考文献

- [Webpack Concepts](https://webpack.js.org/concepts/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript 4.7 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html)
- [Rspack Introduction](https://rspack.rs/guide/start/introduction)
- [Rsbuild Guide](https://rsbuild.rs/guide/start/)