import { calculateCart } from "@course/promotion-engine";

const cart = {
  member: true,
  coupon: "ORDER50",
  shippingFee: 1200,
  lines: [{ sku: "SKU-RED-CHAIR", name: "赤陶休闲椅", unitPrice: 39900, quantity: 2, saleItem: false }]
};

const policy = { allowMemberWithOrderCoupon: false, freeShipping: true };
const money = (value) => `¥${(value / 100).toFixed(2)}`;

export function App() {
  const quote = calculateCart(cart, policy);

  return (
    <main className="shell">
      <p className="eyebrow">STARBRIDGE CHECKOUT</p>
      <h1>确认订单</h1>
      <section className="card">
        <h2>{cart.lines[0].name}</h2>
        <p>{cart.lines[0].sku} · 数量 {cart.lines[0].quantity}</p>
        <dl>
          <div><dt>商品原价</dt><dd>{money(quote.subtotal)}</dd></div>
          {quote.discounts.filter((item) => item.amount > 0).map((item) => (
            <div key={item.type}><dt>{item.type}</dt><dd>-{money(item.amount)}</dd></div>
          ))}
          <div className="total"><dt>应付</dt><dd>{money(quote.payable)}</dd></div>
        </dl>
      </section>
      <p className="notice">教学仓库：页面仍可能与后端结算规则不一致。</p>
    </main>
  );
}
