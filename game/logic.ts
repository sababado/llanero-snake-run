
import { GameState, GameSettings, Snake, GameEvent } from '../types';
import { TILE_SIZE, YOPAL_FOODS } from '../constants';
import { GAME_BALANCE } from './balance';

// Import Systems
import { moveSnake } from './systems/movement';
import { updateEntities } from './systems/entities';
import { checkCollisions } from './systems/collision';

export const getRandomSafePosition = (tx: number, ty: number) => {
    const marginX = 1;
    const marginTop = 3; 
    const marginBottom = 1;

    const rangeX = Math.max(1, tx - marginX * 2);
    const rangeY = Math.max(1, ty - marginTop - marginBottom);

    const x = Math.floor(Math.random() * rangeX) + marginX;
    const y = Math.floor(Math.random() * rangeY) + marginTop;
    
    return { x, y };
};

// --- MAIN UPDATE LOOP ---

export const updateGame = (
    state: GameState,
    settings: GameSettings,
    moveP1: boolean,
    moveP2: boolean,
    events: GameEvent[] // Mutate this array to push events
) => {
    const tilesX = Math.floor(state.gridSize.width / TILE_SIZE);
    const tilesY = Math.floor(state.gridSize.height / TILE_SIZE);

    updateWeather(state);

    // Callback used by movement system
    const respawnCallback = (s: GameState, tx: number, ty: number) => respawnFood(s, tx, ty);

    // Move Snakes
    if (moveP1) moveSnake(state.snake1, state, tilesX, tilesY, events, respawnCallback);
    if (state.gameMode === 2 && moveP2) moveSnake(state.snake2, state, tilesX, tilesY, events, respawnCallback);

    // Handle collisions and entities if either moved
    if (moveP1 || moveP2) {
        updateEntities(state, settings, tilesX, tilesY);
        
        const gameOver = checkCollisions(state, settings, events);
        if (gameOver) return;
    }
};

// --- HELPER FUNCTIONS (Kept here or moved to utils in future) ---

const updateWeather = (state: GameState) => {
    const totalScore = state.snake1.score + state.snake2.score;
    const { RAIN_START_CHANCE, RAIN_INCREMENT, RAIN_MAX_INTENSITY, RAIN_STOP_CHANCE, DAY_NIGHT_THRESHOLD_1, DAY_NIGHT_THRESHOLD_2 } = GAME_BALANCE.WEATHER;
    
    // Day/Night Cycle
    if (totalScore < DAY_NIGHT_THRESHOLD_1) state.weather = 'sunny';
    else if (totalScore < DAY_NIGHT_THRESHOLD_2) state.weather = 'sunset';
    else state.weather = 'night';

    // Random Rain (Invierno Mode)
    if (state.weather !== 'night') { 
        if (state.rainIntensity === 0 && Math.random() < RAIN_START_CHANCE) {
            state.rainIntensity = 0.1; 
        } else if (state.rainIntensity > 0) {
            state.rainIntensity += RAIN_INCREMENT;
            if (state.rainIntensity > RAIN_MAX_INTENSITY) state.rainIntensity = RAIN_MAX_INTENSITY; 
            if (state.rainIntensity > 0.5 && Math.random() < RAIN_STOP_CHANCE) {
                state.rainIntensity = 0;
            }
        }
    } else {
        state.rainIntensity = 0;
    }
};

export const respawnFood = (state: GameState, tilesX: number, tilesY: number) => {
    let valid = false;
    const randomFood = YOPAL_FOODS[Math.floor(Math.random() * YOPAL_FOODS.length)];
    while(!valid) {
        const pos = getRandomSafePosition(tilesX, tilesY);
        if(!isOccupied(pos.x, pos.y, state.snake1, state.snake2)) {
            state.chiguiro = {x: pos.x, y: pos.y, active: true, timer: 0, name: randomFood};
            valid = true;
        }
    }
};

// Also exported for initialization.ts usage
export const isOccupied = (x: number, y: number, s1: Snake, s2: Snake) => {
    if (s1.body.some(p => p.x === x && p.y === y)) return true;
    if (s2.body.length > 0 && s2.body.some(p => p.x === x && p.y === y)) return true;
    return false;
};

export const spawnParticles = (state: GameState, x: number, y: number, color: string, count: number = 8) => {
    const px = x * TILE_SIZE + TILE_SIZE / 2;
    const py = y * TILE_SIZE + TILE_SIZE / 2;
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2; 
        state.particles.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: color,
            size: Math.random() * 3 + 2
        });
    }
};
