# TypeScript：从接口数据到组件 Props 的类型链

> 预计学习时间：110–150 分钟
> 一句话总结：读懂并编写 FBS 仓库中的 TypeScript 类型——接口、联合类型、泛型、类型收窄和工具类型——能为一个未类型化的 API 加最小类型并通过 type-check，理解类型只在编译期存在。

## 这一章解决什么问题

打开 FBS Portal 的 `src/apis/inbound.ts` 或 SC Vue 的任意 `.ts` 文件，首先看到的就是类型声明。后端同学对类型并不陌生——Go 的 `struct` 和 `interface`、Java 的 `class` 和泛型。但 TypeScript 的类型系统和它们有本质差异：TypeScript 是**结构类型**而非名义类型，类型在**运行时完全消失**（擦除），泛型比 Java 更灵活但也更"宽松"。

本章的核心目标是帮你建立一套读码习惯：看到 `interface InboundRequestShopSearchQuery` 时，知道这不是 Java 的 interface（不强制 implements），而是对对象形状的描述；看到 `Partial<ConfigParams>` 时，知道它把所有属性变成可选；看到 `(params: Params, configParams: RequestConfig = {}): ApiPromise<Data>` 时，能拆解泛型参数链。

学完后，你不需要手写复杂的类型体操。但你需要能在 FBS 仓库中：指出一个接口类型在编译时和运行时的区别，为未标注类型的 API 响应添加最小类型，以及读懂 `createApi` 这样的高阶泛型工厂函数。

> 本章示例来自三个前端仓库的 release 分支（2026-07-20）。TypeScript 版本以 SC 两仓的 4.7 和 Portal 的 4.4 为基线，不使用高版本语法。

## 核心概念：类型声明与类型擦除

### 类型注解 vs 运行时值

TypeScript 的 `interface`、`type`、`:` 类型注解只在编译时存在。编译成 JavaScript 后，它们完全被擦除：

```typescript
// TypeScript 源码
interface InboundItem {
  ir_id: number;
  status: string;
}

const item: InboundItem = { ir_id: 1001, status: 'PENDING' };

// 编译为 JavaScript 后：
// interface InboundItem 消失了
const item = { ir_id: 1001, status: 'PENDING' };
```

这意味着你不能在运行时做 `item instanceof InboundItem` 或反射获取接口的字段列表。TypeScript 提供的是**编译期**安全网，不是运行时类型信息。

### 结构类型系统

TypeScript 判断两个类型是否兼容，依据的是**形状**（有哪些属性、属性类型是什么），而不是名称或继承关系：

```typescript
interface Point {
  x: number;
  y: number;
}

interface Coordinate {
  x: number;
  y: number;
}

const p: Point = { x: 1, y: 2 };
const c: Coordinate = p; // 合法！形状兼容，不管名字
```

这和 Java/C# 的名义类型系统完全不同。在 FBS 代码中，这意味着两个不同文件里定义了相同形状的接口，它们可以互相赋值，不需要显式的类型转换或继承关系。

结构类型的实用价值：API 的响应类型不需要从某个基类继承，只要形状匹配就行。

### 类型推断

类型注解是可选的，TypeScript 会根据赋值推断类型：

```typescript
let count = 0;      // 推断为 number
const list = [];    // 推断为 never[] —— 空数组没有类型线索

const list2 = getRequestList(data); // 如果函数有返回类型注解，list2 自动获得类型
```

FBS 代码中，函数返回值和简单变量通常依赖推断，但 API 函数参数、组件 Props 和 Store state 会显式注解。

## `interface` 与 `type`：描述对象形状

### `interface`：描述对象的结构

FBS Portal 的 API 类型主要使用 `interface`：

```typescript
export interface ConfigParams {
  region: string;
  cb_option: number;
  shipping_method?: number;    // ? 表示可选属性
  pickup_method?: number;
  migrate_cal_available_date?: boolean;
  display_remaining_quota_sc?: boolean;
}
```

`interface` 可以描述对象形状。`?` 表示可选属性——该属性可以不存在，但不能是错误类型。

```typescript
const valid: ConfigParams = { region: 'br', cb_option: 1 };
const missing: ConfigParams = {};                       // 错误：region 和 cb_option 是必需的
const wrong: ConfigParams = { region: 'br', cb_option: '1' }; // 错误：cb_option 应该是 number
```

### `type`：类型别名

`type` 可以为任意类型起别名：

```typescript
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type PermissionCode = string;  // 语义别名
type Callback<T> = (value: T) => void;
```

FBS 代码中，简单别名和联合类型通常用 `type`，复杂对象形状用 `interface`。两者大部分场景可以互换，但 `interface` 支持声明合并（同名 interface 自动合并），`type` 支持联合类型和映射类型。

### `interface` 的声明合并

```typescript
interface Window {
  app: AppInstance;
}
// 在另一个文件中
interface Window {
  REPORT: ReportInstance;
}
// 现在 Window 同时有 app 和 REPORT 属性
```

FBS 代码中常利用声明合并为全局对象（如 `window`、宿主提供的 `app`）补充类型。这解释了为什么你可以在 `.ts` 文件中直接访问 `app.request` 而编辑器没有报错。

## 联合类型与类型收窄

### 联合类型：值可以是几种类型之一

```typescript
type Status = 'PENDING' | 'PROCESSING' | 'DONE' | 'CANCELLED';

function handleStatus(status: Status) {
  // status 只能是这四个字符串之一
}
```

FBS 代码中，字面量联合类型用于状态枚举、方法名（`'GET' | 'POST'`）、组件尺寸等取值有限的场景。

### 类型收窄：在分支中缩小类型范围

当 TypeScript 知道你检查了某个条件后，它会自动缩小变量的类型：

```typescript
function process(value: string | number) {
  if (typeof value === 'string') {
    // 这里 value 的类型被收窄为 string
    console.log(value.toUpperCase());
  } else {
    // 这里 value 的类型被收窄为 number
    console.log(value.toFixed(2));
  }
}
```

在 FBS 的权限判断代码中，类型收窄自然发生：

```typescript
export function hasPermission(permission: Permission | Permission[]) {
  const permissions = get(store.getState(), 'context.currentUser.permission_code_list', []);
  if (Array.isArray(permission)) {
    // permission 被收窄为 Permission[]
    return permission.some(item => permissions.includes(item));
  }
  // permission 被收窄为 Permission（单个字符串）
  return permissions.includes(permission);
}
```

`Array.isArray` 检查是 TypeScript 能自动识别的类型收窄方式之一。类似的还有 `typeof`、`instanceof`、`in`、`value !== null` 等。

### 可辨识联合（Discriminated Union）

在 FBS 的 API 响应类型中，一种常见的模式是用一个字段区分变体：

```typescript
interface SuccessResponse {
  retcode: 0;
  data: { list: InboundItem[] };
}

interface ErrorResponse {
  retcode: number;  // 非 0
  message: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: ApiResponse) {
  if (response.retcode === 0) {
    // response 被收窄为 SuccessResponse
    console.log(response.data.list);
  } else {
    // response 被收窄为 ErrorResponse
    console.error(response.message);
  }
}
```

## 泛型：把类型当作参数

### 基础泛型

泛型在 FBS 代码中无处不在。Portal 的 `createApi` 就是一个泛型函数：

```typescript
export const createApi = <Params = any, Data = any>(
  method: Method,
  url: string,
  configs?: RequestConfig
) => {
  return (params: Params, configParams: RequestConfig = {}): ApiPromise<Data> => {
    // ...
  };
};
```

`<Params = any, Data = any>` 声明了两个类型参数，`= any` 是默认值（不传时默认为 `any`）。

调用时：

```typescript
// 显式提供类型参数
const apiGetConfigInfo = createApi<ConfigParams, any>('GET', '/portal/inbound/config/get');

// 也可以让 TypeScript 推断
export const apiGetConfigInfo = createApi<ConfigParams, any>(
  'GET',
  '/portal/inbound/config/get'
);
```

泛型让 `createApi` 能够"记住"不同 API 的参数类型：`apiGetConfigInfo` 的参数类型是 `ConfigParams`，`apiGetItemTagBlacklist` 的参数类型是 `Record<string, never>`（空对象）。

### 泛型约束

```typescript
interface HasId {
  id: number;
}

function findById<T extends HasId>(list: T[], id: number): T | undefined {
  return list.find(item => item.id === id);
}
```

`T extends HasId` 约束 T 必须满足 `{ id: number }` 的形状。这在 FBS 代码中的通用工具函数里出现。

### 读懂 `Record`、`Partial`、`Pick`、`Omit`

这些是 TypeScript 内建的泛型工具类型，FBS 代码中频繁使用：

```typescript
// Record<K, V>：键为 K、值为 V 的对象类型
type StatusMap = Record<string, string>; // { [key: string]: string }
// FBS 中用于 API 参数：Record<string, never> 代表空对象 {}

// Partial<T>：T 的所有属性变为可选
interface ConfigParams { region: string; cb_option: number; }
type PartialConfig = Partial<ConfigParams>;
// { region?: string; cb_option?: number; }
// FBS 中用于更新接口的参数类型

// Pick<T, K>：从 T 中挑选 K 属性
type InboundSummary = Pick<InboundItem, 'ir_id' | 'status'>;
// { ir_id: number; status: string; }
// FBS 中用于列表项展示类型

// Omit<T, K>：从 T 中排除 K 属性
type InboundWithoutInternal = Omit<InboundItem, 'internal_id'>;
// FBS 中用于排除前端不应使用的内部字段
```

### 条件类型简述

Portal 的 `createApi.ts` 中有条件类型的实际应用：

```typescript
type CheckNever<T> = T extends never ? true : false;
type CheckAny<T> = CheckNever<T> extends false ? false : CheckNever<T> extends true ? false : true;

export type ApiPromise<T = any> = T extends Blob
  ? CheckAny<T> extends true
    ? Promise<ApiResponse<T>>
    : Promise<Blob>
  : Promise<ApiResponse<T>>;
```

这段代码的作用是：如果 Data 类型参数是 `Blob`，返回类型根据泛型推断结果区分 `Promise<ApiResponse<Blob>>` 和 `Promise<Blob>`；如果不是 `Blob`，始终返回 `Promise<ApiResponse<T>>`。

读代码时不需要完全理解条件类型的实现细节。需要知道的是：当你写 `createApi<Params, Blob>(...)` 时，返回的是一个能处理二进制响应的函数；当你写 `createApi<Params, ListData>(...)` 时，返回的函数包含 `retcode` 检查逻辑。

## 类型断言与 `as`

### 类型断言：告诉 TypeScript "相信我"

```typescript
const element = document.getElementById('inbound-form') as HTMLFormElement;
element.submit(); // TypeScript 相信你的断言
```

类型断言是开发者覆盖 TypeScript 推断的方式。它不做任何运行时检查，用错了会在运行时出错。

### `const` 断言

```typescript
const METHODS = ['GET', 'POST', 'PUT'] as const;
// 类型被推断为 readonly ['GET', 'POST', 'PUT']，而非 string[]
```

`as const` 让 TypeScript 推断最窄的类型（字面量类型、`readonly` 元组），而不是宽泛的类型。在 FBS 中用于常量定义和枚举替代。

### 非空断言 `!`

```typescript
const config = getConfig()!; // 告诉 TS：这不会是 null/undefined
```

应谨慎使用。FBS 代码中在确认值一定存在时偶尔出现。如果值确实可能是 `null`，用 `?.` 或 `??` 比 `!` 更安全。

## 在仓库中阅读 TypeScript 代码

### 六.1 Portal API 类型链

以 `fbs-frontend/src/apis/inbound.ts` 为例：

```typescript
// 1. 接口定义：描述 API 请求和响应形状
export interface InboundRequestShopSearchQuery {
  shop_id_or_name: string;
}

export interface InboundRequestShopSearchResponse {
  message: string;
  data: {
    shop_list: {
      creator: string;
      sync_status: number;
      shop_id: number;
      mtime: number;
      operator: string;
      // ...
    }[];
  };
}

// 2. 用 createApi<Params, Data> 创建类型安全的 API 函数
export const apiSearchShop = createApi<InboundRequestShopSearchQuery, InboundRequestShopSearchResponse>(
  'GET',
  '/portal/inbound/shop_search'
);

// 3. 页面中使用时，TypeScript 自动推断参数和返回值类型
apiSearchShop({ shop_id_or_name: '12345' })
  .then(response => {
    // response 类型被自动推断为 ApiPromise<InboundRequestShopSearchResponse> 的 resolved 值
    console.log(response.data.shop_list);
  });
```

整个类型链：`interface` → `createApi<Params, Data>` → 调用时自动推断。不需要在任何地方手动标注 `apiSearchShop` 的参数或返回值类型。

### 六.2 Vue SFC 中的 Props 类型

Vue 3 组件中，Props 可以用 TypeScript 类型声明：

```vue
<script setup lang="ts">
interface InboundDetailProps {
  irId: number;
  readonly?: boolean;
}

const props = defineProps<InboundDetailProps>();
// props.irId 的类型是 number
// props.readonly 的类型是 boolean | undefined
</script>
```

`defineProps` 是 Vue 3 的编译宏，不是运行时的函数。TypeScript 类型在编译时用于生成运行时的 Props 声明。

### 六.3 Store 类型

FBS 的 Vuex Store 使用 TypeScript 声明模块类型：

```typescript
interface ShopState {
  currentShop: Shop | null;
  shopList: Shop[];
}

// Vuex 模块中使用
const module: Module<ShopState, RootState> = {
  state: (): ShopState => ({
    currentShop: null,
    shopList: [],
  }),
  // ...
};
```

这确保了 `store.state.Shop.currentShop` 的类型是 `Shop | null`，从而在页面上访问 `currentShop.fbsWhsRegion` 时 TypeScript 会提示你可能为 `null`。

## TS 版本边界：4.4 vs 4.7

FBS 三个前端仓库的 TypeScript 版本不一致：

- Portal (`fbs-frontend`)：TS 4.4.x
- SC Vue (`fbs-sc-vue`)：TS 4.7.x
- SC React (`fbs-sc-react`)：TS 4.7.x

关键差异：

| 特性 | TS 4.4 | TS 4.7（SC 两仓） |
| --- | :---: | :---: |
| 可选链 `?.` | ✓ | ✓ |
| 空值合并 `??` | ✓ | ✓ |
| `as const` | ✓ | ✓ |
| 模板字面量类型 | ✓ | ✓ |
| 控制流分析增强 | 有限 | 改进（属性访问收窄更好） |
| ESM Node.js 支持 | ✗ | ✓（但仓库不直接依赖此特性） |
| `satisfies` 关键字 | ✗ | ✗（4.9+ 才有） |

在写涉及 Portal 的类型代码时，不要使用 4.7+ 的语法。课程中的示例以 4.4 为最低公共基线，不依赖 4.7 独占特性。

## 常见错误与修正

### 混淆 `interface` 与运行时类型检查

```typescript
// 错误：TypeScript 类型在运行时不存在
function isConfigParams(obj: unknown): obj is ConfigParams {
  return obj instanceof ConfigParams; // 编译错误！
}

// 正确：手动检查形状
function isConfigParams(obj: unknown): obj is ConfigParams {
  return typeof obj === 'object' && obj !== null
    && 'region' in obj && 'cb_option' in obj;
}
```

### 过度使用 `any`

```typescript
// 不推荐
function process(data: any): any { return data.list; }

// 推荐：至少定义最小接口
function process(data: { list: unknown[] }): unknown[] { return data.list; }
```

`any` 会关闭类型检查，等于回到纯 JavaScript。FBS 代码中 `any` 主要出现在历史遗留代码和确实无法确定类型的边界（如 Axios response interceptor 的 error 参数）。新增代码优先用 `unknown` + 类型收窄。

### 可选属性未处理 `undefined`

```typescript
interface Shop {
  fbsShopId?: number;
}

const shop: Shop = {};
console.log(shop.fbsShopId.toFixed(2)); // 编译错误或运行时 TypeError
// 正确：
console.log(shop.fbsShopId?.toFixed(2) ?? 'N/A');
```

### `as` 断言过多

```typescript
// 危险：掩盖了真正的类型问题
const data = response as unknown as MyType;

// 更好：定义类型守卫或使用 assertion function
function assertIsMyType(obj: unknown): asserts obj is MyType {
  if (!obj || typeof obj !== 'object') throw new Error('Invalid data');
}
```

## 练习

### 为未类型化 API 添加类型

以下是 FBS 中一个简化版 API 函数，目前没有类型注解。为请求参数和响应数据添加完整的类型定义：

```javascript
// 当前代码（无类型）
export function getInboundList(params) {
  return request({ url: '/inbound/list', method: 'GET', params });
}

// 已知：
// params: { page: number, count: number, status?: string, region?: string }
// 响应: { retcode: number, data: { list: Array<{ ir_id: number, status: string, mtime: number }>, total: number } }
```

### 类型收窄

对于以下类型，编写 `formatValue` 函数，接收 `string | number | boolean`，返回格式化字符串（数字保留两位小数，布尔转为 `'Yes'`/`'No'`，字符串原样返回）。必须在函数体内正确使用类型收窄，不能使用 `as` 或 `any`。

### 工具类型选择

根据场景选择最合适的工具类型：`Partial`、`Pick`、`Omit`、`Record` 或 `Required`。

a) 从 `InboundItem`（有 15 个字段）创建只含 `ir_id` 和 `status` 的列表展示类型。
b) 从 `ConfigParams` 创建所有字段都可选的更新参数类型。
c) 创建一个 key 为 `region` 字符串、value 为 `Warehouse[]` 的映射类型。
d) 从 `UserData` 排除 `password` 和 `token` 字段。

### 参考答案

**9.1** 参考：
```typescript
interface GetInboundListParams {
  page: number;
  count: number;
  status?: string;
  region?: string;
}

interface InboundItem {
  ir_id: number;
  status: string;
  mtime: number;
}

interface GetInboundListResponse {
  retcode: number;
  data: {
    list: InboundItem[];
    total: number;
  };
}

export function getInboundList(
  params: GetInboundListParams
): Promise<GetInboundListResponse> {
  return request({ url: '/inbound/list', method: 'GET', params });
}
```

**9.2** 参考：
```typescript
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toFixed(2);
  return value ? 'Yes' : 'No';
}
```

**9.3** a) `Pick<InboundItem, 'ir_id' | 'status'>`；b) `Partial<ConfigParams>`；c) `Record<string, Warehouse[]>`；d) `Omit<UserData, 'password' | 'token'>`。

## 参考文献

- [TypeScript Handbook — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) — 基础类型
- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — 类型收窄
- [TypeScript Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) — 泛型
- [TypeScript Handbook — Utility Types](https://www.typescriptlang.org/docs/handbook/utility-types.html) — 工具类型
- [TypeScript 4.7 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html) — SC 两仓 TS 基线
- [TypeScript 4.4 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-4-4/) — Portal TS 基线
