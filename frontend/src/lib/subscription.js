/**
 * subscription.js — Reads user subscription from Firestore.
 * Stripe checkout / portal calls go through Firebase Cloud Functions.
 *
 * ⚠️  Replace PRICE_MONTHLY and PRICE_ANNUAL with your actual Stripe Price IDs
 *     once you have them from the Stripe dashboard.
 */
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';
import { getUser } from './auth.js';

// ── Stripe config ──────────────────────────────────────────────────────────────
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const PRICE_MONTHLY = import.meta.env.VITE_STRIPE_PRICE_MONTHLY;
export const PRICE_ANNUAL  = import.meta.env.VITE_STRIPE_PRICE_ANNUAL;

// ⚠️ Replace with your actual Hostinger domain after deploying server/
// e.g. 'https://api.yourdomain.com' or 'https://yourdomain.com:3000'
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.yourdomain.com';

// ── Internal state ─────────────────────────────────────────────────────────────
let _sub = null;
let _userDoc = null;

/** Fetch subscription + user doc for the current user */
export async function loadSubscription() {
  const user = getUser();
  if (!user) { _sub = null; _userDoc = null; return null; }
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (snap.exists()) {
    _userDoc = snap.data();
    _sub     = _userDoc.subscription ?? { plan: 'free', status: 'active' };
  }
  return _sub;
}

/** Listen to real-time subscription changes */
export function watchSubscription(cb) {
  const user = getUser();
  if (!user) return () => {};
  return onSnapshot(doc(db, 'users', user.uid), snap => {
    if (snap.exists()) {
      _userDoc = snap.data();
      _sub     = _userDoc.subscription ?? { plan: 'free', status: 'active' };
      cb(_sub, _userDoc);
    }
  });
}

export function getSubscription() { return _sub; }
export function getUserDoc()      { return _userDoc; }

// 🔧 DEV MODE — set to true to preview Pro features without login
// ⚠️ Set back to false before deploying to production!
const DEV_MODE = true;

/** Returns true if user has an active Pro subscription */
export function isPro() {
  if (DEV_MODE) return true;
  return _sub?.status === 'active' && _sub?.plan !== 'free';
}

/** Returns true if first-time annual offer is still available */
export function isFirstTimeOffer() {
  return _userDoc?.firstTimeOffer === true;
}

// ── Stripe Checkout ────────────────────────────────────────────────────────────
/**
 * startCheckout(plan)
 * plan: 'monthly' | 'annual'
 * Calls the Firebase Cloud Function which creates a Stripe Checkout session.
 * Automatically applies WELCOME50 coupon for new users choosing annual.
 */
export async function startCheckout(plan) {
  const user = getUser();
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();

  const applyOffer = plan === 'annual' && isFirstTimeOffer();

  const res = await fetch(`${API_BASE}/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      priceId:   plan === 'monthly' ? PRICE_MONTHLY : PRICE_ANNUAL,
      applyOffer,
      successUrl: `${window.location.origin}/#/account?checkout=success`,
      cancelUrl:  `${window.location.origin}/#/account`,
    }),
  });

  if (!res.ok) throw new Error('Failed to create checkout session');
  const { url } = await res.json();
  window.location.href = url;
}

/** Open Stripe Customer Portal to manage / cancel subscription */
export async function openCustomerPortal() {
  const user = getUser();
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE}/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ returnUrl: `${window.location.origin}/#/account` }),
  });

  if (!res.ok) throw new Error('Portal session failed');
  const { url } = await res.json();
  window.location.href = url;
}
