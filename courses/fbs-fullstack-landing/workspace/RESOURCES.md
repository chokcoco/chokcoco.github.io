# FBS 前后端转全栈 Landing 来源包

## 来源政策

本课程使用“代码优先、文档解释、业务材料校准”的取证顺序：

1. 当前工作树中的源码、manifest、配置与测试，是技术行为的最高优先级来源。
2. 仓库 `AGENTS.md`、fullstack Skill、README 和工程文档用于解释运行流程、团队约定和修改边界。
3. `fbs-kb`、Confluence、PPT/PDF 用于补充业务、架构和流程。与代码冲突时保留差异，不用材料覆盖当前实现。
4. 官方公共文档只用于解释语言和开源框架契约；具体版本与用法仍以仓库为准。

同类文档采用“当前代码优先、再择新”的规则：先确认材料适用于当前仓库及依赖版本，再在同类、同适用范围的文档中优先使用最后更新时间较新的版本。较新的文档若与当前源码、manifest 或 lockfile 冲突，仍以代码为准；旧文档只用于解释稳定概念、历史背景或帮助检索当前实现，不把历史迁移步骤写成现行操作。

课程只在公司内部流通。经过校准、且与学习操作直接相关的内部内容 URL 可以出现在学生页面；测试账号、token、密钥、真实 PII、本机路径和生成过程不得固化在课程产物中。

语言、Web 标准和开源框架的公共官方来源统一登记在 `OFFICIAL-SOURCES.md`。具体版本行为必须同时由 manifest、lockfile 或当前源码校准。

静态课程渲染统一加载 [Mermaid 10](https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js)。Wire 章节采用 [Wire v0.5.0 README](https://github.com/google/wire/blob/v0.5.0/README.md) 校准当前仓库所用生成器的 provider、injector 与生成文件概念。

## 审阅快照

审阅日期：2026-07-20。

| 仓库 | 分支 | commit | 课程用途 |
| --- | --- | --- | --- |
| `Playground/ai-course-studio` | `feature/ppt-skills` | `ae926ec4d61d99f4b37b57ddb662c0f4647ed591` | 课程生成框架、Teach Generator、现有课程样式与构建约定 |
| `Work/FBS/fbs-sc-vue` | `release` | `e4d64ef63263f0c5aa6ec5bfa6b4f227bf2756d1` | Vue 3 MMF 主模块、Seller Center 存量页面 |
| `Work/FBS/fbs-sc-react` | `release` | `1267c07d9f476c23cfe48b55e7d9f5db0822c9d2` | React 18 MMF 主模块、远端组件、Vue 到 React 增量迁移形态 |
| `Work/FBS/fbs-frontend` | `release` | `3e01e5c0163a09547b73f874be5144ddf4cbfede` | React 16 FBS Portal、OPS 管理平台 |
| `Work/FBS/sbs-fbs-server` | `release` | `6c8c0759b43d82a3ea8cb5cdaa7b377addf4da7a` | FBS 主 API 与 task 服务 |
| `Work/FBS/fbs-sensitive-data-server` | `release` | `f1e1fb0e052c0e9946393778920475eedf58331c` | PII/敏感数据服务与跨区边界 |
| `Work/FBS/fbs-tax-server` | `release` | `626c98985a4c25f93f401e445de3634acf349d1f` | 税务、发票、计费相关 API/core/task 服务 |
| `Work/FBS/fbs-kb` | `feature/import-fbs-kb-content` | `7ddf4e95b82420e84075c30cf89fe32dc80b6e37` | FBS 业务主题、实体、代码证据和冲突状态 |

课程负责人已确认以六个仓库的 release 分支（2026-07-20）作为本轮课程事实基线。

## 核心仓库来源

### 课程工程

- `.agents/skills/teach-generator/SKILL.md`：任务定义、来源、蓝图、逐章生成和三阶段质检。
- `.agents/skills/humanizer-zh/SKILL.md`：中文学生文本的语言闸门。
- `AGENTS.md`：课程目录、构建入口、质量和披露边界。
- `assets/course-shell.css`、`assets/course-theme.css`、既有 `courses/*`：后续静态课程实现参考，不作为 FBS 技术事实。

### FBS SC Vue

高可信入口：

- `.agents/skills/fullstack/SKILL.md`
- `docs/fullstack.md`
- `package.json`
- `mmc.config.js`
- `repo-context.json`、`repo-profile.json`

主要代码证据：

- `src/index.ts`：MMF 模块入口与全局依赖初始化。
- `src/router/index.ts`：`/portal/fbs` 路由、守卫和页面懒加载。
- `src/store/index.ts`、`src/store/modules/*`：Seller、Shop、System、Temporal 状态。
- `src/utils/request.js`、`src/api/*`：普通与 PII 请求、错误处理和业务 API。
- `src/report/api.ts`：API SLA/监控接入。
- `src/views/inbound/*`、`src/views/products/*`：入库与商品案例。
- `.agents/skills/coding/*`：路由、菜单、API、权限、i18n、Store、时间、文件与 PII 规则。

适用章节：前端环境、Vue 组件、路由、Store、请求、权限、i18n、MMF、诊断、入库实践。

### FBS SC React

高可信入口：

- `README.md`、`TROUBLESHOOTING.md`
- 根 `package.json`、`pnpm-workspace.yaml`
- `projects/react-frontend/package.json`
- `projects/fbs-sc-remote-component/package.json`
- 两个 project 的 `mmc.config.js` 与 `config/.remote-config.json`

主要代码证据：

- `projects/react-frontend/src/index.ts`：React 18 MMF 主模块入口。
- `projects/react-frontend/src/router/index.ts`：宿主路由注册。
- `projects/react-frontend/src/store/*`：Redux Toolkit/Redux 状态。
- `basic/src/utils/MMF/request/*`：普通、Blob 与 PII 请求封装。
- `projects/fbs-sc-remote-component/src/context/createRemoteComponent.tsx`：远端组件适配。
- `projects/fbs-sc-remote-component/src/InboundComponent/*`：入库共享组件案例。
- `domains/` 与 `basic/`：monorepo 的领域与基础层边界。

仓库中未发现与另两前端仓同形态的 `.agents/skills/fullstack/` 和 `docs/fullstack.md`。Confluence “fbs-sc-frontend 工程结构梳理”用于补足说明，但正文仍要回到代码验证。

### FBS Portal React

高可信入口：

- `.agents/skills/fullstack/SKILL.md`
- `docs/fullstack.md`
- `package.json`
- `webpack.config.js`
- `repo-context.json`、`repo-profile.json`

主要代码证据：

- `src/entry.ts`、`src/index.tsx`：应用初始化与 React 渲染入口。
- `src/routes/*`：React Router 5 业务路由。
- `src/store/*`、`src/recoil/*`：Redux、Redux Thunk 与 Recoil。
- `src/apis/*`、`src/utils/request.ts`：API 封装与请求行为。
- `src/constants/permissions.ts`、`src/business/utils/permission.ts`：权限模型。
- `src/business/utils/i18n.ts`：i18n 封装。
- `src/views/InboundManagement/*`、`src/views/SellerManagement/*`：入库与入驻案例。
- `configs/jest.config.js`、仓库内 `__test__`：前端测试证据。

### FBS 主服务

高可信入口：

- `AGENTS.md`
- `Readme.md`
- `go.mod`
- `makefile`
- `conf/chassis*.yaml`
- `docs/project_structure/*`、`docs/code_standards/*`、`docs/domains/*`
- `.ai/skills/dev/coding/SKILL.md`、`testing/SKILL.md`、`troubleshooting/SKILL.md`

主要代码证据：

- `cmd/api_server/*`、`cmd/fbs_task/*`：API 与任务入口。
- `app/*`、`apps/*`：旧/新业务模块并存。
- 各模块 `access/http/{portal,sc,openapi}/{define,handle,url}.go`：HTTP 开发路径。
- 各模块 `access/{crontask,asynctask,consumer}/*`：Saturn 与消息任务。
- `wire_set.go`、`wire.go`、`wire_gen.go`：编译期依赖注入。
- `sbs_agent/{db,mysql,redis_pool,saturn}/*`：基础设施适配。
- `middleware/*`：鉴权、CSRF、限流、监控、响应包装。
- `errcode/*`：错误码与翻译映射。
- `autotest/*` 与 `_test.go`：自动化和单元测试。

技术事实：Go 1.20；Chassis、Wire、HTTP/gRPC、MySQL、GORM/Scorm、Redis、Kafka、Saturn、Apollo 与可观测能力均有 manifest 或代码证据。

### 敏感数据服务

高可信入口：`README.md`、`go.mod`、`conf/chassis*.yaml`。

主要代码证据：

- `cmd/api_server/*`、`cmd/task/*`：服务与任务入口。
- `app/*`、`apps/*`：client、seller、supplier、RTS 等模块。
- `apps/client/access/http/sc/*`：Seller Center PII 接口示例。
- `libs/http_interceptors/*`、`middleware/*`：会话、远程鉴权和响应包装。
- `libs/db/*`、`libs/redis/*`、`libs/saturn/*`：数据与任务设施。
- `agent/*`、`thirdpart/*`：主 FBS、SCBS、SPEX 等外部依赖。

技术事实：Go 1.20。`go.mod` module path 与主服务相同，课程只记录现状与排错影响。

### FBS Tax

高可信入口：`AGENTS.md`、`README.md`、`go.mod`、`Makefile`、`conf/chassis*.yaml`。

主要代码证据：

- `cmd/{tax_api,tax_core,tax_task}/*`、`apps/*`：三个进程入口。
- `internal/controller/*`：HTTP/gRPC 控制器。
- `internal/service/*`、`internal/agg_service/*`：服务与聚合编排。
- `internal/tax_job/*`：发票、计费与校验任务。
- `internal/common/dbhelper/*`、`infrastructrure/cache/*`：数据与缓存。
- `middleware/*`：JWT、限流、日志、恢复、gRPC 拦截器。
- `protobuf/*`、`third_party/*`：协议和外部服务。
- `_test.go`、`.cursor/skills/unit-test/SKILL.md`：测试模式；该 Skill 的项目名有历史残留，只采纳与当前代码吻合的部分。

技术事实：`go.mod` 声明 Go 1.15。课程不得使用 1.18+ 语法编写声称可在该仓运行的示例。

### FBS 知识库

使用定位：仅作为作者侧的业务参考与断言校准来源，不属于课程要讲授或要求学员上手的开发仓库。以下目录清单只用于编写阶段路由资料，不进入学生课程结构。

- `syn_prd_fbs_ch/index.md`：主题总览与 truth status。
- `seller-onboarding-and-activation/`：入驻与编辑。
- `product-management/`：商品报名、编辑、退出、VSKU/fulfillment mapping。
- `inbound/`：IR/ASN、Pickup/Dropoff、BR/SEA/CB、推荐入库和 VAS。
- `rts/`：Portal、SC、BR、SEA/CB 退仓。
- `inventory-and-ia/`、`mto-transfer/`：库存、IA、移库。
- `channel-and-fulfillment-config/`：渠道、仓、名单与同步。
- `portal-and-horizontal-support/`：权限、首页、Landing、Block/Unblock。
- `entities/`：实体索引，只按当前章节读取，不批量注入上下文。

使用限制：`unknown` 与 `partially_unresolved` 主题必须回看 `code_evidence.md`、`code_conflicts.md` 和当前源码；不能把综合描述写成无条件事实。

## 补充材料

| 来源 | 内容 | 使用方式 | 可信等级 |
| --- | --- | --- | --- |
| `assets/fbs/FBS FE 全栈 Landing 培训材料.pdf` | 前端仓库关系、技术栈、微前端、部署入口 | 课程范围与架构校准；具体版本回到 manifest | B |
| `assets/fbs/FBS后端全栈 Landing 开发指引.pdf` | Wire、HTTP、Saturn、消费者、测试、Apollo、错误码、页面操作 | 后端工程蓝图；代码路径回到 release 仓库 | A-/B+ |
| `assets/fbs/FBS BE 全栈 Onboard 材料.pptx` | Chassis、Saturn 与基础设施清单 | 基础设施知识地图；有代码证据才进入必修正文 | B |
| `assets/fbs/FBS BE 全栈 Onboard 完整材料.pptx` | 业务、产品/系统/应用/部署架构、服务与领域 | 业务与架构总览；流程细节由知识库和代码校准 | B |
| 用户截图 `74a96292c011cb3c728c02bc4e54c465.png` | Chassis、Saturn、Apollo、Service Center、Cat、Grafana、日志、MySQL、Codis、Cache Cloud、ES、Kafka、Soup、Transify | 作为候选基础设施清单；未在仓库找到直接证据的内容不设为必修 | B- |

PDF 已完成全页文本提取和页面渲染抽查；PPT 已转换为 PDF，短版 7 页与完整版 88 页已全量提取，并对基础设施页、架构页和服务页做渲染核对。部分 PPT 中文字体提取为乱码，相关事实以页面视觉和代码为准。

## 定向 Confluence 来源

仅读取本地材料明确链接的页面：

| Page ID | 标题 | 最后更新 | 用途 |
| --- | --- | --- | --- |
| `3200778148` | Repo Guide Skill 设计方案 | 2026-06-01 | 理解仓库 Guide/Skill 的边界，不作为课程主体 |
| `3230504338` | Portal fbs-frontend 工程梳理 | 2026-06-25 | React 16 Portal 架构、路由、权限、API、构建 |
| `3230504339` | SC fbs-frontend 工程梳理 | 2026-06-25 | Vue 3 MMF 架构、路由、Store、权限、API、监控 |
| `3230504666` | fbs-sc-frontend 工程结构梳理 | 2026-06-25 | React 18 monorepo、MMF、远端组件与宿主依赖 |
| `1608625868` | MMF seller portal 配置说明 | 2023-07-17 | 历史路由配置背景，需按当前仓库和平台二次核验；不用于讲发版 |
| `3226220935` | FBS后端开发指引 | 2026-06-30 | 后端开发流程的当前在线版 |
| `2241614361` | 入驻-用户手册 | 2025-03-27 | 页面无正文，当前不可作为事实源 |
| `2767433080` | FBS入库操作指引 | 2026-04-02 | 正文很短，需附件或子页才能补足 |
| `2662212317` | 外部依赖系统 | 2025-03-03 | 页面无正文，当前不可作为事实源 |
| `2312556647` | Local Consignment Selling Oversea-FBS 支持全球仓 | 2024-06-04 | 特定业务补充，非核心路线 |

Confluence 页面内容仅写入 workspace 的来源映射，不复制到学生正文。

## 断言与来源示例映射

| 断言 | 主证据 | 辅助证据 |
| --- | --- | --- |
| FBS 前端有 React 16 Portal、Vue 3 MMF、React 18 MMF/远端组件三种形态 | 三仓 `package.json`、入口和配置 | FE Landing PDF、3 份 Confluence 工程梳理 |
| Vue 主模块由 Seller Portal/MMF 宿主注入路由、Store、请求与 i18n 能力 | `mmc.config.js`、`src/index.ts`、`src/router/index.ts` | SC fbs-frontend 工程梳理 |
| 主服务 HTTP 开发经过 define/handle/url、中间件和 Wire 注册 | release 代码、`AGENTS.md`、`Readme.md` | 后端开发指引 PDF/Confluence |
| 定时与消息任务使用 Saturn 并通过任务集合注册 | `sbs_agent/saturn`、各模块任务代码 | 后端开发指引、短版 PPT |
| 部署涉及 Apollo、MySQL、缓存、Kafka、Saturn、日志/监控 | `go.mod`、Chassis 配置、agent/libs/middleware | 完整 PPT 部署架构、用户截图 |
| 入库适合作为端到端教学主线 | 三前端入库代码、主服务 inbound/ASN、知识库 inbound | 后端开发指引示例、完整 PPT |

## 待补来源

- `fbs-sc-react` 仓库内正式 fullstack Skill/文档，或确认 Confluence 工程梳理就是权威版本。
- 敏感数据服务与税务服务的 Landing 文档。
- 两个典型纵向需求的 PRD/TD/MR/测试与复盘证据；课程仅内部使用，不要求为公开发布额外脱敏。
- 页面为空的 Confluence 来源所需附件或子页。
- 基础设施清单中 ES、Soup 等在当前 3 个后端仓的直接使用证据；未补齐前不设为必修章。

## 定向补充的内部材料

| 来源 | 版本/最后更新 | 课程用途 | 使用限制 |
| --- | --- | --- | --- |
| [`chassis 介绍文档.md`](../../../assets/fbs/chassis%20介绍文档.md) | 文件未标明可靠版本 | Chassis 术语、模块地图和继续检索线索 | 可能过时，只解释稳定概念 |
| Confluence `2516849432`「chassis - v0.4.3-r.8」 | v0.4.3-r.8；2024-11-01 | REST/Gin/gRPC、client、config、logger、middleware、Scorm、monitoring 的概念目录 | 主服务和敏感服务当前为 r.13、Tax 为 r.22；实际 API 以当前代码为准 |
| [`Saturn平台使用指南（CN）.pptx`](../../../assets/fbs/Saturn平台使用指南（CN）.pptx) | 文件内未标明可与仓库绑定的当前版本 | RPC/script/msg job、分片、故障转移、并行、重试与监控的概念辅助 | 只讲仓库中出现的任务形态；材料中的网络凭据等环境信息不得进入课程 |
| Confluence `1150051238`「SCORM V1」 | 2022-06-01 | 旧 Scorm 使用方式的版本对照 | 不能用更新时间替代依赖判断；具体仓库按 `go.mod` 和当前调用选择 v1/v2 |
| Confluence `1123529496`「Scorm/gorm v2」 | 2022-08-02 | v2 概念和迁移差异对照 | 仅在仓库确实使用对应版本时采用 |
| [`MMF Migration.pptx`](../../../assets/fbs/MMF%20Migration.pptx) | 历史 SCF→MMF 迁移材料 | MM Router、Portal API、plugins、remote component、multi dev server 的历史背景 | 大量迁移与 build/release 内容已旧，不作为现行步骤，不讲发版 |
| Confluence `1571724026`「Fulfillment FE - Seller Center MMF 改造」 | 2023-07-17 | MMF 改造总览和子页导航 | 当前行为必须回到三前端仓库验证 |
| Confluence `1571735795`「MMF 本地启动」 | 2024-10-28 | 同类 MMF 操作材料中的优先版本，用于本地开发 Landing | 仍须与当前 `package.json`、MMC/MMF 配置和仓库文档校准 |
| Confluence `1581142618`「MMF 代码改造」 | 2023-07-17 | 历史改造背景 | 页面已注明改造完成，本地运行可跳过；不作为学员操作步骤 |

以上材料已完成定向审阅。相同主题出现多个版本时，正文必须在断言旁同时记录“适用仓库/依赖版本”和“材料更新时间”，不得仅凭标题相似或日期较新直接覆盖代码事实。
