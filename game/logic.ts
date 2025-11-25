

import { GameState, GameSettings, Snake, GameEvent, GameOverPayload, NarrationPayload } from '../types';
import { TILE_SIZE, YOPAL_FOODS, TRANSLATIONS, MAX_IMMUNITY, LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../constants';
import { GAME_BALANCE } from './balance';

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
    moveP1: boolean,
    moveP2: boolean,
    events: GameEvent[] // Mutate this array to push events
) => {
    updateWeather(state);

    // Move Snakes
    if (moveP1) moveSnake(state.snake1, state, events);
    if (state.gameMode === 2 && moveP2) moveSnake(state.snake2, state, events);

    // Handle collisions and entities if either moved
    if (moveP1 || moveP2) {
        updateEntities(state, settings, tilesX, tilesY);
        
        const gameOver = checkCollisions(state, settings, events);
        if (gameOver) return;
    }
};

// --- HELPER FUNCTIONS ---

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

const moveSnake = (snake: Snake, state: GameState, events: GameEvent[]) => {
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

    handleInteraction(snake, head, state, events);
};

const handleInteraction = (snake: Snake, head: {x: number, y: number}, state: GameState, events: GameEvent[]) => {
    const { SCORING, PARTICLES } = GAME_BALANCE;

    // Chigüiro (Food)
    if (head.x === state.chiguiro.x && head.y === state.chiguiro.y) {
        snake.score += SCORING.FOOD;
        state.chiguirosEaten += 1;
        
        if (state.chiguiro.name && !state.sessionEatenItems.includes(state.chiguiro.name)) {
            state.sessionEatenItems.push(state.chiguiro.name);
        }

        events.push({ type: 'SCORE_UPDATE', payload: { s1: state.snake1.score, s2: state.snake2.score } });
        events.push({ type: 'MUSIC_INTENSITY', payload: state.snake1.score + state.snake2.score });
        
        spawnParticles(state, head.x, head.y, PARTICLES.FOOD_COLOR, PARTICLES.FOOD_COUNT);

        if (snake.score > state.lastMilestone && snake.score % SCORING.MILESTONE_INTERVAL === 0) {
            state.lastMilestone = snake.score;
            events.push({ 
                type: 'NARRATION', 
                payload: { type: 'milestone', context: { score: snake.score } } as NarrationPayload 
            });
        }

        respawnFood(state);
    }
    // Aguacate (Bonus)
    else if (state.aguacate.active && head.x === state.aguacate.x && head.y === state.aguacate.y) {
        snake.score += SCORING.AGUACATE;
        state.aguacate.active = false;
        spawnParticles(state, head.x, head.y, PARTICLES.BONUS_COLOR, PARTICLES.BONUS_COUNT);
        events.push({ type: 'SCORE_UPDATE', payload: { s1: state.snake1.score, s2: state.snake2.score } });
        events.push({ type: 'MUSIC_INTENSITY', payload: state.snake1.score + state.snake2.score });
        snake.body.pop();
    }
    // Virgen (Relic)
    else if (state.virgen.active && head.x === state.virgen.x && head.y === state.virgen.y) {
        snake.score += SCORING.VIRGEN;
        state.virgen.active = false;
        spawnParticles(state, head.x, head.y, PARTICLES.RELIC_COLOR, PARTICLES.RELIC_COUNT);
        events.push({ type: 'SCORE_UPDATE', payload: { s1: state.snake1.score, s2: state.snake2.score } });
        events.push({ type: 'MUSIC_INTENSITY', payload: state.snake1.score + state.snake2.score });
        events.push({ type: 'NARRATION', payload: { type: 'relic' } as NarrationPayload });
        snake.body.pop();
    }
    // Cafe (Powerup)
    else if (state.cafe.active && head.x === state.cafe.x && head.y === state.cafe.y) {
        snake.score += SCORING.CAFE;
        state.cafe.active = false;
        snake.immunityTimer = MAX_IMMUNITY; 
        spawnParticles(state, head.x, head.y, PARTICLES.POWERUP_COLOR, PARTICLES.POWERUP_COUNT); 
        events.push({ type: 'SCORE_UPDATE', payload: { s1: state.snake1.score, s2: state.snake2.score } });
        events.push({ type: 'NARRATION', payload: { type: 'powerup', text: "¡Un tintico pa'l alma!" } as NarrationPayload });
        snake.body.pop();
    }
    // Bomb (Trap)
    else if (state.bomb.active && head.x === state.bomb.x && head.y === state.bomb.y) {
        if (snake.immunityTimer > 0) {
            state.bomb.active = false;
            spawnParticles(state, head.x, head.y, PARTICLES.TRAP_COLOR, PARTICLES.TRAP_COUNT);
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
    const { ITEMS } = GAME_BALANCE;

    // Bola de Fuego Logic
    if (settings.bombsEnabled) {
        if (!state.bola.active) {
            if (Math.random() < ITEMS.BOLA.SPAWN_CHANCE) {
                state.bola.active = true;
                const pos = getRandomSafePosition(tx, ty);
                state.bola.x = pos.x;
                state.bola.y = pos.y;
            }
        } else {
            state.bola.moveTimer++;
            if (state.bola.moveTimer > ITEMS.BOLA.MOVE_SPEED_THRESHOLD) {
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

    updateItem(state.aguacate, ITEMS.AGUACATE.CHANCE, ITEMS.AGUACATE.DURATION);
    updateItem(state.virgen, ITEMS.VIRGEN.CHANCE, ITEMS.VIRGEN.DURATION);
    updateItem(state.cafe, ITEMS.CAFE.CHANCE, ITEMS.CAFE.DURATION);
};

const checkCollisions = (state: GameState, settings: GameSettings, events: GameEvent[]): boolean => {
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
        triggerGameOver(state, settings, events);
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

const triggerGameOver = (state: GameState, settings: GameSettings, events: GameEvent[]) => {
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

    const payload: GameOverPayload = {
        score1: state.snake1.score, 
        score2: state.snake2.score, 
        msg, 
        context: { score: state.snake1.score, cause },
        chiguirosEaten: state.chiguirosEaten,
        winner
    };

    events.push({ type: 'GAME_OVER', payload });
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
