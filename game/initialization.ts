
import { GameState, GameSettings, Snake, Cloud, Item, BolaDeFuego } from '../types';
import { TILE_SIZE, YOPAL_FOODS } from '../constants';
import { getRandomSafePosition, isOccupied } from './logic';

export const createInitialState = (
    gameMode: 1 | 2, 
    backgroundUrl: string | null,
    isClient: boolean,
    width: number,
    height: number
): GameState => {
    
    // Default Empty State
    const baseState: GameState = {
        snake1: { body: [], dx: 1, dy: 0, nextDx: 1, nextDy: 0, score: 0, colorType: 'orchid', name: 'P1', dead: false, immunityTimer: 0 },
        snake2: { body: [], dx: 1, dy: 0, nextDx: 1, nextDy: 0, score: 0, colorType: 'colombia', name: 'P2', dead: false, immunityTimer: 0 },
        chiguiro: { x: 0, y: 0, active: true, timer: 0, name: YOPAL_FOODS[0] },
        aguacate: { active: false, x: 0, y: 0, timer: 0 },
        virgen: { active: false, x: 0, y: 0, timer: 0 },
        cafe: { active: false, x: 0, y: 0, timer: 0 },
        bomb: { active: false, x: 0, y: 0, timer: 0 },
        bola: { active: false, x: 0, y: 0, moveTimer: 0 },
        clouds: [],
        particles: [],
        gameMode: gameMode,
        isRunning: false,
        winnerMsg: '',
        backgroundUrl: backgroundUrl,
        narratorText: '',
        chiguirosEaten: 0,
        lastMilestone: 0,
        sessionEatenItems: [],
        weather: 'sunny',
        rainIntensity: 0,
        gridSize: { width, height }
    };

    if (isClient) {
        // Clients just need valid objects to prevent crash before first network update
        baseState.snake1.body = [{x: -10, y: -10}];
        baseState.snake2.body = [{x: -10, y: -10}];
        baseState.isRunning = true;
        baseState.gameMode = 2; // Always 2 for MP
        return baseState;
    }

    // --- Host / Local Initialization Logic ---

    const tilesX = Math.floor(width / TILE_SIZE);
    const tilesY = Math.floor(height / TILE_SIZE);

    // 1. Generate Clouds
    const clouds: Cloud[] = [];
    for (let i = 0; i < 5; i++) {
        const cy = Math.random() * (height / 2);
        clouds.push({
            x: Math.random() * width,
            y: cy,
            baseY: cy,
            speed: 0.2 + Math.random() * 0.5,
            size: 30 + Math.random() * 40,
            wobbleOffset: Math.random() * Math.PI * 2
        });
    }

    // 2. Setup Snakes
    let s1: Snake, s2: Snake;

    const centerX = Math.floor(tilesX / 2);
    const centerY = Math.floor(tilesY / 2);

    if (gameMode === 1) {
        // Single Player: Center, moving Right
        s1 = {
            body: [
                {x: centerX, y: centerY},
                {x: centerX - 1, y: centerY},
                {x: centerX - 2, y: centerY}
            ],
            dx: 1, dy: 0, nextDx: 1, nextDy: 0,
            score: 0, colorType: 'colombia', name: "El Llanero", dead: false, immunityTimer: 0
        };
        s2 = { body: [], dx: 0, dy: 0, nextDx: 0, nextDy: 0, score: 0, colorType: 'colombia', name: 'CPU', dead: true, immunityTimer: 0 };
    } else {
        // Multiplayer: Staggered Y positions to avoid head-on collisions
        // This creates two "lanes" so if players don't touch controls, they pass each other safely.
        const p1Y = Math.floor(tilesY / 3);
        const p2Y = Math.floor(tilesY * 2 / 3);

        // P1 (Host/Tricolor): Left side, moving Right
        s1 = {
            body: [
                {x: 3, y: p1Y},
                {x: 2, y: p1Y},
                {x: 1, y: p1Y}
            ],
            dx: 1, dy: 0, nextDx: 1, nextDy: 0,
            score: 0, colorType: 'colombia', name: "Tricolor", dead: false, immunityTimer: 0
        };

        // P2 (Guest/Orquídea): Right side, moving Left
        s2 = {
            body: [
                {x: tilesX - 4, y: p2Y},
                {x: tilesX - 3, y: p2Y},
                {x: tilesX - 2, y: p2Y}
            ],
            dx: -1, dy: 0, nextDx: -1, nextDy: 0,
            score: 0, colorType: 'orchid', name: "Orquídea", dead: false, immunityTimer: 0
        };
    }

    // 3. Initial Food Placement
    const randomFood = YOPAL_FOODS[Math.floor(Math.random() * YOPAL_FOODS.length)];
    let pos = getRandomSafePosition(tilesX, tilesY);
    let chiguiro = { x: pos.x, y: pos.y, active: true, timer: 0, name: randomFood };

    // Ensure not spawning on snakes
    while (isOccupied(chiguiro.x, chiguiro.y, s1, s2)) {
        pos = getRandomSafePosition(tilesX, tilesY);
        chiguiro.x = pos.x;
        chiguiro.y = pos.y;
    }

    return {
        ...baseState,
        snake1: s1,
        snake2: s2,
        chiguiro,
        clouds,
        isRunning: true
    };
};
