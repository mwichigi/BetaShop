// ============================================================
// βetaShop — Auth Manager
// ============================================================

const Auth = {
  user: JSON.parse(localStorage.getItem('betaUser') || 'null'),

  setUser(user) { this.user = user; localStorage.setItem('betaUser', JSON.stringify(user)); },
  clearUser() { this.user = null; localStorage.removeItem('betaUser'); },
  isLoggedIn() { return !!this.user && !!Api.token; },

  updateNav() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    if (this.isLoggedIn()) {
      loginBtn.textContent = this.user.name?.split(' ')[0] || 'Account';
      loginBtn.onclick = () => {
        Auth.clearUser(); Api.logout();
        Auth.updateNav();
        showToast('Signed out successfully');
      };
    } else {
      loginBtn.textContent = 'Sign In';
      loginBtn.onclick = openAuthModal;
    }
  }
};

function openAuthModal() {
  document.getElementById('authOverlay')?.classList.add('open');
}

function initAuth() {
  const overlay = document.getElementById('authOverlay');
  const closeBtn = document.getElementById('authClose');
  const tabs = document.querySelectorAll('.auth-tab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginBtn = document.getElementById('loginBtn');

  loginBtn?.addEventListener('click', openAuthModal);
  closeBtn?.addEventListener('click', () => overlay?.classList.remove('open'));
  overlay?.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('open'); });

  // Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const t = tab.dataset.tab;
      loginForm.classList.toggle('hidden', t !== 'login');
      registerForm.classList.toggle('hidden', t !== 'register');
    });
  });

  // Login
  document.getElementById('loginSubmit')?.addEventListener('click', async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const msg = document.getElementById('loginMsg');
    if (!email || !password) { msg.textContent = 'Please fill in all fields'; msg.className = 'auth-msg error'; return; }
    try {
      const data = await Api.login(email, password);
      if (data.token) {
        Auth.setUser(data.user);
        Auth.updateNav();
        overlay.classList.remove('open');
        showToast(`Welcome back, ${data.user.name}! 👋`, 'success');
      } else {
        msg.textContent = data.message || 'Invalid credentials';
        msg.className = 'auth-msg error';
      }
    } catch (e) {
      // Demo mode when backend is offline
      if (email && password) {
        const mockUser = { id: 1, name: email.split('@')[0], email };
        Auth.setUser(mockUser);
        Auth.updateNav();
        overlay.classList.remove('open');
        showToast(`Welcome, ${mockUser.name}! (Demo mode) 👋`, 'success');
      }
    }
  });

  // Register
  document.getElementById('registerSubmit')?.addEventListener('click', async () => {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const msg = document.getElementById('registerMsg');
    if (!name || !email || !password) { msg.textContent = 'Please fill in all fields'; msg.className = 'auth-msg error'; return; }
    try {
      const data = await Api.register(name, email, password);
      if (data.user) {
        msg.textContent = 'Account created! Signing you in...';
        msg.className = 'auth-msg success';
        setTimeout(async () => {
          const login = await Api.login(email, password);
          if (login.token) { Auth.setUser(login.user); Auth.updateNav(); overlay.classList.remove('open'); showToast('Account created! Welcome 🎉', 'success'); }
        }, 1000);
      } else {
        msg.textContent = data.message || 'Registration failed';
        msg.className = 'auth-msg error';
      }
    } catch(e) {
      // Demo mode
      const mockUser = { id: Date.now(), name, email };
      Auth.setUser(mockUser);
      Auth.updateNav();
      overlay.classList.remove('open');
      showToast(`Welcome, ${name}! (Demo mode) 🎉`, 'success');
    }
  });

  Auth.updateNav();
}

window.Auth = Auth;
window.openAuthModal = openAuthModal;
window.initAuth = initAuth;
