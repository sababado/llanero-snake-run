
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Point {
  x: number;
  y: number;
}

export interface Snake {
  body: Point[];
  dx: number;
  dy: number;
  nextDx: number;
  nextDy: number;
  score: number;
  colorType: 'orchid' | 'colombia';
  name: string;
  dead: boolean;
  immunityTimer: number;
}

export interface Item {
  active: boolean;
  x: number;
  y: number;
  timer: number;
  name?: string; // For Gastronomy feature
}

export interface Cloud {
  x: number;
  y: number;
  baseY: number;
  speed: number;
  size: number;
  wobbleOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface BolaDeFuego {
  active: boolean;
  x: number;
  y: number;
  moveTimer: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'es' | 'en';
export type MusicStyle = 'joropo' | 'country' | 'mix' | 'retro';
export type WeatherState = 'sunny' | 'sunset' | 'night' | 'rain';
export type AppView = 'MENU' | 'LOBBY' | 'GAME' | 'GAME_OVER';

export interface GameSettings {
  difficulty: Difficulty;
  useJoystick: boolean;
  bombsEnabled: boolean;
  language: Language;
  controlsSwapped: boolean;
  musicEnabled: boolean;
  musicStyle: MusicStyle;
  narratorAudioEnabled: boolean;
  narratorTextEnabled: boolean;
  retroMode: boolean; // Nokia style
}

export interface GameState {
  snake1: Snake;
  snake2: Snake;
  chiguiro: Item;
  aguacate: Item;
  virgen: Item;
  cafe: Item; // New Item: Cafe (Tinto)
  bomb: Item;
  bola: BolaDeFuego;
  clouds: Cloud[];
  particles: Particle[];
  gameMode: 1 | 2;
  isRunning: boolean;
  winnerMsg: string;
  backgroundUrl: string | null;
  narratorText: string;
  chiguirosEaten: number; 
  lastMilestone: number;
  sessionEatenItems: string[]; // Track items for Gastronomy Gallery
  weather: WeatherState;
  rainIntensity: number; // 0 to 1
  gridSize: { width: number; height: number }; // Dynamic Grid Size
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalChiguiros: number;
  totalScore: number;
  leaderboard: LeaderboardEntry[];
}

// Multiplayer Types
export type MultiplayerRole = 'host' | 'client' | 'none';

export interface MultiplayerState {
  active: boolean;
  role: MultiplayerRole;
  roomId: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMsg?: string;
}

export interface NetworkPacket {
  type: 'INIT' | 'UPDATE' | 'INPUT' | 'GAME_OVER' | 'COUNTDOWN' | 'READY' | 'PING' | 'REMATCH' | 'START_GAME' | 'SETTINGS_UPDATE' | 'PRE_START_CHECK' | 'PRE_START_ACK';
  payload: any;
}

export interface InitPacket {
  settings: GameSettings;
  backgroundUrl: string | null;
  virgenUrl: string | null;
}

export interface ReadyPacket {
  role: 'host' | 'client';
  dimensions: { width: number; height: number };
}

export interface StartGamePacket {
    gridSize: { width: number; height: number };
}

export interface UpdatePacket {
  snake1: Snake;
  snake2: Snake;
  chiguiro: Item;
  aguacate: Item;
  virgen: Item;
  cafe: Item;
  bomb: Item;
  bola: BolaDeFuego;
  weather: WeatherState;
  rainIntensity: number;
  winnerMsg: string;
  isRunning: boolean;
  gameMode: 1 | 2;
  gridSize: { width: number; height: number };
}

export interface InputPacket {
  dir: Direction;
}

// --- Game Events (For Clean Architecture) ---

export type GameEventType = 
  | 'SCORE_UPDATE' 
  | 'GAME_OVER' 
  | 'NARRATION' 
  | 'PLAY_SOUND'
  | 'MUSIC_INTENSITY'
  | 'COLLISION_IMPACT';

export interface GameEvent {
  type: GameEventType;
  payload?: any;
}

export interface GameScorePayload {
  s1: number;
  s2: number;
}

export interface GameOverPayload {
  score1: number; 
  score2: number; 
  msg: string; 
  context: { score: number, cause: string }; 
  chiguirosEaten: number;
  winner: 'p1' | 'p2' | 'tie' | null;
}

export interface NarrationPayload {
  type: 'start' | 'milestone' | 'game_over' | 'relic' | 'powerup';
  text?: string; // Optional direct text override
  context?: any;
}

export interface CollisionPayload {
    x: number;
    y: number;
}