

import { Difficulty, Language } from "./types";

// App Versioning Scheme: X.Y.Z.A
// X (Major): Significant feature changes, architectural refactors.
// Y (Minor): New features or substantial enhancements.
// Z (Deploy): Bug fixes, minor tweaks, or deployment-specific changes.
// A (AI Gen): Incremented automatically with each AI-powered code modification.
export const APP_VERSION = '0.3.1.16';

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
  es: {
    menuTitle: "¡Vamonos!",
    menuSubtitle: "Aventuras en Yopal, Casanare.",
    btn1p: "1 Jugador",
    btn1pSub: "(El Llanero)",
    btn2p: "2 Jugadores",
    btn2pSub: "(Pareja Local)",
    btnOnline: "Duelo Online",
    btnOnlineSub: "(Remoto)",
    swapBtn: "⇄ Cambiar Controles P2",
    settingsBtn: "⚙️ Configuración",
    controlsInfo: "Modo 1 Jugador usa Flechas O WASD",
    mobileSwipe: "¡Desliza para controlar! 👆",
    mobileJoy: "¡Usa la palanca! 🕹️",
    settingsTitle: "Configuración",
    joyLabel: "Activar Joystick Virtual",
    bombLabel: "Activar 'Bola de Fuego'",
    musicLabel: "Música de Fondo",
    musicStyleLabel: "Estilo Musical:",
    retroLabel: "Modo Nokia 1100 (Retro)",
    narratorAudioLabel: "Voz del Narrador (IA)",
    narratorTextLabel: "Mensajes de Texto",
    diffLabel: "Dificultad:",
    optEasy: "Fácil (Lento)",
    optMedium: "Medio",
    optHard: "Difícil (Rápido)",
    mobSetHint: "La opción Joystick solo aplica en móvil.",
    closeBtn: "Cerrar",
    gameOver: "JUEGO TERMINADO",
    tie: "¡Choque Doble! ¡Empate!",
    winP1: "¡Ganó El Llanero (Esposo)!",
    winP2: "¡Ganó La Llanera (Wife)!",
    win1P: "¡Puntaje: {score}! ¡Buen trabajo!",
    p1Label: "Esposo (P1)",
    p2Label: "Esposa (P2)",
    langLabel: "Idioma / Language",
    loadingAi: "Generando paisaje llanero...",
    narratorLabel: "🎙️ Narrador Criollo:",
    duelTitle: "🔥 Duelo Criollo 🔥",
    ties: "Empates",
    gastronomyBtn: "🍽️ Galería Gastronómica",
    saveScoreBtn: "Guardar",
    enterInitials: "¡Nuevo Récord! Iniciales:",
    musicJoropo: "Joropo (Clásico)",
    musicCountry: "Country (USA)",
    musicMix: "Fusión Norte-Sur",
    musicRetro: "Retro (Beeps)",
    lobbyTitle: "Sala Multijugador",
    hostBtn: "Crear Sala",
    joinBtn: "Unirse a Sala",
    roomCode: "Código de Sala:",
    enterCode: "Ingresa el Código:",
    waiting: "Esperando oponente...",
    copyBtn: "Copiar",
    connectBtn: "Conectar",
    cancelBtn: "Cancelar",
    mpDesc: "Juega con un amigo en otra computadora.",
    // Lobby Translations
    lobbyReady: "Listo",
    lobbySyncing: "Sincronizando...",
    lobbyLoading: "Cargando",
    lobbyHost: "Anfitrión",
    lobbyGuest: "Invitado",
    lobbyStart: "INICIAR JUEGO",
    lobbyWaitAssets: "Esperando carga de archivos...",
    lobbyAllReady: "¡Todos listos!",
    lobbyYouReady: "¡Estás Listo!",
    lobbyLoadingAssets: "Cargando archivos...",
    lobbyWaitHost: "Esperando al Host...",
    rematchBtn: "Revancha",
    exitRoomBtn: "Salir de Sala",
    waitHostRestart: "Esperando reinicio..."
  },
  en: {
    menuTitle: "Let's Go!",
    menuSubtitle: "Adventures in Yopal, Casanare.",
    btn1p: "1 Player",
    btn1pSub: "(El Llanero)",
    btn2p: "2 Players",
    btn2pSub: "(Couple Local)",
    btnOnline: "Online Duel",
    btnOnlineSub: "(Remote)",
    swapBtn: "⇄ Swap P2 Controls",
    settingsBtn: "⚙️ Settings",
    controlsInfo: "1 Player Mode uses Arrows OR WASD",
    mobileSwipe: "Swipe to control! 👆",
    mobileJoy: "Use the joystick! 🕹️",
    settingsTitle: "Settings",
    joyLabel: "Enable Virtual Joystick",
    bombLabel: "Enable 'Fireball'",
    musicLabel: "Background Music",
    musicStyleLabel: "Music Style:",
    retroLabel: "Nokia 1100 Mode (Retro)",
    narratorAudioLabel: "Narrator Voice (AI)",
    narratorTextLabel: "Text Messages",
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
    ties: "Ties",
    gastronomyBtn: "🍽️ Gastronomy Gallery",
    saveScoreBtn: "Save",
    enterInitials: "New High Score! Initials:",
    musicJoropo: "Joropo (Classic)",
    musicCountry: "Country (USA)",
    musicMix: "North-South Fusion",
    musicRetro: "Retro (Beeps)",
    lobbyTitle: "Multiplayer Lobby",
    hostBtn: "Create Room",
    joinBtn: "Join Room",
    roomCode: "Room Code:",
    enterCode: "Enter Code:",
    waiting: "Waiting for opponent...",
    copyBtn: "Copy",
    connectBtn: "Connect",
    cancelBtn: "Cancel",
    mpDesc: "Play with a friend on another computer.",
    // Lobby Translations
    lobbyReady: "Ready",
    lobbySyncing: "Syncing...",
    lobbyLoading: "Loading",
    lobbyHost: "Host",
    lobbyGuest: "Guest",
    lobbyStart: "START GAME",
    lobbyWaitAssets: "Waiting for assets to load...",
    lobbyAllReady: "All players ready!",
    lobbyYouReady: "You are Ready!",
    lobbyLoadingAssets: "Loading assets...",
    lobbyWaitHost: "Waiting for Host...",
    rematchBtn: "Rematch",
    exitRoomBtn: "Exit Room",
    waitHostRestart: "Waiting for Host..."
  },
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