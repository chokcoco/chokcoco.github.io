import test from "node:test";
import assert from "node:assert/strict";
import { calculateCart } from "../src/index.js";

const baseCart = {
  member: true,
  coupon: "ORDER50",
  shippingFee: 1200,
  lines: [{ sku: "SKU-RED-CHAIR", unitPrice: 39900, quantity: 2, saleItem: false }]
};

test("金额以分计算并返回优惠明细", () => {
  const result = calculateCart(baseCart, { allowMemberWithOrderCoupon: true, freeShipping: true });
  assert.equal(result.subtotal, 79800);
  assert.equal(result.payable, 66820);
  assert.deepEqual(result.discounts.map((item) => item.amount), [7980, 5000, 1200]);
});

test("策略禁止叠加时不应用订单券", () => {
  const result = calculateCart(baseCart, { allowMemberWithOrderCoupon: false, freeShipping: false });
  // 这条测试刻意暴露存量实现缺口，完成第 5 章改造后应变为通过。
  assert.equal(result.payable, 73020);
});

test("特价商品不重复应用会员商品折扣", () => {
  const cart = { ...baseCart, coupon: null, lines: [{ ...baseCart.lines[0], saleItem: true }] };
  const result = calculateCart(cart, { allowMemberWithOrderCoupon: true, freeShipping: false });
  assert.equal(result.payable, 81000);
});
