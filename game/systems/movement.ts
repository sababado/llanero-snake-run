
import { Snake, GameState, GameEvent } from '../../types';
import { GAME_BALANCE } from '../balance';
import { spawnParticles, respawnFood } from '../logic'; // We will refactor logic to export these or move them later
import { NarrationPayload } from '../../types';
import { MAX_IMMUNITY } from '../../constants';

export const moveSnake = (snake: Snake, state: GameState, tilesX: number, tilesY: number, events: GameEvent[], respawnCallback: (s: GameState, x: number, y: number) => void) => {
    if (snake.dead) return;
    if (snake.immunityTimer > 0) snake.immunityTimer--;

    snake.dx = snake.nextDx;
    snake.dy = snake.nextDy;

    let newX = snake.body[0].x + snake.dx;
    let newY = snake.body[0].y + snake.dy;

    // Wrap around using dynamic bounds
    if (newX < 0) newX = tilesX - 1;
    if (newX >= tilesX) newX = 0;
    if (newY < 0) newY = tilesY - 1;
    if (newY >= tilesY) newY = 0;

    const head = { x: newX, y: newY };
    snake.body.unshift(head);

    handleInteraction(snake, head, state, tilesX, tilesY, events, respawnCallback);
};

const handleInteraction = (
    snake: Snake, 
    head: {x: number, y: number}, 
    state: GameState, 
    tilesX: number, 
    tilesY: number, 
    events: GameEvent[],
    respawnCallback: (s: GameState, x: number, y: number) => void
) => {
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
        
        // We need to import spawnParticles or pass it in. For now, we assume logic exports it, 
        // but circular dependency is risky. Ideally, spawnParticles moves to a utils file.
        // For this step, we will emit an event or assume global util availability.
        // To keep it clean, we will implement particle pushing directly here or move spawnParticles to a shared util.
        // Let's implement a lightweight particle pusher here to break dependency.
        pushParticles(state, head.x, head.y, PARTICLES.FOOD_COLOR, PARTICLES.FOOD_COUNT);

        if (snake.score > state.lastMilestone && snake.score % SCORING.MILESTONE_INTERVAL === 0) {
            state.lastMilestone = snake.score;
            events.push({ 
                type: 'NARRATION', 
                payload: { type: 'milestone', context: { score: snake.score } } as NarrationPayload 
            });
        }

        respawnCallback(state, tilesX, tilesY);
    }
    // Aguacate (Bonus)
    else if (state.aguacate.active && head.x === state.aguacate.x && head.y === state.aguacate.y) {
        snake.score += SCORING.AGUACATE;
        state.aguacate.active = false;
        pushParticles(state, head.x, head.y, PARTICLES.BONUS_COLOR, PARTICLES.BONUS_COUNT);
        events.push({ type: 'SCORE_UPDATE', payload: { s1: state.snake1.score, s2: state.snake2.score } });
        events.push({ type: 'MUSIC_INTENSITY', payload: state.snake1.score + state.snake2.score });
        snake.body.pop();
    }
    // Virgen (Relic)
    else if (state.virgen.active && head.x === state.virgen.x && head.y === state.virgen.y) {
        snake.score += SCORING.VIRGEN;
        state.virgen.active = false;
        pushParticles(state, head.x, head.y, PARTICLES.RELIC_COLOR, PARTICLES.RELIC_COUNT);
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
        pushParticles(state, head.x, head.y, PARTICLES.POWERUP_COLOR, PARTICLES.POWERUP_COUNT); 
        events.push({ type: 'SCORE_UPDATE', payload: { s1: state.snake1.score, s2: state.snake2.score } });
        events.push({ type: 'NARRATION', payload: { type: 'powerup', text: "¡Un tintico pa'l alma!" } as NarrationPayload });
        snake.body.pop();
    }
    // Bomb (Trap)
    else if (state.bomb.active && head.x === state.bomb.x && head.y === state.bomb.y) {
        if (snake.immunityTimer > 0) {
            state.bomb.active = false;
            pushParticles(state, head.x, head.y, PARTICLES.TRAP_COLOR, PARTICLES.TRAP_COUNT);
        } else {
            snake.dead = true;
            events.push({ type: 'COLLISION_IMPACT', payload: { x: head.x, y: head.y } });
        }
        snake.body.pop();
    }
    // Bola de Fuego (Trap)
    else if (state.bola.active && head.x === state.bola.x && head.y === state.bola.y) {
        if (snake.immunityTimer === 0) {
            snake.dead = true;
            events.push({ type: 'COLLISION_IMPACT', payload: { x: head.x, y: head.y } });
        }
        snake.body.pop();
    }
    else {
        snake.body.pop();
    }
};

const pushParticles = (state: GameState, x: number, y: number, color: string, count: number) => {
    // We duplicate the particle logic here or import from a utils file. 
    // Ideally, logic.ts exports this, but let's copy to decouple for now.
    // In a full refactor, this goes to game/utils.ts
    const TILE_SIZE = 18; // We could import this but let's keep system mostly pure
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
}
