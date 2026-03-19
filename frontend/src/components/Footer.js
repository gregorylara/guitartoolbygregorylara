/**
 * Footer — App footer. i18n-aware.
 */
import { t } from '../lib/i18n.js';

export function renderFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="app-footer">
      <span>© ${year} GuitarTool · ${t('footer.text')} <a href="https://gregorylara.com" target="_blank" rel="noopener noreferrer" class="footer-link">Gregory Lara</a></span>
    </footer>
  `;
}
