/**
 * Home — Dashboard with tool card grid.
 */

const tools = [
  {
    icon: '🎸',
    title: 'Guitar Tuner',
    desc: 'Tune your guitar with precision using microphone input or reference tones.',
    route: '/tuner',
    badge: null,
  },
  {
    icon: '🎵',
    title: 'Chord Library',
    desc: 'Browse and learn chord shapes, fingerings, and voicings across the fretboard.',
    route: '/chords',
    badge: null,
  },
  {
    icon: '⏱️',
    title: 'Metronome',
    desc: 'Keep perfect time with adjustable BPM, time signatures, and accent patterns.',
    route: '/metronome',
    badge: null,
  },
  {
    icon: '🎼',
    title: 'Scale Explorer',
    desc: 'Visualize scales and modes across the fretboard to level up your solos.',
    route: '/scales',
    badge: null,
  },
];

export function HomePage() {
  const cards = tools.map(tool => {
    const badgeHTML = tool.badge
      ? `<span class="badge badge--soon">${tool.badge}</span>`
      : '';

    return `
      <a class="tool-card" href="#${tool.route}">
        <div class="tool-card__icon">${tool.icon}</div>
        <div class="tool-card__title">${tool.title} ${badgeHTML}</div>
        <div class="tool-card__desc">${tool.desc}</div>
      </a>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1 class="page-header__title">Welcome to GuitarTool</h1>
      <p class="page-header__desc">
        Your all-in-one practice suite. Pick a tool below to get started.
      </p>
    </div>
    <div class="tools-grid">
      ${cards}
    </div>
  `;
}
