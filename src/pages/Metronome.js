/**
 * Metronome — Full-featured metronome powered by Web Audio API look-ahead scheduler.
 * Exports { render, onMount, onDestroy } for the Router lifecycle.
 */

// ── BPM Presets ────────────────────────────────────────────────────────────────
const DEFAULT_BPM = 76; // Andante

const BPM_PRESETS = [
  { name: 'Largo',       bpm: 40  },
  { name: 'Larghetto',   bpm: 60  },
  { name: 'Andante',     bpm: 76, default: true },
  { name: 'Moderato',    bpm: 100 },
  { name: 'Allegretto',  bpm: 116 },
  { name: 'Allegro',     bpm: 132 },
  { name: 'Vivace',      bpm: 160 },
  { name: 'Presto',      bpm: 184 },
  { name: 'Prestissimo', bpm: 208 },
];

const TIME_SIGS = [
  { label: '2/4', beats: 2 },
  { label: '3/4', beats: 3 },
  { label: '4/4', beats: 4 },
  { label: '5/4', beats: 5 },
  { label: '6/4', beats: 6 },
  { label: '6/8', beats: 6 },
  { label: '7/8', beats: 7 },
];

const SUBDIVISIONS = [
  { label: '♩ Negra',       value: 1   },
  { label: '♪ Corchea',     value: 2   },
  { label: '♪³ Tresillo',   value: 3   },
  { label: '♬ Semicorchea', value: 4   },
];

// ── HTML Template ──────────────────────────────────────────────────────────────
export function render() {
  const presetPills = BPM_PRESETS.map(p => `
    <button class="metro-preset${p.default ? ' active' : ''}" data-bpm="${p.bpm}" title="${p.bpm} BPM">
      <span class="metro-preset__name">${p.name}</span>
      <span class="metro-preset__bpm">${p.bpm}</span>
    </button>
  `).join('');

  const timeSigBtns = TIME_SIGS.map((ts, i) => `
    <button class="metro-chip${i === 2 ? ' active' : ''}" data-beats="${ts.beats}" data-label="${ts.label}">
      ${ts.label}
    </button>
  `).join('');

  const subdivBtns = SUBDIVISIONS.map((s, i) => `
    <button class="metro-chip${i === 0 ? ' active' : ''}" data-subdiv="${s.value}">
      ${s.label}
    </button>
  `).join('');

  // 4 beat dots (will be updated dynamically)
  const beatDots = Array.from({ length: 4 }, (_, i) =>
    `<div class="metro-dot${i === 0 ? ' accent' : ''}" data-beat="${i}"></div>`
  ).join('');

  return `
    <div class="page-header">
      <h1 class="page-header__title">Metrónomo</h1>
      <p class="page-header__desc">
        Metrónomo de precisión con Web Audio API. Pulsa <kbd>Espacio</kbd> para iniciar / detener.
      </p>
    </div>

    <div class="metro-layout">

      <!-- ── Beat Visualizer ── -->
      <div class="metro-visualizer" id="metroBeatRow">
        ${beatDots}
      </div>

      <!-- ── BPM Display ── -->
      <div class="metro-bpm-block">
        <button class="metro-adj-btn" id="metroBpmMinus" aria-label="Bajar BPM">−</button>
        <div class="metro-bpm-display">
          <input class="metro-bpm-input" id="metroBpmInput" type="number"
            min="20" max="300" value="76" aria-label="BPM">
          <span class="metro-bpm-label">BPM</span>
        </div>
        <button class="metro-adj-btn" id="metroBpmPlus" aria-label="Subir BPM">+</button>
      </div>

      <!-- ── BPM Slider ── -->
      <div class="metro-slider-wrap">
        <span class="metro-slider-label">20</span>
        <input class="metro-slider" id="metroBpmSlider" type="range"
          min="20" max="300" value="76" aria-label="BPM slider">
        <span class="metro-slider-label">300</span>
      </div>

      <!-- ── Play / Stop ── -->
      <div class="metro-controls-row">
        <button class="metro-tap-btn" id="metroTap">
          <span>TAP</span>
          <small>Tempo</small>
        </button>
        <button class="metro-play-btn" id="metroPlay" aria-label="Iniciar metrónomo">
          <svg class="metro-play-icon" id="metroPlayIcon" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        </button>
        <div class="metro-volume-wrap">
          <span class="metro-vol-icon">🔊</span>
          <input class="metro-slider metro-vol-slider" id="metroVolume" type="range"
            min="0" max="100" value="80" aria-label="Volumen">
        </div>
      </div>

      <!-- ── Time Signature ── -->
      <div class="metro-section">
        <div class="metro-section__label">Compás</div>
        <div class="metro-chip-row" id="metroTimeSig">
          ${timeSigBtns}
        </div>
      </div>

      <!-- ── Subdivision ── -->
      <div class="metro-section">
        <div class="metro-section__label">Subdivisión</div>
        <div class="metro-chip-row" id="metroSubdiv">
          ${subdivBtns}
        </div>
      </div>

      <!-- ── BPM Presets ── -->
      <div class="metro-section">
        <div class="metro-section__label">Velocidades de práctica</div>
        <div class="metro-presets-grid" id="metroPresets">
          ${presetPills}
        </div>
      </div>

    </div>
  `;
}

// ── Engine ─────────────────────────────────────────────────────────────────────
let audioCtx     = null;
let isPlaying    = false;
let currentBeat  = 0;        // 0-indexed beat within the measure
let nextBeatTime = 0;        // Web Audio clock time for next beat
let schedulerTimer = null;

// State
let state = {
  bpm:       100,
  beats:     4,
  subdiv:    1,
  volume:    0.8,
};

// Tap tempo
let tapTimes = [];

// DOM refs (populated in onMount)
let refs = {};

// ── Audio helpers ──────────────────────────────────────────────────────────────
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playClick(time, isAccent) {
  const ctx    = getAudioCtx();
  const gain   = ctx.createGain();
  const osc    = ctx.createOscillator();

  // Accent = higher-pitched, regular = softer click
  osc.frequency.value = isAccent ? 1200 : 800;
  osc.type = 'sine';

  gain.gain.setValueAtTime(state.volume * (isAccent ? 1 : 0.65), time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + (isAccent ? 0.06 : 0.04));

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.1);
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
// Look-ahead: 100ms buffer, runs every 25ms — this avoids timer jitter
const LOOKAHEAD   = 0.1;   // seconds
const SCHEDULE_MS = 25;    // ms

function scheduleBeats() {
  const ctx = getAudioCtx();
  const secondsPerBeat = 60.0 / (state.bpm * state.subdiv);

  while (nextBeatTime < ctx.currentTime + LOOKAHEAD) {
    const isAccent = (currentBeat % state.subdiv === 0) &&
                     (Math.floor(currentBeat / state.subdiv) === 0);
    const isSubAccent = currentBeat % state.subdiv === 0;

    playClick(nextBeatTime, isAccent);

    // Schedule visual flash — convert Audio time to real time
    const delay = (nextBeatTime - ctx.currentTime) * 1000;
    const beatIndex = Math.floor(currentBeat / state.subdiv);
    scheduleVisual(beatIndex, delay, isAccent || isSubAccent);

    currentBeat = (currentBeat + 1) % (state.beats * state.subdiv);
    nextBeatTime += secondsPerBeat;
  }
}

function scheduleVisual(beatIndex, delayMs, isMain) {
  if (!isMain) return;
  setTimeout(() => flashBeat(beatIndex), Math.max(0, delayMs));
}

function flashBeat(beatIndex) {
  const dots = refs.beatRow?.querySelectorAll('.metro-dot');
  if (!dots) return;
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === beatIndex);
  });
}

function startMetronome() {
  if (isPlaying) return;
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  isPlaying    = true;
  currentBeat  = 0;
  nextBeatTime = ctx.currentTime + 0.05;
  schedulerTimer = setInterval(scheduleBeats, SCHEDULE_MS);
  updatePlayButton();
}

function stopMetronome() {
  if (!isPlaying) return;
  isPlaying = false;
  clearInterval(schedulerTimer);
  schedulerTimer = null;
  // Clear all dots
  refs.beatRow?.querySelectorAll('.metro-dot')
    .forEach(d => d.classList.remove('active'));
  updatePlayButton();
}

function toggleMetronome() {
  isPlaying ? stopMetronome() : startMetronome();
}

function updatePlayButton() {
  if (!refs.playIcon) return;
  if (isPlaying) {
    refs.playIcon.innerHTML = `
      <rect x="5" y="3" width="4" height="18" rx="1"/>
      <rect x="15" y="3" width="4" height="18" rx="1"/>
    `;
    refs.playBtn?.classList.add('playing');
  } else {
    refs.playIcon.innerHTML = `<polygon points="5,3 19,12 5,21"/>`;
    refs.playBtn?.classList.remove('playing');
  }
}

// ── BPM helpers ────────────────────────────────────────────────────────────────
function setBpm(val) {
  val = Math.max(20, Math.min(300, Math.round(val)));
  state.bpm = val;
  if (refs.bpmInput)  refs.bpmInput.value   = val;
  if (refs.bpmSlider) refs.bpmSlider.value  = val;
  // Highlight matching preset
  refs.presetsGrid?.querySelectorAll('.metro-preset').forEach(p => {
    p.classList.toggle('active', Number(p.dataset.bpm) === val);
  });
}

// ── Beat dot row builder ───────────────────────────────────────────────────────
function rebuildDots() {
  if (!refs.beatRow) return;
  refs.beatRow.innerHTML = Array.from({ length: state.beats }, (_, i) => `
    <div class="metro-dot${i === 0 ? ' accent' : ''}" data-beat="${i}"></div>
  `).join('');
}

// ── Tap Tempo ─────────────────────────────────────────────────────────────────
function handleTap() {
  const now = performance.now();
  tapTimes.push(now);
  if (tapTimes.length > 8) tapTimes.shift();         // keep last 8 taps
  if (tapTimes.length < 2) return;

  // Average intervals
  let total = 0;
  for (let i = 1; i < tapTimes.length; i++) {
    total += tapTimes[i] - tapTimes[i - 1];
  }
  const avgMs = total / (tapTimes.length - 1);
  setBpm(Math.round(60000 / avgMs));

  // Reset tap history if gap > 3 sec
  clearTimeout(refs.tapReset);
  refs.tapReset = setTimeout(() => { tapTimes = []; }, 3000);
}

// ── Mount ─────────────────────────────────────────────────────────────────────
export function onMount(container) {
  // Reset engine state
  stopMetronome();
  currentBeat = 0;
  state = { bpm: DEFAULT_BPM, beats: 4, subdiv: 1, volume: 0.8 };
  tapTimes = [];

  // Gather DOM refs
  refs = {
    container,
    beatRow:     container.querySelector('#metroBeatRow'),
    bpmInput:    container.querySelector('#metroBpmInput'),
    bpmSlider:   container.querySelector('#metroBpmSlider'),
    bpmMinus:    container.querySelector('#metroBpmMinus'),
    bpmPlus:     container.querySelector('#metroBpmPlus'),
    playBtn:     container.querySelector('#metroPlay'),
    playIcon:    container.querySelector('#metroPlayIcon'),
    tapBtn:      container.querySelector('#metroTap'),
    volSlider:   container.querySelector('#metroVolume'),
    timeSigRow:  container.querySelector('#metroTimeSig'),
    subdivRow:   container.querySelector('#metroSubdiv'),
    presetsGrid: container.querySelector('#metroPresets'),
  };

  // ── BPM slider ──
  refs.bpmSlider?.addEventListener('input', e => setBpm(Number(e.target.value)));

  // ── BPM input ──
  refs.bpmInput?.addEventListener('change', e => setBpm(Number(e.target.value)));
  refs.bpmInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') setBpm(Number(e.target.value));
  });

  // ── +/- buttons ──
  refs.bpmMinus?.addEventListener('click', () => setBpm(state.bpm - 1));
  refs.bpmPlus?.addEventListener('click',  () => setBpm(state.bpm + 1));

  // Hold to repeat on +/- buttons
  ['bpmMinus', 'bpmPlus'].forEach(key => {
    let held = null;
    refs[key]?.addEventListener('mousedown', () => {
      held = setInterval(() => {
        key === 'bpmMinus' ? setBpm(state.bpm - 1) : setBpm(state.bpm + 1);
      }, 80);
    });
    ['mouseup', 'mouseleave'].forEach(ev =>
      refs[key]?.addEventListener(ev, () => clearInterval(held))
    );
  });

  // ── Play / Stop ──
  refs.playBtn?.addEventListener('click', toggleMetronome);

  // ── Tap Tempo ──
  refs.tapBtn?.addEventListener('click', handleTap);

  // ── Volume ──
  refs.volSlider?.addEventListener('input', e => {
    state.volume = Number(e.target.value) / 100;
  });

  // ── Time Signature ──
  refs.timeSigRow?.addEventListener('click', e => {
    const btn = e.target.closest('[data-beats]');
    if (!btn) return;
    refs.timeSigRow.querySelectorAll('.metro-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.beats = Number(btn.dataset.beats);
    currentBeat = 0;
    rebuildDots();
  });

  // ── Subdivision ──
  refs.subdivRow?.addEventListener('click', e => {
    const btn = e.target.closest('[data-subdiv]');
    if (!btn) return;
    refs.subdivRow.querySelectorAll('.metro-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.subdiv = Number(btn.dataset.subdiv);
    currentBeat = 0;
  });

  // ── Presets ──
  refs.presetsGrid?.addEventListener('click', e => {
    const btn = e.target.closest('[data-bpm]');
    if (!btn) return;
    setBpm(Number(btn.dataset.bpm));
  });

  // ── Space key ──
  refs._keyHandler = e => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      toggleMetronome();
    }
  };
  document.addEventListener('keydown', refs._keyHandler);
}

// ── Destroy ───────────────────────────────────────────────────────────────────
export function onDestroy() {
  stopMetronome();
  if (refs._keyHandler) {
    document.removeEventListener('keydown', refs._keyHandler);
  }
  refs = {};
}
