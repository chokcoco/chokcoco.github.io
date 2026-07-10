export function calculateCart(cart, policy) {
  const subtotal = cart.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const memberDiscount = cart.member
    ? cart.lines.reduce((sum, line) => sum + (line.saleItem ? 0 : Math.floor(line.unitPrice * line.quantity * 0.1)), 0)
    : 0;

  const afterProductDiscount = subtotal - memberDiscount;
  const couponEligible = cart.coupon === "ORDER50" && afterProductDiscount >= 50000;

  // 历史缺陷：这里没有读取 policy.allowMemberWithOrderCoupon。
  const orderDiscount = couponEligible ? 5000 : 0;
  const shippingDiscount = policy.freeShipping ? cart.shippingFee : 0;
  const payable = Math.max(0, afterProductDiscount - orderDiscount + cart.shippingFee - shippingDiscount);

  return {
    subtotal,
    discounts: [
      { type: "MEMBER_PRODUCT", amount: memberDiscount },
      { type: "ORDER_COUPON", amount: orderDiscount },
      { type: "SHIPPING", amount: shippingDiscount }
    ],
    payable
  };
}
