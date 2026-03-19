/**
 * Pro.js — Sales page for the PRO version.
 * Showcases benefits and pricing plans.
 */
import { t } from '../lib/i18n.js';
import { getUser } from '../lib/auth.js';
import { isPro, startCheckout, loadSubscription } from '../lib/subscription.js';

export function ProPage() {
  const user = getUser();
  const pro  = isPro();

  // Redirect to account if already pro
  if (pro && user) {
    setTimeout(() => window.location.hash = '/account', 0);
    return '<div></div>';
  }

  const benefits = [
    { icon: 'bi- grid-3x3-gap-fill', title: t('pro.benefit.1.t'), desc: t('pro.benefit.1.d') },
    { icon: 'bi-speedometer2',      title: t('pro.benefit.2.t'), desc: t('pro.benefit.2.d') },
    { icon: 'bi-music-note-beamed', title: t('pro.benefit.3.t'), desc: t('pro.benefit.3.d') },
    { icon: 'bi-shield-check',      title: t('pro.benefit.4.t'), desc: t('pro.benefit.4.d') },
  ];

  const benefitsHTML = benefits.map(b => `
    <div class="pro-benefit-card">
      <div class="pro-benefit-icon"><i class="bi ${b.icon}"></i></div>
      <h3 class="pro-benefit-title">${b.title}</h3>
      <p class="pro-benefit-desc">${b.desc}</p>
    </div>
  `).join('');

  return `
    <div class="pro-page">
      <div class="pro-hero">
        <div class="pro-badge pro-badge--hero">PRO</div>
        <h1 class="pro-hero__title">${t('pro.title')}</h1>
        <p class="pro-hero__subtitle">${t('pro.subtitle')}</p>
      </div>

      <div class="pro-section">
        <h2 class="pro-section__title">${t('pro.benefit.title')}</h2>
        <div class="pro-benefits-grid">
          ${benefitsHTML}
        </div>
      </div>

      <div class="pro-section pro-section--pricing">
        <h2 class="pro-section__title">${t('account.upgradeTo')}</h2>
        <div class="pro-pricing-container" id="proPricing">
           <div class="account-loading"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;
}

export async function onMount(container) {
  const pricingRoot = container.querySelector('#proPricing');
  if (!pricingRoot) return;

  // We reuse the pricing logic from Account.js but styled for a sales page
  // For simplicity, we can fetch sub info if logged in
  await loadSubscription();
  
  // Import account page logic for plan cards
  const { getUserDoc } = await import('../lib/subscription.js');
  const userDoc = getUserDoc();
  const firstOffer = userDoc?.firstTimeOffer === true;

  pricingRoot.innerHTML = renderPlanCards(firstOffer);
  bindPricingEvents(pricingRoot);
}

function renderPlanCards(firstOffer) {
  const annualPrice   = firstOffer ? '$29.94' : '$59.88';
  const annualPerMo   = firstOffer ? '$2.50'  : '$4.99';
  const annualBadge   = firstOffer
    ? `<div class="plan-offer-badge">🎁 ${t('account.firstOffer')}</div>`
    : '';

  return `
    <div class="plan-cards">
      <div class="plan-card">
        <div class="plan-card__name">${t('account.monthly')}</div>
        <div class="plan-card__price">$4.99<span>/${t('account.mo')}</span></div>
        <ul class="plan-card__features">
          <li>✓ ${t('account.f1')}</li>
          <li>✓ ${t('account.f2')}</li>
          <li>✓ ${t('account.f3')}</li>
          <li>✓ ${t('account.f4')}</li>
        </ul>
        <button class="btn-upgrade" id="btnMonthly">${t('account.upgrade')}</button>
      </div>

      <div class="plan-card plan-card--featured">
        ${annualBadge}
        <div class="plan-card__name">${t('account.annual')}</div>
        <div class="plan-card__price">${annualPrice}<span>/${t('account.yr')}</span></div>
        <div class="plan-card__sub">${annualPerMo}/${t('account.mo')} · ${t('account.save')}</div>
        <ul class="plan-card__features">
          <li>✓ ${t('account.f1')}</li>
          <li>✓ ${t('account.f2')}</li>
          <li>✓ ${t('account.f3')}</li>
          <li>✓ ${t('account.f4')}</li>
        </ul>
        <button class="btn-upgrade btn-upgrade--best" id="btnAnnual">${t('account.upgradeBest')}</button>
      </div>
    </div>
  `;
}

function bindPricingEvents(root) {
  root.querySelector('#btnMonthly')?.addEventListener('click', async () => {
    const user = getUser();
    if (!user) {
      window.dispatchEvent(new CustomEvent('openauth'));
      return;
    }
    const btn = root.querySelector('#btnMonthly');
    btn.disabled = true; btn.textContent = '...';
    try { await startCheckout('monthly'); }
    catch (e) { btn.disabled = false; btn.textContent = t('account.upgrade'); }
  });

  root.querySelector('#btnAnnual')?.addEventListener('click', async () => {
    const user = getUser();
    if (!user) {
      window.dispatchEvent(new CustomEvent('openauth'));
      return;
    }
    const btn = root.querySelector('#btnAnnual');
    btn.disabled = true; btn.textContent = '...';
    try { await startCheckout('annual'); }
    catch (e) { btn.disabled = false; btn.textContent = t('account.upgradeBest'); }
  });
}
