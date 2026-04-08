// ============================================================
// βetaShop — Auth Page Logic
// Handles login/register on auth.html page
// ============================================================

const BACKEND = 'http://localhost:3000/api';

function showLoginCard() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
  document.getElementById('authTitle').textContent = 'Welcome back';
  document.getElementById('authError').textContent = '';
}

function showRegisterCard() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('authTitle').textContent = 'Register';
  document.getElementById('authError').textContent = '';
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('authError');
  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields';
    return;
  }

  const btn = event.target;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.textContent = 'Signing in...';

  try {
    // Try backend first
    const res = await fetch(`${BACKEND}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('betaToken', data.token);
      localStorage.setItem('betaUser', JSON.stringify(data.user));
      showToast('✓ Successfully signed in!');
      setTimeout(() => window.location.href = 'index.html', 1200);
    } else {
      showToast('✗ Sign in not successful!', 'error');
      errEl.textContent = data.error || 'Invalid credentials';
    }
  } catch (e) {
    console.error('Backend login failed:', e);
    showToast('✗ Could not connect to server', 'error');
    errEl.textContent = 'Backend may be offline. Check your connection.';
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.textContent = 'Sign In';
  }
}

async function register() {
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const errEl = document.getElementById('authError');
  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters';
    return;
  }

  const username = email.split('@')[0] || 'customer';
  const firstName = username;
  const lastName = '';

  const btn = event.target;
  btn.disabled = true;
  btn.style.opacity = '0.6';
  btn.textContent = 'Creating account...';

  try {
    const res = await fetch(`${BACKEND}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password
      })
    });
    const data = await res.json();
    if (res.ok && data.token) {
      localStorage.setItem('betaToken', data.token);
      localStorage.setItem('betaUser', JSON.stringify(data.user));
      showToast('✓ Successfully Registered!');
      setTimeout(() => window.location.href = 'index.html', 1200);
    } else {
      showToast('✗ Registration failed', 'error');
      errEl.textContent = data.error || 'Account creation failed';
    }
  } catch (e) {
    console.error('Backend register failed:', e);
    showToast('✗ Could not connect to server', 'error');
    errEl.textContent = 'Unable to register. Check that the backend is running.';
  } finally {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.textContent = 'Create Account';
  }
}

function initAuthPage() {
  const loginBtnElement = document.getElementById('loginBtn');
  const registerBtnElement = document.getElementById('registerBtn');
  const toRegisterLink = document.getElementById('toRegisterLink');
  const toSignInLink = document.getElementById('toSignInLink');

  loginBtnElement?.addEventListener('click', login);
  registerBtnElement?.addEventListener('click', register);
  toRegisterLink?.addEventListener('click', (e) => { e.preventDefault(); showRegisterCard(); });
  toSignInLink?.addEventListener('click', (e) => { e.preventDefault(); showLoginCard(); });

  window.showLoginCard = showLoginCard;
  window.showRegisterCard = showRegisterCard;
  window.login = login;
  window.register = register;

  showLoginCard();

  const cart = JSON.parse(localStorage.getItem('betaCart') || '[]');
  const cartCount = document.getElementById('cartCount');
  if (cartCount) cartCount.textContent = cart.length;
}

// Initialize auth page on load
document.addEventListener('DOMContentLoaded', initAuthPage);