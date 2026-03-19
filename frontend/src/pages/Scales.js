/**
 * Scales — Scale Explorer. i18n-aware.
 */
import { t } from '../lib/i18n.js';


// ── Scale Data ─────────────────────────────────────────────────────────────────
// intervals: semitones from root, shown relative (R=root, 2=step, etc.)
// pattern  : 6-string array of fret offsets from root; -1 = don't play
// root     : 0-indexed fret of the root on low-E string
// Each scale has a text explanation for educational context.

const SCALE_CATEGORIES = [
  {
    id: 'fundamental',
    label: '🎵 Fundamentales',
    description: 'Las escalas fundamentales son la base de toda la música occidental. Dominarlas te da acceso a la mayoría de canciones populares, rock y pop.',
    scales: [
      {
        id: 'major',
        name: 'Mayor (Jónica)',
        intervals: 'R – 2 – 3 – 4 – 5 – 6 – 7',
        formula: 'T T S T T T S',
        notes: 'Do Re Mi Fa Sol La Si',
        color: '#0066ff',
        desc: 'La escala mayor es la más conocida. Suena alegre, brillante y es la base de la armonía clásica y pop. El patrón de 5 posiciones cubre todo el mástil.',
        positions: [
          {
            label: 'Posición 1 (CAGED E)',
            frets: [
              [0, 0, 0, 0, 0, 0],   // strings 1-6 (E low to e high): open positions relative
              // encoded as string markers per string (low E first)
            ],
            // Simplified pattern: dots array [{string, fret}] relative to root fret 5
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:4},{s:2,f:5},{s:2,f:7},
              {s:3,f:4},{s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:7},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:2,f:7},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'minor',
        name: 'Menor Natural (Eólica)',
        intervals: 'R – 2 – ♭3 – 4 – 5 – ♭6 – ♭7',
        formula: 'T S T T S T T',
        notes: 'La Si Do Re Mi Fa Sol',
        color: '#7744ff',
        desc: 'La escala menor natural suena oscura y melancólica. Es fundamental para el rock, metal y música clásica. Comparte las mismas notas que su relativa mayor.',
        positions: [
          {
            label: 'Posición 1 (CAGED A)',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:6},{s:3,f:8},
              {s:4,f:5},{s:4,f:7},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:3,f:8},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'pent',
        name: 'Pentatónica Mayor',
        intervals: 'R – 2 – 3 – 5 – 6',
        formula: 'T T MT S MT',
        notes: 'Do Re Mi Sol La',
        color: '#00aaff',
        desc: '5 notas que suenan bien casi siempre. Es la primera escala que debes aprender para improvisar en rock, country y pop. Sin semitonos = nunca suena mal.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:4},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:7},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
    ],
  },

  {
    id: 'blues',
    label: '🎸 Blues',
    description: 'Las escalas de blues son la esencia del rock, soul y R&B. Se derivan de la pentatónica pero con "blue notes" que añaden tensión y expresividad característica.',
    scales: [
      {
        id: 'minpent',
        name: 'Pentatónica Menor',
        intervals: 'R – ♭3 – 4 – 5 – ♭7',
        formula: 'MT T T MT T',
        notes: 'La Do Re Mi Sol',
        color: '#ff6600',
        desc: 'La escala más usada en rock y blues. Suena cruda y emocional. Con solo 5 notas en 2 trastes por cuerda es muy fácil de memorizar y trasladar por el mástil.',
        positions: [
          {
            label: 'Posición 1 (Caja)',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:8},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:8},
              {s:5,f:5},{s:5,f:8},
            ],
            roots: [{s:0,f:5},{s:3,f:7},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'hex',
        name: 'Blues (Hexatónica)',
        intervals: 'R – ♭3 – 4 – ♭5 – 5 – ♭7',
        formula: 'MT T S S MT T',
        notes: 'La Do Re Mi♭ Mi Sol',
        color: '#ff4400',
        desc: 'La "blue note" (♭5) es el ingrediente secreto del blues. Esa nota choca contra la tonalidad creando tensión que pide resolución. Hendrix, SRV y BB King la usaban constantemente.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:8},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:5},{s:2,f:6},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:8},
              {s:5,f:5},{s:5,f:8},
            ],
            roots: [{s:0,f:5},{s:3,f:7},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'maj',
        name: 'Mayor de Blues',
        intervals: 'R – 2 – ♭3 – 3 – 5 – 6',
        formula: 'T S S MT T MT',
        notes: 'Do Re Mi♭ Mi Sol La',
        color: '#ff8800',
        desc: 'Versión mayor del blues. Más brillante que la menor pero igualmente expresiva. Muy usada en country-blues y rock clásico (Chuck Berry). La combinación de ♭3 y 3 es su sello distintivo.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:6},{s:1,f:7},
              {s:2,f:4},{s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:7},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
    ],
  },

  {
    id: 'jazz',
    label: '🎷 Jazz',
    description: 'Las escalas de jazz añaden tensiones y colores más sofisticados. Requieren más práctica pero abren un mundo de posibilidades armónicas. Usadas en jazz, fusion y R&B moderno.',
    scales: [
      {
        id: 'melmin',
        name: 'Menor Melódica',
        intervals: 'R – 2 – ♭3 – 4 – 5 – 6 – 7',
        formula: 'T S T T T T S',
        notes: 'La Si Do Re Mi Fa# Sol#',
        color: '#00cc88',
        desc: 'Base del jazz moderno. Combinación de menor natural (abajo) con mayor (arriba). Sus modos — Lidio dominante, Alterado, Locrio #2 — son esenciales para improvisar sobre acordes de 7ª.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:5},{s:2,f:6},{s:2,f:8},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:6},{s:4,f:7},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'mixo',
        name: 'Dominante Mixolidia',
        intervals: 'R – 2 – 3 – 4 – 5 – 6 – ♭7',
        formula: 'T T S T T S T',
        notes: 'Sol La Si Do Re Mi Fa',
        color: '#00ddaa',
        desc: 'Mayor con el séptimo bemol. Suena "bluesy-jazz". Se usa sobre acordes de dominante 7 (G7, C7…). Esencial en blues, funk, jazz y gospel. Eric Clapton y Carlos Santana la usan mucho.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:4},{s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:6},{s:4,f:8},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'dim',
        name: 'Disminuida (Semi-Tono/Tono)',
        intervals: 'R – ♭2 – ♭3 – 3 – ♭5 – 5 – 6 – ♭7',
        formula: 'S T S T S T S T',
        notes: '8 notas simétricas',
        color: '#aa44ff',
        desc: 'Escala de 8 notas totalmente simétrica — se repite cada 3 trastes. Suena muy tensa y disonante. Se usa sobre acordes disminuidos y dominantes alterados (7♭9). Muy frecuente en jazz bebop.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:6},{s:0,f:8},{s:0,f:9},
              {s:1,f:5},{s:1,f:6},{s:1,f:8},{s:1,f:9},
              {s:2,f:4},{s:2,f:5},{s:2,f:7},{s:2,f:8},
              {s:3,f:5},{s:3,f:6},{s:3,f:8},{s:3,f:9},
              {s:4,f:5},{s:4,f:6},{s:4,f:8},{s:4,f:9},
              {s:5,f:5},{s:5,f:6},{s:5,f:8},{s:5,f:9},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
    ],
  },

  {
    id: 'modal',
    label: '🌊 Modos',
    description: 'Los 7 modos griegos son rotaciones de la escala mayor. Cada modo tiene un carácter sonoro distinto. Dominarlos te da un vocabulario enorme para cualquier estilo musical.',
    scales: [
      {
        id: 'dorian',
        name: 'Dórico',
        intervals: 'R – 2 – ♭3 – 4 – 5 – 6 – ♭7',
        formula: 'T S T T T S T',
        notes: 'Re Mi Fa Sol La Si Do',
        color: '#66ccff',
        desc: 'Menor con el 6º natural. Suena oscura pero no tan pesada como la eólica. Es el modo del jazz-fusion, funk y rock progresivo. "Oye Como Va" (Santana) y "So What" (Miles Davis) son ejemplos icónicos.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},{s:3,f:9},
              {s:4,f:5},{s:4,f:7},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'phrygian',
        name: 'Frigio',
        intervals: 'R – ♭2 – ♭3 – 4 – 5 – ♭6 – ♭7',
        formula: 'S T T T S T T',
        notes: 'Mi Fa Sol La Si Do Re',
        color: '#ff6688',
        desc: 'El modo más oscuro y exótico de los básicos. La ♭2 crea un sonido flameco y árabe inconfundible. Es la base del metal extremo, flamenco y música española. Phrygian dominant (con 3ª mayor) es su variante más popular.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:6},{s:0,f:8},
              {s:1,f:5},{s:1,f:7},{s:1,f:8},
              {s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:6},{s:4,f:8},
              {s:5,f:5},{s:5,f:6},{s:5,f:8},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'lydian',
        name: 'Lidio',
        intervals: 'R – 2 – 3 – ♯4 – 5 – 6 – 7',
        formula: 'T T T S T T S',
        notes: 'Fa Sol La Si Do Re Mi',
        color: '#ffcc00',
        desc: 'Mayor con el 4º aumentado. Suena etéreo, flotante y mágico. Favorito de Joe Satriani y Steve Vai. John Williams lo usa en bandas sonoras (E.T., Star Wars). Muy efectivo sobre acordes maj7#11.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},
              {s:1,f:5},{s:1,f:7},
              {s:2,f:4},{s:2,f:6},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:7},
              {s:5,f:5},{s:5,f:7},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
    ],
  },

  {
    id: 'world',
    label: '🌍 World / Exóticas',
    description: 'Escalas de distintas tradiciones musicales del mundo. Añaden colorido y carácter único a tu música, muy usadas en flamenco, música árabe, japonesa y étnica.',
    scales: [
      {
        id: 'phrygdom',
        name: 'Frigio Dominante (Español)',
        intervals: 'R – ♭2 – 3 – 4 – 5 – ♭6 – ♭7',
        formula: 'S MT S T S T T',
        notes: 'Mi Fa Sol# La Si Do Re',
        color: '#ff4422',
        desc: 'Modo del flamenco por excelencia. La tensión entre el ♭2 y la 3ª mayor crea ese sabor "moruno" característico. Muy usada en flamenco, música árabe, metal (Metallica, Megadeth) y electrónica.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:6},{s:0,f:9},
              {s:1,f:5},{s:1,f:7},{s:1,f:8},
              {s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},
              {s:4,f:5},{s:4,f:6},{s:4,f:9},
              {s:5,f:5},{s:5,f:6},{s:5,f:9},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'japin',
        name: 'Pentatónica Japonesa (In)',
        intervals: 'R – ♭2 – 4 – 5 – ♭6',
        formula: 'S MT T S MT',
        notes: 'La Si♭ Re Mi Fa',
        color: '#ff99bb',
        desc: 'Escala tradicional japonesa usada en el koto y shakuhachi. Solo 5 notas pero con un sabor oriental, melancólico y contemplativo único. Muy usada en bandas sonoras de anime y videojuegos.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:6},{s:0,f:10},
              {s:1,f:5},{s:1,f:7},{s:1,f:8},
              {s:2,f:5},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},{s:3,f:8},
              {s:4,f:5},{s:4,f:6},{s:4,f:10},
              {s:5,f:5},{s:5,f:6},{s:5,f:10},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
      {
        id: 'hungmin',
        name: 'Húngara Menor',
        intervals: 'R – 2 – ♭3 – ♯4 – 5 – ♭6 – 7',
        formula: 'T S MT S S MT S',
        notes: 'Re Mi Fa Sol# La Si♭ Do#',
        color: '#cc6600',
        desc: 'También llamada "gitana húngara". Sus dos intervalos aumentados le dan carácter dramático y exótico. Muy usada en música gitana, klezmer, metal neoclásico (Yngwie Malmsteen) y bandas sonoras.',
        positions: [
          {
            label: 'Posición 1',
            root: 5,
            dots: [
              {s:0,f:5},{s:0,f:7},{s:0,f:8},{s:0,f:11},
              {s:1,f:5},{s:1,f:7},{s:1,f:8},
              {s:2,f:4},{s:2,f:6},{s:2,f:7},
              {s:3,f:5},{s:3,f:7},{s:3,f:8},{s:3,f:11},
              {s:4,f:5},{s:4,f:7},{s:4,f:8},
              {s:5,f:5},{s:5,f:7},{s:5,f:8},{s:5,f:11},
            ],
            roots: [{s:0,f:5},{s:5,f:5}],
          },
        ],
      },
    ],
  },
];

// ── SVG Fretboard Builder ──────────────────────────────────────────────────────
function buildFretboardSVG(pos, color) {
  const W = 260, H = 130;
  const padL = 16, padT = 20, padR = 12;
  const strings = 6;
  const fretSpan = 5; // show 5 frets wide

  // Collect unique frets needed
  const allFrets = pos.dots.map(d => d.f);
  const minFret = Math.min(...allFrets);
  const maxFret = Math.max(minFret + fretSpan - 1, Math.max(...allFrets));

  const fretW = (W - padL - padR) / fretSpan;
  const strH  = (H - padT - 16) / (strings - 1);

  const strY = i => padT + i * strH;
  const fretX = f => padL + (f - minFret + 0.5) * fretW;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="scale-svg">`;

  // Fret position label
  svg += `<text x="${padL}" y="12" font-size="9" fill="var(--text-muted)" font-family="var(--font-family)">${minFret}fr</text>`;

  // Fret lines
  for (let f = 0; f <= fretSpan; f++) {
    const x = padL + f * fretW;
    svg += `<line x1="${x}" y1="${padT}" x2="${x}" y2="${H - 16}"
      stroke="var(--border-default)" stroke-width="${f === 0 ? 2.5 : 1}"/>`;
  }

  // String lines
  for (let s = 0; s < strings; s++) {
    const y = strY(s);
    const thick = 1 + (strings - 1 - s) * 0.25;
    svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}"
      stroke="var(--border-hover)" stroke-width="${thick}"/>`;
  }

  // Fret numbers below
  for (let f = 0; f < fretSpan; f++) {
    const fretNum = minFret + f;
    const x = padL + (f + 0.5) * fretW;
    svg += `<text x="${x}" y="${H - 4}" text-anchor="middle"
      font-size="7" fill="var(--text-muted)" font-family="var(--font-mono)">${fretNum}</text>`;
  }

  // Dots
  pos.dots.forEach(d => {
    if (d.f < minFret || d.f > minFret + fretSpan - 1) return;
    const x = fretX(d.f);
    const y = strY(d.s);
    const isRoot = pos.roots.some(r => r.s === d.s && r.f === d.f);
    const fill = isRoot ? color : `${color}66`;
    const stroke = isRoot ? '#fff' : 'none';
    const r = isRoot ? 7 : 5.5;
    svg += `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    if (isRoot) {
      svg += `<text x="${x}" y="${y + 3}" text-anchor="middle"
        font-size="7" font-weight="bold" fill="#fff" font-family="var(--font-family)">R</text>`;
    }
  });

  svg += '</svg>';
  return svg;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getCatLabel(id) {
  const icons = { fundamental: 'music-note', blues: 'vinyl-fill', jazz: 'music-note-list', modal: 'soundwave', world: 'globe' };
  return `<i class="bi bi-${icons[id] || 'circle'}"></i> ${t('scales.cat.' + id)}`;
}

// ── Scale Card ────────────────────────────────────────────────────────────────
function scaleCard(scale, catId) {
  const pos = scale.positions[0];
  const diagram = buildFretboardSVG(pos, scale.color);
  const name = t(`scales.cat.${catId}.${scale.id}`) || scale.name;
  const desc = t(`scales.cat.${catId}.${scale.id}.desc`) || scale.desc;

  return `
    <div class="scale-card" style="--scale-color: ${scale.color}">
      <div class="scale-card__header">
        <div>
          <h3 class="scale-card__name">${name}</h3>
          <div class="scale-card__intervals">${scale.intervals}</div>
        </div>
        <div class="scale-card__tags">
          <span class="scale-tag">${scale.formula}</span>
        </div>
      </div>
      <p class="scale-card__desc">${desc}</p>
      <div class="scale-card__diagram">
        <div class="scale-diagram-label">${pos.label} · ${t('scales.diagram.tonic')} ${pos.root})</div>
        ${diagram}
        <div class="scale-legend">
          <span class="scale-legend__root">● ${t('scales.legend.root').split('—')[0].trim()} (R)</span>
          <span class="scale-legend__note">● ${t('scales.legend.note')}</span>
        </div>
      </div>
    </div>
  `;
}

// ── Category Section ──────────────────────────────────────────────────────────
function categorySection(cat) {
  const cards = cat.scales.map(s => scaleCard(s, cat.id)).join('');
  return `
    <section class="scale-section" id="cat-${cat.id}">
      <div class="scale-section__header">
        <h2 class="scale-section__title">${getCatLabel(cat.id)}</h2>
        <p class="scale-section__desc">${t('scales.cat.' + cat.id + '.desc')}</p>
      </div>
      <div class="scale-cards-grid">
        ${cards}
      </div>
    </section>
  `;
}

// ── Intro block ───────────────────────────────────────────────────────────────
function introBlock() {
  return `
    <div class="scale-intro">
      <div class="scale-intro__text">
        <h2 class="scale-intro__title">${t('scales.intro.title')}</h2>
        <p>${t('scales.intro.p1')}</p>
        <p>${t('scales.intro.p2')}</p>
      </div>
      <div class="scale-intro__legend">
        <div class="scale-legend-item">
          <span class="scale-legend-dot root">R</span>
          <span>${t('scales.legend.root')}</span>
        </div>
        <div class="scale-legend-item">
          <span class="scale-legend-dot note"></span>
          <span>${t('scales.legend.note')}</span>
        </div>
        <div class="scale-legend-item scale-legend-item--tip">
          ${t('scales.legend.tip')}
        </div>
      </div>
    </div>
  `;
}

// ── Nav anchors ───────────────────────────────────────────────────────────────
function categoryNav() {
  const links = SCALE_CATEGORIES.map(cat =>
    `<a class="scale-nav-link" href="#cat-${cat.id}">${getCatLabel(cat.id)}</a>`
  ).join('');
  return `<nav class="scale-nav">${links}</nav>`;
}

// ── Page render ───────────────────────────────────────────────────────────────
export function ScalesPage() {
  const sections = SCALE_CATEGORIES.map(cat => categorySection(cat)).join('');

  return `
    <div class="page-header">
      <h1 class="page-header__title">${t('scales.title')}</h1>
      <p class="page-header__desc">${t('scales.desc')}</p>
    </div>

    ${introBlock()}
    ${categoryNav()}
    ${sections}
  `;
}
