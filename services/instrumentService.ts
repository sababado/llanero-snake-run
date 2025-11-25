
export type InstrumentType = 'harp' | 'banjo' | 'fiddle' | 'cuatro';

// --- SYNTHESIZERS ---

export const playRetroBeep = (ctx: AudioContext, destination: AudioNode, time: number, freq: number, vol: number, type: OscillatorType) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + 0.1);
}

export const playPluckedString = (
    ctx: AudioContext, 
    destination: AudioNode,
    time: number, 
    freq: number, 
    vol: number, 
    instrument: InstrumentType,
    coffeeMode: boolean
) => {
  // Richer synthesis: Oscillator + Detuned Layer + Filter Envelope
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 1;

  const gain = ctx.createGain();
  
  // Oscillator 1 (Main)
  const osc1 = ctx.createOscillator();
  // Oscillator 2 (Detuned for chorus effect)
  const osc2 = ctx.createOscillator();

  let release = 0.6;
  let attack = 0.01;

  if (instrument === 'harp') {
      osc1.type = coffeeMode ? 'sawtooth' : 'triangle'; 
      osc2.type = 'triangle';
      filter.frequency.setValueAtTime(freq * 4, time);
      filter.frequency.exponentialRampToValueAtTime(freq, time + 0.5); // Pluck sound
  } else if (instrument === 'banjo') {
      osc1.type = 'sawtooth';
      osc2.type = 'square'; // Mixed for metallic sound
      osc2.detune.value = 5;
      filter.type = 'highpass'; // Thin sound
      filter.frequency.value = 400;
      release = 0.2;
      attack = 0.005;
  } else {
      // Fiddle
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc2.detune.value = 3;
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
      attack = 0.05; // Bowing attack
  }

  osc1.frequency.value = freq;
  osc2.frequency.value = freq;
  
  // Envelope
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(vol, time + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, time + release); 
  
  // Routing
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  
  osc1.start(time);
  osc2.start(time);
  osc1.stop(time + release);
  osc2.stop(time + release);
};

export const playStringInstrument = (
    ctx: AudioContext, 
    destination: AudioNode,
    time: number, 
    chord: number[], 
    vol: number, 
    type: 'cuatro' | 'banjo'
) => {
  const strumSpeed = 0.015; 
  chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const noteTime = time + (i * strumSpeed);
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(vol, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15); 

      // Banjo is brighter, Cuatro is warmer
      filter.type = type === 'banjo' ? 'highpass' : 'lowpass';
      filter.frequency.value = type === 'banjo' ? 600 : 2500;
      filter.Q.value = type === 'banjo' ? 0 : 2; // Resonance for Cuatro body

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
  });
};

export const playBass = (ctx: AudioContext, destination: AudioNode, time: number, freq: number, vol: number) => {
    // Layering: Square (Harmonics) + Sine (Fundamental Body)
    const oscSquare = ctx.createOscillator();
    const oscSine = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscSquare.type = 'square'; 
    oscSquare.frequency.value = freq;

    oscSine.type = 'sine';
    oscSine.frequency.value = freq;

    // Filter mainly for the square wave to remove harsh digital fizz
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(200, time + 0.2); // Envelope filter

    // Volume Envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    oscSquare.connect(filter);
    filter.connect(gain);
    
    // Sine bypasses filter to keep low end clean
    const sineGain = ctx.createGain();
    sineGain.gain.value = 0.8; // Mix level
    oscSine.connect(sineGain);
    sineGain.connect(gain);

    gain.connect(destination);

    oscSquare.start(time);
    oscSine.start(time);
    oscSquare.stop(time + 0.5);
    oscSine.stop(time + 0.5);
};

export const playMaraca = (ctx: AudioContext, destination: AudioNode, time: number, amp: number) => {
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass'; 
  filter.frequency.value = 4000; // Higher cutoff for "sand" sound
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(amp, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  
  noise.start(time);
};

export const playSnare = (ctx: AudioContext, destination: AudioNode, time: number, amp: number) => {
    // White noise burst with body
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass for "snap"
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 0.5;

    // Add a low tone for body
    const oscBody = ctx.createOscillator();
    oscBody.type = 'triangle';
    oscBody.frequency.setValueAtTime(180, time);
    oscBody.frequency.exponentialRampToValueAtTime(50, time + 0.1);
    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(amp * 0.5, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    oscBody.connect(bodyGain);
    bodyGain.connect(destination);

    noise.start(time);
    oscBody.start(time);
    oscBody.stop(time + 0.1);
};