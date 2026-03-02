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

// ── Components ──
import { renderHeader, initHeader } from './components/Header.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderFooter } from './components/Footer.js';
import { Router } from './components/Router.js';

// ── Pages ──
import { HomePage } from './pages/Home.js';
import { TunerPage } from './pages/Tuner.js';
import { ChordsPage, onMount as chordsOnMount } from './pages/Chords.js';
import { render as MetronomePage, onMount as metronomeMount, onDestroy as metronomeDestroy } from './pages/Metronome.js';
import { ScalesPage } from './pages/Scales.js';

// ── Mount App Shell ──
const app = document.getElementById('app');

app.innerHTML = `
  ${renderSidebar()}
  ${renderHeader()}
  <main class="app-main" id="page-content"></main>
  ${renderFooter()}
`;

// ── Initialize Interactivity ──
initHeader();

// ── Setup Router ──
const routes = {
  '/':          HomePage,
  '/tuner':     TunerPage,
  '/chords':    { render: ChordsPage, onMount: chordsOnMount },
  '/metronome': { render: MetronomePage, onMount: metronomeMount, onDestroy: metronomeDestroy },
  '/scales':    ScalesPage,
};

const pageContainer = document.getElementById('page-content');
const router = new Router(routes, pageContainer);

// Initial resolve
router.resolve();
