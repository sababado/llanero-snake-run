
import { Difficulty, Language } from "./types";

// App Versioning Scheme: X.Y.Z.A
// X (Major): Significant feature changes, architectural refactors.
// Y (Minor): New features or substantial enhancements.
// Z (Deploy): Bug fixes, minor tweaks, or deployment-specific changes.
// A (AI Gen): Incremented automatically with each AI-powered code modification.
export const APP_VERSION = '0.1.1.4';

export const SPEEDS: Record<Difficulty, number> = {
  easy: 150,
  medium: 90,
  hard: 60,
};

export const TILE_SIZE = 20;
export const MAX_IMMUNITY = 200; // Increased duration for Coffee Power-up (~10s on Medium)

// Yopal Gastronomy Defaults (Fallbacks if AI fails)
export const YOPAL_FOODS = [
  "Mamona", "Tungos", "Hayaca", "Carne a la Perra", 
  "Topocho", "Cachama", "Amarillo a la Monseñor", "Pan de Arroz", 
  "Bastimento", "Gofios", "Majule", "Chigüiro Asado"
];

export const TRANSLATIONS = {
  es: {
    menuTitle: "¡Vamonos!",
    menuSubtitle: "Aventuras en Yopal, Casanare.",
    btn1p: "1 Jugador",
    btn1pSub: "(El Llanero)",
    btn2p: "2 Jugadores",
    btn2pSub: "(Pareja)",
    swapBtn: "⇄ Cambiar Controles P2",
    settingsBtn: "⚙️ Configuración",
    controlsInfo: "Modo 1 Jugador usa Flechas O WASD",
    mobileSwipe: "¡Desliza para controlar! 👆",
    mobileJoy: "¡Usa la palanca! 🕹️",
    settingsTitle: "Configuración",
    joyLabel: "Activar Joystick Virtual",
    bombLabel: "Activar 'Bola de Fuego'",
    musicLabel: "Música Llanera (Joropo)",
    narratorAudioLabel: "Voz del Narrador (IA)",
    diffLabel: "Dificultad:",
    optEasy: "Fácil (Lento)",
    optMedium: "Medio",
    optHard: "Difícil (Rápido)",
    mobSetHint: "La opción Joystick solo aplica en móvil.",
    closeBtn: "Cerrar",
    gameOver: "JUEGO TERMINADO",
    tie: "¡Choque Doble! ¡Empate!",
    winP1: "¡Ganó El Llanero (Esposo)!",
    winP2: "¡Ganó La Llanera (Esposa)!",
    win1P: "¡Puntaje: {score}! ¡Buen trabajo!",
    p1Label: "Esposo (P1)",
    p2Label: "Esposa (P2)",
    langLabel: "Idioma / Language",
    loadingAi: "Generando paisaje llanero...",
    narratorLabel: "🎙️ Narrador Criollo:",
    duelTitle: "🔥 Duelo Criollo 🔥",
    ties: "Empates"
  },
  en: {
    menuTitle: "Let's Go!",
    menuSubtitle: "Adventures in Yopal, Casanare.",
    btn1p: "1 Player",
    btn1pSub: "(El Llanero)",
    btn2p: "2 Players",
    btn2pSub: "(Couple)",
    swapBtn: "⇄ Swap P2 Controls",
    settingsBtn: "⚙️ Settings",
    controlsInfo: "1 Player Mode uses Arrows OR WASD",
    mobileSwipe: "Swipe to control! 👆",
    mobileJoy: "Use the joystick! 🕹️",
    settingsTitle: "Settings",
    joyLabel: "Enable Virtual Joystick",
    bombLabel: "Enable 'Fireball'",
    musicLabel: "Llanero Music (Joropo)",
    narratorAudioLabel: "Narrator Voice (AI)",
    diffLabel: "Difficulty:",
    optEasy: "Easy (Slow)",
    optMedium: "Medium",
    optHard: "Hard (Fast)",
    mobSetHint: "Joystick Setting applies only to Mobile.",
    closeBtn: "Close",
    gameOver: "GAME OVER",
    tie: "Double Crash! It's a Tie!",
    winP1: "El Llanero (Husband) Wins!",
    winP2: "La Llanera (Wife) Wins!",
    win1P: "Score: {score}! Great Job!",
    p1Label: "Husband (P1)",
    p2Label: "Wife (P2)",
    langLabel: "Language / Idioma",
    loadingAi: "Generating plains landscape...",
    narratorLabel: "🎙️ Local Narrator:",
    duelTitle: "🔥 Prairie Duel 🔥",
    ties: "Ties"
  },
};

export const INITIAL_SETTINGS: any = {
    difficulty: 'medium',
    useJoystick: true,
    bombsEnabled: true, 
    language: 'es',
    controlsSwapped: false,
    musicEnabled: true,
    narratorAudioEnabled: true
};
