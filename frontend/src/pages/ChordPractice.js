/**
 * ChordPractice.js — PRO: Chord Change Practitioner
 * Trains chord transitions with an integrated metronome, difficulty levels,
 * countdown, timer, and score tracking.
 */
import { t } from '../lib/i18n.js';
import { getUser } from '../lib/auth.js';
import { isPro } from '../lib/subscription.js';

// ── Reuse CHORDS + buildSVG from Chords.js via dynamic import ─────────────────
let CHORDS = [];
let buildSVGfn = null;

async function loadChordData() {
  const mod = await import('./Chords.js');
  // Chords.js doesn't export CHORDS/buildSVG, so we inline a subset
  return null;
}

// ── Inline chord data (names + diagram data for the practitioner) ─────────────
// We embed the most commonly used chords directly for independence from Chords.js
const PRACTICE_CHORDS = [
  { name:'C', cat:'major', frets:[-1,3,2,0,1,0], fingers:[0,3,2,0,1,0], barres:[], sf:1 },
  { name:'D', cat:'major', frets:[-1,-1,0,2,3,2], fingers:[0,0,0,1,3,2], barres:[], sf:1 },
  { name:'E', cat:'major', frets:[0,2,2,1,0,0], fingers:[0,2,3,1,0,0], barres:[], sf:1 },
  { name:'F', cat:'major', frets:[1,3,3,2,1,1], fingers:[1,3,4,2,1,1], barres:[{fret:1,from:0,to:5}], sf:1 },
  { name:'G', cat:'major', frets:[3,2,0,0,0,3], fingers:[2,1,0,0,0,3], barres:[], sf:1 },
  { name:'A', cat:'major', frets:[-1,0,2,2,2,0], fingers:[0,0,1,2,3,0], barres:[], sf:1 },
  { name:'B', cat:'major', frets:[-1,2,4,4,4,2], fingers:[0,1,2,3,4,1], barres:[{fret:2,from:1,to:4}], sf:1 },
  { name:'Am', cat:'minor', frets:[-1,0,2,2,1,0], fingers:[0,0,2,3,1,0], barres:[], sf:1 },
  { name:'Bm', cat:'minor', frets:[-1,2,4,4,3,2], fingers:[0,1,3,4,2,1], barres:[{fret:2,from:1,to:5}], sf:1 },
  { name:'Dm', cat:'minor', frets:[-1,-1,0,2,3,1], fingers:[0,0,0,2,3,1], barres:[], sf:1 },
  { name:'Em', cat:'minor', frets:[0,2,2,0,0,0], fingers:[0,2,3,0,0,0], barres:[], sf:1 },
  { name:'Gm', cat:'minor', frets:[3,5,5,3,3,3], fingers:[1,3,4,1,1,1], barres:[{fret:3,from:0,to:5}], sf:3 },
  { name:'G7', cat:'7th', frets:[3,2,0,0,0,1], fingers:[3,2,0,0,0,1], barres:[], sf:1 },
  { name:'D7', cat:'7th', frets:[-1,-1,0,2,1,2], fingers:[0,0,0,3,1,2], barres:[], sf:1 },
  { name:'A7', cat:'7th', frets:[-1,0,2,0,2,0], fingers:[0,0,2,0,3,0], barres:[], sf:1 },
  { name:'E7', cat:'7th', frets:[0,2,0,1,0,0], fingers:[0,2,0,1,0,0], barres:[], sf:1 },
  { name:'Am7', cat:'min7', frets:[-1,0,2,0,1,0], fingers:[0,0,2,0,1,0], barres:[], sf:1 },
  { name:'Em7', cat:'min7', frets:[0,2,0,0,0,0], fingers:[0,2,0,0,0,0], barres:[], sf:1 },
  { name:'Cadd9', cat:'add', frets:[-1,3,2,0,3,3], fingers:[0,3,2,0,1,1], barres:[], sf:1 },
  { name:'Dsus2', cat:'sus', frets:[-1,-1,0,2,3,0], fingers:[0,0,0,1,3,0], barres:[], sf:1 },
  { name:'Asus4', cat:'sus', frets:[-1,0,2,2,3,0], fingers:[0,0,2,3,4,0], barres:[], sf:1 },
];

// ── Preset drills ─────────────────────────────────────────────────────────────
const PRESET_DRILLS = [
  { nameKey: 'cp.drill.amg',     chords: ['Am', 'G'],          level: 2 },
  { nameKey: 'cp.drill.gc',      chords: ['G', 'C'],           level: 2 },
  { nameKey: 'cp.drill.da',      chords: ['D', 'A'],           level: 2 },
  { nameKey: 'cp.drill.eam',     chords: ['E', 'Am'],          level: 2 },
  { nameKey: 'cp.drill.gcd',     chords: ['G', 'C', 'D'],      level: 3 },
  { nameKey: 'cp.drill.amfc',    chords: ['Am', 'F', 'C'],     level: 3 },
  { nameKey: 'cp.drill.emcg',    chords: ['Em', 'C', 'G'],     level: 3 },
  { nameKey: 'cp.drill.gcaem',   chords: ['G', 'C', 'Am', 'Em'], level: 4 },
  { nameKey: 'cp.drill.cgafc',   chords: ['C', 'G', 'Am', 'F'], level: 4 },
  { nameKey: 'cp.drill.emcgd',   chords: ['Em', 'C', 'G', 'D'], level: 4 },
];

const TIMER_OPTIONS = [30, 60, 120];

// ── Speed presets ─────────────────────────────────────────────────────────────
const SPEED_PRESETS = [
  { id: 'slow',     icon: '<i class="bi bi-hourglass-bottom"></i>', nameKey: 'cp.speed.slow',     bpm: 40,  beats: 8, timer: 60  },
  { id: 'moderate', icon: '<i class="bi bi-person-walking"></i>',   nameKey: 'cp.speed.moderate', bpm: 60,  beats: 4, timer: 60  },
  { id: 'fast',     icon: '<i class="bi bi-fire"></i>',             nameKey: 'cp.speed.fast',     bpm: 90,  beats: 4, timer: 60  },
  { id: 'expert',   icon: '<i class="bi bi-lightning-fill"></i>',   nameKey: 'cp.speed.expert',   bpm: 120, beats: 2, timer: 60  },
];

// ── SVG mini builder (compact version for practice view) ──────────────────────
function miniSVG(chord, size = 'normal') {
  const cl = size === 'small' ? 'cp-svg--small' : '';
  const W = 100, H = 130;
  const pL = 16, pT = 24;
  const fC = 5, sC = 6;
  const fW = (W - pL - 12) / (sC - 1);
  const fH = (H - pT - 16) / fC;
  const sx = Array.from({length:6}, (_, i) => pL + i * fW);

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cp-svg ${cl}">`;

  // Nut
  if (chord.sf === 1) {
    svg += `<rect x="${pL}" y="${pT}" width="${5*fW}" height="3" rx="1.5" fill="var(--text-primary)" opacity="0.85"/>`;
  } else {
    svg += `<text x="${pL-4}" y="${pT+fH*0.6}" text-anchor="end" fill="var(--text-muted)" font-size="8">${chord.sf}fr</text>`;
  }

  // Frets + strings
  for (let f = 0; f <= fC; f++) {
    const y = pT + f * fH + (chord.sf===1?3:0);
    svg += `<line x1="${pL}" y1="${y}" x2="${pL+5*fW}" y2="${y}" stroke="var(--border-default)" stroke-width="0.8"/>`;
  }
  sx.forEach(x => {
    svg += `<line x1="${x}" y1="${pT+(chord.sf===1?3:0)}" x2="${x}" y2="${pT+fC*fH+(chord.sf===1?3:0)}" stroke="var(--border-hover)" stroke-width="1"/>`;
  });

  // Barres
  chord.barres.forEach(b => {
    const y = pT + (b.fret - chord.sf + 0.5) * fH + (chord.sf===1?3:0);
    svg += `<line x1="${sx[b.from]}" y1="${y}" x2="${sx[b.to]}" y2="${y}" stroke="var(--accent-primary)" stroke-width="${fH*0.5}" stroke-linecap="round" opacity="0.9"/>`;
  });

  // Dots
  chord.frets.forEach((fret, i) => {
    const x = sx[i];
    const tY = pT + (chord.sf===1?3:0);
    if (fret > 0) {
      const y = tY + (fret - chord.sf + 0.5) * fH;
      svg += `<circle cx="${x}" cy="${y}" r="${fH*0.26}" fill="var(--accent-primary)"/>`;
      if (chord.fingers[i]) svg += `<text x="${x}" y="${y+3}" text-anchor="middle" font-size="6" fill="#fff">${chord.fingers[i]}</text>`;
    } else if (fret === 0) {
      svg += `<circle cx="${x}" cy="${pT-8}" r="4" fill="none" stroke="var(--accent-primary)" stroke-width="1.3"/>`;
    } else {
      svg += `<text x="${x}" y="${pT-4}" text-anchor="middle" font-size="9" fill="var(--text-muted)">×</text>`;
    }
  });

  svg += '</svg>';
  return svg;
}

function getChord(name) {
  return PRACTICE_CHORDS.find(c => c.name === name);
}

// ── Audio: use AudioContext for beat clicks ───────────────────────────────────
let audioCtx = null;
function playClick(accent = false) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = accent ? 1000 : 700;
  gain.gain.value = 0.15;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  osc.stop(audioCtx.currentTime + 0.08);
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  mode: 'setup',      // setup | countdown | running | finished
  selectedChords: [], // chord name strings
  bpm: 60,
  timerSecs: 60,
  beatsPerChord: 4,   // how many beats before switching chord
  currentChordIdx: 0,
  beatCount: 0,
  changeCount: 0,
  timeLeft: 0,
  intervalId: null,
  timerIntervalId: null,
  countdownVal: 3,
};

// ── History (localStorage) ────────────────────────────────────────────────────
function saveSession(session) {
  const key = 'cp_history';
  const hist = JSON.parse(localStorage.getItem(key) || '[]');
  hist.unshift(session);
  if (hist.length > 50) hist.length = 50;
  localStorage.setItem(key, JSON.stringify(hist));
}
function getHistory() {
  return JSON.parse(localStorage.getItem('cp_history') || '[]');
}

// ── Page Render ───────────────────────────────────────────────────────────────
export function ChordPracticePage() {
  const user = getUser();
  const pro  = isPro();

  if (!user || !pro) {
    return `
      <div class="page-header">
        <h1 class="page-header__title">${t('cp.title')}</h1>
        <p class="page-header__desc">${t('cp.desc')}</p>
      </div>
      <div class="cp-gate">
        <div class="cp-gate__icon"><i class="bi bi-lock-fill"></i></div><h2>${t('cp.proOnly')}</h2>
        <p>${t('cp.proOnlyDesc')}</p>
        <a href="#/pro" class="btn-upgrade btn-upgrade--best">${t('account.upgrade')}</a>
      </div>`;
  }

  // Setup view
  const drillsByLevel = [2, 3, 4].map(lvl => {
    const drills = PRESET_DRILLS.filter(d => d.level === lvl).map(d => `
      <button class="cp-drill-btn" data-chords="${d.chords.join(',')}" title="${d.chords.join(' → ')}">
        <span class="cp-drill-btn__label">${d.chords.join(' → ')}</span>
        <span class="cp-drill-btn__count">${d.chords.length} ${t('cp.chords')}</span>
      </button>
    `).join('');
    return `
      <div class="cp-level-group">
        <h3 class="cp-level-title">
          <span class="cp-level-badge">${lvl}</span>
          ${t(`cp.level${lvl}`)}
        </h3>
        <div class="cp-drill-grid">${drills}</div>
      </div>
    `;
  }).join('');

  // Custom chord selector
  const chordButtons = PRACTICE_CHORDS.map(c => `
    <button class="cp-chord-pick" data-chord="${c.name}">${c.name}</button>
  `).join('');

  // History
  const hist = getHistory().slice(0, 5);
  const histHTML = hist.length ? hist.map(h => `
    <div class="cp-hist-item">
      <span>${h.chords.join(' → ')}</span>
      <span>${h.changesPerMin} ${t('cp.cpm')}</span>
      <span class="cp-hist-date">${new Date(h.date).toLocaleDateString()}</span>
    </div>
  `).join('') : `<p class="cp-hist-empty">${t('cp.noHistory')}</p>`;

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('cp.title')}</h1>
      <p class="page-header__desc">${t('cp.desc')}</p>
    </div>

    <div class="cp-layout" id="cpRoot">

      <!-- Setup Panel -->
      <div class="cp-setup" id="cpSetup">

        <div class="cp-section">
          <h2 class="cp-section__title">${t('cp.presets')}</h2>
          ${drillsByLevel}
        </div>

        <div class="cp-section">
          <h2 class="cp-section__title">${t('cp.custom')}</h2>
          <p class="cp-section__desc">${t('cp.customDesc')}</p>
          <div class="cp-chord-picker" id="cpPicker">${chordButtons}</div>
          <div class="cp-custom-selected" id="cpSelected"></div>
        </div>

        <!-- Speed Presets -->
        <div class="cp-section">
          <h2 class="cp-section__title">${t('cp.speed')}</h2>
          <div class="cp-speed-grid" id="cpSpeedGrid">
            ${SPEED_PRESETS.map(sp => `
              <button class="cp-speed-card${sp.id==='moderate'?' active':''}" data-speed="${sp.id}" data-bpm="${sp.bpm}" data-beats="${sp.beats}" data-timer="${sp.timer}">
                <span class="cp-speed-card__icon">${sp.icon}</span>
                <span class="cp-speed-card__name">${t(sp.nameKey)}</span>
                <span class="cp-speed-card__detail">${sp.bpm} BPM · ${sp.beats} beats</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Timer -->
        <div class="cp-section">
          <h2 class="cp-section__title">${t('cp.timer')}</h2>
          <div class="cp-chip-row" id="cpTimer">
            ${TIMER_OPTIONS.map(s => `<button class="cp-chip${s===60?' active':''}" data-timer="${s}">${s}s</button>`).join('')}
          </div>
        </div>

        <button class="cp-start-btn" id="cpStartBtn">${t('cp.start')}</button>

        <!-- History -->
        <div class="cp-section cp-hist-section">
          <h2 class="cp-section__title">${t('cp.history')}</h2>
          <div id="cpHistory">${histHTML}</div>
        </div>
      </div>

      <!-- Practice Panel (hidden initially) -->
      <div class="cp-practice" id="cpPractice" style="display:none">
        <div class="cp-countdown" id="cpCountdown" style="display:none">
          <span id="cpCountdownVal">3</span>
        </div>

        <div class="cp-active" id="cpActive" style="display:none">
          <div class="cp-timer-bar">
            <span id="cpTimeLeft">60</span>s
            <span class="cp-changes">${t('cp.changes')}: <strong id="cpChanges">0</strong></span>
          </div>

          <div class="cp-beat-dots" id="cpBeatDots"></div>

          <div class="cp-chord-display">
            <div class="cp-chord-next" id="cpNextChord"></div>
            <div class="cp-chord-current" id="cpCurrentChord"></div>
            <div class="cp-chord-next" id="cpAfterChord"></div>
          </div>

          <button class="cp-stop-btn" id="cpStopBtn">${t('cp.stop')}</button>
        </div>

        <div class="cp-result" id="cpResult" style="display:none">
          <div class="cp-result-score" id="cpScore"></div>
          <div class="cp-result-detail" id="cpDetail"></div>
          <div class="cp-result-btns">
            <button class="cp-again-btn" id="cpAgainBtn">${t('cp.again')}</button>
            <button class="cp-back-btn" id="cpBackBtn">${t('cp.back')}</button>
          </div>
        </div>
      </div>

    </div>
  `;
}

// ── Mount ─────────────────────────────────────────────────────────────────────
let _container = null;
let _customChords = [];

export function onMount(container) {
  if (!isPro()) return;
  _container = container;
  _customChords = [];
  bindSetupListeners(container);
}

function bindSetupListeners(container) {
  // Preset drill buttons
  container.querySelectorAll('.cp-drill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chords = btn.dataset.chords.split(',');
      startPractice(container, chords);
    });
  });

  // Custom chord picker
  container.querySelectorAll('.cp-chord-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.chord;
      const idx = _customChords.indexOf(name);
      if (idx >= 0) {
        _customChords.splice(idx, 1);
        btn.classList.remove('selected');
      } else if (_customChords.length < 6) {
        _customChords.push(name);
        btn.classList.add('selected');
      }
      updateSelected(container, _customChords);
    });
  });

  // Speed presets
  container.querySelector('#cpSpeedGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-speed]');
    if (!btn) return;
    container.querySelectorAll('.cp-speed-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.bpm = parseInt(btn.dataset.bpm);
    state.beatsPerChord = parseInt(btn.dataset.beats);
  });

  // Timer
  container.querySelector('#cpTimer')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-timer]');
    if (!btn) return;
    container.querySelectorAll('#cpTimer .cp-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.timerSecs = parseInt(btn.dataset.timer);
  });

  // Start button (for custom chords)
  container.querySelector('#cpStartBtn')?.addEventListener('click', () => {
    if (_customChords.length >= 2) {
      startPractice(container, [..._customChords]);
    }
  });
}

function updateSelected(container, chords) {
  const el = container.querySelector('#cpSelected');
  const btn = container.querySelector('#cpStartBtn');
  if (!el) return;
  if (chords.length >= 2) {
    el.innerHTML = `<span class="cp-selected-label">${chords.join(' → ')}</span>`;
    btn.disabled = false;
    btn.classList.add('ready');
  } else {
    el.innerHTML = `<span class="cp-selected-hint">${t('cp.selectMin')}</span>`;
    btn.disabled = true;
    btn.classList.remove('ready');
  }
}

// ── Practice flow ─────────────────────────────────────────────────────────────
function startPractice(container, chords) {
  // Clean up any previous session first
  if (state.intervalId) clearInterval(state.intervalId);
  if (state.timerIntervalId) clearInterval(state.timerIntervalId);
  state.intervalId = null;
  state.timerIntervalId = null;

  state.selectedChords = chords;
  state.currentChordIdx = 0;
  state.beatCount = 0;
  state.changeCount = 0;
  state.timeLeft = state.timerSecs;
  state.mode = 'countdown';
  state.countdownVal = 3;

  // Switch panels
  container.querySelector('#cpSetup').style.display = 'none';
  container.querySelector('#cpPractice').style.display = 'flex';
  container.querySelector('#cpCountdown').style.display = 'flex';
  container.querySelector('#cpActive').style.display = 'none';
  container.querySelector('#cpResult').style.display = 'none';

  // Build beat dots
  const dotsEl = container.querySelector('#cpBeatDots');
  dotsEl.innerHTML = Array.from({length: state.beatsPerChord}, (_, i) =>
    `<div class="cp-dot${i===0?' accent':''}" data-b="${i}"></div>`
  ).join('');

  // Countdown
  const cdEl = container.querySelector('#cpCountdownVal');
  cdEl.textContent = '3';
  const cdInterval = setInterval(() => {
    state.countdownVal--;
    if (state.countdownVal > 0) {
      cdEl.textContent = state.countdownVal;
      playClick(true);
    } else {
      clearInterval(cdInterval);
      container.querySelector('#cpCountdown').style.display = 'none';
      container.querySelector('#cpActive').style.display = 'flex';
      runPractice(container);
    }
  }, 1000);
  playClick(true);
}

function runPractice(container) {
  state.mode = 'running';
  renderChords(container);
  const timeEl = container.querySelector('#cpTimeLeft');
  const changesEl = container.querySelector('#cpChanges');
  timeEl.textContent = state.timeLeft;
  changesEl.textContent = '0';

  // Timer countdown
  state.timerIntervalId = setInterval(() => {
    state.timeLeft--;
    timeEl.textContent = state.timeLeft;
    if (state.timeLeft <= 0) {
      finishPractice(container);
    }
  }, 1000);

  // Beat interval
  const beatMs = 60000 / state.bpm;
  state.intervalId = setInterval(() => {
    state.beatCount++;
    const beatInChord = state.beatCount % state.beatsPerChord;

    // Beat dot highlight
    const dots = container.querySelectorAll('.cp-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === beatInChord));

    // Click sound
    playClick(beatInChord === 0);

    // Chord change
    if (beatInChord === 0 && state.beatCount > 0) {
      state.currentChordIdx = (state.currentChordIdx + 1) % state.selectedChords.length;
      state.changeCount++;
      changesEl.textContent = state.changeCount;
      renderChords(container);
    }
  }, beatMs);

  // Stop button (use { once: true } to avoid stacking listeners)
  container.querySelector('#cpStopBtn')?.addEventListener('click', () => finishPractice(container), { once: true });
}

function renderChords(container) {
  const chords = state.selectedChords;
  const idx = state.currentChordIdx;
  const prevIdx = (idx - 1 + chords.length) % chords.length;
  const nextIdx = (idx + 1) % chords.length;

  const cur  = getChord(chords[idx]);
  const next = getChord(chords[nextIdx]);
  const prev = getChord(chords[prevIdx]);

  container.querySelector('#cpNextChord').innerHTML = prev
    ? `<div class="cp-chord-label">← ${prev.name}</div>${miniSVG(prev, 'small')}` : '';
  container.querySelector('#cpCurrentChord').innerHTML = cur
    ? `<div class="cp-chord-label cp-chord-label--active">${cur.name}</div>${miniSVG(cur)}` : '';
  container.querySelector('#cpAfterChord').innerHTML = next
    ? `<div class="cp-chord-label">${next.name} →</div>${miniSVG(next, 'small')}` : '';
}

function finishPractice(container) {
  if (state.mode === 'finished') return; // prevent double-fire
  state.mode = 'finished';
  clearInterval(state.intervalId);
  clearInterval(state.timerIntervalId);
  state.intervalId = null;
  state.timerIntervalId = null;

  container.querySelector('#cpActive').style.display = 'none';
  container.querySelector('#cpResult').style.display = 'flex';

  const elapsed = state.timerSecs - state.timeLeft;
  const cpm     = elapsed > 0 ? Math.round(state.changeCount / (elapsed / 60)) : 0;

  const session = {
    chords: state.selectedChords,
    changes: state.changeCount,
    seconds: elapsed,
    changesPerMin: cpm,
    bpm: state.bpm,
    date: Date.now(),
  };
  saveSession(session);

  container.querySelector('#cpScore').innerHTML = `
    <div class="cp-score-num">${cpm}</div>
    <div class="cp-score-label">${t('cp.cpm')}</div>
  `;
  container.querySelector('#cpDetail').innerHTML = `
    <div class="cp-detail-row">${t('cp.totalChanges')}: <strong>${state.changeCount}</strong></div>
    <div class="cp-detail-row">${t('cp.time')}: <strong>${elapsed}s</strong></div>
    <div class="cp-detail-row">${t('cp.chordsUsed')}: <strong>${state.selectedChords.join(' → ')}</strong></div>
  `;

  // Again button
  container.querySelector('#cpAgainBtn')?.addEventListener('click', () => {
    startPractice(container, state.selectedChords);
  }, { once: true });

  // Back button — properly reset and show setup with refreshed history
  container.querySelector('#cpBackBtn')?.addEventListener('click', () => {
    container.querySelector('#cpPractice').style.display = 'none';
    container.querySelector('#cpSetup').style.display = 'flex';

    // Refresh history section
    const histEl = container.querySelector('#cpHistory');
    if (histEl) {
      const hist = getHistory().slice(0, 5);
      histEl.innerHTML = hist.length ? hist.map(h => `
        <div class="cp-hist-item">
          <span>${h.chords.join(' → ')}</span>
          <span>${h.changesPerMin} ${t('cp.cpm')}</span>
          <span class="cp-hist-date">${new Date(h.date).toLocaleDateString()}</span>
        </div>
      `).join('') : `<p class="cp-hist-empty">${t('cp.noHistory')}</p>`;
    }
  }, { once: true });
}

// ── Destroy ───────────────────────────────────────────────────────────────────
export function onDestroy() {
  if (state.intervalId) clearInterval(state.intervalId);
  if (state.timerIntervalId) clearInterval(state.timerIntervalId);
  state.intervalId = null;
  state.timerIntervalId = null;
  _container = null;
  _customChords = [];
}

