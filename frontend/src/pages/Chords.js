/**
 * Chords — Interactive chord library with SVG fretboard diagrams. i18n-aware.
 */
import { t } from '../lib/i18n.js';


// ── Chord Data ────────────────────────────────────────────────────────────────
// Each chord: { name, fullName, category, frets, fingers, barres, startFret, muted, open }
// frets  : array of 6 numbers (strings E-A-D-G-B-e), -1 = muted, 0 = open
// fingers: array of 6 numbers (0 = no finger)
// barres : [{ fret, from, to }]
// startFret: fret number shown at top of the diagram

const CHORDS = [
  // ── Major ─────────────────────────────────────────────────────────────────
  {
    name: 'C',    fullName: 'C Major',  category: 'major',
    frets:   [-1, 3, 2, 0, 1, 0],
    fingers: [ 0, 3, 2, 0, 1, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'D',    fullName: 'D Major',  category: 'major',
    frets:   [-1, -1, 0, 2, 3, 2],
    fingers: [ 0,  0, 0, 1, 3, 2],
    barres: [], startFret: 1,
  },
  {
    name: 'E',    fullName: 'E Major',  category: 'major',
    frets:   [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'F',    fullName: 'F Major',  category: 'major',
    frets:   [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barres: [{ fret: 1, from: 0, to: 5 }], startFret: 1,
  },
  {
    name: 'G',    fullName: 'G Major',  category: 'major',
    frets:   [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    barres: [], startFret: 1,
  },
  {
    name: 'A',    fullName: 'A Major',  category: 'major',
    frets:   [-1, 0, 2, 2, 2, 0],
    fingers: [ 0, 0, 1, 2, 3, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'B',    fullName: 'B Major',  category: 'major',
    frets:   [-1, 2, 4, 4, 4, 2],
    fingers: [ 0, 1, 2, 3, 4, 1],
    barres: [{ fret: 2, from: 1, to: 4 }], startFret: 1,
  },
  // ── Minor ──────────────────────────────────────────────────────────────────
  {
    name: 'Am',   fullName: 'A Minor',  category: 'minor',
    frets:   [-1, 0, 2, 2, 1, 0],
    fingers: [ 0, 0, 2, 3, 1, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Bm',   fullName: 'B Minor',  category: 'minor',
    frets:   [-1, 2, 4, 4, 3, 2],
    fingers: [ 0, 1, 3, 4, 2, 1],
    barres: [{ fret: 2, from: 1, to: 5 }], startFret: 1,
  },
  {
    name: 'Dm',   fullName: 'D Minor',  category: 'minor',
    frets:   [-1, -1, 0, 2, 3, 1],
    fingers: [ 0,  0, 0, 2, 3, 1],
    barres: [], startFret: 1,
  },
  {
    name: 'Em',   fullName: 'E Minor',  category: 'minor',
    frets:   [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Gm',   fullName: 'G Minor',  category: 'minor',
    frets:   [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    barres: [{ fret: 3, from: 0, to: 5 }], startFret: 3,
  },
  // ── 7th ───────────────────────────────────────────────────────────────────
  {
    name: 'G7',   fullName: 'G Dominant 7', category: 'seventh',
    frets:   [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    barres: [], startFret: 1,
  },
  {
    name: 'D7',   fullName: 'D Dominant 7', category: 'seventh',
    frets:   [-1, -1, 0, 2, 1, 2],
    fingers: [ 0,  0, 0, 3, 1, 2],
    barres: [], startFret: 1,
  },
  {
    name: 'A7',   fullName: 'A Dominant 7', category: 'seventh',
    frets:   [-1, 0, 2, 0, 2, 0],
    fingers: [ 0, 0, 2, 0, 3, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'E7',   fullName: 'E Dominant 7', category: 'seventh',
    frets:   [0, 2, 0, 1, 0, 0],
    fingers: [0, 2, 0, 1, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'B7',   fullName: 'B Dominant 7', category: 'seventh',
    frets:   [-1, 2, 1, 2, 0, 2],
    fingers: [ 0, 2, 1, 3, 0, 4],
    barres: [], startFret: 1,
  },
  {
    name: 'C7',   fullName: 'C Dominant 7', category: 'seventh',
    frets:   [-1, 3, 2, 3, 1, 0],
    fingers: [ 0, 3, 2, 4, 1, 0],
    barres: [], startFret: 1,
  },
  // ── Minor 7th ─────────────────────────────────────────────────────────────
  {
    name: 'Am7',  fullName: 'A Minor 7', category: 'minor7',
    frets:   [-1, 0, 2, 0, 1, 0],
    fingers: [ 0, 0, 2, 0, 1, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Em7',  fullName: 'E Minor 7', category: 'minor7',
    frets:   [0, 2, 0, 0, 0, 0],
    fingers: [0, 2, 0, 0, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Dm7',  fullName: 'D Minor 7', category: 'minor7',
    frets:   [-1, -1, 0, 2, 1, 1],
    fingers: [ 0,  0, 0, 3, 1, 1],
    barres: [{ fret: 1, from: 4, to: 5 }], startFret: 1,
  },
  {
    name: 'Bm7',  fullName: 'B Minor 7', category: 'minor7',
    frets:   [-1, 2, 0, 2, 0, 2],
    fingers: [ 0, 1, 0, 2, 0, 3],
    barres: [], startFret: 1,
  },
  // ── Add 9 ─────────────────────────────────────────────────────────────────
  {
    name: 'Cadd9', fullName: 'C Add 9', category: 'add',
    frets:   [-1, 3, 2, 0, 3, 3],
    fingers: [ 0, 3, 2, 0, 1, 1],
    barres: [{ fret: 3, from: 4, to: 5 }], startFret: 1,
  },
  {
    name: 'Gadd9', fullName: 'G Add 9', category: 'add',
    frets:   [3, 2, 0, 2, 0, 3],
    fingers: [2, 1, 0, 3, 0, 4],
    barres: [], startFret: 1,
  },
  {
    name: 'Dadd9', fullName: 'D Add 9', category: 'add',
    frets:   [-1, -1, 0, 4, 3, 0],
    fingers: [ 0,  0, 0, 4, 3, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Aadd9', fullName: 'A Add 9', category: 'add',
    frets:   [-1, 0, 2, 4, 2, 0],
    fingers: [ 0, 0, 1, 4, 2, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Eadd9', fullName: 'E Add 9', category: 'add',
    frets:   [0, 2, 2, 1, 2, 0],
    fingers: [0, 2, 3, 1, 4, 0],
    barres: [], startFret: 1,
  },
  // ── Sus ───────────────────────────────────────────────────────────────────
  {
    name: 'Dsus2', fullName: 'D Sus 2', category: 'sus',
    frets:   [-1, -1, 0, 2, 3, 0],
    fingers: [ 0,  0, 0, 1, 3, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Asus2', fullName: 'A Sus 2', category: 'sus',
    frets:   [-1, 0, 2, 2, 0, 0],
    fingers: [ 0, 0, 2, 3, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Esus2', fullName: 'E Sus 2', category: 'sus',
    frets:   [0, 2, 4, 4, 2, 0],
    fingers: [0, 1, 3, 4, 2, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Dsus4', fullName: 'D Sus 4', category: 'sus',
    frets:   [-1, -1, 0, 2, 3, 3],
    fingers: [ 0,  0, 0, 1, 3, 4],
    barres: [], startFret: 1,
  },
  {
    name: 'Asus4', fullName: 'A Sus 4', category: 'sus',
    frets:   [-1, 0, 2, 2, 3, 0],
    fingers: [ 0, 0, 2, 3, 4, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Esus4', fullName: 'E Sus 4', category: 'sus',
    frets:   [0, 2, 2, 2, 0, 0],
    fingers: [0, 1, 2, 3, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Gsus4', fullName: 'G Sus 4', category: 'sus',
    frets:   [3, 3, 0, 0, 1, 3],
    fingers: [3, 4, 0, 0, 1, 3],
    barres: [], startFret: 1,
  },
  // ── Major 7th ─────────────────────────────────────────────────────────────
  {
    name: 'Cmaj7', fullName: 'C Major 7', category: 'maj7',
    frets:   [-1, 3, 2, 0, 0, 0],
    fingers: [ 0, 3, 2, 0, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Dmaj7', fullName: 'D Major 7', category: 'maj7',
    frets:   [-1, -1, 0, 2, 2, 2],
    fingers: [ 0,  0, 0, 1, 2, 3],
    barres: [], startFret: 1,
  },
  {
    name: 'Emaj7', fullName: 'E Major 7', category: 'maj7',
    frets:   [0, 2, 1, 1, 0, 0],
    fingers: [0, 3, 1, 2, 0, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Fmaj7', fullName: 'F Major 7', category: 'maj7',
    frets:   [-1, -1, 3, 2, 1, 0],
    fingers: [ 0,  0, 3, 2, 1, 0],
    barres: [], startFret: 1,
  },
  {
    name: 'Gmaj7', fullName: 'G Major 7', category: 'maj7',
    frets:   [3, 2, 0, 0, 0, 2],
    fingers: [3, 2, 0, 0, 0, 1],
    barres: [], startFret: 1,
  },
  {
    name: 'Amaj7', fullName: 'A Major 7', category: 'maj7',
    frets:   [-1, 0, 2, 1, 2, 0],
    fingers: [ 0, 0, 3, 1, 4, 0],
    barres: [], startFret: 1,
  },
];

const CATEGORIES = [
  { id: 'all',    labelKey: 'chords.cat.all' },
  { id: 'major',  labelKey: 'chords.cat.major' },
  { id: 'minor',  labelKey: 'chords.cat.minor' },
  { id: 'seventh',labelKey: 'chords.cat.seventh' },
  { id: 'minor7', labelKey: 'chords.cat.minor7' },
  { id: 'maj7',   labelKey: 'chords.cat.maj7' },
  { id: 'add',    labelKey: 'chords.cat.add' },
  { id: 'sus',    labelKey: 'chords.cat.sus' },
];

// ── SVG Diagram Renderer ───────────────────────────────────────────────────
function buildSVG(chord) {
  const W = 120, H = 150;
  const padLeft = 20, padTop = 30;
  const fretCount = 5;
  const stringCount = 6;
  const fretW = (W - padLeft - 14) / (stringCount - 1);   // horizontal spacing
  const fretH = (H - padTop - 20) / fretCount;            // vertical spacing

  const strings = [padLeft, padLeft + fretW, padLeft + 2*fretW,
                   padLeft + 3*fretW, padLeft + 4*fretW, padLeft + 5*fretW];

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
    class="chord-svg" aria-label="${chord.fullName} chord diagram">`;

  // Nut or start-fret indicator
  if (chord.startFret === 1) {
    svg += `<rect x="${padLeft}" y="${padTop}" width="${5*fretW}" height="3" rx="1.5" fill="var(--text-primary)" opacity="0.85"/>`;
  } else {
    svg += `<text x="${padLeft - 5}" y="${padTop + fretH * 0.65}" text-anchor="end"
      fill="var(--text-muted)" font-size="9" font-family="var(--font-family)">${chord.startFret}fr</text>`;
  }

  // Fret lines
  for (let f = 0; f <= fretCount; f++) {
    const y = padTop + f * fretH + (chord.startFret === 1 ? 3 : 0);
    svg += `<line x1="${padLeft}" y1="${y}" x2="${padLeft + 5*fretW}" y2="${y}"
      stroke="var(--border-default)" stroke-width="1"/>`;
  }

  // String lines
  strings.forEach(x => {
    svg += `<line x1="${x}" y1="${padTop + (chord.startFret === 1 ? 3 : 0)}"
      x2="${x}" y2="${padTop + fretCount * fretH + (chord.startFret === 1 ? 3 : 0)}"
      stroke="var(--border-hover)" stroke-width="1.2"/>`;
  });

  // Barre lines
  chord.barres.forEach(b => {
    const y = padTop + (b.fret - chord.startFret + 0.5) * fretH + (chord.startFret === 1 ? 3 : 0);
    const x1 = strings[b.from];
    const x2 = strings[b.to];
    svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"
      stroke="var(--accent-primary)" stroke-width="${fretH * 0.55}" stroke-linecap="round" opacity="0.9"/>`;
  });

  // Finger dots
  chord.frets.forEach((fret, i) => {
    const x = strings[i];
    const topY = padTop + (chord.startFret === 1 ? 3 : 0);
    if (fret > 0) {
      const y = topY + (fret - chord.startFret + 0.5) * fretH;
      svg += `<circle cx="${x}" cy="${y}" r="${fretH * 0.28}"
        fill="var(--accent-primary)"/>`;
      if (chord.fingers[i] > 0) {
        svg += `<text x="${x}" y="${y + 3.5}" text-anchor="middle"
          font-size="7" fill="#fff" font-family="var(--font-family)">${chord.fingers[i]}</text>`;
      }
    } else if (fret === 0) {
      // Open string — small circle above nut
      svg += `<circle cx="${x}" cy="${padTop - 9}" r="5"
        fill="none" stroke="var(--accent-primary)" stroke-width="1.5"/>`;
    } else {
      // Muted string — ×
      svg += `<text x="${x}" y="${padTop - 4}" text-anchor="middle"
        font-size="11" fill="var(--text-muted)" font-family="var(--font-family)">×</text>`;
    }
  });

  svg += '</svg>';
  return svg;
}

// ── Card HTML ─────────────────────────────────────────────────────────────────
function chordCard(chord) {
  return `
    <div class="chord-card" data-category="${chord.category}">
      <div class="chord-card__diagram">
        ${buildSVG(chord)}
      </div>
      <div class="chord-card__info">
        <span class="chord-card__name">${chord.name}</span>
        <span class="chord-card__full">${chord.fullName}</span>
      </div>
    </div>
  `;
}

// ── Page export ───────────────────────────────────────────────────────────────
export function ChordsPage() {
  const tabs = CATEGORIES.map(cat => `
    <button class="chord-tab${cat.id === 'all' ? ' active' : ''}"
      data-cat="${cat.id}">${t(cat.labelKey)}</button>
  `).join('');

  const cards = CHORDS.map(c => chordCard(c)).join('');

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('chords.title')}</h1>
      <p class="page-header__desc">${t('chords.desc')}</p>
    </div>

    <div class="chord-filters">
      ${tabs}
    </div>

    <div class="chord-grid" id="chordGrid">
      ${cards}
    </div>
  `;
}

// ── Mount: filter logic ───────────────────────────────────────────────────────
export function onMount(container) {
  const tabs  = container.querySelectorAll('.chord-tab');
  const cards = container.querySelectorAll('.chord-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.cat;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      cards.forEach(card => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.style.display = match ? '' : 'none';
        if (match) {
          card.classList.remove('chord-card--hidden');
          card.classList.add('chord-card--visible');
        } else {
          card.classList.add('chord-card--hidden');
          card.classList.remove('chord-card--visible');
        }
      });
    });
  });
}
