// ============================================================
// βetaShop — Local Order Store
// ============================================================

function getSavedOrders() {
  return JSON.parse(localStorage.getItem('betaOrders') || '[]');
}

function getLastSavedOrder() {
  return JSON.parse(localStorage.getItem('betaLastOrder') || 'null');
}

function saveOrder(order) {
  if (!order || !order.id) return;
  const orders = getSavedOrders();
  const existingIndex = orders.findIndex(o => o.id === order.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.unshift(order);
  }
  localStorage.setItem('betaLastOrder', JSON.stringify(order));
  localStorage.setItem('betaOrders', JSON.stringify(orders));
}

function clearSavedOrders() {
  localStorage.removeItem('betaLastOrder');
  localStorage.removeItem('betaOrders');
}

window.getSavedOrders = getSavedOrders;
window.getLastSavedOrder = getLastSavedOrder;
window.saveOrder = saveOrder;
window.clearSavedOrders = clearSavedOrders;
