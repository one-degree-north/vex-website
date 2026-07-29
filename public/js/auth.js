import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getDatabase, ref, set, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCm06dliOsgLV19A_N87nj_1sthyUiPQpI",
  authDomain: "sasvexrobotics.firebaseapp.com",
  databaseURL: "https://sasvexrobotics-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sasvexrobotics",
  storageBucket: "sasvexrobotics.firebasestorage.app",
  messagingSenderId: "70550646645",
  appId: "1:70550646645:web:0d98bb995f7d059d576d3c"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: 'sas.edu.sg' });

export { auth, db };

// Lightweight cached "auth hint" so the signed-in nav (avatar + Order link) can
// render instantly on navigation, before Firebase's async auth check resolves.
const AUTH_HINT_KEY = 'sasAuthHint';

function saveAuthHint(user) {
  try {
    localStorage.setItem(AUTH_HINT_KEY, JSON.stringify({
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    }));
  } catch (e) { /* localStorage unavailable (e.g. private mode) — ignore */ }
}

function clearAuthHint() {
  try { localStorage.removeItem(AUTH_HINT_KEY); } catch (e) { /* ignore */ }
}

function readAuthHint() {
  try {
    const raw = localStorage.getItem(AUTH_HINT_KEY);
    if (!raw) return null;
    const hint = JSON.parse(raw);
    if (hint && typeof hint.email === 'string' && hint.email.endsWith('@sas.edu.sg')) {
      return hint;
    }
  } catch (e) { /* ignore */ }
  return null;
}

function showToast(message, isError = true) {
  const existing = document.querySelector('.auth-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `auth-toast${isError ? ' auth-toast-error' : ' auth-toast-success'}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('auth-toast-visible'), 10);
  setTimeout(() => {
    toast.classList.remove('auth-toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function handleSignIn() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user.email.endsWith('@sas.edu.sg')) {
      await signOut(auth);
      showToast('Only SAS students (@sas.edu.sg) can sign in.');
      return;
    }

    // update() (not set()) so we don't wipe the user's saved lesson progress
    // stored at users/${uid}/progress on every sign-in.
    await update(ref(db, `users/${user.uid}`), {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isSASStudent: true,
      lastLogin: serverTimestamp()
    });
  } catch (err) {
    console.error('Auth error:', err.code, err.message);
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return;
    }
    if (err.code === 'auth/operation-not-allowed') {
      showToast('Google sign-in is not enabled. Contact the site admin.');
    } else if (err.code === 'auth/unauthorized-domain') {
      showToast('This domain is not authorized for sign-in.');
    } else if (err.code === 'auth/popup-blocked') {
      showToast('Popup was blocked. Please allow popups for this site.');
    } else {
      showToast('Sign in failed: ' + (err.code || err.message));
    }
  }
}

async function handleSignOut() {
  await signOut(auth);
}

function addMembersLink() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks || navLinks.querySelector('.members-nav-link')) return;
  const li = document.createElement('li');
  li.innerHTML = '<a href="order.html" class="members-nav-link">Order</a>';
  navLinks.appendChild(li);
  const current = window.location.pathname.split('/').pop() || 'index.html';
  if (current === 'order.html') {
    li.querySelector('a').classList.add('active');
  }
}

function removeMembersLink() {
  const link = document.querySelector('.members-nav-link');
  if (link) link.closest('li').remove();
}

function renderSignedOut(container) {
  removeMembersLink();
  container.innerHTML = `
    <button class="btn-signin" id="signin-btn">Sign In</button>
  `;
  document.getElementById('signin-btn').addEventListener('click', handleSignIn);
}

function renderSignedIn(container, user) {
  addMembersLink();
  const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=111827&color=fff`;
  container.innerHTML = `
    <div class="user-menu" id="user-menu">
      <img src="${photo}" alt="${user.displayName}" class="user-avatar" id="user-avatar-btn">
      <div class="auth-dropdown" id="auth-dropdown">
        <p class="dropdown-name">${user.displayName}</p>
        <p class="dropdown-email">${user.email}</p>
        <hr class="dropdown-divider">
        <button class="dropdown-signout" id="signout-btn">Sign Out</button>
      </div>
    </div>
  `;

  const menu = document.getElementById('user-menu');
  document.getElementById('user-avatar-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.getElementById('signout-btn').addEventListener('click', handleSignOut);

  document.addEventListener('click', () => menu.classList.remove('open'), { once: false });
}

export function initAuthUI() {
  const container = document.getElementById('nav-auth');
  if (!container) return;

  // Optimistic render: if we know from a previous session that the user was
  // signed in, show the avatar + Order link immediately instead of waiting for
  // Firebase to resolve (~0.5s). onAuthStateChanged reconciles below.
  const hint = readAuthHint();
  if (hint) {
    renderSignedIn(container, hint);
  }

  onAuthStateChanged(auth, (user) => {
    if (user && user.email.endsWith('@sas.edu.sg')) {
      saveAuthHint(user);
      renderSignedIn(container, user);
    } else {
      clearAuthHint();
      renderSignedOut(container);
    }
  });
}

export { onAuthStateChanged };
