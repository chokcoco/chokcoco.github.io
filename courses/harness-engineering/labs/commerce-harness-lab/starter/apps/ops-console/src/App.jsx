const reservations = [
  { id: "rsv-1001", sku: "SKU-RED-CHAIR", quantity: 1, state: "RESERVED", expiresAt: "15:05" },
  { id: "rsv-1002", sku: "SKU-RED-CHAIR", quantity: 1, state: "RESERVED", expiresAt: "15:06" }
];

export function App() {
  return (
    <main className="shell">
      <header><p>STARBRIDGE OPS</p><h1>库存预占</h1></header>
      <table>
        <thead><tr><th>预占号</th><th>SKU</th><th>数量</th><th>状态</th><th>到期</th></tr></thead>
        <tbody>{reservations.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.sku}</td><td>{item.quantity}</td><td>{item.state}</td><td>{item.expiresAt}</td></tr>)}</tbody>
      </table>
      <p className="warning">两个预占可能来自同一次网络重试，当前页面没有幂等键和冲突原因。</p>
    </main>
  );
}
