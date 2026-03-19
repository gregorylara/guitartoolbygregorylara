/**
 * Account.js — User account dashboard page.
 * Shows auth state, subscription info, and upgrade plan cards.
 */
import { getUser, signOut } from '../lib/auth.js';
import { loadSubscription, watchSubscription, isPro, isFirstTimeOffer,
         startCheckout, openCustomerPortal } from '../lib/subscription.js';
import { t } from '../lib/i18n.js';

function avatarLetter(user) {
  return (user.displayName || user.email || '?')[0].toUpperCase();
}

function planBadge(sub) {
  if (sub?.plan !== 'free' && sub?.status === 'active') {
    return `<span class="plan-badge plan-badge--pro">⭐ PRO</span>`;
  }
  return `<span class="plan-badge plan-badge--free">FREE</span>`;
}

function renewalDate(sub) {
  if (!sub?.currentPeriodEnd) return '';
  const d = sub.currentPeriodEnd.toDate?.() ?? new Date(sub.currentPeriodEnd);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function planCards(firstOffer) {
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

function buildHTML(user, sub, userDoc) {
  const member = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { year:'numeric', month:'long' })
    : '';
  const firstOffer = userDoc?.firstTimeOffer === true;
  const proActive  = sub?.plan !== 'free' && sub?.status === 'active';

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('account.title')}</h1>
    </div>

    <div class="account-layout">

      <!-- User card -->
      <div class="account-user-card">
        <div class="acct-avatar">${avatarLetter(user)}</div>
        <div class="acct-user-info">
          <div class="acct-name">${user.displayName || user.email}</div>
          <div class="acct-email">${user.email}</div>
          ${member ? `<div class="acct-since">${t('account.since')} ${member}</div>` : ''}
        </div>
        ${planBadge(sub)}
      </div>

      <!-- Subscription section -->
      ${proActive ? `
        <div class="account-section">
          <h2 class="account-section__title">${t('account.currentPlan')}</h2>
          <div class="account-pro-info">
            <div class="pro-info-row">
              <span>${t('account.plan')}</span>
              <strong>${sub.plan === 'monthly' ? t('account.monthly') : t('account.annual')}</strong>
            </div>
            <div class="pro-info-row">
              <span>${t('account.status')}</span>
              <strong class="status-active">● ${t('account.active')}</strong>
            </div>
            ${renewalDate(sub) ? `
            <div class="pro-info-row">
              <span>${t('account.renewsOn')}</span>
              <strong>${renewalDate(sub)}</strong>
            </div>` : ''}
          </div>
          <button class="btn-portal" id="btnPortal">${t('account.managePlan')}</button>
        </div>
      ` : `
        <div class="account-section">
          <h2 class="account-section__title">${t('account.upgradeTo')}</h2>
          <p class="account-section__desc">${t('account.upgradeDesc')}</p>
          ${planCards(firstOffer)}
        </div>
      `}

      <!-- Sign out -->
      <button class="btn-signout" id="btnSignOut">${t('account.signout')}</button>
    </div>
  `;
}

// ── Lifecycle exports for Router ──────────────────────────────────────────────
export function AccountPage() {
  const user = getUser();
  if (!user) {
    // Redirect to home if not logged in
    window.location.hash = '/';
    return '<div></div>';
  }
  return `<div id="accountRoot" class="account-loading">
    <div class="spinner"></div>
  </div>`;
}

let _unwatch = null;

export async function onMount(container) {
  const user = getUser();
  if (!user) return;

  await loadSubscription();
  const sub     = (await import('../lib/subscription.js')).getSubscription();
  const userDoc = (await import('../lib/subscription.js')).getUserDoc();

  const root = container.querySelector('#accountRoot');
  if (root) {
    root.classList.remove('account-loading');
    root.innerHTML = buildHTML(user, sub, userDoc);
    bindEvents(root);
  }

  // Watch for real-time subscription changes
  _unwatch = watchSubscription((newSub, newDoc) => {
    const r = container.querySelector('#accountRoot');
    if (r) {
      r.innerHTML = buildHTML(user, newSub, newDoc);
      bindEvents(r);
    }
  });

  // Handle redirect from Stripe checkout
  if (window.location.hash.includes('checkout=success')) {
    window.history.replaceState(null, '', window.location.pathname + '#/account');
  }
}

export function onDestroy() {
  if (_unwatch) { _unwatch(); _unwatch = null; }
}

function bindEvents(root) {
  root.querySelector('#btnSignOut')?.addEventListener('click', async () => {
    await signOut();
    window.location.hash = '/';
  });

  root.querySelector('#btnMonthly')?.addEventListener('click', async () => {
    const btn = root.querySelector('#btnMonthly');
    btn.disabled = true; btn.textContent = '...';
    try { await startCheckout('monthly'); }
    catch (e) { btn.disabled = false; btn.textContent = t('account.upgrade'); }
  });

  root.querySelector('#btnAnnual')?.addEventListener('click', async () => {
    const btn = root.querySelector('#btnAnnual');
    btn.disabled = true; btn.textContent = '...';
    try { await startCheckout('annual'); }
    catch (e) { btn.disabled = false; btn.textContent = t('account.upgradeBest'); }
  });

  root.querySelector('#btnPortal')?.addEventListener('click', async () => {
    const btn = root.querySelector('#btnPortal');
    btn.disabled = true; btn.textContent = '...';
    try { await openCustomerPortal(); }
    catch (e) { btn.disabled = false; btn.textContent = t('account.managePlan'); }
  });
}
