// ============================================================
// βetaShop — Checkout & M-Pesa Payment Handler
// ============================================================

const PAYMENT_API = 'http://localhost:3000/api/payments';

// Global state for M-Pesa transaction
let currentTransaction = {
  checkoutRequestId: null,
  merchantRequestId: null,
  isPolling: false,
  pollCount: 0,
  maxPolls: 90 // ~90 seconds of polling
};

// ============================================
// RENDER CHECKOUT PAGE
// ============================================

function renderCheckout() {
  const cart = JSON.parse(localStorage.getItem('betaCart') || '[]');
  const itemsEl = document.getElementById('checkoutItems');
  const summaryEl = document.getElementById('checkoutSummary');
  const paymentEl = document.getElementById('paymentSection');
  const cartCount = document.getElementById('cartCount');

  // Update cart count
  if (cartCount) cartCount.textContent = cart.length;

  // Empty cart
  if (cart.length === 0) {
    if (itemsEl) itemsEl.innerHTML = '<div class="empty-state"><h3>Your cart is empty</h3><p><a href="shop.html" style="color:var(--accent)">Continue Shopping →</a></p></div>';
    if (summaryEl) summaryEl.style.display = 'none';
    if (paymentEl) paymentEl.style.display = 'none';
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);

  // Render cart items
  if (itemsEl) {
    itemsEl.innerHTML = cart.map(item => `
      <div class="cart-item" style="padding: 1rem; border: 1px solid var(--border); border-radius: 12px; display: flex; gap: 1rem; align-items: center;">
        <div style="width: 80px; height: 80px; background: var(--surface); border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
          ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;"/>` : (item.icon || '📦')}
        </div>
        <div style="flex: 1;">
          <h4 style="margin: 0 0 0.25rem;">${item.name}</h4>
          <div style="font-size: 0.9rem; color: var(--text-muted);">Ksh ${item.price.toFixed(2)}</div>
          <div style="font-size: 0.9rem; color: var(--text-muted);">Qty: ${item.qty || 1}</div>
        </div>
        <button class="cart-item-remove" onclick="Cart.remove('${item.id}')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">✕</button>
      </div>
    `).join('');
  }

  // Render order summary
  if (summaryEl) {
    summaryEl.innerHTML = `
      <h3 style="margin-top: 0;">Order Summary</h3>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <span>Subtotal:</span>
        <span>Ksh ${total.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted);">
        <span>Shipping:</span>
        <span>Free</span>
      </div>
      <div style="border-top: 1px solid var(--border); padding-top: 0.75rem; display: flex; justify-content: space-between; font-weight: 700; font-size: 1.1rem;">
        <span>Total:</span>
        <span>Ksh ${total.toFixed(2)}</span>
      </div>
    `;
    summaryEl.style.display = 'block';
  }

  // Render payment section
  if (paymentEl) {
    paymentEl.style.display = 'block';
    const btn = document.getElementById('mpesaPayBtn');
    if (btn) document.getElementById('totalAmount').textContent = total.toFixed(2);
  }
}

// ============================================
// M-PESA STK PUSH FLOW
// ============================================

async function initiateMpesaPayment() {
  const phone = document.getElementById('mpesaPhone').value.trim();
  const cart = JSON.parse(localStorage.getItem('betaCart') || '[]');

  if (!cart.length) {
    showToast('Your cart is empty', 'error');
    return;
  }

  const token = localStorage.getItem('betaToken');
  if (!token) {
    showToast('Please sign in before proceeding to payment', 'error');
    setTimeout(() => window.location.href = 'auth.html', 800);
    return;
  }

  if (!phone) {
    showToast('Please enter your M-Pesa phone number', 'error');
    return;
  }

  // Validate phone format: 07XXXXXXXX or 254XXXXXXXX  
  if (!/^(0|254)?7\d{8}$/.test(phone.replace(/\s/g, ''))) {
    showToast('Invalid phone format. Use 07XXXXXXXX or 254XXXXXXXX', 'error');
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
  currentTransaction.phone = phone;
  const btn = document.getElementById('mpesaPayBtn');
  const phoneInput = document.getElementById('mpesaPhone');

  // Disable inputs
  btn.disabled = true;
  phoneInput.disabled = true;
  btn.style.opacity = '0.6';
  btn.textContent = 'Initiating STK Push...';

  try {
    const token = localStorage.getItem('betaToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    console.log('📲 Sending M-Pesa request...', { amount: total, phoneNumber: phone });

    const response = await fetch(`${PAYMENT_API}/mpesa`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        amount: total, 
        phoneNumber: phone 
      })
    });

    const data = await response.json();

    console.log('📲 M-Pesa Response:', data);

    if (response.ok && data.success) {
      // Save transaction IDs for polling
      currentTransaction.checkoutRequestId = data.data?.CheckoutRequestID;
      currentTransaction.merchantRequestId = data.data?.MerchantRequestID;

      const order = {
        id: data.data?.CheckoutRequestID || `ORD-${Date.now()}`,
        date: new Date().toISOString(),
        items: cart,
        total,
        phone,
        transactionId: data.data?.CheckoutRequestID || null,
        status: 'pending'
      };
      saveOrder(order);
      Cart.clear();
      updateCartCount();

      showToast('✅ STK Push sent! Check your phone and enter PIN. Your order is now in View Order.', 'success');

      // Start polling for payment status
      startPaymentPolling();
    } else {
      const errorMsg = data.message || 'M-Pesa payment failed';
      showToast(`❌ ${errorMsg}`, 'error');
      console.error('M-Pesa error:', data);
    }
  } catch (error) {
    console.error('M-Pesa error:', error);
    showToast('❌ Could not connect to backend. Is it running on port 3000?', 'error');
  } finally {
    // Re-enable inputs
    btn.disabled = false;
    phoneInput.disabled = false;
    btn.style.opacity = '1';
    btn.textContent = `Pay Ksh ${(cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0)).toFixed(2)} with M-Pesa`;
  }
}

// ============================================
// POLLING FOR PAYMENT STATUS
// ============================================

function startPaymentPolling() {
  const statusEl = document.getElementById('paymentStatus');
  
  // Create status element if not exists
  if (!statusEl) {
    const paymentSection = document.getElementById('paymentSection');
    const newStatus = document.createElement('div');
    newStatus.id = 'paymentStatus';
    newStatus.style.cssText = 'margin-top: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); text-align: center;';
    paymentSection.appendChild(newStatus);
  }

  currentTransaction.isPolling = true;
  currentTransaction.pollCount = 0;

  pollPaymentStatus();
}

async function pollPaymentStatus() {
  if (!currentTransaction.isPolling) return;
  if (currentTransaction.pollCount >= currentTransaction.maxPolls) {
    showToast('⏱️ Payment timeout. Please check your M-Pesa messages.', 'error');
    const statusEl = document.getElementById('paymentStatus');
    if (statusEl) statusEl.innerHTML = '❌ Payment request timed out (after 90 seconds)';
    currentTransaction.isPolling = false;
    return;
  }

  currentTransaction.pollCount++;
  const statusEl = document.getElementById('paymentStatus');
  const elapsed = currentTransaction.pollCount;

  // Update UI
  if (statusEl) {
    statusEl.innerHTML = `
      ⏳ Waiting for payment confirmation...
      <br/><small>Elapsed: ${elapsed}s</small>
    `;
  }

  // Poll every second
  setTimeout(pollPaymentStatus, 1000);
}

// ============================================
// HANDLE PAYMENT CALLBACK (from backend)
// ============================================

function handlePaymentCallback(result) {
  const statusEl = document.getElementById('paymentStatus');
  currentTransaction.isPolling = false;

  if (result.success) {
    const cart = JSON.parse(localStorage.getItem('betaCart') || '[]');
    const total = result.amount || cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const order = {
      id: result.transactionId || `ORD-${Date.now()}`,
      date: new Date().toISOString(),
      items: cart,
      total,
      phone: currentTransaction.phone || '',
      transactionId: result.transactionId || null,
      status: 'paid'
    };
    saveOrder(order);
    Cart.clear();
    updateCartCount();

    if (statusEl) {
      statusEl.innerHTML = `
        <h3 style="color: #10b981; margin: 0 0 0.5rem;">✅ Payment Successful!</h3>
        <p>Transaction ID: ${order.transactionId || order.id}</p>
        <p>Amount: Ksh ${order.total.toFixed(2)}</p>
        <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-top:1rem; justify-content:center;">
          <button class="btn-primary" onclick="window.location.href='view-order.html'">View Order</button>
          <button class="btn-ghost" onclick="window.location.href='index.html'">Back to Home</button>
        </div>
      `;
    }
    showToast('🎉 Payment successful! Order confirmed.', 'success');
    Cart.clear();
    updateCartCount();
  } else {
    if (statusEl) {
      statusEl.innerHTML = `
        <h3 style="color: #ef4444; margin: 0 0 0.5rem;">❌ Payment Failed</h3>
        <p>${result.message || 'Transaction was cancelled'}</p>
      `;
    }
    showToast('❌ Payment failed or cancelled.', 'error');
  }
}

// ============================================
// INITIALIZE CHECKOUT PAGE
// ============================================

function initCheckout() {
  const mpesaPayBtn = document.getElementById('mpesaPayBtn');
  if (mpesaPayBtn) {
    mpesaPayBtn.addEventListener('click', initiateMpesaPayment);
  }

  // Re-render on storage changes (e.g., from other tabs)
  window.addEventListener('storage', renderCheckout);

  renderCheckout();
}

document.addEventListener('DOMContentLoaded', initCheckout);

// Export for global use
window.initiateMpesaPayment = initiateMpesaPayment;
window.handlePaymentCallback = handlePaymentCallback;
