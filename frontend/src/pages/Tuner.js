/**
 * Tuner — Guided string-by-string tuning with preset selection,
 * real-time pitch detection, gauge meter, and completion modal.
 */

import { PitchDetector, frequencyToNote, TUNING_PRESETS } from '../lib/PitchDetector.js';

// ── Module state ──
let detector = null;
let animFrameId = null;
let isActive = false;

// Guided mode state
let currentPreset = null;      // key in TUNING_PRESETS
let currentStringIdx = 0;      // 0–5
let tunedStrings = [];          // boolean[6]
let inTuneStartTime = null;     // timestamp when string entered in-tune zone
const IN_TUNE_HOLD_MS = 1500;   // must hold in-tune for 1.5s
let flowPhase = 'select';       // 'select' | 'tuning' | 'complete'

// ── SVG Gauge Builder ──
function buildGaugeSVG() {
  const cx = 180, cy = 180, r = 150;
  const startAngle = Math.PI;
  const endAngle = 0;
  const ticks = [];

  for (let i = -50; i <= 50; i += 10) {
    const pct = (i + 50) / 100;
    const angle = startAngle + pct * (endAngle - startAngle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const outerR = i === 0 ? r + 8 : r;
    const innerR = i % 20 === 0 ? r - 18 : r - 10;
    const strokeW = i === 0 ? 2.5 : 1.2;
    const color = i === 0 ? '#22cc66' : 'rgba(255,255,255,0.2)';

    ticks.push(`<line 
      x1="${cx + innerR * cos}" y1="${cy - innerR * sin}"
      x2="${cx + outerR * cos}" y2="${cy - outerR * sin}"
      stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round"
    />`);

    if (i % 20 === 0 || i === -50 || i === 50) {
      const labelR = r - 32;
      const label = i > 0 ? `+${i}` : `${i}`;
      ticks.push(`<text 
        x="${cx + labelR * cos}" y="${cy - labelR * sin + 4}"
        text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="11" font-family="var(--font-mono)"
      >${label}</text>`);
    }
  }

  const arcPath = describeArc(cx, cy, r, 180, 0);

  return `
    <svg class="tuner-gauge__svg" viewBox="0 0 360 200">
      <path d="${arcPath}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6" stroke-linecap="round"/>
      ${ticks.join('')}
      <g class="tuner-gauge__needle" id="gauge-needle" style="transform: rotate(-90deg)">
        <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r + 25}" />
        <circle cx="${cx}" cy="${cy}" r="6" />
      </g>
      <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="rgba(255,255,255,0.15)" font-size="10" font-family="var(--font-mono)">CENTS</text>
    </svg>
  `;
}

function describeArc(cx, cy, r, startDeg, endDeg) {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy - r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy - r * Math.sin(endRad);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`;
}

// ── WhatsApp SVG icon ──
const whatsappIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

// ── Render ──
function render() {
  const presetCards = Object.entries(TUNING_PRESETS).map(([key, preset]) => `
    <button class="tuning-preset-card" data-preset="${key}">
      <div class="tuning-preset-card__icon">${preset.icon}</div>
      <div class="tuning-preset-card__name">${preset.name}</div>
      <div class="tuning-preset-card__desc">${preset.desc}</div>
    </button>
  `).join('');

  return `
    <div class="page-header" id="tuner-page-header">
      <h1 class="page-header__title">Guitar Tuner</h1>
      <p class="page-header__desc">
        Selecciona una afinación y afina cuerda por cuerda con guía en tiempo real.
      </p>
    </div>

    <!-- Phase: Select Tuning -->
    <div class="tuner-phase" id="phase-select">
      <div class="tuner-section-label">Selecciona tu afinación</div>
      <div class="tuning-presets-grid" id="tuning-presets">
        ${presetCards}
      </div>
    </div>

    <!-- Phase: Guided Tuning -->
    <div class="tuner-phase hidden" id="phase-tuning">
      <div class="tuner-grid">
        <!-- Top Bar -->
        <div class="tuner-grid__topbar">
          <button class="btn btn-ghost" id="tuner-back">← Cambiar afinación</button>
          <div class="tuner-progress" id="tuner-progress">
            <span class="tuner-progress__text">Cuerda <span id="tuner-progress-current">1</span>/<span id="tuner-progress-total">6</span></span>
            <div class="tuner-progress__bar"><div class="tuner-progress__fill" id="tuner-progress-fill" style="width:0%"></div></div>
          </div>
          <button class="tuner-share-btn" id="tuner-share">
            ${whatsappIcon}
            <span>Compartir</span>
          </button>
        </div>

        <!-- Left column: Target + State + Strings -->
        <div class="tuner-grid__left">
          <div class="tuner-panel__label">Nota objetivo</div>
          <div class="tuner-target" id="tuner-target">
            <span class="tuner-target__label">Afina la cuerda</span>
            <span class="tuner-target__note" id="tuner-target-note">E2</span>
            <span class="tuner-target__string" id="tuner-target-string">6ª cuerda</span>
          </div>

          <div class="tuner-state" id="tuner-state" data-state="listening">
            <i class="bi bi-volume-up"></i> Escuchando…
          </div>

          <div class="tuner-panel">
            <div class="tuner-panel__label">Progreso de cuerdas</div>
            <div class="tuner-strings-guided" id="tuner-strings-guided"></div>
          </div>
        </div>

        <!-- Center column: Gauge + Note -->
        <div class="tuner-grid__center">
          <div class="tuner-gauge" id="tuner-gauge" data-state="idle">
            ${buildGaugeSVG()}
          </div>
          <div class="tuner-note">
            <div class="tuner-note__name" id="tuner-note">—<span></span></div>
            <div class="tuner-note__freq" id="tuner-freq">— Hz</div>
          </div>
          <div class="tuner-cents" id="tuner-cents">0¢</div>
        </div>

        <!-- Right column: Waveform + Tips -->
        <div class="tuner-grid__right">
          <div class="tuner-panel">
            <div class="tuner-panel__label">Señal de audio</div>
            <canvas class="tuner-waveform" id="tuner-waveform"></canvas>
          </div>

          <div class="tuner-panel">
            <div class="tuner-panel__label">Tips de afinación</div>
            <div class="tuner-tips">
              <div class="tuner-tips__item"><i class="bi bi-bullseye"></i> Toca la cuerda con fuerza y espera a que estabilice</div>
              <div class="tuner-tips__item"><i class="bi bi-volume-mute-fill"></i> Afina en un lugar silencioso para mejor precisión</div>
              <div class="tuner-tips__item"><i class="bi bi-arrow-repeat"></i> Si la cuerda está muy desafinada, gira la clavija lentamente</div>
              <div class="tuner-tips__item"><i class="bi bi-check-circle-fill"></i> Mantén la nota afinada 1.5s para confirmar</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Phase: Complete Modal -->
    <div class="tuner-modal-overlay hidden" id="phase-complete">
      <div class="tuner-modal">
        <div class="tuner-modal__icon"><i class="bi bi-stars"></i></div>
        <h2 class="tuner-modal__title">¡Guitarra Afinada!</h2>
        <p class="tuner-modal__desc">
          Tu guitarra está perfectamente afinada en <strong id="modal-tuning-name">Estándar</strong>.
        </p>
        <p class="tuner-modal__sub">¡Ahora a tocar! <i class="bi bi-music-note-beamed"></i></p>

        <div class="tuner-modal__actions">
          <button class="btn btn-primary" id="modal-tune-again"><i class="bi bi-arrow-repeat"></i> Afinar de nuevo</button>
          <button class="tuner-share-btn tuner-share-btn--lg" id="modal-share">
            ${whatsappIcon}
            <span>Compartir en WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Build guided string buttons ──
function renderStringButtons(container) {
  if (!currentPreset) return;
  const preset = TUNING_PRESETS[currentPreset];
  const el = container.querySelector('#tuner-strings-guided');
  if (!el) return;

  el.innerHTML = preset.strings.map((s, i) => {
    let stateClass = 'pending';
    let icon = '';
    if (tunedStrings[i]) {
      stateClass = 'tuned';
      icon = '<i class="bi bi-check2"></i>';
    } else if (i === currentStringIdx) {
      stateClass = 'current';
      icon = '<i class="bi bi-music-note"></i>';
    }
    return `
      <div class="tuner-string-step ${stateClass}">
        <div class="tuner-string-step__num">${icon || s.label}</div>
        <div class="tuner-string-step__note">${s.note}<sub>${s.octave}</sub></div>
        <div class="tuner-string-step__freq">${s.freq.toFixed(0)} Hz</div>
      </div>
    `;
  }).join('');
}

// ── Update target display ──
function updateTarget(container) {
  if (!currentPreset) return;
  const preset = TUNING_PRESETS[currentPreset];
  const s = preset.strings[currentStringIdx];

  const noteEl = container.querySelector('#tuner-target-note');
  const stringEl = container.querySelector('#tuner-target-string');
  const currEl = container.querySelector('#tuner-progress-current');
  const fillEl = container.querySelector('#tuner-progress-fill');

  if (noteEl) noteEl.textContent = s.name;
  if (stringEl) stringEl.textContent = `${s.label} cuerda`;
  if (currEl) currEl.textContent = currentStringIdx + 1;
  if (fillEl) fillEl.style.width = `${(tunedStrings.filter(Boolean).length / 6) * 100}%`;
}

// ── onMount ──
function onMount(container) {
  detector = new PitchDetector();
  flowPhase = 'select';
  currentPreset = null;
  currentStringIdx = 0;
  tunedStrings = [false, false, false, false, false, false];
  inTuneStartTime = null;

  // Preset selection
  container.querySelector('#tuning-presets').addEventListener('click', async (e) => {
    const card = e.target.closest('.tuning-preset-card');
    if (!card) return;
    currentPreset = card.dataset.preset;
    currentStringIdx = 0;
    tunedStrings = [false, false, false, false, false, false];
    inTuneStartTime = null;

    // Switch to tuning phase
    showPhase(container, 'tuning');

    // Start mic
    try {
      await detector.start();
      isActive = true;
      renderStringButtons(container);
      updateTarget(container);
      setupWaveformCanvas(container);
      startGuidedLoop(container);
    } catch {
      updateState(container, 'idle', '<i class="bi bi-exclamation-triangle"></i> Acceso al micrófono denegado');
    }
  });

  // Back button
  container.querySelector('#tuner-back').addEventListener('click', () => {
    stopTuner(container);
    flowPhase = 'select';
    currentPreset = null;
    showPhase(container, 'select');
  });

  // Share buttons
  container.querySelector('#tuner-share').addEventListener('click', shareWhatsApp);
  container.querySelector('#modal-share').addEventListener('click', shareWhatsApp);

  // Tune again
  container.querySelector('#modal-tune-again').addEventListener('click', () => {
    currentStringIdx = 0;
    tunedStrings = [false, false, false, false, false, false];
    inTuneStartTime = null;
    showPhase(container, 'tuning');
    renderStringButtons(container);
    updateTarget(container);

    if (!isActive) {
      detector.start().then(() => {
        isActive = true;
        startGuidedLoop(container);
      });
    } else {
      startGuidedLoop(container);
    }
  });
}

// ── onDestroy ──
function onDestroy() {
  stopTuner(null);
  detector = null;
  currentPreset = null;
  flowPhase = 'select';
}

function stopTuner(container) {
  isActive = false;
  inTuneStartTime = null;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (detector) {
    detector.stop();
  }
}

// ── Phase switching ──
function showPhase(container, phase) {
  flowPhase = phase;
  const header = container.querySelector('#tuner-page-header');
  const select = container.querySelector('#phase-select');
  const tuning = container.querySelector('#phase-tuning');
  const complete = container.querySelector('#phase-complete');

  // Hide header during tuning to maximize viewport space
  if (header) header.classList.toggle('hidden', phase !== 'select');

  select.classList.toggle('hidden', phase !== 'select');
  tuning.classList.toggle('hidden', phase !== 'tuning' && phase !== 'complete');
  complete.classList.toggle('hidden', phase !== 'complete');

  if (phase === 'complete') {
    const nameEl = container.querySelector('#modal-tuning-name');
    if (nameEl && currentPreset) {
      nameEl.textContent = TUNING_PRESETS[currentPreset].name;
    }
  }
}

// ── Share on WhatsApp ──
function shareWhatsApp() {
  const text = encodeURIComponent(
    '🎸 ¡Acabo de afinar mi guitarra con GuitarTool! Herramienta gratuita con afinador, metrónomo y más. ¡Pruébala! 🎶\nhttps://guitartool.app'
  );
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// ── Guided tuning loop ──
function startGuidedLoop(container) {
  if (animFrameId) cancelAnimationFrame(animFrameId);

  function tick() {
    if (!isActive || flowPhase !== 'tuning') return;

    const pitch = detector.getPitch();
    const noteInfo = pitch ? frequencyToNote(pitch) : null;
    const preset = TUNING_PRESETS[currentPreset];
    const targetString = preset.strings[currentStringIdx];

    if (noteInfo) {
      // Update displays
      const noteEl = container.querySelector('#tuner-note');
      const freqEl = container.querySelector('#tuner-freq');
      const centsEl = container.querySelector('#tuner-cents');

      if (noteEl) noteEl.innerHTML = `${noteInfo.note}<span>${noteInfo.octave}</span>`;
      if (freqEl) freqEl.textContent = `${noteInfo.freq} Hz`;
      if (centsEl) centsEl.textContent = `${noteInfo.cents > 0 ? '+' : ''}${noteInfo.cents}¢`;

      // Check if it matches the target string
      const matchesTarget = noteInfo.note === targetString.note && noteInfo.octave === targetString.octave;
      const absCents = Math.abs(noteInfo.cents);

      let state, msg;

      if (matchesTarget && absCents <= 5) {
        state = 'in-tune';
        msg = '<i class="bi bi-check2"></i> ¡Afinada!';

        // Hold timer
        if (!inTuneStartTime) {
          inTuneStartTime = Date.now();
        } else if (Date.now() - inTuneStartTime >= IN_TUNE_HOLD_MS) {
          // String confirmed tuned!
          tunedStrings[currentStringIdx] = true;
          inTuneStartTime = null;
          renderStringButtons(container);

          // Check if all done
          if (tunedStrings.every(Boolean)) {
            showPhase(container, 'complete');
            animFrameId = requestAnimationFrame(tick);
            return;
          }

          // Advance to next un-tuned string
          advanceToNextString(container);
        }
      } else if (matchesTarget) {
        inTuneStartTime = null;
        if (noteInfo.cents < 0) {
          state = 'flat';
          msg = '<i class="bi bi-arrow-up"></i> Sube el tono';
        } else {
          state = 'sharp';
          msg = '<i class="bi bi-arrow-down"></i> Baja el tono';
        }
      } else {
        inTuneStartTime = null;
        state = 'listening';
        msg = `<i class="bi bi-bullseye"></i> Toca la cuerda ${targetString.label} (${targetString.note}${targetString.octave})`;
      }

      updateState(container, state, msg);
      updateGauge(container, matchesTarget ? noteInfo.cents : 0, matchesTarget ? state : 'idle');
    } else {
      inTuneStartTime = null;
      updateState(container, 'listening', '<i class="bi bi-volume-up"></i> Escuchando…');
    }

    drawWaveform(container);
    animFrameId = requestAnimationFrame(tick);
  }

  tick();
}

function advanceToNextString(container) {
  for (let i = currentStringIdx + 1; i < 6; i++) {
    if (!tunedStrings[i]) {
      currentStringIdx = i;
      inTuneStartTime = null;
      updateTarget(container);
      renderStringButtons(container);
      return;
    }
  }
  // If we didn't find one forward, check from the beginning
  for (let i = 0; i < currentStringIdx; i++) {
    if (!tunedStrings[i]) {
      currentStringIdx = i;
      inTuneStartTime = null;
      updateTarget(container);
      renderStringButtons(container);
      return;
    }
  }
}

// ── UI Helpers (same as before) ──
function updateState(container, state, text) {
  const el = container?.querySelector('#tuner-state');
  if (el) {
    el.dataset.state = state;
    el.innerHTML = text;
  }
}

function updateGauge(container, cents, state) {
  const gauge = container?.querySelector('#tuner-gauge');
  const needle = container?.querySelector('#gauge-needle');
  if (!gauge || !needle) return;
  gauge.dataset.state = state;
  const clamped = Math.max(-50, Math.min(50, cents));
  const angle = (clamped / 50) * 90;
  needle.style.transform = `rotate(${angle - 90}deg)`;
}

function setupWaveformCanvas(container) {
  const canvas = container.querySelector('#tuner-waveform');
  if (canvas) {
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }
}

function drawWaveform(container) {
  const canvas = container?.querySelector('#tuner-waveform');
  if (!canvas || !detector) return;

  const ctx = canvas.getContext('2d');
  const data = detector.getTimeDomainData();
  if (!data) return;

  const w = canvas.width;
  const h = canvas.height;
  const dpr = window.devicePixelRatio || 1;

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  ctx.strokeStyle = '#0066ff';
  ctx.lineWidth = 2 * dpr;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  const sliceWidth = w / data.length;
  let x = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * h) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(0, 102, 255, 0.3)';
  ctx.lineWidth = 6 * dpr;
  ctx.beginPath();
  x = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 128.0;
    const y = (v * h) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.stroke();
}

// ── Export ──
export const TunerPage = {
  render,
  onMount,
  onDestroy,
};
