# JavaScript 数据、类型与相等性：先读懂仓库判断分支

> 预计学习时间：90–130 分钟
> 一句话总结：从 FBS 前端的真实条件分支入手，理解 JavaScript 的数据类型、引用、空值、隐式转换与相等性规则，能够独立解释并修改仓库中的权限判断、路由守卫和状态筛选逻辑。

## 这一章解决什么问题

打开 FBS 任一前端仓库，你会看到大量条件判断：路由守卫里的 `to.route.name === 'fbsNoPermissions'`，权限检查中的 `permission.some(item => permissions.includes(item))`，错误处理中的 `if (data?.retcode !== 0)`。每一行都依赖 JavaScript 特有的类型规则和相等性行为。

后端同学转前端时，最常见的两类问题都与这些规则有关。第一，把 JavaScript 当成"去掉类型的 Java/C#"，忽略了隐式转换、`undefined` vs `null`、引用相等这些微妙但频繁出现的规则；第二，知道语法但读不懂代码为什么这样写，比如为什么用 `===` 而不是 `==`，为什么 `?.` 和 `??` 几乎出现在每一个页面组件里。

本章从 FBS 三个前端仓库的真实片段出发，先建立类型系统，再解释相等性规则，最后回到仓库阅读和修改条件分支。目标不是让你背完 ECMAScript 规范——而是让你在看到 `if (data?.retcode !== 0)` 时，能拆解出：`data` 可能是什么、`?.` 在什么情况下返回 `undefined`、`!==` 与 `!=` 的区别、`0` 在这里代表什么语义。

学完后你能做到三件事：解释四个真实判断片段的类型和结果；修复一个故意引入的空值边界问题；在看任何 FBS 页面代码时，不用猜一个表达式的结果会是什么。

> 本章示例来自 `fbs-sc-vue`、`fbs-frontend` 和 `fbs-sc-react` 三个仓库的 release 分支（2026-07-20）。代码行为可能随仓库演进；做实际需求时应重新打开当前工作树核验。

## 变量与基本类型：从权限判断片段出发

先看 `fbs-frontend/src/business/utils/permission.ts` 里的权限判断：

```javascript
export function hasPermission(permission) {
  const permissions = get(store.getState(), 'context.currentUser.permission_code_list', []);
  if (Array.isArray(permission)) {
    return permission.some(item => permissions.includes(item));
  }
  return permissions.includes(permission);
}
```

这段代码看起来简单，但后端同学要想明白每一层，至少需要理解：`const` 声明、数组、`Array.isArray` 返回值、`some` 和 `includes` 的布尔语义、以及函数没有写返回类型这件事本身的含义。我们逐层拆开。

### `const` 与 `let`：变量声明不携带运行时类型

JavaScript 用 `const` 和 `let` 声明变量。核心规则只有两条：`const` 声明的变量不能重新赋值；`let` 可以。两者都不限制修改变量指向的对象内部。

```javascript
const list = [];      // 不能再写 list = somethingElse
list.push('item');    // 但可以修改数组内容

let count = 0;
count = 1;            // let 允许重新赋值
```

在 FBS 代码中你几乎看不到 `var`。`var` 有函数作用域和变量提升等历史行为，三个 FBS 前端仓库通过 ESLint 或团队约定已经统一使用 `const`/`let`。作为惯例：默认用 `const`，只有确实需要重新赋值时改用 `let`。

`const` 不意味着"不可变"。`const permissions = []; permissions.push('code')` 完全合法。它限制的是变量名与值的绑定关系，而不是值本身。这个区别在后面讲到对象和数组时还会反复出现。

### 基本类型：值本身直接存储

JavaScript 有七种基本类型：`number`、`string`、`boolean`、`null`、`undefined`、`symbol`、`bigint`。后面两种在 FBS 前端仓库中极少出现，本章聚焦前五种。

基本类型变量直接保存值本身。赋值给另一个变量时，值被复制：

```javascript
let first = 10;
let second = first;
second = 20;
console.log(first);   // 10，不受 second 修改影响
```

`number` 是 IEEE 754 双精度浮点数。没有 int/float/double 的区分。`1` 和 `1.0` 是同一个值。

`string` 可以用单引号、双引号或反引号（模板字面量）。FBS 仓库中，JSX 属性习惯用双引号，普通字符串三种都有出现，模板字面量用于拼接变量：

```javascript
const path = `/portal/fbs/${module}`;  // 模板字面量嵌入变量
```

`boolean` 只有 `true` 和 `false`。注意 `'false'`（字符串）的布尔值是 `true`——这是一个高频陷阱，后面在 truthy/falsy 部分会详细讲。

### `typeof`：运行时类型检查

`typeof` 操作符返回类型的字符串表示。它有一些"反直觉"的结果，但记住核心几条就够用：

```javascript
typeof 42;           // 'number'
typeof 'hello';      // 'string'
typeof true;         // 'boolean'
typeof undefined;    // 'undefined'
typeof null;         // 'object' ← 历史遗留，记住即可
typeof [];           // 'object'
typeof {};           // 'object'
typeof (() => {});   // 'function'
```

`typeof null === 'object'` 是 JavaScript 最早版本的一个 bug，因为兼容性原因一直保留至今。判断 `null` 不能依赖 `typeof`，应该用 `value === null`。

对于数组，更可靠的方式是 `Array.isArray(value)`，正如上面权限代码中使用的那样。

## 对象、数组与引用：值被复制，引用也是

### 对象是引用类型

JavaScript 中，对象（包括普通对象 `{}`、数组 `[]`、函数、日期、正则等）都是引用类型。变量保存的是指向对象的**引用值**，而不是对象本身。

```javascript
const obj1 = { name: 'FBS' };
const obj2 = obj1;
obj2.name = 'Portal';
console.log(obj1.name);   // 'Portal' —— 两个变量指向同一个对象
```

赋值的规则没有变——`obj2 = obj1` 复制的仍然是值，只是这个值是引用值。结果就是两个变量指向同一个对象。这和 Java 中引用类型的行为类似，但 JavaScript 没有基本类型包装类的自动装箱/拆箱，对象字面量就是直接的对象值。

### 数组也是对象

```javascript
const list = ['a', 'b'];
const alias = list;
alias.push('c');
console.log(list);    // ['a', 'b', 'c']
console.log(list.length); // 3
```

数组在 JavaScript 中是一种特殊的对象。`typeof []` 返回 `'object'`，`Array.isArray` 专门用来区分数组和普通对象。数组有 `length` 属性、支持索引访问、有一组自己的方法（`push`、`filter`、`map`、`includes` 等），但这些都是在对象基础上的扩展。

### 不可变更新：为什么 React 要用展开运算符

三个 FBS 前端仓库都大量使用不可变更新模式。当你看到这样的代码：

```javascript
const nextState = { ...prevState, key: newValue };
const nextList = [...prevList, newItem];
```

它的作用是创建一个新对象或新数组，而不是修改原来的。React 依赖引用变化来判断是否需要重新渲染；Vue 3 虽然使用 Proxy 代理实现响应式，但展开运算符仍然是创建浅拷贝的标准方式。

注意是**浅**拷贝：

```javascript
const obj = { nested: { value: 1 } };
const copy = { ...obj };
copy.nested.value = 2;
console.log(obj.nested.value); // 2 —— 嵌套对象没有被复制
```

不可变更新的完整模式会在后续工程章节展开。这一章你只需要知道：`...` 创建的是浅拷贝，修改嵌套属性时仍然会影响原对象。

## 空值：`null`、`undefined` 与它们带来的防御性编程

### 两种空值的语义差异

JavaScript 有两种"空"值，它们的语义不同，但经常被混用：

- `undefined` 表示"不存在"或"未赋值"。变量声明但未初始化时是 `undefined`，对象访问不存在的属性时返回 `undefined`，函数没有 `return` 语句时返回 `undefined`。
- `null` 表示"有意为空"或"没有对象"。它通常由开发者显式赋值，表示一个变量目前不指向任何对象。

```javascript
let x;
console.log(x);              // undefined —— 声明但未赋值

const obj = {};
console.log(obj.nonexist);  // undefined —— 属性不存在

function noReturn() {}
console.log(noReturn());    // undefined —— 没有返回值

const manual = null;        // null —— 显式设置为空
```

在 FBS 代码中，两者通常不严格区分。API 返回数据中缺失的字段可能是 `null` 也可能是 `undefined`。重要的是统一使用安全的访问方式。

### 可选链 `?.`：不要在有 `null`/`undefined` 的地方深入访问

`?.` 是 FBS 前端代码中出现频率最高的操作符之一。它会在左值为 `null` 或 `undefined` 时短路并返回 `undefined`，而不是抛出 `TypeError`：

```javascript
const shopId = data?.shopInfo?.fbsShopId;
// 等价于：
// let temp = data === null || data === undefined ? undefined : data.shopInfo;
// temp = temp === null || temp === undefined ? undefined : temp.fbsShopId;
```

在之前看到的权限代码中，`permission.some(...)` 之所以能安全执行，是因为前面有 `Array.isArray(permission)` 的守卫。如果那段代码没有守卫而直接写 `permission?.some(item => ...)`，就能在 `permission` 为 `null`/`undefined` 时安全返回 `undefined` 而不是崩溃。

但 `?.` 返回 `undefined` 这件事本身值得注意。`undefined` 出现在条件判断中会被当作 `false`（见下一节 truthy/falsy），所以 `if (data?.retcode !== 0)` 中如果 `data` 是 `null`，表达式变成 `undefined !== 0`，结果是 `true`，会触发错误分支——这可能就是期望的行为（数据都没回来当然应该当作失败）。

### 空值合并 `??`：只在 `null`/`undefined` 时提供默认值

`??` 也称为 nullish coalescing。它和 `||` 的关键区别是：`??` 只在左值为 `null` 或 `undefined` 时取右值；`||` 在所有 falsy 值（`0`、`''`、`false`、`null`、`undefined`、`NaN`）上都取右值。

```javascript
const count = 0 || 10;       // 10 —— 0 是 falsy
const count2 = 0 ?? 10;      // 0 —— 0 不是 null/undefined

const name = '' || 'default';    // 'default'
const name2 = '' ?? 'default';   // ''
```

在 FBS 的分页和计数逻辑中，`??` 的正确使用很重要。如果一段代码写了 `pageSize || 20` 而有效的 `pageSize` 确实可能为 `0`，这个写法就会出错，必须改为 `pageSize ?? 20`。

## Truthy 与 Falsy：布尔上下文中的隐式转换

### 哪些值是 falsy

当 JavaScript 期望一个布尔值（如在 `if`、`while`、`&&`、`||`、`!` 中），非布尔值会被隐式转换为布尔。以下八个值是 falsy，其他所有值都是 truthy：

| Falsy 值 | 常见场景 |
| --- | --- |
| `false` | 布尔假 |
| `0`、`-0`、`0n` | 数值零 |
| `''`、`""`、` `` ` | 空字符串 |
| `null` | 显式空 |
| `undefined` | 未定义 |
| `NaN` | 非数值 |

### 在 FBS 页面判断中识别转换

回到 FBS 的路由守卫片段 `fbs-sc-vue/src/router/index.ts`：

```javascript
if (data.shopInfo.fbsTag) {
  // 卖家标签存在，进入正常流程
  if (!isCBSC && region === 'br' && data.shopInfo.lockByTax && to.route.name !== 'fbsTaxError') {
    return { path: '/portal/fbs/taxError' };
  }
}
```

`data.shopInfo.fbsTag` 本身是一个值。如果 `fbsTag` 不存在（`undefined`），条件分支的 `if (undefined)` 等同于 `if (false)`，不会进入。如果 `fbsTag` 是 `0` 或空字符串，也不会进入——但后端同学需要确认这个字段的实际类型：它是布尔值还是数字标签？如果是数字标签且可能为 `0`，那么 `0` 是 falsy 会导致逻辑错误，需要用更精确的判断如 `fbsTag !== undefined`。

再看权限判断中的 `Array.isArray(permission)`：如果 `permission` 是 `null` 或 `undefined`，`Array.isArray` 返回 `false`，条件分支不进入，函数走到最后的 `permissions.includes(permission)`——这行可能会因为 `permission` 为 `null`/`undefined` 而返回 `false`（`includes` 用 `SameValueZero` 比较，`null` 和 `undefined` 与普通值永不相等），不会崩溃。

### 显式转换：不要依赖隐式规则

虽然 JavaScript 允许隐式转换，FBS 代码中优先使用显式方式：

```javascript
// 推荐：显式判断
if (list && list.length > 0) { }
if (value !== null && value !== undefined) { }

// 避免：依赖隐式转换（虽然能跑，但意图不明确）
if (list.length) { }    // 0 是 falsy，意图是“非空列表”
if (!value) { }         // 太宽泛，0 和 '' 也会命中
```

## 相等性：`==`、`===` 与 `Object.is`

### `===` 是默认选择

`===`（严格相等）不进行类型转换。类型不同直接返回 `false`；类型相同再比较值或引用。

```javascript
1 === 1;         // true
'1' === 1;       // false —— 类型不同
null === null;   // true
undefined === undefined; // true
null === undefined;      // false
[] === [];       // false —— 两个不同的数组对象
```

在 FBS 三个前端仓库中，ESLint 配置禁止 `==`、强制使用 `===`。仓库中所有条件判断都用 `===` 和 `!==`。

### 对象和数组的比较是比较引用

这一点和 Java 的 `==` 行为一致：

```javascript
const a = [1, 2];
const b = [1, 2];
a === b;           // false —— 不同引用

const c = a;
a === c;           // true —— 同一引用
```

想要比较数组"内容是否相同"，通常需要逐个元素比较，或使用 `lodash.isEqual`。FBS 代码中如需要深度相等比较，会使用 lodash 的工具函数，不会直接用 `===` 比较两个数组或对象。

### `==` 的隐式转换规则（知道它会"努力让两边相同类型"即可）

你不需要背下 `==` 的全部转换规则。要知道的是：`null == undefined` 返回 `true`（这是 `==` 唯一被偶尔使用的场景）；其他情况一律使用 `===`。FBS 仓库的 ESLint 已经禁止 `==`，如果某处代码仍然使用了它，要么是故意的（需要团队 review），要么是历史遗留。

### `NaN` 的特殊性

`NaN` 是唯一一个不等于自身的值：

```javascript
NaN === NaN;       // false
Number.isNaN(NaN); // true —— 正确的 NaN 判断方式
```

在 FBS 的数值处理和表单校验中，如果后端接口可能返回非数值，前端通常会用 `isNaN` 或 `Number.isNaN` 做防御：

```javascript
if (Number.isNaN(parsedValue)) {
  // 处理非数值输入
}
```

## 在仓库中阅读条件判断：逐行拆解四个真实片段

### 片段一：权限检查

来源：`fbs-frontend/src/business/utils/permission.ts`

```javascript
export function hasPermission(permission) {
  const permissions = get(store.getState(), 'context.currentUser.permission_code_list', []);
  if (Array.isArray(permission)) {
    return permission.some(item => permissions.includes(item));
  }
  return permissions.includes(permission);
}
```

拆解：
- `const permissions` —— 从 Redux Store 中取出用户的权限码列表，`get`（lodash 的 `get`）的安全之处在于第三个参数 `[]`：如果路径中任何一层不存在，返回空数组而不是 `undefined`。
- `Array.isArray(permission)` —— 判断传入参数是单个权限码（字符串）还是多个权限码（数组）。这里不能依赖 truthy/falsy，因为字符串也可能是空字符串。
- `permission.some(item => permissions.includes(item))` —— 数组版本的逻辑：只要传入的任一权限码在用户权限列表中存在，就返回 `true`。`some` 找到一个匹配项就短路返回 `true`；全不匹配返回 `false`。
- `permissions.includes(permission)` —— 单权限码版本的逻辑：检查这个具体的权限码是否在用户列表中。

如果 `permission` 是 `null` 或 `undefined`，第一行 `Array.isArray` 返回 `false`，进入第二条路。`includes` 对 `null`/`undefined` 与权限码列表的比较不会匹配（权限码是字符串），所以返回 `false`。不会崩溃，但也不会有权限。

### 片段二：路由守卫中的条件链

来源：`fbs-sc-vue/src/router/index.ts`

```javascript
if (data.shopInfo.fbsTag) {
  if (!isCBSC && region === 'br' && data.shopInfo.lockByTax && to.route.name !== 'fbsTaxError') {
    return { path: '/portal/fbs/taxError' };
  }
}
```

拆解：
- `data.shopInfo.fbsTag` —— 隐式布尔转换。`undefined` 时为 `false`，不会进入。但如果 `fbsTag` 是数字 `0`，也会导致不进入——但根据上下文，`fbsTag` 在这里应为布尔值或非零数值，表示"卖家已打标"。
- `!isCBSC && region === 'br' && ...` —— 三个条件用 `&&` 串联。`&&` 是短路求值：只要左边为 `false`，右边不会执行。这里在 CBSC 条件下整个表达式不会进入锁税逻辑。
- `to.route.name !== 'fbsTaxError'` —— 如果当前已经在税务错误页，不重复跳转（避免死循环）。`!==` 是严格不等，没有类型转换。

### 片段三：API 响应错误判断

来源：`fbs-sc-vue/src/utils/request.js`

```javascript
if (notBlob && data?.retcode !== 0 && !config.__hiddenErrorMessage) {
  commonHandleAPIError(data);
}
```

拆解：
- `data?.retcode` —— 可选链。如果 `data` 为 `null` 或 `undefined`，整个表达式求值为 `undefined`。
- `data?.retcode !== 0` —— 注意这里：如果 `data` 是 `null`/`undefined`，`undefined !== 0` 是 `true`。这意味着数据完全缺失时也会触发错误处理——这通常是期望的行为。
- `!config.__hiddenErrorMessage` —— 逻辑非。某些场景下（比如静默预加载数据）前端不希望弹出 toast，会传入 `hiddenErrorMessage: false`。

假设 `data` 正常返回，`retcode` 为 `0` 表示业务成功。不为 `0` 就进入错误处理。这段逻辑的前提是 HTTP 状态码层面已经成功（200），只是业务返回码表示失败——这正是 `unpackData: false` 配置的设计意图。如果 HTTP 层就已经失败（如 500），会被 response interceptor 的 `error` 回调捕获，不会走到这里。

### 片段四：路由守卫中判断 VPI 管理权限

来源：`fbs-sc-vue/src/router/index.ts`

```javascript
if (vpiRouteNames.includes(to.route.name) && !data?.shopInfo?.allowVpiManagement) {
  return { path: '/portal/fbs/product/approved' };
}
```

拆解：
- `vpiRouteNames.includes(to.route.name)` —— `vpiRouteNames` 是预定义的数组：`['fbsVirtualBundlesList', 'fbsVirtualBundlesCreate', 'fbsVirtualBundlesEdit']`。`includes` 检查当前路由是否属于这三个 VPI 管理页面。
- `!data?.shopInfo?.allowVpiManagement` —— 双重可选链。如果 `data` 或 `shopInfo` 为 `null`/`undefined`，表达式结果为 `undefined`，`!undefined` 为 `true`，意味着"没有权限信息就当作没权限"，重定向到商品列表页。这是一种安全的默认拒绝策略。

## 常见错误与修正

### 把 `0` 或空字符串当作"没有值"

```javascript
// 错误：0 是合法的库存数，但 0 || default 会忽略它
const stock = response.stock || 999;
// 正确：
const stock = response.stock ?? 999;
```

### 忘记 `?.` 只短路 `null`/`undefined`

```javascript
// data 是空字符串 '' 时，data?.length 返回 0 而不是 undefined
// 如果后续依赖 undefined 来判断"数据不存在"，就会出错
const length = data?.length; // ''?.length = 0！
```

### `===` 比较数组和对象

```javascript
const permissions = ['a', 'b'];
permissions === ['a', 'b']; // false —— 不同引用
// 应使用：
permissions[0] === 'a' && permissions[1] === 'b'; // 或 .every()
```

### `typeof null === 'object'`

```javascript
// 错误：这个判断无法区分 null 和普通对象
if (typeof value === 'object') { /* ... */ }
// 正确：
if (value !== null && typeof value === 'object') { /* ... */ }
```

## 练习

### 预测输出

不运行代码，写出每一行的输出并解释原因。

```javascript
// 练习 A：基本类型与引用
const a = { count: 1 };
const b = a;
b.count = 2;
const c = 1;
let d = c;
d = 3;
console.log(a.count);  // ?
console.log(c);        // ?

// 练习 B：空值与相等性
const x = undefined;
const y = null;
console.log(x == y);   // ?
console.log(x === y);  // ?
console.log(x ?? 'fallback');   // ?
console.log(y ?? 'fallback');   // ?

// 练习 C：可选链与 truthy
const data = { shopInfo: { fbsTag: 0 } };
console.log(data?.shopInfo?.fbsTag !== undefined);  // ?
if (data?.shopInfo?.fbsTag) {
  console.log('进入分支');
} else {
  console.log('不进入');  // ?
}
```

### 修复空值边界

以下代码来自一个假想的 FBS 商品列表筛选组件。找出所有可能因空值而崩溃或行为不符合预期的地方，并修复：

```javascript
function getFilteredProducts(products, filter) {
  const result = [];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    if (filter.status === product.status) {
      if (product.name.includes(filter.keyword)) {
        result.push(product);
      }
    }
  }
  return result;
}
```

修复提示：`products` 可能为 `null`，`filter` 可能为 `null`，`filter.status` 可能为 `undefined`，`filter.keyword` 可能为空字符串，`product.name` 可能为 `null`。

### 判断仓库片段

打开你本地 `fbs-sc-vue` 仓库，找到 `src/views/inbound/IBT/detail/index.vue` 中 `v-if` 或 `v-show` 指令。选一个包含 `?.`、`!==` 或 `&&` 的判断表达式，解释：
- 这个表达式在什么条件下渲染对应元素
- 如果数据的每一层都为 `null`，最终行为是什么
- 如果修改一个条件（如把 `!==` 改成 `!=`），行为会有什么变化

### 参考答案

**8.1 A**: `a.count` 输出 `2`（`a` 和 `b` 指向同一个对象）。`c` 输出 `1`（基本类型赋值是复制，`d` 的修改不影响 `c`）。

**8.1 B**: `x == y` 为 `true`（宽松相等中 `null == undefined`）。`x === y` 为 `false`（严格相等中类型不同）。`x ?? 'fallback'` 为 `'fallback'`（`undefined` 触发 `??`）。`y ?? 'fallback'` 也为 `'fallback'`（`null` 同样触发 `??`）。

**8.1 C**: `data?.shopInfo?.fbsTag !== undefined` 为 `true`（`fbsTag` 是 `0`，不等于 `undefined`）。`if (data?.shopInfo?.fbsTag)` 中 `0` 是 falsy，不进入分支，输出 `'不进入'`。这正是前面提到的：数字型标签为 `0` 时不能用 truthy 判断，需要用 `!== undefined` 或明确的值比较。

## 参考文献

- [ECMAScript Language Specification — Types](https://tc39.es/ecma262/#sec-ecmascript-data-types-and-values) — JavaScript 类型系统的规范定义
- [MDN JavaScript Guide — Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types) — 变量声明、类型与字面量
- [MDN Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness) — `==`、`===` 与 `Object.is` 的完整对比
- [MDN Optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) — `?.` 操作符
- [MDN Nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) — `??` 操作符
- [MDN Truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) — truthy 与 falsy 的完整列表

