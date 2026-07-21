# 权限、i18n、时间、文件与 PII：页面功能的准入项

> 预计学习时间：120–160 分钟
> 一句话总结：能在写 FBS 页面时同步处理权限检查、多语言翻译、时区转换、文件上传下载和 PII 敏感信息边界——以"新增字段 + 导出"需求为主线，逐项加载仓库规则，用缺权限/不同时区/错误文件做反例验证。

## 这一章解决什么问题

后端同学写前端页面时，往往聚焦在"把数据正确显示出来"。但在 FBS 的前端仓库中，一个功能完整上线还需要通过五道准入检查：这个用户能看到这个页面/按钮吗？页面上的文字在不同语言下正确吗？时间是用 UTC 还是本地时区？导出文件是 Excel 还是 PDF，文件名怎么定？涉及 PII 的数据经过了敏感服务吗？

这些检查不是"最后加一下就行"——它们分布在路由、请求、组件、Store 的不同层面。本章用一个统一的需求主线"在入库列表增加一个联系人字段 + 导出功能"串联这五道检查，每道检查都给出仓库中现有的实现位置和代码样例。

学完本章后，你不会背完所有权限码和 i18n key，但你会在写任何新功能时自动问自己这五个问题，并且知道去哪里找答案。

> 本章基于三个前端仓库的 release 分支（2026-07-20）。权限码、i18n key、时区约定和 PII 规则以仓库当前代码为准。

## 权限：路由级和操作级两层控制

### 路由级权限（authCodes）

在 SC Vue 和 SC React 中，路由级权限由 `meta.authCodes` 控制：

```typescript
// SC Vue src/router/index.ts
meta: {
  authCodes: ['access_to_sbs', 'access_to_sbs_service_by_shopee'],
}
```

`authCodes` 由 Seller Center 宿主在用户进入模块前校验。如果用户不满足任一个 authCode，整个 FBS 模块不可见。这不是 FBS 自己能控制的——它是宿主层面的准入。

### 操作级权限（permissions）

进入模块后，具体页面和操作按钮由操作权限控制。Portal 和 SC 仓库使用类似模式：

```typescript
// Portal: 路由定义中的权限
meta: { permissions: ['VIEW_INBOUND_REQUEST'] }

// Portal: 页面中的按钮级权限
{hasPermission('PROCESS_INBOUND_REQUEST') && (
  <Button>创建入库单</Button>
)}

// SC Vue: 操作权限检查
const canModify = computed(() => {
  return hasPermission('INBOUND_MODIFY');
});
```

Portal 的权限码定义在 `src/constants/permissions.ts` 中，是一个数字到权限名的映射：

```typescript
export const PERMISSIONS = {
  VIEW_INBOUND_REQUEST: 1111,
  PROCESS_INBOUND_REQUEST: 1112,
  // ...
};
```

SC Vue 和 SC React 的权限检查依赖宿主提供的权限列表。`hasPermission` 函数在 `fbs-frontend/src/business/utils/permission.ts` 中定义（FE-L01 已讲过），核心逻辑是从 Redux Store 中读取 `permission_code_list`，然后 `includes` 判断。

### 新增功能时的权限步骤

当你需要新增一个受权限控制的功能时：

1. 确认权限码是否已在 `PERMISSIONS` 常量或权限管理平台中定义。如果没有，先在权限管理平台注册，再添加到代码中。
2. 在路由定义中配置 `permissions`（控制页面准入）或 `authCodes`（控制模块准入）。
3. 在页面中需要权限控制的操作按钮处加上 `hasPermission` 判断。
4. 测试无权限用户的体验：页面是否显示无权限提示（而不是白屏或报错），受限按钮是否正确隐藏。

## i18n：Transify、i18next 与翻译 key

### 翻译函数的正确调用方式

FBS 三个前端仓库使用 Transify 作为翻译管理平台。页面中所有用户可见的文案都必须通过 `$t()` 包裹：

```vue
<!-- Vue -->
<h1>{{ $t('inboundProblemId') }}: {{ id }}</h1>
<EdsTag>{{ $t('commonUrgent') }}</EdsTag>
```

```tsx
// React (Portal)
<h1>{$t('Inbound Request List')}</h1>
```

`$t` 接收一个翻译 key，返回当前语言对应的翻译文案。翻译 key 由 Transify 平台管理，前端通过 `yarn i18n:pull` 从远程拉取到本地 `src/lang/` 目录下的 JSON 文件。

### 翻译 key 的命名惯例

FBS 的翻译 key 没有强制的层级命名规则，但常见的模式是：

| 类型 | 示例 key | 含义 |
| --- | --- | --- |
| 通用文案 | `commonUrgent`、`commonModify`、`commonError` | 跨页面复用的按钮/提示文案 |
| 页面特化 | `inboundProblemId`、`ibtDefaultTreatment` | 只在特定页面使用的文案 |
| 状态值 | 状态 key 直接对应后端返回的枚举值 | 状态枚举的翻译 |

### 新增文案的流程

1. 在 Transify 平台创建新的翻译 key，填写各语言（中文、英文、泰文等）的翻译。
2. 在本地仓库执行 `yarn i18n:pull` 拉取最新翻译文件。
3. 在代码中使用 `$t('yourNewKey')`。

不要在代码中硬编码文案，也不要通过拼接字符串来"省 key"：

```javascript
// 错误：硬编码中文
<Button>创建入库单</Button>

// 错误：拼接——不同语言的语序可能不同
const msg = $t('create') + ' ' + $t('inbound') + ' ' + $t('request');

// 正确：使用完整的翻译 key
<Button>{$t('createInboundRequest')}</Button>
```

### Portal 的 $t 封装

Portal 在 `src/business/utils/i18n.ts` 中封装了 `$t`：

```typescript
export const $t: IntlT = generateTransifyCommon({
  project: 'fbs',
  t: (key, options) => {
    handleTranslateReport(key);
    return i18n.t(key, options);
  },
  isShowKey: false,
});
```

`isShowKey: false` 表示如果找不到翻译，不显示原始 key（而是显示空字符串或其他降级方案）。`handleTranslateReport` 用于翻译覆盖率上报——如果某个 key 缺失翻译，Transify 平台会收到报告。

SC React 中远端组件使用 `$gtForRemoteComponent`，它使用单花括号插值 `{var}` 而非双花括号 `{{var}}`——这是远端组件的宿主兼容约束，不要混用。

## 时间：秒/毫秒、UTC/本地时区与格式化

### FBS 的时间契约

FBS 后端（Go）返回的时间戳通常是**秒级 Unix 时间戳**。前端接收到后需要 `* 1000` 转为毫秒才能传给 `new Date()`：

```javascript
// 后端返回：mtime: 1720000000（秒）
const date = new Date(item.mtime * 1000);
```

不同接口可能有不同的时间格式（秒级时间戳、毫秒级时间戳、ISO 8601 字符串）。读 API 文档或响应样例时先确认时间格式，不要假设所有接口都返回相同的格式。

### 时区边界

FBS 是跨国业务，卖家可能分布在巴西（UTC-3）、新加坡（UTC+8）、泰国（UTC+7）等不同时区。前端的时间处理规则：

- **存储和传输**：统一使用 UTC。API 的请求和响应中的时间戳/ISO 字符串都应该是 UTC。
- **展示**：按用户所在时区格式化。使用 `toLocaleDateString` 或 `Intl.DateTimeFormat`。
- **日期选择器**：选择的日期通常按当天 00:00 本地时间处理，需要转成 UTC 时间戳发给后端。

```javascript
// 展示：按用户时区格式化
const displayDate = new Date(timestamp * 1000).toLocaleDateString('zh-CN');
// 输出：2026/7/20

// 发给后端：日期选择器选中的日期转 UTC 时间戳
const selectedDate = new Date('2026-07-20'); // 本地时间 00:00
const utcTimestamp = Math.floor(selectedDate.getTime() / 1000);
```

关键边界：`new Date('2026-07-20')` 在不同时区的浏览器中行为不同。在 UTC+8 的浏览器中它是 `2026-07-20 00:00:00 +0800`，在 UTC-3 中是 `2026-07-20 00:00:00 -0300`。如果你需要精确的 UTC 午夜，使用 `new Date('2026-07-20T00:00:00Z')`。

### FBS 仓库中的时间工具

三个仓库各自封装了时间处理工具函数。写新功能时，优先搜索仓库中已有的时间格式化函数而不是手写 `new Date().getXxx()`：

```bash
# 在仓库中搜索时间相关工具函数
rg "formatTime|formatDate|toLocale" --include='*.ts' --include='*.js'
```

## 文件：下载、上传与 Blob 处理

### 文件下载：区分普通请求和 Blob 请求

FBS 的文件导出（Excel、PDF）使用专门的 Blob 请求实例。以 SC Vue 为例：

```javascript
// 普通请求——返回 JSON，自动解包
export const exportForExcel = (data) => request({
  url: '/inbound/request/export/excel',
  method: 'POST',
  data,
});

// Blob 请求——返回二进制，不解包
export const exportSyncPdf = (data) => blobRequest({
  url: '/inbound/request/export/pdf',
  method: 'POST',
  data,
});
```

`blobRequest` 是 `app.request.clone({ responseType: 'blob' })`，配置了 `responseType: 'blob'` 告诉 Axios 不要将响应解析为 JSON。收到 Blob 后，需要通过临时 URL 触发浏览器下载：

```javascript
const blob = await exportSyncPdf({ ir_id: id });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `inbound_${id}.pdf`;
a.click();
URL.revokeObjectURL(url);
```

### 文件上传

FBS 的上传功能通常使用 FormData + POST：

```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('ir_id', id);

await request({
  url: '/inbound/request/upload',
  method: 'POST',
  data: formData,
  headers: { 'Content-Type': 'multipart/form-data' },
});
```

上传前通常需要前端校验文件类型和大小：

```javascript
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['.xlsx', '.xls', '.csv'];

if (file.size > MAX_SIZE) {
  EdsToastInstance.error($t('fileTooLarge'));
  return;
}
if (!ALLOWED_TYPES.some(ext => file.name.endsWith(ext))) {
  EdsToastInstance.error($t('fileTypeNotAllowed'));
  return;
}
```

### 导出文件命名

文件名通常包含业务标识、时间戳和文件类型：

```javascript
// 命名模式
const fileName = `Inbound_Request_${ir_id}_${Date.now()}.pdf`;
```

`Date.now()` 用于生成唯一文件名，避免浏览器缓存问题。

## PII：敏感信息的处理边界

### PII 请求使用独立的 request 实例

FBS 中涉及敏感信息（姓名、电话、邮箱、证件号等）的请求，必须使用 `piiRequest` 而非普通的 `request`：

```javascript
// SC Vue src/utils/request.js
export const piiRequest = app.request.clone({
  baseURL: '/api/fbs/pii/sc',  // 指向敏感数据服务
  unpackData: false,
});
```

PII 请求指向 `/api/fbs/pii/sc` 而非普通业务请求的 `/api/fbs/sc`。后端 `fbs-sensitive-data-server` 专门处理敏感数据，提供独立的鉴权、审计和脱敏能力。

### PII 的展示边界

即使通过 PII 接口获取了敏感数据，前端展示时仍然要遵循最小展示原则：

- 姓名：可能需要部分脱敏（如"张**"）。
- 电话：通常需要脱敏（如"138****1234"）。
- 证件号：绝不在页面上完整展示，仅展示部分或完全隐藏。
- 邮箱：视业务需求决定是否脱敏。

脱敏通常在服务端完成（`fbs-sensitive-data-server` 的响应中已经脱敏），但前端不能假设服务端一定会脱敏——展示前应做二次检查。FBS 仓库中有对应的脱敏工具函数，在展示 PII 数据时优先使用。

### PII 数据的日志与存储

PII 数据绝不能出现在以下位置：

- `console.log()` 或任何前端日志。
- 浏览器 localStorage/sessionStorage。
- URL 查询参数（除非已脱敏）。
- 错误上报的 payload 中。

如果必须在前端临时持有 PII 数据（如编辑表单），使用后应立即清理。不要将 PII 数据存入 Redux/Vuex Store 的持久化部分。

### PII 的权限检查

访问 PII 数据通常需要更高的权限级别。在 FBS Portal 中，查看卖家详情的 PII 字段需要 `CLIENT_DETAIL_ALL` 权限码；SC 仓库中 PII 相关操作需要宿主层面的额外授权。

```javascript
// Portal: 只有特定权限才能看完整信息
{hasPermission('CLIENT_DETAIL_ALL') ? (
  <FullDetail data={piiData} />
) : (
  <MaskedDetail data={piiData} />
)}
```

## 综合任务：新增字段 + 导出

将以上五道检查串联为一个实际任务。假设需求是：在入库列表中新增"紧急联系人"字段和导出 Excel 功能。

### 需求拆解

| 关注点 | 需要做什么 | 仓库位置 |
| --- | --- | --- |
| 权限 | 确认是否需要新权限码 | `constants/permissions.ts` |
| i18n | 新增翻译 key：`inboundUrgentContact`、`exportInboundList` | Transify 平台 → `yarn i18n:pull` |
| 时间 | 确认导出文件名中的时间格式 | 现有导出函数参考 |
| 文件 | 新增 Excel 导出 API（blobRequest） | `src/api/inbound.js` |
| PII | 判断"紧急联系人"是否属于 PII，如果是走 piiRequest | `src/utils/request.js` |

### 实现检查清单

1. **权限**：如果导出功能需要特定权限，在操作按钮上添加 `hasPermission` 判断。
2. **i18n**：列表列头和导出按钮文案使用 `$t('inboundUrgentContact')`。
3. **时间**：导出文件名包含 `YYYYMMDD` 格式的当前日期。
4. **文件**：使用 `blobRequest` 发送导出请求，接收 Blob 后触发浏览器下载。
5. **PII**：如果"紧急联系人"是 PII，展示时脱敏；导出时确认权限和审计。

### 反例验证

| 反例 | 预期行为 |
| --- | --- |
| 无导出权限用户访问页面 | 导出按钮隐藏 |
| 英文语言下的页面 | 列头显示"Urgent Contact" |
| 巴西时区用户导出 | 文件名中的日期是巴西当地时间 |
| 导出请求网络错误 | Toast 提示 + 不下载破损文件 |
| PII 数据出现在 console.log | ESLint/代码审查应拦截 |

## 常见错误

### 硬编码文案

```vue
<!-- 错误 -->
<Button>Create Inbound Request</Button>
<!-- 正确 -->
<Button>{{ $t('createInboundRequest') }}</Button>
```

### 时间戳未区分秒/毫秒

```javascript
// 错误：后端返回秒级时间戳，前端直接当毫秒用
new Date(item.mtime);  // 日期是 1970 年！

// 正确：
new Date(item.mtime * 1000);
```

### PII 走普通请求

```javascript
// 错误：敏感数据走普通 request
const data = await request({ url: '/some/pii/endpoint' });
// 正确：
const data = await piiRequest({ url: '/some/pii/endpoint' });
```

### 导出文件名含特殊字符

```javascript
// 可能在某些浏览器/OS 中失败
const fileName = `入库单_${irId}_${name}.pdf`;
// 更安全：使用 ASCII 字符
const fileName = `Inbound_${irId}_${Date.now()}.pdf`;
```

## 练习

### i18n 缺失排查

在 SC Vue 仓库中，找一个未在 Transify 注册但页面中直接写了中文的地方（提示：搜索非 `$t()` 包裹的中文字符）。评估它是否需要改为 `$t()`。

### 时间处理审查

在 `fbs-sc-vue/src/views/inbound/` 目录下搜索 `new Date(` 或 `mtime` 的使用。检查所有时间处理是否正确处理了秒/毫秒转换。

### PII 数据流追踪

在 SC Vue 仓库中追踪 `piiRequest` 的一个用例。从页面调用开始，经过 API 函数、request wrapper、到后端路由。标注在每一层中 PII 数据是否被正确保护。

### 参考答案

**8.3**：`piiRequest` 的 `baseURL: '/api/fbs/pii/sc'` 将请求路由到 `fbs-sensitive-data-server` 而非主服务。请求 header 中注入的 `lang-id`、`fbs-sc-source` 等信息同样由 wrapper 注入。后端敏感服务返回的数据已经脱敏，前端不应做额外的日志输出。

## 参考文献

- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) — 时区感知的日期格式化
- [MDN Blob](https://developer.mozilla.org/en-US/docs/Web/API/Blob) — 二进制数据对象
- [MDN URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) — Blob 下载
- [Axios v0.18 Response Type](https://github.com/axios/axios/tree/v0.18.0) — Portal 的 Blob 请求配置
- [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) — HTTP 请求/响应语义
