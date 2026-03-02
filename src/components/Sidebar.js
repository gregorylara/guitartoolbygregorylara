/**
 * Sidebar — Tool navigation with icons.
 */

const tools = [
  { icon: '🏠', label: 'Dashboard', route: '/' },
  { icon: '🎸', label: 'Tuner',     route: '/tuner' },
  { icon: '🎵', label: 'Chords',    route: '/chords' },
  { icon: '⏱️', label: 'Metronome', route: '/metronome' },
  { icon: '🎼', label: 'Scales',    route: '/scales' },
];

export function renderSidebar() {
  const currentHash = window.location.hash.slice(1) || '/';

  const navItems = tools.map(tool => {
    const isActive = currentHash === tool.route ? 'active' : '';
    return `
      <a class="nav-item ${isActive}" data-route="${tool.route}" href="#${tool.route}">
        <span class="nav-item__icon">${tool.icon}</span>
        <span>${tool.label}</span>
      </a>
    `;
  }).join('');

  return `
    <aside class="app-sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand__icon">🎸</div>
        <div>
          <div class="sidebar-brand__text">GuitarTool</div>
          <div class="sidebar-brand__sub">Practice Suite</div>
        </div>
      </div>

      <div class="sidebar-section">Tools</div>
      <nav class="sidebar-nav">
        ${navItems}
      </nav>
    </aside>
    <div class="sidebar-overlay"></div>
  `;
}
