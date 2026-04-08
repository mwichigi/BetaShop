// Profile page script
function getSignedInUser() {
  return JSON.parse(localStorage.getItem('betaUser') || 'null');
}

function getSavedProfiles() {
  return JSON.parse(localStorage.getItem('betaUserProfiles') || '{}');
}

function saveProfileToStore(user) {
  if (!user || !user.email) return;
  const profiles = getSavedProfiles();
  profiles[user.email] = {
    ...(profiles[user.email] || {}),
    ...user,
    email: user.email
  };
  localStorage.setItem('betaUserProfiles', JSON.stringify(profiles));
}

function saveUser(user) {
  localStorage.setItem('betaUser', JSON.stringify(user));
  saveProfileToStore(user);
}

function showToast(message, type = 'info') {
  let toast = document.getElementById('profileToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'profileToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  if (type === 'success') toast.style.background = '#10b981';
  else if (type === 'error') toast.style.background = '#ef4444';
  else toast.style.background = '#3b82f6';
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function getInitials(user) {
  if (!user) return 'U';
  const firstName = (user.firstName || '').trim();
  const lastName = (user.lastName || '').trim();
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (user.name) {
    const parts = user.name.split(' ').filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
  }
  return (user.email || 'U').slice(0, 2).toUpperCase();
}

function getMergedProfile(user) {
  if (!user || !user.email) return user;
  const profiles = getSavedProfiles();
  return { ...user, ...(profiles[user.email] || {}) };
}

function setProfileValues(user) {
  const merged = getMergedProfile(user);
  document.getElementById('profileName').textContent = merged.name || `${merged.firstName || ''} ${merged.lastName || ''}`.trim() || 'My Profile';
  document.getElementById('profileEmail').textContent = merged.email || '';
  document.getElementById('firstNameInput').value = merged.firstName || '';
  document.getElementById('lastNameInput').value = merged.lastName || '';
  document.getElementById('emailInput').value = merged.email || '';
  document.getElementById('phoneInput').value = merged.phone || '';
  document.getElementById('locationInput').value = merged.location || '';
  document.getElementById('preferencesInput').value = merged.preferences || '';
  document.getElementById('profilePhone').textContent = merged.phone ? `Phone: ${merged.phone}` : '';
  document.getElementById('profileLocation').textContent = merged.location ? `Location: ${merged.location}` : '';
  const avatar = document.getElementById('profileAvatar');
  if (merged.profileImage) {
    avatar.innerHTML = `<img src="${merged.profileImage}" alt="Profile photo"/>`;
  } else {
    avatar.textContent = getInitials(merged);
  }
}

function handleProfileImageChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const user = getSignedInUser();
    if (!user) return;
    user.profileImage = e.target.result;
    saveUser(user);
    setProfileValues(user);
    showToast('Profile picture uploaded.', 'success');
  };
  reader.readAsDataURL(file);
}

function saveProfile(event) {
  event.preventDefault();
  const user = getSignedInUser();
  if (!user) return;

  user.firstName = document.getElementById('firstNameInput').value.trim();
  user.lastName = document.getElementById('lastNameInput').value.trim();
  user.phone = document.getElementById('phoneInput').value.trim();
  user.location = document.getElementById('locationInput').value.trim();
  user.preferences = document.getElementById('preferencesInput').value.trim();
  user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;

  saveUser(user);
  setProfileValues(user);
  showToast('Profile details saved.', 'success');
}

function signOut() {
  localStorage.removeItem('betaToken');
  localStorage.removeItem('betaUser');
  window.location.href = 'index.html';
}

function initProfilePage() {
  const user = getSignedInUser();
  if (!user) {
    window.location.href = 'auth.html';
    return;
  }
  setProfileValues(user);
  document.getElementById('profilePicInput').addEventListener('change', handleProfileImageChange);
  document.getElementById('profileForm').addEventListener('submit', saveProfile);
  document.getElementById('signOutBtn').addEventListener('click', signOut);
}

window.addEventListener('DOMContentLoaded', initProfilePage);
