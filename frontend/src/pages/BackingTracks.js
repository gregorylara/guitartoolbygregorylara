/**
 * BackingTracks.js — PRO: Backing Tracks
 * Pre-generated backing tracks for practice / improvisation.
 * Uses Web Audio API to synthesize chord progressions as backing tracks.
 */
import { t } from '../lib/i18n.js';
import { getUser } from '../lib/auth.js';
import { isPro } from '../lib/subscription.js';

// ── Track library ─────────────────────────────────────────────────────────────
const TRACKS = [
  {
    id: 'blues-a', style: 'blues', nameKey: 'bt.track.bluesA',
    key: 'A', bpm: 80,
    progression: ['A','A','A','A','D','D','A','A','E','D','A','E'],
    scale: 'A Minor Pentatonic',
    scaleKey: 'bt.scale.aminpent',
  },
  {
    id: 'blues-e', style: 'blues', nameKey: 'bt.track.bluesE',
    key: 'E', bpm: 100,
    progression: ['E','E','E','E','A','A','E','E','B','A','E','B'],
    scale: 'E Minor Pentatonic',
    scaleKey: 'bt.scale.eminpent',
  },
  {
    id: 'jazz-ii-v-i', style: 'jazz', nameKey: 'bt.track.jazz251',
    key: 'C', bpm: 120,
    progression: ['Dm','G','C','C'],
    scale: 'C Major / D Dorian',
    scaleKey: 'bt.scale.cmaj',
  },
  {
    id: 'jazz-1625', style: 'jazz', nameKey: 'bt.track.jazz1625',
    key: 'C', bpm: 110,
    progression: ['C','Am','Dm','G'],
    scale: 'C Major',
    scaleKey: 'bt.scale.cmaj2',
  },
  {
    id: 'rock-power', style: 'rock', nameKey: 'bt.track.rockPower',
    key: 'E', bpm: 130,
    progression: ['E','G','A','E'],
    scale: 'E Minor Pentatonic',
    scaleKey: 'bt.scale.eminpent2',
  },
  {
    id: 'rock-classic', style: 'rock', nameKey: 'bt.track.rockClassic',
    key: 'A', bpm: 120,
    progression: ['A','D','E','A'],
    scale: 'A Major Pentatonic',
    scaleKey: 'bt.scale.amajpent',
  },
  {
    id: 'pop-4chords', style: 'pop', nameKey: 'bt.track.pop4',
    key: 'G', bpm: 100,
    progression: ['G','D','Em','C'],
    scale: 'G Major',
    scaleKey: 'bt.scale.gmaj',
  },
  {
    id: 'pop-ballad', style: 'pop', nameKey: 'bt.track.popBallad',
    key: 'C', bpm: 72,
    progression: ['C','G','Am','F'],
    scale: 'C Major',
    scaleKey: 'bt.scale.cmaj3',
  },
  {
    id: 'funk-groove', style: 'funk', nameKey: 'bt.track.funkGroove',
    key: 'E', bpm: 105,
    progression: ['E','A','E','A'],
    scale: 'E Mixolydian',
    scaleKey: 'bt.scale.emixo',
  },
];

const STYLES = ['blues','jazz','rock','pop','funk'];
const STYLE_ICONS = { 
  blues: '<i class="bi bi-guitar"></i>', 
  jazz: '<i class="bi bi-music-note-list"></i>', 
  rock: '<i class="bi bi-lightning-fill"></i>', 
  pop: '<i class="bi bi-mic-fill"></i>', 
  funk: '<i class="bi bi-speaker-fill"></i>' 
};

// ── Audio engine ──────────────────────────────────────────────────────────────
const NOTES_MAP = { C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11 };
const CHORD_INTERVALS = {
  major: [0,4,7], minor: [0,3,7], dom7: [0,4,7,10], min7: [0,3,7,10],
  dim: [0,3,6], maj7: [0,4,7,11], sus4: [0,5,7],
};

function parseChord(name) {
  let root, quality;
  if (name.length >= 2 && (name[1] === '#' || name[1] === 'b')) {
    root = name.slice(0, 2);
    quality = name.slice(2) || 'major';
  } else {
    root = name[0];
    quality = name.slice(1) || 'major';
  }
  if (quality === 'm') quality = 'minor';
  if (quality === '7') quality = 'dom7';
  if (quality === 'm7') quality = 'min7';
  return { root, quality };
}

let audioCtx = null;
let playerState = { playing: false, intervalId: null, trackId: null, loop: true, volume: 0.5, beatIdx: 0 };

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playChordSound(chordName, dur = 0.5) {
  const ctx = getCtx();
  const { root, quality } = parseChord(chordName);
  const rootNote = NOTES_MAP[root] ?? 0;
  const baseFreq = 130.81 * Math.pow(2, rootNote / 12); // C3 base
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS.major;

  intervals.forEach(semitone => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = baseFreq * Math.pow(2, semitone / 12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = playerState.volume * 0.06;
    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.setValueAtTime(playerState.volume * 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.95);
    osc.stop(now + dur);
  });
}

function startPlayback(track, container) {
  stopPlayback();
  playerState.playing = true;
  playerState.trackId = track.id;
  playerState.beatIdx = 0;

  const beatDur = 60 / track.bpm; // seconds per beat
  const prog = track.progression;

  const playBeat = () => {
    if (!playerState.playing) return;
    const chordIdx = playerState.beatIdx % prog.length;
    playChordSound(prog[chordIdx], beatDur * 0.9);

    // Highlight current chord
    const pills = container.querySelectorAll(`[data-track-id="${track.id}"] .bt-prog-pill`);
    pills.forEach((p, i) => p.classList.toggle('active', i === chordIdx));

    playerState.beatIdx++;
    if (playerState.beatIdx >= prog.length && !playerState.loop) {
      stopPlayback();
      updatePlayButtons(container);
    }
  };

  playBeat();
  playerState.intervalId = setInterval(playBeat, beatDur * 1000);
  updatePlayButtons(container);
}

function stopPlayback() {
  playerState.playing = false;
  if (playerState.intervalId) clearInterval(playerState.intervalId);
  playerState.intervalId = null;
  playerState.trackId = null;
}

function updatePlayButtons(container) {
  container.querySelectorAll('.bt-play-btn').forEach(btn => {
    const id = btn.closest('[data-track-id]')?.dataset.trackId;
    btn.innerHTML = (playerState.playing && playerState.trackId === id) 
      ? '<i class="bi bi-stop-fill"></i>' 
      : '<i class="bi bi-play-fill"></i>';
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function BackingTracksPage() {
  const user = getUser(); const pro = isPro();
  if (!user || !pro) {
    return `
      <div class="page-header">
        <h1 class="page-header__title">${t('bt.title')}</h1>
        <p class="page-header__desc">${t('bt.desc')}</p>
      </div>
      <div class="cp-gate">
        <div class="cp-gate__icon"><i class="bi bi-lock-fill"></i></div><h2>${t('cp.proOnly')}</h2>
        <p>${t('cp.proOnlyDesc')}</p>
        <a href="#/pro" class="btn-upgrade btn-upgrade--best">${t('account.upgrade')}</a>
      </div>`;
  }

  const styleTabs = STYLES.map(s =>
    `<button class="bt-style-tab${s==='blues'?' active':''}" data-style="${s}">
      ${STYLE_ICONS[s]} ${t('bt.style.' + s)}
    </button>`
  ).join('');

  const trackCards = TRACKS.map(tr => {
    const progPills = tr.progression.map(c =>
      `<span class="bt-prog-pill">${c}</span>`
    ).join('');
    return `
      <div class="bt-card" data-track-id="${tr.id}" data-style="${tr.style}">
        <div class="bt-card__header">
          <h3>${t(tr.nameKey)}</h3>
          <span class="bt-card__meta">${tr.key} · ${tr.bpm} BPM</span>
        </div>
        <div class="bt-card__prog">${progPills}</div>
        <div class="bt-card__scale">
          <span class="bt-card__scale-label"><i class="bi bi-music-note"></i> ${t('bt.recommendedScale')}:</span>
          <span class="bt-card__scale-name">${t(tr.scaleKey)}</span>
        </div>
        <div class="bt-card__controls">
          <button class="bt-play-btn"><i class="bi bi-play-fill"></i></button>
          <button class="bt-loop-btn ${playerState.loop?'active':''}" title="Loop"><i class="bi bi-arrow-repeat"></i></button>
          <input type="range" class="bt-vol" min="0" max="100" value="${playerState.volume*100}" title="Volume">
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('bt.title')}</h1>
      <p class="page-header__desc">${t('bt.desc')}</p>
    </div>
    <div class="bt-layout" id="btRoot">
      <div class="bt-style-row" id="btStyles">${styleTabs}</div>
      <div class="bt-grid" id="btGrid">${trackCards}</div>
    </div>
  `;
}

export function onMount(container) {
  if (!getUser() || !isPro()) return;

  filterTracks(container, 'blues');

  // Style filter
  container.querySelector('#btStyles')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-style]');
    if (!btn) return;
    
    // Stop currently playing track when switching styles
    if (playerState.playing) {
      stopPlayback();
      updatePlayButtons(container);
      container.querySelectorAll('.bt-prog-pill').forEach(p => p.classList.remove('active'));
    }

    container.querySelectorAll('.bt-style-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterTracks(container, btn.dataset.style);
  });

  // Play/stop
  container.querySelector('#btGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.bt-play-btn');
    if (!btn) return;
    const card = btn.closest('[data-track-id]');
    const trackId = card.dataset.trackId;
    const track = TRACKS.find(t => t.id === trackId);

    if (playerState.playing && playerState.trackId === trackId) {
      stopPlayback();
      updatePlayButtons(container);
      card.querySelectorAll('.bt-prog-pill').forEach(p => p.classList.remove('active'));
    } else {
      startPlayback(track, container);
    }
  });

  // Loop toggle
  container.querySelector('#btGrid')?.addEventListener('click', e => {
    const btn = e.target.closest('.bt-loop-btn');
    if (!btn) return;
    playerState.loop = !playerState.loop;
    btn.classList.toggle('active', playerState.loop);
  });

  // Volume
  container.querySelector('#btGrid')?.addEventListener('input', e => {
    if (e.target.classList.contains('bt-vol')) {
      playerState.volume = parseInt(e.target.value) / 100;
    }
  });
}

function filterTracks(container, style) {
  container.querySelectorAll('.bt-card').forEach(card => {
    card.style.display = card.dataset.style === style ? '' : 'none';
  });
}

export function onDestroy() { stopPlayback(); }
