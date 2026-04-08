// ============================================================
// βetaShop — API Client
// Connects frontend to Node.js backend + external product APIs
// ============================================================

const API_BASE = 'http://localhost:3000/api';

// Dummy products from DummyJSON (external API integration)
const DUMMY_API = 'https://dummyjson.com';

const Api = {
  token: localStorage.getItem('betaToken') || null,

  headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return h;
  },

  async get(path) {
    const r = await fetch(`${API_BASE}${path}`, { headers: this.headers() });
    return r.json();
  },

  async post(path, body) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST', headers: this.headers(), body: JSON.stringify(body)
    });
    return r.json();
  },

  async put(path, body) {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'PUT', headers: this.headers(), body: JSON.stringify(body)
    });
    return r.json();
  },

  async delete(path) {
    const r = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: this.headers() });
    return r.json();
  },

  // ── Auth ────────────────────────────────────────────────
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password });
    if (data.token) { this.token = data.token; localStorage.setItem('betaToken', data.token); }
    return data;
  },

  async register(name, email, password) {
    return this.post('/auth/register', { name, email, password });
  },

  logout() {
    this.token = null;
    localStorage.removeItem('betaToken');
    localStorage.removeItem('betaUser');
  },

  // ── Products ────────────────────────────────────────────
  async getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.get(`/products?${qs}`);
  },

  async getProduct(id) { return this.get(`/products/${id}`); },

  async createProduct(data) { return this.post('/products', data); },
  async updateProduct(id, data) { return this.put(`/products/${id}`, data); },
  async deleteProduct(id) { return this.delete(`/products/${id}`); },

  // ── Orders ──────────────────────────────────────────────
  async createOrder(items) { return this.post('/orders', { items }); },
  async getOrders() { return this.get('/orders'); },

  // ── Payments ─────────────────────────────────────────────
  async initiateMpesa(amount, phoneNumber) {
    return this.post('/payments/mpesa', { amount, phoneNumber });
  },

  // ── External: DummyJSON (demo products) ──────────────
  async fetchExternalProducts(limit = 12, skip = 0) {
    try {
      const r = await fetch(`${DUMMY_API}/products?limit=${limit}&skip=${skip}`);
      const raw = await r.json();
      if (!raw.products || !raw.products.length) return [];
      // Normalize to our schema
      return raw.products.map(p => ({
        id: `dummy-${p.id}`,
        name: p.title,
        description: p.description,
        price: parseFloat(p.price),
        category: p.category,
        image: p.thumbnail || (p.images && p.images[0]) || null,
        rating: p.rating,
        source: 'dummyjson'
      }));
    } catch(e) {
      console.warn('DummyJSON API unavailable, using fallback data', e);
      return FALLBACK_PRODUCTS;
    }
  },

  // ── Chatbot ─────────────────────────────────────────────
  async chatMessage(message, history = []) {
    return this.post('/chat', { message, history });
  }
};

// Fallback products when API/backend is unavailable
const FALLBACK_PRODUCTS = [
  { id: 'f1', name: 'Pro UI Kit', description: 'Complete component library with 200+ elements', price: 49, category: 'templates', icon: '🎨', rating: 4.9, badge: 'Bestseller' },
  { id: 'f2', name: 'Next.js Starter', description: 'Full-stack boilerplate with auth, DB, and payments', price: 79, category: 'software', icon: '⚡', rating: 4.8, badge: 'New' },
  { id: 'f3', name: 'Design System', description: 'Figma design system with dark/light themes', price: 39, category: 'graphics', icon: '🖌️', rating: 4.7, badge: null },
  { id: 'f4', name: 'SEO Course Bundle', description: 'Comprehensive SEO mastery course — 40+ hours', price: 99, category: 'courses', icon: '📚', rating: 4.9, badge: 'Popular' },
  { id: 'f5', name: 'Analytics Dashboard', description: 'React dashboard template with charts & widgets', price: 59, category: 'templates', icon: '📊', rating: 4.6, badge: null },
  { id: 'f6', name: 'Icon Pack Pro', description: '2000+ premium icons in SVG and PNG formats', price: 19, category: 'graphics', icon: '✨', rating: 4.8, badge: 'Sale' },
  { id: 'f7', name: 'VSCode Themes Bundle', description: '15 premium dark themes for VS Code', price: 12, category: 'plugins', icon: '🎭', rating: 4.5, badge: null },
  { id: 'f8', name: 'Audio FX Pack', description: '500+ royalty-free sound effects for creators', price: 29, category: 'audio', icon: '🎵', rating: 4.7, badge: 'New' },
];

window.Api = Api;
window.FALLBACK_PRODUCTS = FALLBACK_PRODUCTS;
