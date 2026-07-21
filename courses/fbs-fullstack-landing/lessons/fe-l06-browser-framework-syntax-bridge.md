# 浏览器与框架语法桥：DOM、事件、JSX、Vue SFC

> 预计学习时间：110–150 分钟
> 一句话总结：区分 JavaScript 语言、浏览器 Web API、React JSX 和 Vue SFC 四种不同的语法层——能读懂表单、事件、条件渲染、列表渲染和组件 Props/Emits，并将同一交互在 React 和 Vue 片段中逐项对应。

## 这一章解决什么问题

后端同学第一次看到 Vue SFC（`.vue` 文件）或 React JSX 时，最大的困惑不是语法本身，而是分不清哪些属于 JavaScript 语言、哪些是浏览器能力、哪些是框架的"魔法"。一个 `.vue` 文件里有 `<template>`、`<script>` 和 `<style>` 三个区域；一段 React 代码里 `onClick={() => handleClick(id)}` 看起来像 HTML 但又不一样。

本章不教你怎么从零搭建一个 React 或 Vue 项目——那是模块二的事。本章的目标是：当你打开 FBS 任一页面的 `.vue` 或 `.tsx` 文件时，你能说出每一段代码属于哪一层，理解数据从用户操作到页面更新的路径，以及 React 和 Vue 在同等功能上各自是怎么写的。

> 示例来自三个前端仓库的 release 分支（2026-07-20）。本节不展开状态管理、路由和构建配置。

## 理解四层语法边界

### JavaScript 语言本身

这是你截至 FE-L05 已经学过的内容：变量、函数、Promise、Array 方法、TypeScript 类型。`const x = 1`、`array.map(fn)`、`await fetchData()` 都属于这一层。无论在什么框架中，这些规则都不变。

### 浏览器 Web API

浏览器提供了 JavaScript 运行时之外的全局对象：`document`（DOM 树）、`window`（全局上下文）、`fetch`（网络请求）、`localStorage`、`console` 等。这些不是 JavaScript 语言规范的一部分，而是浏览器宿主环境提供的。

```javascript
// 浏览器 API，不是 JavaScript 语言
document.getElementById('app');
window.location.href;
localStorage.setItem('key', 'value');
```

FBS 代码中直接使用浏览器 API 的场景相对少，因为 React 和 Vue 代替了直接的 DOM 操作。但你仍然会在初始化代码、工具函数和基础库中见到 `window`、`document` 和 `location`。

### React JSX

JSX 不是 HTML，也不是 JavaScript 的正式一部分。它是 JavaScript 的**语法扩展**，看起来像 HTML 写在 JS 里，但编译后变成 `React.createElement()` 调用：

```jsx
// JSX 源码
const title = <h1 className="fbs-title">{name}</h1>;

// 编译后近似等价于：
const title = React.createElement('h1', { className: 'fbs-title' }, name);
```

关键区别：
- JSX 用 `className` 而非 HTML 的 `class`（因为 `class` 是 JavaScript 的保留字）。
- JSX 用 `{}` 嵌入 JavaScript 表达式（`{name}`），HTML 没有这个能力。
- JSX 的属性名使用 camelCase（`onClick` 而非 `onclick`）。
- JSX 的 `{}` 中可以放任何 JavaScript 表达式：变量、函数调用、三元运算符、`.map()` 等。

### Vue SFC 与模板语法

Vue 的 `.vue` 文件是**单文件组件**（Single File Component），包含三个区域：

```vue
<template>
  <!-- Vue 模板语法：增强版 HTML -->
  <div class="fbs-ibt-detail" ref="ibtDetail">
    <h1>{{ $t('inboundProblemId') }}: {{ id }}</h1>
    <EdsTag v-if="!dataLoading" :status="status.type">
      {{ $t(status.label) }}
    </EdsTag>
  </div>
</template>

<script lang="ts">
// 标准 TypeScript/JavaScript
import { defineComponent, ref } from 'vue';
export default defineComponent({
  // ...
});
</script>

<style scoped>
/* CSS，scoped 确保样式只在当前组件生效 */
.fbs-ibt-detail { padding: 16px; }
</style>
```

Vue 模板语法是**增强版 HTML**，支持：
- `{{ }}`（Mustache 插值）：嵌入 JavaScript 表达式
- `v-` 指令：`v-if`（条件渲染）、`v-for`（列表渲染）、`v-model`（双向绑定）、`v-show`
- `:` 前缀（`v-bind` 简写）：动态绑定属性 `:status="status.type"`
- `@` 前缀（`v-on` 简写）：事件监听 `@click="handleClick"`

## 最小 DOM 与事件模型

在 FBS 代码中你很少直接操作 DOM，但理解 DOM 的基本模型能帮助你明白框架在做什么。

### DOM 是一棵树

```javascript
const div = document.getElementById('app');
const children = div.children;      // HTMLCollection
const firstChild = div.firstElementChild;
const parent = div.parentElement;
```

### 事件监听

```javascript
// 原生事件监听
button.addEventListener('click', (event) => {
  console.log('clicked', event.target);
  event.preventDefault(); // 阻止默认行为
});
```

`addEventListener` 是浏览器提供的事件订阅机制。React 和 Vue 各自封装了这个机制，但你看到 `onClick` 或 `@click` 时，要知道它们的底层就是浏览器事件。

### 表单受控值

原生表单元素的值由 DOM 自身管理：

```html
<input type="text" id="keyword" />
```
```javascript
const value = document.getElementById('keyword').value;
```

React 和 Vue 通常采用"受控组件"模式：表单值由 JavaScript 状态管理，DOM 只是状态的反映。这意味着你改表单值时，不是改 DOM，而是改 JavaScript 状态。

## React JSX 语法精要

### 组件：返回 JSX 的函数

```jsx
function InboundFilter({ onFilter, regions }) {
  return (
    <div className="filter-bar">
      <select onChange={(e) => onFilter({ region: e.target.value })}>
        {regions.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
```

- 函数名首字母大写（这是 React 判断"组件" vs "普通 HTML" 的依据）。
- 返回 JSX。`()` 包裹多行 JSX 是约定，避免自动分号插入问题。
- 参数中的 `{ onFilter, regions }` 是解构 Props——父组件传入的数据。

### 条件渲染

React 中没有 `v-if`。条件渲染使用 JavaScript 表达式：

```jsx
// 三元运算符
{loading ? <Spinner /> : <Table data={list} />}

// 逻辑与短路
{error && <Alert type="error" message={error} />}

// 提前 return（整个组件级别）
if (!data) return <Empty />;
```

### 列表渲染

```jsx
{inboundList.map(item => (
  <InboundRow key={item.ir_id} data={item} />
))}
```

`key` 是 React 用于追踪列表项变化的标识。它必须是稳定且唯一的——通常是数据 ID，不能用数组索引（除非列表顺序永远不变）。

### 事件处理

```jsx
<button onClick={() => handleSubmit(formData)}>提交</button>
<button onClick={handleSubmit}>提交</button>  {/* 不需要传参时 */}
<input onChange={(e) => setKeyword(e.target.value)} />
```

React 事件名使用 camelCase（`onClick`、`onChange`），不是 HTML 的小写（`onclick`）。合成事件对象 `e` 是 React 包装过的，但行为和原生事件对象基本一致。

注意 `onClick={handleSubmit(formData)}` 是错误写法——这会在渲染时就调用函数。正确写法是用箭头函数包裹：`onClick={() => handleSubmit(formData)}`。

### Props：数据向下流动

```jsx
// 父组件
<InboundDetail irId={selectedId} readonly={true} />

// 子组件
function InboundDetail({ irId, readonly }) {
  // irId 的类型是 number，readonly 是 boolean
}
```

Props 是只读的。子组件不能修改 Props，只能通过回调函数通知父组件修改。

## Vue 模板语法精要

### 组件：template + script

```vue
<template>
  <div class="filter-bar">
    <EdsSelect v-model="selectedRegion" :options="regionOptions" @change="handleRegionChange" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  props: {
    regions: { type: Array, required: true },
  },
  emits: ['filter'],
  setup(props, { emit }) {
    const selectedRegion = ref('');

    const handleRegionChange = (value) => {
      emit('filter', { region: value });
    };

    return { selectedRegion, handleRegionChange };
  },
});
</script>
```

Vue 3 支持两种 API：Options API（`data`、`methods`、`computed` 等选项）和 Composition API（`setup` 函数或 `<script setup>`）。FBS 仓库中两种都存在，但新代码倾向 Composition API。

### 条件渲染（Vue）

```vue
<EdsTag v-if="!dataLoading && basicInfo.urgentStatus">
  {{ $t('commonUrgent') }}
</EdsTag>
<BaseSkeleton v-else-if="dataLoading" :line="3" />
<template v-else>
  <div>默认内容</div>
</template>
```

`v-if` 真正从 DOM 中移除元素。`v-show` 只是切换 `display: none`，元素仍在 DOM 中。FBS 中切换频繁的元素用 `v-show`，条件很少变化的用 `v-if`。

### 列表渲染（Vue）

```vue
<div v-for="item in inboundList" :key="item.ir_id">
  {{ item.status }}
</div>
```

`:key` 和 React 的 `key` 作用相同。

### 事件处理与双向绑定

```vue
<EdsButton @click="handleModify">{{ $t('commonModify') }}</EdsButton>
<EdsInput v-model="searchKeyword" />
```

`@` 是 `v-on` 的简写。`v-model` 是双向绑定的语法糖——它同时处理了 `:value`（数据到视图）和 `@input`（视图到数据）。

Vue 模板中的方法名不需要像 React 那样用箭头函数包裹，可以直接写方法引用。

### Props 与 Emits

```vue
<!-- 父组件 -->
<InboundFilter :regions="regionList" @filter="handleFilter" />

<!-- 子组件 -->
<script setup lang="ts">
const props = defineProps<{ regions: string[] }>();
const emit = defineEmits<{ filter: [params: { region: string }] }>();
</script>
```

Vue 中数据向下流（Props），事件向上流（Emits）。这和 React 的 Props + 回调函数是同一个模式，只是语法不同。

## React vs Vue：同一交互的两种写法

以"一个筛选下拉框，选择后触发列表刷新"为例，对比三种形态的写法：

### React 16（Portal）

```jsx
function InboundPage() {
  const [region, setRegion] = useState('');
  const [list, setList] = useState([]);

  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    setRegion(newRegion);
    getRequestList({ region: newRegion }).then(res => setList(res.data.list));
  };

  return (
    <div>
      <select value={region} onChange={handleRegionChange}>
        <option value="">全部</option>
        {regions.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {list.map(item => <InboundRow key={item.ir_id} data={item} />)}
    </div>
  );
}
```

### Vue 3（SC Vue）

```vue
<template>
  <div>
    <EdsSelect v-model="region" :options="regionOptions" @change="handleRegionChange" />
    <InboundRow v-for="item in list" :key="item.ir_id" :data="item" />
  </div>
</template>

<script lang="ts">
export default defineComponent({
  setup() {
    const region = ref('');
    const list = ref([]);

    const handleRegionChange = async (value) => {
      const res = await getRequestList({ region: value });
      list.value = res.data.list;
    };

    return { region, list, handleRegionChange };
  },
});
</script>
```

### React 18（SC React）

```jsx
function InboundPage() {
  const [region, setRegion] = useState('');
  const [list, setList] = useState([]);

  useEffect(() => {
    getRequestList({ region }).then(res => setList(res.data.list));
  }, [region]);

  return (
    <div>
      <select value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="">全部</option>
        {regions.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
      {list.map(item => <InboundRow key={item.ir_id} data={item} />)}
    </div>
  );
}
```

三种写法的共同点：
- 用户操作 → 更新状态变量 → 框架自动重新渲染 UI。
- 列表用数组的 `.map()` 生成元素，每个元素需要唯一 `key`。
- 事件处理函数中执行异步请求，请求结果更新状态。

主要差异：
- React 16 的异步请求在事件处理函数中直接完成。
- Vue 3 用 `v-model` 简化双向绑定，响应式系统自动追踪依赖。
- React 18 用 `useEffect` 将"region 变化 → 请求列表"的逻辑分离，符合声明式编程风格。

## SFC 的 template/script/style 边界

回到 FBS 的真实 `.vue` 文件，理解三个区域的职责和交互：

### `<template>`：定义 DOM 结构

这是框架管理的 DOM 片段。`template` 中的 HTML 不是直接插入页面的 HTML——Vue 编译它为一个渲染函数：

```vue
<template>
  <div class="fbs-ibt-detail">
    <EdsForm :model="form" ref="fbsIbtRef" :rules="formRules">
      <EdsFormItem :label="$t('commonRequestId') + ':'">
        <ShowMore :list="requestIds" canClick @jump="jumpToRequest" />
      </EdsFormItem>
    </EdsForm>
  </div>
</template>
```

这里 `EdsForm`、`EdsFormItem`、`ShowMore` 是其他 Vue 组件，`form`、`fbsIbtRef`、`formRules`、`requestIds` 是在 `<script>` 中定义的 JavaScript 值。

### `<script>`：定义数据和行为

```vue
<script lang="ts">
export default defineComponent({
  data() {
    return {
      form: { /* ... */ },
      id: '',
      dataLoading: true,
    };
  },
  computed: {
    canModify() {
      return this.basicInfo.editStatus !== 'NONE';
    },
  },
  methods: {
    async handleModify() {
      // ...
    },
  },
});
</script>
```

`data` 返回的数据是响应式的：修改时模板自动更新。`computed` 是计算属性——依赖变化时自动重新计算。`methods` 是普通函数，在模板中通过事件绑定调用。

### `<style scoped>`：定义组件私有样式

```vue
<style scoped lang="less">
.fbs-ibt-detail {
  padding: 16px;
  .fbs-ibt-title {
    display: flex;
    justify-content: space-between;
  }
}
</style>
```

`scoped` 属性让这些 CSS 只作用于当前组件的元素。Vue 通过为组件的每个元素添加唯一属性（如 `data-v-xxx`）来实现隔离。FBS SC Vue 使用 Less 预处理器（`lang="less"`），FBS Portal 使用 CSS Modules，FBS SC React 使用 Less + CSS Modules。

## 在仓库中逐项对应

### 条件渲染对照

| 意图 | React JSX | Vue Template |
| --- | --- | --- |
| 满足条件才渲染 | `{condition && <Comp />}` | `<Comp v-if="condition" />` |
| if/else | `{cond ? <A /> : <B />}` | `<A v-if="cond" /><B v-else />` |
| 条件控制显示 | `style={{ display: cond ? '' : 'none' }}` | `<Comp v-show="cond" />` |

### 列表渲染对照

| 意图 | React JSX | Vue Template |
| --- | --- | --- |
| 遍历数组渲染 | `{list.map(item => <Row key={item.id} />)}` | `<Row v-for="item in list" :key="item.id" />` |

### 事件处理对照

| 意图 | React JSX | Vue Template |
| --- | --- | --- |
| 点击事件 | `onClick={handler}` | `@click="handler"` |
| 传参 | `onClick={() => handler(id)}` | `@click="handler(id)"` |
| 输入变化 | `onChange={e => set(e.target.value)}` | `v-model="value"` 或 `@change="handler"` |
| 阻止默认行为 | `e.preventDefault()` | `@click.prevent="handler"` |

### 数据传递对照

| 意图 | React JSX | Vue Template |
| --- | --- | --- |
| 父→子传数据 | `<Child prop={value} />` | `<Child :prop="value" />` |
| 子→父通信 | `<Child onChange={handler} />` | `<Child @change="handler" />` |
| 跨层级注入 | Context | Provide/Inject |

## 常见错误与修正

### 忘记 JSX 的表达式语法

```jsx
// 错误：把 JSX 当成 HTML 写
<div class="active"></div>

// 正确：JSX 用 className
<div className="active"></div>
```

### Vue 模板中的 `v-for` 和 `v-if` 同级

```vue
<!-- 不推荐：两者在同一个元素上，v-if 优先级更高 -->
<div v-for="item in list" v-if="item.active" :key="item.id">

<!-- 推荐：用 computed 先过滤，或在外层包裹 -->
<template v-for="item in activeList" :key="item.id">
  <div>{{ item.name }}</div>
</template>
```

### 直接在 JSX `{}` 中写对象

```jsx
// 错误：对象不是合法的 React 子元素
<div>{ { name: 'FBS' } }</div>

// 正确：
<div>{ JSON.stringify({ name: 'FBS' }) }</div>
```

### `v-model` 与单向数据流的冲突

```vue
<!-- 错误：同时在 Props 上使用 v-model 会尝试修改父组件数据 -->
<InboundRow v-model="props.item.status" />

<!-- 正确：通过 emit 通知父组件修改 -->
<InboundRow :status="props.item.status" @update:status="handleStatusChange" />
```

## 练习

### 框架语法对应

将以下 React JSX 代码改写为 Vue Template 语法，保持功能等价：

```jsx
function FilterBar({ regions, selectedRegion, onSelect }) {
  return (
    <div className="filter-bar">
      {regions.length > 0 ? (
        <select value={selectedRegion} onChange={(e) => onSelect(e.target.value)}>
          <option value="">全部</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      ) : (
        <span>暂无可用区域</span>
      )}
    </div>
  );
}
```

### 条件渲染判断

FBS 代码片段中：

```vue
<EdsTag status="error" v-if="!dataLoading && basicInfo.urgentStatus">
  {{ $t('commonUrgent') }}
</EdsTag>
```

回答：
- 在什么条件下这个标签会渲染？
- `dataLoading` 是 `true` 时会怎样？
- `basicInfo.urgentStatus` 是 `undefined` 时会怎样？
- 如果把 `v-if` 改成 `v-show`，行为会有什么差异？

### 找出 SFC 的各层代码

打开你本地的 `fbs-sc-vue/src/views/inbound/IBT/detail/index.vue`，找出并标记：
- 一处 JavaScript 语言本身的代码（不属于 Vue 也不属于浏览器 API）
- 一处 Vue 特有的模板语法
- 一处浏览器 API 调用（如果有的话）
- 一处组件 Props 传递

### 参考答案

**9.1** 参考：
```vue
<template>
  <div class="filter-bar">
    <select v-if="regions.length > 0" :value="selectedRegion" @change="(e) => onSelect(e.target.value)">
      <option value="">全部</option>
      <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
    </select>
    <span v-else>暂无可用区域</span>
  </div>
</template>
```

**9.2** 标签在 `dataLoading` 不为 `true`（即数据加载完成后）且 `basicInfo.urgentStatus` 是 truthy 值时渲染。`dataLoading` 为 `true` 时不渲染。`urgentStatus` 是 `undefined` 时不渲染（falsy）。`v-if` 切换会销毁/创建 DOM 元素，`v-show` 只是切换 `display` CSS——标签始终存在于 DOM 中。

## 参考文献

- [React Learn — Your First Component](https://react.dev/learn/your-first-component) — React 组件基础
- [React Learn — Writing Markup with JSX](https://react.dev/learn/writing-markup-with-jsx) — JSX 语法规则
- [React Learn — Conditional Rendering](https://react.dev/learn/conditional-rendering) — 条件渲染
- [React Learn — Rendering Lists](https://react.dev/learn/rendering-lists) — 列表渲染
- [Vue 3 Guide — Template Syntax](https://vuejs.org/guide/essentials/template-syntax.html) — Vue 模板语法
- [Vue 3 Guide — Components Basics](https://vuejs.org/guide/essentials/component-basics.html) — 组件基础
- [MDN Introduction to events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events) — 浏览器事件
- [MDN Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) — DOM 概述
