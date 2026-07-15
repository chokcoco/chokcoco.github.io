# Repo Guide Skill 设计方案

## 1. 背景与目标
### 1.1 背景
AI 在业务仓库里完成一次开发需求时，通常需要按固定顺序理解仓库、定位范围、加载规范并完成验证：

```plain
仓库概览与运行准备
  -> 项目结构识别
  -> 改动目标定位
  -> 编码规则加载
  -> 变更影响分析
  -> 准出检查
```

这个流程里会反复用到两类信息：

+ 仓库稳定信息：业务范围、仓库边界、owner、启动方式、验证命令、团队长期约定。这类信息变化频率低，但很难完全依赖源码准确推断。
+ 单次需求上下文：当前目录结构、当前需求涉及哪些模块、当前改动需要哪些规范、实际 diff 影响哪些页面和 portal。这类信息和具体需求、当前源码状态强相关，需要按需扫描和推导。

### 1.2 为什么需要 Repo Guide
Repo Guide 的核心价值是为不同调用方提供一份仓库级入口。CLI、IDE 插件、Agent 或任务平台只要读取 `AGENTS.md`，就能稳定找到仓库事实、编码规范 skill、规则分类和入口协议。

没有统一入口时，调用方通常有两种做法：

1. 依赖 AI 每次自行扫描仓库、总结规则和判断边界。
2. 在不同 CLI、插件、Agent 或任务平台中各自维护仓库理解逻辑。

这两种方式都会带来问题：

+ 重复分析成本高，每次都要重新读取目录、package、route、api、i18n、权限等代码。
+ 结果容易受 prompt、上下文窗口和工具实现影响，不同调用方可能得出不同结论。
+ 业务 owner、仓库边界、长期约定等事实难以从源码稳定推断。
+ 一次需求中发现的规则、命令、边界变化和 bug lesson 不容易沉淀给后续复用。
+ 多种调用方之间难以共享同一套仓库能力入口。

Repo Guide 的作用是把稳定事实、规则入口和运行时能力入口统一成可机器消费的协议：

+ `Agenct.md` 负责统一入口和使用规范。
+ `repo-profile.md` 负责稳定事实。
+ Coding Rule Skills 负责可执行编码规范。
+ Repo workflow Skills 负责按需扫描和推导。

这样调用方仍然可以使用 AI 动态分析，但分析会基于统一入口和已确认事实，而不是每次从零开始猜。

### 1.3 目标
本方案目标是建立一套更贴近开发流程的 Repo Guide 机制：

+ 用 `Agenct.md` 作为仓库统一入口，统一索引仓库事实和可调用的规范 skill。
+ 用 `repo-profile.md` 承载源码难以稳定推断的仓库事实，例如业务边界、启动方式、验证命令和 owner 信息。
+ 将仓库编码规范按领域拆成可独立调用的 Coding Rule Skills，让一次需求只加载相关规则。
+ 用 Repo workflow Skills 按需扫描源码、定位范围、加载规范、分析影响并选择准出检查；同时为事实、规则和 bug lesson 提供更新入口。

## 2. 需求开发流程拆解
本章从一次需求开发过程出发，先定义 Repo Guide 在仓库中入口，再说明调用方如何基于这些入口完成不同开发阶段的仓库理解、范围定位、规范加载和准出检查。

### 2.1 Repo Guide 入口索引
Repo Guide 是业务仓库提供给 CLI、IDE 插件、Agent 或任务平台的仓库级开发入口协议。

统一入口固定为 `AGENTS.md`。这个文件负责说明：

+ `repo-profile.md` 在哪里。
+ Rule Skills 有哪些分类、调用时机是什么。
+ Repo workflow Skills 解决哪些阶段性问题。
+ 调用方应该先读什么、后读什么。
+ 哪些信息是稳定事实，哪些信息需要实时扫描源码。

`repo-profile.md` 文件内只维护入口索引：

| Repo Guide entry | JSON path | 内容 |
| --- | --- | --- |
| 菜单规则入口 | `coding.menu` | 指向菜单、导航、portal entry 相关 Rule Skill |
| 路由规则入口 | `coding.route` | 指向 route、router、page entry 相关 Rule Skill |
| API 规则入口 | `coding.api` | 指向 API client、request wrapper、接口错误处理相关 Rule Skill |
| 错误码规则入口 | `coding.error_code` | 指向错误码新增、错误提示映射、兼容处理相关 Rule Skill |
| i18n 规则入口 | `coding.i18n` | 指向翻译 key、locale resource、文案渲染相关 Rule Skill |
| Store 规则入口 | `coding.store` | 指向状态管理、store 命名、状态边界相关 Rule Skill |
| 枚举规则入口 | `coding.enum` | 指向全局枚举获取、枚举映射、业务状态展示相关 Rule Skill |
| Hooks 规则入口 | `coding.hooks` | 指向 hooks 组织、请求 hooks、副作用边界相关 Rule Skill |
| 权限规则入口 | `coding.permission` | 指向权限点、feature flag、访问控制相关 Rule Skill |
| 时间规则入口 | `coding.time` | 指向时间展示、时区、秒/毫秒时间戳转换、跨天时间相关 Rule Skill |
| 文件操作规则入口 | `coding.file_operation` | 指向上传、下载、导入、导出、模板和 blob 文件处理相关 Rule Skill |
| PII 规则入口 | `coding.pii` | 指向敏感信息展示、脱敏、解密查看和隐私边界相关 Rule Skill |
| Shared 规则入口 | `coding.shared_module` | 指向 shared module 使用、修改边界、影响评估相关 Rule Skill |
| 扩展规则入口 | `coding.<custom_key>` | 可选扩展入口，用于仓库明确需要的特殊规则；V1 不默认生成 wildcard 规则 |


有了这份入口索引后，调用方可以在一次需求开发过程中按阶段读取仓库事实、调用 Repo workflow Skills，并在编码阶段按需加载对应 Rule Skills。

### 2.2 基于 Repo Guide 的开发阶段
<img src="https://cdn.nlark.com/yuque/0/2026/png/311219/1783392224658-46e760b6-4c91-40ef-b9d5-6b5c4491e844.png" width="1156" title="" crop="0,0,1,1" id="ub5b4a092" class="ne-image">

#### 2.2.1 能力总览
| 开发阶段 | 需要回答的问题 | 需要的仓库能力 | 典型输出 |
| --- | --- | --- | --- |
| 仓库概览与运行准备 | 仓库负责什么业务、归谁维护、有哪些边界、如何本地运行和验证 | 仓库事实读取 | repo basics、business boundary、workflow、commands |
| 项目结构识别 | apps、pages、modules、shared packages 如何组织 | 项目结构扫描 | project structure map |
| 改动目标定位 | 需求可能涉及哪些 app、page、module、关联文件类型 | 改动范围推导 | change target candidates |
| 编码实现 | 如何基于改动范围完成代码修改，并遵守仓库规范 | Rule Skill 查询 | rule skills |
| 变更影响分析 | 实际改动影响哪些页面、模块、portal、shared 区域 | diff 影响推导 | impact summary |
| 准出检查 | 本次改动应该执行或准备哪些 lint、typecheck、test、build | 准出检查 | validation checks |


#### 2.2.2 阶段一：仓库概览与运行准备
目标是让调用方先获得仓库的稳定事实和本地运行前置条件。

`repo-profile.md` 提供以下信息：

+ 仓库概览：仓库名称、类型、owner、业务范围。
+ 业务边界：哪些 portal / app / business entry 属于当前仓库，哪些属于仓外团队。
+ 依赖关系：packages/应用间依赖，主/子应用依赖。
+ 启动方式：package manager、node version、本地 dev 命令、端口、环境变量、代理和登录态说明。
+ 验证命令：lint、typecheck、test、build、命令 cwd、timeout。

这一阶段以读取 `AGENTS.md` 中声明的 `repo-profile.md` 为主。需要统一输出时，可以由调用方直接读取，也可以通过 `load_repo_basics.skill` 做归一化包装。

#### 2.2.3 阶段二：项目结构识别
目标是基于当前源码生成目录结构地图。

对应 skill：

```plain
map_project_structure.skill
```

这个 skill 不依赖长期写死的目录地图，而是根据仓库代码实时确认：

+ 当前有哪些 apps。
+ 每个 app 的 route roots、page roots、module roots。
+ pages 下哪些目录是模块。
+ shared package 放在哪里。
+ 常见文件角色，例如 route、api、store、hooks、components、i18n、permission。
+ workspace package 之间的引用关系。

skill 文档中需要给出仓库常见结构示例，作为识别参考；实际输出必须来自当前仓库扫描结果。

#### 2.2.4 阶段三：改动目标定位
目标是把需求映射到候选改动范围。

对应 skill：

```plain
locate_change_targets.skill
```

输入：

+ workflow Request，例如 PRD、Jira、用户描述、错误日志。
+ `map_project_structure.skill` 输出的 project structure map。

输出：

+ 需求命中的业务入口。
+ 候选 app / portal / page / module。
+ 候选 root path。
+ 建议查找的关联文件类型，例如 api、route、store、hooks、components、i18n、permission、tests。
+ 少量高置信具体文件。
+ 需要人工确认的问题。

这里不要求把所有关联文件全部列完。更合理的方式是输出“候选模块 + 文件角色 + 查找建议”，让后续 Rule Skills 或代码读取按需展开。

#### 2.2.5 阶段四：生码 - 编码规则与实现约束
目标是在进入具体编码前，基于已确认或已推导的改动上下文，找到本次需要读取的仓库规则，并明确代码实现需要遵守的约束。

具体代码实现由调用方或 Agent 完成；Repo Guide 负责提供“本次改动应遵守的规则总结、参考文件、推荐写法、避免模式和确认项”。

调用方可以直接按分类调用具体 rule skill，也可以调用统一入口：

```plain
load_rule_skills.skill
```

##### Rule Skill 选择原则
只处理两类输入状态：

1. **target 上下文缺失：**如果调用方只提供原始需求，且没有路径、模块、文件角色、改动文件或 `rule_target`，则默认返回所有 Rule Skills 列表
2. **target 上下文存在：**如果调用方已经提供 `rule_target`、`change_targets`、`changed_files` 或 diff 摘要，则 `load_rule_skills.skill` 基于这些目标上下文做轻量匹配，返回 `selected_rule_skills`。

##### target 上下文
target 上下文用来表达“这次规则加载围绕哪些代码目标展开”。它可以来自 `locate_change_targets.skill` 的输出、实际改动文件、diff 摘要，也可以由调用方直接传入 `rule_target`。

后续具体编码过程中，Rule Skill 的输出用于指导代码修改，而不是替代代码修改动作。Rule Skill 输出规则摘要、可参考文件、推荐写法、避免模式和确认项；调用方再结合当前源码完成实现。例如 i18n：

+ skill 读取 `repo-profile.md` 中的长期规则。
+ 扫描当前模块已有 i18n 用法。
+ 找到仓库封装方法、示例文件、禁止用法和历史 bug lesson。
+ 输出本次代码生成需要遵守的 i18n 规则。

#### 2.2.6 阶段五：变更影响分析
目标是基于实际改动文件推导影响范围。

对应 skill：

```plain
analyze_diff_impact.skill
```

输入：

+ workflow Request。
+ 实际改动文件列表。
+ project structure map。
+ import / route / module / package 关系。

输出：

+ 影响页面。
+ 影响模块。
+ 影响 app / portal。
+ shared module 影响。
+ 需要确认的风险。
+ 建议补充的校验命令。

这个结果用于代码修改后的自检和 review 前说明，不作为长期仓库事实写回。

#### 2.2.7 阶段六：准出检查规则
目标是确定准出检查的相关规则，例如 lint、typecheck、单测和 build。Repo workflow Skill 负责提供规则；由调用方按当前流程决定执行。

对应 skill：

```plain
load_validation_rules.skill
```

输入：

+ 无输入

输出：

+ repo 相关检查规则， lint、typecheck、test、build等命令规范

  


**<font style="color:#ff6600;">Skill 生成效果参考：</font>**[**<font style="color:#ff6600;">https://git.garena.com/shopee/bg-logistics/tianlu/fe/wfm-ui/-/tree/temp/mm-repo-skill/</font>**](https://git.garena.com/shopee/bg-logistics/tianlu/fe/wfm-ui/-/tree/temp/mm-repo-skill/)

## 3. 总体架构
<img src="https://cdn.nlark.com/yuque/0/2026/png/311219/1783392301904-d34b5ade-e00b-4ebc-b406-7703f5dd1a2d.png" width="718.5" title="" crop="0,0,1,1" id="u184f89f6" class="ne-image">

总体架构分为 Repo Guide、Repo Fact、Repo workflow Skills、Consumer 四类协作对象：

```plain
Repo Guide
  = AGENTS.md   -> 索引 repo-profile.md
  -> 索引 Coding Rule Skills

Repo workflow Skills
  -> 读取 Repo Guide
  -> 按索引读取 repo-profile.md
  -> 扫描当前源码
  -> 输出 Run Context

CLI / Agent Consumer
  -> 编排 Repo workflow Skills
  -> 消费 Run Context
```

### 3.1 Repo Profile
Repo Profile 是仓库长期稳定事实，统一放在 `repo-profile.md` 文件中。

`repo-profile.md` 的原则：

+ 记录从代码里不一定能准确推断的信息。
+ 字段稳定，适合机器读取。
+ 由仓库维护者确认，允许 AI 生成更新提案。
+ 被多个 skill 复用。

### 3.2 `AGENTS.md`
`AGENTS.md` 是仓库的入口清单，采用 skill index 设计。

它负责声明：

+ `repo-profile.md` 路径或约定位置。
+ Rule Skills 有哪些分类，每一类解决什么问题。
+ Repo workflow Skills 的使用顺序建议。
+ 仓库规则的更新方式和维护边界。

推荐路径：

```plain
AGENTS.md
repo-profile.md
```

  


### 3.3 Repo workflow Skills
Repo workflow Skills 是独立于 `AGENTS.md` 的仓库运行时能力，负责按需读取 Repo Guide、扫描当前源码，并输出一次请求相关的 Run Context。它们提供可调用的仓库能力，本身不定义固定流程。

Repo workflow Skills 统一也由业务仓库 bootstrap 生成。

Repo workflow Skills 的原则：

+ 不把扫描结果长期写死到仓库。
+ 输出 JSON，便于 CLI / Agent 消费。
+ 每个 skill 负责一个清晰流程阶段。
+ 输出需要包含 evidence、confidence、warnings、requires_confirmation。
+ 发现稳定规则缺口时输出 update suggestion。

### 3.4 CLI / Agent Consumer
调用方负责按开发流程编排这些 skill。

调用方可以是：

+ CLI 工具。
+ IDE plugin。
+ Agent。
+ 任务平台。

调用方不需要理解每个仓库的细节，只需要按场景调用 Repo workflow Skills；Repo workflow Skills 再读取 `AGENTS.md` 和 `repo-profile.md`，并按需调用 Rule Skills。

## 4. `repo-profile.md` 规范
`repo-profile.md` 用于存储仓库稳定事实，由 `AGENTS.md` 引导调用方读取。它把仓库概览、启动方式、业务边界、验证命令和长期规则放在同一个事实文件中，便于调用方一次读取。

### 4.1 范围与边界
| 内容类型 | 典型字段 | 说明 |
| --- | --- | --- |
| 仓库身份 | `profile` | repo name、repo type、owner |
| 业务归属 | `business_scope` | 当前仓库确认服务的 portal、app、market、业务入口、别名 |
| 本地运行 | `workflow` | package manager、Node 版本、dev server、端口、env、proxy、auth |
| 验证命令 | `commands` | install、dev、lint、typecheck、test、build 等命令定义 |
| 修改边界 | `boundary` | allowed roots、requires confirmation、denied roots |
| 应用依赖 | `dependency_topology` | workspace packages、应用间依赖、主/子应用关系 |


### 4.2 总体结构
|    <br/>    |
| --- |
| ```plain # Repo Profile  ## Profile - Repo name: wfm-ui - Repo type: frontend-monorepo - Owners:   - WFM UI FE - meimei.xu@shopee.com   - WFM UI QA - shilin.li@shopee.com - Last verified at: 2026-05-26  ## Business Scope ### Service Portals - WFM Admin   - Apps: wfm-admin   - Owner team: WFM UI FE   - Source: repo.config.json + code inferred   - Confidence: medium  - WFM Workforce React   - Apps: wfm-workforce   - Owner team: WFM UI FE   - Source: repo.config.json + code inferred   - Confidence: medium  ### Business Entries - WFM Workforce   - Aliases: WFM, WH WFM, Workforce   - Apps: wfm-workforce   - Repo scope:     - apps/wfm-workforce/src/pages     - apps/wfm-workforce/src/common     - packages/business/src   - Source: code inferred   - Confidence: medium  ## Workflow - Package manager: pnpm - Node version: 18.x - Dev servers:   - wfm-workforce: pnpm --filter @wfm-ui/wfm-workforce dev  ## Commands - Lint   - Command: pnpm lint   - CWD: .   - Timeout: 600000  - Typecheck   - Command: pnpm typecheck   - CWD: .   - Timeout: 600000  ## Boundary - Allowed roots:   - apps/wfm-workforce/src   - packages/business/src - Denied roots:   - scripts/release  ## Dependency Topology - Shared packages:   - packages/business   - packages/components   - packages/utils ```  |


### 4.3 `AGENTS.md` 与 `repo-profile.md` 的分工
推荐分工如下：

+ `AGENTS.md`：说明读取顺序、使用规范、Rule Skills 入口、更新约定。
+ `repo-profile.md`：记录仓库稳定事实和边界信息。

推荐读取顺序如下：

1. 先读 `AGENTS.md`，理解仓库如何组织 Repo Guide。
2. 再读 `repo-profile.md`，获取稳定事实。
3. 进入 workflow skills 和 rule skills。

## 5. `AGENTS.md` 规范
`AGENTS.md` 不是事实明细文档，而是 Repo Guide 的统一入口与使用说明。

建议包含以下内容：

+ Repo Guide 的目标和适用范围。
+ `repo-profile.md` 的位置和用途。
+ Rule Skills 分类清单。
+ Repo workflow Skills 建议调用顺序。
+ 仓库维护和更新机制说明。

### 5.1 总体结构
|    <br/>    |
| --- |
| ```plain # Agent Guide  ## Purpose This repository provides a repo guide for agentic development.  ## Read Order 1. Read `repo-profile.md` for stable repository facts. 2. Use workflow skills to scan current code state. 3. Use rule skills for coding guidance.  ## Rule Skills - menu - route - api - error_code - i18n - store - enum - hooks - permission - time - file_operation - pii - shared_module  ## Workflow Skills - map_project_structure.skill - locate_change_targets.skill - load_rule_skills.skill - analyze_diff_impact.skill - load_validation_rules.skill  ## Maintenance - Update `repo-profile.md` when stable facts change. - Update rule skills when coding conventions change. - Do not write transient runtime analysis back into repo profile. ```  |


### 5.2 已存在 AGENTS.md 的兼容策略
`AGENTS.md`是仓库可能已经存在的 agent 入口文件，Repo Guide bootstrap 不拥有整个文件，只拥有 Repo Guide 管理区块。

初始化时必须遵守非破坏式增量写入原则：

1. 如果仓库不存在 `AGENTS.md`，bootstrap 可以生成完整`AGENTS.md`模板。  
2. 如果仓库已存在`AGENTS.md`，bootstrap 不得覆盖、删除、重排已有内容。  
3. bootstrap 只允许新增或更新由 marker 标识的 Repo Guide 区块。  
4. 如果 marker 已存在，只替换 marker 内部内容。  
5. 如果 marker 不存在，在文件末尾追加 Repo Guide 区块。  
6. 如果已有内容中疑似存在手写 Repo Guide 说明但没有 marker，不自动改写旧内容，只追加带 marker 的新区块，并在 bootstrap result  
中输出 warning。  
7. `AGENTS.md`不应写入项目结构扫描结果、change targets、diff impact、validation result 等运行时结果。

| ```plain <!-- repo-guide:start -->   ## Repo Guide    This repository uses Repo Guide for agent-facing repository rules.    - Stable repo facts: `repo-profile.md`   - Workflow skills:     - `map_project_structure`     - `locate_change_targets`     - `load_rule_skills`     - `analyze_diff_impact`     - `load_validation_rules`   - Coding rule skills:     - `repo-guide-menu-rule`     - `repo-guide-route-rule`     - `repo-guide-api-rule`     - `repo-guide-error-code-rule`     - `repo-guide-i18n-rule`     - `repo-guide-store-rule`     - `repo-guide-enum-rule`     - `repo-guide-hooks-rule`     - `repo-guide-permission-rule`     - `repo-guide-time-rule`     - `repo-guide-file-operation-rule`     - `repo-guide-pii-rule`     - `repo-guide-shared-module-rule`   <!-- repo-guide:end --> ```  |
| --- |


### 5.3 Coding Skill 示例：i18n
`AGENTS.md` 只声明 i18n 规则 skill 的入口，不直接写入完整 i18n 规范。具体规则由 `repo-guide-i18n-rule` 在运行时读取 `repo-profile.md`、当前模块代码和仓库示例后输出。`  
`

对应的 `skills/repo-guide-i18n-rule/SKILL.md` 可以按以下方式描述：

|    <br/>    |
| --- |
| ```plain --- name: repo-guide-i18n-rule description: 查找并总结当前仓库 i18n 规则，包括翻译函数、locale 文件、key 命名、禁止硬编码文案和历史 bug lesson。 ---  # repo-guide-i18n-rule  ## Inputs  - request: 本次需求描述、PRD、Jira 或用户问题 - target_paths: 本次候选 app / page / module root path - changed_files: 已修改文件，可为空 - repo_guide: AGENTS.md 路径 - repo_fact: repo-profile.md 路径  ## Read Order  1. 读取 AGENTS.md，确认当前 skill 由 rule_skills.i18n 入口触发。 2. 读取 repo-profile.md 的 known_rules 和 bug_lessons，提取长期 i18n 规则。 3. 在 target_paths 内查找现有文案渲染、翻译函数和 locale resource，例如 $gt、$i18n、APP_CONTEXT.i18n、react-i18next。 4. 按 target app 判断当前应该沿用哪一套 i18n 机制，不跨 app 套用其他示例。 5. 查找仓库级 i18n wrapper、resource id、project、locale 映射、UI 组件 locale provider、翻译上传配置和禁止用法。 6. 只输出本次改动需要遵守的规则，并附 evidence_files。  ## Reference Scenarios  | 场景类型 | 识别方式 | Rule Skill 需要输出的判断 | | --- | --- | --- | | App entry 初始化型 | 应用入口先调用 loadResource / initI18n，再 render 页面 | 页面代码只使用已有翻译函数，不在页面内重复初始化 i18n | | 宿主注入型 | 通过 APP_CONTEXT.gt / APP_CONTEXT.i18n / app context 获取翻译能力 | 需要沿用宿主注入的函数，确认是否支持参数格式化 | | Vue prototype 注入型 | Vue.prototype 上挂载 $gt / $i18n / $translate | Vue 页面优先使用实例方法或仓库暴露的 alias，不新增独立翻译实例 | | Common i18n SDK 型 | 使用 @ssc-fe-common/i18n、react-i18next 或类似 SDK | 需要识别 resource id、project、lang cookie、在线/离线资源加载方式 | | UI locale provider 型 | 组件库 ConfigProvider / locale provider 单独注入 UI locale | 业务文案翻译和组件库 locale 是两条链路，需要分别检查 | | Transify wrapper 型 | 使用 generateTransifyCommon、showKey、customTrans 等封装 | 需要保留仓库现有的 key 生成、占位符和调试模式规则 |  ## Writing Examples  这些例子用于说明 skill 应该识别“写法差异”，不是要求所有仓库照抄同一套写法。Bootstrap 生成具体仓库的 Rule Skill 时，应从当前仓库源码中找到对应的规范写法和参考文件，再写入该仓库的 skill。  | 写法场景 | 参考写法 | 说明 | | --- | --- | --- | | 简单文案 | `$gt('Leave Date')` | 常见于 React 页面或 Vue 逻辑中，用户可见文案通过仓库翻译函数渲染 | | 宿主注入 + `%s` | `smartGt(key, ...args)`：key 包含 `%s` 时优先调用 `hostI18n(key, ...args)`，否则调用 `hostGt(key)` | 需要先判断 key 是否包含 `%s`；带参数文案不能直接走普通 gt | | Vue prototype 参数写法 | `this.$i18n('Are you sure to delete %s?', [name])` 或 `$i18n('Input')` | i18n 挂在 Vue prototype 上，支持 `%s` 参数格式化 | | SDK 页面消费写法 | `import { $gt } from '@/core/i18n'; $gt('Leave Date')` | i18n 资源由应用入口或 SDK 初始化，页面只消费 `$gt` | | App context 写法 | `$gt` 来自 app context，例如 `getAppCtx().gt` | 复用宿主注入能力，不在页面内自行初始化 | | 自定义占位符写法 | `$gt('Line 1{$newline}Line 2')` 经 customTrans 转换 newline | 自定义占位符不是通用 `%s`，需要保留模块封装规则 |  ## Decision Rules  - 以 target app 的现有 wrapper 为准；同一仓库内不同 app / module 的 i18n 链路也可能不同。 - 如果目标 app 现有写法是 $gt('English Text')，不要假设必须新增 locale/en.ts。 - 如果文案包含 %s、数组参数、自定义占位符或换行占位符，必须查找当前 app 是否有 $i18n、APP_CONTEXT.i18n、smartGt、generateTransifyCommon 或 customTrans 之类的格式化封装。 - UI 组件 locale 和业务文案翻译分开判断，例如 workforce-mobile 同时有 loadResource 和 ConfigProvider locale。 - 如果 target_paths 下同时存在多套 i18n wrapper，输出 requires_confirmation，不直接选择其中一个。  ## Output  输出 repo-guide.rule-skill-output/v1 JSON，必须包含 summary、recommended_patterns、avoid_patterns、evidence_files、requires_confirmation 和 update_suggestions。 ```  |


## 6. Skill 设计
### 6.1 `repo-guide-bootstrap.skill`
作用：为一个业务仓库首次生成 Repo Guide 相关产物，或在仓库结构变化后生成刷新提案。

`repo-guide-bootstrap.skill` 是接入生成 skill。它需要一次性生成 `AGENTS.md`中所有可被消费的入口.

默认持久产物：

|    <br/>    |
| --- |
| ```plain AGENTS.md repo-profile.md skills/   repo-context-menu-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-route-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-api-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-error-code-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-i18n-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-store-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-enum-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-hooks-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-permission-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-time-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-file-operation-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-pii-rule/     SKILL.md     SKILL.zh-CN.md   repo-context-shared-module-rule/     SKILL.md     SKILL.zh-CN.md ```  |


产物边界：

| 类型 | 内容 | 是否长期提交到仓库 |
| --- | --- | --- |
| 持久配置 | `AGENTS.md`<br/>、`repo-profile.md`<br/>、Rule Skills | 是 |
| 运行结果 | bootstrap result、Run Context、diff impact、validation plan | 否，默认只作为调用结果返回 |
| 调试记录 | 调用方临时保存的 report 或 run log | 否，由调用方自行决定保存位置 |


`skills/` 是默认示例目录，实际目录可以按不同 skill workflow 或 plugin 规范调整。协议要求是：`AGENTS.md.coding.*.entry.name` 必须匹配对应 `SKILL.md` frontmatter 中的 `name`，并且调用方能够通过自己的 skill workflow 发现这些 skill。

`repo-guide-bootstrap.skill` 会返回 bootstrap result，用于展示生成项、待确认项、warnings 和 validation 结果。该结果默认不写入仓库；如调用方需要审计或调试，可以自行临时保存。

生成内容边界：

| 内容 | 生成方式 | 说明 |
| --- | --- | --- |
| `Agenct.md` | 自动生成 | 写入 `profile.path` 和完整 coding skills entry map |
| `repo-profile.md` | 自动生成 + hint 补充 | repo name、package manager 可扫描；owner 建议由 hint 或人工确认 |
| `repo-profile.md.business_scope` | hint + 人工确认 | 业务归属和仓库负责范围难以仅靠源码可靠判断 |
| `repo-profile.md.workflow` | 自动生成 + 人工确认 | 从 package.json、lockfile、dev scripts、端口配置推断 |
| `repo-profile.md.commands` | 自动生成 + 人工确认 | 从 package.json scripts 生成 install/lint/typecheck/test/build 初稿 |
| `repo-profile.md.boundary` | 自动初稿 + 人工确认 | 根据 apps、packages、generated/build 目录生成 allowed / denied / confirmation 初稿 |
| `repo-profile.md.known_rules` | 模板 + 人工维护 | 首次生成只放占位或已有高置信规则 |
| Coding Rule Skills | 自动生成 | 根据 `required_rule_skills`<br/> 生成所有被 `AGENTS.md.coding`<br/> 指向的 `SKILL.md` |


Rule Skill 生成要求：

1. 每个 `coding.skill` entry 必须有对应的 `SKILL.md`。
2. `SKILL.md` frontmatter 中的 `name` 必须等于 `AGENTS.md.coding.*.entry.name`。
3. 每个 Rule Skill 需要说明输入、输出、查找顺序和证据要求。
4. 每个 Rule Skill 需要读取 `AGENTS.md` / `repo-profile.md`，再结合当前模块代码查找仓库规范。
5. 首次生成的 Rule Skill 可以是通用模板，但必须能按分类工作，例如 route skill 只负责 route/page entry，api skill 只负责 request/API 规范。

自检规则:

+ 所有生成 skill 的 frontmatter `name` 必须和 `entry.name` 一致。
+ 所有生成 Rule Skill 必须同时存在 `SKILL.md` 和 `SKILL.zh-CN.md`。
+ `entry.path` 必须指向 `SKILL.md`，`entry.localized_paths.zh_CN` 必须指向 `SKILL.zh-CN.md`。
+ 自动推断置信度不足的字段必须进入 `requires_confirmation`，不能写成已确认事实。
+ `repo-profile.md` 不应包含 project structure map、change targets、changed files、diff impact、validation result 等工作流结果。
+ `repo-profile.md`只描述当前仓库确认负责的范围，不生成其他团队业务入口全集。

### 6.2 `map_project_structure.skill`
作用：扫描当前仓库，输出项目结构地图。

输入：

| ```plain # Request Please map the current project structure for this repository.  Focus on: - apps - route roots - page roots - shared packages - common file roles ```  |
| --- |


```plain
输出：
```

|    <br/>    |
| --- |
| ```plain # Project Structure Map  ## Summary - Repository type: frontend monorepo - Detected apps: wfm-admin, wfm-workforce, wms-workforce  ## App Structure ### wfm-workforce - Route roots:   - apps/wfm-workforce/src/router - Page roots:   - apps/wfm-workforce/src/pages - Module roots:   - apps/wfm-workforce/src/moduleEntries  ## Shared Packages - packages/business - packages/components - packages/utils  ## Common File Roles - entry: index.tsx - api: api.ts - store: store.ts - hooks: hooks/**  ## Evidence - apps/wfm-workforce/src - packages/business/src  ## Confidence - high  ## Warnings - No major warnings ```  |


### 6.3 `locate_change_targets.skill`
作用：根据需求和项目结构地图，输出候选改动范围。

输入：

| ```plain # Request Need to update roster page export behavior.  ## Source - Jira - User request  ## Project Structure Reference - Use the previously generated project structure map. ```  |
| --- |


输出：

|    <br/>    |
| --- |
| ```plain # Change Target Candidates  ## Business Entry Match - Name: Workforce Management > Roster - Match status: matched repo fact - Confidence: high  ## Candidate Targets - App: wfm-workforce   - Portal: WFM Portal   - Page: Roster   - Module root: apps/wfm-workforce/src/pages/roster   - Suggested file roles:     - entry     - api     - route     - store     - hooks     - i18n     - tests   - Seed files:     - apps/wfm-workforce/src/pages/roster/index.tsx     - apps/wfm-workforce/src/pages/roster/api.ts  ## Requires Confirmation - None ```  |


### 6.4 `load_rule_skills.skill`
`load_rule_skills.skill` 只区分是否有可用于匹配的输入上下文：

| 输入状态 | 判断方式 | 输出 |
| --- | --- | --- |
| 无输入上下文 | 没有 `rule_target`、`change_targets`、`changed_files`、diff 摘要，也没有 `rule_categories` | 返回全量规则概览 |
| 有输入上下文 | 任一目标上下文或 `rule_categories` 存在 | 基于输入上下文做轻量匹配，并输出本次编码应遵守的规则结果 |


补充说明：

+ 无输入上下文时返回全部 Rule Skills 列表，不代表这些规则都与当前需求强相关；只是提供完整规则入口，避免调用方无从选择。
+ `rule_categories` 是高置信快捷入口；调用方已经明确知道分类时可以直接传入。
+ `rule_target` 是通用目标入口；调用方不知道具体分类时，传入路径、文件角色或计划行为即可。
+ `change_targets`、`changed_files`、diff 摘要是更可靠的工作流上下文，优先级通常高于原始需求文本。

#### 6.4.2 rule_target
| ```plain # Rule Target  ## Paths - packages/business/src/event/**  ## File Roles - api - hooks  ## Change Intents - add_export - change_text  ## Apps - wfm-workforce  ## Modules - event ```  |
| --- |


参考匹配策略：

+ `paths` 命中 `packages/**`：补充 `shared_module`。
+ `file_roles` 命中 api、route、store、hooks、i18n、permission：映射同名 Rule Skill。
+ `change_intents=change_text`：补充 `i18n`。
+ `change_intents=add_export` / `upload` / `download`：补充 `api` 和 `file_operation`。
+ `change_intents=touch_sensitive_field`：补充 `pii` 和 `permission`。
+ `change_intents=change_time_display`：补充 `time`。
+ 同一输入命中多个 app 或多个 shared package consumer：补充 `requires_confirmation`。

#### 6.4.3 输入输出示例
|    <br/>    |
| --- |
| ```plain # Request Update roster page export behavior and adjust related text.  ## Change Targets - App: wfm-workforce   - Root path: apps/wfm-workforce/src/pages/roster   - File roles:     - api     - i18n     - store  ## Changed Files - apps/wfm-workforce/src/pages/roster/api.ts - apps/wfm-workforce/src/pages/roster/index.tsx  ## Change Type - modify existing page  ## Rule Target ### Change Intents - change_text - update_page_data ```  |


  


|    <br/>    |
| --- |
| ```plain # Coding Guidance  ## Match Status - resolved  ## Selected Rule Coverage - API   - Reason: The change target includes API request files. - i18n   - Reason: The change target includes page text changes and i18n file roles. - Store   - Reason: The change target includes store file roles.  ## Implementation Guidance ### API - Use the repository request wrapper instead of creating a new raw request client. - Reuse the existing module `api.ts` pattern in:   - apps/wfm-workforce/src/pages/roster/api.ts  ### i18n - New display text must go through the existing translation wrapper. - Do not hardcode display text directly in page components.  ### Store - Keep page-local state inside the existing store boundary. - Do not move page state into shared store without clear cross-page reuse evidence.  ## Evidence - apps/wfm-workforce/src/pages/roster/api.ts - apps/wfm-workforce/src/pages/roster/index.tsx  ## Confidence - high  ## Requires Confirmation - None  ## Update Suggestions - None ```  |


  


### 6.5 `analyze_diff_impact.skill`
作用：根据实际改动文件和结构地图，推导影响范围。

输入：

| ```plain # Request Analyze impact for the current roster page changes.  ## Changed Files - apps/wfm-workforce/src/pages/roster/index.tsx - apps/wfm-workforce/src/pages/roster/api.ts ```  |
| --- |


输出：

|    <br/>    |
| --- |
| ```plain # Diff Impact Summary  ## Impacted Apps - wfm-workforce  ## Impacted Portals - WFM Portal  ## Impacted Pages - Roster  ## Impacted Modules - apps/wfm-workforce/src/pages/roster  ## Shared Impact - None  ## Risk Items - None  ## Recommended Validation Checks - lint - typecheck ```  |


### 6.6 `load_validation_rules.skill`
作用：读取仓库稳定的 check 命令定义，输出可供调用方选择和执行的准出检查命令清单。

这个 skill 只负责提供命令规则和执行约束，不负责根据本次改动选择命令，也不负责执行命令。调用方可以结合 change targets、diff impact、实际改动文件或自身 workflow 决定最终执行哪些 check。

输入：无输入

输出：

|    <br/>    |
| --- |
| ```plain # Validation Rules  ## Commands ### Lint - Command: pnpm lint - CWD: . - Timeout: 600000 - Scope: repo - Target selector: changed files under apps/**/src/** or packages/**/src/** - Requires network: false - Writes outside repo: false - Allow existing noise: true  ### Typecheck - Command: pnpm typecheck - CWD: . - Timeout: 600000 - Scope: app - Target app: wfm-workforce - Requires network: false - Writes outside repo: false - Allow existing noise: true  ## Warnings - None ```  |


## 7. Coding rule Skill 分类
Coding Skills 是编码阶段最核心的仓库规范能力。每一类规范可以独立维护、独立更新，也可以由 `load_rule_skills.skill` 统一编排。

`AGENTS.md` 中维护这些 skill 的路由索引。skill 可发现性由外部 plugin / skill workflow 提供，例如 Codex plugin 通过 `plugin.json.skills` 扫描 `skills/*/SKILL.md`，并以 `SKILL.md` frontmatter 中的 `name` 作为稳定 skill 名称。入口名称需要和已注册名称保持一致。

| Repo Guide key | Skill entry name | 规范范围 | 主要查找来源 | 典型输出 |
| --- | --- | --- | --- | --- |
| `menu` | `repo-guide-menu-rule` | 菜单、导航、入口注册、侧边栏或 portal entry 配置 | menu config、navigation config、portal entry 文件 | 菜单注册方式、入口命名规则、可参考文件 |
| `route` | `repo-guide-route-rule` | route 新增、route 修改、路由参数、页面入口挂载 | route files、router config、page entry、module route 定义 | route 配置方式、路径规则、入口文件、禁止改动边界 |
| `api` | `repo-guide-api-rule` | API client、domain、request wrapper、接口类型定义 | module api.ts、request wrapper、service files、接口类型文件 | API 调用方式、封装要求、接口类型规则、示例文件 |
| `error_code` | `repo-guide-error-code-rule` | 错误码新增、插入位置、错误提示映射、接口兼容处理 | error code config、错误码映射文件、API response handler、历史错误码用法 | 错误码文件位置、命名和插入规则、错误提示映射方式、兼容确认项 |
| `i18n` | `repo-guide-i18n-rule` | 文案 key、翻译函数、locale 资源维护、硬编码文案约束 | locale files、i18n wrapper、现有页面文案用法 | i18n key 规则、翻译函数使用方式、资源文件位置、避免模式 |
| `store` | `repo-guide-store-rule` | 状态管理、store 命名、模块状态复用、跨页面状态边界 | store files、model files、zustand/vuex/pinia 等仓库实际用法 | store 放置位置、命名规则、读写模式、复用边界 |
| `enum` | `repo-guide-enum-rule` | 全局枚举获取、枚举映射、业务状态展示、下拉选项来源 | enum config、global enum helper、常量文件、状态展示组件、历史业务页面 | 枚举获取方式、映射规则、状态展示方式、禁止硬编码场景 |
| `hooks` | `repo-guide-hooks-rule` | hooks 组织方式、请求 hooks、业务 hooks、复用和副作用边界 | hooks directory、existing hooks、component usage | hooks 拆分规则、依赖管理、请求封装复用、示例文件 |
| `permission` | `repo-guide-permission-rule` | 权限点、feature flag、按钮权限、页面访问控制 | permission helper、feature config、auth guard、button permission usage | 权限接入方式、权限 key 来源、校验位置、风险提示 |
| `time` | `repo-guide-time-rule` | 时间展示、时区、UTC 秒/毫秒转换、跨天时间、日期选择器默认值 | time utils、date utils、dayjs wrapper、timezone helper、业务页面时间展示 | 时间转换规则、展示格式、传参格式、时区来源、禁止直接格式化场景 |
| `file_operation` | `repo-guide-file-operation-rule` | 上传、下载、导入、导出、模板下载、blob/base64 文件处理、批量导入结果展示 | upload/download utils、batch import hooks、api 文件、模板接口、导入结果弹窗 | 文件接口调用方式、FormData 字段、responseType、文件名解析、结果弹窗规则 |
| `pii` | `repo-guide-pii-rule` | 敏感信息展示、脱敏、解密查看、手机号/姓名/邮箱/证件号等隐私边界 | data masking component、PII API、permission、现有敏感字段展示 | 脱敏组件使用方式、可展示字段、解密权限、禁止直接展示规则 |
| `shared_module` | `repo-guide-shared-module-rule` | shared 代码读取、复用、修改边界、跨 app 影响评估 | packages/shared、shared components、utils、import graph | shared 使用规则、可改边界、影响范围、确认项 |
| `internal_logic.<topic>` | `repo-guide-internal-logic-<topic>-rule` | 可选扩展规则，例如金额、portal context、业务状态计算 | `repo-profile.md.known_rules`<br/>、`repo-profile.md.bug_lessons`<br/>、utils、历史修复文件 | 特殊规则摘要、推荐封装、禁止用法、历史问题说明 |


### 7.1 单个 coding Skill 输出结构
|    <br/>    |
| --- |
| ```plain # Rule Result  ## Category - i18n  ## Summary - Use repo i18n wrapper and existing locale key pattern.  ## Applicability - Apps:   - wfm-workforce - Paths:   - apps/wfm-workforce/src/**  ## Evidence Files - apps/wfm-workforce/src/locale - apps/wfm-workforce/src/pages/roster/index.tsx  ## Recommended Patterns - Use existing translation wrapper.  ## Avoid Patterns - Avoid hardcoded display text in page components.  ## Requires Confirmation - None  ## Update Suggestions - None ```  |


### 7.2 Internal Logic Rules
`internal_logic` 用于承载仓库特有、容易踩坑的规则。

V1 不默认生成 `internal_logic.*` wildcard 规则。需要使用时必须声明具体 key，例如 `internal_logic.money_format`、`internal_logic.portal_context`、`internal_logic.tenant_market_logic`，并在 `AGENTS.md.coding`、bootstrap hints 和生成的 Rule Skill 中保持一致。

示例分类：

+ `money_format`
+ `portal_context`
+ `tenant_market_logic`

这部分优先从 `repo-profile.md` 中的 `known_rules` 和 `bug_lessons` 读取，再结合当前源码找示例。

## 8. Skill 输出原则
Bootstrap Skill、Repo workflow Skills 和 Rule Skills 默认输出 Markdown，便于 CLI、IDE 插件、Agent 或任务平台消费，也便于直接给人阅读。当前阶段只定义最小消费语义，不固化完整 JSON Schema。

通用输出契约不强制所有 skill 使用统一字段对象，但建议统一以下信息块，便于调用方处理置信度、阻塞、确认和沉淀建议：

+ `Evidence`
+ `Confidence`
+ `Warnings`
+ `Stop Reasons`
+ `Required Skills`
+ `Requires Confirmation`
+ `Update Suggestions`

字段含义先按以下原则理解：

+ `Evidence`：支撑结果的源码、`AGENTS.md`、`repo-profile.md` 或其他证据位置。
+ `Confidence`：结果置信度，帮助调用方判断是否需要二次确认。
+ `Warnings`：非阻塞提醒，可以继续执行。
+ `Stop Reasons`：硬阻塞；非空时调用方需要停止自动修改，并把原因展示给用户或上层任务系统。
+ `Required Skills`：当前结果建议继续调用的 skill 列表。
+ `Requires Confirmation`：继续前确认；表示可以继续，但需要用户或 owner 先确认某个边界、路径或规则冲突。
+ `Update Suggestions`：沉淀建议；用于把运行时发现的稳定信息转成第 9 章更新机制的输入，不代表自动写入。

确认相关命名约定：

+ `Match Status: needs confirmation` 是状态表达，表示匹配结果无法直接确认，例如业务入口命中多个候选或未命中已确认范围。
+ `Requires Confirmation` 是输出块，列出需要用户或 owner 确认的问题。

## 9. 更新机制
<img src="https://cdn.nlark.com/yuque/0/2026/png/311219/1783392465662-6580e5ed-e60c-4552-9887-2a1457806caf.png" width="734.5" title="" crop="0,0,1,1" id="u1606127d" class="ne-image">

更新机制分两层：

+ 增量知识沉淀：一次需求执行过程中发现可复用知识时，输出更新建议或者给予权限直接更新。
+ 按对象更新：`AGENTS.md` 维护入口索引，`repo-profile.md` 维护稳定事实，Rule Skills 维护可执行规范，确认后写入具体文件

### 9.1 增量知识沉淀
一次需求执行中可能发现新的可复用知识，例如：

+ 新规则：实现过程中发现某类写法必须遵守新的封装或禁用旧用法。
+ 命令变化：实际验证时发现 lint、typecheck、test、build 命令需要调整。
+ 边界变化：发现业务入口归属、可改范围、shared package 影响范围、主/子应用关系和事实文件不一致。
+ Bug lesson：修复问题后确认某类错误可复用为后续规避规则。

原则：

+ AI 负责发现可复用知识、归类目标对象、生成 patch、补 evidence、执行结构校验。
+ 人负责确认业务归属、owner 变化、跨团队边界、破坏性协议变更等高风险事项。
+ 低风险更新可以由 AI 自动生成并进入候选写入流程；写入前必须通过格式校验和引用校验。
+ 未通过校验、证据不足或命中高风险边界的更新不能自动写入，只能进入待确认队列。

风险分层：

| 风险等级 | 典型内容 | AI 动作 | 人的介入 |
| --- | --- | --- | --- |
| low | typo、示例补充、已存在命令字段补全、低风险 bug lesson 追加 | 生成 patch 并自动校验，可进入自动应用候选 | 抽查 |
| medium | 新增 known rule、调整 validation command、补充 shared package 消费说明 | 生成 patch 和 evidence，默认进入 review 队列 | 轻量确认 |
| high | owner / business scope 变化、跨仓边界、Rule Skill 拆分、协议升级 | 只生成 proposal，不自动写入 | owner 确认 |


建议流程：

1. Skill 在需求执行过程中发现可复用知识。
2. Skill 输出 `update_suggestions`，附 evidence、风险级别、建议目标、`suggested_patch` 和校验要求。
3. 调用方按风险等级处理：
    - low：AI 生成 patch 后执行 JSON / path / frontmatter 校验，通过后可自动写入或批量抽查。
    - medium：AI 生成 patch 并展示 diff，调用方或维护者确认后写入。
    - high：AI 只生成 proposal，必须由 owner 确认。
1. 写入目标按对象分发：
    - 稳定事实、命令、边界、依赖拓扑、bug lesson -> `repo-profile.md`
    - 新增或拆分 Rule Skill 入口 -> `AGENTS.md`
    - 复杂规范、写法示例、反例、查询顺序 -> 对应 Rule Skill
1. 写入后重新执行自检，失败则回滚本次 patch 并保留为待确认 proposal。
2. 未确认的建议只作为本次 Run Context，不进入长期文件。

### 9.2 更新对象与写入边界
| 更新对象 | 写入内容 | 典型触发场景 | 默认处理 |
| --- | --- | --- | --- |
| `repo-profile.md` | 稳定事实、命令、边界、依赖拓扑、bug lesson | app / portal 接入、命令变化、业务边界变化、shared package 关系变化、已确认 bug lesson | low 自动候选，medium 抽查，high owner 确认 |
| `AGENTS.md` | Rule Skill 入口、协议版本 | 新增或拆分 Rule Skill、入口路径变化、协议升级 | 默认 medium / high |
| Rule Skill | 复杂规范、写法示例、反例、查找顺序 | 新规范、代码评审高频问题、bug 修复后沉淀 lesson、新封装替换旧用法 | low / medium 为主；跨团队规则进入 high |
| Project Structure | 不长期写完整结构，只沉淀稳定模式变化 | route root、module pattern、shared package pattern 多次变化 | 输出 `update_suggestions`，目标通常是 `repo-profile.md` 或 Rule Skill |
| Commands | 写入 `repo-profile.md` 的 Commands 章节 | lint、typecheck、test、build、cwd、timeout、target selector 或失败噪声策略变化 | low / medium 为主；会写外部目录或依赖网络的命令进入 high |


### 9.3 写入校验与回滚
AI 生成 patch 后，写入前必须完成最小校验：

+ Markdown 文件可解析，标题结构完整。
+ `AGENTS.md` 中声明的 `repo-profile.md` 存在。
+ `AGENTS.md` 中引用的 skill 文件存在。
+ `SKILL.md` frontmatter `name` 与 `AGENTS.md` 中登记的 skill 名称一致。
+ `repo-profile.md` 中的 command 引用能 resolve。
+ patch 不写入 Run Context、project structure map、change targets、diff impact 或 validation result。

校验失败时不写入长期文件；已写入的 patch 需要回滚，并保留为待确认 proposal。

## 10. 版本范围与最终形态
### 10.1 V1 / V2 范围
V1 目标：跑通 Repo Guide 机制，做到能生成、能读取、能定位范围、能加载规范、能分析基础影响范围、能选择基础准出检查。

V1 内容：

+ `repo-guide-bootstrap.skill`
+ `AGENTS.md`
+ `repo-profile.md`
+ bootstrap 生成 `AGENTS.md.coding` 指向的全部 Rule Skills
+ bootstrap result 作为调用结果返回，默认不写入仓库
+ `map_project_structure.skill`
+ `locate_change_targets.skill`
+ `load_rule_skills.skill` selector mode
+ 轻量版 `analyze_diff_impact.skill`
+ `load_validation_rules.skill`
+ Skill 输出最小消费语义

V2 目标：提升自动化深度、更新闭环和跨仓协作能力。

V2 内容：

+ 自动或半自动写入 `repo-profile.ms`、`AGENTS.md` 和 Rule Skills
+ 基于 `update_suggestions` 生成可 review 的 patch proposal
+ 增强 `analyze_diff_impact.skill` 精度，例如 import graph、跨包影响、路由反查和测试推荐
+ 增强业务入口归属判断

### 10.2 最终形态
最终希望形成以下工作方式：

```plain
repo-guide-bootstrap.skill 生成 AGENTS.md / repo-profile.md / Rule Skills
  -> 业务仓库维护 AGENTS.md 和 repo-profile.md
  -> 调用方读取 AGENTS.md   -> 按需求开发流程调用 Repo workflow Skills
  -> skill 按需读取 repo-profile.md 和当前源码
  -> 输出一次需求的 Run Context JSON
  -> 调用方继续编码、影响分析和验证
```

把长期事实、动态推导和仓库规范拆开：

+ `repo-profile.md` 负责稳定事实。
+ `AGENTS.md` 负责入口索引。
+ Repo workflow Skills 负责按需推导。
+ Rule Skills 负责仓库规范。
+ CLI / Agent Consumer 负责流程编排。

## 11. 仓库接入
bootstrap skill：

直接对话：使用 repo-guide-full-bootstrap 完整初始化当前仓库

  


  


  

