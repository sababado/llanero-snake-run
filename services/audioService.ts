
// Procedural Joropo Generator using Web Audio API

// Frequency table for D Major (I) and A7 (V)
const CHORD_I = [293.66, 369.99, 440.00, 587.33]; // D, F#, A, D
const CHORD_V = [220.00, 277.18, 329.63, 392.00]; // A, C#, E, G

const PROGRESSION = [CHORD_I, CHORD_V, CHORD_V, CHORD_I];
const MEASURE_LENGTH = 6; // 6/8 time = 6 beats per measure

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let nextNoteTime = 0;
let timerID: number | null = null;
let currentNote = 0;
let scoreIntensity = 0;
let coffeeMode = false; // "Frenzy" mode for coffee powerup

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const startMusic = () => {
  initAudio();
  if (isPlaying) return;
  
  isPlaying = true;
  nextNoteTime = audioCtx!.currentTime + 0.1;
  currentNote = 0;
  scoreIntensity = 0;
  coffeeMode = false;
  scheduler();
};

export const stopMusic = () => {
  isPlaying = false;
  if (timerID !== null) {
    window.clearTimeout(timerID);
    timerID = null;
  }
};

export const setMusicIntensity = (score: number) => {
  scoreIntensity = score;
};

export const setCoffeeMode = (active: boolean) => {
    coffeeMode = active;
}

export const playGameOverJingle = () => {
  stopMusic();
  // Ensure context is ready
  if (!audioCtx) initAudio(); 
  if (!audioCtx) return;

  const now = audioCtx.currentTime;

  // 1. Dissonant Strum (Cuatro) - Like hitting the wrong strings
  // A diminished chord maybe?
  const dissonantChord = [233.08, 293.66, 349.23, 415.30]; // Bb, D, F, Ab (Bb7) - clashes with D major
  playCuatroStrum(now, dissonantChord, 0.3);

  // 2. Descending Harp (The "falling" sound)
  const steps = 8;
  const startFreq = 587.33; // D5
  for (let i = 0; i < steps; i++) {
    // Whole tone scale down
    const freq = startFreq * Math.pow(0.89, i); 
    const time = now + 0.1 + (i * 0.1); // Slightly slower
    playHarpString(time, freq, 0.5 - (i * 0.05)); // Fading out
  }
  
  // 3. Low Thud (Bass)
  playBass(now + 0.8, 73.42, 0.8); // D2
};

const scheduler = () => {
  if (!audioCtx) return;

  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    scheduleNote(currentNote, nextNoteTime);
    nextNoteTime += calculateStepTime();
    currentNote++;
    // Reset measure after 4 measures of 6 beats (24 beats total loop)
    if (currentNote >= MEASURE_LENGTH * 4) currentNote = 0; 
  }

  if (isPlaying) {
    timerID = window.setTimeout(scheduler, 25);
  }
};

const calculateStepTime = () => {
  if (coffeeMode) return 0.11; // Extremely fast for Coffee Mode!

  // Dynamic Tempo:
  // Starts at ~240ms per 8th note (slower).
  // Max speed at ~150ms per 8th note (fast Joropo).
  // Intensity 0 -> 240ms
  // Intensity 150 -> 150ms
  const startTempo = 0.24;
  const maxTempo = 0.15;
  const factor = Math.min(scoreIntensity / 150, 1);
  return startTempo - (factor * (startTempo - maxTempo));
};

const scheduleNote = (beatIndex: number, time: number) => {
  if (!audioCtx) return;

  const measurePos = beatIndex % MEASURE_LENGTH; // 0..5
  const chordIdx = Math.floor(beatIndex / MEASURE_LENGTH) % 4;
  const currentChord = PROGRESSION[chordIdx];
  const rootFreq = currentChord[0];

  // Intensity Tiers (Stretched out for slower progression)
  const hasCuatro = scoreIntensity >= 30 || coffeeMode;
  const hasBass = scoreIntensity >= 70 || coffeeMode;
  const isFrenzy = scoreIntensity >= 150 || coffeeMode;

  // --- 1. Maracas (Rhythm) ---
  // Constant driving rhythm. Accent on 3 and 6 (typical Joropo).
  // 1 2 3(ACCENT) 4 5 6(ACCENT)
  const isAccent = (measurePos === 2 || measurePos === 5);
  let maracaVol = 0.15;
  if (isFrenzy) maracaVol = 0.3; // Louder when intense
  if (coffeeMode) maracaVol = 0.4; // Even louder for coffee

  if (isAccent) {
      playMaraca(time, maracaVol * 2.5);
  } else {
      playMaraca(time, maracaVol);
  }

  // --- 2. Arpa (Melody/Lead) ---
  // Bass string (Bordon) always on 1
  if (measurePos === 0) {
      playHarpString(time, rootFreq / 2, 0.6); // Octave down
  }
  
  // Melodic improvisation
  // Density increases with score
  let playChance = 0.4; // Base chance
  if (hasCuatro) playChance = 0.6;
  if (isFrenzy) playChance = 0.9;
  if (coffeeMode) playChance = 1.0; // Play every possible note!

  // Always play on accents for groove
  if (isAccent || Math.random() < playChance) {
      // Pick a random note from the chord, preferably higher
      const noteIdx = Math.floor(Math.random() * currentChord.length);
      const noteFreq = currentChord[noteIdx] * (Math.random() > 0.5 ? 2 : 1); // Random octave
      // Slightly randomize timing for human feel? No, keep tight for game.
      playHarpString(time, noteFreq, 0.4);
      
      // In coffee mode, maybe add a harmony note occasionally
      if (coffeeMode && Math.random() > 0.5) {
          playHarpString(time, noteFreq * 1.5, 0.3); // 5th above
      }
  }

  // --- 3. Cuatro (Harmony/Strum) ---
  // Adds body. Strums on accents.
  if (hasCuatro) {
      if (isAccent) {
          playCuatroStrum(time, currentChord, 0.2);
      }
      // "Repique" (Ghost notes) in Frenzy mode
      if (isFrenzy && (measurePos === 1 || measurePos === 4)) {
          playCuatroStrum(time, currentChord, 0.08);
      }
  }

  // --- 4. Bajo (Bass) ---
  // Adds depth at high scores.
  // Plays on 1 and 4 (Dotted quarter pulse)
  if (hasBass) {
      if (measurePos === 0) {
          playBass(time, rootFreq / 4, 0.6); // 2 Octaves down
      }
      if (measurePos === 3) {
           // Play the 5th of the chord
           const fifth = currentChord[2] || (rootFreq * 1.5);
           playBass(time, fifth / 4, 0.5);
      }
  }
};

// --- SYNTHESIZERS ---

const playHarpString = (time: number, freq: number, vol: number) => {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  // Use sawtooth for coffee mode to make it sound "electric" or "wired"
  osc.type = coffeeMode ? 'sawtooth' : 'triangle'; 
  osc.frequency.value = freq;
  
  // Pluck Envelope
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6); 
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start(time);
  osc.stop(time + 0.6);
};

const playCuatroStrum = (time: number, chord: number[], vol: number) => {
  if (!audioCtx) return;
  
  const strumSpeed = 0.015; // Fast strum
  chord.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      // Cuatro has a unique re-entrant tuning, giving it a high-pitched cluster sound.
      // We simulate this by mixing saw and triangle.
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const noteTime = time + (i * strumSpeed);
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(vol, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15); // Short decay

      // Lowpass filter to cut harshness
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
  });
};

const playBass = (time: number, freq: number, vol: number) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square'; // Square wave for punchy bass, filtered down
    osc.frequency.value = freq;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; // Deep sound

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 0.5);
};

const playMaraca = (time: number, amp: number) => {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 0.05;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass'; // Maracas are high pitched
  filter.frequency.value = 3000;
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(amp, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noise.start(time);
};
