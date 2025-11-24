
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

export interface GameSettings {
  difficulty: Difficulty;
  useJoystick: boolean;
  bombsEnabled: boolean;
  language: Language;
  controlsSwapped: boolean;
  musicEnabled: boolean;
  narratorAudioEnabled: boolean;
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
}

export interface GameStats {
  highScore: number;
  totalGames: number;
  totalChiguiros: number;
  totalScore: number;
}