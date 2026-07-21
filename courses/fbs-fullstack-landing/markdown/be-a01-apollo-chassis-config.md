# Apollo 与 Chassis 配置：环境差异、热更新和开关

> 预计学习时间：130–180 分钟
> 一句话总结：建立对配置中心的零基础认知，沿三个仓库的真实配置 struct、Apollo 接入和热更新代码，学会从配置读取、非法值防护到功能开关的完整设计方法。

## 为什么后端需要一个专门的“配置管理”机制

前端工程中，配置通常体现为 `.env` 文件、Webpack mode、构建变量或 `process.env` 注入。这些值在本地打包时就确定了，部署到测试环境和生产环境分别构建一次。后端的情况不太一样：同一个编译好的二进制文件会被部署到测试、预发布、生产等不同环境，DB 连接串、缓存地址、限流阈值、开关状态全部不同。如果每次切换环境都要重新编译，效率很低，出错的概率也高。

所以后端工程通常把“配置”和“代码”分开管理。代码仍然随版本发布，配置则由配置中心独立下发和更新。配置值可以在服务运行中动态修改而不重启进程，也可以通过配置中心统一灰度、回滚和审计。

在这一整套机制里，有几个角色要先分清楚：

**配置中心**：独立于业务服务的管理平台，存放配置项、管理环境差异和控制下发策略。Apollo 是公司内部主要使用的配置中心之一，每个仓库的 `conf/chassis*.yaml` 里都有 Apollo 的 appId、namespace 和 cluster 声明。

**配置 struct**：Go 代码中定义的结构体，字段通过 yaml tag 映射到配置中心的 key。`confighelper.GetConfig(ctx)` 调用返回的就是填好当前值的 struct。它的作用是把字符串格式的配置项转成类型安全的 Go 对象，避免到处自己 `strconv.Atoi`。

**配置前缀 / namespace**：区分不同服务或不同用途的配置命名空间。比如敏感数据服务的 `ApolloConfigPrefix = "fbs-sensitive"`，Tax 服务用 `"application,tax_task,service_config,wbc_public,chassis"` 多个 namespace。代码会按前缀或 namespace 拉取一组配置，而不是每次都重新声明从哪里拿。

**静态配置、动态配置、环境变量**：静态配置是写死在代码文件（如 `conf/chassis.yaml`）里的值，改它需要重新构建；动态配置由 Apollo 下发，进程启动时读取一次，然后通过热更新（hot reload）监听后续变化；环境变量（如 `ENV`、`POD_IP`、`PORT`）注入容器信息，配合配置中心补足机器级别的差异。

**功能开关**：本质也是一个配置项，值通常是布尔或灰度名单。它不承载业务数据，只控制某段新逻辑是否生效。开关的价值在于：上线新功能时可以先对部分用户打开，有问题可以迅速关闭而不需要回发代码。

社区里同类方案很多。Spring 的 `application.yml` + Config Server 对 Java 栈友好；etcd / Consul 适合 Kubernetes 原生环境，但通常需要自己写监听和解析逻辑；云厂商的 Parameter Store 和 Secret Manager 用于安全凭据，但一般不支持灰度、审计和批量管理。Apollo 在公司内部与 Chassis 绑定较深，配置变更能经审核、灰度并触发 `config.RegisterListener` 回调，这是当前三个仓库的现状事实。课程不比较哪个方案更好，而是把现有的接入链路讲清楚：配置从 Apollo 到 Go struct 到底经过哪些步骤，修改一个配置项要注意什么。

三后端仓库全部使用 Chassis 框架接入 Apollo，但它们的使用模式并不完全相同。下表给出最关键的差异：

| 仓库 | 配置 struct 位置 | Apollo prefix/namespace | 热更新方式 |
| --- | --- | --- | --- |
| `sbs-fbs-server` | 分散在各 middleware/sbs_agent 的 config.go | `sbs_fbs_server` | 通过 Chassis `config.RegisterListener` 逐模块监听 |
| `fbs-sensitive-data-server` | `confighelper/confighelper.go` 的 `FbsSensitiveDataServerConfig` | `fbs-sensitive` | 统一 `Event()` 回调更新全局 struct |
| `fbs-tax-server` | `internal/common/dbhelper`、`infrastructrure/cache` 等处 | `application,tax_task,...` 多 namespace | Tax 至少三个进程各自订阅不同 namespace 组合 |

> 本章基于三个后端仓库的 release 分支（2026-07-20）。配置 struct 字段和 Apollo namespace 以当前 `conf/chassis*.yaml`、`go.mod` 和代码实现为准。加密凭据（token、密钥、DSN）不应直接写入课程资产，因此示例中的敏感值已省略或替换为占位符。

## 一条配置从 Apollo 到 Go 代码的全过程

以敏感数据服务的 `FbsAgentConfig` 为例，追踪配置怎样从平台变成业务代码可用的值。

### 第一步：Apollo 平台存储

运维或配置管理员在 Apollo 管理界面填写一条 key-value：`fbs-sensitive.FbsAgent.Host` = `"内部域名"`。`fbs-sensitive` 是 namespace，`FbsAgent.Host` 对应 YAML 的缩进路径。

这个值会保存在 Apollo 服务端，可以按 cluster、环境分别维护不同版本。平台侧的审批、灰度、回滚和变更历史写操作不属于本章范围，但你要知道：程序员最终拿到的值可能经历过平台审核、灰度分流和下发延迟。

### 第二步：Chassis 初始化时拉取

`conf/chassis.yaml` 里声明 Apollo 的 appId、namespace 和 cluster：

```yaml
fbs-sensitive:
  initial:
    config:
      apolloDisabled: false
      appId: fbs-sensitive-data-server
      namespaceList: fbs-sensitive
      cluster: default
```

Chassis 框架在 `chassis.Init()` 阶段读取这个声明，连接 Apollo 服务器，拉取 `fbs-sensitive` namespace 下所有配置，缓存到进程内。`apolloDisabled: true` 用于本地调试时跳过远程拉取，只用 `conf/*.yaml` 里的本地默认值。

### 第三步：confighelper 反序列化为 struct

`confighelper.NewFbsSensitiveDataServerConfig()` 在 Chassis init 之后调用，把 Apollo 下发的 YAML 字符串反序列化到 `FbsSensitiveDataServerConfig`：

```go
// confighelper/confighelper.go（简化）
type FbsAgentConfig struct {
    Host      string `yaml:"Host"`
    AppKey    string `yaml:"AppKey"`
    Token     string `yaml:"Token"`
    TestToken string `yaml:"TestToken"`
}

func LatestConfig() (*FbsSensitiveDataServerConfig, error) {
    s := &FbsSensitiveDataServerConfig{}
    if err := config.UnmarshalConfig(s.ConfPrefix(), s); err != nil {
        return nil, fmt.Errorf("failed to unmarshal fbs config, err:%v", err)
    }
    s.parseComplexConfig()
    return s, nil
}
```

`config.UnmarshalConfig` 按 struct 的 yaml tag 匹配 Apollo 返回的 key，填入对应字段。`parseComplexConfig()` 进一步处理嵌套的 JSON 字符串字段：比如 `FbsPortalSoupConfig.ApiPermissionCode` 在 Apollo 中是 JSON 文本，反序列化后需要再 `json.Unmarshal` 解析为 `map[string][]int`。这是从代码能确认的真实模式，而不是作者假设。

### 第四步：业务代码通过 GetConfig 使用

handler 或 service 需要读取配置时，调用 `confighelper.GetConfig(ctx).AuthConfig.Key`。`GetConfig` 不是每次从 Apollo 重新拉取，而是返回第三步初始化后存在全局变量 `gFbsSensitiveDataServerConfig` 里的实例。

**Situation**：为新 ASN 功能增加一个行为控制开关。

**Task**：在敏感数据服务中为 OpenAPI Auth 增加 Key 字段，理解其从 Apollo 配置到代码的完整路径，并设计缺失和非法值的默认行为。

**Action**：
1. 在 `FbsSensitiveDataServerConfig` 或对应子 struct 中声明 `AuthConfig` 字段，使用 yaml tag 映射 Apollo key。
2. 代码启动时通过 `config.UnmarshalConfig` 从 Apollo namespace 拉配置并反序列化。
3. handler 中调用 `confighelper.GetConfig(ctx).AuthConfig` 获取当前值。
4. 为 AuthConfig 字段被清空、设置过长或格式非法等场景编写测试，确认默认拒绝或 fallback 行为。
5. 关闭配置开关时，验证已有调用方仍然正常工作。

**Result**：你能解释配置从 Apollo 到 struct 的全过程，能增加一个配置字段并为其设计合法/非法/缺失时的代码行为，而不是依赖“运维会配好”来保证正确性。

> FBS 仓库中的 `FbsAgentConfig.Token`、`AppKey`、数据库 DSN 和 session 密钥等敏感值不得写入课程正文、练习、测试或产物。这里的示例只保留字段名和类型。

## 热更新：让配置变更不依赖重启

前端开发中修改 `.env` 需要重新 `npm run dev`。后端服务如果每改一个限流阈值都要重启所有实例，运维成本和风险都很高。热更新（hot reload）解决了这个问题：进程不重启，Apollo 推送变更后代码自动获取新值。

### 热更新的三个步骤

Chassis 基于 Apollo 的配置下发机制提供了 `config.RegisterListener`。敏感数据服务的实现比较清晰：

```go
// confighelper/confighelper.go（简化）
func NewFbsSensitiveDataServerConfig() *FbsSensitiveDataServerConfig {
    fbsConfig, err := LatestConfig()
    if err != nil {
        panic(err)
    }
    // 注册监听器，当 Apollo 推送变更时回调 Event 方法
    if err := config.RegisterListener(&FbsSensitiveDataServerConfig{}); err != nil {
        panic(err)
    }
    gFbsSensitiveDataServerConfig = fbsConfig
    return gFbsSensitiveDataServerConfig
}

// Event 是满足 config.Listener 接口的方法
func (s *FbsSensitiveDataServerConfig) Event(event []*event.Event) {
    fbsConfig, err := LatestConfig()
    if err != nil {
        logger.LogErrorf("failed to Refresh config, err:%v", err)
        return  // 关键：更新失败时保留旧值，不让服务进入无配置状态
    }
    gFbsSensitiveDataServerConfig = fbsConfig
}
```

这段代码说明了三个重要设计点：

1. 变更事件到达时会重新 `UnmarshalConfig` 并覆盖全局变量。无需重启、无需手动调接口刷新。
2. 失败时保留旧值，打印错误日志。这不是最优做法——有些系统会持续告警直到配置恢复——但至少不会因为一次配置下发错误导致业务全挂。
3. 监听是按 namespace 前缀注册的，一个服务可以同时监听多个 namespace。

### 哪些情况热更新不够用

不是所有配置项都适合热更新。以下几类配置通常只在进程启动时读取一次，修改后需要重启：

- 数据库连接池参数（`MaxIdleConns`、`MaxOpenConns`、`ConnMaxLifetime`）。这些值在 `ScormClusterConfig` 中声明，但底层连接池在 init 阶段就完成了初始化，热更新的值不会自动重建连接池。
- HTTP/gRPC client 的超时设置。许多 client 在创建时固化 `http.Client.Timeout`，修改配置值不会让已创建的 client 实例重设超时。
- 端口和监听地址。`listenAddress` 在进程启动时绑定，热更新无法改变已监听的 socket。

判断一个配置项是否支持热更新，要看它被读取的位置和底层资源的初始化时机。配置 struct 被更新了，不等于所有依赖于这个配置的组件都会以新值重新运行。这需要逐项查代码确认。

### 热更新的风险与防护

配置变更不是“改了就能用”。几类常见的风险值得注意：

**格式错误**。有人在 Apollo 填写 YAML 时缩进错了，或者 JSON 字符串少了一个引号。`UnmarshalConfig` 或 `parseComplexConfig` 会返回 error。当前代码在 `Event` 回调里遇到 error 时保留旧值——这是一个关键的 fallback，破坏了它会导致配置下发错误时服务进入不完整状态。

**逻辑冲突**。两项配置各自合法，但组合在一起不成立。例如限流阈值 100 和并发连接池 10 这种组合不是配置中心的职责，必须由代码或文档约束。

**时序不一致**。热更新是异步的，不同实例收到推送有先后。灰度期间可能出现同一接口在两个实例上行为不同。这不是 bug，是灰度窗口的正常现象；但它要求你在设计功能开关时，不能依赖“所有实例同时切到新值”的假设。

**误关闭**。有人在 Apollo 误把 `AuthConfig.Key` 清空。代码如果不检查空值就直接使用，可能出现异常。在 `LatestConfig` 或 `GetConfig` 之后增加 normalize 逻辑（如空字符串报错、负数取 0、时间区间非法取默认区间）是必要的防线。

`fbs-sensitive-data-server` 的 `getFbsSensitiveDataServerConfig` 被包装成 `recorder.RegisterGlobalVar`，这笔全局变量还挂载了流量录制和回放的能力。这意味着热更新后录制/回放框架仍能拿到当前最新值。对经常写测试和定位问题的同学来说，这是一个值得注意的细节：修改配置 struct 的时机可能影响录制数据的完整性。

## 配置开关：上线新功能的第一道防线

功能开关（feature toggle）是把配置管理用于行为控制的典型场景。开关通常在 Apollo 里是一个布尔字段或灰度名单，代码读取后决定走新逻辑还是旧逻辑。

### 主服务 SystemUpgrading 的真实开关

`middleware/system_upgrading/config/apollo.go` 提供了两套开关模式：

```go
type PortalSystemUpgradingConfig struct {
    Toggle    int8   `yaml:"Toggle"`
    Whitelist string `yaml:"Whitelist"`
}

type SettingEditableConfig struct {
    Disabled     bool   `yaml:"Disabled"`
    DisableBegin int64  `yaml:"DisableBegin"`
    DisableEnd   int64  `yaml:"DisableEnd"`
    Message      string `yaml:"Message"`
}
```

`Toggle` 是整数开关（`0` = 关，`1` = 开）。`Whitelist` 是灰度名单（可能是 shop_id 或 seller_id 列表），命中名单的用户即使全局开关关闭也能访问新功能。`SettingEditableConfig` 更进一步，把一个配置区域的“可编辑性”与时间窗口绑定——只有在 `DisableBegin` 到 `DisableEnd` 之间才允许修改。

### 设计开关的几个原则

**开关关闭时等于没上线**。新功能的所有代码路径都必须受开关控制，不能出现“开关关了但某个内部修改仍然生效”的半开关状态。这要求代码在尽可能早的位置分支，而不是写到最后一行才检查开关。

**开关有安全默认值**。`Toggle` 的零值（0）或 `Disabled` 的零值（false）必须对应当前稳定行为。这样即使 Apollo 下发失败、配置丢失或降级，服务不会意外开启未验证功能。

**开关有生命周期**。上线验证完成后，开关应该被清理，而不是永远留着。永久开关最终会变成“没人知道它影响什么”的技术债。课程不要求你在某个时间点提交清理 MR，但在实现时应当用注释注明开关的预期存活时间和清理条件。

**开关与业务逻辑分离**。不要在业务逻辑深处内联 `if toggle == 1`，这样单元测试无法独立验证新旧两套行为。把开关判断放在应用层入口，将新/旧实现作为不同的依赖注入路径，测试时可以用 fake 覆盖。

## 敏感配置的安全边界

并非所有配置都可以放入 Apollo。以下内容不得进入配置中心，更不得写入代码仓库：

- 数据库 DSN 中的用户名密码。应当在代码中使用环境变量或密钥管理服务注入，不在 Apollo 明文存储。三个仓库的 `ScormGroupConfig.MasterDsn` 在配置 struct 中保留了字段，但实际值应从安全渠道注入，不在课程资产中出现。
- API Token 和 AppKey。`FbsAgentConfig.Token`、`Token` 和 `AppKey` 等字段在生产环境不应硬编码或明文存放在 Apollo namespace 中。课程示例只保留字段名和类型声明。
- JWT 签名密钥、Session 加密密钥。这些值泄露后可以伪造认证信息，必须由专门的密钥管理服务提供，不应出现在常规配置流中。

敏感数据服务的 confighelper 文件中出现了 `Token`、`AppKey`、`JwtSecret` 等字段类型声明，这些是仓库现状。课程只说明字段在 struct 中存在，不复制、猜测或构造任何真实值。

## 配置排错：当配置值不是你以为的那个值

配置排错比业务逻辑排错更让人头疼，因为问题往往不在你刚才改的那几行代码里。以下按“我改了什么 → 实际生效的是什么 → 为什么会不一致”的结构整理出四个高频场景。

### 场景一：本地改了 chassis.yaml，服务没反应

`conf/chassis.yaml` 是 Chassis 框架的启动配置，包括 Apollo appId、namespace、cluster、日志级别和 prometheus 开关。但业务配置（如 `FbsAgent.Host`、`AuthConfig.Key`、限流阈值）通常不从 chassis.yaml 读取，而是通过 Apollo namespace 下发。本地启动如果没有设置 `apolloDisabled: false`（即未禁用 Apollo）且网络能连上公司 Apollo 服务器，代码会从远程拉配置，覆盖本地 YAML 中相同 key 的值。

排查顺序：检查 `apolloDisabled` 是否为 true → 检查 namespace 配置是否正确 → 检查网络是否能访问 Apollo → 用 `config.UnmarshalConfig` 打印实际反序列化后的 struct 值，与预期对比。

### 场景二：热更新后新值没生效

`config.RegisterListener` 注册的回调会在 Apollo 推送变更时执行，但进程内可能有其他组件缓存了旧值。如果某个 middleware 在 `Init()` 阶段把配置值赋给了自己的全局变量，热更新只更新了主 struct，middleware 的内部变量仍指向旧对象。Trace 方法是确认该组件的初始化时机和它持有的变量类型：是每次请求从 `GetConfig(ctx)` 获取，还是启动时拿了一次就不再更新。

### 场景三：不同进程同一 key 拿到不同值

Apollo 的配置粒度可以到 cluster 和 namespace 组合。Tax 服务的 `tax_api`、`tax_core`、`tax_task` 三个进程各自配置独立的 chassis.yaml block，`namespaceList` 也各不相同：`tax_task` 的 namespace 包含 `tax_task`，`tax_api` 的 namespace 包含 `application`。如果两个进程对同一个 key 表现出不同行为，先确认它们订阅的 namespace 集合是否一致，再确认 Apollo 平台侧的 cluster 配置是否有差异。

### 场景四：配置热更新后服务短暂异常

热更新不是原子操作。`Event` 回调重新执行 `LatestConfig()` 后，`parseComplexConfig()` 会再次解析嵌套 JSON 字段。如果 `parseComplexConfig` 中的某一步失败，`Event` 回调会 `return`（不更新全局变量），服务继续使用旧配置。但如果 `parseComplexConfig` 成功但业务含义错误（比如限流阈值从 1000 变成 -1），在 `Event` 完成和下一个请求到达之间，可能有请求拿到新值并触发异常行为。防御方式是在 normalize 阶段对值域做校验，非法值直接放弃更新并告警。


## 三大仓库配置实践对照

### 主服务 sbs-fbs-server 的分散式配置

主服务没有统一的 confighelper。配置 struct 分散在 `middleware/` 和 `sbs_agent/` 的各子包中：

- `middleware/apiblock/config.go`：API 限流配置
- `middleware/openapi_auth/config.go`：OpenAPI 鉴权配置
- `middleware/seller_center_auth/config.go`：Seller Center 认证配置
- `sbs_agent/db/config.go`：数据库连接配置
- `sbs_agent/saturn/sender/config.go`：Saturn 消息发送配置
- `sbs_agent/cache_backend/redis_cache/config/config.go`：Redis 缓存配置

每个模块各自定义自己的 config struct 和 yaml tag，独立注册 Apollo 监听。优点是模块边界清晰、变更影响面小；缺点是缺少一个集中看所有配置的地方，排查时需要知道配置项归属哪个模块。

### 敏感数据服务的集中式配置

敏感数据服务用一个 `confighelper/confighelper.go` 收纳了所有配置：`FbsSensitiveDataServerConfig` 包含了 Agent、Session、Auth、FileStore、数据库、限流、灰度等子配置。热更新也只注册了一个 `Event` 回调，在内部更新整个 struct 后替换全局指针。

集中式配置的读取方式是 `confighelper.GetConfig(ctx).FbsAgentConfig.Host`，调用方不需要知道 namespace 名称或 yaml tag 前缀，统一由 ConfigPrefix 管理。模式简单、新人容易上手，适合配置项较多但结构还算稳定的服务。

### Tax 服务的多进程独立配置

Tax 服务的三个进程各有一组独立的 chassis.yaml block（`tax_api`、`tax_task`、`tax_core`），namespace 组合也不同。每个进程在 `chassis.Init` 阶段只加载自己需要的配置，不会拉取其他进程的 namespace。课程没有要求你记住 Tax 的全部配置项，但从配置入手能回答：“同样一个 `go.mod` 声明的仓库，为什么三个进程行为不同？”——因为它们启动时读到的是不同的 namespace 集合。

这是一条经验法则：当三个后端仓库中任一行代码表现出“这里和另一个进程不一样”时，先查 `conf/chassis.yaml` 中的 `namespaceList`，再查 `go.mod` 的 Chassis 版本。


## 练习

### 练习一：追踪一个配置字段的完整路径

选择 `sbs-fbs-server` 中 `middleware/system_upgrading/config/apollo.go` 的 `PortalSystemUpgradingConfig.Toggle`，完成以下步骤：

1. 在 `conf/chassis.yaml` 中找到这个配置使用的 Apollo namespace。
2. 在代码中找到 `Toggle` 被读取的位置（通常在 middleware handler 的入口处）。
3. 画出配置从 Apollo 平台 → Chassis init → struct 反序列化 → handler 读取的全路径。
4. 回答：如果 Apollo 下发 `Toggle: 2`（既不是 0 也不是 1），当前代码会怎样处理？

### 练习二：为入库列表增加一个功能开关

模拟在 `sbs-fbs-server` 的 ASN 查询接口中新增一个“按创建时间范围筛选”的功能：

1. 在合适的 config struct 中增加一个 `AsnTimeFilterEnabled bool` 字段，带 yaml tag。
2. 在 handler 或 application 层中编写读取开关的代码。
3. 写出开关关闭时旧行为的回归检查项（至少三项）。
4. 写出开关打开时的功能验证项（至少三项）。
5. 设计一个非法值场景并给出处理方式（比如 Apollo 下发了字符串 "yes" 而不是 true）。

### 练习三：热更新风险评估

敏感数据服务的 `FbsPortalSoupConfig.RateLimit` 是一个 JSON 字符串字段，解析为 `map[string]int64`（path → 每秒限制次数）。

1. 如果有人在 Apollo 中将 `RateLimit` 改为非法 JSON，`Event` 回调会执行到哪一步，服务最终使用什么配置值？
2. 如果在限流配置更新过程中（`LatestConfig` 成功但尚未 `AtomicStore`），一个新请求到达，它会使用旧值还是新值？为什么？
3. 设计一个“限流阈值配置变更”的安全流程，至少包含：变更前的审核检查、变更中的灰度方式、变更后的监控验证项。


### 练习四：为敏感数据服务增加一个配置开关

参考 `SettingEditableConfig` 的模式，为敏感数据服务的 Seller Center 接口增加一个“新老 handle 切换”功能：

1. 在 `FbsSensitiveDataServerConfig` 中增加一个 `ScHandleGreyConfig` 子 struct，包含 `UseNewHandle bool` 和 `GreyShopIds []string` 两个字段。
2. 编写 normalize 逻辑：`GreyShopIds` 为空时自动 fallback 到全局 `UseNewHandle`。
3. 设计 Apollo 配置变更的流程：先在测试环境验证 → 灰度 5% → 灰度 50% → 全量 → 清理开关。
4. 列出开关清理时需要从代码中删除的内容（不限于这一个 struct）。


## 自检

完成练习后，确认以下问题都能用完整句子回答：

1. 静态配置、动态配置和环境变量各解决什么问题？FBS 仓库中哪些内容属于静态配置，哪些走 Apollo 动态配置？
2. 配置从 Apollo 到 Go struct 经过了哪几个步骤？每一步的出错如何处理？
3. 热更新的核心原理是什么？哪些配置不适合热更新，为什么？
4. 功能开关设计的三个原则是什么？开关关闭时怎么保证“等于没上线”？
5. 敏感数据（token、密钥、DSN）不能在哪些地方出现？FBS 仓库的现有 config struct 中保留了哪些敏感字段类型？

## 参考文献

- `conf/chassis*.yaml`：三个仓库的 Chassis 配置入口，包含 Apollo appId、namespace 和 cluster 声明
- `fbs-sensitive-data-server/confighelper/confighelper.go`：统一配置 struct 定义、热更新监听、流量录制集成
- `sbs-fbs-server/middleware/system_upgrading/config/apollo.go`：`PortalSystemUpgradingConfig` 和 `SettingEditableConfig` 的真实开关模式
- `fbs-tax-server/conf/chassis.yaml`：Tax 多进程的 namespace 组合方式
- Confluence `2516849432`「chassis - v0.4.3-r.8」：Chassis 框架的配置、监听和 namespace 概念（实际 API 以当前代码为准）