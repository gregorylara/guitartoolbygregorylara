/**
 * Router — Hash-based client-side router with lifecycle hooks.
 * Pages can export { render(), onMount(container), onDestroy() }.
 */

export class Router {
  constructor(routes, container) {
    this.routes = routes;
    this.container = container;
    this.currentRoute = null;
    this.currentPage = null;

    window.addEventListener('hashchange', () => this.resolve());
    window.addEventListener('load', () => this.resolve());
  }

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const page = this.routes[hash] || this.routes['/'];

    if (this.currentRoute === hash) return;

    // Destroy previous page
    if (this.currentPage && typeof this.currentPage.onDestroy === 'function') {
      this.currentPage.onDestroy();
    }

    this.currentRoute = hash;
    this.currentPage = page;

    // Render page
    const content = typeof page.render === 'function' ? page.render() : page();
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'page-container';
    wrapper.innerHTML = content;
    this.container.appendChild(wrapper);

    // Mount new page
    if (typeof page.onMount === 'function') {
      page.onMount(wrapper);
    }

    // Update active nav state
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('data-route');
      item.classList.toggle('active', href === hash);
    });

    // Close mobile sidebar on navigation
    document.querySelector('.app-sidebar')?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('routechange', { detail: { route: hash } }));
  }

  navigate(path) {
    window.location.hash = path;
  }
}
