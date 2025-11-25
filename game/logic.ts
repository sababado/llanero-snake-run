

import { GameState, GameSettings, Snake } from '../types';
import { TILE_SIZE, YOPAL_FOODS, TRANSLATIONS, MAX_IMMUNITY, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../constants';
import { setMusicIntensity } from '../services/audioService';
import { generateNarratorCommentary } from '../services/aiService';

export interface GameCallbacks {
    onScoreUpdate: (s1: number, s2: number) => void;
    onGameOver: (
        score1: number, 
        score2: number, 
        msg: string, 
        context: { score: number, cause: string }, 
        chiguirosEaten: number, 
        winner: 'p1' | 'p2' | 'tie' | null
    ) => void;
    onShowCommentary: (msg: string) => void;
}

const tilesX = Math.floor(LOGICAL_WIDTH / TILE_SIZE);
const tilesY = Math.floor(LOGICAL_HEIGHT / TILE_SIZE);

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
    callbacks: GameCallbacks,
    moveP1: boolean,
    moveP2: boolean
) => {
    updateWeather(state);

    // Move Snakes
    if (moveP1) moveSnake(state.snake1, state, callbacks);
    if (state.gameMode === 2 && moveP2) moveSnake(state.snake2, state, callbacks);

    // Handle collisions and entities if either moved
    if (moveP1 || moveP2) {
        updateEntities(state, settings, tilesX, tilesY);
        
        const gameOver = checkCollisions(state, settings, callbacks);
        if (gameOver) return;
    }
};

// --- HELPER FUNCTIONS ---

const updateWeather = (state: GameState) => {
    const totalScore = state.snake1.score + state.snake2.score;
    
    // Day/Night Cycle
    if (totalScore < 150) state.weather = 'sunny';
    else if (totalScore < 300) state.weather = 'sunset';
    else state.weather = 'night';

    // Random Rain (Invierno Mode)
    if (state.weather !== 'night') { 
        if (state.rainIntensity === 0 && Math.random() < 0.0005) {
            state.rainIntensity = 0.1; 
        } else if (state.rainIntensity > 0) {
            state.rainIntensity += 0.005;
            if (state.rainIntensity > 1.5) state.rainIntensity = 1.5; 
            if (state.rainIntensity > 0.5 && Math.random() < 0.002) {
                state.rainIntensity = 0;
            }
        }
    } else {
        state.rainIntensity = 0;
    }
};

const moveSnake = (snake: Snake, state: GameState, callbacks: GameCallbacks) => {
    if (snake.dead) return;
    if (snake.immunityTimer > 0) snake.immunityTimer--;

    snake.dx = snake.nextDx;
    snake.dy = snake.nextDy;

    let newX = snake.body[0].x + snake.dx;
    let newY = snake.body[0].y + snake.dy;

    // Wrap around
    if (newX < 0) newX = tilesX - 1;
    if (newX >= tilesX) newX = 0;
    if (newY < 0) newY = tilesY - 1;
    if (newY >= tilesY) newY = 0;

    const head = { x: newX, y: newY };
    snake.body.unshift(head);

    handleInteraction(snake, head, state, callbacks);
};

const handleInteraction = (snake: Snake, head: {x: number, y: number}, state: GameState, callbacks: GameCallbacks) => {
    // Chigüiro (Food)
    if (head.x === state.chiguiro.x && head.y === state.chiguiro.y) {
        snake.score += 10;
        state.chiguirosEaten += 1;
        
        if (state.chiguiro.name && !state.sessionEatenItems.includes(state.chiguiro.name)) {
            state.sessionEatenItems.push(state.chiguiro.name);
        }

        callbacks.onScoreUpdate(state.snake1.score, state.snake2.score);
        spawnParticles(state, head.x, head.y, '#795548', 12);

        if (snake.score > state.lastMilestone && snake.score % 50 === 0) {
            state.lastMilestone = snake.score;
            generateNarratorCommentary('milestone', { score: snake.score }).then(msg => {
                if (state.isRunning) callbacks.onShowCommentary(msg);
            });
        }

        setMusicIntensity(state.snake1.score + state.snake2.score);
        respawnFood(state);
    }
    // Aguacate (Bonus)
    else if (state.aguacate.active && head.x === state.aguacate.x && head.y === state.aguacate.y) {
        snake.score += 50;
        state.aguacate.active = false;
        spawnParticles(state, head.x, head.y, '#AED581', 20);
        callbacks.onScoreUpdate(state.snake1.score, state.snake2.score);
        setMusicIntensity(state.snake1.score + state.snake2.score);
        snake.body.pop();
    }
    // Virgen (Relic)
    else if (state.virgen.active && head.x === state.virgen.x && head.y === state.virgen.y) {
        snake.score += 200;
        state.virgen.active = false;
        spawnParticles(state, head.x, head.y, '#FFD700', 30);
        callbacks.onScoreUpdate(state.snake1.score, state.snake2.score);
        setMusicIntensity(state.snake1.score + state.snake2.score);
        generateNarratorCommentary('relic').then(msg => {
                if (state.isRunning) callbacks.onShowCommentary(msg);
        });
        snake.body.pop();
    }
    // Cafe (Powerup)
    else if (state.cafe.active && head.x === state.cafe.x && head.y === state.cafe.y) {
        snake.score += 30;
        state.cafe.active = false;
        snake.immunityTimer = MAX_IMMUNITY; 
        spawnParticles(state, head.x, head.y, '#3E2723', 25); 
        callbacks.onScoreUpdate(state.snake1.score, state.snake2.score);
        callbacks.onShowCommentary("¡Un tintico pa'l alma!");
        snake.body.pop();
    }
    // Bomb (Trap)
    else if (state.bomb.active && head.x === state.bomb.x && head.y === state.bomb.y) {
        if (snake.immunityTimer > 0) {
            state.bomb.active = false;
            spawnParticles(state, head.x, head.y, '#000000', 10);
        } else {
            snake.dead = true;
        }
        snake.body.pop();
    }
    // Bola de Fuego (Trap)
    else if (state.bola.active && head.x === state.bola.x && head.y === state.bola.y) {
        if (snake.immunityTimer === 0) snake.dead = true;
        snake.body.pop();
    }
    else {
        snake.body.pop();
    }
};

const updateEntities = (state: GameState, settings: GameSettings, tx: number, ty: number) => {
    // Bola de Fuego Logic
    if (settings.bombsEnabled) {
        if (!state.bola.active) {
            if (Math.random() < 0.02) {
                state.bola.active = true;
                const pos = getRandomSafePosition(tx, ty);
                state.bola.x = pos.x;
                state.bola.y = pos.y;
            }
        } else {
            state.bola.moveTimer++;
            if (state.bola.moveTimer > 2) {
                state.bola.moveTimer = 0;
                const target = state.snake1.body[0];
                if (target) {
                    if (state.bola.x < target.x) state.bola.x++;
                    else if (state.bola.x > target.x) state.bola.x--;
                    
                    if (state.bola.y < target.y) state.bola.y++;
                    else if (state.bola.y > target.y) state.bola.y--;
                }
                
                const b = state.bola;
                const checkBolaHit = (s: Snake) => {
                    const h = s.body[0];
                    if (h && h.x === b.x && h.y === b.y && s.immunityTimer === 0) s.dead = true;
                };
                checkBolaHit(state.snake1);
                if (state.gameMode === 2) checkBolaHit(state.snake2);
            }
        }
    } else {
        state.bola.active = false;
    }

    // Items Timers & Spawning
    const updateItem = (item: any, chance: number, duration: number) => {
        if (item.active) {
            item.timer--;
            if (item.timer <= 0) item.active = false;
        } else if (Math.random() < chance) {
            let attempts = 0;
            while (attempts < 20) {
                const pos = getRandomSafePosition(tx, ty);
                if(!isOccupied(pos.x, pos.y, state.snake1, state.snake2)) {
                    item.active = true;
                    item.x = pos.x;
                    item.y = pos.y;
                    item.timer = duration;
                    break;
                }
                attempts++;
            }
        }
    };

    updateItem(state.aguacate, 0.01, 60);
    updateItem(state.virgen, 0.002, 200);
    updateItem(state.cafe, 0.005, 150);
};

const checkCollisions = (state: GameState, settings: GameSettings, callbacks: GameCallbacks): boolean => {
    const checkSelf = (snake: Snake) => {
        if (snake.dead || snake.immunityTimer > 0) return;
        const head = snake.body[0];
        for (let i = 1; i < snake.body.length; i++) {
            if (head.x === snake.body[i].x && head.y === snake.body[i].y) snake.dead = true;
        }
    };

    const checkOther = (snake: Snake, other: Snake) => {
        if (snake.dead || snake.immunityTimer > 0 || other.dead || other.body.length === 0) return;
        const head = snake.body[0];
        
        // Head to Head
        if (head.x === other.body[0].x && head.y === other.body[0].y) {
             snake.dead = true;
             other.dead = true;
             return;
        }
        // Head to Body
        for (let part of other.body) {
            if (head.x === part.x && head.y === part.y) {
                snake.dead = true;
                return;
            }
        }
    };

    checkSelf(state.snake1);
    if (state.gameMode === 2) {
        checkSelf(state.snake2);
        checkOther(state.snake1, state.snake2);
        checkOther(state.snake2, state.snake1);
    }

    if ((state.gameMode === 1 && state.snake1.dead) || (state.gameMode === 2 && (state.snake1.dead || state.snake2.dead))) {
        triggerGameOver(state, settings, callbacks);
        return true;
    }
    return false;
};

const respawnFood = (state: GameState) => {
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

const triggerGameOver = (state: GameState, settings: GameSettings, callbacks: GameCallbacks) => {
    state.isRunning = false;
    const t = TRANSLATIONS[settings.language];
    let msg = "";
    let cause = "crashed into wall/self";
    let winner: 'p1' | 'p2' | 'tie' | null = null;

    if (state.gameMode === 1) {
        msg = t.win1P.replace("{score}", state.snake1.score.toString());
        if (state.bola.active && state.snake1.body[0]?.x === state.bola.x && state.snake1.body[0]?.y === state.bola.y) {
            cause = "eaten by 'Bola de Fuego'";
        }
    } else {
        if (state.snake1.dead && state.snake2.dead) {
           msg = t.tie;
           winner = 'tie';
        }
        else if (state.snake1.dead) {
           msg = t.winP2;
           winner = 'p2';
        }
        else {
           msg = t.winP1;
           winner = 'p1';
        }
    }

    callbacks.onGameOver(
      state.snake1.score, 
      state.snake2.score, 
      msg, 
      { score: state.snake1.score, cause },
      state.chiguirosEaten,
      winner
    );
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

export const isOccupied = (x: number, y: number, s1: Snake, s2: Snake) => {
    if (s1.body.some(p => p.x === x && p.y === y)) return true;
    if (s2.body.length > 0 && s2.body.some(p => p.x === x && p.y === y)) return true;
    return false;
};