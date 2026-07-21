# FBS 全栈 Landing 术语表

| 术语 | 定义 |
| --- | --- |
| API 函数 | 由业务语义命名、负责确定 method、path 与参数位置的薄层函数，例如 `getRequestList`。 |
| request wrapper | 围绕 Axios 或宿主请求能力建立的统一请求实例，集中处理 baseURL、header、错误、PII 与 Blob 等规则。 |
| transport failure | 请求未获得可用 HTTP 响应，如断网、DNS、超时或连接被中断。 |
| HTTP failure | 已获得 HTTP 响应，但状态码表示失败，例如 404 或 500。 |
| 业务错误 | HTTP 传输可能成功，但响应体中的 `retcode` 表示业务未成功。 |
| 前后端契约 | 前端与后端共同遵守的 method、path、header、请求字段、响应字段、错误语义和兼容规则。 |
| Chassis | FBS Go 服务使用的内部服务框架；本课程只讲当前仓库代码中出现的 HTTP、配置与基础设施接入方式。 |
| `restful.Route` | Chassis REST 路由描述，至少将 HTTP method、path 和处理函数联系起来。 |
| controller wrapper | 包裹业务 handler 的统一入口，负责中间件链、参数绑定、校验、错误转换与响应包装等横切职责。 |
| `SbsContext` | FBS 主服务在 Chassis context 之上建立的上下文抽象，向 handler 提供请求对象、Go context 与原始 restful context。 |
| DTO | 用于接口边界的数据结构；Go 中通常由 struct 与 JSON/validation tag 表达，前端中通常由 TypeScript 类型表达。 |
| 灰度链路 | 同一路由根据规则选择旧实现或新实现的并存状态。它是当前代码事实，不等于课程要讲的发版流程。 |
| PII 请求 | 处理个人敏感信息的受控请求路径，需要使用仓库规定的独立封装和后端边界，不能当作普通 API。 |
| Blob 响应 | 浏览器中的二进制响应形态，常用于导出；失败体仍可能是 JSON，需单独处理。 |
| request ID | 跨浏览器、网关和服务日志关联一次请求的标识；具体 header 名以各仓库封装为准。 |
