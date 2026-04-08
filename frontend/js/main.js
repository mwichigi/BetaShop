// ===== CONFIG =====
const API = 'https://dummyjson.com';
const BACKEND = 'http://localhost:3000/api';

// ===== TOAST =====
function showToast(msg, type = 'info') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = 'toast show';
  if (type === 'success') t.style.backgroundColor = '#10b981';
  else if (type === 'error') t.style.backgroundColor = '#ef4444';
  else t.style.backgroundColor = '#3b82f6';
  
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== NAVIGATION =====
function goToCategory(slug) {
  window.location.href = `shop.html?category=${encodeURIComponent(slug)}`;
}

// ===== FETCH PRODUCTS FROM DUMMYJSON =====
async function fetchProducts(params = {}) {
  let url = `${API}/products`;
  const qp = new URLSearchParams();

  if (params.category) {
    url = `${API}/products/category/${params.category}`;
  } else if (params.search) {
    url = `${API}/products/search`;
    qp.set('q', params.search);
  }

  if (params.limit) qp.set('limit', params.limit);
  if (params.skip) qp.set('skip', params.skip);
  if (params.sortBy) qp.set('sortBy', params.sortBy);
  if (params.order) qp.set('order', params.order);

  const qs = qp.toString();
  const res = await fetch(url + (qs ? '?' + qs : ''));
  return res.json();
}

// ===== RENDER PRODUCT CARD =====
function renderProductCard(product) {
  const stars = '★'.repeat(Math.round(product.rating)) + '☆'.repeat(5 - Math.round(product.rating));
  return `
    <div class="product-card" onclick="openProductModal(${product.id})">
      <img src="${product.thumbnail}" alt="${product.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'"/>
      <div class="product-card-body">
        <h3 title="${product.title}">${product.title}</h3>
        <div class="price">Ksh ${product.price.toFixed(2)}</div>
        <div class="rating">${stars} (${product.rating})</div>
        <span class="category-tag">${product.category}</span>
        <button class="add-cart-btn" onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

// ===== USER SESSION =====
function getSignedInUser() {
  return JSON.parse(localStorage.getItem('betaUser') || 'null');
}

function getInitials(user) {
  if (!user) return '';
  const firstName = (user.firstName || '').trim();
  const lastName = (user.lastName || '').trim();
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (user.name) {
    const parts = user.name.split(' ').filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
  }
  return (user.email || 'U').slice(0, 2).toUpperCase();
}

function updateHomepageAuthNav() {
  const signInLink = document.getElementById('homeSignInLink');
  const userPill = document.getElementById('homeUserPill');
  const user = getSignedInUser();
  if (!signInLink || !userPill) return;

  if (user) {
    signInLink.style.display = 'none';
    userPill.style.display = 'inline-flex';
    if (user.profileImage) {
      userPill.innerHTML = `<img src="${user.profileImage}" alt="${getInitials(user)}"/>`;
      userPill.classList.add('user-pill-image');
    } else {
      userPill.textContent = getInitials(user);
      userPill.classList.remove('user-pill-image');
    }
    userPill.title = user.name || user.email || 'Profile';
  } else {
    signInLink.style.display = 'inline-flex';
    userPill.style.display = 'none';
    userPill.innerHTML = '';
  }
}

// ===== LOAD FEATURED PRODUCTS (Homepage) =====
async function loadFeaturedProducts() {
  const grid = document.getElementById('featuredProducts');
  if (!grid) return;

  try {
    const data = await fetchProducts({ limit: 8 });
    if (data.products && data.products.length > 0) {
      grid.innerHTML = data.products.map(renderProductCard).join('');
    } else {
      grid.innerHTML = '<div class="empty-state"><h3>No products found</h3></div>';
    }
  } catch (err) {
    grid.innerHTML = '<div class="empty-state"><h3>Failed to load products</h3><p>Check your internet connection</p></div>';
  }
}

// ===== PRODUCT MODAL =====
async function openProductModal(id) {
  try {
    const product = await fetch(`${API}/products/${id}`).then(r => r.json());
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const tags = (product.tags || []).map(t => `<span class="modal-tag">${t}</span>`).join('');
    const discount = product.discountPercentage > 0
      ? `<span style="color:#888;font-size:0.9rem;text-decoration:line-through;margin-left:0.5rem">Ksh ${(product.price / (1 - product.discountPercentage/100)).toFixed(2)}</span>`
      : '';

    overlay.innerHTML = `
      <div class="modal">
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        <div class="modal-product">
          <div>
            <img src="${product.thumbnail}" alt="${product.title}" onerror="this.src='https://via.placeholder.com/400x300'"/>
          </div>
          <div>
            <span class="modal-tag" style="margin-bottom:0.5rem;display:inline-block">${product.category}</span>
            <h2>${product.title}</h2>
            <div class="modal-price">Ksh ${product.price.toFixed(2)} ${discount}</div>
            <div style="color:#f59e0b;margin-bottom:0.8rem">★ ${product.rating} &nbsp;·&nbsp; ${product.stock} in stock</div>
            <p>${product.description}</p>
            <div class="modal-tags" style="margin-top:1rem">${tags}</div>
            <div style="margin-top:0.5rem;color:#888;font-size:0.85rem">
              ${product.brand ? `Brand: ${product.brand}` : ''} 
              ${product.warrantyInformation ? `&nbsp;·&nbsp; ${product.warrantyInformation}` : ''}
            </div>
            <button class="btn-primary" style="margin-top:1.5rem;border:none;cursor:pointer;padding:0.9rem 2rem"
              onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}); this.closest('.modal-overlay').remove()">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  } catch (err) {
    showToast('Failed to load product details');
  }
}

// ===== CHATBOT =====
function toggleChat() {
  const w = document.getElementById('chatWindow');
  if (w) w.style.display = w.style.display === 'none' ? 'flex' : 'none';
  if (w) w.style.flexDirection = 'column';
}

function sendChat() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  if (!input || !messages || !input.value.trim()) return;

  const msg = input.value.trim();
  input.value = '';

  messages.innerHTML += `<div class="chat-msg user">${msg}</div>`;

  setTimeout(() => {
    const lower = msg.toLowerCase();
    let reply = "I'm here to help! You can ask me about products, categories, or orders.";
    if (lower.includes('price') || lower.includes('cost')) reply = 'We have products ranging from $1 to $10,000+. Check our shop for current prices!';
    else if (lower.includes('ship') || lower.includes('deliver')) reply = 'We offer fast shipping on all products. Delivery times vary by location.';
    else if (lower.includes('return') || lower.includes('refund')) reply = 'Most products have a 30-day return policy. Check individual product pages for details.';
    else if (lower.includes('category') || lower.includes('categor')) reply = 'We have beauty, smartphones, laptops, furniture, fragrances, groceries, and more!';
    messages.innerHTML += `<div class="chat-msg bot">${reply}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 600);

  messages.scrollTop = messages.scrollHeight;
}

function loadFooter() {
  const footerContainer = document.getElementById("footer");
  if (!footerContainer) return;

  fetch("../footer/footer.html")
    .then(res => {
      if (!res.ok) {
        throw new Error('Footer could not be loaded');
      }
      return res.text();
    })
    .then(data => {
      footerContainer.innerHTML = data;
    })
    .catch(err => {
      console.error(err);
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
  updateCartCount();
  updateHomepageAuthNav();
  loadFooter();
});
