/**
 * Progressions.js — PRO: Chord Progression Generator
 * Generates common chord progressions in any key.
 */
import { t } from '../lib/i18n.js';
import { getUser } from '../lib/auth.js';
import { isPro } from '../lib/subscription.js';

// ── Music theory data ─────────────────────────────────────────────────────────
const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_MAP = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' };

// Scale intervals (semitones from root)
const MAJOR_SCALE = [0,2,4,5,7,9,11];
const MINOR_SCALE = [0,2,3,5,7,8,10];

// Chord quality for each scale degree
const MAJOR_QUALITIES = ['','m','m','','','m','dim'];
const MINOR_QUALITIES = ['m','dim','','m','m','',''];

// Roman numeral labels
const MAJOR_ROMAN = ['I','ii','iii','IV','V','vi','vii°'];
const MINOR_ROMAN = ['i','ii°','III','iv','v','VI','VII'];

// ── Progressions library ──────────────────────────────────────────────────────
const PROGRESSIONS = [
  { nameKey: 'prog.pop',       roman: [0,4,5,3],     style: 'pop',   desc: 'prog.popDesc' },
  { nameKey: 'prog.fifties',   roman: [0,5,3,4],     style: 'pop',   desc: 'prog.fiftiesDesc' },
  { nameKey: 'prog.axis',      roman: [0,4,5,3],     style: 'pop',   desc: 'prog.axisDesc' },
  { nameKey: 'prog.sad',       roman: [5,3,0,4],     style: 'pop',   desc: 'prog.sadDesc' },
  { nameKey: 'prog.145',       roman: [0,3,4],       style: 'rock',  desc: 'prog.145Desc' },
  { nameKey: 'prog.blues12',   roman: [0,0,0,0,3,3,0,0,4,3,0,4], style:'blues', desc:'prog.blues12Desc' },
  { nameKey: 'prog.minblues',  roman: [0,0,0,0,3,3,0,0,4,3,0,0], style:'blues', desc:'prog.minbluesDesc' },
  { nameKey: 'prog.jazz251',   roman: [1,4,0],       style: 'jazz',  desc: 'prog.jazz251Desc' },
  { nameKey: 'prog.jazz1625',  roman: [0,5,1,4],     style: 'jazz',  desc: 'prog.jazz1625Desc' },
  { nameKey: 'prog.canon',     roman: [0,4,5,2,3,0,3,4], style:'classical', desc:'prog.canonDesc' },
  { nameKey: 'prog.andalusian',roman: [0,6,5,4],     style: 'world', desc: 'prog.andalusianDesc' },
  { nameKey: 'prog.reggae',    roman: [0,4,0,4],     style: 'world', desc: 'prog.reggaeDesc' },
];

const STYLES = ['pop','rock','blues','jazz','classical','world'];

// ── Build chords for a key ───────────────────────────────────────────────────
function getScaleChords(rootNote, mode) {
  const rootIdx = NOTES.indexOf(rootNote);
  const intervals = mode === 'major' ? MAJOR_SCALE : MINOR_SCALE;
  const qualities = mode === 'major' ? MAJOR_QUALITIES : MINOR_QUALITIES;
  const romans    = mode === 'major' ? MAJOR_ROMAN : MINOR_ROMAN;

  return intervals.map((semitone, i) => {
    const noteIdx = (rootIdx + semitone) % 12;
    const note = NOTES[noteIdx];
    const displayNote = FLAT_MAP[note] || note;
    return {
      note: displayNote,
      quality: qualities[i],
      name: displayNote + qualities[i],
      roman: romans[i],
    };
  });
}

function resolveProgression(prog, rootNote, mode) {
  const scaleChords = getScaleChords(rootNote, mode);
  return prog.roman.map(deg => scaleChords[deg]);
}

// ── Audio (simple chord tones via Web Audio) ─────────────────────────────────
let audioCtx = null;
const NOTE_FREQ = {};
NOTES.forEach((n, i) => { NOTE_FREQ[n] = 261.63 * Math.pow(2, i / 12); }); // C4 base

function playChordTone(noteName, duration = 0.6) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Find the sharp version if flat
  let note = noteName.replace('b','');
  const flatToSharp = {'Db':'C#','Eb':'D#','Gb':'F#','Ab':'G#','Bb':'A#'};
  if (flatToSharp[noteName]) note = flatToSharp[noteName];
  const freq = NOTE_FREQ[note] || 261.63;

  // Play root + third + fifth approximation
  [freq, freq * 1.25, freq * 1.5].forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = 0.08;
    const now = audioCtx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.stop(now + duration);
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function ProgressionsPage() {
  const user = getUser();
  const pro  = isPro();

  if (!user || !pro) {
    return `
      <div class="page-header">
        <h1 class="page-header__title">${t('prog.title')}</h1>
        <p class="page-header__desc">${t('prog.desc')}</p>
      </div>
      <div class="cp-gate">
        <div class="cp-gate__icon"><i class="bi bi-lock-fill"></i></div><h2>${t('cp.proOnly')}</h2>
        <p>${t('cp.proOnlyDesc')}</p>
        <a href="#/pro" class="btn-upgrade btn-upgrade--best">${t('account.upgrade')}</a>
      </div>`;
  }

  const keyBtns = NOTES.map(n => {
    const display = FLAT_MAP[n] || n;
    return `<button class="prog-key-btn${n==='C'?' active':''}" data-key="${n}">${display}</button>`;
  }).join('');

  const styleTabs = STYLES.map(s =>
    `<button class="prog-style-tab${s==='pop'?' active':''}" data-style="${s}">${t('prog.style.'+s)}</button>`
  ).join('');

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('prog.title')}</h1>
      <p class="page-header__desc">${t('prog.desc')}</p>
    </div>

    <div class="prog-layout" id="progRoot">

      <!-- Key + Mode Selector -->
      <div class="prog-controls">
        <div class="prog-control-group">
          <label>${t('prog.key')}</label>
          <div class="prog-key-grid" id="progKeys">${keyBtns}</div>
        </div>
        <div class="prog-control-group">
          <label>${t('prog.mode')}</label>
          <div class="prog-mode-row" id="progMode">
            <button class="prog-mode-btn active" data-mode="major">${t('prog.major')}</button>
            <button class="prog-mode-btn" data-mode="minor">${t('prog.minor')}</button>
          </div>
        </div>
      </div>

      <!-- Style filter -->
      <div class="prog-style-row" id="progStyles">${styleTabs}</div>

      <!-- Progressions grid -->
      <div class="prog-grid" id="progGrid"></div>

    </div>
  `;
}

// ── Mount ────────────────────────────────────────────────────────────────────
let _state = { key: 'C', mode: 'major', style: 'pop' };

export function onMount(container) {
  if (!getUser() || !isPro()) return;

  renderProgressions(container);

  // Key buttons
  container.querySelector('#progKeys')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-key]');
    if (!btn) return;
    container.querySelectorAll('.prog-key-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _state.key = btn.dataset.key;
    renderProgressions(container);
  });

  // Mode toggle
  container.querySelector('#progMode')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-mode]');
    if (!btn) return;
    container.querySelectorAll('.prog-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _state.mode = btn.dataset.mode;
    renderProgressions(container);
  });

  // Style filter
  container.querySelector('#progStyles')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-style]');
    if (!btn) return;
    container.querySelectorAll('.prog-style-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _state.style = btn.dataset.style;
    renderProgressions(container);
  });
}

function renderProgressions(container) {
  const grid = container.querySelector('#progGrid');
  if (!grid) return;

  const filtered = PROGRESSIONS.filter(p => p.style === _state.style);

  grid.innerHTML = filtered.map(prog => {
    const chords = resolveProgression(prog, _state.key, _state.mode);
    const chordPills = chords.map(c =>
      `<span class="prog-chord-pill">${c.name}</span>`
    ).join('');
    const romanStr = chords.map(c => c.roman).join(' – ');

    return `
      <div class="prog-card" data-prog-chords="${chords.map(c=>c.name).join(',')}">
        <div class="prog-card__header">
          <h3 class="prog-card__title">${t(prog.nameKey)}</h3>
          <span class="prog-card__roman">${romanStr}</span>
        </div>
        <p class="prog-card__desc">${t(prog.desc)}</p>
        <div class="prog-card__chords">${chordPills}</div>
        <div class="prog-card__actions">
          <button class="prog-play-btn" data-chords="${chords.map(c=>c.note).join(',')}" title="Play">
            <i class="bi bi-play-fill"></i> ${t('prog.play')}
          </button>
          <a class="prog-practice-btn" href="#/practice" title="Practice">
            <i class="bi bi-arrow-repeat"></i> ${t('prog.practice')}
          </a>
        </div>
      </div>
    `;
  }).join('');

  // Bind play buttons
  grid.querySelectorAll('.prog-play-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const notes = btn.dataset.chords.split(',');
      let i = 0;
      const play = () => {
        if (i >= notes.length) return;
        playChordTone(notes[i], 0.7);
        btn.closest('.prog-card')
          ?.querySelectorAll('.prog-chord-pill')[i]
          ?.classList.add('playing');
        i++;
        setTimeout(play, 700);
      };
      // Clear previous highlights
      btn.closest('.prog-card')
        ?.querySelectorAll('.prog-chord-pill')
        .forEach(p => p.classList.remove('playing'));
      play();
    });
  });
}

export function onDestroy() {}
