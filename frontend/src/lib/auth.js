/**
 * auth.js — Firebase Auth wrapper.
 * Exports: signInWithGoogle, signInEmail, signUpEmail, signOut,
 *          getUser, onAuthChange, initAuth
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const provider = new GoogleAuthProvider();

// ── Internal state ─────────────────────────────────────────────────────────────
let _user = null;

function dispatch() {
  window.dispatchEvent(new CustomEvent('authchange', { detail: { user: _user } }));
}

// ── Create Firestore user doc on first login ────────────────────────────────────
async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email:          user.email,
      displayName:    user.displayName || user.email.split('@')[0],
      createdAt:      serverTimestamp(),
      firstTimeOffer: true,               // 50% annual discount for new users
      subscription: {
        plan:   'free',
        status: 'active',
      },
    });
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function getUser() { return _user; }

export function onAuthChange(cb) {
  window.addEventListener('authchange', e => cb(e.detail.user));
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  await ensureUserDoc(result.user);
  return result.user;
}

export async function signUpEmail(email, password, name = '') {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await ensureUserDoc(cred.user);
  return cred.user;
}

export async function signInEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * initAuth() — Call once at app startup.
 * Listens to Firebase auth state and dispatches 'authchange' events.
 */
export function initAuth() {
  onAuthStateChanged(auth, user => {
    _user = user;
    dispatch();
  });
}
