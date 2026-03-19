/**
 * EarTraining.js — PRO: Ear Training
 * Interval, chord, and note recognition exercises.
 */
import { t } from '../lib/i18n.js';
import { getUser } from '../lib/auth.js';
import { isPro } from '../lib/subscription.js';

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_DISPLAY = { 'C#':'C#/Db','D#':'D#/Eb','F#':'F#/Gb','G#':'G#/Ab','A#':'A#/Bb' };

const INTERVALS = [
  { semitones: 0,  nameKey: 'ear.int.unison' },
  { semitones: 1,  nameKey: 'ear.int.min2' },
  { semitones: 2,  nameKey: 'ear.int.maj2' },
  { semitones: 3,  nameKey: 'ear.int.min3' },
  { semitones: 4,  nameKey: 'ear.int.maj3' },
  { semitones: 5,  nameKey: 'ear.int.p4' },
  { semitones: 6,  nameKey: 'ear.int.tritone' },
  { semitones: 7,  nameKey: 'ear.int.p5' },
  { semitones: 8,  nameKey: 'ear.int.min6' },
  { semitones: 9,  nameKey: 'ear.int.maj6' },
  { semitones: 10, nameKey: 'ear.int.min7' },
  { semitones: 11, nameKey: 'ear.int.maj7' },
  { semitones: 12, nameKey: 'ear.int.octave' },
];

const CHORD_TYPES = [
  { type: 'major',  intervals: [0,4,7],    nameKey: 'ear.ch.major' },
  { type: 'minor',  intervals: [0,3,7],    nameKey: 'ear.ch.minor' },
  { type: 'dim',    intervals: [0,3,6],    nameKey: 'ear.ch.dim' },
  { type: 'aug',    intervals: [0,4,8],    nameKey: 'ear.ch.aug' },
  { type: 'maj7',   intervals: [0,4,7,11], nameKey: 'ear.ch.maj7' },
  { type: 'min7',   intervals: [0,3,7,10], nameKey: 'ear.ch.min7' },
  { type: 'dom7',   intervals: [0,4,7,10], nameKey: 'ear.ch.dom7' },
];

const DIFFICULTIES = {
  beginner:     { intervals: [0,3,4,5,7,12], chords: ['major','minor'] },
  intermediate: { intervals: [0,1,2,3,4,5,7,8,9,12], chords: ['major','minor','dim','dom7'] },
  advanced:     { intervals: INTERVALS.map((_,i)=>i), chords: CHORD_TYPES.map(c=>c.type) },
};

// ── Audio ─────────────────────────────────────────────────────────────────────
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function noteFreq(noteIdx) { return 261.63 * Math.pow(2, noteIdx / 12); }

function playNote(noteIdx, delay = 0, dur = 0.6) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = noteFreq(noteIdx);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.value = 0.12;
  const start = ctx.currentTime + delay;
  osc.start(start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.stop(start + dur);
}

function playChord(noteIdx, intervals, dur = 1) {
  intervals.forEach(s => playNote(noteIdx + s, 0, dur));
}

function playInterval(noteIdx, semitones) {
  playNote(noteIdx, 0, 0.6);
  playNote(noteIdx + semitones, 0.7, 0.6);
}

// ── State ─────────────────────────────────────────────────────────────────────
let state = {
  gameMode: 'intervals', // intervals | chords | notes
  difficulty: 'beginner',
  currentQuestion: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  total: 0,
  answered: false,
};

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function newQuestion(playImmediately = true) {
  const diff = DIFFICULTIES[state.difficulty];
  const rootIdx = randomInt(0, 11);
  state.answered = false;

  if (state.gameMode === 'intervals') {
    const pool = diff.intervals;
    const idx  = pool[randomInt(0, pool.length - 1)];
    const interval = INTERVALS[idx];
    state.currentQuestion = { type: 'interval', rootIdx, semitones: interval.semitones, answer: interval.nameKey };
    if (playImmediately) playInterval(rootIdx, interval.semitones);
  } else if (state.gameMode === 'chords') {
    const pool = CHORD_TYPES.filter(c => diff.chords.includes(c.type));
    const chord = pool[randomInt(0, pool.length - 1)];
    state.currentQuestion = { type: 'chord', rootIdx, chord, answer: chord.nameKey };
    if (playImmediately) playChord(rootIdx, chord.intervals);
  } else {
    state.currentQuestion = { type: 'note', rootIdx, answer: NOTES[rootIdx] };
    if (playImmediately) playNote(rootIdx, 0, 0.8);
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function EarTrainingPage() {
  const user = getUser(); const pro = isPro();
  if (!user || !pro) {
    return `
      <div class="page-header">
        <h1 class="page-header__title">${t('ear.title')}</h1>
        <p class="page-header__desc">${t('ear.desc')}</p>
      </div>
      <div class="cp-gate">
        <div class="cp-gate__icon"><i class="bi bi-lock-fill"></i></div><h2>${t('cp.proOnly')}</h2>
        <p>${t('cp.proOnlyDesc')}</p>
        <a href="#/pro" class="btn-upgrade btn-upgrade--best">${t('account.upgrade')}</a>
      </div>`;
  }

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('ear.title')}</h1>
      <p class="page-header__desc">${t('ear.desc')}</p>
    </div>
    <div class="ear-layout" id="earRoot">
      <div class="ear-controls">
        <div class="ear-control-group">
          <label>${t('ear.mode')}</label>
          <div class="ear-mode-row" id="earMode">
            <button class="ear-mode-btn active" data-mode="intervals"><i class="bi bi-music-note"></i> ${t('ear.intervals')}</button>
            <button class="ear-mode-btn" data-mode="chords"><i class="bi bi-music-note-beamed"></i> ${t('ear.chords')}</button>
            <button class="ear-mode-btn" data-mode="notes"><i class="bi bi-bullseye"></i> ${t('ear.notes')}</button>
          </div>
        </div>
        <div class="ear-control-group">
          <label>${t('ear.difficulty')}</label>
          <div class="ear-mode-row" id="earDiff">
            <button class="ear-mode-btn active" data-diff="beginner">${t('ear.beginner')}</button>
            <button class="ear-mode-btn" data-diff="intermediate">${t('ear.intermediate')}</button>
            <button class="ear-mode-btn" data-diff="advanced">${t('ear.advanced')}</button>
          </div>
        </div>
      </div>

      <div class="ear-stats">
        <div class="ear-stat"><span class="ear-stat__val" id="earScore">0</span><span>${t('ear.score')}</span></div>
        <div class="ear-stat"><span class="ear-stat__val" id="earStreak">0</span><span>${t('ear.streak')}</span></div>
        <div class="ear-stat"><span class="ear-stat__val" id="earBest">0</span><span>${t('ear.best')}</span></div>
      </div>

      <div class="ear-question" id="earQuestion">
        <button class="ear-play-btn" id="earPlayBtn"><i class="bi bi-play-fill"></i> ${t('ear.listen')}</button>
        <div class="ear-feedback" id="earFeedback"></div>
      </div>

      <div class="ear-answers" id="earAnswers"></div>
    </div>
  `;
}

export function onMount(container) {
  if (!getUser() || !isPro()) return;

  // Mode selection
  container.querySelector('#earMode')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-mode]');
    if (!btn) return;
    container.querySelectorAll('#earMode .ear-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.gameMode = btn.dataset.mode;
    state.score = 0; state.streak = 0; state.total = 0;
    updateStats(container);
    startRound(container, false); // Don't play on mode switch
  });

  // Difficulty
  container.querySelector('#earDiff')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-diff]');
    if (!btn) return;
    container.querySelectorAll('#earDiff .ear-mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.difficulty = btn.dataset.diff;
    startRound(container, false); // Don't play on diff switch
  });

  // Replay
  container.querySelector('#earPlayBtn')?.addEventListener('click', () => {
    if (!state.currentQuestion) { startRound(container); return; }
    const q = state.currentQuestion;
    if (q.type === 'interval') playInterval(q.rootIdx, q.semitones);
    else if (q.type === 'chord') playChord(q.rootIdx, q.chord.intervals);
    else playNote(q.rootIdx, 0, 0.8);
  });

  startRound(container, false); // Initial load: don't play
}

function startRound(container, playImmediately = true) {
  newQuestion(playImmediately);
  renderAnswers(container);
  container.querySelector('#earFeedback').innerHTML = '';
}

function renderAnswers(container) {
  const el = container.querySelector('#earAnswers');
  if (!el) return;
  const diff = DIFFICULTIES[state.difficulty];

  let buttons = '';
  if (state.gameMode === 'intervals') {
    buttons = diff.intervals.map(i => {
      const int = INTERVALS[i];
      return `<button class="ear-answer-btn" data-answer="${int.nameKey}">${t(int.nameKey)}</button>`;
    }).join('');
  } else if (state.gameMode === 'chords') {
    buttons = CHORD_TYPES.filter(c => diff.chords.includes(c.type))
      .map(c => `<button class="ear-answer-btn" data-answer="${c.nameKey}">${t(c.nameKey)}</button>`)
      .join('');
  } else {
    buttons = NOTES.map(n => {
      const display = NOTE_DISPLAY[n] || n;
      return `<button class="ear-answer-btn" data-answer="${n}">${display}</button>`;
    }).join('');
  }
  el.innerHTML = buttons;

  el.querySelectorAll('.ear-answer-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(container, btn));
  });
}

function handleAnswer(container, btn) {
  if (state.answered) return;
  state.answered = true;
  state.total++;
  const correct = btn.dataset.answer === state.currentQuestion.answer;

  if (correct) {
    state.score++;
    state.streak++;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    btn.classList.add('correct');
    container.querySelector('#earFeedback').innerHTML = `<span class="ear-correct"><i class="bi bi-check-lg"></i> ${t('ear.correct')}</span>`;
  } else {
    state.streak = 0;
    btn.classList.add('wrong');
    // Highlight correct answer
    container.querySelectorAll('.ear-answer-btn').forEach(b => {
      if (b.dataset.answer === state.currentQuestion.answer) b.classList.add('correct');
    });
    const correctLabel = state.gameMode === 'notes'
      ? state.currentQuestion.answer
      : t(state.currentQuestion.answer);
    container.querySelector('#earFeedback').innerHTML =
      `<span class="ear-wrong"><i class="bi bi-x-lg"></i> ${correctLabel}</span>`;
  }

  updateStats(container);
  setTimeout(() => startRound(container, true), 1500); // Play automatically after guessing
}

function updateStats(container) {
  const s = container.querySelector('#earScore');
  const k = container.querySelector('#earStreak');
  const b = container.querySelector('#earBest');
  if (s) s.textContent = state.score;
  if (k) k.textContent = state.streak;
  if (b) b.textContent = state.bestStreak;
}

export function onDestroy() { state.currentQuestion = null; }
