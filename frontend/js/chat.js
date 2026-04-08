// ===== CART MANAGEMENT (localStorage) =====

function getCart() {
  return JSON.parse(localStorage.getItem('betaCart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('betaCart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  showToast(`"${product.title}" added to cart!`);
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
}

function updateQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) return removeFromCart(id);
  }
  saveCart(cart);
  renderCart();
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = total);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const summaryEl = document.getElementById('cartSummary');
  if (!container) return;

  const cart = getCart();

  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>Your cart is empty</h3><p><a href="shop.html" style="color:var(--accent)">Continue Shopping →</a></p></div>';
    if (summaryEl) summaryEl.style.display = 'none';
    return;
  }

  const total = cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/80'"/>
      <div class="cart-item-info">
        <h3>${item.title}</h3>
        <div class="price">Ksh ${item.price.toFixed(2)} × ${item.qty || 1}</div>
        <div style="color:var(--text-muted);font-size:0.85rem">Subtotal: Ksh ${(item.price * (item.qty || 1)).toFixed(2)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:center">
        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        <span>${item.qty || 1}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove">✕</button>
    </div>
  `).join('');

  if (summaryEl) {
    summaryEl.style.display = 'block';
    summaryEl.innerHTML = `
      <div class="total">Total: Ksh ${total.toFixed(2)}</div>
      <button class="btn-primary" style="border:none;cursor:pointer;width:100%;text-align:center" onclick="checkout()">
        Proceed to Checkout
      </button>
      <button class="btn-secondary btn-sm" style="width:100%;margin-top:0.5rem;text-align:center" onclick="clearCart()">
        Clear Cart
      </button>
    `;
  }
}

function clearCart() {
  localStorage.removeItem('betaCart');
  updateCartCount();
  renderCart();
}

function checkout() {
  const cart = getCart();
  if (cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }
  const token = localStorage.getItem('betaToken');
  if (!token) {
    showToast('Please sign in to checkout');
    setTimeout(() => window.location.href = 'auth.html', 1000);
    return;
  }
  window.location.href = 'checkout.html';
}

function renderCheckout() {
  const itemsEl = document.getElementById('checkoutItems');
  const summaryEl = document.getElementById('checkoutSummary');
  if (!itemsEl || !summaryEl) return;

  const cart = getCart();
  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="empty-state"><h3>Your cart is empty</h3><p><a href="shop.html" style="color:var(--accent)">Continue Shopping →</a></p></div>';
    summaryEl.style.display = 'none';
    return;
  }

  const total = cart.reduce((s, i) => s + (i.price * (i.qty || 1)), 0);
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.thumbnail}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/80'"/>
      <div class="cart-item-info">
        <h3>${item.title}</h3>
        <div class="price">Ksh ${item.price.toFixed(2)} × ${item.qty || 1}</div>
        <div style="color:var(--text-muted);font-size:0.85rem">Subtotal: Ksh ${(item.price * (item.qty || 1)).toFixed(2)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;align-items:center">
        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
        <span>${item.qty || 1}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Remove">✕</button>
    </div>
  `).join('');

  summaryEl.style.display = 'block';
  summaryEl.innerHTML = `
    <div class="total">Total: Ksh ${total.toFixed(2)}</div>
    <button class="btn-primary" style="border:none;cursor:pointer;width:100%;text-align:center" onclick="proceedToPayment()">
      Proceed to Payment
    </button>
    <button class="btn-secondary btn-sm" style="width:100%;margin-top:0.5rem;text-align:center" onclick="checkout()">
      Refresh Checkout
    </button>
  `;
}

function proceedToPayment() {
  const cart = getCart();
  if (!cart.length) {
    showToast('Your cart is empty!');
    return;
  }
  // Temporarily skip login check to test MPesa STK push
  // const token = localStorage.getItem('betaToken');
  // if (!token) {
  //   showToast('Please sign in to proceed to payment');
  //   setTimeout(() => window.location.href = 'auth.html', 900);
  //   return;
  // }
  window.location.href = 'payment.html';
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();
  renderCheckout();
});
