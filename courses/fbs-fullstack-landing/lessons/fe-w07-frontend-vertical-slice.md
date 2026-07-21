# 前端纵向切片：为入库列表增加一个受控能力

> 预计学习时间：150–200 分钟
> 一句话总结：整合模块二的组件、路由、状态、API、权限、i18n 和文件处理能力，在 SC Vue 仓库中完成一个从需求分析到可运行验证的完整前端切片——新增一个筛选能力并验证全链路。

## 这一章解决什么问题

前面六章分别覆盖了 FBS 前端开发的六个独立维度：FE-W01 启动了三仓工程并建立了仓库地图；FE-W02 讲了组件树、表单和表格的读写模式；FE-W03 讲了 URL → 路由 → 菜单的映射关系；FE-W04 分析了三仓各自的状态管理架构；FE-W05 深入了 API 请求链路、错误分层和前后端契约；FE-W06 补上了权限、i18n、时间、文件处理和 PII 的准入规则。

但你还缺一个关键能力：把所有维度串成一条完整的改动链。本章不会讲任何新概念——它把前面六章覆盖的所有知识点整合为一条练习路径，带你从需求出发，在 SC Vue 仓库的入库列表页面中实际新增一个「优先仓」筛选字段，逐层完成从筛选表单到 API 参数、从列表展示到 i18n 翻译的完整改动，每步保留可验证的中间状态，最终产出可交付的 git diff 和验收记录。

本章以 SC Vue 仓库的入库列表为主练习场。改动内容：「为入库列表增加一个优先仓（priority warehouse）下拉筛选」——涉及筛选表单、API 参数传递、列表展示三个层面，是一道真实且范围可控的前端需求。Portal 和 SC React 仓库的对应改动留作迁移分析题。

> 本章基于 SC Vue 仓库的 release 分支（2026-07-20）。本章不做后端开发、不做新建路由、不做权限码注册——那些属于全栈纵向切片的范围。

## 确认验收样例

在动手之前，先把「做完」定义为可验证的用例表。这张表是本章所有步骤的目标——每完成一步，都回来对照，确认没有偏离。

| 用例 | 操作 | 预期结果 | 验证方式 |
| --- | --- | --- | --- |
| 正常筛选 | 筛选栏选择「优先仓 = A」，点击搜索 | 列表只显示对应优先仓的入库单 | Network 面板确认请求参数含 `priority_whs`；页面列表数据正确 |
| 清除筛选 | 清除「优先仓」选择，点击搜索 | 列表显示所有入库单 | Network 面板确认请求参数不含 `priority_whs` |
| 空结果 | 选择无数据的优先仓 | 列表显示空态提示「暂无符合条件的数据」 | 肉眼确认 |
| 回归 | 其他筛选条件（status、date range 等）仍正常 | 无回归问题 | 逐个测试原有筛选字段 |
| i18n | 切换语言为英文 | 筛选项标签、空态文案正确显示英文 | 肉眼确认 |

为什么先写验收用例？因为在真实需求中，验收标准决定了你什么时候可以停下来——没有它，你会不自觉地在细节上反复修改，或者在验了一半时开始怀疑"这样算不算做完"。

## 第一步：定位入库列表的完整调用链

需求是「加一个筛选字段」。但你面对的是一个已有的页面——必须先理解它现在的结构，才能安全地在里面加东西。

### 找到页面入口

SC Vue 仓库的页面遵循「一个页面 = 一个目录」的组织方式。入库列表的入口在 `src/views/inbound/IBT/list/`。这个目录下通常有：

```
list/
  index.vue          ← 列表页主组件
  searchForm.vue      ← 筛选表单组件
  list.vue            ← 列表表格组件
```

打开 `src/views/inbound/IBT/list/index.vue`，你会看到类似这样的结构：

```vue
<template>
  <div class="ibt-list-page">
    <SearchForm :form="searchForm" @search="handleSearch" @reset="handleReset" />
    <List :data="tableData" :loading="loading" />
    <Pagination :current="page" :total="total" @change="handlePageChange" />
  </div>
</template>
```

这里的关键信息是数据流方向：`searchForm` 作为 Props 传给 `SearchForm`，用户操作通过 `@search` 事件向上传递，`handleSearch` 负责调用 API 并更新 `tableData`。

### 追踪筛选表单的数据结构

打开 `src/views/inbound/IBT/list/searchForm.vue`，找到 `form` 对象的定义：

```vue
<script>
export default {
  props: {
    form: { type: Object, required: true }
  },
  data() {
    return {
      statusOptions: [],
      warehouseOptions: []
    }
  }
}
</script>
```

注意这里的关键信息：`form` 是 Props 传入的——它不是 searchForm 内部的 data。这意味着 form 的初始值在父组件 `index.vue` 中定义。打开 `index.vue` 找到它：

```javascript
data() {
  return {
    searchForm: {
      status: '',
      date_range: [],
      keyword: ''
    }
  }
}
```

现在你知道了 form 的结构——新增字段时，需要同时在 index.vue 的 `searchForm` 初始化和 searchForm.vue 的模板中各加一处。

### 追踪搜索触发后的 API 调用

`searchForm.vue` 中点击搜索按钮时，`$emit('search', this.form)` 将整个 form 对象传给父组件。找到 `index.vue` 中的 `handleSearch` 方法：

```javascript
methods: {
  async handleSearch(params) {
    this.page = 1
    await this.fetchList(params)
  },
  async fetchList(params) {
    this.loading = true
    try {
      const res = await getInboundList(this.buildParams(params))
      this.tableData = res.data.list
      this.total = res.data.total
    } finally {
      this.loading = false
    }
  },
  buildParams(params) {
    // 关键：清除空值，避免 ?status=&keyword= 这样的请求
    const cleaned = {}
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleaned[key] = params[key]
      }
    })
    cleaned.page = this.page
    cleaned.page_size = this.pageSize
    return cleaned
  }
}
```

这段 `buildParams` 是整个数据流的**关键节点**：它决定了哪些 form 字段会进入 API 请求。新增字段时，`buildParams` 已经通过 `Object.keys(params)` 自动处理你在 form 中新加的 key——只要 key 的值不为空字符串，就会被包含。这意味着你在 form 中加一个新字段后，大多数情况下不需要修改 `buildParams`——但你需要确认这一点，而不是假设。

### 找到 API 函数

`getInboundList` 在 `src/api/inbound.js` 中定义：

```javascript
import request from '@/utils/request'

export function getInboundList(params) {
  return request({
    url: '/inbound/list',
    method: 'get',
    params
  })
}
```

现在你有了完整的调用链图：

```
searchForm.vue (用户选择筛选条件)
  → $emit('search', form)
  → index.vue handleSearch(form)
  → index.vue buildParams(form) → 清除空值 → 拼装分页参数
  → getInboundList(params)
  → request({ url: '/inbound/list', method: 'get', params })
  → 后端 API
  → 响应 → this.tableData → List 组件渲染
```

在这一步，你的目标是**画出这张图**——不需要改任何代码。这个习惯——「先画调用链，再动手改」——在后续所有前端纵向切片中都会反复用到。

## 第二步：新增筛选字段

现在你知道数据流了，可以安全地加字段。分三个文件修改。

### 2.1 form 初始化（index.vue）

在 `index.vue` 的 `searchForm` 中新增字段：

```javascript
// 修改前
data() {
  return {
    searchForm: {
      status: '',
      date_range: [],
      keyword: ''
    }
  }
}

// 修改后
data() {
  return {
    searchForm: {
      status: '',
      date_range: [],
      keyword: '',
      priority_whs: ''     // ← 新增：优先仓筛选，默认全部（空字符串 = 不筛选）
    }
  }
}
```

初始值设为空字符串——与 status 字段一致。FBS 的 `buildParams` 函数会过滤掉空字符串，不筛选时不传参数。

### 2.2 筛选表单 UI（searchForm.vue）

在 `searchForm.vue` 模板中新增筛选下拉：

```vue
<!-- 修改前 -->
<EdsForm :model="form">
  <EdsFormItem :label="$t('inboundStatus')" prop="status">
    <EdsSelect v-model="form.status" :options="statusOptions" clearable :placeholder="$t('pleaseSelect')" />
  </EdsFormItem>
  <!-- 其他现有字段... -->
  <EdsFormItem>
    <EdsButton type="primary" @click="handleSearch">{{ $t('search') }}</EdsButton>
    <EdsButton @click="handleReset">{{ $t('reset') }}</EdsButton>
  </EdsFormItem>
</EdsForm>

<!-- 修改后 -->
<EdsForm :model="form">
  <EdsFormItem :label="$t('inboundStatus')" prop="status">
    <EdsSelect v-model="form.status" :options="statusOptions" clearable :placeholder="$t('pleaseSelect')" />
  </EdsFormItem>
  <!-- ↓ 新增：优先仓筛选 -->
  <EdsFormItem :label="$t('priorityWarehouse')" prop="priority_whs">
    <EdsSelect v-model="form.priority_whs" :options="priorityWarehouseOptions" clearable :placeholder="$t('all')" />
  </EdsFormItem>
  <!-- 其他现有字段保持不变... -->
  <EdsFormItem>
    <EdsButton type="primary" @click="handleSearch">{{ $t('search') }}</EdsButton>
    <EdsButton @click="handleReset">{{ $t('reset') }}</EdsButton>
  </EdsFormItem>
</EdsForm>
```

几处需要确认的细节：

- `v-model="form.priority_whs"` 绑定的是 form 对象的属性——注意它必须在 `index.vue` 的 `searchForm` 中已定义（2.1 已做）。
- `clearable` 属性让用户能清空选择回到「全部」状态——这对应验收用例中的「清除筛选」路径。
- `placeholder="$t('all')"` 在未选择时显示「全部」——这个文案需要 i18n 翻译。

### 2.3 下拉选项数据

优先仓的选项从哪里来？FBS 仓库中下拉选项通常有三个来源：

1. **硬编码常量**（`src/constants/` 目录）：选项固定且变更不频繁的场景——如状态枚举。
2. **Store 初始化数据**：从后端接口拉取后存入 Vuex Store，全局复用。
3. **组件内 API 调用**：选项数据只在本页面使用，每次挂载时请求。

优先仓列表如果是一个确定且不常变的枚举（如 A、B、C 三个仓），用硬编码常量最直接：

```javascript
// src/constants/warehouse.js（如已存在则追加）
export const PRIORITY_WAREHOUSE_OPTIONS = [
  { label: '仓 A', value: 'A' },
  { label: '仓 B', value: 'B' },
  { label: '仓 C', value: 'C' }
]
```

在 `searchForm.vue` 中引入：

```javascript
// 修改后
import { PRIORITY_WAREHOUSE_OPTIONS } from '@/constants/warehouse'

export default {
  props: {
    form: { type: Object, required: true }
  },
  data() {
    return {
      statusOptions: [],
      priorityWarehouseOptions: PRIORITY_WAREHOUSE_OPTIONS,  // ← 新增
      warehouseOptions: []
    }
  }
}
```

如果选项来自后端接口，参考 FE-W05 中「受控练习」的步骤——先确认后端 DTO 中的字段名和值类型，再用 Store 或 API 获取。**不要假设后端接口已经支持这个字段**——如果后端尚未提供，可以先硬编码选项把前端 UI 和流程跑通，在后端就绪后替换数据源。这属于练习三中讨论的「部分交付」策略。

## 第三步：确认 API 参数传递

第二步完成后，你已经在 form 中新增了 `priority_whs` 字段。但别急着假设参数会自动正确传递——验证它。

### 3.1 buildParams 的自动处理

回到 `index.vue` 的 `buildParams` 方法。因为它在遍历 `params` 对象的 key 时用的是 `Object.keys(params)`，新增的 `priority_whs` 会自动被包含：

```javascript
buildParams(params) {
  const cleaned = {}
  Object.keys(params).forEach(key => {
    if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
      cleaned[key] = params[key]
    }
  })
  // 此时 params 包含 { status: 'PENDING', priority_whs: 'A', keyword: '', ... }
  // cleaned 会是 { status: 'PENDING', priority_whs: 'A', page: 1, page_size: 20 }
  // keyword 因为空字符串被过滤掉了——符合预期
  cleaned.page = this.page
  cleaned.page_size = this.pageSize
  return cleaned
}
```

验证步骤：选择「优先仓 = A」后点击搜索，打开浏览器 DevTools → Network 面板，找到 `/inbound/list` 请求，检查 Query String Parameters：

```
page: 1
page_size: 20
status: PENDING
priority_whs: A      ← 确认这个字段出现在请求中
```

清除优先仓选择后再次搜索，确认 `priority_whs` 不再出现在 Query String Parameters 中。

### 3.2 与后端的字段名对齐

这是联调时最容易出问题的地方。前端传的字段名必须和后端 DTO 中的 `form` tag 一致。如果后端 DTO 中定义的是：

```go
type ScIrListReq struct {
    PriorityWarehouse *string `json:"priority_warehouse" form:"priority_warehouse"`
}
```

而前端传的是 `priority_whs`，后端会忽略这个字段——因为 Chassis 的 `form` tag 绑定按字段名精确匹配，不匹配的 key 被静默丢弃，不报任何错误。

**验证方式**：在你确信后端接口已就绪的情况下，用 Network 面板确认参数名和后端 DTO 一致。如果联调时发现筛选不生效，第一步不是怀疑后端逻辑有问题，而是确认字段名是否完全匹配。

## 第四步：调整列表展示

需求只要求加一个筛选字段——列表列不需要变。但如果实际需求中需要新增列表列（比如显示每条入库单对应的优先仓名称），按以下模式处理。

打开 list.vue，找到列定义：

```javascript
// 修改前
columns: [
  { prop: 'ir_id', label: this.$t('irId'), width: 120 },
  { prop: 'status', label: this.$t('status'), width: 100,
    formatter: (row) => this.$t(row.status) },
  // ... 其他列
]

// 修改后（如果需求要加列）
columns: [
  { prop: 'ir_id', label: this.$t('irId'), width: 120 },
  { prop: 'status', label: this.$t('status'), width: 100,
    formatter: (row) => this.$t(row.status) },
  // ↓ 新增
  { prop: 'priority_warehouse', label: this.$t('priorityWarehouse'), width: 120,
    formatter: (row) => row.priority_warehouse || '--' },
  // ... 其他列
]
```

`formatter` 中的 `|| '--'` 处理空值——当后端字段未返回或为 null 时，显示 `--` 而非空白。FBS 仓库中这个降级文案的惯例是 `--` 或 `$t('none')`，以当前仓库实际写法为准。

## 第五步：i18n、空态与错误处理

### 5.1 翻译 key

本改动至少需要两个翻译 key：

| key | 中文 | 英文 |
| --- | --- | --- |
| `priorityWarehouse` | 优先仓 | Priority Warehouse |
| `all` | 全部 | All |

FBS 的 i18n 流程（FE-W06 已详述）：在 Transify 平台创建 key → 填写中文/英文翻译 → 执行 `yarn i18n:pull` 拉取到本地 `src/lang/` 目录。注意命名规则：FBS 仓库使用 camelCase 命名（`priorityWarehouse` 而非 `priority_warehouse`）。

完成后验证：切换系统语言为英文，确认筛选标签显示 "Priority Warehouse"，占位符显示 "All"。

### 5.2 空数据处理

当筛选条件无匹配结果时，列表应显示空态组件。在 `index.vue` 的模板中确认：

```vue
<List v-if="!loading && tableData.length > 0" :data="tableData" />
<EmptyState v-else-if="!loading" :description="$t('noMatchingData')" />
```

注意空态文案用「暂无符合条件的数据」而非「暂无数据」——前者告诉用户「你的筛选条件没有命中结果」，后者可能让用户误以为「系统里什么数据都没有」。这个差异在边界用例中很重要。

### 5.3 错误处理

FBS 的 request wrapper（`src/utils/request.js`）在响应拦截器中已统一处理 HTTP 错误（自动 toast 提示、401 跳转登录）。对于本需求，你不需要在组件中额外写 try-catch——`fetchList` 中已有的 `try { ... } finally { this.loading = false }` 模式已经覆盖了正常的错误流程。但如果需要在特定错误时做更精细的处理（如某错误码下显示特定提示而非通用 toast），在 catch 分支中按 FE-W05 的四层错误模型处理。

## 第六步：验证与回归

### 6.1 逐条验收

按「确认验收样例」中的 5 个用例逐条执行：

**正常筛选实验**：选择优先仓 = A → 搜索 → Network 面板截图确认 `priority_whs=A` 在请求参数中 → 列表只显示对应数据。

**清除筛选实验**：点击优先仓下拉的清除按钮 → 搜索 → Network 面板截图确认请求参数不含 `priority_whs` → 列表恢复全部数据。

**空结果实验**：选择无数据的优先仓 → 搜索 → 确认列表展示 `noMatchingData` 文案 → 确认不会出现 loading 无限转圈或报错。

**回归实验**：不选优先仓，用 status、date range 等原有筛选独立和组合筛选 → 确认结果与之前一致。

**i18n 实验**：切换语言 → 确认所有新增文案正确切换。

### 6.2 代码质量

```bash
yarn lint
```

确认无新增 lint 错误——如果有，追溯错误信息到具体行修复。打开 Console，确认无红色 error 和黄色 warning（忽略与本次改动无关的既有 warning）。如果出现 `[Vue warn]: Invalid prop` 或 `Cannot read property of undefined`，回到第二步和第三步检查 Props 传递链和 API 响应结构。

### 6.3 最终的 git diff

```bash
git diff
```

你应该看到大约 3-4 个文件的改动，每个文件的改动量在 5-15 行左右：

```
src/views/inbound/IBT/list/index.vue         ← searchForm 新增字段
src/views/inbound/IBT/list/searchForm.vue    ← 模板新增下拉 + 引入常量
src/constants/warehouse.js                   ← 新增选项常量（如需要）
src/lang/zh-CN.json / src/lang/en-US.json    ← i18n 新增 key
```

## 跨仓影响记录

即使本章只在 SC Vue 中实际操作，你需要能回答以下问题——它们决定了你的改动是否对另外两个仓库造成影响。

Portal 的入库列表在 `src/views/InboundManagement/` 下，是一个 React 类组件/函数组件。筛选状态通过 Redux Store 管理，API 调用走 `src/utils/request.ts` 的 Axios wrapper。加优先仓筛选需要修改：列表组件（新增 Select 组件 + dispatch action）、Redux Store（新增筛选字段到 state + reducer case）、API 类型定义（`src/apis/inbound.ts` 中的 params 类型新增 `priority_whs?: string`）、i18n 翻译文件（`src/lang/`）。

SC React 的入库列表以远端组件（InboundComponent）形态存在——它由主模块通过 Module Federation 加载。加优先仓筛选需要修改：远端 InboundComponent 的 Props 类型定义和渲染逻辑、主模块调用 InboundComponent 时传入新的 Props 值、项目的 API 函数文件和翻译文件。关键风险：如果新增 Props 且主模块未更新调用代码，组件使用 Props 默认值（可能为 undefined），筛选能力不生效但不报错——这比报错更难发现。

| 对比维度 | SC Vue（本章主场地） | Portal | SC React |
| --- | --- | --- | --- |
| 筛选状态位置 | index.vue data | Redux Store | 宿主演入 Props |
| 新增筛选字段改动量 | 2 个 Vue 文件 | 组件 + Store + Action + API 类型 | 远端组件 + 主模块调用 + API |
| API 参数 | 通过 buildParams 自动处理 | 需在 action creator 中显式提取 | 需在 Props 和 action creator 中显式提取 |
| i18n | Transify + vue-i18n | Transify + react-i18next | Transify + react-i18next |

后端 API 是同一个——`/inbound/list`。所以 API 参数的字段名在三仓中必须一致。如果你在 SC Vue 中用的是 `priority_whs`，Portal 和 SC React 也必须用 `priority_whs`，否则请求到后端时被忽略。

## 练习

### 练习一：完成主仓库切片

在 SC Vue 仓库中完成本章描述的优先仓筛选改动。完成后保存 `git diff` 输出和 Network 面板中「选择优先仓」和「清除优先仓」两次请求的截图。逐条核对 5 个验收用例是否全部通过。

### 练习二：迁移分析

写出 Portal 和 SC React 仓库中实现相同改动需要修改的具体文件路径和每个文件的改动内容。不要求实际改代码——但要写出每个文件的改动描述（如「在 XXX 组件中新增 Select 元素」「在 Redux action creator 中新增 priority_whs 参数提取」「在 API 类型定义中新增可选字段」）。

### 练习三：边界扩展

如果后端接口尚未支持 `priority_whs` 参数，分析三种策略的适用场景和风险：

1. **前端本地筛选**：调用全量数据后在前端用 `Array.filter` 筛选。优点是不依赖后端，立即可验证 UI；缺点是分页不准确（前端只拿了当前页数据，筛选后结果少于预期）且大数据量时性能差。**仅在 prototype 阶段使用，不要合入主分支。**
2. **先写契约、后对接**：前端按后端将提供的字段名和值类型写好参数传递逻辑，后端上线后自然对接。优点是不产生技术债、前端不需要回滚代码；缺点是无法立即端到端验证筛选效果。**这是推荐策略。**
3. **feature flag 包裹**：用环境变量或配置开关控制筛选 UI 的展示，后端上线后打开。优点是可以在生产环境中安全部署、逐步放量；缺点是增加了配置复杂度。

### 练习四：自测清单设计

为你在练习一中完成的实际改动编写一份自测清单，至少包含 6 个验收项，覆盖：
- 正常路径（至少 3 项：带筛选参数正常返回、清除筛选后全量返回、分页切换时筛选条件保持）
- 边界路径（至少 2 项：空结果展示、API 返回 500 时页面不崩溃）
- 回归路径（至少 1 项：其他筛选字段在新增字段后仍正常）

每项写出操作步骤和预期结果。

## 自检

1. 从需求到交付的完整前端纵向切片包含哪些步骤？为什么每步都要保留可验证的中间状态？
2. 在改代码之前，为什么要先画出调用链？画出调用链具体要看哪些节点？
3. `buildParams` 函数过滤空值的逻辑是如何影响新字段的？为什么大多数情况下你不需要修改它？
4. 跨仓影响分析需要回答哪些问题？为什么只改一个仓库的代码但需要拉另外两个仓库的 diff？
5. 验收用例为什么必须覆盖正常路径、边界路径和回归路径？少一个会带来什么风险？

## 参考文献

- 模块二 FE-W01 ~ FE-W06 各章内容
- SC Vue 仓库 `src/views/inbound/IBT/list/` 目录下的组件
- SC Vue 仓库 `src/api/inbound.js` 的列表请求函数
- FE-W05 API 请求链路与错误分层模型
- FE-W06 i18n 翻译流程与权限控制
