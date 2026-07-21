# Promise、async/await 与事件循环：读懂请求和页面副作用

> 预计学习时间：110–150 分钟
> 一句话总结：理解 Promise 的状态、`await` 的暂停语义、微任务执行顺序和错误传播——能读懂 FBS 页面中任何异步请求、数据初始化和并发组合，并能修复常见的漏 `await` 和漏错误处理问题。

## 这一章解决什么问题

后端同学对"异步"并不陌生。Go 有 goroutine + channel，Java 有线程池 + Future。但 JavaScript 的异步模型和他们都不一样：单线程、事件循环、Promise 链、`async`/`await` 只是语法糖、`Promise.all` 的失败即停行为……这些规则组合在一起，常常让第一次读到 FBS 页面代码的后端研发掉进同一个坑——以为 `await` 后面一定能拿到值，以为代码顺序就是执行顺序，忘了 `.catch` 或 `try/catch`。

本章从 FBS 的真实异步调用出发：API 请求、页面初始化 action、远端组件加载、并发导出等。你会先看懂一个请求从发起到 UI 更新的完整链路，然后理解事件循环如何调度"网络回来的数据"和"用户点击的按钮"之间的先后顺序。学完后你会发现，之前觉得"神秘"的 loading 状态切换、错误 toast 弹出时机、同时发多个请求的最佳写法，背后全是同一套规则在工作。

> 示例来自三个前端仓库的 release 分支（2026-07-20）。实际开发时以当前工作树为准。

## Promise：一个可能还未完成的值

### Promise 有三种状态

JavaScript 的 Promise 表示一个异步操作的最终结果。它只能是三种状态之一：

- **pending**：操作还在进行中，结果未知。
- **fulfilled**：操作成功，有一个值。
- **rejected**：操作失败，有一个原因（错误）。

状态一旦从 pending 变为 fulfilled 或 rejected，就永久固定，不能再次改变。

```javascript
const promise = getRequestList({ status: 'PENDING' });
console.log(promise); // Promise { <pending> } —— 请求还没返回
```

`getRequestList` 返回的不是数据，而是 Promise。这一点和后端同学习惯的同步 API 完全不同。你不能：

```javascript
// 错误示范——这样永远拿不到数据
const data = getRequestList({ status: 'PENDING' });
console.log(data); // Promise 对象，不是列表数据
```

### `.then` 和 `.catch`：在 Promise 完成后执行

```javascript
getRequestList({ status: 'PENDING' })
  .then(response => {
    console.log(response.data); // 请求成功后的数据
  })
  .catch(error => {
    console.error('请求失败', error);
  })
  .finally(() => {
    console.log('无论成功还是失败都会执行');
  });
```

`.then` 的第一个参数是 fulfilled 回调，第二个参数（可选）是 rejected 回调。但在 FBS 代码中，几乎总是用 `.catch` 单独处理错误，保持清晰的成功/失败分离。

### `.then` 返回新 Promise，可以链式调用

这是 Promise 最强大的特性之一：每个 `.then` 返回一个新的 Promise，可以继续链式调用：

```javascript
getRequestList({ status: 'PENDING' })
  .then(response => response.data)          // 提取 data
  .then(data => data.list)                  // 提取 list
  .then(list => list.filter(item => item.urgent))  // 过滤
  .catch(error => console.error(error));
```

每一步的返回值都会自动包装成 Promise。即使 `.then` 的回调返回了一个普通值，链上的下一个 `.then` 也能拿到它。

注意：`.catch` 放在链的末尾可以捕获前面任何一步的错误。但如果 `.catch` 之后还有 `.then`，后面的 `.then` 仍会执行——`.catch` 返回的也是 Promise。

### Promise 构造函数：包装回调风格的 API

在 FBS 代码中不常见（Axios 已经返回 Promise），但了解它对理解旧代码很有帮助：

```javascript
function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('done');
    }, ms);
  });
}
```

`resolve` 将 Promise 转为 fulfilled，`reject` 将其转为 rejected。Promise 构造函数是同步执行的，但 `resolve`/`reject` 通常是异步调用的。

## `async`/`await`：让异步代码读起来像同步

### 基础语法

`async` 函数自动返回 Promise。`await` 暂停函数执行直到 Promise 完成：

```javascript
async function loadInboundPage() {
  const response = await getRequestList({ status: 'PENDING' });
  // 这行在请求完成后才执行
  console.log(response.data);
  return response.data;
}
```

这是 `getRequestList().then(response => { ... })` 的等价写法。但 `await` 让代码从上到下读起来像同步流程，不需要嵌套回调。

### 关键误区：`await` 不会阻塞主线程

"暂停执行"是指暂停**当前 async 函数**，不是暂停整个 JavaScript 线程。在 `await` 等待网络请求的几百毫秒里，用户的点击、滚动、定时器、其他 async 函数全都正常运作。

```javascript
async function loadA() {
  const data = await slowRequest(); // 等了 2 秒
  console.log('A done');
}
async function loadB() {
  console.log('B done instantly');
}
loadA(); // 开始等待
loadB(); // 立即执行，不会等 loadA 完成
// 输出顺序：B done instantly  →  (2 秒后)  A done
```

### 错误处理：`try/catch`

```javascript
async function loadPage() {
  try {
    const response = await getRequestList({ status: 'PENDING' });
    return response.data;
  } catch (error) {
    console.error('加载失败', error);
    return []; // 返回空列表作为降级
  }
}
```

`catch` 可以捕获 `await` 后面 Promise 的 rejected 状态。如果 `async` 函数内部抛出的错误没有被 `catch`，它会作为函数返回 Promise 的 rejection 向外传播。

```javascript
async function faultyLoad() {
  const data = await getRequestList({});
  data.nonexistent.method(); // 同步抛出 TypeError
  return data;
}
// faultyLoad() 返回的 Promise 是 rejected，可以 .catch 捕获
```

### 忘记 `await` 的后果

这是后端同学最常踩的坑：

```javascript
// 错误：忘记 await
const response = getRequestList({ status: 'PENDING' });
console.log(response.data); // undefined —— response 是 Promise 对象
response.list.filter(...);  // TypeError: Cannot read properties of undefined

// 正确：
const response = await getRequestList({ status: 'PENDING' });
```

如何发现这类问题？如果变量出现在 `response.data` 这类访问模式中，但你在 `response` 上找不到 `.data`，它很可能是一个未 `await` 的 Promise。

## 并发：`Promise.all`、`Promise.allSettled` 与串行

### `Promise.all`：全部成功或任意失败

当多个请求互不依赖时，用 `Promise.all` 同时发起，等待全部完成：

```javascript
const [inboundList, productList, shopInfo] = await Promise.all([
  getRequestList({ status: 'PENDING' }),
  getProductList({ status: 'ACTIVE' }),
  getShopInfo(),
]);
```

关键行为：**只要任何一个 Promise rejected，`Promise.all` 立即 rejected**，其余 Promise 的结果被丢弃（但它们请求仍在进行）。这意味着如果你用 `Promise.all` 处理三个独立请求，一个失败就会丢掉另外两个成功的结果。这在表单初始化和数据看板中可能是严重问题。

### `Promise.allSettled`：等待全部完成，不管成败

```javascript
const results = await Promise.allSettled([
  getRequestList({ status: 'PENDING' }),
  getProductList({ status: 'ACTIVE' }),
  getShopInfo(),
]);

// results = [
//   { status: 'fulfilled', value: {...} },
//   { status: 'rejected', reason: Error(...) },
//   { status: 'fulfilled', value: {...} },
// ]

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    console.log(`请求 ${index} 成功`, result.value);
  } else {
    console.error(`请求 ${index} 失败`, result.reason);
  }
});
```

当每个请求有自己的降级策略（如缓存、默认值、空列表），不需要因为一个失败就放弃全部结果时，用 `Promise.allSettled` 更合适。FBS 的数据看板和多模块首页通常会倾向于这种模式。

### `Promise.race`：谁先完成用谁

`Promise.race` 返回第一个 settled 的 Promise 的结果。FBS 代码中常用于超时控制：

```javascript
const result = await Promise.race([
  getRequestList({ status: 'PENDING' }),
  new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 10000)),
]);
```

### 串行 vs 并行的选择

```javascript
// 串行：第二个请求依赖第一个的结果
const user = await getUserInfo();
const permissions = await getUserPermissions(user.id);

// 并行：两个请求互不依赖
const [config, list] = await Promise.all([
  getConfig(),
  getRequestList({ status: 'PENDING' }),
]);
```

判断标准只有一条：第二个请求的参数是否来自第一个请求的结果。不要因为"看起来更安全"就写成串行——两个独立请求串行会浪费一倍以上的等待时间。

## 事件循环：为什么 `await` 后面不一定是下一行

### 宏任务与微任务

JavaScript 的事件循环是单线程的，但通过任务队列管理异步操作。两类任务：

- **宏任务**（task）：`setTimeout`、`setInterval`、I/O、UI 渲染、事件监听。
- **微任务**（microtask）：Promise 的 `.then`/`.catch`/`.finally`、`await` 后面的代码（本质是 `.then`）、`queueMicrotask`、`MutationObserver`。

执行规则：先执行一个宏任务，然后清空所有微任务队列，再取下一个宏任务。

### 经典执行顺序示例

```javascript
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

console.log('4');

// 输出：1 → 4 → 3 → 2
```

为什么？`console.log('1')` 和 `console.log('4')` 是同步代码，在当前宏任务中立即执行。`setTimeout` 的回调放入宏任务队列。`Promise.resolve().then(...)` 的回调放入微任务队列。

当前宏任务执行完后，事件循环先检查微任务队列——`console.log('3')` 被执行。然后才从宏任务队列取出 `console.log('2')`。

### `await` 的微观行为

```javascript
async function demo() {
  console.log('A');
  await Promise.resolve();
  console.log('B');
}
console.log('C');
demo();
console.log('D');
// 输出：C → A → D → B
```

`console.log('C')` 和 `demo()` 都是同步。`demo` 内部先 `console.log('A')`，然后遇到 `await`——这里很关键：`await` 把它**后面的代码**（`console.log('B')`）放入微任务队列，然后 `demo` 函数暂停，控制权交回调用方。于是 `console.log('D')` 在同步代码中继续执行。同步代码执行完后，微任务队列中的 `console.log('B')` 被执行。

### 在 FBS 代码中的应用

理解事件循环对阅读 FBS 页面初始化代码非常重要：

```javascript
async function initPage() {
  this.loading = true;          // 1. 同步：设置 loading 状态
  try {
    const data = await getRequestList(params); // 2. 发起请求，后续代码进入微任务
    this.list = data.list;      // 3. 在微任务中更新列表
  } finally {
    this.loading = false;       // 4. 在微任务中清除 loading
  }
}
```

1→2→3→4 的顺序看似自然，但要注意：第 1 步设置 `loading = true` 后，到第 3 步更新列表之间有网络请求的延迟。在这期间，UI 已经渲染了 loading 状态，用户可以正常交互。如果代码在 `await` 之前漏掉了 `loading = true`，用户会在请求期间看到旧数据或无反馈状态。

另外，如果你想在数据加载完后"确保 UI 已经更新"，直接在 `this.list = data.list` 之后访问 DOM 可能拿不到新渲染——UI 渲染也是一个宏任务，在微任务清空后才会执行。

## 异步遍历与初始化模式

### 串行遍历中的 `await`

```javascript
// 如果需要顺序执行（每个请求依赖前一个的结果）
async function processItems(items) {
  for (const item of items) {
    const result = await processItem(item.id);
    console.log(result);
  }
}

// 不要用 forEach + async——forEach 不等待回调返回的 Promise
items.forEach(async (item) => {
  await processItem(item.id); // 这个 await 没有用！
});
```

`forEach` 的签名是 `(callback) => void`，它不会等待回调返回的 Promise。用 `for...of` 替代。

### 页面初始化中的异步 pattern

FBS 页面的典型初始化模式：

```javascript
async mounted() {
  try {
    await Promise.all([
      this.fetchInboundList(),
      this.fetchProductList(),
    ]);
  } catch (error) {
    this.error = error.message;
  } finally {
    this.loading = false;
  }
}
```

或者 React 函数组件中的等效写法：

```javascript
useEffect(() => {
  let cancelled = false;
  async function load() {
    setLoading(true);
    try {
      const [list, config] = await Promise.all([
        getRequestList(filter),
        getConfig(),
      ]);
      if (!cancelled) {
        setList(list);
        setConfig(config);
      }
    } catch (error) {
      if (!cancelled) setError(error.message);
    } finally {
      if (!cancelled) setLoading(false);
    }
  }
  load();
  return () => { cancelled = true; };
}, [filter]);
```

`cancelled` 标志位解决的是组件卸载后的 setState 警告——当 `await` 期间用户导航到其他页面，Promise 仍然会 resolve，但组件已经不存在了。

## 在仓库中阅读异步代码

### 六.1 Vuex action 的异步链

FBS SC Vue 仓库中，Vuex action 是典型的异步函数：

```javascript
// 简化自 FBS_STORE 的初始化 action
async function initFBSStore({ commit, dispatch, state }) {
  commit('SET_INIT_LOADING', true);
  try {
    const [sellerInfo, shopInfo] = await Promise.all([
      dispatch('fetchSellerInfo'),
      dispatch('fetchShopInfo'),
    ]);
    commit('SET_SELLER_INFO', sellerInfo);
    commit('SET_SHOP_INFO', shopInfo);
    if (sellerInfo.enableOneClickRegistration) {
      await dispatch('fetchClientRequestStatus');
    }
  } finally {
    commit('SET_INIT_LOADING', false);
  }
}
```

注意这里用了两层 `dispatch`：外层 action 通过 `dispatch` 调用内层 action。每个 `dispatch` 返回一个 Promise，所以可以用 `await`。`Promise.all` 确保两个不互依赖的请求同时发出。如果 `enableOneClickRegistration` 为 true，再串行发起第三个请求。

### 六.2 请求拦截器中的异步

```javascript
itemRequest.interceptors.response.use(
  (response) => {           // 同步回调
    response = handleErrorMsg(response);
    return response;
  },
  (error) => {              // 同步回调
    return Promise.reject(error);
  },
);
```

Axios 的 response interceptor 回调是同步的。如果需要在拦截器中做异步操作（如刷新 token 后重试），必须返回一个 Promise：

```javascript
itemRequest.interceptors.response.use(
  undefined,
  async (error) => {
    if (error.response?.status === 401) {
      await refreshToken();
      return itemRequest(error.config); // 用新 token 重试
    }
    return Promise.reject(error);
  }
);
```

### 六.3 并发导出任务

FBS 的导出功能经常涉及多个异步任务的并发：

```javascript
// 简化自批量导出逻辑
async function batchExport(ids) {
  const tasks = ids.map(id => exportForPdf({ id }));
  const results = await Promise.allSettled(tasks);

  const succeeded = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason.message);

  return { succeeded, failed };
}
```

这里用 `Promise.allSettled` 而非 `Promise.all`，因为一个导出失败不应该阻止其他导出任务。

## 常见错误与修正

### 漏 `await`

```javascript
// 错误
const data = fetchData();
processData(data); // data 是 Promise

// 正确
const data = await fetchData();
processData(data);
```

### `Promise.all` 中一个失败全部丢弃

```javascript
// 可能不好：仪表盘某个模块失败就让整个页面崩溃
const [sales, inventory, alerts] = await Promise.all([
  getSalesData(),
  getInventory(),
  getAlerts(),
]);

// 更好：每个模块有自己的降级
const [sales, inventory, alerts] = await Promise.allSettled([
  getSalesData(),
  getInventory(),
  getAlerts(),
]).then(results => results.map(r =>
  r.status === 'fulfilled' ? r.value : null
));
```

### `forEach` + `async` 不生效

```javascript
// 错误：forEach 不等待
items.forEach(async item => { await processItem(item); });

// 正确：
for (const item of items) { await processItem(item); }
// 或并发：
await Promise.all(items.map(item => processItem(item)));
```

### `await` 后组件已卸载

React 中组件卸载后的异步更新是经典 bug：

```javascript
useEffect(() => {
  let cancelled = false;
  async function load() {
    const data = await getRequestList({});
    if (cancelled) return;  // 组件已卸载，不更新状态
    setList(data.list);
  }
  load();
  return () => { cancelled = true; };  // 清理函数
}, []);
```

### 错误被静默吞掉

```javascript
// 错误：错误被吞掉，页面永远 loading
async function load() {
  const data = await getRequestList({}).catch(() => {}); // data 是 undefined
  setLoading(false);
  setList(data.list); // TypeError
}

// 正确：至少记录错误或设置错误状态
async function load() {
  try {
    const data = await getRequestList({});
    setList(data.list);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
}
```

## 练习

### 预测执行顺序

```javascript
console.log('start');

setTimeout(() => console.log('timeout'), 0);

Promise.resolve()
  .then(() => console.log('then 1'))
  .then(() => console.log('then 2'));

async function run() {
  console.log('async start');
  await Promise.resolve();
  console.log('async after await');
}
run();

console.log('end');
```

### 修复漏 `await`

以下代码意图是获取列表并过滤：

```javascript
function getUrgentList(params) {
  const response = getRequestList(params);
  const list = response.data.list;
  return list.filter(item => item.urgentStatus);
}
```

找出问题并修复。如果有多个修复方式，说明各自适用场景。

### 并发改造

以下代码中，三个请求互相独立，但目前的写法是串行的。改写为并行版本，并为每个请求提供独立的错误处理（任一请求失败不影响其他请求的结果展示）：

```javascript
async function loadDashboard() {
  const stats = await getStats();
  const recentActivity = await getRecentActivity();
  const alerts = await getAlerts();
  return { stats, recentActivity, alerts };
}
```

### 参考答案

**8.1** 输出顺序：`start` → `async start` → `end` → `then 1` → `then 2` → `async after await` → `timeout`。关键理解点：`async after await` 需要在微任务队列中排队，排在 `then 1` 的微任务之后、`then 2` 之后，因为 `await Promise.resolve()` 等价于 `Promise.resolve().then(() => { ... })`。而 `timeout` 是宏任务，在所有微任务之后。

**8.2** 修复：把函数声明为 `async`，加 `await`。`const response = await getRequestList(params);`。另一个方式是用 `.then`：`return getRequestList(params).then(response => response.data.list.filter(...))`。前者更可读，适合有多个异步操作的场景；后者更紧凑，适合简单的链式处理。

**8.3** 并行版本参考：
```javascript
async function loadDashboard() {
  const [statsR, activityR, alertsR] = await Promise.allSettled([
    getStats(),
    getRecentActivity(),
    getAlerts(),
  ]);
  return {
    stats: statsR.status === 'fulfilled' ? statsR.value : null,
    recentActivity: activityR.status === 'fulfilled' ? activityR.value : [],
    alerts: alertsR.status === 'fulfilled' ? alertsR.value : [],
  };
}
```

## 参考文献

- [MDN Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) — Promise API 完整文档
- [MDN async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) — `async`/`await` 语法
- [MDN Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) — Promise 使用指南
- [WHATWG Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) — 事件循环的规范定义
- [Jake Archibald: In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0) — JSConf.Asia 事件循环可视化演讲
