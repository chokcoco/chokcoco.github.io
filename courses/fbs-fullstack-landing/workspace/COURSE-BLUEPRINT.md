# FBS 前后端转全栈 Landing 课程蓝图

## 蓝图状态

- 版本：0.2，课前准备已确认
- 模块：6 个模块，已确认
- 章节：40 章
- 主案例：入库请求/ASN，已确认
- 基础讲师风格：耐心教练型
- 生成顺序：先 2 份标杆章，再按连续 3-4 章批量生成
- 官方来源：见 `OFFICIAL-SOURCES.md`
- 模板映射：见 `CHAPTER-TEMPLATE-MAP.md`，为逐章生成强制输入

## 知识地图与先修关系

```text
跨端共同前置：Git + 命令行 + HTTP 基本概念
├─ 后端转前端入口
│  └─ M1 JavaScript/TypeScript/Web 标准
│     └─ M2 三类 FBS 前端工程开发
│        └─ M3 微前端、质量、诊断与开发交接
├─ 前端转后端入口
│  └─ M4 Go/标准库/并发/测试
│     └─ M5 三类 FBS 后端工程开发
│        └─ M6 任务、消息、缓存、可靠性与可观测性
└─ 两条路线汇合
   └─ 入库请求/ASN 纵向切片：需求 → 影响分析 → FE → BE → 数据/异步 → 测试 → 构建与开发交接
```

语言模块不要求另一端研发达到专家水平。进入工程模块的标准是：能读懂核心数据结构、函数调用、异步/并发行为、错误处理和模块组织，并能对短代码做受控修改。

## 核心 20%-30%

以下内容获得更高解释深度、更多代码证据和重复迁移练习：

1. 前端的路由、状态、请求、权限/i18n 与宿主边界。
2. 后端的 HTTP 链路、Wire、应用/领域/仓储分层、事务与错误处理。
3. 从同步请求进入 Saturn/Kafka/缓存的边界，以及幂等、重试和可观测性。
4. 三个前端形态与三个后端服务的职责和版本差异。
5. 一条真实 FBS 入库纵向链路及其开发、联调、测试、构建和开发交接证据。

## 统一篇幅与发版边界

- 以下 40 个正式知识章节均以 9000 Unicode 有效字符为最低门槛，不设最高字符限制；旧版区间预算全部失效。
- 章节写到能够讲透学习成果、真实仓库链路、反例与验证方法为止。达到 9000 不自动通过，重复、代码堆砌和表格复述不得用于凑数。
- 前后端发版不属于本课程授课范围。涉及构建产物或开发交接时，只需一句话提示后续遵循团队通用发版流程，不讲平台操作、灰度、观察或回退 SOP。

非核心内容采用“认识、会定位、知道何时查”的深度。ES、Soup 等只有截图而缺少当前仓库证据的基础设施暂不进入必修章节。

## 模块一：前端语言及标准库基础（6 章）

### FE-L01 JavaScript 数据、类型与相等性：先读懂仓库判断分支

- 学习成果：能解释原始值、对象引用、空值、隐式转换、`===`、可选链与空值合并；能判断 FBS 页面条件分支的结果。
- 自有路径：从权限/状态判断片段进入 → 缩减成最小表达式 → 预测结果 → 修改边界输入 → 回到仓库代码解释为什么这样写。
- 必须覆盖：`let/const`、常见类型、对象/数组、truthy/falsy、`===`、`?.`、`??`、不可变更新的最小概念。
- 代码证据：三前端仓的权限、路由守卫和状态判断；如 `fbs-frontend/src/business/utils/permission.ts`、`fbs-sc-vue/src/router/index.ts`。
- 主类型/任务/风格：语言基础 / 对比辨析 + 渐进练习 / 耐心教练型。
- 完成证据：解释 4 个真实判断片段并修复一个空值边界；篇幅遵循统一最低门槛，以讲透为准。

### FE-L02 函数、作用域、闭包与模块：跟上组件外的调用链

- 学习成果：能阅读函数声明、箭头函数、参数默认值、返回值、闭包、导入导出和回调。
- 自有路径：从一个 API 工厂函数或 hook 调用出发 → 展开闭包捕获 → 对照模块导出 → 改一个参数并观察调用方变化。
- 必须覆盖：函数是一等值、词法作用域、闭包、解构参数、rest/spread、ES Module、默认/具名导出。
- 代码证据：Portal `createApi`、SC Vue API wrapper、React hooks/utils。
- 主类型/任务/风格：语言基础 / 概念建模 + 代码阅读 / 耐心教练型。
- 完成证据：画出一个 wrapper 捕获配置的作用域图，并完成短函数改写；篇幅遵循统一最低门槛，以讲透为准。

### FE-L03 Promise、async/await 与事件循环：读懂请求和页面副作用

- 学习成果：能说明 Promise 状态、`await` 暂停点、异常传播和并发组合；能避免把异步调用当同步值使用。
- 自有路径：观察一个真实 API 调用的加载/成功/失败 → 最小 Promise 实验 → `try/catch/finally` → 串行与 `Promise.all` 对比 → 回到页面副作用。
- 必须覆盖：Promise、`async/await`、微任务的教学简化、错误传播、并发组合、取消只介绍项目现状。
- 代码证据：三仓页面请求、初始化 action/thunk、远端组件加载。
- 主类型/任务/风格：语言基础 + 机制辅助 / 观察实验 / 耐心教练型 + 严谨技术型。
- 完成证据：预测执行顺序，修复一个漏 `await`/漏错误处理示例；篇幅遵循统一最低门槛，以讲透为准。

### FE-L04 JavaScript 常用对象与 Web 数据处理

- 学习成果：能使用 Array、Object、Map/Set、String、Number、Date、URL/URLSearchParams 和 JSON 处理列表、查询参数与接口数据。
- 自有路径：把入库列表筛选拆成数据转换步骤 → 每次引入一个标准对象 → 组合成参数与展示数据 → 讨论可变性、时区和精度边界。
- 必须覆盖：高频方法、返回值与是否修改原对象；日期/时间只讲仓库用得到的 UTC/时区边界。
- 代码证据：列表筛选、时间格式化、查询参数、API DTO 转换代码。
- 主类型/任务/风格：标准库操作 / 渐进练习 / 耐心教练型。
- 完成证据：独立写出一个不修改输入的列表转换函数及边界测试；篇幅遵循统一最低门槛，以讲透为准。

### FE-L05 TypeScript：从接口数据到组件 Props 的类型链

- 学习成果：能阅读并编写接口、type、联合类型、泛型、类型收窄、可选属性和工具类型；知道类型何时只在编译期存在。
- 自有路径：从真实 API 请求/响应类型进入 → 观察错误字段如何被发现 → 建立联合类型与收窄 → 用泛型解释请求 wrapper → 比较 TS 4.7 与新语法边界。
- 必须覆盖：结构类型、Props/DTO、泛型、`keyof`/索引访问、`Partial`/`Pick`、类型断言的风险。
- 代码证据：React 18 API types、Portal route/types、Vue store types、`tsconfig`。
- 主类型/任务/风格：语言基础 / 对比辨析 + 渐进练习 / 耐心教练型。
- 完成证据：为一个未类型化 API 加最小类型并通过 type-check；篇幅遵循统一最低门槛，以讲透为准。

### FE-L06 浏览器与框架语法桥：DOM、事件、JSX、Vue SFC

- 学习成果：能区分 JavaScript、浏览器 Web API、React JSX 和 Vue SFC；能读懂表单、事件、条件渲染、列表渲染和组件 Props/Emits。
- 自有路径：同一个入库筛选控件分别观察原生事件、React JSX、Vue template → 找到相同的数据流 → 标记框架差异 → 不在本章展开状态框架。
- 必须覆盖：DOM/事件最小模型、表单受控值、JSX 表达式、Vue template 指令、SFC 的 template/script/style 边界。
- 代码证据：React 16/18 表单与 Vue 3 页面组件。
- 主类型/任务/风格：语言基础 / 对比辨析 / 耐心教练型。
- 完成证据：把同一交互在 React/Vue 片段中逐项对应，并修改一个事件处理；篇幅遵循统一最低门槛，以讲透为准。

## 模块二：Web 前端开发（7 章）

### FE-W01 启动三类 FBS 前端工程并建立仓库地图

- 学习成果：能选择正确 Node/包管理器/命令，解释 Portal 与 MMF module dev server 的差异，并获得可核验启动结果。
- 自有路径：先运行版本与目录检查 → 按仓库分流 → 启动最小服务 → 进入真实 Portal/MMF 页面 → 保存版本、端口和失败证据。
- 必须覆盖：Portal Node 16/Yarn/Webpack；SC Vue Node 20/Yarn/MMC/pnpm portal；SC React Node 20/pnpm monorepo/MMC。
- 代码证据：三仓 fullstack/README、package scripts、MMC/Webpack 配置。
- 主类型/任务/风格：框架/工具，借用环境核验模块 / 操作引导 / 耐心教练型 + 实践带练型。
- 完成证据：三选一完整启动，另外两仓能解释命令与运行边界；篇幅遵循统一最低门槛，以讲透为准。

### FE-W02 组件、样式、表单与表格：按现有组件库做页面

- 学习成果：能在 React 16、Vue 3 或 React 18 中拆组件、传递数据、处理事件，并优先复用仓库组件库。
- 自有路径：从一个真实列表/表单页面识别组件树 → 找到 EDS/SSC UI 用法 → 增加一个字段 → 处理校验与样式 → 检查可访问性和空态。
- 必须覆盖：Props/Emits、局部状态、组合而非复制、Less/CSS Modules/Vue scoped style、EDS/SSC UI 边界。
- 代码证据：入库列表、Seller Management 表单、远端 InboundComponent。
- 主类型/任务/风格：框架应用 / 在已有项目增加能力 / 耐心教练型 + 实践带练型。
- 完成证据：交付一个符合当前仓库模式的小组件及行为检查；篇幅遵循统一最低门槛，以讲透为准。

### FE-W03 路由、菜单与页面入口：让页面真正可访问

- 学习成果：能区分 React Router 5、MMF Vue 路由和 MMF React 路由注册，知道路由、菜单、宿主配置与权限的关系。
- 自有路径：从浏览器 URL 反查路由 → 找页面入口 → 识别懒加载/宿主挂载 → 增加受控子路由 → 验证直达、刷新和无权限路径。
- 必须覆盖：Portal `src/routes`、Vue `src/router/index.ts`、React 18 `registerRouterModule` 与 remote config 的路由消费关系。
- 代码证据：三仓真实路由和 repo-guide route/menu rules。
- 主类型/任务/风格：框架应用 + 架构辅助 / 操作引导 / 耐心教练型 + 实践带练型。
- 完成证据：完成路由影响清单和一个不破坏宿主的页面入口；篇幅遵循统一最低门槛，以讲透为准。

### FE-W04 状态管理：Redux/Recoil、Vuex 与宿主状态

- 学习成果：能判断状态应放组件、本仓 Store 还是宿主 Store；能读懂 action/thunk/getter/selector 和不可变更新。
- 自有路径：追踪“当前 seller/shop”从初始化到页面 → 对照三仓状态工具 → 修改一个派生状态 → 检查跨页面与宿主边界。
- 必须覆盖：Redux/Thunk、Recoil 认识、Vuex namespaced module、Redux Toolkit、React 从 Vuex 宿主读取状态的特殊边界。
- 代码证据：Portal `src/store`/`src/recoil`、Vue `FBS_STORE`、React 18 store/selectors。
- 主类型/任务/风格：框架应用 / 架构链路 + 修改练习 / 耐心教练型。
- 完成证据：画出一个状态的来源、写入、派生与消费链；篇幅遵循统一最低门槛，以讲透为准。

### FE-W05 API、代理、错误与前后端契约

- 学习成果：能从页面调用追到 request wrapper、代理和后端路径，正确处理 DTO、retcode、Blob、超时与错误展示。
- 自有路径：从入库页面点击进入 Network → 反查 API 函数与 baseURL → 对照后端路由 → 增加参数/字段 → 验证成功与失败响应。
- 必须覆盖：Axios/request wrapper、GET/POST、query/body、类型、Portal proxy、SC 普通/PII/Blob 请求、统一错误处理。
- 代码证据：三仓 request 和 inbound API；主服务 HTTP route/DTO。
- 主类型/任务/风格：框架应用 + 架构链路 / 观察实验 / 耐心教练型 + 实践带练型。
- 完成证据：提交一份接口契约与可复现联调记录；篇幅遵循统一最低门槛，以讲透为准。

### FE-W06 权限、i18n、时间、文件与 PII：页面功能的准入项

- 学习成果：能在写页面时同时检查权限、翻译、时区、上传下载和敏感信息边界。
- 自有路径：给定一个“新增字段+导出”需求 → 逐项加载仓库规则 → 找到现有实现 → 完成安全展示和文件处理 → 用缺权限/不同时区/错误文件做反例。
- 必须覆盖：路由/操作权限、Transify/i18next、秒毫秒与时区、Blob/模板、PII 请求与禁止直出。
- 代码证据：三仓 coding skills、permission/i18n/time/file/PII 实现、敏感数据服务接口。
- 主类型/任务/风格：框架应用 + 机制辅助 / 案例分析 / 耐心教练型 + 严谨技术型。
- 完成证据：完成跨关注点 checklist，并修复一个故意遗漏的实现；篇幅遵循统一最低门槛，以讲透为准。

### FE-W07 前端纵向切片：为入库列表增加一个受控能力

- 学习成果：能从需求拆出页面、路由、状态、API、权限、i18n 与验证改动，保持当前仓库可运行。
- 自有路径：确认验收样例 → 找现有入库路径 → 完成最小 UI/API 切片 → 增加错误/空态 → lint/type-check/test/build → 记录跨仓待办。
- 起始资产：从三仓中选择与学员方向最贴近的一仓；另外两仓作为迁移题。
- 代码证据：SC Vue inbound、SC React InboundComponent、Portal InboundManagement 与主服务 inbound API。
- 主类型/任务/风格：综合实践 / 纵向切片 / 耐心教练型 + 实践带练型。
- 完成证据：可运行页面改动、验证记录和影响清单；篇幅遵循统一最低门槛，以讲透为准。

## 模块三：Web 前端进阶（6 章）

### FE-A01 三种应用生命周期与宿主边界

- 学习成果：能解释 Portal SPA、Vue MMF module、React 18 MMF module 从加载到页面渲染的关键对象和交接信息。
- 自有路径：选择同一 URL 的加载链 → 逐站定位 entry、宿主、route、provider/store、page → 标出失败点与观测点 → 对比三形态。
- 代码证据：Portal entry/App、Vue index/MMF、React 18 index/DepsProvider。
- 主类型/任务/风格：架构链路 / 案例分析 / 耐心教练型 + 严谨技术型。
- 完成证据：解释三张精简时序图并定位给定启动错误所在层；篇幅遵循统一最低门槛，以讲透为准。

### FE-A02 微前端与远端组件：Module Federation、qiankun、MMF

- 学习成果：能区分三种接入机制在 FBS 中的用途，知道何时修改 host、module、remote config 或 remote component。
- 自有路径：从已有远端 InboundComponent 出发 → 追踪产物与消费 → 对照 Portal 的 Module Federation/qiankun → 改一个公共组件契约 → 评估消费者影响。
- 代码证据：Portal remotes/qiankun、SC React remote component、MMC 配置与 Confluence 工程梳理。
- 主类型/任务/风格：机制/架构 / 对比分析 / 耐心教练型 + 严谨技术型。
- 完成证据：完成接入方式选择题和远端组件兼容清单；篇幅遵循统一最低门槛，以讲透为准。

### FE-A03 Vue/React 共存、共享依赖与版本迁移

- 学习成果：能处理 React 16/18、Vue 3、宿主 Vuex、axios external 和全局依赖注入，不把跨框架复用当普通 import。
- 自有路径：观察一个 React 页面读取 Vuex/宿主请求 → 建立依赖契约 → 制造缺失注入故障 → 验证 fallback → 讨论迁移与兼容。
- 代码证据：`initGlobalDepsForMMF`、`DepsProvider`、basic MMF request、remote component adapter、Vue remote deps。
- 主类型/任务/风格：机制诊断 / 观察实验 + 故障诊断 / 耐心教练型 + 案例分析型。
- 完成证据：定位一个宿主依赖未注入问题，并提出兼容改法；篇幅遵循统一最低门槛，以讲透为准。

### FE-A04 测试、静态检查、构建与产物边界

- 学习成果：能按仓库选择 lint、type-check、Jest 与 build，理解产物目录和 Portal/MMF 的消费边界。
- 自有路径：从改动范围选择最小检查 → 运行并读失败 → 构建产物 → 对照 Portal、module group 与 remote component 的产物/消费者关系 → 形成可复核的开发准出记录。
- 代码证据：三仓 scripts、CI、Webpack/MMC 配置、测试文件和构建产物配置。
- 主类型/任务/风格：框架/工具 + 环境辅助 / 操作引导 / 耐心教练型 + 实践带练型。
- 完成证据：为一个 diff 选择并执行可信检查，输出构建与开发准出清单；篇幅遵循统一最低门槛，以讲透为准。

### FE-A05 前端观测与系统化排错

- 学习成果：能用浏览器、Network、Console、source map、API SLA/埋点与构建日志定位白屏、路由、权限、请求和宿主问题。
- 自有路径：保留真实错误 → 分层建立假设 → 每次只验证一层 → 最小修复 → 重跑页面与构建回归。
- 代码证据：Vue report/api、Portal reporter/webpack、fullstack troubleshooting、React repo TROUBLESHOOTING。
- 主类型/任务/风格：故障诊断 / 案例分析 / 耐心教练型 + 案例分析型。
- 完成证据：完成两类故障诊断记录，其中一个来自 MMF 宿主边界；篇幅遵循统一最低门槛，以讲透为准。

### FE-A06 前端改动影响分析与开发交接

- 学习成果：能从需求和 diff 判断影响的 app、portal、route、shared/remote component、权限、翻译、测试与构建配置。
- 自有路径：给定跨仓变更 → 建仓库地图 → 定位候选目标 → 加载相关规则 → 分析实际 diff → 选择准出检查并整理 reviewer 可复核的交接材料。
- 代码证据：三仓 Repo Guide、`repo-profile`、workflow skills 与 CI/构建配置。
- 主类型/任务/风格：综合实践 / 接手与诊断 / 耐心教练型 + 简洁专业型。
- 完成证据：提交可供 reviewer 使用的影响摘要、测试结果和开发交接清单；篇幅遵循统一最低门槛，以讲透为准。

## 模块四：后端语言及标准库基础（7 章）

### BE-L01 Go 工具链、模块与版本边界

- 学习成果：能读懂 `go.mod`、package/import、命令入口和 build tag，知道 Go 1.15 与 1.20 对课程示例的限制。
- 自有路径：比较三仓 `go.mod` → 解释 module/package → 运行最小 `go test`/`go build` → 识别内网模块与生成代码 → 建立版本兼容表。
- 代码证据：三后端 `go.mod`、Makefile、cmd 目录。
- 主类型/任务/风格：语言基础，借用环境核验 / 操作引导 / 耐心教练型 + 实践带练型。
- 完成证据：能判断一段代码能否进入 tax 仓并说明原因；篇幅遵循统一最低门槛，以讲透为准。

### BE-L02 值、指针、struct、tag 与数据边界

- 学习成果：能阅读零值、指针、struct、组合和 `json/form/binding/xlsx` tag，理解请求 DTO 与数据库对象为何不同。
- 自有路径：从 HTTP 请求 struct 进入 → 观察 bind/序列化 → 改字段与可选性 → 比较值/指针零值 → 回到仓库 DTO/DO。
- 代码证据：主服务 HTTP define、敏感服务 client params、tax DTO/model。
- 主类型/任务/风格：语言基础 / 概念建模 + 代码阅读 / 耐心教练型。
- 完成证据：修复一个字段 tag/零值语义问题并解释影响；篇幅遵循统一最低门槛，以讲透为准。

### BE-L03 方法、接口、嵌入与依赖倒置

- 学习成果：能阅读方法集、接口满足、嵌入、构造函数和 `wire.Bind`，知道接口放在哪一层取决于依赖方向。
- 自有路径：从一个 handler/service interface 进入 → 找实现 → 对照指针/值接收者 → 替换 fake → 再看 Wire 如何绑定。
- 代码证据：三后端 controller/service/repository interface 与 Wire sets。
- 主类型/任务/风格：语言基础 + 框架辅助 / 对比辨析 / 耐心教练型。
- 完成证据：沿接口找到运行时实现，并写一个最小 fake；篇幅遵循统一最低门槛，以讲透为准。

### BE-L04 slice、map、排序与数据转换

- 学习成果：能安全处理 slice/map、range、append、拷贝、去重、排序和 nil/empty 差异；能识别共享底层数组风险。
- 自有路径：从 API 列表转换进入 → 最小 slice 实验 → map 索引/去重 → 排序与稳定性 → 修改输入和输出边界测试。
- 代码证据：主服务列表/DTO 转换、tax invoice/item 处理、libs slice helpers。
- 主类型/任务/风格：语言基础 / 标准库操作 + 渐进练习 / 耐心教练型。
- 完成证据：编写不误改输入的转换函数及 table-driven test；篇幅遵循统一最低门槛，以讲透为准。

### BE-L05 error、defer、panic/recover 与资源生命周期

- 学习成果：能区分业务错误、包装错误、panic 与恢复；能正确关闭资源、回滚事务并保留错误上下文。
- 自有路径：观察一个仓库错误返回链 → `errors.Is/As` 与包装 → defer 顺序实验 → 事务/文件资源 → middleware recovery 边界。
- 代码证据：`errcode/*`、libs error、tax recovery middleware、数据库事务代码。
- 主类型/任务/风格：语言基础 + 机制辅助 / 观察实验 / 耐心教练型 + 严谨技术型。
- 完成证据：修复一个吞错或 defer 次序问题；篇幅遵循统一最低门槛，以讲透为准。

### BE-L06 context、时间、JSON、HTTP、I/O 与文件

- 学习成果：能沿 `context.Context` 传递取消/超时/请求信息，使用标准库处理 JSON、HTTP、时间、文件和流。
- 自有路径：从 handler context 进入 → 传播到 service/repo/client → 制造取消/超时 → 处理 JSON 与文件下载 → 检查泄漏与时区。
- 代码证据：三后端 handler、HTTP client、file/excel helpers、时间工具。
- 主类型/任务/风格：标准库操作 + 机制 / 观察实验 / 耐心教练型 + 严谨技术型。
- 完成证据：为一个调用链补齐 context 与超时，并用测试验证；篇幅遵循统一最低门槛，以讲透为准。

### BE-L07 goroutine、channel、sync 与并发边界

- 学习成果：能阅读 goroutine/channel/wait group/mutex/atomic/worker pool，识别数据竞争、泄漏和无界并发。
- 自有路径：从异步批处理片段观察 → 最小竞态实验 → 加同步/取消 → 有界 worker pool → 连接到 Saturn/Kafka 但不提前讲框架。
- 代码证据：主服务 workerpool/async、tax goroutine/pool、并发测试。
- 主类型/任务/风格：语言机制 / 观察实验 + 故障诊断 / 耐心教练型 + 严谨技术型。
- 完成证据：解释一个并发执行图，并通过 race/test 证据修复问题；篇幅遵循统一最低门槛，以讲透为准。

## 模块五：Web 后端开发（7 章）

### BE-W01 启动三类 FBS 后端进程并建立仓库地图

- 学习成果：能识别主服务、敏感数据服务和 Tax 服务的职责与进程入口，选择正确 Go 版本、配置和启动/测试命令，并说明 API、core、task 进程的差异。
- 自有路径：先比较三仓 `go.mod` 与 `cmd/` → 选择一仓运行最小 build/test → 追踪 main 到 Chassis 启动 → 标出配置、生成代码和内网依赖边界 → 保存可复现证据。
- 必须覆盖：Go 1.20 与 1.15 兼容线、`cmd/api_server`/`cmd/fbs_task`、`cmd/task`、`cmd/tax_api`/`tax_core`/`tax_task`、Makefile、Chassis 配置；不要求学员启动所有依赖。
- 代码证据：三后端 `go.mod`、`cmd/*`、Makefile、`conf/chassis*.yaml`；主服务与 Tax 的仓库指引。
- 主类型/任务/风格：框架/工具，借用环境核验 / 操作引导 / 耐心教练型 + 实践带练型。
- 完成证据：完整启动或测试一条最小路径，并为另外两仓交付准确的进程/版本地图；篇幅遵循统一最低门槛，以讲透为准。

### BE-W02 Chassis HTTP 接口：从路由到请求与响应

- 学习成果：能从 URL 追到 schema、路由、中间件、define/DTO 和 handler，正确处理 query/body、校验、context、响应包装与错误码。
- 自有路径：从入库页面 Network 请求进入 → 在主服务反查 `url/define/handle` → 跟过中间件 → 增加一个向后兼容字段 → 用 handler 测试或请求样例验证成功与失败。
- 必须覆盖：Chassis schema/route 注册、Portal/SC/OpenAPI 边界、参数绑定、统一响应、错误码与翻译；gRPC 只建立与 HTTP 的协议边界。
- 代码证据：主服务 `apps/inbound/*/access/http/*` 与 `middleware/*`；敏感服务 `apps/client/access/http/sc/*`；Tax `internal/controller/*`。
- 主类型/任务/风格：框架应用 / 真实调用链 + 渐进修改 / 耐心教练型 + 实践带练型。
- 完成证据：画出一条真实请求链，并完成一个兼容 DTO/handler 改动及正反例验证；篇幅遵循统一最低门槛，以讲透为准。

### BE-W03 Wire 与分层：把 handler 接到应用、领域和基础设施

- 学习成果：能沿 handler 找到 application/service、domain、repository/client 实现，解释 provider set、`wire.Bind`、生成文件和依赖方向。
- 自有路径：选一个 ASN 查询/修改接口 → 手工沿构造函数追依赖 → 对照 `wire_set.go` → 增加一个最小依赖 → 重新生成或检查 `wire_gen.go` → 用 fake 隔离外部依赖。
- 必须覆盖：编译期依赖注入、接口与实现、旧 `app`/新 `apps` 并存、生成代码不手改、循环依赖诊断；不把某一种目录形式写成全仓唯一标准。
- 代码证据：主服务 inbound/ASN 的 `wire*.go` 和分层目录；敏感服务 client/rts 的 access/application/domain/infra；Tax service/controller 的 Wire 入口。
- 主类型/任务/风格：框架应用 + 架构链路 / 概念建模 + 修改练习 / 耐心教练型 + 严谨技术型。
- 完成证据：提交依赖图、provider 变更和可生成/可测试证据；篇幅遵循统一最低门槛，以讲透为准。

### BE-W04 MySQL、GORM/Scorm、仓储与事务

- 学习成果：能区分 DTO、领域实体与 DO，阅读查询条件、分页和写入，知道事务应覆盖哪些不变量，并避免把数据库细节泄漏到 handler。
- 自有路径：从 ASN 数据读取进入 → 追到 repository/DAO 和表模型 → 增加一个查询条件 → 构造多写入失败 → 检查回滚、连接和 context → 补 repository 测试。
- 必须覆盖：MySQL、GORM/Scorm 现状、CRUD、分页、索引意识、nil/zero、事务边界、读写一致性；不扩展仓库未使用的 ORM 或数据库。
- 代码证据：主服务 inbound/ASN infra 与 `sbs_agent/db`/`mysql`；敏感服务 `apps/*/infra/db`；Tax `internal/common/dbhelper` 与事务调用。
- 主类型/任务/风格：框架应用 + 机制 / 观察实验 + 渐进修改 / 耐心教练型 + 严谨技术型。
- 完成证据：完成一个 repository 条件变更、table-driven test 和事务失败说明；篇幅遵循统一最低门槛，以讲透为准。

### BE-W05 服务调用、HTTP/gRPC 契约与超时

- 学习成果：能识别本地调用、HTTP client 与 gRPC/protobuf client，沿 context 传播超时与请求信息，并把外部错误转换为本服务语义。
- 自有路径：从主服务调用敏感数据或外部服务的 client 进入 → 找协议/参数/拦截器 → 画超时与错误传播 → 增加一个字段或 fake → 验证超时、空响应和远端错误。
- 必须覆盖：HTTP/gRPC 选择以现状为准、protobuf 生成边界、client adapter、超时/重试归属、响应与错误转换；只讲 FBS 直接调用边界，不展开外部系统内部实现。
- 代码证据：主服务 `thirdpart`/agent/client 与 protobuf；敏感服务 `agent/*`、`thirdpart/*`、HTTP interceptors；Tax `third_party/*` 与 gRPC middleware。
- 主类型/任务/风格：框架应用 + 架构链路 / 案例分析 / 耐心教练型 + 严谨技术型。
- 完成证据：交付一份跨服务契约、超时预算和 fake 驱动的失败路径测试；篇幅遵循统一最低门槛，以讲透为准。

### BE-W06 鉴权、错误码、PII 与接口安全边界

- 学习成果：能判断请求身份、权限、CSRF/限流和 PII 数据应在哪一层处理，避免日志、响应和普通服务链路泄露敏感信息。
- 自有路径：对一个“展示联系人字段”需求做数据分类 → 追踪 Portal/SC 身份与中间件 → 定位敏感服务接口 → 增加安全返回 → 用无权限、非法参数和日志检查做反例。
- 必须覆盖：会话/鉴权中间件、错误码与翻译、参数校验、PII 服务边界、日志脱敏、最小返回；不在课程资产中保留真实 PII。
- 代码证据：主服务 `middleware/*`、`errcode/*` 与敏感服务 client；敏感服务 `libs/http_interceptors/*`、`middleware/*`、SC 接口；Tax JWT/限流/响应中间件。
- 主类型/任务/风格：框架应用 + 安全机制 / 案例分析 / 耐心教练型 + 严谨技术型。
- 完成证据：完成数据流威胁检查、受控接口变更和三类失败验证；篇幅遵循统一最低门槛，以讲透为准。

### BE-W07 后端纵向切片：为入库请求增加一个受控能力

- 学习成果：能从接口契约拆出 route/DTO、application/domain、repository/client、Wire、错误码和测试改动，并保持原有消费者兼容。
- 自有路径：确认验收样例 → 追踪现有 ASN 路径 → 完成最小同步链路 → 补事务/错误/权限 → 单测与接口验证 → 记录前端契约和后续异步影响。
- 起始资产：主服务 inbound/ASN 为主；敏感数据服务和 Tax 作为“何时跨服务、何时不跨”的边界题，不强行塞入主案例。
- 代码证据：主服务 `apps/inbound/asn`、相邻 inbound 模块和测试；前端三仓入库 API/页面；业务语义仅由相关材料校准。
- 主类型/任务/风格：综合实践 / 纵向切片 / 耐心教练型 + 实践带练型。
- 完成证据：可测试的后端改动、接口响应、兼容性说明和跨仓联调清单；篇幅遵循统一最低门槛，以讲透为准。

## 模块六：Web 后端进阶（7 章）

### BE-A01 Apollo 与 Chassis 配置：环境差异、热更新和开关

- 学习成果：能区分静态配置、Apollo 动态配置和环境覆盖，找到配置读取/默认值/校验位置，并设计有安全默认值、可关闭的功能开关。
- 自有路径：从一个真实配置字段反查 Apollo prefix 与配置 struct → 比较环境文件 → 模拟缺失/非法值 → 增加默认与 normalize → 验证开关关闭时的兼容行为。
- 必须覆盖：Chassis 配置、Apollo、prefix/namespace 现状、默认值、热更新边界、敏感配置禁止入库；Service Center 只讲代码中能确认的服务发现边界。
- 代码证据：三仓 `conf/chassis*.yaml` 与 `confighelper`/`internal/config`；主服务 Apollo 配置测试、敏感服务 `confighelper`。
- 主类型/任务/风格：机制 + 框架配置 / 观察实验 / 耐心教练型 + 严谨技术型。
- 完成证据：完成一个配置项的读取、非法值测试和关闭态兼容说明；篇幅遵循统一最低门槛，以讲透为准。

### BE-A02 Redis/Codis 与缓存一致性

- 学习成果：能判断缓存是否必要，读懂 key、TTL、序列化和失效策略，识别穿透、击穿、脏读与分布式锁的适用边界。
- 自有路径：从真实缓存调用追到 key 与数据源 → 制造 miss/stale → 选择 cache-aside 更新顺序 → 补 TTL/失效与降级 → 用并发测试验证关键假设。
- 必须覆盖：Redis 与仓库中的 Codis/Cache Cloud 运行语境、cache-aside、TTL、key 设计、失效、锁与故障降级；不扩展为通用缓存算法课。
- 代码证据：主服务 `sbs_agent/redis_pool` 和业务缓存；敏感服务 `libs/redis`；Tax `infrastructrure/cache`、`internal/common/cache/lock`。
- 主类型/任务/风格：机制/诊断 / 观察实验 + 故障诊断 / 耐心教练型 + 严谨技术型。
- 完成证据：完成缓存时序图、失败注入结果和一致性/降级选择说明；篇幅遵循统一最低门槛，以讲透为准。

### BE-A03 Saturn 定时任务与异步任务

- 学习成果：能区分定时任务、RPC job 和消息 job，找到任务注册、payload、执行入口与返回语义，并设计幂等、重试和可重放处理。
- 自有路径：从 `fbs_task`/`tax_task` 入口进入 → 追踪 Saturn 注册和 handler → 构造重复消息 → 增加幂等键/状态检查 → 验证失败返回与重试。
- 必须覆盖：Saturn schema/job 注册、crontask/asynctask、payload 版本、超时、重试、幂等、分片只按现有实现介绍。
- 代码证据：主服务 `cmd/fbs_task`、`access/{crontask,asynctask}`、`sbs_agent/saturn`；敏感服务 `cmd/task`/`libs/saturn`；Tax `cmd/tax_task`、`apps/tax_task`。
- 主类型/任务/风格：机制 + 框架应用 / 真实调用链 + 故障实验 / 耐心教练型 + 严谨技术型。
- 完成证据：实现或修复一个幂等任务，并提交首次、重复、失败重试三组证据；篇幅遵循统一最低门槛，以讲透为准。

### BE-A04 Kafka 消息链路与事件边界

- 学习成果：能找到 producer/consumer、topic 与消息模型，理解同步提交与异步发布之间的一致性缺口，并处理重复、乱序、失败与兼容演进。
- 自有路径：从一个真实 consumer 或 producer 进入 → 画消息生命周期 → 改一个向后兼容字段 → 注入重复/失败 → 检查 commit、重试和告警 → 比较何时用 Saturn。
- 必须覆盖：Kafka producer/consumer、序列化、消息兼容、幂等、重试/DLQ 以仓库现状为准、事务后发布风险；不讲没有代码证据的平台细节。
- 代码证据：主服务各模块 `access/consumer` 与 Kafka agent/依赖；Tax `internal/common/kafka`、billing 消息代码；Saturn 实现作为边界对照。
- 主类型/任务/风格：机制/架构 / 对比分析 + 故障诊断 / 耐心教练型 + 严谨技术型。
- 完成证据：完成消息契约、兼容性测试和重复/失败处理说明；篇幅遵循统一最低门槛，以讲透为准。

### BE-A05 可靠性：幂等、事务、重试、并发与降级组合

- 学习成果：能依据业务不变量组合数据库事务、唯一约束、幂等键、锁、重试、补偿和限流，避免“所有失败都重试”。
- 自有路径：给定 ASN 重复提交或账单重复消费事故 → 定义不变量 → 标出提交点和副作用 → 选择保护机制 → 注入部分失败/并发 → 验证恢复与告警。
- 必须覆盖：幂等与去重、事务边界、重试分类、指数退避只讲现有能力、并发控制、补偿、限流/熔断/降级按仓库证据取舍。
- 代码证据：主服务事务、worker pool、限流与任务代码；Tax idempotent service、lock、retry task、billing transaction；敏感服务中间件与持久化。
- 主类型/任务/风格：机制 + 综合诊断 / 案例分析 / 耐心教练型 + 严谨技术型。
- 完成证据：提交故障矩阵、不变量说明和可重复的可靠性测试；篇幅遵循统一最低门槛，以讲透为准。

### BE-A06 日志、指标、链路与系统化排错

- 学习成果：能用 request/context 标识、结构化日志、错误码、指标、健康检查和上下游证据定位接口、数据库、缓存、任务与消息问题。
- 自有路径：保留一个真实失败 → 先界定进程和请求/任务 → 按 handler/service/repo/client 分层建假设 → 用日志/指标/配置逐一排除 → 最小修复并回归。
- 必须覆盖：日志上下文、Cat/指标/监控的代码接入、Grafana/日志平台只讲查询思路、健康检查、告警与敏感信息边界；不虚构仓库未埋的 trace。
- 代码证据：主服务 middleware/monitor/troubleshooting skill；敏感服务 logger/interceptors；Tax monitoring、recovery 和 gRPC middleware。
- 主类型/任务/风格：故障诊断 / 案例分析 / 耐心教练型 + 案例分析型。
- 完成证据：完成同步接口与异步任务各一份诊断记录，包含证据、排除项和回归结果；篇幅遵循统一最低门槛，以讲透为准。

### BE-A07 后端改动影响分析、测试与开发交接

- 学习成果：能从需求和 diff 判断受影响的进程、route/schema、Wire、DB、缓存、任务、消息、配置、下游和构建单元，并选择可信的准出检查。
- 自有路径：给定跨服务变更 → 建仓库/进程地图 → 定位同步与异步消费者 → 选择 unit/integration/autotest/build → 检查 DB/配置/任务兼容顺序 → 整理开发交接证据。
- 必须覆盖：`_test.go`、fake/mock、autotest、Wire/build、配置与 schema 兼容、数据变更及关键可观测信号；不讲发版平台和 SOP。
- 代码证据：主服务 testing/workflow skills 与 `autotest`；敏感服务测试/配置/进程；Tax `_test.go`、unit-test 指引、三进程入口和构建配置。
- 主类型/任务/风格：综合实践 / 交付评审 / 耐心教练型 + 简洁专业型。
- 完成证据：提交 reviewer 可执行的影响摘要、测试矩阵、构建结果和兼容性说明；篇幅遵循统一最低门槛，以讲透为准。

## 最终纵向项目：入库请求/ASN 小型变更（已确认）

最终项目不是业务知识考试，而是用一个有足够代码证据的业务切片验证跨端交付能力。`fbs-kb` 只帮助作者校准术语、状态和流程；其仓库结构、知识组织、生成或维护机制不进入项目任务、讲义或考核。

### 项目建议范围

为现有入库请求/ASN 列表增加一个向后兼容的筛选或展示能力，并完成从前端到后端的纵向链路。最终字段与状态从真实内部需求中选择，避免课程虚构生产语义。

必交里程碑：

1. 需求与样例：明确角色、权限、输入、正常/空/错误样例和非目标。
2. 影响分析：定位目标前端形态、主服务 inbound/ASN 路径、数据/外部依赖，以及是否涉及 PII、缓存或异步设施。
3. 契约先行：定义兼容 DTO、错误语义和前后端联调样例。
4. 后端切片：完成 route/handler、应用/领域、repository/client、Wire 与测试中的必要改动。
5. 前端切片：完成页面/组件、路由或入口、状态/API、权限、i18n、错误与空态中的必要改动。
6. 联调回归：保存接口、页面、lint/type-check/test/build 证据，并验证旧调用方。
7. 开发交接：提交跨仓影响、配置/数据兼容检查、测试/构建结果与关键观测信号；发版遵循团队通用流程，不在课程中展开。

### 跨模块验收

| 验收维度 | 最低通过证据 |
| --- | --- |
| 仓库定位 | 能说明为什么改这些仓库/进程，以及为什么不改另外几个仓库 |
| 代码链路 | 一张从页面事件到持久化或下游的真实链路图，节点可映射到代码 |
| 实现质量 | 遵循目标仓现有框架和封装，没有引入课程范围外的替代技术 |
| 安全与兼容 | 权限、PII、错误、旧调用方、重复请求和失败路径有明确处理 |
| 验证 | 前后端最小检查、接口与页面行为均有可复现结果 |
| 交付 | 影响清单、测试/构建结果、兼容说明和关键观察项可供 reviewer 复核 |

## 双入口学习路线与选修规则

### 后端研发转前端

- 主修：模块一 → 模块二 → 模块三 → 最终项目的前端主责里程碑。
- 快速桥接：BE-W02、BE-W03、BE-W04、BE-W06；已有 FBS 后端经验者可用诊断题证明后跳过对应正文。
- 汇合要求：必须完成契约、联调、后端影响判断和开发交接，不能只交页面。

### 前端研发转后端

- 主修：模块四 → 模块五 → 模块六 → 最终项目的后端主责里程碑。
- 快速桥接：FE-W03、FE-W05、FE-W06、FE-A01；已有 FBS 前端经验者可用代码定位题证明后跳过对应正文。
- 汇合要求：必须完成页面回归、浏览器/接口联调和前端影响判断，不能只交接口。

### 共同准出

两条路线最终使用同一套 L4 标准：能够独立接手一个小型 FBS 需求，解释跨仓影响，完成实现、联调与验证，并提交 reviewer 可复核的开发交接材料。选修只减少重复学习，不降低最终验收标准。
