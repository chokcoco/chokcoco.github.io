# 架构记录（旧）

- `apps/storefront`：顾客结算页。
- `apps/ops-console`：运营后台。
- `packages/promotion-engine`：两个前端应用共享的促销计算。
- `services/commerce-api`：订单、定价和库存接口。

历史上前端允许独立预估价格。后端后来增加了自己的促销逻辑，两边尚未建立契约测试。
