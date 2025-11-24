
import { GameState, GameSettings, Snake, Direction } from '../types';
import { TILE_SIZE, YOPAL_FOODS, TRANSLATIONS, MAX_IMMUNITY } from '../constants';
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

export const updateGame = (
    state: GameState,
    settings: GameSettings,
    canvasWidth: number,
    canvasHeight: number,
    callbacks: GameCallbacks,
    moveP1: boolean,
    moveP2: boolean
) => {
    const tilesX = Math.floor(canvasWidth / TILE_SIZE);
    const tilesY = Math.floor(canvasHeight / TILE_SIZE);

    // Move Snakes Logic
    const moveSnake = (snake: Snake) => {
        if (snake.dead) return;
        snake.dx = snake.nextDx;
        snake.dy = snake.nextDy;

        let newX = snake.body[0].x + snake.dx;
        let newY = snake.body[0].y + snake.dy;

        if (newX < 0) newX = tilesX - 1;
        if (newX >= tilesX) newX = 0;
        if (newY < 0) newY = tilesY - 1;
        if (newY >= tilesY) newY = 0;

        const head = { x: newX, y: newY };
        snake.body.unshift(head);

        // Collision Logic
        if (head.x === state.chiguiro.x && head.y === state.chiguiro.y) {
            snake.score += 10;
            state.chiguirosEaten += 1;
            callbacks.onScoreUpdate(state.snake1.score, state.snake2.score);
            
            // Spawn Particles
            spawnParticles(state, head.x, head.y, '#795548', 12);

            // Milestone Commentary
            if (snake.score > state.lastMilestone && snake.score % 50 === 0) {
                state.lastMilestone = snake.score;
                generateNarratorCommentary('milestone', { score: snake.score }).then(msg => {
                    if (state.isRunning) callbacks.onShowCommentary(msg);
                });
            }

            setMusicIntensity(state.snake1.score + state.snake2.score);
            
            // Respawn food
            let valid = false;
            const randomFood = YOPAL_FOODS[Math.floor(Math.random() * YOPAL_FOODS.length)];
            while(!valid) {
                const x = Math.floor(Math.random() * tilesX);
                const y = Math.floor(Math.random() * tilesY);
                if(!isOccupied(x, y, state.snake1, state.snake2)) {
                    state.chiguiro = {x, y, active: true, timer: 0, name: randomFood};
                    valid = true;
                }
            }
        }
        else if (state.aguacate.active && head.x === state.aguacate.x && head.y === state.aguacate.y) {
            snake.score += 50;
            state.aguacate.active = false;
            spawnParticles(state, head.x, head.y, '#AED581', 20);
            callbacks.onScoreUpdate(state.snake1.score, state.snake2.score);
            setMusicIntensity(state.snake1.score + state.snake2.score);
            snake.body.pop();
        }
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
        else if (state.cafe.active && head.x === state.cafe.x && head.y === state.cafe.y) {
            // CAFE POWERUP: Points + Immunity + Speed Boost
            snake.score += 30;
            state.cafe.active = false;
            // Grant extended immunity and speed
            snake.immunityTimer = MAX_IMMUNITY; 
            spawnParticles(state, head.x, head.y, '#3E2723', 25); // Dark Coffee color
            callbacks.onScoreUpdate(state.snake1.score, state.snake2.score);
            
            // Optional commentary for coffee
            callbacks.onShowCommentary("¡Un tintico pa'l alma!");
            
            snake.body.pop();
        }
        else if (state.bomb.active && head.x === state.bomb.x && head.y === state.bomb.y) {
           if (snake.immunityTimer > 0) {
               // Immune: Destroy bomb but don't die
               state.bomb.active = false;
               spawnParticles(state, head.x, head.y, '#000000', 10);
           } else {
               snake.dead = true;
           }
           snake.body.pop();
        }
        else if (state.bola.active && head.x === state.bola.x && head.y === state.bola.y) {
           if (snake.immunityTimer === 0) {
               snake.dead = true;
           }
           snake.body.pop();
        }
        else {
            snake.body.pop();
        }
    };

    // P1 Move
    if (moveP1) {
        if (state.snake1.immunityTimer > 0) state.snake1.immunityTimer--;
        moveSnake(state.snake1);
    }

    // P2 Move
    if (state.gameMode === 2 && moveP2) {
         if (state.snake2.immunityTimer > 0) state.snake2.immunityTimer--;
         moveSnake(state.snake2);
    }

    // Global Events (Bola, Items) - Run if EITHER moved
    if (moveP1 || moveP2) {
        // Update Bola de Fuego
        if (settings.bombsEnabled) {
            if (!state.bola.active) {
            if (Math.random() < 0.02) {
                state.bola.active = true;
                state.bola.x = Math.floor(Math.random() * tilesX);
                state.bola.y = Math.floor(Math.random() * tilesY);
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
                const head1 = state.snake1.body[0];
                if (head1 && head1.x === b.x && head1.y === b.y && state.snake1.immunityTimer === 0) state.snake1.dead = true;
                if (state.gameMode === 2) {
                    const head2 = state.snake2.body[0];
                    if (head2 && head2.x === b.x && head2.y === b.y && state.snake2.immunityTimer === 0) state.snake2.dead = true;
                }
            }
            }
        } else {
        state.bola.active = false;
        }

        // Check Deaths
        checkDeath(state.snake1, state.gameMode === 2 ? state.snake2 : undefined);
        if (state.gameMode === 2) checkDeath(state.snake2, state.snake1);

        if ((state.gameMode === 1 && state.snake1.dead) || (state.gameMode === 2 && (state.snake1.dead || state.snake2.dead))) {
            triggerGameOver(state, settings, callbacks);
            return;
        }

        // Update items (Aguacate)
        if (state.aguacate.active) {
            state.aguacate.timer--;
            if (state.aguacate.timer <= 0) state.aguacate.active = false;
        } else if (Math.random() < 0.01) {
            let attempts = 0;
            while (attempts < 20) {
            const x = Math.floor(Math.random() * tilesX);
            const y = Math.floor(Math.random() * tilesY);
            if(!isOccupied(x,y,state.snake1, state.snake2)) {
                state.aguacate = { active: true, x, y, timer: 60 };
                break;
            }
            attempts++;
            }
        }

        // Update items (Virgen de Manare)
        if (state.virgen.active) {
            state.virgen.timer--;
            if (state.virgen.timer <= 0) state.virgen.active = false;
        } else if (Math.random() < 0.002) {
            let attempts = 0;
            while (attempts < 20) {
            const x = Math.floor(Math.random() * tilesX);
            const y = Math.floor(Math.random() * tilesY);
            if(!isOccupied(x,y,state.snake1, state.snake2)) {
                state.virgen = { active: true, x, y, timer: 200 };
                break;
            }
            attempts++;
            }
        }

        // Update items (Cafe / Tinto)
        if (state.cafe.active) {
            state.cafe.timer--;
            if (state.cafe.timer <= 0) state.cafe.active = false;
        } else if (Math.random() < 0.005) { // Occasional spawn
            let attempts = 0;
            while (attempts < 20) {
            const x = Math.floor(Math.random() * tilesX);
            const y = Math.floor(Math.random() * tilesY);
            if(!isOccupied(x,y,state.snake1, state.snake2)) {
                state.cafe = { active: true, x, y, timer: 150 }; // Lasts a few seconds on screen
                break;
            }
            attempts++;
            }
        }
    }
};

const checkDeath = (snake: Snake, other?: Snake) => {
    if (snake.dead || snake.immunityTimer > 0) return; // Immune snakes don't die
    const head = snake.body[0];
    for (let i = 1; i < snake.body.length; i++) {
        if (head.x === snake.body[i].x && head.y === snake.body[i].y) snake.dead = true;
    }
    if (other && !other.dead && other.body.length > 0) {
        if (head.x === other.body[0].x && head.y === other.body[0].y) {
            snake.dead = true;
            other.dead = true;
        }
        for (let part of other.body) {
            if (head.x === part.x && head.y === part.y) snake.dead = true;
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
        const speed = Math.random() * 3 + 2; // Random speed for burst effect
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
