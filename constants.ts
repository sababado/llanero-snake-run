
import { Difficulty, Language } from "./types";
import { ES } from "./locals/es";
import { EN } from "./locals/en";

// App Versioning Scheme: X.Y.Z.A
// X (Major): Significant feature changes, architectural refactors.
// Y (Minor): New features or substantial enhancements.
// Z (Deploy): Bug fixes, minor tweaks, or deployment-specific changes.
// A (AI Gen): Incremented automatically with each AI-powered code modification.
export const APP_VERSION = '0.3.3.22';

export const SPEEDS: Record<Difficulty, number> = {
  easy: 150,
  medium: 90,
  hard: 60,
};

export const TILE_SIZE = 20;
// Fixed Logical Resolution for Cross-Platform Sync
// Changed to 1:1 (Square) to improve mobile vertical real estate while maintaining desktop compatibility
export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 800;

export const MAX_IMMUNITY = 200; // Increased duration for Coffee Power-up (~10s on Medium)

// Yopal Gastronomy Defaults (Fallbacks if AI fails)
export const YOPAL_FOODS = [
  "Mamona", "Tungos", "Hayaca", "Carne a la Perra", 
  "Topocho", "Cachama", "Amarillo a la Monseñor", "Pan de Arroz", 
  "Bastimento", "Gofios", "Majule", "Chigüiro Asado"
];

export const TRANSLATIONS = {
  es: ES,
  en: EN,
};

export const INITIAL_SETTINGS: any = {
    difficulty: 'medium',
    useJoystick: true,
    bombsEnabled: true, 
    language: 'es',
    controlsSwapped: false,
    musicEnabled: true,
    musicStyle: 'joropo',
    narratorAudioEnabled: true,
    narratorTextEnabled: true,
    retroMode: false
};