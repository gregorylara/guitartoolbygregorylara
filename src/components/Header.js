/**
 * Header — Top app bar with search and mobile hamburger.
 */

export function renderHeader() {
  return `
    <header class="app-header">
      <div class="hamburger" id="hamburger" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div class="header-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" placeholder="Search tools…" id="header-search-input"/>
      </div>

      <div style="display:flex;align-items:center;gap:var(--space-md);">
        <a href="https://gregorylara.com/#portfolio" target="_blank" rel="noopener noreferrer"
           class="btn btn-ghost" style="font-size:var(--fs-xs);padding:0.4em 0.9em;">
          More Apps ↗
        </a>
        <span class="badge badge--accent">v1.0</span>
      </div>
    </header>
  `;
}

/**
 * Initialize header interactivity.
 */
export function initHeader() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.app-sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar?.classList.toggle('open');
      overlay?.classList.toggle('active');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar?.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}
