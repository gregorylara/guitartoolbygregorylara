/**
 * GuitarTool — Main entry point.
 * Imports styles, mounts app shell, initializes router.
 */

// ── Styles ──
import './styles/variables.css';
import './styles/reset.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/tuner.css';
import './styles/metronome.css';
import './styles/scales.css';
import './styles/auth.css';
import './styles/chord-practice.css';
import './styles/progressions.css';
import './styles/ear-training.css';
import './styles/backing-tracks.css';

// ── Components ──
import { renderHeader, initHeader } from './components/Header.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderFooter } from './components/Footer.js';
import { Router }    from './components/Router.js';
import { initAuth }  from './lib/auth.js';

// ── Pages ──
import { HomePage } from './pages/Home.js';
import { TunerPage } from './pages/Tuner.js';
import { ChordsPage, onMount as chordsOnMount } from './pages/Chords.js';
import { render as MetronomePage, onMount as metronomeMount, onDestroy as metronomeDestroy } from './pages/Metronome.js';
import { ScalesPage }  from './pages/Scales.js';
import { ProPage, onMount as proMount } from './pages/Pro.js';
import { AccountPage, onMount as accountMount, onDestroy as accountDestroy } from './pages/Account.js';
import { ChordPracticePage, onMount as cpMount, onDestroy as cpDestroy } from './pages/ChordPractice.js';
import { ProgressionsPage, onMount as progMount, onDestroy as progDestroy } from './pages/Progressions.js';
import { EarTrainingPage, onMount as earMount, onDestroy as earDestroy } from './pages/EarTraining.js';
import { BackingTracksPage, onMount as btMount, onDestroy as btDestroy } from './pages/BackingTracks.js';

// ── Mount App Shell ──
const app = document.getElementById('app');

app.innerHTML = `
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  ${renderSidebar()}
  ${renderHeader()}
  <main class="app-main" id="page-content"></main>
  ${renderFooter()}
`;

// ── Setup Router ──
const routes = {
  '/':          HomePage,
  '/tuner':     TunerPage,
  '/chords':    { render: ChordsPage,     onMount: chordsOnMount },
  '/metronome': { render: MetronomePage,  onMount: metronomeMount,  onDestroy: metronomeDestroy },
  '/scales':    ScalesPage,
  '/pro':       { render: ProPage,          onMount: proMount },
  '/account':   { render: AccountPage,       onMount: accountMount,    onDestroy: accountDestroy },
  '/practice':      { render: ChordPracticePage,  onMount: cpMount,     onDestroy: cpDestroy },
  '/progressions':  { render: ProgressionsPage,   onMount: progMount,   onDestroy: progDestroy },
  '/ear-training':  { render: EarTrainingPage,     onMount: earMount,    onDestroy: earDestroy },
  '/backing-tracks':{ render: BackingTracksPage,   onMount: btMount,     onDestroy: btDestroy },
};

const pageContainer = document.getElementById('page-content');
const router = new Router(routes, pageContainer);

// ── Initialize Auth ──
initAuth(); // listens to Firebase auth state, dispatches 'authchange'

// ── Initialize Header (pass router for lang/auth re-renders) ──
initHeader(router);

// Initial resolve
router.resolve();

