
export type InstrumentType = 'harp' | 'banjo' | 'fiddle' | 'cuatro';

// --- SYNTHESIZERS ---

export const playRetroBeep = (ctx: AudioContext, time: number, freq: number, vol: number, type: OscillatorType) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
}

export const playPluckedString = (
    ctx: AudioContext, 
    time: number, 
    freq: number, 
    vol: number, 
    instrument: InstrumentType,
    coffeeMode: boolean
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  if (instrument === 'harp') {
      osc.type = coffeeMode ? 'sawtooth' : 'triangle'; 
  } else if (instrument === 'banjo') {
      osc.type = 'sawtooth'; // Bright
  } else {
      osc.type = 'sawtooth'; // Fiddle
  }

  osc.frequency.value = freq;
  
  // Envelope
  gain.gain.setValueAtTime(0, time);
  
  if (instrument === 'fiddle') {
      // Swell in, longer sustain
      gain.gain.linearRampToValueAtTime(vol, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4); 
  } else if (instrument === 'banjo') {
      // Very pluck
      gain.gain.linearRampToValueAtTime(vol, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2); 
  } else {
      // Harp
      gain.gain.linearRampToValueAtTime(vol, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6); 
  }
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(time);
  osc.stop(time + 0.6);
};

export const playStringInstrument = (
    ctx: AudioContext, 
    time: number, 
    chord: number[], 
    vol: number, 
    type: 'cuatro' | 'banjo'
) => {
  const strumSpeed = 0.015; 
  chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const noteTime = time + (i * strumSpeed);
      
      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(vol, noteTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15); 

      // Banjo is brighter, Cuatro is warmer
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'banjo' ? 'highpass' : 'lowpass';
      filter.frequency.value = type === 'banjo' ? 500 : 3000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
  });
};

export const playBass = (ctx: AudioContext, time: number, freq: number, vol: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square'; 
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400; 

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + 0.5);
};

export const playMaraca = (ctx: AudioContext, time: number, amp: number) => {
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
  filter.frequency.value = 3000;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(amp, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  noise.start(time);
};

export const playSnare = (ctx: AudioContext, time: number, amp: number) => {
    // Simple white noise burst
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(amp, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(time);
};
