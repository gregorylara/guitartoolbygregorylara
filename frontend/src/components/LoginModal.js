/**
 * LoginModal.js — Auth overlay modal.
 * Usage: LoginModal.show() / LoginModal.hide()
 */
import { signInWithGoogle, signInEmail, signUpEmail, resetPassword } from '../lib/auth.js';
import { t } from '../lib/i18n.js';

// ── HTML ───────────────────────────────────────────────────────────────────────
function html() {
  return `
  <div class="modal-backdrop" id="loginBackdrop">
    <div class="modal-box" id="loginBox" role="dialog" aria-modal="true" aria-label="Sign in">

      <!-- Header -->
      <div class="modal-header">
        <div class="modal-brand">🎸 GuitarTool</div>
        <button class="modal-close" id="loginClose" aria-label="Close">✕</button>
      </div>

      <!-- Tabs -->
      <div class="modal-tabs">
        <button class="modal-tab active" data-tab="signin">${t('auth.signin')}</button>
        <button class="modal-tab" data-tab="signup">${t('auth.signup')}</button>
      </div>

      <!-- Google button -->
      <button class="btn-google" id="btnGoogle">
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        ${t('auth.google')}
      </button>

      <div class="modal-divider"><span>${t('auth.or')}</span></div>

      <!-- Error -->
      <div class="modal-error" id="loginError" style="display:none"></div>

      <!-- Sign In form -->
      <form id="formSignin" class="modal-form">
        <div class="modal-field">
          <label>${t('auth.email')}</label>
          <input type="email" id="siEmail" placeholder="tu@email.com" required autocomplete="email"/>
        </div>
        <div class="modal-field">
          <label>${t('auth.password')}</label>
          <input type="password" id="siPass" placeholder="••••••••" required autocomplete="current-password"/>
        </div>
        <button type="submit" class="btn-primary-full">${t('auth.signin')}</button>
        <button type="button" class="modal-link" id="btnForgot">${t('auth.forgot')}</button>
      </form>

      <!-- Sign Up form (hidden initially) -->
      <form id="formSignup" class="modal-form" style="display:none">
        <div class="modal-field">
          <label>${t('auth.name')}</label>
          <input type="text" id="suName" placeholder="${t('auth.namePlaceholder')}" autocomplete="name"/>
        </div>
        <div class="modal-field">
          <label>${t('auth.email')}</label>
          <input type="email" id="suEmail" placeholder="tu@email.com" required autocomplete="email"/>
        </div>
        <div class="modal-field">
          <label>${t('auth.password')}</label>
          <input type="password" id="suPass" placeholder="min. 6 caracteres" required autocomplete="new-password"/>
        </div>
        <button type="submit" class="btn-primary-full">${t('auth.signup')}</button>
      </form>

    </div>
  </div>`;
}

// ── Error messages map ─────────────────────────────────────────────────────────
const ERROR_MAP = {
  'auth/user-not-found':       () => t('auth.err.notFound'),
  'auth/wrong-password':       () => t('auth.err.wrongPass'),
  'auth/email-already-in-use': () => t('auth.err.emailUsed'),
  'auth/weak-password':        () => t('auth.err.weakPass'),
  'auth/invalid-email':        () => t('auth.err.invalidEmail'),
  'auth/popup-closed-by-user': () => null,
};

function friendlyError(code) {
  return (ERROR_MAP[code]?.()) ?? t('auth.err.generic');
}

// ── Module ─────────────────────────────────────────────────────────────────────
let _mounted = false;

function showError(msg) {
  const el = document.getElementById('loginError');
  if (!el || !msg) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearError() {
  const el = document.getElementById('loginError');
  if (el) el.style.display = 'none';
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
}

export const LoginModal = {
  show() {
    if (!_mounted) {
      document.body.insertAdjacentHTML('beforeend', html());
      _mounted = true;
      this._bind();
    }
    document.getElementById('loginBackdrop').classList.add('visible');
    document.getElementById('siEmail')?.focus();
  },

  hide() {
    document.getElementById('loginBackdrop')?.classList.remove('visible');
    clearError();
  },

  _bind() {
    // Close
    document.getElementById('loginClose')?.addEventListener('click', () => this.hide());
    document.getElementById('loginBackdrop')?.addEventListener('click', e => {
      if (e.target.id === 'loginBackdrop') this.hide();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.hide();
    });

    // Tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const isSignup = tab.dataset.tab === 'signup';
        document.getElementById('formSignin').style.display = isSignup ? 'none' : 'flex';
        document.getElementById('formSignup').style.display = isSignup ? 'flex' : 'none';
        clearError();
      });
    });

    // Google
    document.getElementById('btnGoogle')?.addEventListener('click', async () => {
      const btn = document.getElementById('btnGoogle');
      setLoading(btn, true);
      try {
        await signInWithGoogle();
        this.hide();
      } catch (e) {
        const msg = friendlyError(e.code);
        if (msg) showError(msg);
      } finally { setLoading(btn, false); }
    });

    // Sign In
    document.getElementById('formSignin')?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.submitter;
      const email = document.getElementById('siEmail').value;
      const pass  = document.getElementById('siPass').value;
      setLoading(btn, true); clearError();
      try {
        await signInEmail(email, pass);
        this.hide();
      } catch (err) { showError(friendlyError(err.code)); }
      finally { setLoading(btn, false); }
    });

    // Sign Up
    document.getElementById('formSignup')?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn   = e.submitter;
      const name  = document.getElementById('suName').value;
      const email = document.getElementById('suEmail').value;
      const pass  = document.getElementById('suPass').value;
      setLoading(btn, true); clearError();
      try {
        await signUpEmail(email, pass, name);
        this.hide();
      } catch (err) { showError(friendlyError(err.code)); }
      finally { setLoading(btn, false); }
    });

    // Forgot password
    document.getElementById('btnForgot')?.addEventListener('click', async () => {
      const email = document.getElementById('siEmail').value;
      if (!email) { showError(t('auth.err.enterEmail')); return; }
      try {
        await resetPassword(email);
        showError(t('auth.resetSent'));
      } catch (err) { showError(friendlyError(err.code)); }
    });
  },
};
