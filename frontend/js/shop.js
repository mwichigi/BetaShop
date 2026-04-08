// ============================================================
// βetaShop — Shop Page JS
// ============================================================

let allProducts = [];
let currentPage = 1;
const perPage = 8;
let activeCategory = 'all';
let activeMinPrice = 0;
let activeMaxPrice = Infinity;
let activeRating = 0;
let activeSort = 'default';

async function loadShopProducts() {
  let products = [];
  try {
    const data = await Api.getProducts({ limit: 100 });
    if (data.products?.length) { products = data.products; }
    else throw new Error('empty');
  } catch {
    try {
      const ext = await Api.fetchExternalProducts(20);
      products = [...FALLBACK_PRODUCTS, ...ext];
    } catch {
      products = FALLBACK_PRODUCTS;
    }
  }
  allProducts = products;
  // check URL param
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat) {
    activeCategory = cat;
    document.querySelectorAll('.filter-option[data-cat]').forEach(o => {
      o.classList.toggle('active', o.dataset.cat === cat || (cat === 'all' && o.dataset.cat === 'all'));
    });
  }
  renderShop();
}

function getFiltered() {
  let list = [...allProducts];
  if (activeCategory !== 'all') list = list.filter(p => p.category?.toLowerCase() === activeCategory);
  list = list.filter(p => p.price >= activeMinPrice && p.price <= activeMaxPrice);
  if (activeRating > 0) list = list.filter(p => (p.rating || 0) >= activeRating);
  switch (activeSort) {
    case 'price_asc': list.sort((a,b) => a.price - b.price); break;
    case 'price_desc': list.sort((a,b) => b.price - a.price); break;
    case 'rating': list.sort((a,b) => (b.rating||0) - (a.rating||0)); break;
  }
  return list;
}

function renderShop() {
  const grid = document.getElementById('shopGrid');
  const countEl = document.getElementById('resultsCount');
  const titleEl = document.getElementById('shopTitle');
  const paginationEl = document.getElementById('pagination');
  const filtered = getFiltered();
  const total = filtered.length;
  const start = (currentPage - 1) * perPage;
  const page = filtered.slice(start, start + perPage);

  if (titleEl) titleEl.textContent = activeCategory === 'all' ? 'All Products' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
  if (countEl) countEl.textContent = `${total} product${total !== 1 ? 's' : ''} found`;
  if (grid) grid.innerHTML = page.length ? page.map(renderProductCard).join('') : '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:60px 0">No products found for these filters.</div>';

  // Pagination
  const pages = Math.ceil(total / perPage);
  if (paginationEl) {
    paginationEl.innerHTML = Array.from({length:pages},(_, i) => `<button class="page-btn${i+1===currentPage?' active':''}" onclick="goToPage(${i+1})">${i+1}</button>`).join('');
  }
}

function goToPage(n) { currentPage = n; renderShop(); window.scrollTo({top:0,behavior:'smooth'}); }
window.goToPage = goToPage;

function initShopFilters() {
  document.querySelectorAll('.filter-option[data-cat]').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.filter-option[data-cat]').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      activeCategory = opt.dataset.cat;
      currentPage = 1;
      renderShop();
    });
  });

  document.querySelectorAll('.filter-option[data-rating]').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.filter-option[data-rating]').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      activeRating = parseFloat(opt.dataset.rating);
      currentPage = 1;
      renderShop();
    });
  });

  document.getElementById('applyFilter')?.addEventListener('click', () => {
    const min = parseFloat(document.getElementById('priceMin').value) || 0;
    const max = parseFloat(document.getElementById('priceMax').value) || Infinity;
    activeMinPrice = min; activeMaxPrice = max; currentPage = 1;
    renderShop();
  });

  document.getElementById('sortSelect')?.addEventListener('change', e => {
    activeSort = e.target.value; currentPage = 1; renderShop();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCart(); initAuth(); initShopFilters(); loadShopProducts();
});
