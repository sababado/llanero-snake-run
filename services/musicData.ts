
export interface MusicTrack {
    name: string;
    progression: number[][];
    baseTempo?: number;
}

// --- NOTES & CHORDS ---

// Frequency map for key notes
const N = {
    D3: 146.83,
    E3: 164.81,
    G3: 196.00,
    A3: 220.00,
    B3: 246.94,
    C4: 261.63,
    Cs4: 277.18,
    D4: 293.66,
    E4: 329.63,
    Fs4: 369.99,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    D5: 587.33
};

// Chord Definitions
const CHORDS = {
    // D Major Scale
    D_MAJ:  [N.D4, N.Fs4, N.A4, N.D5], // I
    A7:     [N.A3, N.Cs4, N.E4, N.G4], // V7
    G_MAJ:  [N.G3, N.B3, N.D4, N.G4],  // IV
    
    // E Minor Scale (Pajarillo vibe)
    Em:     [N.E3, N.G3, N.B3, N.E4],  // i
    Am:     [N.A3, N.C4, N.E4, N.A4],  // iv
    B7:     [N.B3, N.D4, N.Fs4, N.B4]  // V7
};

// --- TRACKS ---

export const JOROPO_TRACKS: MusicTrack[] = [
    {
        name: "El Gabán (Clásico)",
        // Classic I - V - V - I loop
        progression: [CHORDS.D_MAJ, CHORDS.A7, CHORDS.A7, CHORDS.D_MAJ]
    },
    {
        name: "Seis por Derecho",
        // I - IV - V7 - V7 cycle (Simplified)
        progression: [CHORDS.D_MAJ, CHORDS.G_MAJ, CHORDS.A7, CHORDS.D_MAJ]
    },
    {
        name: "Pajarillo (Menor)",
        // Darker, minor key vibe. i - iv - V7 - i
        progression: [CHORDS.Em, CHORDS.Am, CHORDS.B7, CHORDS.Em]
    }
];

export const COUNTRY_PROGRESSION = [CHORDS.D_MAJ, CHORDS.G_MAJ, CHORDS.A7, CHORDS.D_MAJ];
export const RETRO_PROGRESSION = [CHORDS.D_MAJ, CHORDS.A7, CHORDS.G_MAJ, CHORDS.D_MAJ];
