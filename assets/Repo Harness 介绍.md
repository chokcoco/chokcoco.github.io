# Repo Harness 介绍

## 一、项目结构
### 1.1 什么是 Repo Harness
Repo Harness 是放在业务仓库里的 `.harness/repo/` 目录，充当仓库的"知识服务层"——它知道这个仓库有哪些 app、模块、路由、API、校验命令、编码规范。spxdev 和 AI 通过它来了解仓库，而不是直接翻代码。

它不是 README，不是一次性全仓总结，而是**面向 AI 协作的 facts 索引、导航、约束和验证系统**。

### 1.2 在体系中的位置
| ```plain ┌──────────────────────┐  │    Flow Harness       │  ← spxdev CLI：管状态、管阶段、管门禁  │   "什么时候做什么"      │  └──────────┬───────────┘             │ repo-harness/v1 协议 (stdin/stdout JSON)  ┌──────────▼───────────┐  │     Repo Harness      │  ← .harness/repo/：管仓库知识、管上下文、管校验  │   "这个仓库长什么样"    │     每个业务仓库独立维护  └──────────┬───────────┘             │ 按需查询  ┌──────────▼───────────┐  │      AI Agent         │  ← 读上下文、写代码、产出阶段产物  │   "具体怎么改"         │  └──────────────────────┘ ```  |
| --- |


**谁拥有什么**（核心设计原则）：

| 角色 | 拥有 | 说明 |
| --- | --- | --- |
| Flow Harness (spxdev) | **progress** | run.json、阶段顺序、门禁校验 |
| Repo Harness | **knowledge** | 仓库事实、上下文裁剪、playbook、校验命令 |
| AI Agent | **phase artifacts** | 执行当前阶段，产出各阶段文件 |


spxdev 不读 Repo Harness 内部文件，Repo Harness 不推进阶段状态，AI 不凭记忆跨阶段操作。三者只通过 `repo-harness/v1` 协议耦合。

### 1.3 总体架构
<img src="https://cdn.nlark.com/yuque/0/2026/png/311219/1783392781604-1283e704-b739-481c-90e2-23a4c76c02db.png" width="1085" title="" crop="0,0,1,1" id="u4ddba910" class="ne-image">

整个 `.harness/repo/` 只有三个目录，按"给谁用"来分：

| ```plain .harness/repo/ │ ├── capability-api/          ← 给 spxdev 调的唯一稳定接口 │   └── index.js             # stdin/stdout JSON，7 个 capability │ ├── agent-surface/           ← 给 Agent 读的入口 │   ├── AI_ENTRY.md          # Agent 最先读的文件 │   ├── context/             # 自动生成：仓库拓扑、模块上下文 │   ├── playbooks/           # 手动维护：编码 recipe │   ├── skills/              # 手动维护：AI 行为指令 │   ├── policies/            # 手动维护：编码策略 │   └── phase-contracts/     # 手动维护：新鲜度规则 │ └── internal-store/          ← repo 私有事实层     ├── facts/               # 自动生成：结构化事实（JSON）     ├── maps/                # 自动生成：人类可读地图     ├── validation/          # 手动维护：校验命令注册     ├── inventory/           # 手动维护：仓库清单     ├── reports/             # 自动生成：报告     └── schemas/             # 自动生成：格式定义 ```  |
| --- |


三层描述：

| 层 | 一句话描述 | 格式 | 谁读 |
| --- | --- | --- | --- |
| `capability-api/` | 给 spxdev 调的唯一稳定接口 | JS 可执行 | spxdev CLI |
| `agent-surface/` | 给 Agent 读的入口、phase contracts、policies、skills、playbooks、context | markdown | AI Agent（通过 Capability API） |
| `internal-store/` | repo 私有事实层：apps、packages、routes、modules、api、tests、validation commands | JSON + markdown | Capability API 程序，AI 不应直接读 |


---

## 二、设计思想
### 2.1 核心问题：存量修改不是从零生成
前端存量需求的核心难点不是"生成代码"，而是让 AI 在真实、长期演进的仓库中做到：

+ 知道应该看哪里
+ 知道应该怎么改
+ 知道不能改哪里
+ 知道如何验证改动没有越界
+ 在不确定或高风险时可靠停止

Repo Harness 是被设计来回答这五个问题的。

### 2.2 设计原则
**Facts Before Summary**：每个关键结论必须先有结构化事实（JSON），再有 markdown 摘要。Markdown 必须能反查到 facts 或人工规则来源。

**Route First**：前端需求通常从页面入口切入，优先建立 `app → route → page entry → module dir → dependencies → tests` 的索引链。

**Boundary Before Coding**：编码前必须明确 allowed files、blocked files、notice required files。没有边界不进入自动 coding。

**Freshness Is Trust**：每次使用前检查 `manifest.last_indexed_commit` 是否覆盖当前 HEAD，facts 是否仍可从源码验证。

**Reliable Stop**：当 facts 过期、影响面过大、或必须触碰公共基础设施时，输出停止原因和人工接手建议，不鼓励 Agent 继续猜。

### 2.3 为什么是三层
**如果只有两层（数据 + API）**：AI 直接读 JSON 事实数据，但原始 JSON 太多太碎（上百条路由、几十个模块），会撑爆上下文窗口。

**三层的关键是 agent-surface**：它本质是一个**预渲染的缓存层**——把 JSON 事实提前渲染成几十行的 markdown 片段。AI 不查数据库，只读视图。

三个关注点刚好够：协议（怎么通信）、消费（给谁看）、存储（怎么存）。

### 2.4 为什么需要这么多文件
**原因一：按需加载**。Capability API 支持四个维度的筛选——`files`（文件路径）、`query`（关键词）、`triggers`（触发词）、`phase`（阶段）。拆成独立文件才能精准查询，避免全量返回撑爆上下文窗口。

**原因二：自动更新和手动更新分开**。`context/` 是自动生成的，每次 `update` 会重写。`playbooks/`、`skills/`、`policies/` 是手动编写的经验，不能被覆盖。放在不同目录各自独立管理。

**原因三：不同读者不同格式**。`facts/*.json` 给程序做筛选匹配，`context/*.md` 给 AI 做上下文消费，`maps/*.md` 给人类做全量一览。同一份数据三种形态。

### 2.5 更新模式
**能从代码里推断的 → 自动提取**：路由声明、API 调用、模块目录、import 委托关系。这些东西是机械事实，代码里能直接扫描出来。

**需要人类判断和经验的 → 手动编写**：编码规范（"React remote 先检查是否委托给 shared package"）、风险边界（"packages/business 是高影响区"）、playbook 步骤。这些东西是架构约定和经验，代码里看不出来。

---

## 三、目录内容
### 3.1 目录结构与职责
| ```plain .harness/repo/ │ ├── manifest.json               ← 信任入口：记录 commit、extractors 状态、capability 列表 │ ├── capability-api/              ← 给 spxdev 调的唯一稳定接口 │   └── index.js                 # 实现 7 个 capability，stdin/stdout JSON │ ├── agent-surface/               ← 给 Agent 读 │   ├── AI_ENTRY.md              # Agent 最先读：仓库概要 + 阅读顺序 + 规则 │   ├── context/                 # 自动：仓库拓扑、app/包/模块上下文片段 │   ├── playbooks/               # 手动：常见操作的编码 recipe（add-route、add-api...） │   ├── skills/                  # 手动：AI 行为指令（带 phase/trigger 元数据） │   ├── policies/                # 手动：仓库级编码策略（禁止项、高风险区） │   └── phase-contracts/         # 手动：各阶段新鲜度使用规则 │ └── internal-store/              ← repo 私有事实（AI 不应直接读）     ├── facts/                   # 自动：结构化事实（apps/routes/modules/api/delegations...）     ├── maps/                    # 自动：人类可读地图（全量路由表、模块地图...）     ├── validation/              # 手动：校验命令注册（L0/L1/L2 分级）     ├── inventory/               # 手动：仓库清单（范围、所有权、风险边界）     ├── reports/                 # 自动：新鲜度报告、校验报告、提取器注册     └── schemas/                 # 自动：facts/playbooks/validation 的 schema 定义 ```  |
| --- |


### 3.2 各目录详细说明
#### capability-api/ — 给 spxdev 调的唯一稳定接口
唯一可执行代码。通过 stdin 接收 JSON 请求，stdout 输出 JSON 响应。实现 7 个 capability：

| capability | 功能 | 关键输入 |
| --- | --- | --- |
| `doctor` | 自检 & 新鲜度 | — |
| `update` | 刷新所有自动内容 | — |
| `context` | 按条件返回上下文 | files, query, triggers, phase |
| `skills` | 返回匹配的 AI 技能 | phase, triggers, files |
| `playbooks` | 返回匹配的编码 recipe | phase, triggers, files |
| `validation` | 返回全部校验命令 | — |
| `select-validation` | 按文件筛选校验命令 | files, phase |


#### agent-surface/ — 给 Agent 读
| 子目录 | 维护 | 说明 |
| --- | --- | --- |
| `context/` | 自动 | `root.md`<br/>（仓库拓扑）、`apps/*.md`<br/>（app 入口）、`packages/*.md`<br/>（共享包）、`modules/*.md`<br/>（模块级路由/API/委托事实） |
| `playbooks/` | 手动 | 每种常见操作一个 .md，含 allowed_patterns 和 notice_required_patterns |
| `skills/` | 手动 | AI 行为指令，frontmatter 声明 phases、triggers、paths |
| `policies/` | 手动 | 仓库级策略：禁止改什么、什么需要告知、host/remote 隔离规则 |
| `phase-contracts/` | 手动 | 各阶段的新鲜度使用规则（fresh 可用 / partial-lag 需证据 / stale 需刷新） |


#### internal-store/ — repo 私有事实
| 子目录 | 维护 | 说明 |
| --- | --- | --- |
| `facts/` | 自动 | apps/packages/routes/modules/api/delegations/state/tests 等结构化 JSON。每条 fact 含 source_file、last_seen_commit、confidence、extractor |
| `maps/` | 自动 | 全量路由表、模块地图、技术栈等人类可读 markdown |
| `validation/` | 手动 | `commands.json`<br/>：校验命令注册，含 tier(L0/L1/L2)、applicable_paths、blocking 标记 |
| `inventory/` | 手动 | 源码范围、代码所有权、高风险区域、tombstones |
| `reports/` | 自动 | freshness-report、validation-report、extractor-registry |
| `schemas/` | 自动 | facts/playbooks/validation-commands 的 JSON Schema |


### 3.3 数据流转
<img src="https://cdn.nlark.com/yuque/0/2026/png/311219/1783392854607-b9147741-84ae-4c02-a680-2a84525b654e.png" width="1072" title="" crop="0,0,1,1" id="u62148ad0" class="ne-image">

## 四、如何被 CLI 消费
### 4.1 整体交互流程
<img src="https://cdn.nlark.com/yuque/0/2026/png/311219/1783392862508-f021104f-9aca-405e-aef9-74531cf82f49.png" width="1110" title="" crop="0,0,1,1" id="uc7fbc2eb" class="ne-image">

spxdev CLI 通过 manifest.json 发现 Repo Harness，按 `capability_api.command` 启动 capability-api/index.js，通过 stdin/stdout JSON 通信。协议版本 `repo-harness/v1`。

### 4.2 各阶段消费关系
| spxdev 阶段 | 消费的 capability | 干什么用 |
| --- | --- | --- |
| **prd_analysis** | doctor + context + playbooks | 了解仓库拓扑、新鲜度状态 |
| **repo_context** | context + playbooks + skills | 精确模块定位、委托关系、相关 recipe |
| **scope_impact** | playbooks + skills | 评估影响范围、识别风险边界 |
| **implementation** | playbooks + skills + context | 编码指导、新鲜度规则 |
| **diff_gate** | 不消费 | 纯 git diff 对比 |
| **repo_validation** | select-validation | 按文件筛选校验命令 |
| **e2e / report** | 基本不消费 | — |


### 4.3 一次典型的查询（以 wfm-ui 为例）
| ```plain AI 调用：spxdev repo context --repo frontend --phase repo_context         --files apps/wfm-workforce/src/pages/shift/index.tsx  spxdev：   1. 找 workspace/frontend/.harness/repo/manifest.json   2. 构造 JSON {"capability":"context","selector":{"phase":"repo_context","files":[...]}}   3. spawn: echo '...' | node .harness/repo/capability-api/index.js context  capability-api：   4. 解析文件路径 → 匹配到 shift 模块   5. 读 agent-surface/context/modules/wfm-workforce__src-pages-shift.md   6. 筛选匹配 phase=repo_context 的 playbooks 和 skills   7. stdout 输出 JSON response  spxdev：解析 response → 组装 prompt → 喂给 AI  AI 得到：   "shift 模块有 1 个路由 route.ts，委托给 packages/business/src/shift"   "相关 playbook: add-route，scope-policy: packages/business 是高影响区"   "校验命令: wfm-workforce.lint / wfm-workforce.test" ```  |
| --- |


### <img src="https://cdn.nlark.com/yuque/0/2026/png/311219/1783392900506-ae462592-4767-4dfb-983c-963d6cc1d32e.png" width="836" title="" crop="0,0,1,1" id="u8ec657b4" class="ne-image">
### 4.4 各阶段如何利用 Repo Harness 内容
| 阶段 | AI 拿到什么 | 怎么用 |
| --- | --- | --- |
| prd_analysis | 仓库拓扑（5 个 app、3 个共享包、64 个模块）、路由分类 | 理解仓库全貌，定位需求涉及的面 |
| repo_context | 目标模块的路由/API/委托事实、相关 playbook | 精确了解要改的文件和周边依赖 |
| scope_impact | playbook 的 allowed/notice_required patterns、scope-policy | 确定修改边界和风险 |
| implementation | playbook 完整步骤、新鲜度规则、module context | 按规范编码 |
| repo_validation | 按 touched files 筛选的校验命令列表 | 执行 lint/test/typecheck |


---

## 五、内容更新
### 5.1 更新边界一览
| ```plain ┌─────────────────────────────────────────────────────────┐ │                      自动更新（capability: update）      │ │  internal-store/facts/    全部 .json   extractors 扫描   │ │  internal-store/maps/     全部 .md     facts 渲染        │ │  internal-store/reports/  全部 .md     update 时生成      │ │  internal-store/schemas/  全部 .json   首次写入后不动     │ │  agent-surface/context/   全部 .md     facts 渲染        │ ├─────────────────────────────────────────────────────────┤ │                      手动更新                           │ │  manifest.json            入口清单     metadata 变化时    │ │  capability-api/index.js  协议实现     仓库结构变化时     │ │  agent-surface/AI_ENTRY.md              仓库调整时        │ │  agent-surface/playbooks/              编码规范变化时     │ │  agent-surface/skills/                 策略变化时         │ │  agent-surface/policies/               策略变化时         │ │  agent-surface/phase-contracts/        新鲜度策略调整时    │ │  internal-store/validation/commands.json  新增校验时      │ │  internal-store/inventory/             仓库所有权变化时    │ └─────────────────────────────────────────────────────────┘ ```  |
| --- |


### 5.2 判断规则
| 问题 | 答"是"→ 自动 | 答"是"→ 手动 |
| --- | --- | --- |
| 内容能从源代码中机械提取吗？ | ✅ | — |
| 内容包含架构约定/编码经验吗？ | — | ✅ |
| 内容会在 update 时完全重写吗？ | ✅ | — |
| 内容需要人类判断"什么是对的"吗？ | — | ✅ |


### 5.3 自动更新：触发时机与方式
#### 触发时机
| 时机 | 触发方式 | 适用场景 |
| --- | --- | --- |
| **合入 release 分支后** | GitLab CI job | 最推荐。每次 release 合入后自动跑 `spxdev repo update`，确保 Harness 索引与最新 release 代码同步 |
| **MR 合入后** | GitLab CI job（`only: merge_requests`） | 高频仓库适用，每次 MR 合入都刷新 |
| **定时（如每周）** | GitLab scheduled pipeline | 低频变更仓库或作为兜底策略，例如每周五凌晨跑一次 |
| **手动** | 开发者本地执行 `spxdev repo update` | 紧急修复后需要立即刷新、或 CI 失败后补跑 |


#### 通过 GitLab CI 触发
```yaml
# .gitlab-ci.yml
repo-harness:update:
  stage: post-merge
  only:
    - /^release\/.*$/        # release 分支合入时触发
  script:
    - node .harness/repo/capability-api/index.js update
    - git add .harness/repo/internal-store/ .harness/repo/agent-surface/context/
    - git add .harness/repo/manifest.json
    - git diff --cached --quiet || (git commit -m "chore: repo harness auto-update" && git push)
  allow_failure: true
```

#### 通过 GitLab scheduled pipeline 定时触发
```yaml
# .gitlab-ci.yml
repo-harness:scheduled-update:
  stage: maintenance
  only:
    - schedules
  script:
    - node .harness/repo/capability-api/index.js update
    - |
      if ! git diff --quiet; then
        git checkout -b chore/harness-auto-update-$(date +%Y%m%d)
        git add .harness/repo/internal-store/ .harness/repo/agent-surface/context/ .harness/repo/manifest.json
        git commit -m "chore: repo harness scheduled update $(date +%Y-%m-%d)"
        git push origin chore/harness-auto-update-$(date +%Y%m%d) -o merge_request.create
      fi
  allow_failure: true
```

#### 更新策略选择
| 仓库类型 | 推荐策略 |
| --- | --- |
| 高频迭代（每周多个 MR） | release 合入时触发 + 每周定时兜底 |
| 中频迭代（双周发布） | release 合入时触发 |
| 低频维护 | 每周定时 + 手动 |
| 首次接入 | 手动跑一次全量 update，再接入 CI |


### 5.4 手动更新：效率与机制
**Playbook / Bug Lessons 的快速补充**：不需要从头写完整的 playbook 文件，可以先以最小形式记录，后续再结构化。

```plain
方式1：直接在 bug lesson 文件中追加一行
  agent-surface/playbooks/bug-lessons.md:
    ## 2026-05-20 shift 页面时区转换错误
    - 问题：时间戳未调用 format-date.ts 的 getWhTimestampByUTCSeconds
    - 根因：AI 直接用了 dayjs().format()，绕过了仓库时区工具
    - 检查点：任何时间展示都要检查是否用了 packages/utils/src/time/format-date.ts

方式2：在对应 playbook 的 notice_required_patterns 中追加
  agent-surface/playbooks/add-form-field.md:
    notice_required_patterns:
      - ...
      - 涉及时间字段时，必须使用 format-date.ts 而非 dayjs 直接格式化  ← 新增

方式3：通过 MR review 的 checklist 沉淀
  agent-surface/policies/frontend-change-policy.md:
    ## 常见问题 checklist
    - [ ] 时间处理是否使用了 format-date.ts
    - [ ] 多 Portal 兼容（wfm/wms）是否检查
    - [ ] i18n key 是否已生成
```

Playbook 的最小结构只需要触发词 + 名称 + 操作要点，后续可以逐步丰富 allowed_patterns 和 notice_required_patterns。

#### 更新频率
| 内容类型 | 建议更新频率 | 触发条件 |
| --- | --- | --- |
| Playbooks | 遇到就更新 | 每次发现新的编码模式或踩坑 |
| Bug Lessons | 每次 bug 修复后 | MR 合入时顺手追加 |
| Policies | 每季度 review | 架构决策变化时立即更新 |
| Validation Commands | 新增校验命令时 | CI 配置变化时同步 |


#### Review 机制
```plain
MR review 流程中嵌入 Repo Harness 检查：
  ┌──────────┐    ┌──────────────┐    ┌──────────────┐
  │ MR 提交   │───>│ AI CR 检查    │───>│ 人工 review   │
  └──────────┘    └──────────────┘    └──────────────┘
                       │                    │
                       ▼                    ▼
                  检查本次改动           review 时顺手更新：
                  是否触发了新的          - playbook 补充
                  notice pattern？       - bug lesson 记录
                  如果是 → 提醒          - policy 调整
                  补充 playbook
```

关键原则：**review 时如果发现了 AI 的常见错误模式，顺手在 playbook 或 bug-lessons 里加一行，成本极低，但下次 AI 就会避开。**

## 六、如何应用到其他仓库
### 6.1 最低可行版本（MVP）
4 个文件即可跑通：

| # | 内容 | 说明 |
| --- | --- | --- |
| 1 | `manifest.json` | 仓库名、apps/packages 列表、capability_api 命令 |
| 2 | `capability-api/index.js` | 从 wfm-ui 复制，适配源码目录结构和路由/API 模式 |
| 3 | `validation/commands.json` | 从 package.json scripts 中挑出 lint/test 命令 |
| 4 | `AI_ENTRY.md` | 仓库概要 + 基本规则 |


### 6.2 适配 capitaibility-api 的核心矩阵
| 需要适配的函数 | 适配内容 | 关键程度 |
| --- | --- | --- |
| entityLists() | apps/packages 的数据来源 | 必须 |
| module-directory extractor | 模块目录模式 | 必须 |
| route-regex extractor | 路由声明方式 | 必须 |
| api-regex extractor | API 调用模式 | 必须 |
| route-delegation-map | 共享包引用方式 | 重要 |
| categorizeDiffFile() | 路径分类规则 | 重要 |
| modulePathForSourceFile() | 文件→模块推断 | 重要 |


  


| 提取器 | wfm-ui 的模式 | 新仓库要改成 |
| --- | --- | --- |
| module-directory | `apps/*/src/pages/*`<br/>, `packages/*/src/*` | 你的源码结构 |
| route-regex | `path: '...'`<br/> 声明 | 你的路由声明方式 |
| api-regex | endpoint URL 字符串 | 你的 API 调用模式 |
| route-delegation | `import ... from '@xxx/*'` | 你的共享包引用 |


### 6.3 通用初始化 Skill 的可行性
**可以创建一个通用 skill**，帮助其他仓库初始化 Repo Harness。这个 skill 的职责是：

| 步骤 | skill 能自动做的 | 需要人工 |
| --- | --- | --- |
| 发现仓库结构 | ✅ 扫描 package.json、pnpm-workspace.yaml 等 | — |
| 列出 apps/packages | ✅ 从 workspace 配置推断 | 人工确认 ID、framework、runtime |
| 生成 manifest.json | ✅ 自动生成骨架 | 人工填写 `apps[]/packages[]`<br/> 列表 |
| 复制 capability-api/index.js | ✅ 从模板复制 | 人工适配 extractor 模式（最耗时） |
| 提取 route/api 模式 | ✅ 从现有代码采样 | 人工确认提取规则是否正确 |
| 生成 validation/commands.json | ✅ 从 package.json scripts 提取 | 人工挑选哪些是校验命令，标注 tier |
| 编写 AI_ENTRY.md | 部分（生成骨架） | 人工写仓库概要和关键规则 |
| 编写 playbooks/policies | ❌ | 完全人工，需要仓库经验 |
| 编写 skills/phase-contracts | ❌ | 完全人工 |


**人工必须介入的点**：

1. **extractor 适配** — capability-api/index.js 的核心逻辑，仓库的目录结构和路由/API 声明模式各不相同，需要人确认
2. **apps/packages 列表** — manifest.json 中 app 的 framework、runtime 等元信息来自人的理解
3. **playbooks/policies** — 仓库的编码规范和风险边界是团队经验，无法自动提取
4. **validation 命令选择** — 哪些 scripts 是校验命令、L0/L1/L2 如何分级，需要人判断
5. **AI_ENTRY.md** — 仓库级的重要规则和阅读顺序需要人写

### 6.4 迭代路径
| MVP (4件) → 加 1-2 个 playbook → 加 skills → 加 phase-contracts → 完善 inventory |
| --- |


  


  

