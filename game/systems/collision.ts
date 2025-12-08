
import { GameState, GameSettings, Snake, GameEvent, GameOverPayload } from '../../types';
import { TRANSLATIONS } from '../../constants';

export const checkCollisions = (state: GameState, settings: GameSettings, events: GameEvent[]): boolean => {
    const checkSelf = (snake: Snake) => {
        if (snake.dead || snake.immunityTimer > 0) return;
        const head = snake.body[0];
        for (let i = 1; i < snake.body.length; i++) {
            if (head.x === snake.body[i].x && head.y === snake.body[i].y) {
                snake.dead = true;
                events.push({ type: 'COLLISION_IMPACT', payload: { x: head.x, y: head.y } });
            }
        }
    };

    const checkOther = (snake: Snake, other: Snake) => {
        if (snake.dead || snake.immunityTimer > 0 || other.dead || other.body.length === 0) return;
        const head = snake.body[0];
        
        // Head to Head
        if (head.x === other.body[0].x && head.y === other.body[0].y) {
             snake.dead = true;
             other.dead = true;
             events.push({ type: 'COLLISION_IMPACT', payload: { x: head.x, y: head.y } });
             return;
        }
        // Head to Body
        for (let part of other.body) {
            if (head.x === part.x && head.y === part.y) {
                snake.dead = true;
                events.push({ type: 'COLLISION_IMPACT', payload: { x: head.x, y: head.y } });
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
