/**
 * Footer — Minimal credits.
 */

export function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="app-footer">
      <span>© ${year} GuitarTool · Built for musicians 🎶 by <a href="https://gregorylara.com" target="_blank" rel="noopener noreferrer" class="footer-link">Gregory Lara</a></span>
    </footer>
  `;
}
