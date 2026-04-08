// ============================================================
// βetaShop — Cart Manager
// ============================================================

const Cart = {
  items: JSON.parse(localStorage.getItem('betaCart') || '[]'),

  save() { localStorage.setItem('betaCart', JSON.stringify(this.items)); this.render(); updateCartCount(); },

  add(product) {
    const exists = this.items.find(i => i.id === product.id);
    if (exists) { showToast('Already in cart!', 'error'); return; }
    const normalized = {
      id: product.id,
      name: product.name || product.title || 'Product',
      price: product.price || 0,
      thumbnail: product.thumbnail || product.image || '',
      icon: product.thumbnail ? '' : (product.icon || '📦'),
      qty: 1,
      raw: product
    };
    this.items.push(normalized);
    this.save();
    showToast(`✓ "${normalized.name}" added to cart!`, 'success');
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  },

  updateQty(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.qty += delta;
      if (item.qty <= 0) this.remove(id);
      else this.save();
    }
  },

  total() { return this.items.reduce((s, i) => s + i.price * i.qty, 0); },

  count() { return this.items.length; },

  clear() { this.items = []; this.save(); },

  render() {
    const count = document.getElementById('cartCount');
    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (count) count.textContent = this.count();
    if (totalEl) totalEl.textContent = `Ksh ${this.total().toFixed(2)}`;
    if (!itemsEl) return;
    if (this.items.length === 0) {
      itemsEl.innerHTML = '<p class="empty-cart">Your cart is empty 🛒</p>';
      return;
    }
    itemsEl.innerHTML = this.items.map(i => `
      <div class="cart-item">
        <div class="cart-item-icon">
          ${i.thumbnail ? `<img src="${i.thumbnail}" alt="${i.name}"/>` : (i.icon || '📦')}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-price">Ksh ${(i.price * i.qty).toFixed(2)}</div>
        </div>
        <div class="cart-item-qty">
          <button onclick="Cart.updateQty('${i.id}', -1)">-</button>
          <span>${i.qty}</span>
          <button onclick="Cart.updateQty('${i.id}', 1)">+</button>
        </div>
        <button class="cart-item-remove" onclick="Cart.remove('${i.id}')">✕</button>
      </div>
    `).join('');

    const summaryEl = document.getElementById('cartSummary');
    if (summaryEl) {
      summaryEl.style.display = this.items.length > 0 ? 'block' : 'none';
      summaryEl.innerHTML = `
        <div class="cart-total">Total: Ksh ${this.total().toFixed(2)}</div>
        <button class="btn-primary" onclick="goToCheckout()">Proceed to Payment</button>
      `;
    }
  }
};

// Cart sidebar toggle
function initCart() {
  const cartToggle = document.getElementById('cartToggle');
  const cartClose = document.getElementById('cartClose');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartSidebar = document.getElementById('cartSidebar');
  const checkoutBtn = document.getElementById('checkoutBtn');

  function openCart() { cartSidebar?.classList.add('open'); cartOverlay?.classList.add('open'); }
  function closeCart() { cartSidebar?.classList.remove('open'); cartOverlay?.classList.remove('open'); }

  cartToggle?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  checkoutBtn?.addEventListener('click', () => {
    if (Cart.count() === 0) { showToast('Cart is empty!', 'error'); return; }
    goToCheckout();
  });

  Cart.render();
}

// Helper to get cart from localStorage
function getCart() {
  return JSON.parse(localStorage.getItem('betaCart') || '[]');
}

// Update cart count globally
function updateCartCount() {
  const count = document.getElementById('cartCount');
  if (count) {
    const cart = JSON.parse(localStorage.getItem('betaCart') || '[]');
    count.textContent = cart.length;
  }
}

window.Cart = Cart;
window.initCart = initCart;
window.getCart = getCart;
window.updateCartCount = updateCartCount;

window.goToCheckout = function() {
  if (!localStorage.getItem('betaToken')) {
    showToast('Please sign in before proceeding to payment.', 'error');
    setTimeout(() => window.location.href = 'auth.html', 800);
    return;
  }
  window.location.href = 'checkout.html';
};
