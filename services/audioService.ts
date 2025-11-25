
import { MusicStyle } from "../types";
import { 
    playPluckedString, 
    playStringInstrument, 
    playBass, 
    playMaraca, 
    playSnare, 
    playRetroBeep 
} from './instrumentService';
import { JOROPO_TRACKS, COUNTRY_PROGRESSION, RETRO_PROGRESSION, MusicTrack } from './musicData';

const MEASURE_LENGTH = 6; // 6/8 time = 6 beats per measure

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;
let reverbNode: ConvolverNode | null = null;

let isPlaying = false;
let nextNoteTime = 0;
let timerID: number | null = null;
let currentNote = 0;
let scoreIntensity = 0;
let coffeeMode = false; 
let currentStyle: MusicStyle = 'joropo';

// State for the currently playing track
let currentTrackConfig: MusicTrack | null = null;

// Helper to create a simple algorithmic reverb impulse
const createReverbImpulse = (ctx: AudioContext) => {
    const duration = 1.5;
    const decay = 2.0;
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        // Simple noise with exponential decay
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    }
    return impulse;
};

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // --- Master Chain Setup ---
    
    // 1. Dynamics Compressor (Glue)
    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
    compressor.knee.setValueAtTime(30, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

    // 2. Master Gain (Volume Control)
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.8; 

    // 3. Reverb (Atmosphere)
    reverbNode = audioCtx.createConvolver();
    reverbNode.buffer = createReverbImpulse(audioCtx);
    const reverbGain = audioCtx.createGain();
    reverbGain.gain.value = 0.25; // Wet Mix

    // --- Routing ---
    // Instruments -> MasterGain -> Compressor -> Destination
    //                          |-> Reverb -> ReverbGain -> Compressor
    
    masterGain.connect(compressor);
    masterGain.connect(reverbNode);
    reverbNode.connect(reverbGain);
    reverbGain.connect(compressor);
    
    compressor.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const startMusic = (style: MusicStyle = 'joropo') => {
  initAudio();
  currentStyle = style;
  if (isPlaying) return;
  
  // Pick a random track if style is Joropo
  if (style === 'joropo') {
      const randomIdx = Math.floor(Math.random() * JOROPO_TRACKS.length);
      currentTrackConfig = JOROPO_TRACKS[randomIdx];
      console.log(`Starting Track: ${currentTrackConfig.name}`);
  } else if (style === 'country' || style === 'mix') {
      currentTrackConfig = { name: "Country", progression: COUNTRY_PROGRESSION };
  } else {
      currentTrackConfig = { name: "Retro", progression: RETRO_PROGRESSION };
  }

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
  if (!audioCtx) initAudio(); 
  if (!audioCtx || !masterGain) return;

  const dest = masterGain; // Use Master Bus
  const now = audioCtx.currentTime;

  if (currentStyle === 'retro') {
      playRetroBeep(audioCtx, dest, now, 150, 0.4, 'sawtooth');
      playRetroBeep(audioCtx, dest, now + 0.2, 100, 0.6, 'sawtooth');
      return;
  }

  // Dissonant Strum
  const dissonantChord = [233.08, 293.66, 349.23, 415.30]; 
  playStringInstrument(audioCtx, dest, now, dissonantChord, 0.3, currentStyle === 'country' ? 'banjo' : 'cuatro');

  // Descending
  const steps = 8;
  const startFreq = 587.33; 
  for (let i = 0; i < steps; i++) {
    const freq = startFreq * Math.pow(0.89, i); 
    const time = now + 0.1 + (i * 0.1); 
    playPluckedString(audioCtx, dest, time, freq, 0.5 - (i * 0.05), currentStyle === 'country' ? 'fiddle' : 'harp', false);
  }
  
  playBass(audioCtx, dest, now + 0.8, 73.42, 0.8);
};

const scheduler = () => {
  if (!audioCtx || !masterGain) return;

  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    scheduleNote(currentNote, nextNoteTime);
    nextNoteTime += calculateStepTime();
    currentNote++;
    // Reset based on 4 measures (standard loop size for defined tracks)
    if (currentNote >= MEASURE_LENGTH * 4) currentNote = 0; 
  }

  if (isPlaying) {
    timerID = window.setTimeout(scheduler, 25);
  }
};

const calculateStepTime = () => {
  if (coffeeMode) return 0.11; 

  const startTempo = 0.24;
  const maxTempo = 0.15;
  const factor = Math.min(scoreIntensity / 150, 1);
  return startTempo - (factor * (startTempo - maxTempo));
};

const scheduleNote = (beatIndex: number, time: number) => {
  if (!audioCtx || !currentTrackConfig || !masterGain) return;

  const dest = masterGain; // Route to Master Bus

  if (currentStyle === 'retro') {
      scheduleRetroNote(beatIndex, time, dest);
      return;
  }

  const measurePos = beatIndex % MEASURE_LENGTH; 
  const progression = currentTrackConfig.progression;
  const chordIdx = Math.floor(beatIndex / MEASURE_LENGTH) % progression.length;
  const currentChord = progression[chordIdx];
  const rootFreq = currentChord[0];

  const hasHarmony = scoreIntensity >= 30 || coffeeMode;
  const hasBass = scoreIntensity >= 70 || coffeeMode;
  const isFrenzy = scoreIntensity >= 150 || coffeeMode;

  const isCountry = currentStyle === 'country';
  const isMix = currentStyle === 'mix';
  
  // Decide Instruments
  // Mix: Alternates measures or layers instruments
  const useBanjo = isCountry || (isMix && chordIdx % 2 === 0);
  const useHarp = !useBanjo;

  // --- 1. Rhythm (Maracas or Snare) ---
  const isAccent = (measurePos === 2 || measurePos === 5);
  let vol = 0.15;
  if (isFrenzy) vol = 0.3; 
  if (coffeeMode) vol = 0.4; 

  if (isCountry) {
      if (isAccent) playSnare(audioCtx, dest, time, vol);
  } else {
      playMaraca(audioCtx, dest, time, isAccent ? vol * 2.5 : vol);
  }

  // --- 2. Melody (Harp or Fiddle/Banjo) ---
  if (measurePos === 0) {
     if (useHarp) playPluckedString(audioCtx, dest, time, rootFreq / 2, 0.6, 'harp', coffeeMode); 
     else playPluckedString(audioCtx, dest, time, rootFreq / 2, 0.6, 'banjo', coffeeMode); // Banjo roll bass
  }
  
  let playChance = 0.4; 
  if (hasHarmony) playChance = 0.6;
  if (isFrenzy) playChance = 0.9;
  if (coffeeMode) playChance = 1.0; 

  if (isAccent || Math.random() < playChance) {
      const noteIdx = Math.floor(Math.random() * currentChord.length);
      const noteFreq = currentChord[noteIdx] * (Math.random() > 0.5 ? 2 : 1); 
      
      if (useHarp) {
          playPluckedString(audioCtx, dest, time, noteFreq, 0.4, 'harp', coffeeMode);
      } else {
          // Country: Fiddle on long notes, Banjo on arps
          if (Math.random() > 0.5) playPluckedString(audioCtx, dest, time, noteFreq, 0.3, 'banjo', coffeeMode);
          else playPluckedString(audioCtx, dest, time, noteFreq, 0.3, 'fiddle', coffeeMode);
      }
  }

  // --- 3. Harmony (Cuatro or Banjo Strum) ---
  if (hasHarmony) {
      if (isAccent) {
          playStringInstrument(audioCtx, dest, time, currentChord, 0.2, useBanjo ? 'banjo' : 'cuatro');
      }
      if (isFrenzy && (measurePos === 1 || measurePos === 4)) {
          playStringInstrument(audioCtx, dest, time, currentChord, 0.08, useBanjo ? 'banjo' : 'cuatro');
      }
  }

  // --- 4. Bass ---
  if (hasBass) {
      if (measurePos === 0) {
          playBass(audioCtx, dest, time, rootFreq / 4, 0.6); 
      }
      if (measurePos === 3) {
           const fifth = currentChord[2] || (rootFreq * 1.5);
           playBass(audioCtx, dest, time, fifth / 4, 0.5);
      }
  }
};

const scheduleRetroNote = (beatIndex: number, time: number, dest: AudioNode) => {
    if (!audioCtx || !currentTrackConfig) return;
    
    // Simple Arpeggio
    const measurePos = beatIndex % MEASURE_LENGTH; 
    const progression = currentTrackConfig.progression;
    const chordIdx = Math.floor(beatIndex / MEASURE_LENGTH) % progression.length;
    const currentChord = progression[chordIdx];
    
    // Play root on beat 0
    if (measurePos === 0) {
        playRetroBeep(audioCtx, dest, time, currentChord[0], 0.1, 'square');
    }
    // Arpeggiate
    if (measurePos % 2 === 0) {
         const idx = (measurePos / 2) % 4;
         playRetroBeep(audioCtx, dest, time, currentChord[idx] * 2, 0.05, 'square');
    }
};