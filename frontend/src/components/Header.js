/**
 * Header — Top app bar. i18n-aware + auth-aware.
 */
import { t, getLang, setLang } from '../lib/i18n.js';
import { getUser } from '../lib/auth.js';
import { isPro } from '../lib/subscription.js';

function avatarHTML(user) {
  const letter = (user.displayName || user.email || '?')[0].toUpperCase();
  const pro    = isPro();
  return `
    <a href="#/account" class="header-avatar" title="${user.displayName || user.email}" id="headerAvatar">
      <span class="header-avatar__letter">${letter}</span>
      ${pro ? '<span class="header-avatar__crown">⭐</span>' : ''}
    </a>`;
}

export function renderHeader() {
  const lang = getLang();
  const user = getUser();

  return `
    <header class="app-header">
      <div class="hamburger" id="hamburger" aria-label="Toggle menu">
        <i class="bi bi-list"></i>
      </div>

      <div class="header-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="${t('header.search')}" id="header-search-input"/>
      </div>

      <div style="display:flex;align-items:center;gap:var(--space-md);">
        <!-- Language selector -->
        <div class="lang-selector" id="langSelector">
          <button class="lang-btn${lang === 'es' ? ' active' : ''}" data-lang="es">🌐 ES</button>
          <button class="lang-btn${lang === 'en' ? ' active' : ''}" data-lang="en">EN</button>
        </div>

        <a href="https://gregorylara.com/#portfolio" target="_blank" rel="noopener noreferrer"
           class="btn btn-ghost" style="font-size:var(--fs-xs);padding:0.4em 0.9em;">
          ${t('header.moreApps')}
        </a>

        <!-- Auth: avatar or sign-in -->
        ${user
          ? avatarHTML(user)
          : `<button class="btn btn-ghost" id="btnSignIn" style="font-size:var(--fs-xs);padding:0.4em 0.9em;">${t('auth.signin')}</button>`
        }

        <span class="badge badge--accent">v1.0</span>
      </div>
    </header>
  `;
}

export function initHeader(router) {
  // Hamburger
  const hamburger = document.getElementById('hamburger');
  hamburger?.addEventListener('click', () => {
    document.querySelector('.app-sidebar')?.classList.toggle('open');
    document.querySelector('.sidebar-overlay')?.classList.toggle('active');
  });
  
  // Overlay click (initial binding if overlay doesn't get replaced asynchronously)
  document.querySelector('.sidebar-overlay')?.addEventListener('click', () => {
    document.querySelector('.app-sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
  });

  // Language selector
  document.getElementById('langSelector')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-lang]');
    if (btn) setLang(btn.dataset.lang);
  });

  // Sign-in button
  document.getElementById('btnSignIn')?.addEventListener('click', async () => {
    const { LoginModal } = await import('./LoginModal.js');
    LoginModal.show();
  });

  // Re-render shell on language change
  window.addEventListener('langchange', () => _rerenderShell(router));

  // Re-render shell on auth change
  window.addEventListener('authchange', () => _rerenderShell(router));
}

function _rerenderShell(router) {
  // Header
  const headerEl = document.querySelector('.app-header');
  if (headerEl) {
    const tmp = document.createElement('div');
    tmp.innerHTML = renderHeader();
    headerEl.replaceWith(tmp.firstElementChild);
    initHeader(router);
  }
  // Sidebar
  const sidebarEl = document.querySelector('.app-sidebar');
  if (sidebarEl) {
    import('./Sidebar.js').then(({ renderSidebar }) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = renderSidebar();
      sidebarEl.replaceWith(tmp.firstElementChild);
      document.querySelector('.sidebar-overlay')?.addEventListener('click', () => {
        document.querySelector('.app-sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('active');
      });
    });
  }
  // Footer
  const footerEl = document.querySelector('.app-footer');
  if (footerEl) {
    import('./Footer.js').then(({ renderFooter }) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = renderFooter();
      footerEl.replaceWith(tmp.firstElementChild);
    });
  }
  // Re-render current page
  if (router) { router.currentRoute = null; router.resolve(); }
}
