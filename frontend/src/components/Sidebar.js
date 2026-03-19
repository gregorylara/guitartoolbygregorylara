/**
 * Sidebar — Tool navigation + account link. i18n-aware + auth-aware.
 */
import { t } from '../lib/i18n.js';
import { getUser } from '../lib/auth.js';
import { isPro } from '../lib/subscription.js';

export function renderSidebar() {
  const tools = [
    { icon: '<i class="bi bi-house-door"></i>', labelKey: 'nav.dashboard', route: '/' },
    { icon: '<i class="bi bi-music-note"></i>', labelKey: 'nav.tuner',     route: '/tuner' },
    { icon: '<i class="bi bi-grid-3x3-gap"></i>', labelKey: 'nav.chords',    route: '/chords' },
    { icon: '<i class="bi bi-stopwatch"></i>', labelKey: 'nav.metronome', route: '/metronome' },
    { icon: '<i class="bi bi-music-note-list"></i>', labelKey: 'nav.scales',    route: '/scales' },
    { icon: '<i class="bi bi-arrow-repeat"></i>', labelKey: 'nav.practice',  route: '/practice', pro: true },
    { icon: '<i class="bi bi-music-note-beamed"></i>', labelKey: 'nav.progressions', route: '/progressions', pro: true },
    { icon: '<i class="bi bi-ear"></i>', labelKey: 'nav.earTraining', route: '/ear-training', pro: true },
    { icon: '<i class="bi bi-play-circle"></i>', labelKey: 'nav.backingTracks', route: '/backing-tracks', pro: true },
  ];

  const currentHash = window.location.hash.slice(1) || '/';
  const user = getUser();
  const pro  = isPro();

  const navItems = tools.map(tool => {
    const isActive = currentHash === tool.route ? 'active' : '';
    const proTag   = tool.pro ? '<span class="sidebar-pro-tag">PRO</span>' : '';
    return `
      <a class="nav-item ${isActive}" data-route="${tool.route}" href="#${tool.route}">
        <span class="nav-item__icon">${tool.icon}</span>
        <span>${t(tool.labelKey)}</span>
        ${proTag}
      </a>
    `;
  }).join('');

  const accountItem = user ? `
    <div class="sidebar-divider"></div>
    <a class="nav-item ${currentHash === '/account' ? 'active' : ''}" href="#/account">
      <span class="nav-item__icon"><i class="bi bi-person"></i></span>
      <span>${t('nav.account')}</span>
      ${pro ? '<span class="sidebar-pro-tag">PRO</span>' : ''}
    </a>
  ` : '';

  return `
    <aside class="app-sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand__icon"><i class="bi bi-music-note-beamed"></i></div>
        <div>
          <div class="sidebar-brand__text">GuitarTool</div>
          <div class="sidebar-brand__sub">${t('brand.sub')}</div>
        </div>
      </div>

      <div class="sidebar-section">${t('nav.tools')}</div>
      <nav class="sidebar-nav">
        ${navItems}
        ${accountItem}
      </nav>
    </aside>
    <div class="sidebar-overlay"></div>
  `;
}
