/**
 * Home — Dashboard with tool card grid. i18n-aware.
 */
import { t } from '../lib/i18n.js';

export function HomePage() {
  const tools = [
    { icon: '<i class="bi bi-music-note"></i>', titleKey: 'tool.tuner.title',     descKey: 'tool.tuner.desc',     route: '/tuner' },
    { icon: '<i class="bi bi-grid-3x3-gap"></i>', titleKey: 'tool.chords.title',    descKey: 'tool.chords.desc',    route: '/chords' },
    { icon: '<i class="bi bi-stopwatch"></i>', titleKey: 'tool.metronome.title', descKey: 'tool.metronome.desc', route: '/metronome' },
    { icon: '<i class="bi bi-music-note-list"></i>', titleKey: 'tool.scales.title',    descKey: 'tool.scales.desc',    route: '/scales' },
    { icon: '<i class="bi bi-arrow-repeat"></i>', titleKey: 'cp.title', descKey: 'cp.desc', route: '/practice', pro: true },
    { icon: '<i class="bi bi-music-note-beamed"></i>', titleKey: 'prog.title', descKey: 'prog.desc', route: '/progressions', pro: true },
    { icon: '<i class="bi bi-ear"></i>', titleKey: 'ear.title', descKey: 'ear.desc', route: '/ear-training', pro: true },
    { icon: '<i class="bi bi-play-circle"></i>', titleKey: 'bt.title', descKey: 'bt.desc', route: '/backing-tracks', pro: true },
  ];

  const cards = tools.map(tool => `
    <a class="tool-card ${tool.pro ? 'tool-card--pro' : ''}" href="#${tool.route}">
      ${tool.pro ? '<div class="pro-badge">PRO</div>' : ''}
      <div class="tool-card__icon">${tool.icon}</div>
      <div class="tool-card__title">
        ${t(tool.titleKey)}
      </div>
      <div class="tool-card__desc">${t(tool.descKey)}</div>
    </a>
  `).join('');

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('home.title')}</h1>
      <p class="page-header__desc">${t('home.desc')}</p>
    </div>
    <div class="tools-grid">
      ${cards}
    </div>
  `;
}
