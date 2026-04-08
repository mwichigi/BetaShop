function loadLastOrder() {
  const orderContent = document.getElementById('orderContent');
  const order = getLastSavedOrder();

  if (!order || !order.items?.length) {
    if (orderContent) orderContent.innerHTML = `
      <div class="order-empty">
        <h2>No order found</h2>
        <p>You have not completed any payment yet. Place an order and come back to view it here.</p>
        <button class="btn-primary" onclick="window.location.href='shop.html'">Browse Products</button>
      </div>
    `;
    return;
  }

  const date = new Date(order.date);
  orderContent.innerHTML = `
    <section class="order-summary">
      <h2>Order #${order.id}</h2>
      <p>Placed on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</p>
      <p>Status: <strong>${order.status}</strong></p>
      <p>Phone: <strong>${order.phone || 'Not provided'}</strong></p>
      <p>Total paid: <strong>Ksh ${order.total.toFixed(2)}</strong></p>
      <p>Transaction ID: <strong>${order.transactionId || 'N/A'}</strong></p>
    </section>
    <section>
      ${order.items.map(item => `
        <div class="order-item">
          ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.name}"/>` : `<div style="width:90px;height:90px;background:var(--bg3);border-radius:14px;display:grid;place-items:center;font-size:1.5rem;">${item.icon||'📦'}</div>`}
          <div class="order-item-info">
            <h3 class="order-item-title">${item.name}</h3>
            <p>Price: Ksh ${item.price.toFixed(2)}</p>
            <p>Quantity: ${item.qty || 1}</p>
          </div>
        </div>
      `).join('')}
    </section>
    <div class="order-footer">
      <button class="btn-primary" onclick="window.location.href='shop.html'">Continue Shopping</button>
      <button class="btn-ghost" onclick="window.location.href='index.html'">Back to Home</button>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  loadLastOrder();
  if (typeof updateCartCount === 'function') updateCartCount();
});
