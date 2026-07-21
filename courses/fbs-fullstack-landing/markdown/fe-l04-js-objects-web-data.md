# JavaScript 常用对象与 Web 数据处理

> 预计学习时间：100–140 分钟
> 一句话总结：掌握 FBS 前端仓库中高频使用的 Array、Object、String、Date、URL/URLSearchParams 和 JSON 方法——能独立完成列表筛选、查询参数构造、接口数据转换和时间处理，并理解可变性、时区和精度边界。

## 这一章解决什么问题

前端代码有一半是在处理数据。从接口拿到 JSON 响应，转成表格能渲染的字段；从表单收集用户输入，转成接口需要的查询参数；从日期选择器拿到 Date 对象，格式化成后端期望的时间字符串——每一步都在调用 JavaScript 内建对象的方法。

后端同学看这部分代码时，最常遇到的问题是：不知道哪些方法修改原对象、哪些返回新对象（可变性陷阱）；不知道 `Date` 的时区行为在不同浏览器和 Node 环境中可能不一致；不知道 `URLSearchParams` 的存在，于是手写了复杂的字符串拼接。

本章不穷举 JavaScript 所有内建对象。我们从 FBS 仓库的实际用法出发，只讲三个前端仓库中真正出现频率高的那些方法和对象。学完后，你读 FBS 的列表筛选、导出参数构造、时间格式化代码时，不需要逐个查 MDN。

> 示例来自三个前端仓库的 release 分支（2026-07-20）。

## Array：列表操作的核心

### 是否修改原数组——最重要的第一课

JavaScript 的数组方法分为两类：修改原数组的（mutating）和返回新数组的（non-mutating）。FBS 代码遵循 React/Vue 的不可变更新原则，所以**返回新数组的方法占绝对主流**。但如果你不知道哪些方法会修改原数组，就可能在不该改的地方改了。

| 返回新数组（常用） | 修改原数组（注意） |
| --- | --- |
| `map`、`filter`、`concat`、`slice`、`flatMap` | `push`、`pop`、`shift`、`unshift`、`splice`、`sort`、`reverse` |
| 不会影响原数据，适合 React/Vue | 会改变原数组，React 中要避免直接用 |

```javascript
const list = [3, 1, 2];

// 返回新数组：原数组不变
const sorted = [...list].sort((a, b) => a - b); // sorted = [1,2,3], list = [3,1,2]

// 修改原数组：list 被改变了
list.sort((a, b) => a - b); // list = [1,2,3]
```

FBS 代码中如果需要排序，通常会在排序前用 `[...list]` 或 `list.slice()` 创建浅拷贝：

```javascript
const sortedList = [...requestList].sort((a, b) => a.ir_id - b.ir_id);
```

### `map`：转换每个元素

`map` 是 FBS 代码中出现频率最高的数组方法。它遍历数组，对每个元素应用回调函数，返回一个新数组：

```javascript
// 从 FBS 导出逻辑中抽象
const exportIds = inboundList.map(item => item.ir_id);
// [1001, 1002, 1003, ...]

// 构造下拉选项
const options = warehouseList.map(wh => ({
  label: wh.warehouseName,
  value: wh.warehouseId,
}));
```

`map` 的回调签名：`(element, index, array) => newValue`。FBS 代码中绝大多数只用第一个参数。

### `filter`：保留符合条件的元素

```javascript
// 从入库列表中筛选 urgent 状态的
const urgentList = inboundList.filter(item => item.urgentStatus);

// 筛选特定区域的
const regionList = inboundList.filter(item =>
  item.fbsWhsRegion === region
);
```

`filter` 始终返回新数组，即使只筛选出一个元素。没有匹配项时返回空数组 `[]`。

### `find` 与 `findIndex`：找第一个满足条件的

```javascript
// 找到指定 IR ID 的详情
const detail = inboundList.find(item => item.ir_id === selectedId);
if (detail) {
  // 找到了
}
```

`find` 返回第一个匹配的元素，如果找不到返回 `undefined`。`findIndex` 返回索引，找不到返回 `-1`。

### `some` 与 `every`：判断条件

```javascript
// 至少有一个是紧急的？
const hasUrgent = inboundList.some(item => item.urgentStatus);

// 全部都是已完成？
const allDone = inboundList.every(item => item.status === 'DONE');
```

这两个在权限检查、表单校验和条件渲染中频繁出现。`some` 找到第一个匹配就返回 `true`（短路），`every` 找到第一个不匹配就返回 `false`（短路）。空数组上 `some` 返回 `false`，`every` 返回 `true`（vacuous truth）。

### `includes`：是否包含某个值

```javascript
if (vpiRouteNames.includes(to.route.name)) {
  // 当前路由是 VPI 管理页面
}
```

`includes` 使用 `SameValueZero` 算法比较，对基本类型按值比较，对对象按引用比较。

### `reduce`：归约为单一值

```javascript
// 计算总费用
const totalFee = vasList.reduce((sum, item) => sum + item.estimatedFee, 0);

// 按状态分组
const grouped = inboundList.reduce((acc, item) => {
  const key = item.status;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {});
```

`reduce` 在 FBS 代码中用于汇总数值、分组和构建映射表。初始值参数（第二个参数）建议始终提供，否则空数组上的 `reduce` 会抛 TypeError。

### `flat` 与 `flatMap`

`flatMap` 在 FBS 代码中用于"一对多"的映射：

```javascript
// 把每个入库单的 SKU 列表合并成一个平铺列表
const allSkus = inboundList.flatMap(item => item.skuList);
```

等价于 `map` + `flat(1)`。

## Object：键值操作与属性遍历

### 属性访问：点号与方括号

```javascript
const config = { 'base-url': '/api', timeout: 5000 };
config['base-url']; // 方括号用于包含特殊字符的键
config.timeout;     // 点号用于标准标识符键
```

FBS 代码中绝大多数属性用点号访问。Vuex Store 的 getter 调用因为路径包含 `/`，必须用方括号：

```javascript
app.vue3VuexStore.getters['FBS_STORE/Shop/currentShop']
```

### `Object.keys`、`Object.values`、`Object.entries`

```javascript
const filter = { status: 'PENDING', region: 'br' };
Object.keys(filter);   // ['status', 'region']
Object.values(filter); // ['PENDING', 'br']
Object.entries(filter); // [['status', 'PENDING'], ['region', 'br']]
```

`Object.entries` 在需要同时处理键和值的循环中最有用：

```javascript
for (const [key, value] of Object.entries(filter)) {
  if (value !== undefined && value !== '') {
    queryParams.append(key, value);
  }
}
```

### 属性存在性检查

```javascript
// 检查属性是否存在（包括继承的属性）
if ('toString' in obj) { /* ... */ }

// 检查是否是对象自身（非继承）的属性
if (Object.hasOwn(obj, 'fbsTag')) { /* ... */ }

// 检查属性值是否为 undefined
if (obj.fbsTag !== undefined) { /* ... */ }
```

FBS 代码中大多数情况下用 `!== undefined` 就够了。当属性的存在本身就有意义（如区分 `{ key: undefined }` 和 `{}`）时用 `in` 或 `Object.hasOwn`。

### `Object.assign` 与展开运算符

```javascript
// 合并配置
const merged = Object.assign({}, defaultConfig, userConfig);

// 更常见的写法：展开运算符
const merged = { ...defaultConfig, ...userConfig };
// 后面的属性覆盖前面的同名属性
```

展开运算符在 FBS 代码中是默认的对象合并方式。

## String：API 字段、路径与显示文本

### 基本方法速查

| 方法 | 作用 | 返回新字符串？ | FBS 典型场景 |
| --- | --- | :---: | --- |
| `includes(sub)` | 是否包含子串 | - | 路由判断、权限码检查 |
| `startsWith(prefix)` | 是否以 prefix 开头 | - | URL 前缀检查 |
| `endsWith(suffix)` | 是否以 suffix 结尾 | - | 文件扩展名检查 |
| `indexOf(sub)` | 子串首次出现的位置 | - | 查找路径分隔符 |
| `slice(start, end)` | 截取子串 | 是 | 截取路径、截取 ID |
| `split(separator)` | 按分隔符拆成数组 | 是 | 解析逗号分隔的 ID 列表 |
| `replace(pattern, replacement)` | 替换匹配项 | 是 | URL 替换 |
| `trim()` | 去除首尾空白 | 是 | 表单输入清理 |
| `toLowerCase()` | 转小写 | 是 | 比较忽略大小写 |
| `toUpperCase()` | 转大写 | 是 | 区域码标准化 |

### 模板字面量

```javascript
const message = `入库单 ${irId} 已${status === 'DONE' ? '完成' : '处理中'}`;
const url = `/portal/fbs/inbound/detail?ir_id=${irId}&region=${region}`;
```

模板字面量用反引号 `` ` `` 包裹，`${expression}` 嵌入表达式。相比 `+` 拼接，模板字面量更易读，且支持多行字符串。

FBS 代码中 URL 构造几乎全部使用模板字面量。

## Number 与 Math：分页、库存与费用计算

### `parseInt` 与 `parseFloat`

```javascript
const page = parseInt(params.page, 10); // 第二个参数是进制，建议始终提供
const fee = parseFloat(response.estimatedFee); // 字符串 '12.50' → 数字 12.5
```

从 URL 查询参数或 API 响应中提取数值时，这两个函数是最常用的。`Number()` 也可以做类型转换，但对非数字字符串行为不同：`Number('10abc')` 返回 `NaN`，`parseInt('10abc', 10)` 返回 `10`。

### `toFixed` 与精度

```javascript
const displayFee = estimatedFee.toFixed(2); // '12.50'
```

`toFixed` 返回字符串，不是数字。用于展示，不用于继续计算。

### 数学运算与 `Math`

```javascript
Math.max(...list);    // 最大值
Math.min(...list);    // 最小值
Math.round(value);    // 四舍五入
Math.ceil(value);     // 向上取整
Math.abs(value);      // 绝对值
Math.random();        // 0 到 1 之间的随机数（不用于安全场景）
```

### `NaN` 与 `Infinity`

```javascript
const bad = parseInt('abc', 10); // NaN
const div = 1 / 0;               // Infinity

// 检查 NaN 的正确方式（NaN !== NaN）
Number.isNaN(bad);               // true
// 检查有限数值
Number.isFinite(value);          // false for NaN, Infinity, -Infinity
```

## Date：入库时间、截止日期与秒毫秒

### Date 对象的基础

```javascript
const now = new Date();              // 当前时刻
const specific = new Date('2026-07-20T10:30:00Z'); // ISO 8601 UTC 时间
const fromTimestamp = new Date(1720000000000);     // 毫秒时间戳
```

Date 在 JavaScript 中表示一个时刻（时间线上的一个点），内部存储为自 1970-01-01 UTC 以来的毫秒数。

### 时区陷阱

`new Date()` 和 `Date` 的方法行为取决于运行环境（浏览器/Node.js）的时区设置。这是跨地区 FBS 业务中最重要的边界问题：

```javascript
const date = new Date('2026-07-20T00:00:00'); // 无时区后缀 = 本地时区解释
const dateUTC = new Date('2026-07-20T00:00:00Z'); // Z = UTC

// 在巴西时区 (UTC-3) 的浏览器中：
date.getTime() === dateUTC.getTime(); // false！相差 3 小时
```

FBS 的最佳实践：API 通信统一使用 UTC 时间戳（毫秒或秒），或带时区的 ISO 8601 字符串。展示层用 `toLocaleString` 或 `Intl.DateTimeFormat` 按用户时区格式化。

### 秒与毫秒

```javascript
const timestampMs = Date.now();              // 毫秒
const timestampSeconds = Math.floor(Date.now() / 1000); // 秒
const fromSeconds = new Date(timestampSeconds * 1000);  // 秒转 Date
```

不同后端接口可能返回秒级或毫秒级时间戳。检查 API 文档或看字段名后缀（`_at` 还是 `_ts`，`mtime` 还是 `mtime_ms`）。在 FBS 的 Go 后端中 `time.Unix()` 返回秒，前端接收后需要 `* 1000`。

### 格式化方法

```javascript
const date = new Date();
date.toISOString();            // '2026-07-20T03:15:30.000Z' —— API 请求体常用
date.toLocaleDateString('zh-CN'); // '2026/7/20' —— 页面展示
date.getFullYear();            // 2026
date.getMonth();               // 6 ← 注意：0-based，7 月 = 6
date.getDate();                // 20
```

`getMonth()` 返回 0-11 是最常见的坑。`date.toISOString().slice(0, 10)` 是取 YYYY-MM-DD 字符串的可靠方式。

## JSON：前后端数据交换的通用语言

### `JSON.stringify`：序列化

```javascript
const payload = {
  ir_id: 12345,
  status_list: ['PENDING', 'PROCESSING'],
};
const body = JSON.stringify(payload);
// '{"ir_id":12345,"status_list":["PENDING","PROCESSING"]}'
// Axios 会自动做这一步，API 函数中不需要手动调用
```

需要注意的值：
- `undefined`、`Function`、`Symbol` 在序列化时会被忽略（对象属性）或转为 `null`（数组元素）。
- `Date` 会调用 `toISOString()` 转为 UTC 字符串。
- 循环引用会导致 `TypeError`。

### `JSON.parse`：反序列化

```javascript
const response = '{"retcode":0,"data":{"list":[],"total":0}}';
const parsed = JSON.parse(response);
console.log(parsed.data.list); // []
```

Axios 默认会调用 `JSON.parse` 解析响应体，但 FBS 的 request instance 配置了 `unpackData: false`，所以 `.then` 回调中拿到的 `response.data` 仍然是字符串（或已经被 Axios 解析后的对象，取决于 `responseType`）。实际行为以 request wrapper 配置为准。

### `JSON.parse` 的 `reviver` 参数

```javascript
// 将 ISO 日期字符串自动转为 Date 对象
const data = JSON.parse(text, (key, value) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value);
  }
  return value;
});
```

这在需要将 API 返回的时间字符串转为 Date 对象时很有用，但 FBS 代码中更常见的做法是在拿到数据后手动转换。

## URL 与 URLSearchParams：查询参数的正确打开方式

### 构造查询字符串

```javascript
const params = new URLSearchParams();
params.append('page', '1');
params.append('count', '20');
params.append('status', 'PENDING');
params.toString(); // 'page=1&count=20&status=PENDING'
```

对比手动拼接：

```javascript
// 不推荐：手动处理编码和边界
`page=${page}&count=${count}&status=${status}`

// 推荐：URLSearchParams 自动编码
const params = new URLSearchParams({ page, count, status });
```

FBS 代码中如果出现手动 URL 拼接，通常是因为 `URLSearchParams` 在某些旧版运行环境不可用（但 FBS 的 Node 16/20 和现代浏览器都支持）。

### 解析 URL 查询参数

```javascript
const url = new URL('https://example.com/page?ir_id=12345&region=br');
const irId = url.searchParams.get('ir_id'); // '12345'
```

### 从当前页面 URL 获取参数

```javascript
const params = new URLSearchParams(window.location.search);
const irId = params.get('ir_id');
```

FBS 的页面详情和列表筛选经常从 URL 中读取初始参数。

### 注意点

`URLSearchParams` 的值始终是字符串。需要数值或布尔值时要手动转换：

```javascript
const page = parseInt(params.get('page'), 10) || 1;
const urgent = params.get('urgent') === 'true';
```

## Map 与 Set：特殊场景工具

### Map：任意键类型的键值对

```javascript
const cache = new Map();
cache.set(irId, { data: inboundDetail, timestamp: Date.now() });
const cached = cache.get(irId);
cache.has(irId);    // true/false
cache.delete(irId);
```

相比普通 Object，Map 的优势是键可以是任意类型（包括对象）且有明确的 `.size` 属性。FBS 代码中 Map 用于缓存、ID 映射和去重。

### Set：唯一值集合

```javascript
const selectedIds = new Set();
selectedIds.add(irId);
selectedIds.has(irId);  // true
selectedIds.delete(irId);
// 数组去重
const uniqueRegions = [...new Set(inboundList.map(item => item.region))];
```

Set 在 FBS 中用于选中项管理、去重和存在性检查。

## 综合：完成一个列表筛选数据转换

结合本章学到的所有方法，完成一个从接口数据到页面展示数据的完整转换：

```javascript
// 原始响应
const response = {
  retcode: 0,
  data: {
    list: [
      { ir_id: 1001, status: 'PENDING', mtime: 1720000000, whs_region: 'br', urgent: 1 },
      { ir_id: 1002, status: 'DONE', mtime: 1719900000, whs_region: 'sg', urgent: 0 },
      { ir_id: null, status: 'CANCELLED', mtime: 1719800000, whs_region: 'br', urgent: 1 },
    ],
    total: 3,
  }
};

// 转换：过滤无效数据 → 字段映射 → 时间格式化 → 排序
function transformInboundList(response) {
  const list = response?.data?.list ?? [];
  
  return list
    .filter(item => item.ir_id !== null)              // 移除异常记录
    .map(item => ({
      id: item.ir_id,
      status: item.status,
      // 秒级时间戳转毫秒再格式化
      updatedAt: new Date(item.mtime * 1000).toLocaleDateString('zh-CN'),
      region: item.whs_region.toUpperCase(),
      isUrgent: item.urgent === 1,                    // 数字转布尔
    }))
    .sort((a, b) => b.id - a.id);                     // 按 ID 降序
}

console.log(transformInboundList(response));
// [
//   { id: 1002, status: 'DONE', updatedAt: '2026/7/18', region: 'SG', isUrgent: false },
//   { id: 1001, status: 'PENDING', updatedAt: '2026/7/19', region: 'BR', isUrgent: true },
// ]
```

这个转换链条体现了 FBS 前端数据处理的核心模式：链式调用，不修改输入，每一步做一件事。

## 练习

### 不修改输入的列表转换

给定以下输入，编写一个函数，返回按 `estimatedFee` 降序排列、且只包含费用大于 0 的 SKU 列表。每个元素只保留 `sku_id`、`fee_display`（格式化为 `$XX.XX`）、`is_free`（布尔值）。

```javascript
const input = [
  { sku_id: 'A001', estimated_fee: '12.5', fee_currency: 'USD' },
  { sku_id: 'A002', estimated_fee: '0', fee_currency: 'USD' },
  { sku_id: 'A003', estimated_fee: '8.0', fee_currency: 'USD' },
  { sku_id: 'A004', estimated_fee: null, fee_currency: 'USD' },
];
```

要求：不能修改 `input` 数组和其中的任何对象。

### 时间处理

FBS 后端返回的时间戳为秒级 `1720000000`。编写一个函数 `formatTime(timestampInSeconds, locale)`，返回适合在页面上展示的时间字符串。如果 `timestampInSeconds` 为 `null` 或 `undefined`，返回 `'--'`。如果 `locale` 为 `'zh-CN'`，格式为 `2026/7/20`；如果为 `'en-US'`，格式为 `7/20/2026`。

### URL 参数构造

编写函数 `buildFilterUrl(basePath, params)`：
- `basePath` 如 `/portal/fbs/inbound/list`
- `params` 如 `{ page: 1, status: 'PENDING', region: 'br' }`
- 如果 `params` 中某个值为 `null`、`undefined` 或空字符串，不包含在 URL 中
- 返回完整 URL 字符串

### 参考答案

**10.1** 参考实现：
```javascript
function transform(input) {
  return input
    .filter(item => parseFloat(item.estimated_fee) > 0)
    .map(item => ({
      sku_id: item.sku_id,
      fee_display: `$${parseFloat(item.estimated_fee).toFixed(2)}`,
      is_free: false,
    }))
    .sort((a, b) => parseFloat(b.fee_display.slice(1)) - parseFloat(a.fee_display.slice(1)));
}
```

**10.2** 参考实现：
```javascript
function formatTime(timestampInSeconds, locale = 'zh-CN') {
  if (timestampInSeconds == null) return '--';
  const date = new Date(timestampInSeconds * 1000);
  return date.toLocaleDateString(locale);
}
```

**10.3** 参考实现：
```javascript
function buildFilterUrl(basePath, params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      search.append(key, value);
    }
  }
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}
```

## 参考文献

- [MDN Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — Array 全部方法
- [MDN Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) — Object 静态方法
- [MDN String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) — String 方法
- [MDN Date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) — Date 对象
- [MDN JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) — JSON 方法
- [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) — 查询参数构建
- [MDN Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) — Map 对象
- [MDN Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) — Set 对象
