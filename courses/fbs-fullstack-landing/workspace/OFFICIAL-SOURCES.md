# FBS 全栈 Landing 官方外部来源包

## 使用原则

- 核验日期：2026-07-16。
- 本文件补充语言、Web 标准、开源框架和基础设施的官方知识；FBS 的实际版本、接入方式与行为仍以指定仓库当前工作树为准。
- 标准、语言规范和项目官方文档优先于教程型社区文章。社区文章不作为核心规则的唯一证据。
- 官方文档若描述的是最新版本，而仓库使用旧版本，只用于不变的基础概念；版本相关行为必须改用对应 tag、版本文档或仓库源码。
- Chassis、MMF/MMC、Saturn、内部 Apollo 接入、Transify、EDS/SSC UI、Scorm 及内部增强 Kafka/Redis 库没有适用的公开官方文档，继续以仓库、内部 Skill/文档和定向 Confluence 为证据，不能用名字相近的公开项目替代。
- 课程仅在公司内部流通。学生正文可以直接链接与当前学习动作有关的公开或内部内容 URL；账号、token、密钥和真实 PII 仍不得写入课程文件。

## JavaScript、TypeScript 与 Web 标准

| ID | 官方来源 | 用途与版本限制 | 适用章节 |
| --- | --- | --- | --- |
| JS-SPEC | [ECMAScript Language Specification](https://tc39.es/ecma262/) | JavaScript 类型、求值、函数、Promise 等规范语义；正文应教学化转述，不直接堆规范术语 | FE-L01～FE-L05 |
| JS-GUIDE | [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide) | 面向开发者的语法与概念解释，配合规范使用 | FE-L01～FE-L04 |
| JS-BUILTINS | [MDN Standard built-in objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects) | Array、Object、Map、Set、String、Date、JSON、Promise 等 API | FE-L03、FE-L04 |
| WEB-API | [MDN Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) | DOM、事件、URL、URLSearchParams、Fetch/Blob 等浏览器 API 的入口索引 | FE-L04、FE-L06、FE-W05、FE-W06 |
| EVENT-LOOP | [WHATWG HTML: Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) | task/microtask 的规范边界；本课只解释读懂 Promise 顺序所需部分 | FE-L03 |
| HTTP | [RFC 9110: HTTP Semantics](https://datatracker.ietf.org/doc/html/rfc9110) | 方法、状态码、请求/响应与幂等语义；FBS response wrapper 仍以代码为准 | FE-W05、BE-W02、BE-W05、BE-A05 |
| TS-HANDBOOK | [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | 结构类型、联合、收窄、泛型、工具类型等 | FE-L05、FE-W02～FE-W05 |
| TS-47 | [TypeScript 4.7 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html) | 与两个 SC 仓的 TS 4.7 基线对齐；Portal 的 4.4 能力需再缩小 | FE-L05、FE-A03、FE-A04 |

## 前端框架、状态、路由与请求

| ID | 官方来源 | 用途与版本限制 | 适用章节 |
| --- | --- | --- | --- |
| REACT-16 | [React 16.14.0 official release](https://github.com/facebook/react/releases/tag/v16.14.0) | 锁定 Portal React 16 事实；概念解释可参考 React Learn，但 hooks/并发等不能越过仓库版本 | FE-L06、FE-W02、FE-A01、FE-A03 |
| REACT-LEARN | [React Learn](https://react.dev/learn) | 组件、Props、state、事件和状态共享的官方概念；与 React 16 差异回到代码核验 | FE-L06、FE-W02、FE-W04 |
| REACT-18 | [React 18 upgrade guide](https://react.dev/blog/2022/03/08/react-18-upgrade-guide) | React 18 root、automatic batching 等版本边界；只讲仓库实际触及的部分 | FE-A01、FE-A03 |
| VUE-3 | [Vue 3 Guide](https://vuejs.org/guide/introduction.html) | SFC、template、响应式、组件、Props/Emits | FE-L06、FE-W02、FE-A01、FE-A03 |
| VUEX | [Vuex 4 documentation](https://vuex.vuejs.org/) | state/getter/mutation/action/module；宿主注入方式仍以 FBS 代码为准 | FE-W04、FE-A03 |
| ROUTER-5 | [React Router v5.2.0 official tag](https://github.com/remix-run/react-router/tree/v5.2.0) | Portal 的 v5 API 与源码/README 基线；不以当前 v7 文档代替 | FE-W03、FE-A01 |
| ROUTER-6 | [React Router 6.30.3 documentation](https://reactrouter.com/6.30.3/start/overview) | React 18 仓的 v6 路由概念；具体注册由 MMF 封装决定 | FE-W03、FE-A01 |
| VUE-ROUTING | [Vue: Routing](https://vuejs.org/guide/scaling-up/routing.html) | Vue 路由基础概念；FBS 的 route 注册与守卫仍以仓库为准 | FE-W03 |
| REDUX | [Redux Essentials](https://redux.js.org/tutorials/essentials/part-1-overview-concepts) | store/action/reducer/selector 与不可变更新 | FE-W04 |
| RTK | [Redux Toolkit tutorials](https://redux-toolkit.js.org/tutorials/overview) | React 18 仓的 slice/thunk/store 模式；版本以 manifest 为准 | FE-W04 |
| RECOIL | [Recoil documentation](https://recoiljs.org/docs/introduction/getting-started/) | Portal 存量 Recoil 的 atom/selector 概念；该项目已停止活跃演进，不扩成新选型推荐 | FE-W04 |
| AXIOS-018 | [Axios v0.18.0 official source](https://github.com/axios/axios/tree/v0.18.0) | Portal 和部分兼容包的旧 API/拦截器行为 | FE-W05、FE-W06 |
| AXIOS-112 | [Axios v1.12.2 official source](https://github.com/axios/axios/tree/v1.12.2) | SC React 当前请求依赖；与 0.18 的差异不静默合并 | FE-W05、FE-W06 |

## 前端构建、微前端、测试与运行时

| ID | 官方来源 | 用途与版本限制 | 适用章节 |
| --- | --- | --- | --- |
| NODE-16 | [Node.js 16 API](https://nodejs.org/docs/latest-v16.x/api/) | Portal 的 Node 16 运行线；Node 16 已 EOL 的风险只在内部课程中说明，不擅自升级仓库 | FE-W01、FE-A04 |
| NODE-20 | [Node.js 20 API](https://nodejs.org/docs/latest-v20.x/api/) | 两个 SC 仓的 Node 20 运行线 | FE-W01、FE-A04 |
| YARN-1 | [Yarn Classic documentation](https://classic.yarnpkg.com/lang/en/docs/) | Portal/Vue 仓的 Yarn Classic 命令和 lockfile 语义 | FE-W01、FE-A04 |
| PNPM-8 | [pnpm documentation](https://pnpm.io/) | React monorepo workspace/filter 基础；命令以 pnpm 8 和仓库 scripts 为准 | FE-W01、FE-A04 |
| WEBPACK-5 | [Webpack concepts](https://webpack.js.org/concepts/) | entry、loader/plugin、bundle 与产物概念 | FE-W01、FE-A04 |
| MODULE-FED | [Webpack Module Federation](https://webpack.js.org/concepts/module-federation/) | Portal remote 的公开机制；FBS remote component/MMF 契约由内部代码补充 | FE-A02、FE-A03 |
| QIANKUN | [qiankun Guide](https://qiankun.umijs.org/guide) | Portal 存量 qiankun 的生命周期和主/微应用边界 | FE-A02 |
| RSPACK | [Rspack introduction](https://rspack.rs/guide/start/introduction) | SC Vue 构建机制的公开背景；MMC/Rsbuild 配置仍以仓库为准 | FE-W01、FE-A04 |
| RSBUILD | [Rsbuild Guide](https://rsbuild.rs/guide/start/) | SC Vue 的构建工具概念与配置入口 | FE-W01、FE-A04 |
| JEST | [Jest documentation](https://jestjs.io/docs/getting-started) | Portal 测试基础；项目仍使用 Jest 24，最新文档只用于稳定概念 | FE-A04 |

## Go、协议、数据与基础设施

| ID | 官方来源 | 用途与版本限制 | 适用章节 |
| --- | --- | --- | --- |
| GO-SPEC | [The Go Programming Language Specification](https://go.dev/ref/spec) | 类型、方法集、接口、defer、goroutine/channel 等语言规则 | BE-L01～BE-L07 |
| GO-EFFECTIVE | [Effective Go](https://go.dev/doc/effective_go) | Go 惯用写法的辅助解释；若与当前仓库规范不同，以仓库为准 | BE-L01～BE-L07 |
| GO-115 | [Go 1.15 release notes](https://go.dev/doc/go1.15) | Tax 仓兼容边界 | BE-L01、BE-L07、BE-W01 |
| GO-120 | [Go 1.20 release notes](https://go.dev/doc/go1.20) | 主服务和敏感服务的版本边界 | BE-L01、BE-L07、BE-W01 |
| GO-MOD | [Go Modules Reference](https://go.dev/doc/modules/gomod-ref) | `go.mod`、module、版本与 replace 等 | BE-L01、BE-W01 |
| GO-CONTEXT | [context package](https://pkg.go.dev/context) 与 [Go Concurrency Patterns: Context](https://go.dev/blog/context) | 取消、超时与 request-scoped data；不把业务字段滥塞进 context | BE-L06、BE-W02、BE-W05 |
| GO-HTTP | [net/http package](https://pkg.go.dev/net/http) | 标准 HTTP 对象和 client/server 基础，Chassis 封装由内部代码解释 | BE-L06、BE-W02、BE-W05 |
| GO-JSON | [encoding/json package](https://pkg.go.dev/encoding/json) | struct tag、marshal/unmarshal 和空值边界 | BE-L02、BE-L06、BE-W02 |
| GO-DB | [Accessing relational databases](https://go.dev/doc/database/) | `database/sql`、事务和连接基础 | BE-W04、BE-A05 |
| GORM | [GORM documentation](https://gorm.io/docs/) | GORM v1.23.x 的模型、查询与事务；内部 fork/Scorm 差异只由代码证明 | BE-W04、BE-A05 |
| WIRE | [Wire official overview](https://go.dev/blog/wire) 与 [Wire v0.5.0 README](https://github.com/google/wire/blob/v0.5.0/README.md) | provider、injector 和生成代码；项目已归档，不作为新技术选型推荐 | BE-L03、BE-W03 |
| GRPC-GO | [gRPC Go documentation](https://grpc.io/docs/languages/go/) | client/server、metadata、deadline 和 interceptor 基础 | BE-W05、BE-W06 |
| PROTO3 | [Protocol Buffers: Proto3](https://protobuf.dev/programming-guides/proto3/) | 字段编号、默认值和兼容演进 | BE-W05、BE-A04 |
| MYSQL | [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/) | SQL、索引、事务与隔离基础；生产版本和内部约束需再由环境确认 | BE-W04、BE-A05 |
| REDIS | [Redis developer documentation](https://redis.io/docs/latest/develop/) | key、TTL、数据类型、缓存和锁的公开语义；Codis/内部 client 差异回到代码 | BE-A02、BE-A05 |
| KAFKA | [Apache Kafka documentation](https://kafka.apache.org/documentation/) | producer/consumer、offset 和 delivery semantics；内部增强库行为以仓库为准 | BE-A04、BE-A05 |

## 逐章取材规则

1. 语言章至少采用一个规范/官方 API 来源和一个真实仓库片段，先讲稳定规则，再迁移到 FBS 代码。
2. 框架章至少同时使用“对应版本官方来源 + manifest/lockfile + 真实接入代码”。只引用当前最新版文档不能证明旧版本行为。
3. 内部框架章不寻找名字相近的公开替代物。公开资料只解释底层 JavaScript、HTTP、Go、MySQL、Redis 或 Kafka 契约。
4. 课程正文中的外链只保留当前操作需要点击或能支持关键断言的链接，不把本文件整张清单复制到每章。
5. 正式写章前重新检查对应 URL 与版本；易变行为在章末记录访问日期。
