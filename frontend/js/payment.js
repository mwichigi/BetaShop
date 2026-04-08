const PAYMENT_API = 'http://localhost:3000/api/payments';

function selectPayment(method) {
  document.getElementById('mpesaOption')?.classList.toggle('active', method === 'mpesa');
  document.getElementById('paypalOption')?.classList.toggle('active', method === 'paypal');
  renderPaymentForm(method);
}

function formatCartItem(item) {
  return `
    <div class="cart-item" style="display:flex;gap:1rem;align-items:center;margin-bottom:1rem;">
      <img src="${item.thumbnail}" alt="${item.title}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;"/>
      <div style="flex:1;">
        <h3 style="margin:0 0 0.25rem">${item.title}</h3>
        <div style="font-size:0.95rem;color:#aaa">Ksh ${item.price.toFixed(2)} × ${item.qty || 1}</div>
      </div>
      <div style="font-weight:700">Ksh ${(item.price * (item.qty || 1)).toFixed(2)}</div>
    </div>
  `;
}

function renderPaymentSummary() {
  const cart = window.getCart ? getCart() : [];
  const summary = document.getElementById('paymentSummary');
  if (!summary) return;
  if (!cart.length) {
    summary.innerHTML = '<div class="empty-state"><h3>Your cart is empty</h3><p><a href="shop.html" style="color:var(--accent)">Continue Shopping →</a></p></div>';
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  summary.innerHTML = `
    <div class="cart-summary" style="padding:1.5rem;border:1px solid var(--border);border-radius:18px;background:var(--surface);">
      <h2 style="margin-top:0;margin-bottom:1rem">Order summary</h2>
      ${cart.map(formatCartItem).join('')}
      <div class="total" style="display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin-top:1rem;">Total: <span>Ksh ${total.toFixed(2)}</span></div>
    </div>
  `;
}

function renderPaymentForm(method = 'mpesa') {
  const form = document.getElementById('paymentForm');
  if (!form) return;
  const cart = window.getCart ? getCart() : [];
  const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  if (!cart.length) {
    form.innerHTML = '<p class="empty-state">Your cart is empty. Add products before paying.</p>';
    return;
  }

  if (method === 'mpesa') {
    form.innerHTML = `
      <div style="display:grid;gap:1rem;max-width:500px;">
        <label style="font-weight:700">Mpesa Number</label>
        <input id="mpesaPhone" type="tel" placeholder="07XXXXXXXX" style="padding:1rem;border-radius:15px;border:1px solid var(--border);width:100%;" />
        <button class="btn-primary" style="border:none;cursor:pointer;width:100%;padding:1rem;font-size:1rem;" onclick="payWithMpesa()">
          Pay Ksh ${total.toFixed(2)} with Mpesa
        </button>
      </div>
    `;
  } else {
    form.innerHTML = `
      <div class="empty-state">
        <h3>PayPal is not available yet</h3>
        <p>Please choose Mpesa for checkout today.</p>
      </div>
    `;
  }
}

async function payWithMpesa() {
  const phoneInput = document.getElementById('mpesaPhone');
  const phone = phoneInput?.value.trim();
  const cart = window.getCart ? getCart() : [];
  if (!cart.length) {
    showToast('Your cart is empty');
    return;
  }
  if (!phone) {
    showToast('Enter your Mpesa number');
    return;
  }
  if (!/^0?7\d{8}$/.test(phone) && !/^2547\d{8}$/.test(phone)) {
    showToast('Enter a valid Kenyan Mpesa number');
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  const token = localStorage.getItem('betaToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${PAYMENT_API}/mpesa`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount: total, phoneNumber: phone })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      showToast('MPesa STK push sent. Enter your PIN on your phone.');
    } else {
      showToast(data.message || 'Payment request failed');
    }
  } catch (error) {
    console.error(error);
    showToast('Could not start MPesa payment');
  }
}

window.selectPayment = selectPayment;
window.payWithMpesa = payWithMpesa;

window.addEventListener('DOMContentLoaded', () => {
  updateCartCount?.();
  selectPayment('mpesa');
  renderPaymentSummary();
});
