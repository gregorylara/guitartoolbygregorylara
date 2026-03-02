/**
 * PitchDetector — Web Audio API pitch detection engine.
 * Uses autocorrelation for accurate monophonic pitch detection.
 */

// ── Standard tuning note frequencies ──
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const GUITAR_STRINGS = [
  { name: 'E2', note: 'E', octave: 2, freq: 82.41 },
  { name: 'A2', note: 'A', octave: 2, freq: 110.00 },
  { name: 'D3', note: 'D', octave: 3, freq: 146.83 },
  { name: 'G3', note: 'G', octave: 3, freq: 196.00 },
  { name: 'B3', note: 'B', octave: 3, freq: 246.94 },
  { name: 'E4', note: 'E', octave: 4, freq: 329.63 },
];

export const TUNING_PRESETS = {
  standard: {
    name: 'Estándar',
    desc: 'E A D G B E',
    icon: '🎸',
    strings: [
      { name: 'E2', note: 'E', octave: 2, freq: 82.41, label: '6ª' },
      { name: 'A2', note: 'A', octave: 2, freq: 110.00, label: '5ª' },
      { name: 'D3', note: 'D', octave: 3, freq: 146.83, label: '4ª' },
      { name: 'G3', note: 'G', octave: 3, freq: 196.00, label: '3ª' },
      { name: 'B3', note: 'B', octave: 3, freq: 246.94, label: '2ª' },
      { name: 'E4', note: 'E', octave: 4, freq: 329.63, label: '1ª' },
    ],
  },
  dropD: {
    name: 'Drop D',
    desc: 'D A D G B E',
    icon: '🔥',
    strings: [
      { name: 'D2', note: 'D', octave: 2, freq: 73.42, label: '6ª' },
      { name: 'A2', note: 'A', octave: 2, freq: 110.00, label: '5ª' },
      { name: 'D3', note: 'D', octave: 3, freq: 146.83, label: '4ª' },
      { name: 'G3', note: 'G', octave: 3, freq: 196.00, label: '3ª' },
      { name: 'B3', note: 'B', octave: 3, freq: 246.94, label: '2ª' },
      { name: 'E4', note: 'E', octave: 4, freq: 329.63, label: '1ª' },
    ],
  },
  halfStepDown: {
    name: 'Medio Tono Abajo',
    desc: 'Eb Ab Db Gb Bb Eb',
    icon: '⬇️',
    strings: [
      { name: 'Eb2', note: 'D#', octave: 2, freq: 77.78, label: '6ª' },
      { name: 'Ab2', note: 'G#', octave: 2, freq: 103.83, label: '5ª' },
      { name: 'Db3', note: 'C#', octave: 3, freq: 138.59, label: '4ª' },
      { name: 'Gb3', note: 'F#', octave: 3, freq: 185.00, label: '3ª' },
      { name: 'Bb3', note: 'A#', octave: 3, freq: 233.08, label: '2ª' },
      { name: 'Eb4', note: 'D#', octave: 4, freq: 311.13, label: '1ª' },
    ],
  },
  openG: {
    name: 'Open G',
    desc: 'D G D G B D',
    icon: '🎶',
    strings: [
      { name: 'D2', note: 'D', octave: 2, freq: 73.42, label: '6ª' },
      { name: 'G2', note: 'G', octave: 2, freq: 98.00, label: '5ª' },
      { name: 'D3', note: 'D', octave: 3, freq: 146.83, label: '4ª' },
      { name: 'G3', note: 'G', octave: 3, freq: 196.00, label: '3ª' },
      { name: 'B3', note: 'B', octave: 3, freq: 246.94, label: '2ª' },
      { name: 'D4', note: 'D', octave: 4, freq: 293.66, label: '1ª' },
    ],
  },
};

/**
 * Convert frequency to nearest note info.
 * @param {number} freq — Detected frequency in Hz.
 * @returns {{ note: string, octave: number, cents: number, freq: number }}
 */
export function frequencyToNote(freq) {
  if (!freq || freq <= 0) return null;

  // Number of semitones from A4 (440 Hz)
  const semitones = 12 * Math.log2(freq / 440);
  const roundedSemitones = Math.round(semitones);
  const cents = Math.round((semitones - roundedSemitones) * 100);

  // A4 = index 9 in NOTE_NAMES (0-based: C=0, A=9)
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12;
  const octave = 4 + Math.floor((roundedSemitones + 9) / 12);

  return {
    note: NOTE_NAMES[noteIndex],
    octave,
    cents,
    freq: Math.round(freq * 100) / 100,
  };
}

/**
 * PitchDetector class — manages microphone, audio context, and pitch analysis.
 * Uses the YIN algorithm for highly accurate monophonic pitch detection.
 */
export class PitchDetector {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.mediaStream = null;
    this.source = null;
    this.buffer = null;
    this.isRunning = false;
    this.fftSize = 8192; // Larger buffer for better low-freq resolution
    this._pitchHistory = []; // For median smoothing
    this._historySize = 5;
    this._yinThreshold = 0.15; // YIN confidence threshold (lower = stricter)
  }

  /**
   * Start capturing audio from the microphone.
   */
  async start() {
    if (this.isRunning) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: 48000 },
        },
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0;

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.source.connect(this.analyser);

      this.buffer = new Float32Array(this.analyser.fftSize);
      this._pitchHistory = [];
      this.isRunning = true;
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw err;
    }
  }

  /**
   * Stop capturing and release resources.
   */
  stop() {
    this.isRunning = false;

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.buffer = null;
    this._pitchHistory = [];
  }

  /**
   * Get time-domain data for waveform rendering.
   * @returns {Uint8Array|null}
   */
  getTimeDomainData() {
    if (!this.analyser) return null;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  /**
   * Detect the current pitch using the YIN algorithm with median smoothing.
   * @returns {number|null} — Detected frequency in Hz, or null if unclear.
   */
  getPitch() {
    if (!this.analyser || !this.buffer) return null;

    this.analyser.getFloatTimeDomainData(this.buffer);

    // Check if there's enough signal (RMS)
    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.buffer.length);

    if (rms < 0.005) return null; // Too quiet — lowered for sensitivity

    const rawPitch = this._yinDetect(this.buffer, this.audioContext.sampleRate);

    if (rawPitch === null) return null;

    // Clamp to guitar range (E2=82Hz to ~1200Hz overtones)
    if (rawPitch < 60 || rawPitch > 1200) return null;

    // Median filter for stability — reject outliers
    this._pitchHistory.push(rawPitch);
    if (this._pitchHistory.length > this._historySize) {
      this._pitchHistory.shift();
    }

    if (this._pitchHistory.length < 3) return rawPitch;

    const sorted = [...this._pitchHistory].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  /**
   * YIN pitch detection algorithm.
   * Reference: "YIN, a fundamental frequency estimator for speech and music"
   * by Alain de Cheveigné and Hideki Kawahara (2002).
   * @private
   */
  _yinDetect(buf, sampleRate) {
    const halfLen = Math.floor(buf.length / 2);

    // Step 1 & 2: Compute the difference function and cumulative mean normalized difference
    const yinBuffer = new Float32Array(halfLen);
    yinBuffer[0] = 1.0;

    let runningSum = 0;

    for (let tau = 1; tau < halfLen; tau++) {
      // Difference function d(tau)
      let delta = 0;
      for (let i = 0; i < halfLen; i++) {
        const diff = buf[i] - buf[i + tau];
        delta += diff * diff;
      }

      // Cumulative mean normalized difference d'(tau)
      runningSum += delta;
      yinBuffer[tau] = delta * tau / runningSum;
    }

    // Step 3: Absolute threshold — find first tau where d'(tau) < threshold
    let tauEstimate = -1;

    // Skip very small tau values (frequencies above ~2000 Hz are not guitar)
    const minTau = Math.floor(sampleRate / 1200); // ~1200 Hz max
    const maxTau = Math.floor(sampleRate / 50);   // ~50 Hz min

    for (let tau = minTau; tau < Math.min(maxTau, halfLen); tau++) {
      if (yinBuffer[tau] < this._yinThreshold) {
        // Find the local minimum after crossing threshold
        while (tau + 1 < halfLen && yinBuffer[tau + 1] < yinBuffer[tau]) {
          tau++;
        }
        tauEstimate = tau;
        break;
      }
    }

    if (tauEstimate === -1) return null;

    // Step 4: Parabolic interpolation for sub-sample accuracy
    let betterTau;
    if (tauEstimate > 0 && tauEstimate < halfLen - 1) {
      const s0 = yinBuffer[tauEstimate - 1];
      const s1 = yinBuffer[tauEstimate];
      const s2 = yinBuffer[tauEstimate + 1];
      const shift = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
      betterTau = tauEstimate + (isFinite(shift) ? shift : 0);
    } else {
      betterTau = tauEstimate;
    }

    return sampleRate / betterTau;
  }
}
