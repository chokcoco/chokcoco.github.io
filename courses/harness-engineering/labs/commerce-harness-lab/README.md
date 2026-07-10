# 星桥商城 Harness 实验仓库

这是 Harness Engineering 课程使用的虚构电商仓库。商品、订单、员工、运行记录和故障均为教学数据，不对应真实企业。

## 目录

```text
commerce-harness-lab/
├── case/                 # 业务需求与失败轨迹
├── starter/              # 未完成 Harness 改造的存量仓库
├── harness-overlay/      # 存量仓库的参考 Harness 覆盖层
└── greenfield/           # 从零建设时的最小仓库蓝图
```

两条业务线贯穿课程：

1. 优惠叠加与价格解释：统一会员折扣、订单券和运费优惠的组合规则。
2. 库存预占与超时释放：处理幂等重试、支付确认、取消和超时释放。

## 环境

- Node.js 22
- React 19.2
- Vite 8.1
- Java 21
- Spring Boot 4.1
- Maven 3.9+

概念路径无需安装依赖。工程路径可以先运行不依赖第三方包的检查：

```bash
node starter/scripts/audit-baseline.mjs
node harness-overlay/scripts/verify-overlay.mjs
node --test starter/packages/promotion-engine/test/*.test.js
```

Windows PowerShell 使用相同的 `node` 命令。React 和 Java 的完整构建命令见第 6 章。

## 使用顺序

- 第 3–4 章先读 `case/`，把业务请求写成任务契约并建立仓库地图。
- 第 5 章在 `starter/` 上做存量改造。
- 第 6 章用 `greenfield/` 观察新仓库的起步方式。
- 第 7–12 章逐步加入工具、边界、评测、状态和治理。
- 第 13 章选择设计路径或工程路径完成综合实践。

不要把 `harness-overlay/` 一次性复制进真实仓库。先找到当前任务的高频失败，再决定哪些文件和检查值得长期维护。
